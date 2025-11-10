# AI Service Fallback Mechanism

This document describes the implementation of the AI service fallback mechanism for task 4.3.

## Overview

The AI service fallback mechanism provides automatic failover between OpenAI and Claude AI services, ensuring high availability and content quality for the Company News Social App.

## Components Implemented

### 1. ClaudeClient (`ClaudeClient.ts`)
- **Purpose**: Backup AI service client using Anthropic's Claude API
- **Features**:
  - Highlight extraction from news articles
  - Social media content generation
  - Health checking capabilities
  - Error handling with proper error types
  - Content validation and formatting

### 2. AIServiceHealthChecker (`AIServiceHealthChecker.ts`)
- **Purpose**: Monitors health of both OpenAI and Claude services
- **Features**:
  - Periodic health checks (configurable interval, default 5 minutes)
  - Service priority determination based on health and response time
  - Automatic service marking as unhealthy during runtime failures
  - Health status caching to avoid excessive API calls
  - Primary/fallback service selection logic

### 3. ContentQualityValidator (`ContentQualityValidator.ts`)
- **Purpose**: Validates the quality of AI-generated content
- **Features**:
  - Highlight quality scoring (0-100 scale)
  - Social media content validation
  - Platform-specific optimization checks
  - Character limit validation
  - Hashtag quality assessment
  - Content appropriateness validation

### 4. AIServiceWithFallback (`AIServiceWithFallback.ts`)
- **Purpose**: Main service orchestrator with automatic fallback
- **Features**:
  - Automatic service selection based on health status
  - Quality-based result selection
  - Comprehensive error handling and retry logic
  - Performance monitoring and metrics
  - Graceful degradation when services fail

## Configuration

### Environment Variables
```bash
# Primary AI service (OpenAI)
OPENAI_API_KEY=your_openai_api_key_here

# Fallback AI service (Claude)
CLAUDE_API_KEY=your_claude_api_key_here

# AI configuration (applies to both services)
AI_MODEL=gpt-4  # or claude-3-sonnet-20240229 for Claude
AI_MAX_TOKENS=1000
AI_TEMPERATURE=0.3
AI_TIMEOUT_MS=30000
```

### Service Priority
1. **Primary Service**: Determined by health status and availability
2. **Fallback Service**: Used when primary fails or produces low-quality content
3. **Default Preference**: OpenAI is preferred when both services are equally healthy

## Usage Examples

### Basic Usage
```typescript
import { AIServiceWithFallback } from './services/ai/AIServiceWithFallback.js';
import { aiConfig } from './config/ai.js';

const aiService = new AIServiceWithFallback(aiConfig);

// Extract highlights with automatic fallback
const response = await aiService.extractHighlights({
  title: 'Company News Title',
  content: 'Article content...',
  sourceName: 'News Source',
  companyName: 'Company Name'
});

console.log('Service used:', response.primaryAttempt.service);
console.log('Quality score:', response.finalQualityScore);
```

### Health Monitoring
```typescript
// Check service health
const health = await aiService.getServiceHealth();
console.log('Primary service:', health.primaryService);
console.log('Fallback service:', health.fallbackService);

// Force health check
const allHealth = await aiService.checkAllServicesHealth();
allHealth.forEach(service => {
  console.log(`${service.service}: ${service.status}`);
});
```

## Quality Validation

### Highlight Quality Metrics
- **Content Length**: 10-300 characters
- **Concreteness**: Presence of numbers, specific facts
- **Company Relevance**: Mentions company name or relevant terms
- **Importance Scoring**: Valid 1-5 scale
- **Category Classification**: Proper business category assignment

### Social Content Quality Metrics
- **Character Limits**: Platform-specific validation
- **Hashtag Quality**: Format, relevance, and quantity
- **Platform Optimization**: Content style appropriate for platform
- **Tone Appropriateness**: Professional vs. casual tone matching

## Error Handling

### Service-Level Errors
- **API Failures**: Network timeouts, authentication errors
- **Rate Limiting**: Automatic retry with exponential backoff
- **Content Parsing**: JSON parsing and validation errors

### Fallback Scenarios
1. **Primary Service Down**: Automatic switch to fallback service
2. **Low Quality Content**: Retry with alternative service
3. **Partial Failures**: Best available result selection
4. **Complete Failure**: Graceful error reporting with context

## Performance Considerations

### Health Check Optimization
- **Caching**: Health status cached for 5 minutes by default
- **Lightweight Checks**: Minimal token usage for health verification
- **Parallel Execution**: Multiple service health checks run concurrently

### Response Time Optimization
- **Service Selection**: Faster service preferred when quality is equal
- **Timeout Management**: Configurable timeouts prevent hanging requests
- **Quality Thresholds**: Configurable minimum quality scores

## Testing

### Unit Tests
- Service initialization and configuration
- Health checking functionality
- Error handling scenarios
- Quality validation logic

### Integration Tests
- End-to-end fallback scenarios
- Service health monitoring
- Content quality validation
- Performance benchmarking

## Monitoring and Observability

### Metrics Tracked
- **Service Health**: Status, response times, error rates
- **Content Quality**: Quality scores, validation failures
- **Fallback Usage**: Primary vs. fallback service usage
- **Performance**: Processing times, timeout rates

### Logging
- Service health changes
- Fallback activations
- Quality validation failures
- Performance anomalies

## Requirements Satisfied

### Requirement 3.1 (LinkedIn Content Generation)
- ✅ Fallback ensures LinkedIn content generation availability
- ✅ Quality validation ensures professional content standards
- ✅ Platform-specific optimization for LinkedIn audience

### Requirement 4.1 (Content Generation Reliability)
- ✅ Multiple AI service providers for redundancy
- ✅ Automatic failover maintains service availability
- ✅ Quality validation ensures consistent output standards

## Dependencies

### Required Packages
```json
{
  "openai": "^4.20.1",
  "@anthropic-ai/sdk": "^0.24.3"
}
```

### Optional Dependencies
- Redis (for advanced health status caching)
- Monitoring tools (for observability)

## Future Enhancements

### Planned Improvements
1. **Advanced Load Balancing**: Distribute requests based on service capacity
2. **Cost Optimization**: Route requests to most cost-effective service
3. **A/B Testing**: Compare content quality between services
4. **Custom Models**: Support for fine-tuned models per service
5. **Caching Layer**: Cache high-quality responses to reduce API calls

### Scalability Considerations
- **Service Pool**: Support for multiple instances of each service type
- **Geographic Distribution**: Route to nearest service endpoint
- **Rate Limit Management**: Intelligent request distribution
- **Circuit Breaker**: Prevent cascade failures during outages