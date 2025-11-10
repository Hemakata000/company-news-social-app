// AI Service Exports
export { OpenAIClient } from './OpenAIClient.js';
export { ClaudeClient } from './ClaudeClient.js';
export { AIServiceWithFallback } from './AIServiceWithFallback.js';
export { AIServiceHealthChecker } from './AIServiceHealthChecker.js';
export { ContentQualityValidator } from './ContentQualityValidator.js';
export { ContentGenerationService } from './ContentGenerationService.js';
export { SocialMediaContentService } from './SocialMediaContentService.js';

// Type exports
export type {
  NewsHighlight,
  HighlightExtractionRequest,
  HighlightExtractionResponse,
  SocialMediaPost,
  SocialPlatform,
  SocialContentRequest,
  SocialContentResponse,
  AIServiceConfig,
  AIServiceError,
  AIServiceHealth
} from './types.js';

export type {
  FallbackAttempt,
  AIServiceResponse
} from './AIServiceWithFallback.js';

export type {
  ServiceHealthStatus
} from './AIServiceHealthChecker.js';

export type {
  ContentQualityScore,
  HighlightQualityScore,
  SocialContentQualityScore
} from './ContentQualityValidator.js';