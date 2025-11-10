# AI Content Generation Service

This module provides AI-powered content generation capabilities for the Company News Social App, including news highlight extraction and social media content generation.

## Features

- **Highlight Extraction**: Extract 3-5 key highlights from news articles using OpenAI GPT models
- **Enhanced Social Media Content Generation**: Generate optimized, platform-specific social media posts for LinkedIn, Twitter, Facebook, and Instagram
- **Character Limit Enforcement**: Automatic content trimming to meet strict platform requirements
- **Advanced Hashtag Optimization**: Intelligent hashtag generation with platform-specific strategies and relevance scoring
- **Multiple Content Variations**: Generate 2-3 variations per platform for A/B testing and engagement optimization
- **Content Validation**: Validate and format generated content with proper error handling
- **Health Monitoring**: Monitor AI service health and performance
- **Fallback Support**: Template-based generation when AI services are unavailable

## Components

### ContentGenerationService
High-level service that orchestrates content generation workflows with enhanced social media capabilities.

```typescript
import { ContentGenerationService } from './ContentGenerationService.js';

const service = new ContentGenerationService(aiConfig);

// Extract highlights from news article
const highlights = await service.extractHighlightsFromArticle(article, 'Apple Inc.');

// Generate enhanced social media content for all platforms
const socialContent = await service.generateSocialContent(
  highlights,
  'Apple Inc.',
  ['linkedin', 'twitter', 'facebook', 'instagram'],
  'professional'
);

// Access platform-specific posts
socialContent.posts.forEach(post => {
  console.log(`${post.platform}: ${post.content}`);
  console.log(`Hashtags: ${post.hashtags.join(' ')}`);
  console.log(`Characters: ${post.characterCount}/${getCharacterLimit(post.platform)}`);
});
```

### SocialMediaContentService
Specialized service for advanced social media content generation with platform-specific optimization.

```typescript
import { SocialMediaContentService } from './SocialMediaContentService.js';

const socialService = new SocialMediaContentService(aiConfig);

// Generate platform-specific content with advanced features
const content = await socialService.generatePlatformSpecificContent(
  highlights,
  'Apple Inc.',
  ['linkedin', 'twitter'],
  'professional'
);
```

### OpenAIClient
Core client for interacting with OpenAI's API with enhanced social media prompt engineering.

```typescript
import { OpenAIClient } from './OpenAIClient.js';

const client = new OpenAIClient(aiConfig);

// Extract highlights with improved categorization
const highlights = await client.extractHighlights({
  title: 'Company News Title',
  content: 'Article content...',
  sourceName: 'News Source',
  companyName: 'Company Name'
});
```

## Configuration

Set the following environment variables:

```bash
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional (with defaults)
AI_MODEL=gpt-4
AI_MAX_TOKENS=1000
AI_TEMPERATURE=0.3
AI_TIMEOUT_MS=30000
```

## Error Handling

The service implements comprehensive error handling:

- **API Errors**: Network issues, rate limits, invalid API keys
- **Parsing Errors**: Invalid JSON responses, malformed data
- **Validation Errors**: Content validation failures
- **Service Errors**: Health check failures, timeout errors

All errors implement the `AIServiceError` interface with structured error codes.

## Platform Specifications

### LinkedIn
- **Character Limit**: 300 characters (optimal: 150)
- **Hashtag Limit**: 5 hashtags
- **Style**: Professional, business-focused, industry insights
- **Engagement**: Questions, insights, industry trends, thought leadership

### Twitter
- **Character Limit**: 280 characters (optimal: 200)
- **Hashtag Limit**: 3 hashtags
- **Style**: Concise, news-worthy, real-time updates
- **Engagement**: Breaking news angle, trending topics, quick takes

### Facebook
- **Character Limit**: 250 characters (optimal: 180)
- **Hashtag Limit**: 4 hashtags
- **Style**: Community-focused, discussion starters, storytelling
- **Engagement**: Questions, stories, community building

### Instagram
- **Character Limit**: 200 characters (optimal: 150)
- **Hashtag Limit**: 5 hashtags
- **Style**: Visual storytelling, lifestyle angle, behind-the-scenes
- **Engagement**: Visual hooks, story elements, aspirational content

## Content Validation

### Highlight Validation
- Text content: 10-500 characters
- Importance: 1-5 scale
- Category: financial, operational, strategic, market, general
- Duplicate detection
- Quality scoring

### Enhanced Social Media Validation
- **Character Limit Enforcement**: Automatic content trimming with smart truncation
- **Hashtag Optimization**: Platform-specific hashtag limits and relevance scoring
- **Content Quality**: Engagement optimization and platform-appropriate tone
- **Multiple Variations**: 2-3 content variations per platform for A/B testing

## Performance

- **Response Time**: Typically 2-5 seconds for highlight extraction
- **Caching**: Results can be cached to reduce API calls
- **Rate Limiting**: Respects OpenAI API rate limits
- **Timeout Handling**: Configurable timeouts with graceful degradation

## Testing

Run tests with:

```bash
npm test -- --testPathPattern=ai
```

The test suite includes:
- Unit tests for all major functions
- Mock API responses for reliable testing
- Error scenario testing
- Performance benchmarking

## Examples

See the `examples/` directory for comprehensive demonstrations:
- `highlightExtraction.ts`: News highlight extraction workflow
- `socialMediaGeneration.ts`: Enhanced social media content generation with platform-specific optimization

## Requirements Satisfied

This implementation satisfies the following requirements:

- **Requirement 2.1**: Extract 3-5 News_Highlights from each retrieved news article
- **Requirement 2.2**: Display News_Highlights in a clear, scannable format  
- **Requirement 2.3**: Prioritize the most significant information for highlights
- **Requirement 3.1**: Create 2-3 Social_Captions optimized for LinkedIn sharing
- **Requirement 3.2**: Ensure Social_Captions are between 50-300 characters in length
- **Requirement 3.3**: Include relevant hashtags in Social_Captions
- **Requirement 4.1**: Create platform-specific content variations for Twitter, Facebook, and Instagram
- **Requirement 4.2**: Adapt content length and style for each platform's requirements

## Future Enhancements

- Claude API integration for fallback support
- Content quality scoring and optimization
- Multi-language support
- Custom prompt templates
- Advanced content personalization