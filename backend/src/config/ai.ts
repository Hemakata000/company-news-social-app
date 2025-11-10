import type { AIServiceConfig } from '../services/ai/types.js';

// Ensure process is available
declare const process: {
  env: Record<string, string | undefined>;
};

export const aiConfig: AIServiceConfig = {
  openaiApiKey: process.env.OPENAI_API_KEY,
  claudeApiKey: process.env.CLAUDE_API_KEY,
  model: process.env.AI_MODEL || (process.env.OPENAI_API_KEY ? 'gpt-4' : 'claude-3-sonnet-20240229'),
  maxTokens: parseInt(process.env.AI_MAX_TOKENS || '1000'),
  temperature: parseFloat(process.env.AI_TEMPERATURE || '0.3'),
  timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || '30000'),
};

// Check if we should use free generator (no API keys provided)
export const useFreeGenerator = !process.env.OPENAI_API_KEY && !process.env.CLAUDE_API_KEY;

export function validateAIConfig(): void {
  // If using free generator, skip validation
  if (useFreeGenerator) {
    console.log('ℹ️  Using FREE rule-based content generator (no AI API keys needed)');
    return;
  }

  if (!aiConfig.openaiApiKey && !aiConfig.claudeApiKey) {
    throw new Error('At least one AI service API key (OPENAI_API_KEY or CLAUDE_API_KEY) must be provided');
  }

  if (aiConfig.maxTokens < 100 || aiConfig.maxTokens > 4000) {
    throw new Error('AI_MAX_TOKENS must be between 100 and 4000');
  }

  if (aiConfig.temperature < 0 || aiConfig.temperature > 2) {
    throw new Error('AI_TEMPERATURE must be between 0 and 2');
  }

  if (aiConfig.timeoutMs < 5000 || aiConfig.timeoutMs > 120000) {
    throw new Error('AI_TIMEOUT_MS must be between 5000 and 120000');
  }
}