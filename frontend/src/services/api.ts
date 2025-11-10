import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { NewsArticle } from '../types/index.js';

// API Response interfaces
export interface NewsResponse {
  company: {
    id: number;
    name: string;
    aliases?: string[];
    ticker_symbol?: string;
  };
  articles: NewsArticle[];
  stats: {
    articlesWithContent: number;
    totalArticles: number;
    processingTime?: number;
  };
  sources: string[];
  platforms: string[];
  tone: string;
  cached: boolean;
  timestamp: string;
}

export interface ContentGenerationResponse {
  companyName: string;
  platforms: string[];
  tone: string;
  content: Array<{
    platform: string;
    content: string;
    hashtags: string[];
    characterCount: number;
  }>;
  stats: {
    highlightsProcessed: number;
    postsGenerated: number;
    processingTime: number;
  };
  cached: boolean;
  timestamp: string;
}

export interface CompanySearchResponse {
  query: string;
  companies: Array<{
    id: number;
    name: string;
    aliases?: string[];
    ticker_symbol?: string;
  }>;
  count: number;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ApiErrorResponse {
  error: ApiError;
  fallback?: {
    data: any;
    source: string;
  };
}

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

console.log('🔧 API Configuration [LOADED AT ' + new Date().toISOString() + ']:', {
  API_BASE_URL,
  DEV: import.meta.env.DEV
});

class ApiClient {
  private client: AxiosInstance;
  private retryCount: Map<string, number> = new Map();

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: DEFAULT_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: AxiosRequestConfig) => {
        // Add timestamp to prevent caching issues
        if (config.method === 'get') {
          config.params = {
            ...config.params,
            _t: Date.now(),
          };
        }

        // Log request in development
        if (import.meta.env.DEV) {
          console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
            params: config.params,
            data: config.data,
          });
        }

        return config;
      },
      (error: any) => {
        console.error('[API] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log response in development
        if (import.meta.env.DEV) {
          console.log(`[API] Response ${response.status}:`, response.data);
        }

        // Reset retry count on successful response
        const requestKey = this.getRequestKey(response.config);
        this.retryCount.delete(requestKey);

        return response;
      },
      async (error: AxiosError<any>) => {
        const originalRequest = error.config;
        
        if (!originalRequest) {
          return Promise.reject(error);
        }

        const requestKey = this.getRequestKey(originalRequest);
        const currentRetryCount = this.retryCount.get(requestKey) || 0;

        // Check if we should retry
        if (this.shouldRetry(error, currentRetryCount)) {
          this.retryCount.set(requestKey, currentRetryCount + 1);
          
          // Wait before retrying
          await this.delay(RETRY_DELAY * Math.pow(2, currentRetryCount));
          
          console.log(`[API] Retrying request (${currentRetryCount + 1}/${MAX_RETRIES}):`, originalRequest.url);
          
          return this.client(originalRequest);
        }

        // Clean up retry count
        this.retryCount.delete(requestKey);

        // Handle different error types
        const apiError = this.handleError(error);
        console.error('[API] Request failed:', apiError);
        
        return Promise.reject(apiError);
      }
    );
  }

  private getRequestKey(config: AxiosRequestConfig): string {
    return `${config.method}-${config.url}-${JSON.stringify(config.params)}`;
  }

  private shouldRetry(error: AxiosError, retryCount: number): boolean {
    if (retryCount >= MAX_RETRIES) {
      return false;
    }

    // Don't retry on client errors (4xx) except for specific cases
    if (error.response?.status && error.response.status >= 400 && error.response.status < 500) {
      // Retry on rate limiting and timeout
      return error.response.status === 429 || error.response.status === 408;
    }

    // Retry on network errors, server errors (5xx), and timeouts
    return (
      !error.response || // Network error
      error.code === 'ECONNABORTED' || // Timeout
      (error.response.status >= 500) // Server error
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private handleError(error: AxiosError): Error {
    if (error.response?.data) {
      const apiErrorResponse = error.response.data as ApiErrorResponse;
      if (apiErrorResponse.error) {
        const apiError = new Error(apiErrorResponse.error.message);
        (apiError as any).code = apiErrorResponse.error.code;
        (apiError as any).status = error.response.status;
        (apiError as any).details = apiErrorResponse.error.details;
        (apiError as any).fallback = apiErrorResponse.fallback;
        return apiError;
      }
    }

    // Handle network errors
    if (error.code === 'ECONNABORTED') {
      const timeoutError = new Error('Request timeout - please try again');
      (timeoutError as any).code = 'TIMEOUT';
      return timeoutError;
    }

    if (!error.response) {
      const networkError = new Error('Network error - please check your connection');
      (networkError as any).code = 'NETWORK_ERROR';
      return networkError;
    }

    // Generic error
    const genericError = new Error(error.message || 'An unexpected error occurred');
    (genericError as any).code = 'UNKNOWN_ERROR';
    (genericError as any).status = error.response?.status;
    return genericError;
  }

  // Public API methods

  /**
   * Get company news with highlights and social content
   */
  async getCompanyNews(
    companyName: string,
    options: {
      limit?: number;
      platforms?: string[];
      tone?: 'professional' | 'casual' | 'enthusiastic';
      forceRefresh?: boolean;
    } = {}
  ): Promise<NewsResponse> {
    console.log(`🔍 getCompanyNews called for "${companyName}"`);
    console.log('🌐 FORCING REAL API - NO MOCK!');
    console.log('🌐 Using REAL API at:', API_BASE_URL);
    
    const { limit = 10, platforms = ['linkedin'], tone = 'professional', forceRefresh = false } = options;
    
    const params = {
      limit: limit.toString(),
      platforms: platforms.join(','),
      tone,
      forceRefresh: forceRefresh.toString(),
    };

    const url = `/api/news/${encodeURIComponent(companyName)}`;
    console.log('🌐 Fetching from:', `${API_BASE_URL}${url}`);
    
    const response = await this.client.get<NewsResponse>(url, {
      params,
    });

    console.log('✅ Real API response received:', response.data.articles?.length, 'articles');
    return response.data;
  }

  /**
   * Get recent cached articles for a company
   */
  async getRecentNews(companyName: string, limit: number = 10): Promise<NewsResponse> {
    const response = await this.client.get<NewsResponse>(
      `/api/news/${encodeURIComponent(companyName)}/recent`,
      {
        params: { limit: limit.toString() },
      }
    );

    return response.data;
  }

  /**
   * Search for companies
   */
  async searchCompanies(query: string): Promise<CompanySearchResponse> {
    const response = await this.client.get<CompanySearchResponse>('/api/news/search/companies', {
      params: { q: query },
    });

    return response.data;
  }

  /**
   * Generate social media content from custom highlights
   */
  async generateContent(
    highlights: string[],
    companyName: string,
    options: {
      platforms?: string[];
      tone?: 'professional' | 'casual' | 'enthusiastic';
      useCache?: boolean;
    } = {}
  ): Promise<ContentGenerationResponse> {
    const { platforms = ['linkedin'], tone = 'professional', useCache = true } = options;

    const response = await this.client.post<ContentGenerationResponse>('/api/content/generate', {
      highlights,
      companyName,
      platforms,
      tone,
      useCache,
    });

    return response.data;
  }

  /**
   * Regenerate content for a specific article
   */
  async regenerateContent(
    articleId: string,
    companyName: string,
    options: {
      platforms?: string[];
      tone?: 'professional' | 'casual' | 'enthusiastic';
    } = {}
  ): Promise<ContentGenerationResponse> {
    const { platforms = ['linkedin'], tone = 'professional' } = options;

    const response = await this.client.post<ContentGenerationResponse>(
      `/api/content/regenerate/${articleId}`,
      {
        companyName,
        platforms,
        tone,
      }
    );

    return response.data;
  }

  /**
   * Check API health status
   */
  async checkHealth(): Promise<{ status: string; timestamp: string }> {
    const response = await this.client.get('/api/health');
    return response.data;
  }

  /**
   * Check content generation service health
   */
  async checkContentHealth(): Promise<{
    status: string;
    services: Array<{
      name: string;
      status: string;
      responseTime?: number;
      error?: string;
    }>;
    timestamp: string;
  }> {
    const response = await this.client.get('/api/content/health');
    return response.data;
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient();
export default apiClient;