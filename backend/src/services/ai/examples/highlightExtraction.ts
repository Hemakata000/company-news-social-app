/**
 * Example usage of OpenAI client for highlight extraction
 * This file demonstrates how to use the OpenAI integration
 */

import { OpenAIClient } from '../OpenAIClient.js';
import { ContentGenerationService } from '../ContentGenerationService.js';
import { aiConfig } from '../../config/ai.js';
import type { ProcessedNewsArticle } from '../../news/types.js';

// Example news article
const sampleArticle: ProcessedNewsArticle = {
  title: 'Apple Reports Record Q4 Revenue of $89.5 Billion',
  content: `Apple Inc. reported record fourth-quarter revenue of $89.5 billion, up 1% year over year, driven by strong iPhone sales and services growth. The company's iPhone revenue reached $43.8 billion, while Services revenue hit a new record of $22.3 billion. CEO Tim Cook highlighted the company's continued innovation in AI and machine learning capabilities. Apple also announced plans to expand manufacturing in India and invest $1 billion in renewable energy projects. The company's gross margin improved to 45.2%, exceeding analyst expectations.`,
  url: 'https://example.com/apple-earnings',
  sourceName: 'Financial Times',
  publishedAt: new Date('2024-01-01'),
  relevanceScore: 0.95
};

async function demonstrateHighlightExtraction() {
  try {
    console.log('🚀 Starting highlight extraction demonstration...\n');

    // Initialize the content generation service
    const contentService = new ContentGenerationService(aiConfig);

    // Extract highlights from the sample article
    console.log('📰 Processing article:', sampleArticle.title);
    console.log('📝 Content length:', sampleArticle.content.length, 'characters\n');

    const highlights = await contentService.extractHighlightsFromArticle(sampleArticle, 'Apple');

    console.log('✨ Extracted highlights:');
    highlights.forEach((highlight, index) => {
      console.log(`\n${index + 1}. [${highlight.category.toUpperCase()}] ⭐${highlight.importance}/5`);
      console.log(`   ${highlight.text}`);
    });

    // Generate social media content
    console.log('\n📱 Generating social media content...');
    const socialContent = await contentService.generateSocialContent(
      highlights, 
      'Apple', 
      ['linkedin', 'twitter'],
      'professional'
    );

    console.log('\n🔗 LinkedIn Posts:');
    socialContent.posts
      .filter(post => post.platform === 'linkedin')
      .forEach((post, index) => {
        console.log(`\nPost ${index + 1} (${post.characterCount} chars):`);
        console.log(post.content);
        console.log('Hashtags:', post.hashtags.join(' '));
      });

    console.log('\n🐦 Twitter Posts:');
    socialContent.posts
      .filter(post => post.platform === 'twitter')
      .forEach((post, index) => {
        console.log(`\nPost ${index + 1} (${post.characterCount} chars):`);
        console.log(post.content);
        console.log('Hashtags:', post.hashtags.join(' '));
      });

    // Check service health
    console.log('\n🏥 Checking service health...');
    const health = await contentService.checkServiceHealth();
    console.log(`Service: ${health.service}`);
    console.log(`Status: ${health.status}`);
    console.log(`Response time: ${health.responseTime}ms`);

    console.log('\n✅ Demonstration completed successfully!');

  } catch (error) {
    console.error('❌ Error during demonstration:', error);
    
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('Error code:', (error as any).code);
      console.error('Service:', (error as any).service);
    }
  }
}

// Export for use in other modules
export { demonstrateHighlightExtraction, sampleArticle };

// Run demonstration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateHighlightExtraction();
}