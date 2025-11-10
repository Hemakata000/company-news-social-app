import type { 
  HighlightExtractionRequest, 
  HighlightExtractionResponse, 
  SocialContentRequest,
  SocialContentResponse,
  AIServiceConfig,
  AIServiceError,
  AIServiceHealth
} from './types.js';
import { AIServiceHealthChecker, type ServiceHealthStatus } from './AIServiceHealthChecker.js';
import { ContentQualityValidator, type HighlightQualityScore, type SocialContentQualityScore } from './ContentQualityValidator.js';

export interface FallbackAttempt {
  service: 'openai' | 'claude';
  success: boolean;
  error?: string;
  qualityScore?: number;
  processingTime: number;
}

export interface AIServiceResponse<T> {
  data: T;
  primaryAttempt: FallbackAttempt;
  fallbackAttempt?: FallbackAttempt;
  finalQualityScore: number;
  totalProcessingTime: number;
}

export class AIServiceWithFallback {
  private healthChecker: AIServiceHealthChecker;
  private config: AIServiceConfig;
  private maxRetries: number;
  private qualityThreshold: number;

  constructor(config: AIServiceConfig, maxRetries: number = 2, qualityThreshold: number = 60) {
    this.config = config;
    this.maxRetries = maxRetries;
    this.qualityThreshold = qualityThreshold;
    this.healthChecker = new AIServiceHealthChecker(config);
  }

  async extractHighlights(request: HighlightExtractionRequest): Promise<AIServiceResponse<HighlightExtractionResponse>> {
    const startTime = Date.now();
    const attempts: FallbackAttempt[] = [];

    // Get service health and determine order
    const healthStatus = await this.healthChecker.getServiceHealth();
    const serviceOrder = this.getServiceOrder(healthStatus);

    let lastError: AIServiceError | null = null;
    let bestResult: { response: HighlightExtractionResponse; qualityScore: number } | null = null;

    // Try each service in order
    for (const serviceName of serviceOrder) {
      const attemptStartTime = Date.now();
      
      try {
        const client = serviceName === 'openai' 
          ? this.healthChecker.getOpenAIClient()
          : this.healthChecker.getClaudeClient();

        if (!client) {
          throw new Error(`${serviceName} client not available`);
        }

        const response = await client.extractHighlights(request);
        const processingTime = Date.now() - attemptStartTime;

        // Validate content quality
        const qualityScore = ContentQualityValidator.validateHighlights(
          response.highlights, 
          request.companyName
        );

        const attempt: FallbackAttempt = {
          service: serviceName,
          success: true,
          qualityScore: qualityScore.score,
          processingTime
        };

        attempts.push(attempt);

        // If quality is acceptable, use this result
        if (qualityScore.isAcceptable) {
          bestResult = { response, qualityScore: qualityScore.score };
          break;
        }

        // If this is better than previous attempts, keep it as backup
        if (!bestResult || qualityScore.score > bestResult.qualityScore) {
          bestResult = { response, qualityScore: qualityScore.score };
        }

      } catch (error) {
        const processingTime = Date.now() - attemptStartTime;
        
        const attempt: FallbackAttempt = {
          service: serviceName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          processingTime
        };

        attempts.push(attempt);
        lastError = this.isAIServiceError(error) ? error : this.createFallbackError(error, serviceName);

        // Mark service as unhealthy for future requests
        this.healthChecker.markServiceUnhealthy(serviceName, attempt.error!);
      }
    }

    // If we have any result, return it
    if (bestResult) {
      return {
        data: bestResult.response,
        primaryAttempt: attempts[0],
        fallbackAttempt: attempts[1],
        finalQualityScore: bestResult.qualityScore,
        totalProcessingTime: Date.now() - startTime
      };
    }

    // If no results, throw the last error
    throw lastError || new Error('All AI services failed to extract highlights');
  }

  async generateSocialContent(request: SocialContentRequest): Promise<AIServiceResponse<SocialContentResponse>> {
    const startTime = Date.now();
    const attempts: FallbackAttempt[] = [];

    // Get service health and determine order
    const healthStatus = await this.healthChecker.getServiceHealth();
    const serviceOrder = this.getServiceOrder(healthStatus);

    let lastError: AIServiceError | null = null;
    let bestResult: { response: SocialContentResponse; qualityScore: number } | null = null;

    // Try each service in order
    for (const serviceName of serviceOrder) {
      const attemptStartTime = Date.now();
      
      try {
        const client = serviceName === 'openai' 
          ? this.healthChecker.getOpenAIClient()
          : this.healthChecker.getClaudeClient();

        if (!client) {
          throw new Error(`${serviceName} client not available`);
        }

        const response = await client.generateSocialContent(request);
        const processingTime = Date.now() - attemptStartTime;

        // Validate content quality
        const qualityScore = ContentQualityValidator.validateSocialContent(
          response, 
          request.platforms,
          request.companyName
        );

        const attempt: FallbackAttempt = {
          service: serviceName,
          success: true,
          qualityScore: qualityScore.score,
          processingTime
        };

        attempts.push(attempt);

        // If quality is acceptable, use this result
        if (qualityScore.isAcceptable) {
          bestResult = { response, qualityScore: qualityScore.score };
          break;
        }

        // If this is better than previous attempts, keep it as backup
        if (!bestResult || qualityScore.score > bestResult.qualityScore) {
          bestResult = { response, qualityScore: qualityScore.score };
        }

      } catch (error) {
        const processingTime = Date.now() - attemptStartTime;
        
        const attempt: FallbackAttempt = {
          service: serviceName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          processingTime
        };

        attempts.push(attempt);
        lastError = this.isAIServiceError(error) ? error : this.createFallbackError(error, serviceName);

        // Mark service as unhealthy for future requests
        this.healthChecker.markServiceUnhealthy(serviceName, attempt.error!);
      }
    }

    // If we have any result, return it
    if (bestResult) {
      return {
        data: bestResult.response,
        primaryAttempt: attempts[0],
        fallbackAttempt: attempts[1],
        finalQualityScore: bestResult.qualityScore,
        totalProcessingTime: Date.now() - startTime
      };
    }

    // If no results, throw the last error
    throw lastError || new Error('All AI services failed to generate social content');
  }

  async getServiceHealth(forceCheck: boolean = false): Promise<ServiceHealthStatus> {
    return this.healthChecker.getServiceHealth(forceCheck);
  }

  async checkAllServicesHealth(): Promise<AIServiceHealth[]> {
    const healthStatus = await this.healthChecker.getServiceHealth(true);
    const results: AIServiceHealth[] = [];

    if (healthStatus.openai) {
      results.push(healthStatus.openai);
    }

    if (healthStatus.claude) {
      results.push(healthStatus.claude);
    }

    return results;
  }

  resetHealthStatus(): void {
    this.healthChecker.resetHealthStatus();
  }

  private getServiceOrder(healthStatus: ServiceHealthStatus): ('openai' | 'claude')[] {
    const order: ('openai' | 'claude')[] = [];

    // Add primary service first
    if (healthStatus.primaryService) {
      order.push(healthStatus.primaryService);
    }

    // Add fallback service second
    if (healthStatus.fallbackService && !order.includes(healthStatus.fallbackService)) {
      order.push(healthStatus.fallbackService);
    }

    // If no services determined from health check, use default order
    if (order.length === 0) {
      if (this.healthChecker.getOpenAIClient()) order.push('openai');
      if (this.healthChecker.getClaudeClient()) order.push('claude');
    }

    return order;
  }

  private isAIServiceError(error: any): error is AIServiceError {
    return error && typeof error === 'object' && 'code' in error && 'service' in error;
  }

  private createFallbackError(error: any, service: string): AIServiceError {
    const fallbackError = new Error(
      `${service} service failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    ) as AIServiceError;
    
    fallbackError.code = 'FALLBACK_SERVICE_ERROR';
    fallbackError.service = service;
    fallbackError.originalError = error instanceof Error ? error : undefined;
    
    return fallbackError;
  }
}