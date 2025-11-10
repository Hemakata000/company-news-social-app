// Database model types and interfaces

export interface Company {
  id: number;
  name: string;
  aliases: string[];
  ticker_symbol: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCompanyData {
  name: string;
  aliases?: string[];
  ticker_symbol?: string;
}

export interface NewsArticle {
  id: number;
  company_id: number;
  title: string;
  content: string | null;
  highlights: string[];
  source_url: string;
  source_name: string | null;
  published_at: Date | null;
  fetched_at: Date;
  created_at: Date;
}

export interface CreateNewsArticleData {
  company_id: number;
  title: string;
  content?: string;
  highlights?: string[];
  source_url: string;
  source_name?: string;
  published_at?: Date;
}

export interface SocialContent {
  id: number;
  article_id: number;
  platform: SocialPlatform;
  content: string;
  hashtags: string[];
  character_count: number | null;
  generated_at: Date;
  created_at: Date;
}

export interface CreateSocialContentData {
  article_id: number;
  platform: SocialPlatform;
  content: string;
  hashtags?: string[];
  character_count?: number;
}

export type SocialPlatform = 'linkedin' | 'twitter' | 'facebook' | 'instagram';

// Extended types with relations
export interface NewsArticleWithCompany extends NewsArticle {
  company: Company;
}

export interface NewsArticleWithSocialContent extends NewsArticle {
  social_content: SocialContent[];
}

export interface CompanyWithArticles extends Company {
  articles: NewsArticle[];
}

// Query options
export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface NewsQueryOptions extends PaginationOptions {
  company_id?: number;
  since?: Date;
  until?: Date;
}

export interface SocialContentQueryOptions extends PaginationOptions {
  article_id?: number;
  platform?: SocialPlatform;
}