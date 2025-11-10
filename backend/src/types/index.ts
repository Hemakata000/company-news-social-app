// Type definitions for the application

export interface NewsArticle {
  id: string;
  title: string;
  highlights: string[];
  sourceUrl: string;
  sourceName: string;
  publishedAt: Date;
}

export interface SocialPost {
  content: string;
  hashtags: string[];
  characterCount: number;
}

export interface SocialMediaContent {
  linkedin: SocialPost[];
  twitter: SocialPost[];
  facebook: SocialPost[];
  instagram: SocialPost[];
}

export interface NewsRequest {
  companyName: string;
  limit?: number;
}

export interface NewsResponse {
  articles: NewsArticle[];
  generatedContent: SocialMediaContent;
  cacheHit: boolean;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  fallback?: {
    data: any;
    source: string;
  };
}