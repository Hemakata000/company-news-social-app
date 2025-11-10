import axios, { AxiosInstance, AxiosError } from 'axios';
import { NewsAPIClient, ProcessedNewsArticle, NewsAPIResponse, NewsServiceError } from './types.js';

export class NewsAPIClientImpl implements NewsAPIClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string, timeoutMs: number = 10000) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: 'https://newsapi.org/v2',
      timeout: timeoutMs,
      headers: {
        'X-API-Key': apiKey,
        'User-Agent': 'CompanyNewsApp/1.0'
      }
    });
  }

  async searchCompanyNews(companyName: string, limit: number = 20): Promise<ProcessedNewsArticle[]> {
    try {
      console.log(`📰 NewsAPI: Searching for "${companyName}" with limit ${limit}`);
      
      const response = await this.client.get<NewsAPIResponse>('/everything', {
        params: {
          q: companyName, // Remove quotes for better results
          sortBy: 'publishedAt',
          language: 'en',
          pageSize: Math.min(limit, 100), // NewsAPI max is 100
          // Remove domains filter for free tier
          // domains: 'reuters.com,bloomberg.com,cnbc.com,marketwatch.com,yahoo.com,techcrunch.com,wsj.com'
        }
      });

      console.log(`📰 NewsAPI: Received ${response.data.articles?.length || 0} articles, status: ${response.data.status}`);

      if (response.data.status !== 'ok') {
        throw new Error(`NewsAPI returned status: ${response.data.status}`);
      }

      const processed = this.processArticles(response.data.articles);
      console.log(`📰 NewsAPI: Processed ${processed.length} valid articles`);
      
      return processed;
    } catch (error) {
      console.error('📰 NewsAPI Error:', error);
      throw this.handleError(error, 'NewsAPI');
    }
  }

  private processArticles(articles: any[]): ProcessedNewsArticle[] {
    return articles
      .filter(article => 
        article.title && 
        article.url && 
        article.source?.name &&
        article.title !== '[Removed]' &&
        !article.title.toLowerCase().includes('removed')
      )
      .map(article => ({
        title: article.title,
        content: article.description || article.content || '',
        url: article.url,
        sourceName: article.source.name,
        publishedAt: new Date(article.publishedAt)
      }));
  }

  private handleError(error: unknown, source: string): NewsServiceError {
    const serviceError = new Error() as NewsServiceError;
    serviceError.source = source;

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        // Server responded with error status
        serviceError.code = `HTTP_${axiosError.response.status}`;
        serviceError.message = `NewsAPI request failed: ${axiosError.response.status} ${axiosError.response.statusText}`;
      } else if (axiosError.request) {
        // Request was made but no response received
        serviceError.code = 'NETWORK_ERROR';
        serviceError.message = 'NewsAPI request failed: Network error or timeout';
      } else {
        // Something else happened
        serviceError.code = 'REQUEST_SETUP_ERROR';
        serviceError.message = `NewsAPI request setup failed: ${axiosError.message}`;
      }
    } else if (error instanceof Error) {
      serviceError.code = 'UNKNOWN_ERROR';
      serviceError.message = `NewsAPI error: ${error.message}`;
    } else {
      serviceError.code = 'UNKNOWN_ERROR';
      serviceError.message = 'NewsAPI: Unknown error occurred';
    }

    serviceError.originalError = error instanceof Error ? error : new Error(String(error));
    return serviceError;
  }
}