import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { testConnection, closePool } from './config/database.js';
import { runMigrations } from './migrations/migrate.js';
import { initRedis, testRedisConnection, closeRedis } from './config/redis.js';
import { CacheService } from './utils/cache.js';

// Import routes
import newsRoutes from './routes/news.js';
import contentRoutes from './routes/content.js';
import healthRoutes from './routes/health.js';

// Import middleware
import { addRequestId, handleApiError } from './middleware/errorHandler.js';
import { requestLogger, errorLogger, securityLogger, rateLimitLogger, trackAPIUsage, getPerformanceStats, healthMonitor } from './middleware/logging.js';

// Import production configurations
import { logger } from './config/logging.js';
import { monitoring } from './config/monitoring.js';
import { errorTracking } from './config/errorTracking.js';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config(); // Fallback to .env if .env.local doesn't exist

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());

// CORS configuration with logging
// Allow multiple origins for CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://company-news-social-app.netlify.app',
  process.env.CORS_ORIGIN
].filter(Boolean);

console.log('🌐 CORS enabled for origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('⚠️  CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Custom middleware
app.use(addRequestId);
app.use(requestLogger);
app.use(securityLogger);
app.use(rateLimitLogger);
app.use(trackAPIUsage);

// Production monitoring middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    monitoring.recordRequest(req, res, responseTime);
  });
  
  next();
});

// Error tracking middleware
app.use(errorTracking.middleware());

// Health check endpoint
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    // Check database connection
    const dbHealthy = await testConnection();
    
    // Check Redis connection
    const redisHealthy = await testRedisConnection();
    
    // Get cache stats
    const cacheStats = await CacheService.getStats();
    
    // Get performance stats
    const performanceStats = getPerformanceStats();
    
    // Get system health
    const systemHealth = healthMonitor.getSystemHealth();
    
    // Get alerts
    const alerts = healthMonitor.getAlerts();
    
    const health = {
      status: dbHealthy && redisHealthy ? 'OK' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      service: 'Company News Social App API',
      version: '1.0.0',
      services: {
        database: dbHealthy ? 'healthy' : 'unhealthy',
        redis: redisHealthy ? 'healthy' : 'unhealthy',
      },
      cache: {
        totalKeys: cacheStats.totalKeys,
        memoryUsage: cacheStats.memoryUsage,
      },
      performance: {
        averageResponseTime: performanceStats.averageResponseTime,
        totalRequests: performanceStats.totalRequests,
        uptime: process.uptime(),
      },
      alerts: alerts.length > 0 ? alerts : undefined,
    };
    
    const statusCode = health.status === 'OK' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      service: 'Company News Social App API',
      version: '1.0.0',
      error: 'Health check failed',
    });
  }
});

// Basic route
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    message: 'Company News Social App API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      news: '/api/news/:companyName',
      newsRecent: '/api/news/:companyName/recent',
      searchCompanies: '/api/news/search/companies',
      contentGenerate: '/api/content/generate',
      contentBatch: '/api/content/generate/batch',
      contentRegenerate: '/api/content/regenerate/:articleId',
      contentHealth: '/api/content/health'
    }
  });
});

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/content', contentRoutes);

// Error handling middleware
app.use(errorLogger);
app.use(handleApiError);

// 404 handler
app.use('*', (_req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found',
    },
  });
});

// Graceful shutdown handling
const gracefulShutdown = async () => {
  console.log('Shutting down gracefully...');
  await closePool();
  await closeRedis();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Server not started.');
      process.exit(1);
    }

    // Run database migrations
    await runMigrations();

    // Initialize Redis (optional - server can run without Redis)
    try {
      await initRedis();
      const redisConnected = await testRedisConnection();
      if (redisConnected) {
        console.log('✅ Redis caching enabled');
      } else {
        console.warn('⚠️  Redis connection failed - running without cache');
      }
    } catch (error) {
      console.warn('⚠️  Redis initialization failed - running without cache:', error.message);
    }

    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();