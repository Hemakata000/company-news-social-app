import { Request, Response, NextFunction } from 'express';
import { CacheService, CacheKeyGenerator } from '../utils/cache.js';

// Cache middleware for API responses
export const cacheMiddleware = (ttlSeconds: number = 600) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Generate cache key based on route and query parameters
      const cacheKey = CacheKeyGenerator.apiResponse(
        req.route?.path || req.path,
        { ...req.params, ...req.query }
      );

      // Try to get cached response
      const cachedResponse = await CacheService.get(cacheKey);
      
      if (cachedResponse) {
        console.log(`Cache HIT for key: ${cacheKey}`);
        return res.json({
          ...cachedResponse,
          _cached: true,
          _cacheKey: cacheKey
        });
      }

      console.log(`Cache MISS for key: ${cacheKey}`);

      // Store original json method
      const originalJson = res.json;

      // Override json method to cache the response
      res.json = function(data: any) {
        // Cache the response data (exclude metadata)
        const dataToCache = { ...data };
        delete dataToCache._cached;
        delete dataToCache._cacheKey;
        
        CacheService.set(cacheKey, dataToCache, ttlSeconds)
          .catch(error => console.error('Cache set error:', error));

        // Call original json method
        return originalJson.call(this, {
          ...data,
          _cached: false,
          _cacheKey: cacheKey
        });
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      // Continue without caching on error
      next();
    }
  };
};

// Cache invalidation middleware
export const invalidateCacheMiddleware = (keyPattern: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Store original methods
      const originalJson = res.json;
      const originalSend = res.send;

      // Override response methods to invalidate cache after successful response
      const invalidateCache = async () => {
        try {
          await CacheService.clearByPrefix(keyPattern);
          console.log(`Cache invalidated for pattern: ${keyPattern}`);
        } catch (error) {
          console.error('Cache invalidation error:', error);
        }
      };

      res.json = function(data: any) {
        const result = originalJson.call(this, data);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          invalidateCache();
        }
        return result;
      };

      res.send = function(data: any) {
        const result = originalSend.call(this, data);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          invalidateCache();
        }
        return result;
      };

      next();
    } catch (error) {
      console.error('Cache invalidation middleware error:', error);
      next();
    }
  };
};

// Rate limiting with Redis
export const rateLimitMiddleware = (
  maxRequests: number = 100,
  windowSeconds: number = 3600,
  keyGenerator?: (req: Request) => string
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Generate rate limit key
      const defaultKey = `rate_limit:${req.ip}`;
      const rateLimitKey = keyGenerator ? keyGenerator(req) : defaultKey;

      // Get current request count
      const currentCount = await CacheService.get<number>(rateLimitKey) || 0;

      if (currentCount >= maxRequests) {
        return res.status(429).json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            retryAfter: windowSeconds
          }
        });
      }

      // Increment request count
      await CacheService.set(rateLimitKey, currentCount + 1, windowSeconds);

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': (maxRequests - currentCount - 1).toString(),
        'X-RateLimit-Reset': new Date(Date.now() + windowSeconds * 1000).toISOString()
      });

      next();
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      // Continue without rate limiting on error
      next();
    }
  };
};

// Cache warming utility
export class CacheWarmer {
  static async warmNewsCache(companyNames: string[]) {
    console.log('🔥 Warming news cache...');
    
    for (const companyName of companyNames) {
      try {
        // This would typically call your news service
        // For now, we'll just create placeholder cache entries
        const cacheKey = CacheKeyGenerator.newsArticles(companyName);
        await CacheService.set(cacheKey, [], 300); // 5 minutes
        console.log(`Cache warmed for company: ${companyName}`);
      } catch (error) {
        console.error(`Failed to warm cache for ${companyName}:`, error);
      }
    }
    
    console.log('✅ Cache warming completed');
  }

  static async warmCompanyCache(companies: Array<{ name: string; data: any }>) {
    console.log('🔥 Warming company cache...');
    
    for (const company of companies) {
      try {
        const cacheKey = CacheKeyGenerator.companyData(company.name);
        await CacheService.set(cacheKey, company.data, 3600); // 1 hour
        console.log(`Company cache warmed for: ${company.name}`);
      } catch (error) {
        console.error(`Failed to warm company cache for ${company.name}:`, error);
      }
    }
    
    console.log('✅ Company cache warming completed');
  }
}