import type { 
  NewsHighlight, 
  SocialMediaPost, 
  SocialPlatform,
  SocialContentRequest,
  SocialContentResponse,
  AIServiceConfig
} from './types.js';
import { OpenAIClient } from './OpenAIClient.js';

export interface HashtagSuggestion {
  tag: string;
  relevance: number; // 1-5 scale
  trending: boolean;
  category: 'branded' | 'industry' | 'trending' | 'general';
}

export interface PlatformContentStrategy {
  platform: SocialPlatform;
  maxLength: number;
  optimalLength: number;
  hashtagLimit: number;
  tone: string;
  contentStyle: string;
  engagementTactics: string[];
}

export class SocialMediaContentService {
  private openaiClient: OpenAIClient;
  private platformStrategies: Map<SocialPlatform, PlatformContentStrategy> = new Map();

  constructor(config: AIServiceConfig) {
    this.openaiClient = new OpenAIClient(config);
    this.initializePlatformStrategies();
  }

  private initializePlatformStrategies(): void {
    this.platformStrategies = new Map([
      ['linkedin', {
        platform: 'linkedin',
        maxLength: 300,
        optimalLength: 150,
        hashtagLimit: 5,
        tone: 'professional',
        contentStyle: 'business-focused, industry insights, thought leadership',
        engagementTactics: ['ask questions', 'share insights', 'industry trends', 'professional development']
      }],
      ['twitter', {
        platform: 'twitter',
        maxLength: 280,
        optimalLength: 200,
        hashtagLimit: 3,
        tone: 'conversational',
        contentStyle: 'concise, news-worthy, real-time updates',
        engagementTactics: ['breaking news angle', 'trending topics', 'quick takes', 'thread starters']
      }],
      ['facebook', {
        platform: 'facebook',
        maxLength: 250,
        optimalLength: 180,
        hashtagLimit: 4,
        tone: 'friendly',
        contentStyle: 'community-focused, discussion starters, storytelling',
        engagementTactics: ['ask questions', 'share stories', 'community building', 'discussion prompts']
      }],
      ['instagram', {
        platform: 'instagram',
        maxLength: 200,
        optimalLength: 150,
        hashtagLimit: 5,
        tone: 'visual',
        contentStyle: 'visual storytelling, behind-the-scenes, lifestyle angle',
        engagementTactics: ['visual hooks', 'story elements', 'lifestyle connection', 'aspirational content']
      }]
    ]);
  }

  async generatePlatformSpecificContent(
    highlights: NewsHighlight[],
    companyName: string,
    platforms: SocialPlatform[],
    tone: 'professional' | 'casual' | 'enthusiastic' = 'professional'
  ): Promise<SocialContentResponse> {
    try {
      const posts: SocialMediaPost[] = [];

      // Generate content for each platform
      for (const platform of platforms) {
        const platformPosts = await this.generateContentForPlatform(
          highlights,
          companyName,
          platform,
          tone
        );
        posts.push(...platformPosts);
      }

      return {
        posts,
        processingTime: 0, // Will be calculated by the calling service
        model: 'gpt-4'
      };

    } catch (error) {
      throw new Error(`Failed to generate platform-specific content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async generateContentForPlatform(
    highlights: NewsHighlight[],
    companyName: string,
    platform: SocialPlatform,
    tone: string
  ): Promise<SocialMediaPost[]> {
    const strategy = this.platformStrategies.get(platform);
    if (!strategy) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    // Generate 2-3 variations for the platform
    const variations = await this.createContentVariations(
      highlights,
      companyName,
      strategy,
      tone,
      2 // Number of variations
    );

    return variations;
  }

  private async createContentVariations(
    highlights: NewsHighlight[],
    companyName: string,
    strategy: PlatformContentStrategy,
    tone: string,
    count: number
  ): Promise<SocialMediaPost[]> {
    const posts: SocialMediaPost[] = [];

    // Sort highlights by importance
    const sortedHighlights = highlights.sort((a, b) => b.importance - a.importance);
    const topHighlights = sortedHighlights.slice(0, 3); // Use top 3 highlights

    for (let i = 0; i < count; i++) {
      const content = await this.generateSinglePost(
        topHighlights,
        companyName,
        strategy,
        tone,
        i
      );

      const hashtags = await this.generateOptimizedHashtags(
        topHighlights,
        companyName,
        strategy.platform,
        strategy.hashtagLimit
      );

      const fullContent = `${content} ${hashtags.join(' ')}`;
      
      // Ensure content fits within platform limits
      const finalContent = this.enforceCharacterLimit(content, hashtags, strategy);

      posts.push({
        content: finalContent.content,
        hashtags: finalContent.hashtags,
        characterCount: finalContent.totalLength,
        platform: strategy.platform
      });
    }

    return posts;
  }

  private async generateSinglePost(
    highlights: NewsHighlight[],
    companyName: string,
    strategy: PlatformContentStrategy,
    tone: string,
    variation: number
  ): Promise<string> {
    const highlightText = highlights
      .map(h => h.text)
      .join('. ');

    const variationStyles = [
      'direct news announcement',
      'analytical insight',
      'industry impact perspective'
    ];

    const style = variationStyles[variation] || variationStyles[0];

    const prompt = `
Create a ${strategy.platform} post about ${companyName} using this ${style} approach.

Key information: ${highlightText}

Requirements:
- Platform: ${strategy.platform}
- Max length: ${strategy.optimalLength} characters (excluding hashtags)
- Tone: ${tone}
- Style: ${strategy.contentStyle}
- Engagement: ${strategy.engagementTactics.join(', ')}

Make it engaging and shareable. Include the company name naturally.
Return only the post content without hashtags.
`;

    try {
      const request: SocialContentRequest = {
        highlights,
        companyName,
        platforms: [strategy.platform],
        tone: tone as any
      };

      // Use a simplified approach for individual post generation
      const response = await this.openaiClient.generateSocialContent(request);
      
      if (response.posts.length > 0) {
        return response.posts[0].content;
      }
      
      // Fallback to template-based generation
      return this.generateTemplateBasedContent(highlights, companyName, strategy);

    } catch (error) {
      // Fallback to template-based generation
      return this.generateTemplateBasedContent(highlights, companyName, strategy);
    }
  }

  private generateTemplateBasedContent(
    highlights: NewsHighlight[],
    companyName: string,
    strategy: PlatformContentStrategy
  ): string {
    const topHighlight = highlights[0];
    if (!topHighlight) {
      return `Latest news about ${companyName}`;
    }

    const templates = {
      linkedin: [
        `${companyName} update: ${topHighlight.text}`,
        `Industry insight: ${topHighlight.text} What are your thoughts?`,
        `${companyName} making moves: ${topHighlight.text}`
      ],
      twitter: [
        `BREAKING: ${companyName} - ${topHighlight.text}`,
        `${companyName}: ${topHighlight.text}`,
        `News: ${topHighlight.text} #${companyName.replace(/\s+/g, '')}`
      ],
      facebook: [
        `Interesting development at ${companyName}: ${topHighlight.text} What do you think this means?`,
        `${companyName} news: ${topHighlight.text}`,
        `Have you heard about ${companyName}? ${topHighlight.text}`
      ],
      instagram: [
        `${companyName} story: ${topHighlight.text}`,
        `Behind the scenes at ${companyName}: ${topHighlight.text}`,
        `${companyName} journey continues: ${topHighlight.text}`
      ]
    };

    const platformTemplates = templates[strategy.platform] || templates.linkedin;
    const template = platformTemplates[Math.floor(Math.random() * platformTemplates.length)];
    
    return template.substring(0, strategy.optimalLength);
  }

  private async generateOptimizedHashtags(
    highlights: NewsHighlight[],
    companyName: string,
    platform: SocialPlatform,
    limit: number
  ): Promise<string[]> {
    const hashtags: HashtagSuggestion[] = [];

    // Add company-based hashtag
    const companyTag = this.createHashtagFromText(companyName);
    if (companyTag) {
      hashtags.push({
        tag: companyTag,
        relevance: 5,
        trending: false,
        category: 'branded'
      });
    }

    // Add category-based hashtags
    const categories = [...new Set(highlights.map(h => h.category))];
    for (const category of categories) {
      const categoryHashtags = this.getCategoryHashtags(category, platform);
      hashtags.push(...categoryHashtags);
    }

    // Add general business hashtags
    const generalHashtags = this.getGeneralBusinessHashtags(platform);
    hashtags.push(...generalHashtags);

    // Sort by relevance and select top hashtags
    const selectedHashtags = hashtags
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit)
      .map(h => h.tag);

    return selectedHashtags;
  }

  private createHashtagFromText(text: string): string | null {
    // Clean and create hashtag from company name
    const cleaned = text
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '')
      .substring(0, 20);

    return cleaned.length > 2 ? `#${cleaned}` : null;
  }

  private getCategoryHashtags(category: string, platform: SocialPlatform): HashtagSuggestion[] {
    const categoryMap = {
      financial: [
        { tag: '#Finance', relevance: 4, trending: true, category: 'industry' as const },
        { tag: '#Earnings', relevance: 4, trending: false, category: 'industry' as const },
        { tag: '#Investment', relevance: 3, trending: false, category: 'industry' as const }
      ],
      operational: [
        { tag: '#Operations', relevance: 3, trending: false, category: 'industry' as const },
        { tag: '#Business', relevance: 4, trending: true, category: 'general' as const },
        { tag: '#Strategy', relevance: 3, trending: false, category: 'industry' as const }
      ],
      strategic: [
        { tag: '#Strategy', relevance: 4, trending: false, category: 'industry' as const },
        { tag: '#Growth', relevance: 4, trending: true, category: 'general' as const },
        { tag: '#Innovation', relevance: 3, trending: false, category: 'industry' as const }
      ],
      market: [
        { tag: '#Market', relevance: 4, trending: true, category: 'industry' as const },
        { tag: '#Industry', relevance: 3, trending: false, category: 'industry' as const },
        { tag: '#Trends', relevance: 3, trending: true, category: 'general' as const }
      ],
      general: [
        { tag: '#News', relevance: 3, trending: true, category: 'general' as const },
        { tag: '#Business', relevance: 4, trending: true, category: 'general' as const },
        { tag: '#Update', relevance: 2, trending: false, category: 'general' as const }
      ]
    };

    return categoryMap[category as keyof typeof categoryMap] || categoryMap.general;
  }

  private getGeneralBusinessHashtags(platform: SocialPlatform): HashtagSuggestion[] {
    const platformSpecific = {
      linkedin: [
        { tag: '#LinkedIn', relevance: 2, trending: true, category: 'general' as const },
        { tag: '#Professional', relevance: 3, trending: false, category: 'general' as const },
        { tag: '#BusinessNews', relevance: 4, trending: true, category: 'general' as const }
      ],
      twitter: [
        { tag: '#Breaking', relevance: 3, trending: true, category: 'trending' as const },
        { tag: '#News', relevance: 4, trending: true, category: 'general' as const },
        { tag: '#Business', relevance: 3, trending: true, category: 'general' as const }
      ],
      facebook: [
        { tag: '#Business', relevance: 4, trending: true, category: 'general' as const },
        { tag: '#News', relevance: 3, trending: true, category: 'general' as const },
        { tag: '#Community', relevance: 2, trending: false, category: 'general' as const }
      ],
      instagram: [
        { tag: '#Business', relevance: 3, trending: true, category: 'general' as const },
        { tag: '#Entrepreneur', relevance: 3, trending: false, category: 'general' as const },
        { tag: '#Success', relevance: 2, trending: false, category: 'general' as const }
      ]
    };

    return platformSpecific[platform] || platformSpecific.linkedin;
  }

  private enforceCharacterLimit(
    content: string,
    hashtags: string[],
    strategy: PlatformContentStrategy
  ): { content: string; hashtags: string[]; totalLength: number } {
    const hashtagString = hashtags.join(' ');
    let totalLength = content.length + hashtagString.length + 1; // +1 for space

    // If within limit, return as is
    if (totalLength <= strategy.maxLength) {
      return {
        content,
        hashtags,
        totalLength
      };
    }

    // Try reducing hashtags first
    let reducedHashtags = [...hashtags];
    while (reducedHashtags.length > 1 && totalLength > strategy.maxLength) {
      reducedHashtags.pop();
      const newHashtagString = reducedHashtags.join(' ');
      totalLength = content.length + newHashtagString.length + 1;
    }

    // If still too long, trim content
    if (totalLength > strategy.maxLength) {
      const availableContentLength = strategy.maxLength - reducedHashtags.join(' ').length - 1;
      const trimmedContent = content.substring(0, Math.max(0, availableContentLength - 3)) + '...';
      totalLength = trimmedContent.length + reducedHashtags.join(' ').length + 1;
      
      return {
        content: trimmedContent,
        hashtags: reducedHashtags,
        totalLength
      };
    }

    return {
      content,
      hashtags: reducedHashtags,
      totalLength
    };
  }
}