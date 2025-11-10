import { useState, useCallback, useEffect } from 'react';
import { NewsArticle, SocialMediaContent } from '../types/index.js';
import { apiClient } from '../services/api.js';
import { useContentGeneration } from './useContentGeneration.js';
import { useOfflineContent } from './useOfflineContent.js';

interface SearchState {
  query: string;
  loading: boolean;
  error: string | null;
  newsData: NewsArticle[];
  socialContent: SocialMediaContent | null;
  history: string[];
  suggestions: string[];
  suggestionsLoading: boolean;
}

interface SearchOptions {
  platforms?: string[];
  tone?: 'professional' | 'casual' | 'enthusiastic';
  forceRefresh?: boolean;
}

const STORAGE_KEY = 'company-news-search-history';
const MAX_HISTORY_ITEMS = 10;

// Mock suggestions for now - in real implementation, this would come from an API
const MOCK_SUGGESTIONS = [
  'Apple Inc',
  'Microsoft Corporation',
  'Google',
  'Amazon',
  'Tesla',
  'Meta',
  'Netflix',
  'Spotify',
  'Uber',
  'Airbnb'
];

export const useSearch = () => {
  const [state, setState] = useState<SearchState>({
    query: '',
    loading: false,
    error: null,
    newsData: [],
    socialContent: null,
    history: [],
    suggestions: [],
    suggestionsLoading: false
  });

  const contentGeneration = useContentGeneration();
  const offlineContent = useOfflineContent();

  // Load search history from localStorage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEY);
      if (savedHistory) {
        const history = JSON.parse(savedHistory);
        setState(prev => ({ ...prev, history }));
      }
    } catch (error) {
      console.warn('Failed to load search history:', error);
    }
  }, []);

  // Save search history to localStorage
  const saveToHistory = useCallback((query: string) => {
    try {
      setState(prev => {
        const newHistory = [query, ...prev.history.filter(item => item !== query)]
          .slice(0, MAX_HISTORY_ITEMS);
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
        return { ...prev, history: newHistory };
      });
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  }, []);

  // Clear search history
  const clearHistory = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setState(prev => ({ ...prev, history: [] }));
    } catch (error) {
      console.warn('Failed to clear search history:', error);
    }
  }, []);

  // Get search suggestions
  const getSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setState(prev => ({ ...prev, suggestions: [], suggestionsLoading: false }));
      return;
    }

    setState(prev => ({ ...prev, suggestionsLoading: true }));

    try {
      const response = await apiClient.searchCompanies(query);
      const suggestions = response.companies.map(company => company.name).slice(0, 5);

      setState(prev => ({
        ...prev,
        suggestions,
        suggestionsLoading: false
      }));
    } catch (error) {
      console.warn('Failed to fetch suggestions:', error);
      // Fallback to mock suggestions
      const filtered = MOCK_SUGGESTIONS.filter(suggestion =>
        suggestion.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);

      setState(prev => ({
        ...prev,
        suggestions: filtered,
        suggestionsLoading: false
      }));
    }
  }, []);

  // Perform search
  const search = useCallback(async (query: string, options: {
    platforms?: string[];
    tone?: 'professional' | 'casual' | 'enthusiastic';
    forceRefresh?: boolean;
  } = {}) => {
    if (!query.trim()) return;

    const trimmedQuery = query.trim();
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      query: trimmedQuery
    }));

    try {
      // Check for offline mode and cached content first
      if (offlineContent.isOffline && !options.forceRefresh) {
        const cached = offlineContent.getCachedContent(trimmedQuery);
        if (cached) {
          setState(prev => ({
            ...prev,
            loading: false,
            newsData: cached.articles,
            socialContent: cached.socialContent,
            suggestions: [],
            error: cached.isStale ? 'Showing cached content (offline mode)' : null
          }));
          saveToHistory(trimmedQuery);
          return;
        } else {
          setState(prev => ({
            ...prev,
            loading: false,
            error: 'No cached content available for this company. Please try again when online.'
          }));
          return;
        }
      }

      const response = await apiClient.getCompanyNews(trimmedQuery, {
        limit: 10,
        platforms: options.platforms || ['linkedin', 'twitter', 'facebook', 'instagram'],
        tone: options.tone || 'professional',
        forceRefresh: options.forceRefresh || false
      });

      // Transform API response to match our types
      const articles: NewsArticle[] = response.articles.map(article => ({
        id: article.id,
        title: article.title,
        highlights: article.highlights || [],
        sourceUrl: article.sourceUrl,
        sourceName: article.sourceName,
        publishedAt: new Date(article.publishedAt)
      }));

      // Transform social content from API response
      const socialContent: SocialMediaContent = {
        linkedin: [],
        twitter: [],
        facebook: [],
        instagram: []
      };

      // Process social content from articles
      response.articles.forEach(article => {
        if (article.socialContent) {
          article.socialContent.forEach((post: any) => {
            const platform = post.platform as keyof SocialMediaContent;
            if (socialContent[platform]) {
              socialContent[platform].push({
                content: post.content,
                hashtags: post.hashtags || [],
                characterCount: post.characterCount || post.content.length
              });
            }
          });
        }
      });

      // Cache the content for offline use
      offlineContent.cacheContent(trimmedQuery, articles, socialContent, options);

      setState(prev => ({
        ...prev,
        loading: false,
        newsData: articles,
        socialContent,
        suggestions: [] // Clear suggestions after search
      }));

      saveToHistory(trimmedQuery);

    } catch (error) {
      console.error('Search failed:', error);
      
      // Try to fall back to cached content if available
      const cached = offlineContent.getCachedContent(trimmedQuery);
      if (cached) {
        setState(prev => ({
          ...prev,
          loading: false,
          newsData: cached.articles,
          socialContent: cached.socialContent,
          suggestions: [],
          error: 'Using cached content due to network error'
        }));
        saveToHistory(trimmedQuery);
        return;
      }
      
      let errorMessage = 'An unexpected error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Handle specific error codes
        const apiError = error as any;
        if (apiError.code === 'NO_NEWS_FOUND') {
          errorMessage = `No recent news found for "${trimmedQuery}". Try a different company name.`;
        } else if (apiError.code === 'RATE_LIMIT_EXCEEDED') {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (apiError.code === 'NETWORK_ERROR') {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (apiError.code === 'TIMEOUT') {
          errorMessage = 'Request timed out. Please try again.';
        }
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
    }
  }, [saveToHistory, offlineContent]);

  // Set query (for controlled input)
  const setQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, query }));
    // Debounce suggestions to avoid too many API calls
    const timeoutId = setTimeout(() => {
      getSuggestions(query);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [getSuggestions]);

  // Clear results
  const clearResults = useCallback(() => {
    setState(prev => ({
      ...prev,
      newsData: [],
      socialContent: null,
      error: null,
      query: ''
    }));
  }, []);

  // Regenerate content for current search results
  const regenerateContent = useCallback(async (
    platform?: keyof SocialMediaContent,
    options?: {
      tone?: 'professional' | 'casual' | 'enthusiastic';
      platforms?: string[];
    }
  ) => {
    if (!state.query || !state.newsData.length) {
      return;
    }

    // Extract highlights from current articles
    const allHighlights = state.newsData.flatMap(article => article.highlights);
    
    if (allHighlights.length === 0) {
      setState(prev => ({ ...prev, error: 'No highlights available for content generation' }));
      return;
    }

    const newContent = await contentGeneration.generateFromHighlights(
      allHighlights,
      state.query,
      {
        platforms: platform ? [platform] : (options?.platforms || ['linkedin', 'twitter', 'facebook', 'instagram']),
        tone: options?.tone || 'professional',
        useCache: false // Force fresh generation
      }
    );

    if (newContent) {
      setState(prev => ({
        ...prev,
        socialContent: platform ? {
          ...prev.socialContent!,
          [platform]: newContent[platform]
        } : newContent
      }));

      // Update cache with new content
      offlineContent.cacheContent(state.query, state.newsData, newContent);
    }
  }, [state.query, state.newsData, state.socialContent, contentGeneration, offlineContent]);

  return {
    ...state,
    // Offline content state
    isOffline: offlineContent.isOffline,
    cachedCompanies: offlineContent.getCachedCompanies(),
    cacheStats: offlineContent.getCacheStats(),
    // Content generation state
    isGeneratingContent: contentGeneration.isGenerating,
    contentGenerationError: contentGeneration.error,
    // Methods
    search: (query: string, options?: SearchOptions) => search(query, options),
    setQuery,
    clearResults,
    clearHistory,
    getSuggestions,
    regenerateContent,
    clearContentError: contentGeneration.clearError,
    clearCache: offlineContent.clearCache,
    clearCompanyCache: offlineContent.clearCompanyCache
  };
};