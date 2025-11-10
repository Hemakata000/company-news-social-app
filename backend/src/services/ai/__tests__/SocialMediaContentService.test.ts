import { SocialMediaContentService } from '../SocialMediaContentService.js';
import type { NewsHighlight, AIServiceConfig } from '../types.js';

describe('SocialMediaContentService', () => {
  let service: SocialMediaContentService;
  let mockConfig: AIServiceConfig;

  beforeEach(() => {
    mockConfig = {
      openaiApiKey: 'test-key',
      model: 'gpt-4',
      maxTokens: 1000,
      temperature: 0.7,
      timeoutMs: 30000
    };
    
    service = new SocialMediaContentService(mockConfig);
  });

  describe('generatePlatformSpecificContent', () => {
    const mockHighlights: NewsHighlight[] = [
      {
        text: 'Company reported 25% revenue growth in Q3',
        importance: 5,
        category: 'financial'
      },
      {
        text: 'New product launch scheduled for next quarter',
        importance: 4,
        category: 'strategic'
      }
    ];

    it('should generate content for LinkedIn with proper character limits', async () => {
      // Mock the OpenAI client to avoid actual API calls
      const mockGenerateSocialContent = jest.fn().mockResolvedValue({
        posts: [{
          content: 'Great news from TestCorp: 25% revenue growth in Q3!',
          hashtags: ['#TestCorp', '#Growth'],
          characterCount: 50,
          platform: 'linkedin'
        }],
        processingTime: 100,
        model: 'gpt-4'
      });

      (service as any).openaiClient = {
        generateSocialContent: mockGenerateSocialContent
      };

      const result = await service.generatePlatformSpecificContent(
        mockHighlights,
        'TestCorp',
        ['linkedin'],
        'professional'
      );

      expect(result.posts).toHaveLength(2); // 2 variations per platform
      expect(result.posts[0].platform).toBe('linkedin');
      expect(result.posts[0].characterCount).toBeLessThanOrEqual(300);
      expect(result.posts[0].hashtags.length).toBeLessThanOrEqual(5);
    });

    it('should generate content for multiple platforms', async () => {
      const mockGenerateSocialContent = jest.fn().mockResolvedValue({
        posts: [{
          content: 'TestCorp news update',
          hashtags: ['#TestCorp'],
          characterCount: 20,
          platform: 'twitter'
        }],
        processingTime: 100,
        model: 'gpt-4'
      });

      (service as any).openaiClient = {
        generateSocialContent: mockGenerateSocialContent
      };

      const result = await service.generatePlatformSpecificContent(
        mockHighlights,
        'TestCorp',
        ['linkedin', 'twitter', 'facebook'],
        'professional'
      );

      expect(result.posts.length).toBeGreaterThanOrEqual(6); // 2 variations × 3 platforms
      
      const platforms = result.posts.map(p => p.platform);
      expect(platforms).toContain('linkedin');
      expect(platforms).toContain('twitter');
      expect(platforms).toContain('facebook');
    });

    it('should enforce platform-specific character limits', async () => {
      const mockGenerateSocialContent = jest.fn().mockResolvedValue({
        posts: [{
          content: 'Very long content that exceeds platform limits and should be trimmed appropriately',
          hashtags: ['#TestCorp', '#News', '#Business'],
          characterCount: 100,
          platform: 'twitter'
        }],
        processingTime: 100,
        model: 'gpt-4'
      });

      (service as any).openaiClient = {
        generateSocialContent: mockGenerateSocialContent
      };

      const result = await service.generatePlatformSpecificContent(
        mockHighlights,
        'TestCorp',
        ['twitter'],
        'professional'
      );

      // Twitter has 280 character limit
      result.posts.forEach(post => {
        expect(post.characterCount).toBeLessThanOrEqual(280);
      });
    });

    it('should generate appropriate hashtags for different platforms', async () => {
      const mockGenerateSocialContent = jest.fn().mockResolvedValue({
        posts: [{
          content: 'TestCorp update',
          hashtags: [],
          characterCount: 15,
          platform: 'instagram'
        }],
        processingTime: 100,
        model: 'gpt-4'
      });

      (service as any).openaiClient = {
        generateSocialContent: mockGenerateSocialContent
      };

      const result = await service.generatePlatformSpecificContent(
        mockHighlights,
        'TestCorp',
        ['instagram'],
        'professional'
      );

      result.posts.forEach(post => {
        expect(post.hashtags.length).toBeLessThanOrEqual(5); // Instagram limit
        expect(post.hashtags.every(tag => tag.startsWith('#'))).toBe(true);
      });
    });
  });
});