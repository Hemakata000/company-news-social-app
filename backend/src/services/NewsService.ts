// Main service that orchestrates news aggregation, company normalization, and processing
import { NewsAggregationService, NewsProcessingService, NewsServiceConfig } from './news/index.js';
import { CompanyNormalizationService } from './company/index.js';
import { CompanyRepository } from '../models/CompanyRepository.js';
import { NewsArticleRepository } from '../models/NewsArticleRepository.js';
import { Company, NewsArticle } from '../models/types.js';

export interface NewsServiceResult {
  company: Company;
  articles: NewsArticle[];
  processingStats: {
    originalCount: number;
    filteredCount: number;
    duplicatesRemoved: number;
    processingTime: number;
  };
  sources: string[];
  errors: any[];
}

export class NewsService {
  private newsAggregationService: NewsAggregationService;
  private newsProcessingService: NewsProcessingService;
  private companyNormalizationService: CompanyNormalizationService;

  constructor(config: NewsServiceConfig) {
    this.newsAggregationService = new NewsAggregationService(config);
    this.newsProcessingService = new NewsProcessingService();
    this.companyNormalizationService = new CompanyNormalizationService();
  }

  async getCompanyNews(
    companyName: string,
    maxArticles: number = 20,
    tickerSymbol?: string
  ): Promise<NewsServiceResult> {
    try {
      // Step 1: Normalize company name and find/create company
      const company = await this.companyNormalizationService.findOrCreateCompany(
        companyName,
        tickerSymbol
      );

      // Step 2: Aggregate news from multiple sources
      const aggregationResult = await this.newsAggregationService.aggregateNews(
        company.name,
        maxArticles
      );

      // Step 3: Process and filter the news articles
      const processingResult = await this.newsProcessingService.processAndFilterNews(
        aggregationResult.articles,
        company.name,
        {
          minRelevanceScore: 0.4,
          maxAge: 72, // 3 days
          minQualityScore: 0.5,
          excludeDuplicates: true
        }
      );

      // Step 4: Transform and save articles to database
      const articleData = await this.newsProcessingService.transformToNewsArticles(
        processingResult.articles,
        company.id
      );

      const savedArticles = await this.newsProcessingService.saveProcessedArticles(articleData);

      return {
        company,
        articles: savedArticles,
        processingStats: {
          originalCount: processingResult.originalCount,
          filteredCount: processingResult.filteredCount,
          duplicatesRemoved: processingResult.duplicatesRemoved,
          processingTime: processingResult.processingTime
        },
        sources: aggregationResult.sources,
        errors: aggregationResult.errors
      };
    } catch (error) {
      console.error('Error in NewsService.getCompanyNews:', error);
      throw error;
    }
  }

  async searchCompanies(query: string): Promise<Company[]> {
    try {
      const normalizationResult = await this.companyNormalizationService.normalizeCompanyName(query);
      
      if (normalizationResult.matches.length > 0) {
        return normalizationResult.matches
          .filter(match => match.confidence > 0.5)
          .map(match => match.company)
          .slice(0, 10);
      }

      return [];
    } catch (error) {
      console.error('Error in NewsService.searchCompanies:', error);
      throw error;
    }
  }

  async getRecentArticles(companyId: number, limit: number = 10): Promise<NewsArticle[]> {
    try {
      return await NewsArticleRepository.findByCompanyId(companyId, { limit });
    } catch (error) {
      console.error('Error in NewsService.getRecentArticles:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: {
      newsAggregation: any;
      database: boolean;
    };
  }> {
    try {
      const [newsHealth, dbHealth] = await Promise.allSettled([
        this.newsAggregationService.healthCheck(),
        this.checkDatabaseHealth()
      ]);

      const newsStatus = newsHealth.status === 'fulfilled' ? newsHealth.value : {
        status: 'unhealthy',
        clients: []
      };

      const dbStatus = dbHealth.status === 'fulfilled' ? dbHealth.value : false;

      let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
      if (newsStatus.status === 'healthy' && dbStatus) {
        overallStatus = 'healthy';
      } else if (newsStatus.status === 'degraded' || dbStatus) {
        overallStatus = 'degraded';
      } else {
        overallStatus = 'unhealthy';
      }

      return {
        status: overallStatus,
        services: {
          newsAggregation: newsStatus,
          database: dbStatus
        }
      };
    } catch (error) {
      console.error('Error in NewsService.healthCheck:', error);
      return {
        status: 'unhealthy',
        services: {
          newsAggregation: { status: 'unhealthy', clients: [] },
          database: false
        }
      };
    }
  }

  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      // Simple database health check
      await CompanyRepository.findAll(1, 0);
      return true;
    } catch (error) {
      return false;
    }
  }
}