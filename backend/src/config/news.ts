import './env.js'; // Load environment variables first
import { NewsServiceConfig } from '../services/news/types.js';

export const newsConfig: NewsServiceConfig = {
  newsApiKey: process.env.NEWS_API_KEY,
  alphaVantageApiKey: process.env.ALPHA_VANTAGE_API_KEY,
  maxArticlesPerSource: parseInt(process.env.MAX_ARTICLES_PER_SOURCE || '10'),
  timeoutMs: parseInt(process.env.NEWS_API_TIMEOUT_MS || '10000')
};

export const validateNewsConfig = (): void => {
  if (!newsConfig.newsApiKey && !newsConfig.alphaVantageApiKey) {
    console.warn('Warning: No news API keys configured. News aggregation will not work.');
    console.warn('Please set NEWS_API_KEY and/or ALPHA_VANTAGE_API_KEY environment variables.');
  }
  
  if (newsConfig.maxArticlesPerSource < 1 || newsConfig.maxArticlesPerSource > 100) {
    throw new Error('MAX_ARTICLES_PER_SOURCE must be between 1 and 100');
  }
  
  if (newsConfig.timeoutMs < 1000 || newsConfig.timeoutMs > 60000) {
    throw new Error('NEWS_API_TIMEOUT_MS must be between 1000 and 60000');
  }
};