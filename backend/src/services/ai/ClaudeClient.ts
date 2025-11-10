import Anthropic from '@anthropic-ai/sdk';
import type { 
  HighlightExtractionRequest, 
  HighlightExtractionResponse, 
  NewsHighlight,
  SocialContentRequest,
  SocialContentResponse,
  SocialMediaPost,
  AIServiceConfig,
  AIServiceError,
  AIServiceHealth
} from './types.js';

export class ClaudeClient {
  private client: Anthropic;
  private config: AIServiceConfig;

  constructor(config: AIServiceConfig) {
    if (!config.claudeApiKey) {
      throw new Error('Claude API key is required');
    }

    this.config = config;
    
    try {
      this.client = new Anthropic({
        apiKey: config.claudeApiKey,
        timeout: config.timeoutMs || 30000,
      });
    } catch (error) {
      throw new Error(`Failed to initialize Claude client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async extractHighlights(request: HighlightExtractionRequest): Promise<HighlightExtractionResponse> {
    const startTime = Date.now();
    
    try {
      const prompt = this.buildHighlightExtractionPrompt(request);
      
      const response = await this.client.messages.create({
        model: this.config.model || 'claude-3-sonnet-20240229',
        max_tokens: this.config.maxTokens || 1000,
        temperature: this.config.temperature || 0.3,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
      });

      const responseContent = response.content[0];
      if (!responseContent || responseContent.type !== 'text') {
        throw this.createAIServiceError('EMPTY_RESPONSE', 'Claude returned empty or invalid response');
      }

      const highlights = this.parseHighlightsResponse(responseContent.text);
      const processingTime = Date.now() - startTime;

      return {
        highlights,
        processingTime,
        model: response.model
      };

    } catch (error) {
      if (error instanceof Anthropic.APIError) {
        throw this.createAIServiceError(
          error.type || 'CLAUDE_API_ERROR',
          `Claude API error: ${error.message}`,
          error
        );
      }
      throw this.createAIServiceError(
        'UNKNOWN_ERROR', 
        'Unknown error during highlight extraction', 
        error instanceof Error ? error : undefined
      );
    }
  }

  async generateSocialContent(request: SocialContentRequest): Promise<SocialContentResponse> {
    const startTime = Date.now();
    
    try {
      const prompt = this.buildSocialContentPrompt(request);
      
      const response = await this.client.messages.create({
        model: this.config.model || 'claude-3-sonnet-20240229',
        max_tokens: this.config.maxTokens || 1500,
        temperature: this.config.temperature || 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
      });

      const responseContent = response.content[0];
      if (!responseContent || responseContent.type !== 'text') {
        throw this.createAIServiceError('EMPTY_RESPONSE', 'Claude returned empty or invalid response');
      }

      const posts = this.parseSocialContentResponse(responseContent.text, request.platforms);
      const processingTime = Date.now() - startTime;

      return {
        posts,
        processingTime,
        model: response.model
      };

    } catch (error) {
      if (error instanceof Anthropic.APIError) {
        throw this.createAIServiceError(
          error.type || 'CLAUDE_API_ERROR',
          `Claude API error: ${error.message}`,
          error
        );
      }
      throw this.createAIServiceError(
        'UNKNOWN_ERROR', 
        'Unknown error during social content generation', 
        error instanceof Error ? error : undefined
      );
    }
  }

  async checkHealth(): Promise<AIServiceHealth> {
    const startTime = Date.now();
    
    try {
      // Simple health check with minimal token usage
      await this.client.messages.create({
        model: 'claude-3-haiku-20240307', // Use fastest model for health check
        max_tokens: 5,
        messages: [{ role: 'user', content: 'Hello' }],
      });

      return {
        service: 'claude',
        status: 'healthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date()
      };

    } catch (error) {
      return {
        service: 'claude',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private buildHighlightExtractionPrompt(request: HighlightExtractionRequest): string {
    return `You are an expert business analyst who extracts key highlights from company news articles. You provide structured, actionable insights that professionals can use for decision-making and social media sharing.

Extract 3-5 key highlights from this news article about ${request.companyName}.

Article Title: ${request.title}
Source: ${request.sourceName}
Content: ${request.content}

For each highlight, provide:
1. The key insight (1-2 sentences)
2. Importance level (1-5, where 5 is most important)
3. Category (financial, operational, strategic, market, or general)

Format your response as JSON:
{
  "highlights": [
    {
      "text": "Key insight here",
      "importance": 4,
      "category": "financial"
    }
  ]
}

Focus on information that would be valuable for:
- Business professionals tracking the company
- Investors making decisions
- Social media content creation
- Market analysis

Prioritize concrete facts, numbers, and actionable insights over general statements.`;
  }

  private buildSocialContentPrompt(request: SocialContentRequest): string {
    const highlightsText = request.highlights
      .map(h => `• ${h.text} (${h.category}, importance: ${h.importance})`)
      .join('\n');

    const tone = request.tone || 'professional';
    const platformsText = request.platforms.join(', ');

    // Platform-specific character limits and guidelines
    const platformGuidelines = {
      linkedin: {
        limit: 300,
        style: 'Professional, business-focused, include industry insights',
        hashtags: '3-5 business/industry hashtags'
      },
      twitter: {
        limit: 280,
        style: 'Concise, engaging, news-worthy angle',
        hashtags: '2-3 trending/relevant hashtags'
      },
      facebook: {
        limit: 250,
        style: 'Conversational, community-focused, discussion starter',
        hashtags: '2-4 broad appeal hashtags'
      },
      instagram: {
        limit: 200,
        style: 'Visual storytelling, behind-the-scenes angle',
        hashtags: '3-5 visual/lifestyle hashtags'
      }
    };

    const platformDetails = request.platforms
      .map(platform => {
        const guide = platformGuidelines[platform as keyof typeof platformGuidelines];
        return `* ${platform.toUpperCase()}: ${guide.limit} chars max - ${guide.style} - ${guide.hashtags}`;
      })
      .join('\n');

    return `You are a social media content expert who creates engaging, platform-specific posts from business news highlights. You understand each platform's audience, character limits, and best practices for engagement.

Create engaging social media posts for ${platformsText} based on these news highlights about ${request.companyName}:

${highlightsText}

Platform-specific requirements:
${platformDetails}

General requirements:
- Tone: ${tone}
- Create 2-3 variations for each requested platform
- STRICTLY follow character limits (including hashtags)
- Optimize hashtags for platform algorithms and audience
- Include company name naturally in content
- Add engaging hooks and call-to-actions when appropriate

Format as JSON:
{
  "posts": [
    {
      "platform": "linkedin",
      "content": "Post content without hashtags",
      "hashtags": ["#CompanyName", "#Industry", "#BusinessNews"],
      "characterCount": 0
    }
  ]
}

Content optimization rules:
- LinkedIn: Focus on business impact, industry trends, professional insights
- Twitter: Lead with breaking news angle, use trending topics
- Facebook: Create discussion starters, ask questions, community engagement
- Instagram: Visual storytelling, behind-the-scenes perspective, lifestyle angle

Hashtag optimization:
- Mix branded hashtags (company/industry) with trending hashtags
- Research-backed hashtags for maximum reach
- Avoid over-hashtagging (quality over quantity)
- Platform-appropriate hashtag styles`;
  }

  private parseHighlightsResponse(response: string): NewsHighlight[] {
    try {
      // Clean up the response to extract JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.highlights || !Array.isArray(parsed.highlights)) {
        throw new Error('Invalid highlights format');
      }

      return parsed.highlights.map((highlight: any) => ({
        text: this.validateAndCleanText(highlight.text),
        importance: this.validateImportance(highlight.importance),
        category: this.validateCategory(highlight.category)
      }));

    } catch (error) {
      throw this.createAIServiceError(
        'PARSE_ERROR',
        `Failed to parse highlights response: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private parseSocialContentResponse(response: string, requestedPlatforms: string[]): SocialMediaPost[] {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      if (!parsed.posts || !Array.isArray(parsed.posts)) {
        throw new Error('Invalid posts format');
      }

      return parsed.posts
        .filter((post: any) => requestedPlatforms.includes(post.platform))
        .map((post: any) => {
          const content = this.validateAndCleanText(post.content);
          const hashtags = this.validateAndOptimizeHashtags(post.hashtags, post.platform);
          const fullContent = `${content} ${hashtags.join(' ')}`;
          const characterCount = fullContent.length;
          
          // Validate character limits
          this.validateCharacterLimit(characterCount, post.platform);
          
          return {
            content,
            hashtags,
            characterCount,
            platform: this.validatePlatform(post.platform)
          };
        });

    } catch (error) {
      throw this.createAIServiceError(
        'PARSE_ERROR',
        `Failed to parse social content response: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private validateAndCleanText(text: any): string {
    if (typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Invalid text content');
    }
    return text.trim();
  }

  private validateImportance(importance: any): number {
    const num = Number(importance);
    if (isNaN(num) || num < 1 || num > 5) {
      return 3; // Default to medium importance
    }
    return Math.round(num);
  }

  private validateCategory(category: any): NewsHighlight['category'] {
    const validCategories = ['financial', 'operational', 'strategic', 'market', 'general'];
    if (typeof category === 'string' && validCategories.includes(category)) {
      return category as NewsHighlight['category'];
    }
    return 'general'; // Default category
  }

  private validateAndOptimizeHashtags(hashtags: any, platform: string): string[] {
    if (!Array.isArray(hashtags)) {
      return [];
    }

    // Clean and validate hashtags
    const cleanHashtags = hashtags
      .filter(tag => typeof tag === 'string' && tag.trim().length > 0)
      .map(tag => {
        // Ensure hashtag starts with #
        const cleanTag = tag.trim();
        return cleanTag.startsWith('#') ? cleanTag : `#${cleanTag}`;
      })
      .filter(tag => {
        // Basic hashtag validation (no spaces, special chars except underscore)
        return /^#[a-zA-Z0-9_]+$/.test(tag) && tag.length <= 30;
      });

    // Platform-specific hashtag limits and optimization
    const platformLimits = {
      linkedin: { max: 5, preferred: 3 },
      twitter: { max: 3, preferred: 2 },
      facebook: { max: 4, preferred: 2 },
      instagram: { max: 5, preferred: 4 }
    };

    const limit = platformLimits[platform as keyof typeof platformLimits]?.max || 3;
    return cleanHashtags.slice(0, limit);
  }

  private validateCharacterLimit(characterCount: number, platform: string): void {
    const limits = {
      linkedin: 300,
      twitter: 280,
      facebook: 250,
      instagram: 200
    };

    const limit = limits[platform as keyof typeof limits];
    if (limit && characterCount > limit) {
      throw new Error(`Content exceeds ${platform} character limit: ${characterCount}/${limit}`);
    }
  }

  private validatePlatform(platform: any): SocialMediaPost['platform'] {
    const validPlatforms = ['linkedin', 'twitter', 'facebook', 'instagram'];
    if (typeof platform === 'string' && validPlatforms.includes(platform)) {
      return platform as SocialMediaPost['platform'];
    }
    throw new Error(`Invalid platform: ${platform}`);
  }

  private createAIServiceError(code: string, message: string, originalError?: Error): AIServiceError {
    const error = new Error(message) as AIServiceError;
    error.code = code;
    error.service = 'claude';
    error.originalError = originalError;
    return error;
  }
}