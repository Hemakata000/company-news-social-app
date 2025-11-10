// Type definitions for the frontend application

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

export interface AppState {
  searchQuery: string;
  newsData: NewsArticle[];
  socialContent: SocialMediaContent;
  loading: boolean;
  error: string | null;
}