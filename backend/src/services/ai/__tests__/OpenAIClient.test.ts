import { OpenAIClient } from '../OpenAIClient.js';
import type { AIServiceConfig, HighlightExtractionRequest } from '../types.js';

// Mock OpenAI to avoid actual API calls during testing
jest.mock('openai', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    }))
  };
});

describe('OpenAIClient', () => {
  const mockConfig: AIServiceConfig = {
    openaiApiKey: 'test-api-key',
    model: 'gpt-4',
    maxTokens: 1000,
    temperature: 0.3,
    timeoutMs: 30000
  };

  let client: OpenAIClient;

  beforeEach(() => {
    client = new OpenAIClient(mockConfig);
  });

  describe('constructor', () => {
    it('should throw error when API key is missing', () => {
      const configWithoutKey = { ...mockConfig, openaiApiKey: undefined };
      expect(() => new OpenAIClient(configWithoutKey)).toThrow('OpenAI API key is required');
    });

    it('should initialize successfully with valid config', () => {
      expect(client).toBeInstanceOf(OpenAIClient);
    });
  });

  describe('extractHighlights', () => {
    const mockRequest: HighlightExtractionRequest = {
      title: 'Test Company Announces New Product',
      content: 'Test Company has announced a revolutionary new product that will change the market.',
      sourceName: 'Tech News',
      companyName: 'Test Company'
    };

    it('should extract highlights successfully', async () => {
      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              highlights: [
                {
                  text: 'Company announces revolutionary new product',
                  importance: 5,
                  category: 'strategic'
                }
              ]
            })
          }
        }],
        model: 'gpt-4'
      };

      const mockCreate = jest.fn().mockResolvedValue(mockResponse);
      (client as any).client.chat.completions.create = mockCreate;

      const result = await client.extractHighlights(mockRequest);

      expect(result.highlights).toHaveLength(1);
      expect(result.highlights[0].text).toBe('Company announces revolutionary new product');
      expect(result.highlights[0].importance).toBe(5);
      expect(result.highlights[0].category).toBe('strategic');
      expect(result.model).toBe('gpt-4');
      expect(typeof result.processingTime).toBe('number');
    });

    it('should handle empty response', async () => {
      const mockResponse = {
        choices: [{ message: { content: null } }],
        model: 'gpt-4'
      };

      const mockCreate = jest.fn().mockResolvedValue(mockResponse);
      (client as any).client.chat.completions.create = mockCreate;

      await expect(client.extractHighlights(mockRequest)).rejects.toThrow('OpenAI returned empty response');
    });

    it('should handle invalid JSON response', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'invalid json' } }],
        model: 'gpt-4'
      };

      const mockCreate = jest.fn().mockResolvedValue(mockResponse);
      (client as any).client.chat.completions.create = mockCreate;

      await expect(client.extractHighlights(mockRequest)).rejects.toThrow('Failed to parse highlights response');
    });
  });

  describe('checkHealth', () => {
    it('should return healthy status on successful API call', async () => {
      const mockResponse = {
        choices: [{ message: { content: 'Hello' } }],
        model: 'gpt-3.5-turbo'
      };

      const mockCreate = jest.fn().mockResolvedValue(mockResponse);
      (client as any).client.chat.completions.create = mockCreate;

      const health = await client.checkHealth();

      expect(health.service).toBe('openai');
      expect(health.status).toBe('healthy');
      expect(typeof health.responseTime).toBe('number');
      expect(health.lastChecked).toBeInstanceOf(Date);
    });

    it('should return unhealthy status on API error', async () => {
      const mockCreate = jest.fn().mockRejectedValue(new Error('API Error'));
      (client as any).client.chat.completions.create = mockCreate;

      const health = await client.checkHealth();

      expect(health.service).toBe('openai');
      expect(health.status).toBe('unhealthy');
      expect(health.error).toBe('API Error');
    });
  });
});