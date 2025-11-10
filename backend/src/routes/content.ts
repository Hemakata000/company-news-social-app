import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { ContentGenerationService } from '../services/ai/ContentGenerationService.js';
import { ContentGenerationServiceFree } from '../services/ai/ContentGenerationServiceFree.js';
import { NewsArticleRepository } from '../models/NewsArticleRepository.js';
import { SocialContentRepository } from '../models/SocialContentRepository.js';
import { CacheService } from '../utils/cache.js';
import { aiConfig, useFreeGenerator } from '../config/ai.js';
import { validateContentRequest } from '../middleware/validation.js';
import { handleApiError } from '../middleware/errorHandler.js';
import type { NewsHighlight } from '../services/ai/types.js';

const router = Router();

// Initialize service - use free generator if no API keys provided
const contentGenerationService = useFreeGenerator 
  ? new ContentGenerationServiceFree()
  : new ContentGenerationService(aiConfig);

// Rate limiting for content generation endpoint
const contentRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 requests per windowMs (more restrictive due to AI costs)
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many content generation requests, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/content/generate - Generate social media content from custom input
router.post('/generate',
  contentRateLimit,
  validateContentRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        highlights,
        companyName,
        platforms = ['linkedin'],
        tone = 'professional',
        useCache = true
      } = req.body;

      // Generate cache key for this specific request
      const cacheKey = `content:${companyName.toLowerCase()}:${JSON.stringify(highlights)}:${platforms.join(',')}:${tone}`;
      
      // Check cache first if enabled
      if (useCache) {
        const cachedResult = await CacheService.get(cacheKey);
        if (cachedResult) {
          return res.json({
            ...cachedResult,
            cached: true,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Generate social media content
      const socialContent = await contentGenerationService.generateSocialContent(
        highlights,
        companyName,
        platforms,
        tone
      );

      const response = {
        companyName,
        platforms,
        tone,
        content: socialContent.posts,
        stats: {
          highlightsProcessed: highlights.length,
          postsGenerated: socialContent.posts.length,
          processingTime: socialContent.processingTime,
        },
        cached: false,
        timestamp: new Date().toISOString(),
      };

      // Cache the response for 30 minutes (longer than news since content is more stable)
      if (useCache) {
        await CacheService.set(cacheKey, response, 30 * 60);
      }

      res.json(response);

    } catch (error) {
      next(error);
    }
  }
);

// POST /api/content/generate/batch - Generate content for multiple articles
router.post('/generate/batch',
  contentRateLimit,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        articleIds,
        companyName,
        platforms = ['linkedin'],
        tone = 'professional',
        useCache = true
      } = req.body;

      // Validate input
      if (!Array.isArray(articleIds) || articleIds.length === 0) {
        return res.status(400).json({
          error: {
            code: 'INVALID_ARTICLE_IDS',
            message: 'articleIds must be a non-empty array',
          },
        });
      }

      if (articleIds.length > 10) {
        return res.status(400).json({
          error: {
            code: 'TOO_MANY_ARTICLES',
            message: 'Maximum 10 articles can be processed in a batch',
          },
        });
      }

      if (!companyName || typeof companyName !== 'string') {
        return res.status(400).json({
          error: {
            code: 'INVALID_COMPANY_NAME',
            message: 'companyName is required and must be a string',
          },
        });
      }

      // Fetch articles from database
      const articles = await Promise.all(
        articleIds.map(id => NewsArticleRepository.findById(id))
      );

      // Filter out null results
      const validArticles = articles.filter(article => article !== null);

      if (validArticles.length === 0) {
        return res.status(404).json({
          error: {
            code: 'NO_ARTICLES_FOUND',
            message: 'No valid articles found for the provided IDs',
          },
        });
      }

      // Process articles in parallel with concurrency limit
      const batchResults = await Promise.allSettled(
        validArticles.map(async (article) => {
          try {
            const cacheKey = `content:article:${article.id}:${platforms.join(',')}:${tone}`;
            
            // Check cache first if enabled
            if (useCache) {
              const cachedResult = await CacheService.get(cacheKey);
              if (cachedResult) {
                return {
                  articleId: article.id,
                  ...cachedResult,
                  cached: true,
                };
              }
            }

            // Convert NewsArticle to ProcessedNewsArticle format
            const processedArticle = {
              title: article.title,
              content: article.content || '',
              url: article.source_url,
              sourceName: article.source_name || 'Unknown',
              publishedAt: article.published_at ? new Date(article.published_at) : new Date(),
            };

            // Generate content for this article
            const result = await contentGenerationService.processArticleForSocialMedia(
              processedArticle,
              companyName,
              platforms,
              tone
            );

            const articleResult = {
              articleId: article.id,
              title: article.title,
              highlights: result.highlights,
              socialContent: result.socialContent.posts,
              processingTime: result.socialContent.processingTime,
              cached: false,
            };

            // Cache individual article result
            if (useCache) {
              await CacheService.set(cacheKey, articleResult, 30 * 60);
            }

            return articleResult;

          } catch (error) {
            console.warn(`Failed to process article ${article.id}:`, error);
            return {
              articleId: article.id,
              title: article.title,
              error: error instanceof Error ? error.message : 'Unknown error',
              highlights: [],
              socialContent: [],
            };
          }
        })
      );

      // Process results
      const successful = batchResults
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);

      const failed = batchResults
        .filter(result => result.status === 'rejected')
        .map((result, index) => ({
          articleId: articleIds[index],
          error: result.reason?.message || 'Processing failed',
        }));

      const response = {
        companyName,
        platforms,
        tone,
        results: successful,
        errors: failed,
        stats: {
          requested: articleIds.length,
          processed: successful.length,
          failed: failed.length,
          totalHighlights: successful.reduce((sum, r) => sum + (r.highlights?.length || 0), 0),
          totalPosts: successful.reduce((sum, r) => sum + (r.socialContent?.length || 0), 0),
        },
        timestamp: new Date().toISOString(),
      };

      res.json(response);

    } catch (error) {
      next(error);
    }
  }
);

// POST /api/content/regenerate/:articleId - Regenerate content for a specific article
router.post('/regenerate/:articleId',
  contentRateLimit,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { articleId } = req.params;
      const {
        companyName,
        platforms = ['linkedin'],
        tone = 'professional'
      } = req.body;

      if (!companyName || typeof companyName !== 'string') {
        return res.status(400).json({
          error: {
            code: 'INVALID_COMPANY_NAME',
            message: 'companyName is required and must be a string',
          },
        });
      }

      // Fetch article from database
      const article = await NewsArticleRepository.findById(parseInt(articleId));
      if (!article) {
        return res.status(404).json({
          error: {
            code: 'ARTICLE_NOT_FOUND',
            message: `Article with ID ${articleId} not found`,
          },
        });
      }

      // Convert NewsArticle to ProcessedNewsArticle format
      const processedArticle = {
        title: article.title,
        content: article.content || '',
        url: article.source_url,
        sourceName: article.source_name || 'Unknown',
        publishedAt: article.published_at ? new Date(article.published_at) : new Date(),
      };

      // Force regeneration (skip cache)
      const result = await contentGenerationService.processArticleForSocialMedia(
        processedArticle,
        companyName,
        platforms,
        tone
      );

      // Save new content to database
      try {
        await Promise.all(
          result.socialContent.posts.map(post =>
            SocialContentRepository.create({
              article_id: article.id,
              platform: post.platform,
              content: post.content,
              hashtags: post.hashtags || [],
            })
          )
        );
      } catch (dbError) {
        console.warn('Failed to save regenerated content to database:', dbError);
        // Continue anyway - the content was generated successfully
      }

      const response = {
        articleId: article.id,
        title: article.title,
        companyName,
        platforms,
        tone,
        highlights: result.highlights,
        socialContent: result.socialContent.posts,
        stats: {
          highlightsGenerated: result.highlights.length,
          postsGenerated: result.socialContent.posts.length,
          processingTime: result.socialContent.processingTime,
        },
        regenerated: true,
        timestamp: new Date().toISOString(),
      };

      res.json(response);

    } catch (error) {
      next(error);
    }
  }
);

// GET /api/content/health - Check content generation service health
router.get('/health',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const healthStatus = await contentGenerationService.checkServiceHealth();
      
      const overallStatus = healthStatus.every(service => service.status === 'healthy') 
        ? 'healthy' 
        : healthStatus.some(service => service.status === 'healthy')
        ? 'degraded'
        : 'unhealthy';

      res.json({
        status: overallStatus,
        services: healthStatus,
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