// Free content generation service (no AI API needed)
import { freeContentGenerator } from './FreeContentGenerator.js';
import type { NewsHighlight, SocialContentRequest, SocialContentResponse } from './types.js';
import type { ProcessedNewsArticle } from '../news/types.js';
import type { NewsArticle } from '../../models/types.js';

export class ContentGenerationServiceFree {
  async extractHighlightsFromArticle(
    article: ProcessedNewsArticle | NewsArticle,
    companyName: string
  ): Promise<NewsHighlight[]> {
    try {
      const highlights = await freeContentGenerator.generateHighlights(article as NewsArticle);
      
      return highlights.map((text, index) => ({
        text,
        importance: 1 - (index * 0.15), // Decreasing importance
        category: this.categorizeHighlight(text)
      }));
    } catch (error) {
      console.error('Error extracting highlights:', error);
      // Return basic highlight from title
      return [{
        text: article.title,
        importance: 1.0,
        category: 'general'
      }];
    }
  }

  async generateSocialMediaContent(
    article: NewsArticle,
    companyName: string,
    platforms: string[]
  ): Promise<SocialContentResponse> {
    try {
      const allPosts = await freeContentGenerator.generateSocialContent(article, companyName);
      
      // Filter by requested platforms
      const requestedPosts = platforms.length > 0
        ? allPosts.filter(post => platforms.includes(post.platform))
        : allPosts;

      return {
        success: true,
        data: {
          posts: requestedPosts.map(post => ({
            platform: post.platform,
            content: post.content,
            hashtags: post.hashtags,
            characterCount: post.characterCount,
            metadata: {
              generatedAt: new Date().toISOString(),
              model: 'free-rule-based',
              tokensUsed: 0
            }
          }))
        },
        metadata: {
          provider: 'FreeContentGenerator',
          model: 'rule-based',
          tokensUsed: 0,
          latencyMs: 0
        }
      };
    } catch (error) {
      console.error('Error generating social content:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<{ status: 'healthy'; provider: string }> {
    return freeContentGenerator.healthCheck();
  }

  private categorizeHighlight(text: string): string {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('revenue') || lowerText.includes('profit') || lowerText.includes('earnings')) {
      return 'financial';
    }
    if (lowerText.includes('product') || lowerText.includes('launch') || lowerText.includes('release')) {
      return 'product';
    }
    if (lowerText.includes('partnership') || lowerText.includes('acquisition') || lowerText.includes('merger')) {
      return 'business';
    }
    if (lowerText.includes('ceo') || lowerText.includes('executive') || lowerText.includes('leadership')) {
      return 'leadership';
    }
    
    return 'general';
  }
}

// Export singleton instance
export const contentGenerationServiceFree = new ContentGenerationServiceFree();
