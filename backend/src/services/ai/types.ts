// Types for AI content generation services

export interface NewsHighlight {
  text: string;
  importance: number; // 1-5 scale
  category: 'financial' | 'operational' | 'strategic' | 'market' | 'general';
}

export interface HighlightExtractionRequest {
  title: string;
  content: string;
  sourceName: string;
  companyName: string;
}

export interface HighlightExtractionResponse {
  highlights: NewsHighlight[];
  processingTime: number;
  model: string;
}

export interface SocialMediaPost {
  content: string;
  hashtags: string[];
  characterCount: number;
  platform: SocialPlatform;
}

export type SocialPlatform = 'linkedin' | 'twitter' | 'facebook' | 'instagram';

export interface SocialContentRequest {
  highlights: NewsHighlight[];
  companyName: string;
  platforms: SocialPlatform[];
  tone?: 'professional' | 'casual' | 'enthusiastic';
}

export interface SocialContentResponse {
  posts: SocialMediaPost[];
  processingTime: number;
  model: string;
}

export interface AIServiceConfig {
  openaiApiKey?: string;
  claudeApiKey?: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
}

export interface AIServiceError extends Error {
  code: string;
  service: string;
  originalError?: Error;
}

export interface AIServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  lastChecked: Date;
  error?: string;
}