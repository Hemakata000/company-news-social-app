/**
 * Example usage of the enhanced Social Media Content Generation Service
 * 
 * This example demonstrates how to generate platform-specific social media content
 * with proper character limits, hashtag optimization, and platform-specific strategies.
 */

import { ContentGenerationService } from '../ContentGenerationService.js';
import type { NewsHighlight, AIServiceConfig } from '../types.js';

// Example configuration
const config: AIServiceConfig = {
  openaiApiKey: process.env.OPENAI_API_KEY || 'your-api-key',
  model: 'gpt-4',
  maxTokens: 1500,
  temperature: 0.7,
  timeoutMs: 30000
};

// Example news highlights
const exampleHighlights: NewsHighlight[] = [
  {
    text: 'Apple reported record Q3 revenue of $81.4 billion, up 1% year-over-year',
    importance: 5,
    category: 'financial'
  },
  {
    text: 'iPhone sales declined 2.4% but Services revenue grew 8.2% to $21.2 billion',
    importance: 4,
    category: 'financial'
  },
  {
    text: 'Company announced new AI features coming to iOS 18 this fall',
    importance: 4,
    category: 'strategic'
  }
];

async function demonstrateSocialMediaGeneration() {
  const contentService = new ContentGenerationService(config);
  
  try {
    console.log('🚀 Generating social media content for Apple...\n');

    // Generate content for all platforms
    const socialContent = await contentService.generateSocialContent(
      exampleHighlights,
      'Apple Inc.',
      ['linkedin', 'twitter', 'facebook', 'instagram'],
      'professional'
    );

    console.log(`✅ Generated ${socialContent.posts.length} social media posts`);
    console.log(`⏱️  Processing time: ${socialContent.processingTime}ms\n`);

    // Display results by platform
    const platformGroups = socialContent.posts.reduce((groups, post) => {
      if (!groups[post.platform]) {
        groups[post.platform] = [];
      }
      groups[post.platform].push(post);
      return groups;
    }, {} as Record<string, typeof socialContent.posts>);

    for (const [platform, posts] of Object.entries(platformGroups)) {
      console.log(`📱 ${platform.toUpperCase()} Posts:`);
      console.log('─'.repeat(50));
      
      posts.forEach((post, index) => {
        console.log(`\n${index + 1}. Content (${post.characterCount} chars):`);
        console.log(`"${post.content}"`);
        console.log(`Hashtags: ${post.hashtags.join(' ')}`);
        console.log(`Full post: "${post.content} ${post.hashtags.join(' ')}"`);
      });
      
      console.log('\n');
    }

    // Demonstrate platform-specific features
    console.log('🎯 Platform-Specific Features:');
    console.log('─'.repeat(50));
    
    const linkedinPosts = socialContent.posts.filter(p => p.platform === 'linkedin');
    const twitterPosts = socialContent.posts.filter(p => p.platform === 'twitter');
    const facebookPosts = socialContent.posts.filter(p => p.platform === 'facebook');
    const instagramPosts = socialContent.posts.filter(p => p.platform === 'instagram');

    console.log(`LinkedIn: ${linkedinPosts.length} posts, avg ${Math.round(linkedinPosts.reduce((sum, p) => sum + p.characterCount, 0) / linkedinPosts.length)} chars`);
    console.log(`Twitter: ${twitterPosts.length} posts, avg ${Math.round(twitterPosts.reduce((sum, p) => sum + p.characterCount, 0) / twitterPosts.length)} chars`);
    console.log(`Facebook: ${facebookPosts.length} posts, avg ${Math.round(facebookPosts.reduce((sum, p) => sum + p.characterCount, 0) / facebookPosts.length)} chars`);
    console.log(`Instagram: ${instagramPosts.length} posts, avg ${Math.round(instagramPosts.reduce((sum, p) => sum + p.characterCount, 0) / instagramPosts.length)} chars`);

  } catch (error) {
    console.error('❌ Error generating social media content:', error);
  }
}

async function demonstrateHashtagOptimization() {
  const contentService = new ContentGenerationService(config);
  
  try {
    console.log('\n🏷️  Hashtag Optimization Demo...\n');

    // Generate content with different tones
    const tones: Array<'professional' | 'casual' | 'enthusiastic'> = ['professional', 'casual', 'enthusiastic'];
    
    for (const tone of tones) {
      console.log(`📝 ${tone.toUpperCase()} tone for LinkedIn:`);
      
      const content = await contentService.generateSocialContent(
        exampleHighlights.slice(0, 1), // Use just one highlight
        'Apple Inc.',
        ['linkedin'],
        tone
      );

      const post = content.posts[0];
      console.log(`Content: "${post.content}"`);
      console.log(`Hashtags: ${post.hashtags.join(' ')}`);
      console.log(`Character count: ${post.characterCount}/300\n`);
    }

  } catch (error) {
    console.error('❌ Error in hashtag optimization demo:', error);
  }
}

// Run the examples
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateSocialMediaGeneration()
    .then(() => demonstrateHashtagOptimization())
    .then(() => console.log('✨ Demo completed!'))
    .catch(console.error);
}

export {
  demonstrateSocialMediaGeneration,
  demonstrateHashtagOptimization,
  exampleHighlights
};