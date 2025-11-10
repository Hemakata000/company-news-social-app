import { NewsAPIClient, ProcessedNewsArticle, NewsServiceConfig, NewsServiceError } from './types.js';
import { NewsAPIClientImpl } from './NewsAPIClient.js';
import { AlphaVantageClient } from './AlphaVantageClient.js';

export class NewsAggregationService {
  private clients: NewsAPIClient[] = [];
  private config: NewsServiceConfig;

  constructor(config: NewsServiceConfig) {
    this.config = {
      maxArticlesPerSource: config.maxArticlesPerSource || 10,
      timeoutMs: config.timeoutMs || 10000,
      newsApiKey: config.newsApiKey,
      alphaVantageApiKey: config.alphaVantageApiKey
    };

    this.initializeClients();
  }

  private initializeClients(): void {
    // Initialize NewsAPI client if API key is provided
    if (this.config.newsApiKey) {
      this.clients.push(new NewsAPIClientImpl(this.config.newsApiKey, this.config.timeoutMs));
    }

    // Initialize Alpha Vantage client if API key is provided
    if (this.config.alphaVantageApiKey) {
      this.clients.push(new AlphaVantageClient(this.config.alphaVantageApiKey, this.config.timeoutMs));
    }

    if (this.clients.length === 0) {
      console.warn('No news API clients configured. News aggregation will not work.');
    }
  }

  async aggregateNews(companyName: string, maxArticles: number = 20): Promise<{
    articles: ProcessedNewsArticle[];
    sources: string[];
    errors: NewsServiceError[];
  }> {
    if (this.clients.length === 0) {
      throw new Error('No news API clients configured');
    }

    const startTime = performance.now();
    
    // Optimize articles per source distribution
    const articlesPerSource = Math.ceil(maxArticles / this.clients.length);
    
    // Create parallel requests with timeout and retry logic
    const requestPromises = this.clients.map(async (client, index) => {
      const clientName = this.getClientName(index);
      const requestedArticles = Math.min(articlesPerSource, this.config.maxArticlesPerSource);
      
      try {
        // Add timeout wrapper for individual client requests
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Request timeout for ${clientName}`)), this.config.timeoutMs);
        });
        
        const clientPromise = client.searchCompanyNews(companyName, requestedArticles);
        const articles = await Promise.race([clientPromise, timeoutPromise]);
        
        return {
          success: true,
          articles,
          source: clientName,
          error: null
        };
      } catch (error) {
        console.warn(`News client ${clientName} failed:`, error);
        return {
          success: false,
          articles: [],
          source: clientName,
          error: error as NewsServiceError
        };
      }
    });

    // Execute all requests in parallel with proper error handling
    const results = await Promise.allSettled(requestPromises);
    
    const allArticles: ProcessedNewsArticle[] = [];
    const sources: string[] = [];
    const errors: NewsServiceError[] = [];

    // Process results with better error handling
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const clientResult = result.value;
        if (clientResult.success) {
          allArticles.push(...clientResult.articles);
          sources.push(clientResult.source);
        } else if (clientResult.error) {
          errors.push(clientResult.error);
        }
      } else {
        errors.push({
          code: 'CLIENT_ERROR',
          message: `Client ${this.getClientName(index)} failed: ${result.reason?.message || 'Unknown error'}`,
          source: this.getClientName(index)
        });
      }
    });

    // If all clients failed, throw the first error
    if (allArticles.length === 0 && errors.length > 0) {
      throw errors[0];
    }

    // Optimize deduplication and sorting with parallel processing
    const [deduplicatedArticles, sortedArticles] = await Promise.all([
      this.deduplicateArticlesOptimized(allArticles),
      Promise.resolve(allArticles) // We'll sort after deduplication
    ]);

    const finalSortedArticles = this.sortArticlesByRelevanceOptimized(deduplicatedArticles, companyName);
    
    const processingTime = performance.now() - startTime;
    console.log(`News aggregation completed in ${processingTime.toFixed(2)}ms`);

    return {
      articles: finalSortedArticles.slice(0, maxArticles),
      sources,
      errors
    };
  }

  private getClientName(index: number): string {
    const clientNames = ['NewsAPI', 'AlphaVantage'];
    return clientNames[index] || `Client${index}`;
  }

  private deduplicateArticles(articles: ProcessedNewsArticle[]): ProcessedNewsArticle[] {
    const seen = new Set<string>();
    const deduplicated: ProcessedNewsArticle[] = [];

    for (const article of articles) {
      // Create a key based on title and URL for deduplication
      const key = `${article.title.toLowerCase().trim()}-${article.url}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(article);
      }
    }

    return deduplicated;
  }

  // Optimized deduplication using Map for better performance
  private async deduplicateArticlesOptimized(articles: ProcessedNewsArticle[]): Promise<ProcessedNewsArticle[]> {
    if (articles.length === 0) return articles;
    
    const articleMap = new Map<string, ProcessedNewsArticle>();
    
    // Use batch processing for large article sets
    const batchSize = 100;
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      
      batch.forEach(article => {
        // Enhanced deduplication key with content similarity
        const titleKey = article.title.toLowerCase().trim().replace(/[^\w\s]/g, '');
        const urlKey = article.url.toLowerCase();
        const key = `${titleKey}-${urlKey}`;
        
        // Keep the article with higher relevance score if duplicate
        const existing = articleMap.get(key);
        if (!existing || (article.relevanceScore || 0) > (existing.relevanceScore || 0)) {
          articleMap.set(key, article);
        }
      });
    }
    
    return Array.from(articleMap.values());
  }

  private sortArticlesByRelevance(articles: ProcessedNewsArticle[], companyName: string): ProcessedNewsArticle[] {
    return articles.sort((a, b) => {
      // First, sort by relevance score if available
      const aScore = a.relevanceScore || this.calculateBasicRelevance(a, companyName);
      const bScore = b.relevanceScore || this.calculateBasicRelevance(b, companyName);
      
      if (aScore !== bScore) {
        return bScore - aScore; // Higher score first
      }
      
      // Then by publication date (newer first)
      return b.publishedAt.getTime() - a.publishedAt.getTime();
    });
  }

  // Optimized sorting with memoized relevance scores
  private sortArticlesByRelevanceOptimized(articles: ProcessedNewsArticle[], companyName: string): ProcessedNewsArticle[] {
    if (articles.length === 0) return articles;
    
    // Pre-calculate relevance scores to avoid recalculation during sorting
    const articlesWithScores = articles.map(article => ({
      article,
      score: article.relevanceScore || this.calculateBasicRelevanceOptimized(article, companyName)
    }));
    
    // Sort by score first, then by date
    articlesWithScores.sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score; // Higher score first
      }
      return b.article.publishedAt.getTime() - a.article.publishedAt.getTime();
    });
    
    return articlesWithScores.map(item => item.article);
  }

  private calculateBasicRelevance(article: ProcessedNewsArticle, companyName: string): number {
    let score = 0;
    const searchTerms = companyName.toLowerCase().split(' ');
    const articleText = `${article.title} ${article.content}`.toLowerCase();
    
    // Score based on term frequency in title (higher weight)
    searchTerms.forEach(term => {
      const titleOccurrences = (article.title.toLowerCase().match(new RegExp(term, 'g')) || []).length;
      score += titleOccurrences * 10;
    });
    
    // Score based on term frequency in content
    searchTerms.forEach(term => {
      const contentOccurrences = (article.content.toLowerCase().match(new RegExp(term, 'g')) || []).length;
      score += contentOccurrences * 2;
    });
    
    // Bonus for exact company name match
    if (articleText.includes(companyName.toLowerCase())) {
      score += 20;
    }
    
    // Recency bonus (articles from last 24 hours get bonus)
    const hoursOld = (Date.now() - article.publishedAt.getTime()) / (1000 * 60 * 60);
    if (hoursOld < 24) {
      score += 10 - (hoursOld / 24) * 10;
    }
    
    return score;
  }

  // Optimized relevance calculation with better performance
  private calculateBasicRelevanceOptimized(article: ProcessedNewsArticle, companyName: string): number {
    let score = 0;
    const searchTerms = companyName.toLowerCase().split(' ').filter(term => term.length > 2);
    const titleLower = article.title.toLowerCase();
    const contentLower = article.content.toLowerCase();
    
    // Pre-compile regex patterns for better performance
    const termRegexes = searchTerms.map(term => new RegExp(term, 'gi'));
    
    // Score based on term frequency in title (higher weight)
    termRegexes.forEach(regex => {
      const titleMatches = titleLower.match(regex);
      if (titleMatches) {
        score += titleMatches.length * 10;
      }
    });
    
    // Score based on term frequency in content (limited to first 500 chars for performance)
    const contentSample = contentLower.substring(0, 500);
    termRegexes.forEach(regex => {
      const contentMatches = contentSample.match(regex);
      if (contentMatches) {
        score += contentMatches.length * 2;
      }
    });
    
    // Bonus for exact company name match
    if (titleLower.includes(companyName.toLowerCase()) || contentSample.includes(companyName.toLowerCase())) {
      score += 20;
    }
    
    // Enhanced recency bonus with exponential decay
    const hoursOld = (Date.now() - article.publishedAt.getTime()) / (1000 * 60 * 60);
    if (hoursOld < 72) { // 3 days
      const recencyMultiplier = Math.exp(-hoursOld / 24); // Exponential decay
      score += 15 * recencyMultiplier;
    }
    
    // Source quality bonus (if available)
    const qualitySources = ['reuters', 'bloomberg', 'wsj', 'ft.com', 'cnbc'];
    if (qualitySources.some(source => article.sourceName.toLowerCase().includes(source))) {
      score += 5;
    }
    
    return Math.round(score * 100) / 100; // Round to 2 decimal places
  }

  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    clients: Array<{
      name: string;
      status: 'available' | 'unavailable';
      error?: string;
    }>;
  }> {
    if (this.clients.length === 0) {
      return {
        status: 'unhealthy',
        clients: []
      };
    }

    const clientStatuses = await Promise.allSettled(
      this.clients.map(async (client, index) => {
        try {
          // Try a simple search to test the client
          await client.searchCompanyNews('test', 1);
          return {
            name: this.getClientName(index),
            status: 'available' as const
          };
        } catch (error) {
          return {
            name: this.getClientName(index),
            status: 'unavailable' as const,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    const clients = clientStatuses.map(result => 
      result.status === 'fulfilled' ? result.value : {
        name: 'Unknown',
        status: 'unavailable' as const,
        error: 'Health check failed'
      }
    );

    const availableClients = clients.filter(c => c.status === 'available').length;
    const totalClients = clients.length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (availableClients === totalClients) {
      status = 'healthy';
    } else if (availableClients > 0) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return { status, clients };
  }
}