import axios, { AxiosInstance, AxiosError } from 'axios';
import { NewsAPIClient, ProcessedNewsArticle, AlphaVantageResponse, NewsServiceError } from './types.js';

export class AlphaVantageClient implements NewsAPIClient {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string, timeoutMs: number = 10000) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: 'https://www.alphavantage.co/query',
      timeout: timeoutMs,
      headers: {
        'User-Agent': 'CompanyNewsApp/1.0'
      }
    });
  }

  async searchCompanyNews(companyName: string, limit: number = 20): Promise<ProcessedNewsArticle[]> {
    try {
      const ticker = this.extractTickerFromCompanyName(companyName);
      console.log(`📊 Alpha Vantage: Searching for "${companyName}" with ticker "${ticker}"`);
      
      // Try with ticker first
      const response = await this.client.get<AlphaVantageResponse>('', {
        params: {
          function: 'NEWS_SENTIMENT',
          tickers: ticker,
          apikey: this.apiKey,
          limit: Math.min(limit, 50), // Use smaller limit for free tier
          sort: 'LATEST'
        }
      });

      console.log(`📊 Alpha Vantage: Response received, feed items: ${response.data.feed?.length || 0}`);

      if (!response.data.feed || response.data.feed.length === 0) {
        console.log(`📊 Alpha Vantage: No feed data for ${companyName}, trying with topics...`);
        // Try with topics using technology sector
        const response2 = await this.client.get<AlphaVantageResponse>('', {
          params: {
            function: 'NEWS_SENTIMENT',
            topics: 'technology',
            apikey: this.apiKey,
            limit: Math.min(limit, 200), // Get more to filter
            sort: 'LATEST'
          }
        });
        
        if (!response2.data.feed || response2.data.feed.length === 0) {
          console.log(`📊 Alpha Vantage: Still no results, returning empty array`);
          return []; // Return empty instead of throwing error
        }
        
        // Filter articles that mention the company
        const relevantArticles = response2.data.feed.filter(article => 
          this.isRelevantToCompany(article, companyName)
        );
        
        console.log(`📊 Alpha Vantage: Found ${relevantArticles.length} relevant articles from ${response2.data.feed.length} total`);
        
        const processed = this.processArticles(relevantArticles, companyName);
        console.log(`📊 Alpha Vantage: Processed ${processed.length} valid articles`);
        return processed.slice(0, limit);
      }

      const processed = this.processArticles(response.data.feed, companyName);
      console.log(`📊 Alpha Vantage: Processed ${processed.length} valid articles`);
      return processed;
    } catch (error) {
      console.error('📊 Alpha Vantage Error:', error);
      // Return empty array instead of throwing to allow NewsAPI results to be used
      return [];
    }
  }

  private extractTickerFromCompanyName(companyName: string): string {
    // Map common company names to tickers
    const tickerMap: Record<string, string> = {
      'apple': 'AAPL',
      'microsoft': 'MSFT',
      'google': 'GOOGL',
      'alphabet': 'GOOGL',
      'amazon': 'AMZN',
      'tesla': 'TSLA',
      'meta': 'META',
      'facebook': 'META',
      'netflix': 'NFLX',
      'nvidia': 'NVDA',
      'accenture': 'ACN',
      'wipro': 'WIT',
      'tcs': 'TCS',
      'tata consultancy': 'TCS',
      'tata consultancy services': 'TCS',
      'infosys': 'INFY',
      'ibm': 'IBM',
      'oracle': 'ORCL',
      'salesforce': 'CRM',
      'cognizant': 'CTSH',
      'hcl': 'HCLTECH.NS',
      'tech mahindra': 'TECHM.NS'
    };
    
    const lowerName = companyName.toLowerCase().trim();
    
    // Check if we have a direct mapping
    for (const [key, ticker] of Object.entries(tickerMap)) {
      if (lowerName.includes(key)) {
        return ticker;
      }
    }
    
    // Fallback: use first letters
    return companyName.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 4);
  }

  private processArticles(articles: any[], companyName: string): ProcessedNewsArticle[] {
    return articles
      .filter(article => 
        article.title && 
        article.url && 
        article.source &&
        this.isRelevantToCompany(article, companyName)
      )
      .map(article => ({
        title: article.title,
        content: article.summary || '',
        url: article.url,
        sourceName: article.source,
        publishedAt: new Date(article.time_published),
        relevanceScore: this.calculateRelevanceScore(article, companyName)
      }))
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  }

  private isRelevantToCompany(article: any, companyName: string): boolean {
    const articleText = `${article.title} ${article.summary}`.toLowerCase();
    
    // Build list of search terms including aliases
    const searchTerms = this.getCompanySearchTerms(companyName);
    
    // Check if any search term appears in the article
    return searchTerms.some(term => articleText.includes(term.toLowerCase()));
  }

  private getCompanySearchTerms(companyName: string): string[] {
    const lowerName = companyName.toLowerCase().trim();
    const terms = [companyName];
    
    // Add aliases for better matching
    const aliasMap: Record<string, string[]> = {
      'tcs': ['TCS', 'Tata Consultancy Services', 'Tata Consultancy'],
      'tata consultancy': ['TCS', 'Tata Consultancy Services'],
      'tata consultancy services': ['TCS', 'Tata Consultancy'],
      'infosys': ['Infosys', 'Infosys Limited'],
      'accenture': ['Accenture', 'Accenture PLC'],
      'wipro': ['Wipro', 'Wipro Limited'],
      'cognizant': ['Cognizant', 'CTSH'],
      'hcl': ['HCL Technologies', 'HCL Tech'],
      'tech mahindra': ['Tech Mahindra', 'TechM']
    };
    
    for (const [key, aliases] of Object.entries(aliasMap)) {
      if (lowerName.includes(key)) {
        terms.push(...aliases);
        break;
      }
    }
    
    return terms;
  }

  private calculateRelevanceScore(article: any, companyName: string): number {
    let score = 0;
    
    // Base score from overall sentiment (if available)
    if (article.overall_sentiment_score) {
      score += Math.abs(article.overall_sentiment_score) * 10;
    }
    
    // Score based on ticker sentiment (if available)
    if (article.ticker_sentiment && Array.isArray(article.ticker_sentiment)) {
      const relevantTickers = article.ticker_sentiment.filter((ticker: any) => 
        ticker.ticker && companyName.toLowerCase().includes(ticker.ticker.toLowerCase())
      );
      
      relevantTickers.forEach((ticker: any) => {
        if (ticker.relevance_score) {
          score += parseFloat(ticker.relevance_score) * 20;
        }
      });
    }
    
    // Score based on title/summary relevance
    const searchTerms = companyName.toLowerCase().split(' ');
    const articleText = `${article.title} ${article.summary}`.toLowerCase();
    
    searchTerms.forEach(term => {
      const occurrences = (articleText.match(new RegExp(term, 'g')) || []).length;
      score += occurrences * 5;
    });
    
    return Math.min(score, 100); // Cap at 100
  }

  private handleError(error: unknown, source: string): NewsServiceError {
    const serviceError = new Error() as NewsServiceError;
    serviceError.source = source;

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        serviceError.code = `HTTP_${axiosError.response.status}`;
        serviceError.message = `Alpha Vantage request failed: ${axiosError.response.status} ${axiosError.response.statusText}`;
      } else if (axiosError.request) {
        serviceError.code = 'NETWORK_ERROR';
        serviceError.message = 'Alpha Vantage request failed: Network error or timeout';
      } else {
        serviceError.code = 'REQUEST_SETUP_ERROR';
        serviceError.message = `Alpha Vantage request setup failed: ${axiosError.message}`;
      }
    } else if (error instanceof Error) {
      serviceError.code = 'UNKNOWN_ERROR';
      serviceError.message = `Alpha Vantage error: ${error.message}`;
    } else {
      serviceError.code = 'UNKNOWN_ERROR';
      serviceError.message = 'Alpha Vantage: Unknown error occurred';
    }

    serviceError.originalError = error instanceof Error ? error : new Error(String(error));
    return serviceError;
  }
}