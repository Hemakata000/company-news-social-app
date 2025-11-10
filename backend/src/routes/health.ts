import { Router, Request, Response } from 'express';
import { testConnection } from '../config/database.js';
import { testRedisConnection } from '../config/redis.js';
import { CacheService } from '../utils/cache.js';
import { monitoring } from '../config/monitoring.js';
import { errorTracking } from '../config/errorTracking.js';
import { logger } from '../config/logging.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// Basic health check
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Check database connection
    const dbHealthy = await testConnection();
    
    // Check Redis connection
    const redisHealthy = await testRedisConnection();
    
    // Get cache stats
    const cacheStats = await CacheService.getStats();
    
    // Get monitoring data
    const systemMetrics = monitoring.getSystemMetrics();
    const appMetrics = monitoring.getApplicationMetrics();
    const healthStatus = monitoring.getHealthStatus();
    
    // Get error stats
    const errorStats = errorTracking.getErrorStats();
    
    const health = {
      status: dbHealthy && redisHealthy && healthStatus.status === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      service: {
        name: 'Company News Social App API',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
      },
      dependencies: {
        database: {
          status: dbHealthy ? 'healthy' : 'unhealthy',
          type: 'postgresql',
        },
        cache: {
          status: redisHealthy ? 'healthy' : 'unhealthy',
          type: 'redis',
          stats: {
            totalKeys: cacheStats.totalKeys,
            memoryUsage: cacheStats.memoryUsage,
          },
        },
      },
      system: {
        memory: {
          usage: `${systemMetrics.memory.percentage.toFixed(2)}%`,
          heap: systemMetrics.memory.heap,
        },
        cpu: {
          loadAverage: systemMetrics.cpu.loadAverage,
        },
      },
      performance: {
        requests: {
          total: appMetrics.requests.total,
          successful: appMetrics.requests.successful,
          failed: appMetrics.requests.failed,
          averageResponseTime: `${appMetrics.requests.averageResponseTime}ms`,
        },
        cache: {
          hitRate: `${(appMetrics.cache.hitRate * 100).toFixed(2)}%`,
        },
      },
      errors: {
        total: errorStats.totalErrors,
        unique: errorStats.uniqueErrors,
        recent: errorStats.recentErrors,
      },
      alerts: monitoring.getActiveAlerts(),
    };
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      service: {
        name: 'Company News Social App API',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },
      error: 'Health check failed',
    });
  }
}));

// Detailed system metrics
router.get('/metrics', asyncHandler(async (req: Request, res: Response) => {
  const systemMetrics = monitoring.getSystemMetrics();
  const appMetrics = monitoring.getApplicationMetrics();
  const metricsHistory = monitoring.getMetricsHistory(1); // Last hour
  
  res.json({
    timestamp: new Date().toISOString(),
    system: systemMetrics,
    application: appMetrics,
    history: metricsHistory,
  });
}));

// Error tracking information
router.get('/errors', asyncHandler(async (req: Request, res: Response) => {
  const { resolved, since, type } = req.query;
  
  const filters: any = {};
  if (resolved !== undefined) {
    filters.resolved = resolved === 'true';
  }
  if (since) {
    filters.since = since as string;
  }
  if (type) {
    filters.type = type as string;
  }
  
  const errors = errorTracking.getErrors(filters);
  const stats = errorTracking.getErrorStats();
  
  res.json({
    timestamp: new Date().toISOString(),
    stats,
    errors: errors.slice(0, 50), // Limit to 50 most recent
  });
}));

// Get specific error details
router.get('/errors/:errorId', asyncHandler(async (req: Request, res: Response) => {
  const { errorId } = req.params;
  const error = errorTracking.getError(errorId);
  
  if (!error) {
    return res.status(404).json({
      error: {
        code: 'ERROR_NOT_FOUND',
        message: 'Error not found',
      },
    });
  }
  
  res.json({
    timestamp: new Date().toISOString(),
    error,
  });
}));

// Resolve an error
router.post('/errors/:errorId/resolve', asyncHandler(async (req: Request, res: Response) => {
  const { errorId } = req.params;
  const resolved = errorTracking.resolveError(errorId);
  
  if (!resolved) {
    return res.status(404).json({
      error: {
        code: 'ERROR_NOT_FOUND',
        message: 'Error not found',
      },
    });
  }
  
  res.json({
    timestamp: new Date().toISOString(),
    message: 'Error marked as resolved',
    errorId,
  });
}));

// Active alerts
router.get('/alerts', asyncHandler(async (req: Request, res: Response) => {
  const activeAlerts = monitoring.getActiveAlerts();
  const allAlerts = monitoring.getAllAlerts();
  
  res.json({
    timestamp: new Date().toISOString(),
    active: activeAlerts,
    total: allAlerts.length,
    recent: allAlerts.slice(0, 20), // Last 20 alerts
  });
}));

// Readiness probe (for Kubernetes)
router.get('/ready', asyncHandler(async (req: Request, res: Response) => {
  try {
    const dbHealthy = await testConnection();
    
    if (!dbHealthy) {
      return res.status(503).json({
        status: 'not_ready',
        reason: 'Database connection failed',
        timestamp: new Date().toISOString(),
      });
    }
    
    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      reason: 'Readiness check failed',
      timestamp: new Date().toISOString(),
    });
  }
}));

// Liveness probe (for Kubernetes)
router.get('/live', (req: Request, res: Response) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;