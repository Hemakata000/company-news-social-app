// Mock API service for frontend-only testing
import { NewsResponse, ContentGenerationResponse, CompanySearchResponse } from './api.js';
import { 
  searchMockCompanies, 
  getMockCompanyNews, 
  getMockSocialContent, 
  simulateApiDelay,
  MOCK_COMPANIES 
} from './mockData.js';

class MockApiClient {
  private isOnline: boolean = true;

  constructor() {
    // Simulate network connectivity
    this.setupNetworkSimulation();
  }

  private setupNetworkSimulation(): void {
    // Simulate occasional network issues for testing
    setInterval(() => {
      // 95% uptime simulation
      this.isOnline = Math.random() > 0.05;
    }, 10000); // Check every 10 seconds
  }

  private async simulateNetworkCall<T>(operation: () => T): Promise<T> {
    // Simulate network delay
    await simulateApiDelay();

    // Simulate network errors occasionally
    if (!this.isOnline) {
      throw new Error('Network error - please check your connection');
    }

    // Simulate random API errors (5% chance)
    if (Math.random() < 0.05) {
      const errors = [
        'Service temporarily unavailable',
        'Rate limit exceeded',
        'Request timeout',
        'Internal server error'
      ];
      throw new Error(errors[Math.floor(Math.random() * errors.length)]);
    }

    return operation();
  }

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
    return this.simulateNetworkCall(() => {
      const { limit = 10, platforms = ['linkedin'], tone = 'professional' } = options;
      
      const articles = getMockCompanyNews(companyName);
      const socialContent = getMockSocialContent(companyName);
      
      if (articles.length === 0) {
        throw new Error(`No recent news found for "${companyName}". Try a different company name.`);
      }

      // Find matching company info
      const matchingCompanies = searchMockCompanies(companyName);
      const company = matchingCompanies[0] || {
        id: 999,
        name: companyName,
        aliases: [],
        ticker_symbol: undefined
      };

      // Transform social content to match API response format
      const transformedArticles = articles.slice(0, limit).map(article => ({
        ...article,
        socialContent: socialContent ? Object.entries(socialContent).map(([platform, posts]) => 
          posts.map(post => ({
            platform,
            content: post.content,
            hashtags: post.hashtags,
            characterCount: post.characterCount
          }))
        ).flat() : []
      }));

      return {
        company,
        articles: transformedArticles,
        stats: {
          articlesWithContent: transformedArticles.length,
          totalArticles: transformedArticles.length,
          processingTime: Math.random() * 2000 + 500 // 500-2500ms
        },
        sources: ['Tech News Daily', 'Financial Times', 'Reuters', 'Business Insider'],
        platforms,
        tone,
        cached: Math.random() > 0.3, // 70% chance of being "cached"
        timestamp: new Date().toISOString()
      };
    });
  }

  /**
   * Get recent cached articles for a company
   */
  async getRecentNews(companyName: string, limit: number = 10): Promise<NewsResponse> {
    // For mock purposes, this is the same as getCompanyNews but marked as cached
    const response = await this.getCompanyNews(companyName, { limit });
    return {
      ...response,
      cached: true
    };
  }

  /**
   * Search for companies
   */
  async searchCompanies(query: string): Promise<CompanySearchResponse> {
    return this.simulateNetworkCall(() => {
      const companies = searchMockCompanies(query);
      
      return {
        query,
        companies,
        count: companies.length,
        timestamp: new Date().toISOString()
      };
    });
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
    return this.simulateNetworkCall(() => {
      const { platforms = ['linkedin'], tone = 'professional' } = options;
      
      // Get existing social content as a base
      const existingSocialContent = getMockSocialContent(companyName);
      
      if (!existingSocialContent) {
        throw new Error(`No content templates available for "${companyName}"`);
      }

      // Generate content for requested platforms
      const content = platforms.map(platform => {
        const platformContent = existingSocialContent[platform as keyof typeof existingSocialContent];
        if (platformContent && platformContent.length > 0) {
          // Use the first post as a template and modify it based on highlights
          const basePost = platformContent[0];
          let generatedContent = basePost.content;
          
          // Simple content generation based on tone
          if (tone === 'casual') {
            generatedContent = generatedContent.replace(/!/g, '! 😊').replace(/\./g, '. 👍');
          } else if (tone === 'enthusiastic') {
            generatedContent = generatedContent.replace(/!/g, '!! 🚀').replace(/\./g, '. ✨');
          }
          
          return {
            platform,
            content: generatedContent,
            hashtags: basePost.hashtags,
            characterCount: generatedContent.length
          };
        }
        
        // Fallback generic content
        return {
          platform,
          content: `Exciting news about ${companyName}! ${highlights[0] || 'Great developments ahead.'} #${companyName.replace(/\s+/g, '')} #Innovation`,
          hashtags: [`#${companyName.replace(/\s+/g, '')}`, '#Innovation', '#Business'],
          characterCount: 100
        };
      });

      return {
        companyName,
        platforms,
        tone,
        content,
        stats: {
          highlightsProcessed: highlights.length,
          postsGenerated: content.length,
          processingTime: Math.random() * 3000 + 1000 // 1-4 seconds
        },
        cached: false,
        timestamp: new Date().toISOString()
      };
    });
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
    // For mock purposes, find the article and use its highlights
    const articles = getMockCompanyNews(companyName);
    const article = articles.find(a => a.id === articleId);
    
    if (!article) {
      throw new Error(`Article ${articleId} not found`);
    }

    return this.generateContent(article.highlights, companyName, {
      ...options,
      useCache: false
    });
  }

  /**
   * Check API health status
   */
  async checkHealth(): Promise<{ status: string; timestamp: string }> {
    await simulateApiDelay(100, 300); // Quick health check
    
    return {
      status: this.isOnline ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString()
    };
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
    await simulateApiDelay(200, 500);
    
    const services = [
      {
        name: 'OpenAI GPT-4',
        status: Math.random() > 0.1 ? 'healthy' : 'degraded',
        responseTime: Math.random() * 2000 + 500
      },
      {
        name: 'Anthropic Claude',
        status: Math.random() > 0.15 ? 'healthy' : 'degraded',
        responseTime: Math.random() * 1500 + 400
      },
      {
        name: 'Content Cache',
        status: 'healthy',
        responseTime: Math.random() * 100 + 50
      }
    ];

    return {
      status: services.every(s => s.status === 'healthy') ? 'healthy' : 'degraded',
      services,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get available companies for testing
   */
  getAvailableCompanies(): string[] {
    return MOCK_COMPANIES.map(company => company.name);
  }

  /**
   * Simulate network status for testing
   */
  setNetworkStatus(online: boolean): void {
    this.isOnline = online;
  }

  /**
   * Get current network status
   */
  getNetworkStatus(): boolean {
    return this.isOnline;
  }
}

// Create and export singleton instance
export const mockApiClient = new MockApiClient();
export default mockApiClient;