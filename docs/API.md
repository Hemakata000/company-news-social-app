# Company News Social App - API Documentation

## Overview

The Company News Social App API provides endpoints for fetching company news, generating social media content, and monitoring application health.

**Base URL:** `http://localhost:3001/api`

**Version:** 1.0.0

## Authentication

Currently, the API does not require authentication. All endpoints are publicly accessible.

## Rate Limiting

- **Window:** 15 minutes
- **Max Requests:** 100 per window per IP
- **Headers:** Rate limit information is returned in response headers

## Error Handling

All errors follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "req_123456789"
  }
}
```

Common error codes:
- `BAD_REQUEST` (400): Invalid request parameters
- `NOT_FOUND` (404): Resource not found
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `INTERNAL_SERVER_ERROR` (500): Server error
- `SERVICE_UNAVAILABLE` (503): External service unavailable

## Endpoints

### Health Check

#### GET /api/health

Returns the overall health status of the application and its dependencies.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": {
    "name": "Company News Social App API",
    "version": "1.0.0",
    "environment": "development",
    "uptime": 3600
  },
  "dependencies": {
    "database": {
      "status": "healthy",
      "type": "postgresql"
    },
    "cache": {
      "status": "healthy",
      "type": "redis",
      "stats": {
        "totalKeys": 150,
        "memoryUsage": "2.5MB"
      }
    }
  },
  "performance": {
    "requests": {
      "total": 1000,
      "successful": 950,
      "failed": 50,
      "averageResponseTime": "250ms"
    },
    "cache": {
      "hitRate": "85.5%"
    }
  }
}
```

#### GET /api/health/metrics

Returns detailed system and application metrics.

**Response:**
```json
{
  "timestamp": "2024-01-01T00:00:00.000Z",
  "system": {
    "memory": {
      "usage": "45.2%",
      "heap": {
        "used": 50000000,
        "total": 100000000
      }
    },
    "cpu": {
      "loadAverage": [1.2, 1.5, 1.8]
    }
  },
  "application": {
    "requests": {
      "total": 1000,
      "successful": 950,
      "failed": 50,
      "averageResponseTime": 250
    },
    "endpoints": {
      "GET /api/news/:companyName": {
        "count": 500,
        "averageResponseTime": 300,
        "errorRate": 0.02
      }
    }
  }
}
```

### News Endpoints

#### GET /api/news/:companyName

Fetch news articles for a specific company.

**Parameters:**
- `companyName` (path): Company name (e.g., "apple", "microsoft")

**Query Parameters:**
- `limit` (optional): Number of articles to return (default: 10, max: 50)
- `offset` (optional): Number of articles to skip (default: 0)

**Example Request:**
```
GET /api/news/apple?limit=5&offset=0
```

**Response:**
```json
{
  "company": "Apple Inc.",
  "articles": [
    {
      "id": "article_123",
      "title": "Apple Reports Strong Q4 Earnings",
      "summary": "Apple Inc. reported better than expected earnings...",
      "url": "https://example.com/article",
      "publishedAt": "2024-01-01T10:00:00.000Z",
      "source": "TechNews",
      "sentiment": "positive",
      "relevanceScore": 0.95
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 5,
    "offset": 0,
    "hasMore": true
  },
  "metadata": {
    "cached": true,
    "cacheExpiry": "2024-01-01T11:00:00.000Z",
    "processingTime": "150ms"
  }
}
```

#### GET /api/news/:companyName/recent

Fetch recent news articles (last 24 hours) for a specific company.

**Parameters:**
- `companyName` (path): Company name

**Response:** Same format as `/api/news/:companyName`

#### GET /api/news/search/companies

Search for companies by name or ticker symbol.

**Query Parameters:**
- `q` (required): Search query
- `limit` (optional): Number of results (default: 10, max: 20)

**Example Request:**
```
GET /api/news/search/companies?q=apple&limit=5
```

**Response:**
```json
{
  "query": "apple",
  "companies": [
    {
      "name": "Apple Inc.",
      "ticker": "AAPL",
      "sector": "Technology",
      "marketCap": "3000000000000",
      "description": "Technology company that designs and manufactures consumer electronics..."
    }
  ],
  "metadata": {
    "total": 1,
    "processingTime": "50ms"
  }
}
```

### Content Generation Endpoints

#### POST /api/content/generate

Generate social media content for a news article.

**Request Body:**
```json
{
  "articleId": "article_123",
  "platforms": ["twitter", "linkedin", "facebook"],
  "tone": "professional",
  "includeHashtags": true,
  "customPrompt": "Focus on the financial implications"
}
```

**Parameters:**
- `articleId` (required): ID of the news article
- `platforms` (required): Array of platforms ("twitter", "linkedin", "facebook")
- `tone` (optional): Content tone ("professional", "casual", "enthusiastic")
- `includeHashtags` (optional): Whether to include hashtags (default: true)
- `customPrompt` (optional): Additional instructions for content generation

**Response:**
```json
{
  "articleId": "article_123",
  "content": {
    "twitter": {
      "text": "🍎 Apple reports record Q4 earnings! Revenue up 15% YoY, driven by strong iPhone sales and services growth. #Apple #Earnings #Tech",
      "characterCount": 142,
      "hashtags": ["#Apple", "#Earnings", "#Tech"],
      "platform": "twitter"
    },
    "linkedin": {
      "text": "Apple Inc. has announced impressive Q4 results, with revenue increasing 15% year-over-year. The growth was primarily driven by robust iPhone sales and expanding services revenue. This demonstrates Apple's continued market leadership and diversification strategy.",
      "characterCount": 285,
      "hashtags": ["#Apple", "#Earnings", "#Technology", "#Business"],
      "platform": "linkedin"
    }
  },
  "metadata": {
    "generatedAt": "2024-01-01T12:00:00.000Z",
    "processingTime": "2.5s",
    "aiModel": "gpt-4",
    "qualityScore": 0.92
  }
}
```

#### POST /api/content/generate/batch

Generate social media content for multiple articles.

**Request Body:**
```json
{
  "articles": [
    {
      "articleId": "article_123",
      "platforms": ["twitter", "linkedin"]
    },
    {
      "articleId": "article_456",
      "platforms": ["facebook"]
    }
  ],
  "tone": "professional",
  "includeHashtags": true
}
```

**Response:**
```json
{
  "results": [
    {
      "articleId": "article_123",
      "status": "success",
      "content": {
        "twitter": { /* content object */ },
        "linkedin": { /* content object */ }
      }
    },
    {
      "articleId": "article_456",
      "status": "success",
      "content": {
        "facebook": { /* content object */ }
      }
    }
  ],
  "summary": {
    "total": 2,
    "successful": 2,
    "failed": 0,
    "processingTime": "4.2s"
  }
}
```

#### POST /api/content/regenerate/:articleId

Regenerate social media content for a specific article.

**Parameters:**
- `articleId` (path): ID of the article

**Request Body:**
```json
{
  "platform": "twitter",
  "feedback": "Make it more engaging and add emojis"
}
```

**Response:** Same format as `/api/content/generate`

#### GET /api/content/health

Check the health status of content generation services.

**Response:**
```json
{
  "status": "healthy",
  "services": {
    "openai": {
      "status": "healthy",
      "responseTime": "1.2s",
      "lastCheck": "2024-01-01T12:00:00.000Z"
    },
    "claude": {
      "status": "healthy",
      "responseTime": "0.8s",
      "lastCheck": "2024-01-01T12:00:00.000Z"
    }
  },
  "fallback": {
    "enabled": true,
    "activeService": "openai"
  }
}
```

## Response Headers

All responses include these headers:
- `X-Request-ID`: Unique request identifier for debugging
- `X-Response-Time`: Response time in milliseconds
- `X-Rate-Limit-Remaining`: Remaining requests in current window
- `X-Rate-Limit-Reset`: Time when rate limit resets

## Caching

The API implements intelligent caching:
- **News articles**: Cached for 15 minutes
- **Company search**: Cached for 1 hour
- **Generated content**: Cached for 30 minutes

Cache headers:
- `X-Cache-Status`: "hit" or "miss"
- `X-Cache-TTL`: Time to live in seconds

## WebSocket Support

Real-time updates are available via WebSocket connection:

**Connection:** `ws://localhost:3001/ws`

**Events:**
- `news-update`: New articles available
- `content-generated`: Content generation completed
- `system-alert`: System health alerts

## SDK Examples

### JavaScript/Node.js

```javascript
const API_BASE = 'http://localhost:3001/api';

// Fetch company news
async function getCompanyNews(company, limit = 10) {
  const response = await fetch(`${API_BASE}/news/${company}?limit=${limit}`);
  return response.json();
}

// Generate social content
async function generateContent(articleId, platforms) {
  const response = await fetch(`${API_BASE}/content/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ articleId, platforms })
  });
  return response.json();
}
```

### Python

```python
import requests

API_BASE = 'http://localhost:3001/api'

def get_company_news(company, limit=10):
    response = requests.get(f'{API_BASE}/news/{company}', 
                          params={'limit': limit})
    return response.json()

def generate_content(article_id, platforms):
    response = requests.post(f'{API_BASE}/content/generate',
                           json={'articleId': article_id, 'platforms': platforms})
    return response.json()
```

## Testing

Use the provided test scripts:

```bash
# Test all endpoints
npm run test:api

# Test specific endpoint
curl -X GET "http://localhost:3001/api/health" -H "Accept: application/json"
```

## Support

For issues or questions:
- Check the health endpoint: `/api/health`
- Review logs in the `logs/` directory
- Use the request ID from response headers for debugging