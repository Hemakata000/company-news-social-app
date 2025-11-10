// Simple in-memory cache for MVP (no Redis needed)
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 900): Promise<boolean> {
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, { value, expiresAt });
    return true;
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

// Export singleton instance
export const simpleCache = new SimpleCache();

// Cache key generators (same as before)
export const CacheKeyGenerator = {
  newsArticles: (companyName: string) => 
    `news:articles:${companyName.toLowerCase().replace(/\s+/g, '_')}`,
  
  companyData: (companyName: string) => 
    `company:data:${companyName.toLowerCase().replace(/\s+/g, '_')}`,
  
  socialContent: (articleId: number, platform?: string) => 
    platform ? `social:article:${articleId}:${platform}` : `social:article:${articleId}`,
};
