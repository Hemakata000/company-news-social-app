// Types for news API integration

export interface RawNewsArticle {
  title: string;
  description?: string;
  content?: string;
  url: string;
  urlToImage?: string;
  publishedAt: string;
  source: {
    id?: string;
    name: string;
  };
}

export interface NewsAPIResponse {
  status: string;
  totalResults: number;
  articles: RawNewsArticle[];
}

export interface AlphaVantageNewsItem {
  title: string;
  url: string;
  time_published: string;
  authors: string[];
  summary: string;
  banner_image?: string;
  source: string;
  category_within_source: string;
  source_domain: string;
  topics: Array<{
    topic: string;
    relevance_score: string;
  }>;
  overall_sentiment_score: number;
  overall_sentiment_label: string;
  ticker_sentiment: Array<{
    ticker: string;
    relevance_score: string;
    ticker_sentiment_score: string;
    ticker_sentiment_label: string;
  }>;
}

export interface AlphaVantageResponse {
  items: string;
  sentiment_score_definition: string;
  relevance_score_definition: string;
  feed: AlphaVantageNewsItem[];
}

export interface ProcessedNewsArticle {
  title: string;
  content: string;
  url: string;
  sourceName: string;
  publishedAt: Date;
  relevanceScore?: number;
}

export interface NewsAPIClient {
  searchCompanyNews(companyName: string, limit?: number): Promise<ProcessedNewsArticle[]>;
}

export interface NewsServiceConfig {
  newsApiKey?: string;
  alphaVantageApiKey?: string;
  maxArticlesPerSource: number;
  timeoutMs: number;
}

export interface NewsServiceError extends Error {
  code: string;
  source: string;
  originalError?: Error;
}