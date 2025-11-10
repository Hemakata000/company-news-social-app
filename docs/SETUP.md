# Company News Social App - Setup Guide

## Prerequisites

Before setting up the application, ensure you have the following installed:

### Required Software

1. **Node.js** (version 18 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **npm** (comes with Node.js)
   - Verify installation: `npm --version`

3. **PostgreSQL** (version 12 or higher)
   - Download from [postgresql.org](https://www.postgresql.org/download/)
   - Verify installation: `psql --version`

### Optional Software

4. **Redis** (for caching - improves performance)
   - Download from [redis.io](https://redis.io/download)
   - Verify installation: `redis-cli --version`

5. **Git** (for version control)
   - Download from [git-scm.com](https://git-scm.com/)
   - Verify installation: `git --version`

## Database Setup

### PostgreSQL Configuration

1. **Create Database:**
   ```sql
   CREATE DATABASE company_news_db;
   CREATE USER app_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE company_news_db TO app_user;
   ```

2. **Test Connection:**
   ```bash
   psql -h localhost -U app_user -d company_news_db
   ```

### Redis Configuration (Optional)

1. **Start Redis Server:**
   ```bash
   redis-server
   ```

2. **Test Connection:**
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

## API Keys Setup

You'll need API keys for external services:

### Required API Keys

1. **News API** (for news data)
   - Sign up at [newsapi.org](https://newsapi.org/)
   - Get your API key from the dashboard

2. **Alpha Vantage** (for financial data)
   - Sign up at [alphavantage.co](https://www.alphavantage.co/)
   - Get your free API key

3. **OpenAI** (for content generation)
   - Sign up at [openai.com](https://openai.com/)
   - Create an API key in your account settings

### Optional API Keys

4. **Anthropic Claude** (alternative AI service)
   - Sign up at [anthropic.com](https://www.anthropic.com/)
   - Get your API key

## Environment Configuration

### Backend Environment Variables

1. **Copy Environment Template:**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Edit Environment File:**
   ```bash
   # Database Configuration
   DATABASE_URL=postgresql://app_user:your_secure_password@localhost:5432/company_news_db
   
   # Redis Configuration (optional)
   REDIS_URL=redis://localhost:6379
   
   # External API Keys
   NEWS_API_KEY=your_news_api_key_here
   ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   CLAUDE_API_KEY=your_claude_api_key_here
   
   # Security
   JWT_SECRET=your_jwt_secret_here_make_it_long_and_random
   CORS_ORIGIN=http://localhost:3000
   
   # Application Settings
   PORT=3001
   NODE_ENV=development
   ```

### Frontend Environment Variables

1. **Copy Environment Template:**
   ```bash
   cd frontend
   cp .env.example .env
   ```

2. **Edit Environment File:**
   ```bash
   VITE_API_BASE_URL=http://localhost:3001/api
   VITE_APP_NAME=Company News Social App
   ```

## Installation Steps

### 1. Clone or Download the Project

If using Git:
```bash
git clone <repository-url>
cd company-news-social-app
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 4. Run Database Migrations

```bash
cd ../backend
npm run migrate
```

This will create the necessary database tables and indexes.

### 5. Verify Installation

Check that all dependencies are installed correctly:

```bash
# Check backend
cd backend
npm run build

# Check frontend
cd ../frontend
npm run build
```

## Running the Application

### Development Mode

1. **Start Backend (Terminal 1):**
   ```bash
   cd backend
   npm run dev
   ```
   
   The backend will start on `http://localhost:3001`

2. **Start Frontend (Terminal 2):**
   ```bash
   cd frontend
   npm run dev
   ```
   
   The frontend will start on `http://localhost:3000`

3. **Open Application:**
   Navigate to `http://localhost:3000` in your browser

### Production Mode

1. **Build Applications:**
   ```bash
   # Build backend
   cd backend
   npm run build:prod
   
   # Build frontend
   cd ../frontend
   npm run build:prod
   ```

2. **Start Production Services:**
   ```bash
   # From project root
   chmod +x scripts/start-production.sh
   ./scripts/start-production.sh
   ```

3. **Stop Production Services:**
   ```bash
   ./scripts/stop-production.sh
   ```

## Verification and Testing

### Health Check

1. **Backend Health:**
   ```bash
   curl http://localhost:3001/api/health
   ```
   
   Should return a JSON response with status "healthy"

2. **Frontend Access:**
   Open `http://localhost:3000` in your browser
   You should see the application homepage

### Test API Endpoints

1. **Search Companies:**
   ```bash
   curl "http://localhost:3001/api/news/search/companies?q=apple"
   ```

2. **Get Company News:**
   ```bash
   curl "http://localhost:3001/api/news/apple?limit=5"
   ```

3. **Generate Content:**
   ```bash
   curl -X POST "http://localhost:3001/api/content/generate" \
     -H "Content-Type: application/json" \
     -d '{"articleId":"test","platforms":["twitter"]}'
   ```

## Troubleshooting

### Common Setup Issues

#### Database Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution:**
- Ensure PostgreSQL is running: `pg_ctl status`
- Check connection details in `.env` file
- Verify database exists and user has permissions

#### Redis Connection Failed
```
Warning: Redis connection failed - running without cache
```
**Solution:**
- Start Redis server: `redis-server`
- Check Redis URL in `.env` file
- Application will work without Redis but with reduced performance

#### API Key Errors
```
Error: Invalid API key for News API
```
**Solution:**
- Verify API keys are correct in `.env` file
- Check API key quotas and limits
- Ensure API keys are active

#### Port Already in Use
```
Error: listen EADDRINUSE :::3001
```
**Solution:**
- Kill existing process: `lsof -ti:3001 | xargs kill -9`
- Or change port in `.env` file

#### Build Errors
```
Error: Cannot resolve module
```
**Solution:**
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear npm cache: `npm cache clean --force`
- Check Node.js version compatibility

### Performance Optimization

#### Enable Caching
- Install and configure Redis for better performance
- Monitor cache hit rates in health endpoint

#### Database Optimization
- Ensure database indexes are created (run migrations)
- Monitor query performance in logs

#### Memory Usage
- Monitor memory usage in health endpoint
- Restart services if memory usage is high

## Development Setup

### Code Editor Setup

**Recommended Extensions for VS Code:**
- ESLint
- Prettier
- TypeScript and JavaScript Language Features
- Auto Rename Tag
- Bracket Pair Colorizer

### Git Hooks (Optional)

Set up pre-commit hooks for code quality:

```bash
# Install husky
npm install --save-dev husky

# Set up pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run format"
```

### Environment-Specific Configurations

#### Development
- Hot reloading enabled
- Detailed error messages
- Debug logging enabled

#### Production
- Optimized builds
- Error tracking enabled
- Performance monitoring active

## Security Considerations

### Environment Variables
- Never commit `.env` files to version control
- Use strong, unique passwords and secrets
- Rotate API keys regularly

### Database Security
- Use strong database passwords
- Limit database user permissions
- Enable SSL connections in production

### API Security
- Monitor API usage and rate limits
- Implement proper error handling
- Use HTTPS in production

## Monitoring and Maintenance

### Log Files
- Backend logs: `backend/logs/`
- Check logs regularly for errors
- Rotate logs to prevent disk space issues

### Health Monitoring
- Use `/api/health` endpoint for monitoring
- Set up alerts for service failures
- Monitor performance metrics

### Updates
- Keep dependencies updated
- Monitor security advisories
- Test updates in development first

## Getting Help

### Documentation
- API Documentation: `docs/API.md`
- User Guide: `docs/USER_GUIDE.md`
- This setup guide

### Debugging
- Check health endpoint: `http://localhost:3001/api/health`
- Review log files for detailed error information
- Use browser developer tools for frontend issues

### Support Resources
- Check GitHub issues for known problems
- Review API provider documentation
- Contact support with specific error messages and logs