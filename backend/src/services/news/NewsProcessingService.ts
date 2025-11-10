import { ProcessedNewsArticle } from './types.js';
import { NewsArticle, CreateNewsArticleData } from '../../models/types.js';
import { NewsArticleRepository } from '../../models/NewsArticleRepository.js';

export interface FilteredArticle extends ProcessedNewsArticle {
  relevanceScore: number;
  isDuplicate: boolean;
  duplicateOf?: string;
  qualityScore: number;
}

export interface ProcessingResult {
  originalCount: number;
  filteredCount: number;
  duplicatesRemoved: number;
  articles: FilteredArticle[];
  processingTime: number;
}

export interface FilterCriteria {
  minRelevanceScore?: number;
  maxAge?: number; // in hours
  minQualityScore?: number;
  excludeDuplicates?: boolean;
  requiredKeywords?: string[];
  excludedKeywords?: string[];
}

export class NewsProcessingService {
  constructor() {
    // No dependencies needed since we use static repository methods
  }

  async processAndFilterNews(
    articles: ProcessedNewsArticle[],
    companyName: string,
    criteria: FilterCriteria = {}
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    // Set default criteria
    const filterCriteria: Required<FilterCriteria> = {
      minRelevanceScore: criteria.minRelevanceScore ?? 0.3,
      maxAge: criteria.maxAge ?? 168, // 7 days
      minQualityScore: criteria.minQualityScore ?? 0.4,
      excludeDuplicates: criteria.excludeDuplicates ?? true,
      requiredKeywords: criteria.requiredKeywords ?? [],
      excludedKeywords: criteria.excludedKeywords ?? ['obituary', 'death', 'died', 'funeral']
    };

    const originalCount = articles.length;
    
    // Step 1: Calculate relevance scores
    const articlesWithRelevance = articles.map(article => 
      this.calculateRelevanceScore(article, companyName)
    );

    // Step 2: Calculate quality scores
    const articlesWithQuality = articlesWithRelevance.map(article => 
      this.calculateQualityScore(article)
    );

    // Step 3: Detect duplicates
    const articlesWithDuplicates = this.detectDuplicates(articlesWithQuality);

    // Step 4: Apply filters
    const filteredArticles = this.applyFilters(articlesWithDuplicates, filterCriteria);

    // Step 5: Sort by relevance and quality
    const sortedArticles = this.sortArticles(filteredArticles);

    const processingTime = Date.now() - startTime;
    const duplicatesRemoved = articlesWithDuplicates.filter(a => a.isDuplicate).length;

    return {
      originalCount,
      filteredCount: sortedArticles.length,
      duplicatesRemoved,
      articles: sortedArticles,
      processingTime
    };
  }

  private calculateRelevanceScore(article: ProcessedNewsArticle, companyName: string): FilteredArticle {
    let score = article.relevanceScore || 0;
    
    const companyTerms = this.extractCompanyTerms(companyName);
    const articleText = `${article.title} ${article.content}`.toLowerCase();
    
    // Title relevance (higher weight)
    const titleText = article.title.toLowerCase();
    companyTerms.forEach(term => {
      const titleMatches = (titleText.match(new RegExp(`\\b${term}\\b`, 'g')) || []).length;
      score += titleMatches * 15;
    });
    
    // Content relevance
    companyTerms.forEach(term => {
      const contentMatches = (articleText.match(new RegExp(`\\b${term}\\b`, 'g')) || []).length;
      score += contentMatches * 3;
    });
    
    // Exact company name match bonus
    if (articleText.includes(companyName.toLowerCase())) {
      score += 25;
    }
    
    // Source credibility bonus
    const credibleSources = [
      'reuters', 'bloomberg', 'wall street journal', 'financial times',
      'cnbc', 'marketwatch', 'yahoo finance', 'techcrunch', 'forbes'
    ];
    
    if (credibleSources.some(source => 
      article.sourceName.toLowerCase().includes(source)
    )) {
      score += 10;
    }
    
    // Recency bonus
    const hoursOld = (Date.now() - article.publishedAt.getTime()) / (1000 * 60 * 60);
    if (hoursOld < 24) {
      score += 15 * (1 - hoursOld / 24);
    } else if (hoursOld < 72) {
      score += 5 * (1 - (hoursOld - 24) / 48);
    }
    
    // Business relevance keywords
    const businessKeywords = [
      'earnings', 'revenue', 'profit', 'loss', 'merger', 'acquisition',
      'ipo', 'stock', 'shares', 'ceo', 'cfo', 'executive', 'board',
      'investment', 'funding', 'partnership', 'contract', 'deal'
    ];
    
    businessKeywords.forEach(keyword => {
      if (articleText.includes(keyword)) {
        score += 5;
      }
    });
    
    return {
      ...article,
      relevanceScore: Math.min(score, 100), // Cap at 100
      isDuplicate: false,
      qualityScore: 0 // Will be calculated next
    };
  }

  private extractCompanyTerms(companyName: string): string[] {
    const terms = companyName.toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 2)
      .filter(term => !['inc', 'corp', 'ltd', 'llc', 'co', 'the'].includes(term));
    
    return terms;
  }

  private calculateQualityScore(article: FilteredArticle): FilteredArticle {
    let score = 0;
    
    // Title quality
    const titleLength = article.title.length;
    if (titleLength >= 20 && titleLength <= 100) {
      score += 20;
    } else if (titleLength >= 10 && titleLength <= 150) {
      score += 10;
    }
    
    // Content quality
    const contentLength = article.content.length;
    if (contentLength >= 100) {
      score += 20;
    } else if (contentLength >= 50) {
      score += 10;
    }
    
    // Check for spam indicators
    const spamIndicators = [
      /click here/i,
      /free money/i,
      /guaranteed/i,
      /act now/i,
      /limited time/i,
      /\$\$\$/,
      /!!!/
    ];
    
    const hasSpam = spamIndicators.some(pattern => 
      pattern.test(article.title) || pattern.test(article.content)
    );
    
    if (hasSpam) {
      score -= 30;
    }
    
    // Check for proper formatting
    if (article.title.charAt(0) === article.title.charAt(0).toUpperCase()) {
      score += 5;
    }
    
    // URL quality
    if (article.url.startsWith('https://')) {
      score += 5;
    }
    
    // Source name quality
    if (article.sourceName && article.sourceName.length > 3) {
      score += 10;
    }
    
    return {
      ...article,
      qualityScore: Math.max(0, Math.min(score, 100)) / 100 // Normalize to 0-1
    };
  }

  private detectDuplicates(articles: FilteredArticle[]): FilteredArticle[] {
    const processed: FilteredArticle[] = [];
    const titleHashes = new Map<string, number>();
    
    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      const titleHash = this.generateTitleHash(article.title);
      
      let isDuplicate = false;
      let duplicateOf: string | undefined;
      
      // Check for exact title match
      if (titleHashes.has(titleHash)) {
        isDuplicate = true;
        duplicateOf = processed[titleHashes.get(titleHash)!].url;
      } else {
        // Check for similar titles
        for (let j = 0; j < processed.length; j++) {
          const existingArticle = processed[j];
          if (this.areTitlesSimilar(article.title, existingArticle.title)) {
            isDuplicate = true;
            duplicateOf = existingArticle.url;
            break;
          }
        }
      }
      
      if (!isDuplicate) {
        titleHashes.set(titleHash, processed.length);
      }
      
      processed.push({
        ...article,
        isDuplicate,
        duplicateOf
      });
    }
    
    return processed;
  }

  private generateTitleHash(title: string): string {
    // Simple hash based on normalized title
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private areTitlesSimilar(title1: string, title2: string): boolean {
    const normalized1 = this.generateTitleHash(title1);
    const normalized2 = this.generateTitleHash(title2);
    
    // Check if one title is a substring of another
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
      return true;
    }
    
    // Check word overlap
    const words1 = normalized1.split(' ').filter(w => w.length > 3);
    const words2 = normalized2.split(' ').filter(w => w.length > 3);
    
    if (words1.length === 0 || words2.length === 0) {
      return false;
    }
    
    const commonWords = words1.filter(word => words2.includes(word));
    const overlapRatio = commonWords.length / Math.min(words1.length, words2.length);
    
    return overlapRatio > 0.7; // 70% word overlap threshold
  }

  private applyFilters(articles: FilteredArticle[], criteria: Required<FilterCriteria>): FilteredArticle[] {
    return articles.filter(article => {
      // Relevance score filter
      if (article.relevanceScore < criteria.minRelevanceScore * 100) {
        return false;
      }
      
      // Quality score filter
      if (article.qualityScore < criteria.minQualityScore) {
        return false;
      }
      
      // Age filter
      const hoursOld = (Date.now() - article.publishedAt.getTime()) / (1000 * 60 * 60);
      if (hoursOld > criteria.maxAge) {
        return false;
      }
      
      // Duplicate filter
      if (criteria.excludeDuplicates && article.isDuplicate) {
        return false;
      }
      
      // Required keywords filter
      if (criteria.requiredKeywords.length > 0) {
        const articleText = `${article.title} ${article.content}`.toLowerCase();
        const hasRequiredKeyword = criteria.requiredKeywords.some(keyword =>
          articleText.includes(keyword.toLowerCase())
        );
        if (!hasRequiredKeyword) {
          return false;
        }
      }
      
      // Excluded keywords filter
      if (criteria.excludedKeywords.length > 0) {
        const articleText = `${article.title} ${article.content}`.toLowerCase();
        const hasExcludedKeyword = criteria.excludedKeywords.some(keyword =>
          articleText.includes(keyword.toLowerCase())
        );
        if (hasExcludedKeyword) {
          return false;
        }
      }
      
      return true;
    });
  }

  private sortArticles(articles: FilteredArticle[]): FilteredArticle[] {
    return articles.sort((a, b) => {
      // Primary sort: relevance score
      const relevanceDiff = b.relevanceScore - a.relevanceScore;
      if (Math.abs(relevanceDiff) > 5) {
        return relevanceDiff;
      }
      
      // Secondary sort: quality score
      const qualityDiff = b.qualityScore - a.qualityScore;
      if (Math.abs(qualityDiff) > 0.1) {
        return qualityDiff;
      }
      
      // Tertiary sort: publication date (newer first)
      return b.publishedAt.getTime() - a.publishedAt.getTime();
    });
  }

  async transformToNewsArticles(
    filteredArticles: FilteredArticle[],
    companyId: number
  ): Promise<CreateNewsArticleData[]> {
    return filteredArticles.map(article => ({
      company_id: companyId,
      title: article.title,
      content: article.content,
      highlights: [], // Will be populated by AI service later
      source_url: article.url,
      source_name: article.sourceName,
      published_at: article.publishedAt
    }));
  }

  async saveProcessedArticles(
    articles: CreateNewsArticleData[]
  ): Promise<NewsArticle[]> {
    const savedArticles: NewsArticle[] = [];
    
    for (const articleData of articles) {
      try {
        // Check if article already exists
        const existing = await NewsArticleRepository.findBySourceUrl(articleData.source_url);
        if (!existing) {
          const saved = await NewsArticleRepository.create(articleData);
          savedArticles.push(saved);
        } else {
          savedArticles.push(existing);
        }
      } catch (error) {
        console.error('Error saving article:', error);
        // Continue with other articles
      }
    }
    
    return savedArticles;
  }
}