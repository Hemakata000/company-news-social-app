# Company News Social App - User Guide

## Overview

The Company News Social App is a web application that helps you discover company news and generate social media content. It consists of a React frontend and Node.js backend that work together to provide a seamless experience.

## Features

### 🔍 News Discovery
- Search for companies by name or ticker symbol
- View recent news articles with relevance scoring
- Filter and sort articles by date, relevance, or sentiment
- Real-time news updates

### 📱 Social Media Content Generation
- Generate platform-specific content for Twitter, LinkedIn, and Facebook
- AI-powered content optimization for each platform
- Customizable tone and style options
- Hashtag suggestions and character count optimization
- Content regeneration with feedback

### 📊 Performance Monitoring
- Real-time application health monitoring
- Performance metrics and analytics
- Error tracking and alerting
- Cache optimization insights

### 🚀 Advanced Features
- Offline content caching
- Progressive Web App (PWA) capabilities
- Keyboard shortcuts for power users
- Responsive design for all devices

## Getting Started

### Prerequisites

Before using the application, ensure you have:
- Node.js 18+ installed
- PostgreSQL database running
- Redis server (optional, for caching)
- API keys for external services (News API, OpenAI, etc.)

### Quick Start

1. **Start the Backend:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Start the Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Open the Application:**
   Navigate to `http://localhost:3000` in your browser

## User Interface Guide

### Home Page

The home page is your starting point for discovering company news and generating content.

#### Search Bar
- **Location:** Top of the page
- **Function:** Search for companies by name or ticker symbol
- **Features:**
  - Auto-complete suggestions
  - Search history
  - Recent searches quick access

#### Company News Section
- **Location:** Main content area
- **Function:** Display news articles for selected companies
- **Features:**
  - Article cards with title, summary, and metadata
  - Relevance scoring and sentiment analysis
  - Source attribution and publication date
  - Direct links to original articles

#### Social Media Content Panel
- **Location:** Right sidebar (desktop) or bottom section (mobile)
- **Function:** Generate and manage social media content
- **Features:**
  - Platform selection (Twitter, LinkedIn, Facebook)
  - Tone and style customization
  - Real-time character count
  - Copy to clipboard functionality

### Navigation

#### Main Navigation
- **Home:** Return to the main dashboard
- **About:** Learn more about the application
- **Health:** View system status and performance metrics

#### Keyboard Shortcuts
- `Ctrl/Cmd + K`: Focus search bar
- `Ctrl/Cmd + G`: Generate content for selected article
- `Ctrl/Cmd + C`: Copy generated content
- `Escape`: Close modals and clear selections

## Using the Application

### Searching for Companies

1. **Basic Search:**
   - Type a company name in the search bar
   - Select from auto-complete suggestions
   - Press Enter or click the search button

2. **Advanced Search:**
   - Use ticker symbols (e.g., "AAPL" for Apple)
   - Search by industry keywords
   - Use filters to narrow results

### Viewing News Articles

1. **Article List:**
   - Articles are displayed in relevance order
   - Each card shows title, summary, and metadata
   - Click on any article to view details

2. **Article Details:**
   - Full article summary
   - Publication information
   - Sentiment analysis
   - Related articles suggestions

3. **Filtering and Sorting:**
   - Sort by date, relevance, or sentiment
   - Filter by source, date range, or sentiment
   - Use search within results

### Generating Social Media Content

1. **Select an Article:**
   - Click on any news article
   - The article will be highlighted and selected

2. **Choose Platforms:**
   - Select target platforms (Twitter, LinkedIn, Facebook)
   - Each platform has optimized content formats

3. **Customize Content:**
   - Choose tone: Professional, Casual, or Enthusiastic
   - Enable/disable hashtags
   - Add custom instructions

4. **Generate Content:**
   - Click "Generate Content" button
   - Wait for AI processing (usually 2-5 seconds)
   - Review generated content

5. **Edit and Refine:**
   - Use inline editing to modify content
   - Regenerate with feedback
   - Check character counts for each platform

6. **Copy and Share:**
   - Use copy buttons for each platform
   - Content is automatically formatted
   - Paste directly into social media platforms

### Content Management

#### Saving Content
- Generated content is automatically saved
- Access recent content from the history panel
- Export content to various formats

#### Content History
- View previously generated content
- Search through content history
- Reuse and modify existing content

#### Batch Generation
- Select multiple articles
- Generate content for all at once
- Manage bulk content operations

## Advanced Features

### Offline Mode

The application works offline with cached content:
- **Automatic Caching:** Recent articles and generated content
- **Offline Indicator:** Shows when you're offline
- **Sync on Reconnect:** Updates when connection is restored

### Performance Optimization

#### Lazy Loading
- Articles load as you scroll
- Images load on demand
- Reduces initial page load time

#### Caching Strategy
- Intelligent content caching
- Background updates
- Cache invalidation for fresh content

### Accessibility

#### Keyboard Navigation
- Full keyboard support
- Tab navigation through all elements
- Screen reader compatibility

#### Visual Accessibility
- High contrast mode support
- Scalable text and UI elements
- Color-blind friendly design

## Troubleshooting

### Common Issues

#### "No articles found"
- **Cause:** Company name not recognized or no recent news
- **Solution:** Try different search terms or check spelling

#### "Content generation failed"
- **Cause:** AI service unavailable or rate limits exceeded
- **Solution:** Wait a moment and try again, or check system status

#### "Application is slow"
- **Cause:** Network issues or high server load
- **Solution:** Check internet connection and try refreshing

#### "Search not working"
- **Cause:** Backend service issues
- **Solution:** Check health status at `/api/health`

### Error Messages

#### Network Errors
- **"Failed to fetch":** Check internet connection
- **"Service unavailable":** Backend server may be down
- **"Rate limit exceeded":** Wait before making more requests

#### Content Generation Errors
- **"AI service unavailable":** External AI service is down
- **"Invalid article":** Article may have been removed
- **"Generation timeout":** Request took too long, try again

### Getting Help

#### Health Check
Visit `http://localhost:3001/api/health` to check system status

#### Log Files
Check the following for detailed error information:
- Backend logs: `backend/logs/`
- Browser console: F12 → Console tab

#### Support Information
- Application version: Check About page
- System requirements: See installation guide
- Known issues: Check project documentation

## Tips and Best Practices

### Effective Searching
- Use specific company names for better results
- Try both company names and ticker symbols
- Use industry keywords for broader searches

### Content Generation
- Be specific with custom instructions
- Review and edit generated content before posting
- Test different tones for different audiences
- Keep platform character limits in mind

### Performance
- Close unused browser tabs to improve performance
- Clear cache if experiencing issues
- Use keyboard shortcuts for faster navigation

### Security
- Don't share API keys or sensitive information
- Log out when using shared computers
- Keep the application updated

## Keyboard Shortcuts Reference

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Focus search bar |
| `Ctrl/Cmd + G` | Generate content |
| `Ctrl/Cmd + C` | Copy content |
| `Ctrl/Cmd + R` | Refresh articles |
| `Escape` | Close modals |
| `Tab` | Navigate elements |
| `Enter` | Confirm actions |
| `Space` | Select/toggle |
| `Arrow Keys` | Navigate lists |

## FAQ

**Q: How often is news data updated?**
A: News articles are updated every 15 minutes automatically.

**Q: Can I use this for commercial purposes?**
A: Check the license terms and API usage policies.

**Q: How accurate is the sentiment analysis?**
A: Sentiment analysis is AI-powered with approximately 85% accuracy.

**Q: Can I customize the content generation prompts?**
A: Yes, use the custom prompt field when generating content.

**Q: Is my data stored or shared?**
A: Generated content is cached temporarily but not permanently stored or shared.

**Q: What browsers are supported?**
A: Modern browsers including Chrome, Firefox, Safari, and Edge.

**Q: Can I use this on mobile devices?**
A: Yes, the application is fully responsive and mobile-friendly.

**Q: How do I report bugs or request features?**
A: Use the feedback form in the About section or contact support.