/**
 * Example demonstrating the AI service fallback mechanism
 * 
 * This example shows how the AIServiceWithFallback automatically:
 * 1. Checks service health
 * 2. Attempts primary service first
 * 3. Falls back to secondary service if needed
 * 4. Validates content quality
 * 5. Returns the best available result
 */

import { AIServiceWithFallback } from '../AIServiceWithFallback.js';
import { aiConfig } from '../../../config/ai.js';
import type { HighlightExtractionRequest, SocialContentRequest } from '../types.js';

async function demonstrateFallbackMechanism() {
  console.log('🔄 Initializing AI Service with Fallback...');
  
  // Initialize the service with fallback capability
  const aiService = new AIServiceWithFallback(aiConfig);

  // Check initial service health
  console.log('\n📊 Checking service health...');
  const healthStatus = await aiService.getServiceHealth();
  console.log('Primary service:', healthStatus.primaryService);
  console.log('Fallback service:', healthStatus.fallbackService);
  
  if (healthStatus.openai) {
    console.log('OpenAI status:', healthStatus.openai.status);
  }
  
  if (healthStatus.claude) {
    console.log('Claude status:', healthStatus.claude.status);
  }

  // Example 1: Highlight extraction with fallback
  console.log('\n🎯 Testing highlight extraction with fallback...');
  
  const highlightRequest: HighlightExtractionRequest = {
    title: 'Apple Reports Record Q4 Earnings',
    content: `Apple Inc. today announced financial results for its fiscal 2023 fourth quarter ended September 30, 2023. 
    The company posted quarterly revenue of $89.5 billion, down 1 percent year over year, and quarterly earnings per share of $1.46, 
    up 13 percent year over year. iPhone revenue was $43.8 billion, up 3 percent year over year. 
    Services revenue reached an all-time high of $22.3 billion, up 16 percent year over year.`,
    sourceName: 'Apple Press Release',
    companyName: 'Apple'
  };

  try {
    const highlightResponse = await aiService.extractHighlights(highlightRequest);
    
    console.log('✅ Highlight extraction successful!');
    console.log('Primary attempt:', highlightResponse.primaryAttempt.service, 
                highlightResponse.primaryAttempt.success ? '✅' : '❌');
    
    if (highlightResponse.fallbackAttempt) {
      console.log('Fallback attempt:', highlightResponse.fallbackAttempt.service, 
                  highlightResponse.fallbackAttempt.success ? '✅' : '❌');
    }
    
    console.log('Final quality score:', highlightResponse.finalQualityScore);
    console.log('Total processing time:', highlightResponse.totalProcessingTime, 'ms');
    console.log('Highlights found:', highlightResponse.data.highlights.length);
    
    // Show first highlight as example
    if (highlightResponse.data.highlights.length > 0) {
      const firstHighlight = highlightResponse.data.highlights[0];
      console.log('Example highlight:', {
        text: firstHighlight.text.substring(0, 100) + '...',
        importance: firstHighlight.importance,
        category: firstHighlight.category
      });
    }

    // Example 2: Social content generation with fallback
    console.log('\n📱 Testing social content generation with fallback...');
    
    const socialRequest: SocialContentRequest = {
      highlights: highlightResponse.data.highlights.slice(0, 3), // Use top 3 highlights
      companyName: 'Apple',
      platforms: ['linkedin', 'twitter'],
      tone: 'professional'
    };

    const socialResponse = await aiService.generateSocialContent(socialRequest);
    
    console.log('✅ Social content generation successful!');
    console.log('Primary attempt:', socialResponse.primaryAttempt.service, 
                socialResponse.primaryAttempt.success ? '✅' : '❌');
    
    if (socialResponse.fallbackAttempt) {
      console.log('Fallback attempt:', socialResponse.fallbackAttempt.service, 
                  socialResponse.fallbackAttempt.success ? '✅' : '❌');
    }
    
    console.log('Final quality score:', socialResponse.finalQualityScore);
    console.log('Posts generated:', socialResponse.data.posts.length);
    
    // Show example posts
    socialResponse.data.posts.forEach((post, index) => {
      console.log(`\nPost ${index + 1} (${post.platform}):`);
      console.log('Content:', post.content.substring(0, 100) + '...');
      console.log('Hashtags:', post.hashtags.join(' '));
      console.log('Character count:', post.characterCount);
    });

  } catch (error) {
    console.error('❌ Service failed:', error instanceof Error ? error.message : 'Unknown error');
    
    // Even if both services fail, we can still check their individual health
    console.log('\n🔍 Checking individual service health after failure...');
    const allHealthResults = await aiService.checkAllServicesHealth();
    
    allHealthResults.forEach(health => {
      console.log(`${health.service}: ${health.status}`, 
                  health.error ? `(${health.error})` : '');
    });
  }

  // Example 3: Demonstrating health status reset
  console.log('\n🔄 Demonstrating health status reset...');
  aiService.resetHealthStatus();
  console.log('Health status reset - next request will force fresh health check');
}

// Export for use in other examples or tests
export { demonstrateFallbackMechanism };

// Run example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateFallbackMechanism()
    .then(() => {
      console.log('\n✅ Fallback mechanism demonstration completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Demonstration failed:', error);
      process.exit(1);
    });
}