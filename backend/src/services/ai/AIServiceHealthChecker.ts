import type { AIServiceHealth, AIServiceConfig } from './types.js';
import { OpenAIClient } from './OpenAIClient.js';
import { ClaudeClient } from './ClaudeClient.js';

export interface ServiceHealthStatus {
  openai?: AIServiceHealth;
  claude?: AIServiceHealth;
  primaryService: 'openai' | 'claude' | null;
  fallbackService: 'openai' | 'claude' | null;
  lastHealthCheck: Date;
}

export class AIServiceHealthChecker {
  private openaiClient?: OpenAIClient;
  private claudeClient?: ClaudeClient;
  private healthCache: ServiceHealthStatus;
  private healthCheckInterval: number;
  private lastHealthCheck: Date;

  constructor(config: AIServiceConfig, healthCheckInterval: number = 300000) { // 5 minutes default
    this.healthCheckInterval = healthCheckInterval;
    this.lastHealthCheck = new Date(0); // Force initial check
    
    // Initialize available clients
    if (config.openaiApiKey) {
      try {
        this.openaiClient = new OpenAIClient(config);
      } catch (error) {
        console.warn('Failed to initialize OpenAI client:', error instanceof Error ? error.message : 'Unknown error');
      }
    }

    if (config.claudeApiKey) {
      try {
        this.claudeClient = new ClaudeClient(config);
      } catch (error) {
        console.warn('Failed to initialize Claude client:', error instanceof Error ? error.message : 'Unknown error');
      }
    }

    if (!this.openaiClient && !this.claudeClient) {
      throw new Error('At least one AI service must be available (OpenAI or Claude)');
    }

    // Initialize health cache
    this.healthCache = {
      primaryService: null,
      fallbackService: null,
      lastHealthCheck: new Date()
    };
  }

  async getServiceHealth(forceCheck: boolean = false): Promise<ServiceHealthStatus> {
    const now = new Date();
    const timeSinceLastCheck = now.getTime() - this.lastHealthCheck.getTime();

    // Return cached results if recent and not forcing check
    if (!forceCheck && timeSinceLastCheck < this.healthCheckInterval) {
      return this.healthCache;
    }

    // Perform health checks
    const healthPromises: Promise<AIServiceHealth>[] = [];
    const serviceNames: ('openai' | 'claude')[] = [];

    if (this.openaiClient) {
      healthPromises.push(this.openaiClient.checkHealth());
      serviceNames.push('openai');
    }

    if (this.claudeClient) {
      healthPromises.push(this.claudeClient.checkHealth());
      serviceNames.push('claude');
    }

    try {
      const healthResults = await Promise.allSettled(healthPromises);
      
      // Process results
      const newHealthStatus: ServiceHealthStatus = {
        lastHealthCheck: now,
        primaryService: null,
        fallbackService: null
      };

      healthResults.forEach((result, index) => {
        const serviceName = serviceNames[index];
        
        if (result.status === 'fulfilled') {
          newHealthStatus[serviceName] = result.value;
        } else {
          // Create unhealthy status for failed health check
          newHealthStatus[serviceName] = {
            service: serviceName,
            status: 'unhealthy',
            lastChecked: now,
            error: result.reason instanceof Error ? result.reason.message : 'Health check failed'
          };
        }
      });

      // Determine primary and fallback services based on health and preference
      this.determinePrimaryAndFallback(newHealthStatus);

      // Update cache
      this.healthCache = newHealthStatus;
      this.lastHealthCheck = now;

      return newHealthStatus;

    } catch (error) {
      console.error('Error during health check:', error);
      
      // Return cached status with error indication
      return {
        ...this.healthCache,
        lastHealthCheck: now
      };
    }
  }

  async getPrimaryService(): Promise<'openai' | 'claude' | null> {
    const health = await this.getServiceHealth();
    return health.primaryService;
  }

  async getFallbackService(): Promise<'openai' | 'claude' | null> {
    const health = await this.getServiceHealth();
    return health.fallbackService;
  }

  getOpenAIClient(): OpenAIClient | undefined {
    return this.openaiClient;
  }

  getClaudeClient(): ClaudeClient | undefined {
    return this.claudeClient;
  }

  private determinePrimaryAndFallback(healthStatus: ServiceHealthStatus): void {
    const services: Array<{ name: 'openai' | 'claude', health: AIServiceHealth }> = [];
    
    if (healthStatus.openai) {
      services.push({ name: 'openai', health: healthStatus.openai });
    }
    
    if (healthStatus.claude) {
      services.push({ name: 'claude', health: healthStatus.claude });
    }

    // Sort by health status and response time
    services.sort((a, b) => {
      // Healthy services first
      if (a.health.status === 'healthy' && b.health.status !== 'healthy') return -1;
      if (b.health.status === 'healthy' && a.health.status !== 'healthy') return 1;
      
      // If both healthy or both unhealthy, prefer OpenAI (primary choice)
      if (a.name === 'openai' && b.name === 'claude') return -1;
      if (a.name === 'claude' && b.name === 'openai') return 1;
      
      // If same preference, sort by response time
      const aTime = a.health.responseTime || Infinity;
      const bTime = b.health.responseTime || Infinity;
      return aTime - bTime;
    });

    // Assign primary and fallback
    if (services.length > 0) {
      healthStatus.primaryService = services[0].name;
      
      if (services.length > 1) {
        healthStatus.fallbackService = services[1].name;
      }
    }
  }

  // Method to manually mark a service as unhealthy (for use during runtime failures)
  markServiceUnhealthy(service: 'openai' | 'claude', error: string): void {
    if (this.healthCache[service]) {
      this.healthCache[service] = {
        ...this.healthCache[service]!,
        status: 'unhealthy',
        error,
        lastChecked: new Date()
      };
      
      // Re-determine primary/fallback after marking unhealthy
      this.determinePrimaryAndFallback(this.healthCache);
    }
  }

  // Method to reset health status (force next check)
  resetHealthStatus(): void {
    this.lastHealthCheck = new Date(0);
  }
}