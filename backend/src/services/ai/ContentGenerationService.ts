import { AIServiceWithFallback, type AIServiceResponse } from './AIServiceWithFallback.js';
import { SocialMediaContentService } from './SocialMediaContentService.js';
import type { 
  NewsHighlight, 
  HighlightExtractionRequest,
  HighlightExtractionResponse,
  SocialContentRequest,
  SocialContentResponse,
  SocialPlatform,
  AIServiceConfig,
  AIServiceError,
  AIServiceHealth
} from './types.js';
import type { ProcessedNewsArticle } from '../news/types.js';

export class ContentGenerationService {
  private aiServiceWithFallback: AIServiceWithFallback;
  private socialMediaService: SocialMediaContentService;

  constructor(config: AIServiceConfig) {
    this.aiServiceWithFallback = new AIServiceWithFallback(config);
    this.socialMediaService = new SocialMediaContentService(config);
  }

  async extractHighlightsFromArticle(article: ProcessedNewsArticle, companyName: string): Promise<NewsHighlight[]> {
    try {
      const request: HighlightExtractionRequest = {
        title: article.title,
        content: article.content || '',
        sourceName: article.sourceName,
        companyName: companyName
      };

      const response = await this.aiServiceWithFallback.extractHighlights(request);
      
      // Validate that we got meaningful highlights
      if (response.data.highlights.length === 0) {
        throw new Error('No highlights extracted from article');
      }

      // Sort by importance (highest first)
      return response.data.highlights.sort((a, b) => b.importance - a.importance);

    } catch (error) {
      if (this.isAIServiceError(error)) {
        throw error;
      }
      
      const aiError = new Error(`Failed to extract highlights: ${error instanceof Error ? error.message : 'Unknown error'}`) as AIServiceError;
      aiError.code = 'HIGHLIGHT_EXTRACTION_FAILED';
      aiError.service = 'content-generation';
      aiError.originalError = error instanceof Error ? error : undefined;
      throw aiError;
    }
  }

  async generateSocialContent(
    highlights: NewsHighlight[], 
    companyName: string, 
    platforms: string[] = ['linkedin'],
    tone: 'professional' | 'casual' | 'enthusiastic' = 'professional'
  ): Promise<SocialContentResponse> {
    const startTime = Date.now();
    
    try {
      if (highlights.length === 0) {
        throw new Error('No highlights provided for social content generation');
      }

      // Validate and convert platforms
      const validPlatforms = this.validatePlatforms(platforms);
      
      // Use the enhanced social media content service
      const response = await this.socialMediaService.generatePlatformSpecificContent(
        highlights,
        companyName,
        validPlatforms,
        tone
      );
      
      // Update processing time
      response.processingTime = Date.now() - startTime;
      
      // Validate that we got content for requested platforms
      if (response.posts.length === 0) {
        throw new Error('No social content generated');
      }

      return response;

    } catch (error) {
      if (this.isAIServiceError(error)) {
        throw error;
      }
      
      const aiError = new Error(`Failed to generate social content: ${error instanceof Error ? error.message : 'Unknown error'}`) as AIServiceError;
      aiError.code = 'SOCIAL_CONTENT_GENERATION_FAILED';
      aiError.service = 'content-generation';
      aiError.originalError = error instanceof Error ? error : undefined;
      throw aiError;
    }
  }

  async processArticleForSocialMedia(
    article: ProcessedNewsArticle, 
    companyName: string,
    platforms: string[] = ['linkedin'],
    tone: 'professional' | 'casual' | 'enthusiastic' = 'professional'
  ): Promise<{ highlights: NewsHighlight[], socialContent: SocialContentResponse }> {
    try {
      // First extract highlights
      const highlights = await this.extractHighlightsFromArticle(article, companyName);
      
      // Then generate social content from highlights
      const socialContent = await this.generateSocialContent(highlights, companyName, platforms, tone);
      
      return {
        highlights,
        socialContent
      };

    } catch (error) {
      if (this.isAIServiceError(error)) {
        throw error;
      }
      
      const aiError = new Error(`Failed to process article for social media: ${error instanceof Error ? error.message : 'Unknown error'}`) as AIServiceError;
      aiError.code = 'ARTICLE_PROCESSING_FAILED';
      aiError.service = 'content-generation';
      aiError.originalError = error instanceof Error ? error : undefined;
      throw aiError;
    }
  }

  async checkServiceHealth(): Promise<AIServiceHealth[]> {
    try {
      return await this.aiServiceWithFallback.checkAllServicesHealth();
    } catch (error) {
      return [{
        service: 'content-generation',
        status: 'unhealthy',
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }];
    }
  }

  async getServiceHealthStatus() {
    return this.aiServiceWithFallback.getServiceHealth();
  }

  resetHealthStatus(): void {
    this.aiServiceWithFallback.resetHealthStatus();
  }

  private validatePlatforms(platforms: string[]): SocialPlatform[] {
    const validPlatforms: SocialPlatform[] = ['linkedin', 'twitter', 'facebook', 'instagram'];
    
    const validated = platforms.filter((platform): platform is SocialPlatform => 
      validPlatforms.includes(platform as SocialPlatform)
    );

    if (validated.length === 0) {
      throw new Error(`No valid platforms provided. Supported platforms: ${validPlatforms.join(', ')}`);
    }

    return validated;
  }

  private isAIServiceError(error: any): error is AIServiceError {
    return error && typeof error === 'object' && 'code' in error && 'service' in error;
  }
}