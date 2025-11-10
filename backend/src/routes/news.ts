import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { NewsService } from '../services/NewsService.js';
import { ContentGenerationService } from '../services/ai/ContentGenerationService.js';
import { ContentGenerationServiceFree } from '../services/ai/ContentGenerationServiceFree.js';
import { CacheService } from '../utils/cache.js';
import { newsConfig } from '../config/news.js';
import { aiConfig, useFreeGenerator } from '../config/ai.js';
import { validateCompanyName } from '../middleware/validation.js';
import { handleApiError } from '../middleware/errorHandler.js';
import { SimpleHighlightExtractor } from '../utils/simpleHighlightExtractor.js';

const router = Router();

// Initialize services
const newsService = new NewsService(newsConfig);
const contentGenerationService = useFreeGenerator 
  ? new ContentGenerationServiceFree()
  : new ContentGenerationService(aiConfig);

// Rate limiting for news endpoint
const newsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// GET /api/news/:companyName - Get company news with highlights and social content
router.get('/:companyName', 
  newsRateLimit,
  validateCompanyName,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyName } = req.params;
      const { 
        limit = '10', 
        platforms = 'linkedin',
        tone = 'professional',
        forceRefresh = 'false'
      } = req.query;

      const maxArticles = Math.min(parseInt(limit as string) || 10, 50);
      const requestedPlatforms = (platforms as string).split(',').map(p => p.trim());
      const contentTone = tone as 'professional' | 'casual' | 'enthusiastic';
      const skipCache = forceRefresh === 'true';

      // Generate cache key
      const cacheKey = `news:${companyName.toLowerCase()}:${maxArticles}:${platforms}:${tone}`;
      
      // Check cache first (unless force refresh is requested)
      if (!skipCache) {
        const cachedResult = await CacheService.get(cacheKey);
        if (cachedResult) {
          return res.json({
            ...cachedResult,
            cached: true,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Fetch news from service
      const newsResult = await newsService.getCompanyNews(companyName, maxArticles);
      
      if (newsResult.articles.length === 0) {
        return res.status(404).json({
          error: {
            code: 'NO_NEWS_FOUND',
            message: `No recent news found for company: ${companyName}`,
          },
          company: newsResult.company,
          suggestions: await newsService.searchCompanies(companyName),
        });
      }

      // Generate content for articles with highlights
      const articlesWithContent = await Promise.allSettled(
        newsResult.articles.slice(0, 5).map(async (article) => {
          try {
            // Convert NewsArticle to ProcessedNewsArticle format
            const processedArticle = {
              title: article.title,
              content: article.content || '',
              url: article.source_url,
              sourceName: article.source_name || 'Unknown',
              publishedAt: article.published_at ? new Date(article.published_at) : new Date(),
            };

            const result = await contentGenerationService.processArticleForSocialMedia(
              processedArticle,
              newsResult.company.name,
              requestedPlatforms,
              contentTone
            );
            
            return {
              ...article,
              highlights: result.highlights,
              socialContent: result.socialContent.posts,
            };
          } catch (error) {
            console.warn(`Failed to generate content for article ${article.id}:`, error);
            // Use simple highlight extractor as fallback
            const fallbackHighlights = SimpleHighlightExtractor.extractFromArticle(
              article.title,
              article.content || ''
            );
            return {
              ...article,
              highlights: fallbackHighlights,
              socialContent: [],
              contentError: 'Failed to generate social content',
            };
          }
        })
      );

      // Process results and separate successful from failed
      const processedArticles = articlesWithContent.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          // Use simple highlight extractor as fallback
          const article = newsResult.articles[index];
          const fallbackHighlights = SimpleHighlightExtractor.extractFromArticle(
            article.title,
            article.content || ''
          );
          return {
            ...article,
            highlights: fallbackHighlights,
            socialContent: [],
            contentError: 'Content generation failed',
          };
        }
      });

      // Include remaining articles without content generation
      const remainingArticles = newsResult.articles.slice(5).map(article => ({
        ...article,
        highlights: [],
        socialContent: [],
      }));

      const response = {
        company: newsResult.company,
        articles: [...processedArticles, ...remainingArticles],
        stats: {
          ...newsResult.processingStats,
          articlesWithContent: processedArticles.filter(a => a.highlights.length > 0).length,
          totalArticles: newsResult.articles.length,
        },
        sources: newsResult.sources,
        platforms: requestedPlatforms,
        tone: contentTone,
        cached: false,
        timestamp: new Date().toISOString(),
      };

      // Cache the response for 15 minutes
      await CacheService.set(cacheKey, response, 15 * 60);

      res.json(response);

    } catch (error) {
      next(error);
    }
  }
);

// GET /api/news/:companyName/recent - Get recent cached articles only
router.get('/:companyName/recent',
  newsRateLimit,
  validateCompanyName,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyName } = req.params;
      const { limit = '10' } = req.query;
      const maxArticles = Math.min(parseInt(limit as string) || 10, 50);

      // Try to find company first
      const companies = await newsService.searchCompanies(companyName);
      if (companies.length === 0) {
        return res.status(404).json({
          error: {
            code: 'COMPANY_NOT_FOUND',
            message: `Company not found: ${companyName}`,
          },
        });
      }

      const company = companies[0];
      const articles = await newsService.getRecentArticles(company.id, maxArticles);

      res.json({
        company,
        articles,
        cached: true,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      next(error);
    }
  }
);

// GET /api/news/search/companies - Search for companies
router.get('/search/companies',
  newsRateLimit,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { q: query } = req.query;

      if (!query || typeof query !== 'string' || query.trim().length < 2) {
        return res.status(400).json({
          error: {
            code: 'INVALID_QUERY',
            message: 'Query parameter "q" is required and must be at least 2 characters long',
          },
        });
      }

      const companies = await newsService.searchCompanies(query.trim());

      res.json({
        query: query.trim(),
        companies,
        count: companies.length,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      next(error);
    }
  }
);

// Error handling middleware for this router
router.use(handleApiError);

export default router;