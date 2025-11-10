import { getRedisClient } from '../config/redis.js';

// Cache key prefixes for different data types
export const CACHE_PREFIXES = {
  NEWS: 'news',
  COMPANY: 'company',
  SOCIAL_CONTENT: 'social',
  API_RESPONSE: 'api',
} as const;

// Default TTL values (in seconds)
export const DEFAULT_TTL = {
  NEWS_ARTICLES: 15 * 60, // 15 minutes
  COMPANY_DATA: 60 * 60, // 1 hour
  SOCIAL_CONTENT: 30 * 60, // 30 minutes
  API_RESPONSE: 10 * 60, // 10 minutes
} as const;

// Cache key generation strategies
export class CacheKeyGenerator {
  static newsArticles(companyName: string): string {
    return `${CACHE_PREFIXES.NEWS}:articles:${companyName.toLowerCase().replace(/\s+/g, '_')}`;
  }

  static companyData(companyName: string): string {
    return `${CACHE_PREFIXES.COMPANY}:data:${companyName.toLowerCase().replace(/\s+/g, '_')}`;
  }

  static socialContent(articleId: number, platform?: string): string {
    const base = `${CACHE_PREFIXES.SOCIAL_CONTENT}:article:${articleId}`;
    return platform ? `${base}:${platform}` : base;
  }

  static apiResponse(endpoint: string, params: Record<string, any> = {}): string {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|');
    
    return `${CACHE_PREFIXES.API_RESPONSE}:${endpoint}:${paramString}`;
  }

  static newsSearch(query: string): string {
    return `${CACHE_PREFIXES.NEWS}:search:${query.toLowerCase().replace(/\s+/g, '_')}`;
  }
}

// Cache utility class
export class CacheService {
  private static client = getRedisClient;

  // Generic get method
  static async get<T>(key: string): Promise<T | null> {
    try {
      const client = this.client();
      const value = await client.get(key);
      
      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  // Generic set method
  static async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    try {
      const client = this.client();
      const serializedValue = JSON.stringify(value);
      
      if (ttlSeconds) {
        await client.setEx(key, ttlSeconds, serializedValue);
      } else {
        await client.set(key, serializedValue);
      }
      
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  // Delete a key
  static async delete(key: string): Promise<boolean> {
    try {
      const client = this.client();
      const result = await client.del(key);
      return result > 0;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  // Check if key exists
  static async exists(key: string): Promise<boolean> {
    try {
      const client = this.client();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  // Get TTL for a key
  static async getTTL(key: string): Promise<number> {
    try {
      const client = this.client();
      return await client.ttl(key);
    } catch (error) {
      console.error(`Cache TTL error for key ${key}:`, error);
      return -1;
    }
  }

  // Set expiration for existing key
  static async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      const client = this.client();
      const result = await client.expire(key, ttlSeconds);
      return result === 1;
    } catch (error) {
      console.error(`Cache expire error for key ${key}:`, error);
      return false;
    }
  }

  // Get multiple keys at once
  static async getMultiple<T>(keys: string[]): Promise<(T | null)[]> {
    try {
      const client = this.client();
      const values = await client.mGet(keys);
      
      return values.map(value => {
        if (!value) return null;
        try {
          return JSON.parse(value) as T;
        } catch {
          return null;
        }
      });
    } catch (error) {
      console.error(`Cache getMultiple error:`, error);
      return keys.map(() => null);
    }
  }

  // Set multiple key-value pairs
  static async setMultiple<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<boolean> {
    try {
      const client = this.client();
      
      // Use pipeline for better performance
      const pipeline = client.multi();
      
      for (const entry of entries) {
        const serializedValue = JSON.stringify(entry.value);
        if (entry.ttl) {
          pipeline.setEx(entry.key, entry.ttl, serializedValue);
        } else {
          pipeline.set(entry.key, serializedValue);
        }
      }
      
      await pipeline.exec();
      return true;
    } catch (error) {
      console.error(`Cache setMultiple error:`, error);
      return false;
    }
  }

  // Clear all keys with a specific prefix
  static async clearByPrefix(prefix: string): Promise<number> {
    try {
      const client = this.client();
      const keys = await client.keys(`${prefix}:*`);
      
      if (keys.length === 0) {
        return 0;
      }
      
      return await client.del(keys);
    } catch (error) {
      console.error(`Cache clearByPrefix error for prefix ${prefix}:`, error);
      return 0;
    }
  }

  // Get cache statistics
  static async getStats(): Promise<{
    totalKeys: number;
    memoryUsage: string;
    hitRate?: number;
  }> {
    try {
      const client = this.client();
      const info = await client.info('memory');
      const keyspace = await client.info('keyspace');
      
      // Parse memory usage
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1] : 'Unknown';
      
      // Count total keys
      const keys = await client.keys('*');
      const totalKeys = keys.length;
      
      return {
        totalKeys,
        memoryUsage,
      };
    } catch (error) {
      console.error('Cache stats error:', error);
      return {
        totalKeys: 0,
        memoryUsage: 'Unknown',
      };
    }
  }

  // Flush all cache data (use with caution)
  static async flushAll(): Promise<boolean> {
    try {
      const client = this.client();
      await client.flushAll();
      console.log('⚠️  All cache data flushed');
      return true;
    } catch (error) {
      console.error('Cache flushAll error:', error);
      return false;
    }
  }
}

// Enhanced cache with adaptive TTL and cache warming
export class AdaptiveCacheService extends CacheService {
  // Cache with adaptive TTL based on access patterns
  static async setWithAdaptiveTTL<T>(
    key: string, 
    value: T, 
    baseTTL: number,
    accessCount: number = 0
  ): Promise<boolean> {
    // Increase TTL for frequently accessed items
    const adaptiveTTL = baseTTL + Math.min(accessCount * 60, baseTTL * 2);
    return this.set(key, value, adaptiveTTL);
  }

  // Get with access tracking
  static async getWithTracking<T>(key: string): Promise<T | null> {
    const value = await this.get<T>(key);
    if (value) {
      // Track access for adaptive TTL
      const accessKey = `${key}:access_count`;
      const currentCount = await this.get<number>(accessKey) || 0;
      await this.set(accessKey, currentCount + 1, 3600); // Track for 1 hour
    }
    return value;
  }

  // Cache warming - preload popular data
  static async warmCache(warmingStrategies: Array<() => Promise<void>>): Promise<void> {
    console.log('Starting cache warming...');
    const results = await Promise.allSettled(warmingStrategies.map(strategy => strategy()));
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    console.log(`Cache warming completed: ${successful} successful, ${failed} failed`);
  }

  // Stale-while-revalidate pattern
  static async getStaleWhileRevalidate<T>(
    key: string,
    revalidateFunction: () => Promise<T>,
    staleTTL: number = 300 // 5 minutes stale time
  ): Promise<T | null> {
    const cachedValue = await this.get<T>(key);
    const ttl = await this.getTTL(key);
    
    // If cache is fresh, return it
    if (cachedValue && ttl > staleTTL) {
      return cachedValue;
    }
    
    // If cache is stale but exists, return it and revalidate in background
    if (cachedValue && ttl > 0) {
      // Background revalidation
      setImmediate(async () => {
        try {
          const freshValue = await revalidateFunction();
          await this.set(key, freshValue, DEFAULT_TTL.API_RESPONSE);
        } catch (error) {
          console.warn(`Background revalidation failed for key ${key}:`, error);
        }
      });
      return cachedValue;
    }
    
    // Cache miss or expired - fetch fresh data
    try {
      const freshValue = await revalidateFunction();
      await this.set(key, freshValue, DEFAULT_TTL.API_RESPONSE);
      return freshValue;
    } catch (error) {
      // If revalidation fails and we have stale data, return it
      if (cachedValue) {
        console.warn(`Revalidation failed, returning stale data for key ${key}:`, error);
        return cachedValue;
      }
      throw error;
    }
  }
}

// Specialized cache methods for common use cases
export class NewsCache {
  static async getArticles(companyName: string) {
    const key = CacheKeyGenerator.newsArticles(companyName);
    return AdaptiveCacheService.getWithTracking(key);
  }

  static async setArticles(companyName: string, articles: any[], ttl = DEFAULT_TTL.NEWS_ARTICLES) {
    const key = CacheKeyGenerator.newsArticles(companyName);
    const accessKey = `${key}:access_count`;
    const accessCount = await CacheService.get<number>(accessKey) || 0;
    return AdaptiveCacheService.setWithAdaptiveTTL(key, articles, ttl, accessCount);
  }

  static async invalidateCompany(companyName: string) {
    const key = CacheKeyGenerator.newsArticles(companyName);
    return CacheService.delete(key);
  }

  // Cache warming for popular companies
  static async warmPopularCompanies(companies: string[]): Promise<void> {
    const warmingStrategies = companies.map(company => async () => {
      const key = CacheKeyGenerator.newsArticles(company);
      const exists = await CacheService.exists(key);
      if (!exists) {
        // Simulate fetching news for popular companies
        console.log(`Warming cache for company: ${company}`);
        // This would call the actual news service
        // const articles = await newsService.getCompanyNews(company);
        // await this.setArticles(company, articles);
      }
    });

    await AdaptiveCacheService.warmCache(warmingStrategies);
  }
}

export class CompanyCache {
  static async getData(companyName: string) {
    const key = CacheKeyGenerator.companyData(companyName);
    return AdaptiveCacheService.getWithTracking(key);
  }

  static async setData(companyName: string, data: any, ttl = DEFAULT_TTL.COMPANY_DATA) {
    const key = CacheKeyGenerator.companyData(companyName);
    const accessKey = `${key}:access_count`;
    const accessCount = await CacheService.get<number>(accessKey) || 0;
    return AdaptiveCacheService.setWithAdaptiveTTL(key, data, ttl, accessCount);
  }

  // Get with stale-while-revalidate
  static async getDataWithRevalidation(
    companyName: string,
    revalidateFunction: () => Promise<any>
  ) {
    const key = CacheKeyGenerator.companyData(companyName);
    return AdaptiveCacheService.getStaleWhileRevalidate(key, revalidateFunction);
  }
}

export class SocialContentCache {
  static async getContent(articleId: number, platform?: string) {
    const key = CacheKeyGenerator.socialContent(articleId, platform);
    return AdaptiveCacheService.getWithTracking(key);
  }

  static async setContent(articleId: number, content: any, platform?: string, ttl = DEFAULT_TTL.SOCIAL_CONTENT) {
    const key = CacheKeyGenerator.socialContent(articleId, platform);
    const accessKey = `${key}:access_count`;
    const accessCount = await CacheService.get<number>(accessKey) || 0;
    return AdaptiveCacheService.setWithAdaptiveTTL(key, content, ttl, accessCount);
  }

  static async invalidateArticle(articleId: number) {
    const baseKey = CacheKeyGenerator.socialContent(articleId);
    return CacheService.clearByPrefix(baseKey);
  }

  // Batch cache operations for better performance
  static async setContentBatch(
    entries: Array<{ articleId: number; content: any; platform?: string; ttl?: number }>
  ): Promise<boolean> {
    const cacheEntries = entries.map(entry => ({
      key: CacheKeyGenerator.socialContent(entry.articleId, entry.platform),
      value: entry.content,
      ttl: entry.ttl || DEFAULT_TTL.SOCIAL_CONTENT
    }));

    return CacheService.setMultiple(cacheEntries);
  }
}

// Cache health monitoring
export class CacheHealthMonitor {
  private static hitCount = 0;
  private static missCount = 0;
  private static errorCount = 0;

  static recordHit() {
    this.hitCount++;
  }

  static recordMiss() {
    this.missCount++;
  }

  static recordError() {
    this.errorCount++;
  }

  static getStats() {
    const total = this.hitCount + this.missCount;
    const hitRate = total > 0 ? (this.hitCount / total) * 100 : 0;

    return {
      hits: this.hitCount,
      misses: this.missCount,
      errors: this.errorCount,
      hitRate: Math.round(hitRate * 100) / 100,
      total
    };
  }

  static reset() {
    this.hitCount = 0;
    this.missCount = 0;
    this.errorCount = 0;
  }
}

// Cache middleware for automatic monitoring
export function withCacheMonitoring<T>(
  cacheOperation: () => Promise<T | null>
): Promise<T | null> {
  return cacheOperation()
    .then(result => {
      if (result !== null) {
        CacheHealthMonitor.recordHit();
      } else {
        CacheHealthMonitor.recordMiss();
      }
      return result;
    })
    .catch(error => {
      CacheHealthMonitor.recordError();
      throw error;
    });
}