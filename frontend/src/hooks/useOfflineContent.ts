import { useState, useEffect, useCallback } from 'react';
import { NewsArticle, SocialMediaContent } from '../types/index.js';

interface OfflineContentState {
  isOffline: boolean;
  cachedContent: {
    [companyName: string]: {
      articles: NewsArticle[];
      socialContent: SocialMediaContent;
      timestamp: Date;
      searchOptions?: any;
    };
  };
  lastSync: Date | null;
}

const STORAGE_KEY = 'company-news-offline-content';
const CACHE_EXPIRY_HOURS = 24; // Cache expires after 24 hours

export const useOfflineContent = () => {
  const [state, setState] = useState<OfflineContentState>({
    isOffline: false,
    cachedContent: {},
    lastSync: null
  });

  // Check online/offline status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setState(prev => ({ ...prev, isOffline: !navigator.onLine }));
    };

    // Set initial status
    updateOnlineStatus();

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Load cached content from localStorage on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        
        // Convert timestamp strings back to Date objects
        const processedCache = Object.entries(parsedCache).reduce((acc, [key, value]: [string, any]) => {
          acc[key] = {
            ...value,
            timestamp: new Date(value.timestamp),
            articles: value.articles.map((article: any) => ({
              ...article,
              publishedAt: new Date(article.publishedAt)
            }))
          };
          return acc;
        }, {} as any);

        setState(prev => ({
          ...prev,
          cachedContent: processedCache,
          lastSync: new Date()
        }));
      }
    } catch (error) {
      console.warn('Failed to load offline content cache:', error);
    }
  }, []);

  // Save content to cache
  const cacheContent = useCallback((
    companyName: string,
    articles: NewsArticle[],
    socialContent: SocialMediaContent,
    searchOptions?: any
  ) => {
    try {
      const cacheEntry = {
        articles,
        socialContent,
        timestamp: new Date(),
        searchOptions
      };

      const updatedCache = {
        ...state.cachedContent,
        [companyName.toLowerCase()]: cacheEntry
      };

      // Clean up expired entries
      const now = new Date();
      const cleanedCache = Object.entries(updatedCache).reduce((acc, [key, value]) => {
        const hoursSinceCache = (now.getTime() - value.timestamp.getTime()) / (1000 * 60 * 60);
        if (hoursSinceCache < CACHE_EXPIRY_HOURS) {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleanedCache));
      
      setState(prev => ({
        ...prev,
        cachedContent: cleanedCache,
        lastSync: new Date()
      }));

    } catch (error) {
      console.warn('Failed to cache content:', error);
    }
  }, [state.cachedContent]);

  // Get cached content for a company
  const getCachedContent = useCallback((companyName: string) => {
    const cached = state.cachedContent[companyName.toLowerCase()];
    
    if (!cached) {
      return null;
    }

    // Check if cache is expired
    const now = new Date();
    const hoursSinceCache = (now.getTime() - cached.timestamp.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceCache >= CACHE_EXPIRY_HOURS) {
      return null;
    }

    return {
      articles: cached.articles,
      socialContent: cached.socialContent,
      timestamp: cached.timestamp,
      searchOptions: cached.searchOptions,
      isStale: hoursSinceCache > 1 // Consider stale after 1 hour
    };
  }, [state.cachedContent]);

  // Get all cached companies
  const getCachedCompanies = useCallback(() => {
    return Object.keys(state.cachedContent).map(companyName => {
      const cached = state.cachedContent[companyName];
      const now = new Date();
      const hoursSinceCache = (now.getTime() - cached.timestamp.getTime()) / (1000 * 60 * 60);
      
      return {
        name: companyName,
        timestamp: cached.timestamp,
        articleCount: cached.articles.length,
        isStale: hoursSinceCache > 1,
        isExpired: hoursSinceCache >= CACHE_EXPIRY_HOURS
      };
    }).filter(company => !company.isExpired);
  }, [state.cachedContent]);

  // Clear all cached content
  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setState(prev => ({
        ...prev,
        cachedContent: {},
        lastSync: null
      }));
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }, []);

  // Clear cache for specific company
  const clearCompanyCache = useCallback((companyName: string) => {
    try {
      const updatedCache = { ...state.cachedContent };
      delete updatedCache[companyName.toLowerCase()];
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCache));
      setState(prev => ({
        ...prev,
        cachedContent: updatedCache
      }));
    } catch (error) {
      console.warn('Failed to clear company cache:', error);
    }
  }, [state.cachedContent]);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    const companies = getCachedCompanies();
    const totalArticles = companies.reduce((sum, company) => sum + company.articleCount, 0);
    const staleCompanies = companies.filter(company => company.isStale).length;
    
    return {
      totalCompanies: companies.length,
      totalArticles,
      staleCompanies,
      lastSync: state.lastSync,
      cacheSize: JSON.stringify(state.cachedContent).length // Approximate size in bytes
    };
  }, [getCachedCompanies, state.cachedContent, state.lastSync]);

  return {
    ...state,
    cacheContent,
    getCachedContent,
    getCachedCompanies,
    clearCache,
    clearCompanyCache,
    getCacheStats
  };
};