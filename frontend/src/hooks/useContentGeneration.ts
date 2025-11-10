import { useState, useCallback } from 'react';
import { apiClient } from '../services/api.js';
import { SocialMediaContent, SocialPost } from '../types/index.js';

interface ContentGenerationState {
  isGenerating: boolean;
  error: string | null;
  lastGenerated: Date | null;
}

interface ContentGenerationOptions {
  platforms?: string[];
  tone?: 'professional' | 'casual' | 'enthusiastic';
  useCache?: boolean;
}

export const useContentGeneration = () => {
  const [state, setState] = useState<ContentGenerationState>({
    isGenerating: false,
    error: null,
    lastGenerated: null
  });

  // Generate content from custom highlights
  const generateFromHighlights = useCallback(async (
    highlights: string[],
    companyName: string,
    options: ContentGenerationOptions = {}
  ): Promise<SocialMediaContent | null> => {
    if (!highlights.length || !companyName) {
      setState(prev => ({ ...prev, error: 'Highlights and company name are required' }));
      return null;
    }

    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      const response = await apiClient.generateContent(highlights, companyName, {
        platforms: options.platforms || ['linkedin', 'twitter', 'facebook', 'instagram'],
        tone: options.tone || 'professional',
        useCache: options.useCache !== false
      });

      // Transform API response to our SocialMediaContent format
      const socialContent: SocialMediaContent = {
        linkedin: [],
        twitter: [],
        facebook: [],
        instagram: []
      };

      response.content.forEach(post => {
        const platform = post.platform as keyof SocialMediaContent;
        if (socialContent[platform]) {
          socialContent[platform].push({
            content: post.content,
            hashtags: post.hashtags || [],
            characterCount: post.characterCount || post.content.length
          });
        }
      });

      setState(prev => ({
        ...prev,
        isGenerating: false,
        lastGenerated: new Date()
      }));

      return socialContent;

    } catch (error) {
      console.error('Content generation failed:', error);
      
      let errorMessage = 'Failed to generate content';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Handle specific error codes
        const apiError = error as any;
        if (apiError.code === 'RATE_LIMIT_EXCEEDED') {
          errorMessage = 'Too many content generation requests. Please wait a moment and try again.';
        } else if (apiError.code === 'NETWORK_ERROR') {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (apiError.code === 'TIMEOUT') {
          errorMessage = 'Request timed out. Please try again.';
        }
      }

      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: errorMessage
      }));

      return null;
    }
  }, []);

  // Regenerate content for a specific article
  const regenerateForArticle = useCallback(async (
    articleId: string,
    companyName: string,
    options: ContentGenerationOptions = {}
  ): Promise<SocialMediaContent | null> => {
    if (!articleId || !companyName) {
      setState(prev => ({ ...prev, error: 'Article ID and company name are required' }));
      return null;
    }

    setState(prev => ({ ...prev, isGenerating: true, error: null }));

    try {
      const response = await apiClient.regenerateContent(articleId, companyName, {
        platforms: options.platforms || ['linkedin', 'twitter', 'facebook', 'instagram'],
        tone: options.tone || 'professional'
      });

      // Transform API response to our SocialMediaContent format
      const socialContent: SocialMediaContent = {
        linkedin: [],
        twitter: [],
        facebook: [],
        instagram: []
      };

      response.content.forEach(post => {
        const platform = post.platform as keyof SocialMediaContent;
        if (socialContent[platform]) {
          socialContent[platform].push({
            content: post.content,
            hashtags: post.hashtags || [],
            characterCount: post.characterCount || post.content.length
          });
        }
      });

      setState(prev => ({
        ...prev,
        isGenerating: false,
        lastGenerated: new Date()
      }));

      return socialContent;

    } catch (error) {
      console.error('Content regeneration failed:', error);
      
      let errorMessage = 'Failed to regenerate content';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Handle specific error codes
        const apiError = error as any;
        if (apiError.code === 'ARTICLE_NOT_FOUND') {
          errorMessage = 'Article not found. Please try searching again.';
        } else if (apiError.code === 'RATE_LIMIT_EXCEEDED') {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        }
      }

      setState(prev => ({
        ...prev,
        isGenerating: false,
        error: errorMessage
      }));

      return null;
    }
  }, []);

  // Clear error state
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Check if content generation service is healthy
  const checkServiceHealth = useCallback(async () => {
    try {
      const health = await apiClient.checkContentHealth();
      return health.status === 'healthy';
    } catch (error) {
      console.warn('Failed to check content service health:', error);
      return false;
    }
  }, []);

  return {
    ...state,
    generateFromHighlights,
    regenerateForArticle,
    clearError,
    checkServiceHealth
  };
};