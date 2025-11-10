# Company News Social App

A modern web application that aggregates company news and generates social media content using AI.

## 🚀 Features

- **📰 News Aggregation**: Fetch and display recent news articles for companies
- **🤖 AI-Powered Content Generation**: Generate social media posts for Twitter, LinkedIn, and Facebook
- **⚡ Smart Caching**: Redis-based caching for improved performance
- **🔄 Real-time Updates**: Live news updates and content generation
- **📱 Responsive Design**: Works on desktop and mobile devices
- **🔍 Advanced Search**: Company search with auto-complete
- **📊 Performance Monitoring**: Built-in health checks and metrics
- **🛡️ Error Tracking**: Comprehensive error handling and logging

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+ with Express
- **Language**: TypeScript
- **Database**: PostgreSQL with migrations
- **Cache**: Redis (optional)
- **AI Services**: OpenAI GPT-4, Anthropic Claude
- **External APIs**: News API, Alpha Vantage
- **Monitoring**: Built-in health checks, metrics, and error tracking

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with optimizations
- **Styling**: Modern CSS with responsive design
- **Features**: PWA capabilities, offline support, service worker
- **Performance**: Lazy loading, code splitting, caching

## 📋 Prerequisites

Before setting up the application, ensure you have:

- **Node.js** 18 or higher ([Download](https://nodejs.org/))
- **PostgreSQL** 12 or higher ([Download](https://www.postgresql.org/download/))
- **Redis** (optional, for caching) ([Download](https://redis.io/download))
- **API Keys** for external services (see setup guide)

## 🚀 Quick Start

### 1. Installation

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database Setup

```sql
-- Create database and user
CREATE DATABASE company_news_db;
CREATE USER app_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE company_news_db TO app_user;
```

### 3. Environment Configuration

**Backend (.env):**
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

**Frontend (.env):**
```bash
cd frontend
cp .env.example .env
# Edit .env with your configuration
```

### 4. Database Migration

```bash
cd backend
npm run migrate
```

### 5. Start the Application

**Development Mode:**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Production Mode (Windows):**
```bash
# Build applications
cd backend && npm run build:prod
cd ../frontend && npm run build:prod

# Start services manually or use provided scripts
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/health

## 📚 Documentation

### Complete Guides
- **[Setup Guide](docs/SETUP.md)** - Detailed installation and configuration
- **[API Documentation](docs/API.md)** - Complete API reference with examples
- **[User Guide](docs/USER_GUIDE.md)** - How to use the application

### Quick References
- **[Environment Variables](#environment-variables)** - Configuration options
- **[API Endpoints](#api-endpoints)** - Available endpoints
- **[Testing](#testing)** - How to test the application

## 🔧 Environment Variables

### Backend Configuration

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `REDIS_URL` | Redis connection string | No | - |
| `NEWS_API_KEY` | News API key | Yes | - |
| `OPENAI_API_KEY` | OpenAI API key | Yes | - |
| `CLAUDE_API_KEY` | Anthropic Claude API key | No | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `PORT` | Server port | No | 3001 |
| `NODE_ENV` | Environment mode | No | development |

### Frontend Configuration

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_API_BASE_URL` | Backend API URL | Yes | http://localhost:3001/api |
| `VITE_APP_NAME` | Application name | No | Company News Social App |

## 🌐 API Endpoints

### News Endpoints
- `GET /api/news/:companyName` - Get news for a company
- `GET /api/news/:companyName/recent` - Get recent news (24h)
- `GET /api/news/search/companies?q=query` - Search companies

### Content Generation
- `POST /api/content/generate` - Generate social media content
- `POST /api/content/generate/batch` - Batch content generation
- `POST /api/content/regenerate/:articleId` - Regenerate with feedback

### Health & Monitoring
- `GET /api/health` - Application health status
- `GET /api/health/metrics` - Performance metrics
- `GET /api/health/errors` - Error tracking information
- `GET /api/health/ready` - Readiness probe
- `GET /api/health/live` - Liveness probe

## 🧪 Testing

### Manual Testing

```bash
# Test health endpoint
curl http://localhost:3001/api/health

# Test company search
curl "http://localhost:3001/api/news/search/companies?q=apple"

# Test news fetching
curl "http://localhost:3001/api/news/apple?limit=5"

# Test content generation
curl -X POST "http://localhost:3001/api/content/generate" \
  -H "Content-Type: application/json" \
  -d '{"articleId":"test","platforms":["twitter"]}'
```

## 📁 Project Structure

```
company-news-social-app/
├── backend/                    # Node.js backend
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── middleware/        # Express middleware
│   │   ├── models/            # Database models
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   └── utils/             # Utility functions
│   ├── migrations/            # Database migrations
│   └── package.json
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   └── utils/             # Utility functions
│   ├── public/                # Static assets
│   └── package.json
├── scripts/                    # Deployment scripts
│   ├── deploy.sh              # Full deployment
│   ├── start-production.sh    # Start services
│   ├── stop-production.sh     # Stop services
│   └── test-local.sh          # Local testing
├── docs/                       # Documentation
│   ├── API.md                 # API documentation
│   ├── SETUP.md               # Setup guide
│   └── USER_GUIDE.md          # User guide
├── .kiro/                      # Kiro specifications
└── README.md                   # This file
```

## 🔧 Development

### Available Scripts

#### Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run build:prod   # Build with production optimizations
npm run start        # Start production server
npm run start:prod   # Start with production environment
npm run migrate      # Run database migrations
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

#### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run build:prod   # Build with production optimizations
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

## 🚀 Deployment

### Local Production

```bash
# Build applications
cd backend && npm run build:prod
cd ../frontend && npm run build:prod

# Start production services (manual)
cd backend && npm run start:prod
# In another terminal
cd frontend && npm run serve
```

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] API keys valid and active
- [ ] Health checks passing
- [ ] Performance metrics acceptable
- [ ] Error tracking configured

## 📊 Monitoring

### Health Monitoring
- **Health Endpoint**: `/api/health` - Overall system status
- **Metrics**: `/api/health/metrics` - Performance data
- **Alerts**: Built-in alerting for critical issues

### Performance Metrics
- Response times and throughput
- Cache hit rates and efficiency
- Database query performance
- External API response times
- Error rates and types

### Error Tracking
- Automatic error capture and grouping
- Request context and stack traces
- Error resolution tracking
- Performance impact analysis

## 🐛 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check PostgreSQL is running
# Verify connection string in .env
DATABASE_URL=postgresql://user:pass@localhost:5432/db
```

**API Keys Not Working**
```bash
# Verify keys in .env file
# Check API quotas and limits
# Ensure keys are active
```

**Port Already in Use**
```bash
# Change port in .env
PORT=3002
```

### Getting Help

1. **Check Health**: Visit `/api/health` for system status
2. **Review Logs**: Check console output for detailed errors
3. **Documentation**: Review setup and user guides
4. **Issues**: Create GitHub issue with error details

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Update documentation as needed
- Follow the existing code style
- Test thoroughly before submitting

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **OpenAI** for GPT-4 API
- **Anthropic** for Claude API
- **News API** for news data
- **Alpha Vantage** for financial data
- **React** and **Node.js** communities