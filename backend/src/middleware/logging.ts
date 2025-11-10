import { Request, Response, NextFunction } from 'express';

// Request logging interface
interface RequestLog {
  timestamp: string;
  requestId: string;
  method: string;
  url: string;
  userAgent?: string;
  ip: string;
  responseTime?: number;
  statusCode?: number;
  contentLength?: number;
  error?: string;
}

// Performance monitoring
interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: string;
}

// In-memory metrics storage (in production, use proper monitoring service)
const performanceMetrics: PerformanceMetrics[] = [];
const MAX_METRICS_HISTORY = 1000;

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = req.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Set request ID if not already set
  if (!req.requestId) {
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
  }

  const logData: RequestLog = {
    timestamp: new Date().toISOString(),
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress || 'unknown',
  };

  // Log request start
  console.log(`[${logData.timestamp}] ${logData.method} ${logData.url} - ${logData.requestId}`);

  // Override res.end to capture response details
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const responseTime = Date.now() - startTime;
    
    logData.responseTime = responseTime;
    logData.statusCode = res.statusCode;
    logData.contentLength = res.get('Content-Length') ? parseInt(res.get('Content-Length')!) : undefined;

    // Log response
    const statusEmoji = res.statusCode >= 500 ? '❌' : res.statusCode >= 400 ? '⚠️' : '✅';
    console.log(
      `[${new Date().toISOString()}] ${statusEmoji} ${logData.method} ${logData.url} - ` +
      `${res.statusCode} - ${responseTime}ms - ${logData.requestId}`
    );

    // Store performance metrics
    storePerformanceMetric({
      endpoint: req.route?.path || req.url,
      method: req.method,
      responseTime,
      statusCode: res.statusCode,
      timestamp: new Date().toISOString(),
    });

    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Store performance metric
const storePerformanceMetric = (metric: PerformanceMetrics) => {
  performanceMetrics.push(metric);
  
  // Keep only recent metrics to prevent memory issues
  if (performanceMetrics.length > MAX_METRICS_HISTORY) {
    performanceMetrics.splice(0, performanceMetrics.length - MAX_METRICS_HISTORY);
  }
};

// Get performance statistics
export const getPerformanceStats = () => {
  if (performanceMetrics.length === 0) {
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      statusCodes: {},
      endpoints: {},
      recentMetrics: [],
    };
  }

  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  
  // Filter recent metrics (last hour)
  const recentMetrics = performanceMetrics.filter(
    metric => new Date(metric.timestamp).getTime() > oneHourAgo
  );

  // Calculate statistics
  const totalRequests = recentMetrics.length;
  const averageResponseTime = totalRequests > 0 
    ? recentMetrics.reduce((sum, metric) => sum + metric.responseTime, 0) / totalRequests 
    : 0;

  // Group by status codes
  const statusCodes = recentMetrics.reduce((acc, metric) => {
    acc[metric.statusCode] = (acc[metric.statusCode] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // Group by endpoints
  const endpoints = recentMetrics.reduce((acc, metric) => {
    const key = `${metric.method} ${metric.endpoint}`;
    if (!acc[key]) {
      acc[key] = {
        count: 0,
        averageResponseTime: 0,
        totalResponseTime: 0,
      };
    }
    acc[key].count++;
    acc[key].totalResponseTime += metric.responseTime;
    acc[key].averageResponseTime = acc[key].totalResponseTime / acc[key].count;
    return acc;
  }, {} as Record<string, { count: number; averageResponseTime: number; totalResponseTime: number }>);

  return {
    totalRequests,
    averageResponseTime: Math.round(averageResponseTime),
    statusCodes,
    endpoints,
    recentMetrics: recentMetrics.slice(-10), // Last 10 requests
    timeWindow: '1 hour',
  };
};

// Error logging middleware
export const errorLogger = (error: Error, req: Request, res: Response, next: NextFunction) => {
  const logData = {
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    error: {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
    },
  };

  console.error(`[ERROR] ${logData.timestamp} - ${logData.requestId}:`, JSON.stringify(logData, null, 2));
  
  next(error);
};

// Security logging middleware
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const suspiciousPatterns = [
    /\.\.\//,  // Path traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection
    /javascript:/i, // JavaScript protocol
    /eval\(/i, // Code injection
  ];

  const url = req.url;
  const userAgent = req.get('User-Agent') || '';
  const body = JSON.stringify(req.body);

  const suspicious = suspiciousPatterns.some(pattern => 
    pattern.test(url) || pattern.test(userAgent) || pattern.test(body)
  );

  if (suspicious) {
    const securityLog = {
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
      type: 'SUSPICIOUS_REQUEST',
      method: req.method,
      url,
      userAgent,
      ip: req.ip || req.connection.remoteAddress || 'unknown',
      body: req.body,
    };

    console.warn(`[SECURITY] Suspicious request detected:`, JSON.stringify(securityLog, null, 2));
  }

  next();
};

// Rate limiting logging
export const rateLimitLogger = (req: Request, res: Response, next: NextFunction) => {
  // This middleware works with express-rate-limit
  res.on('finish', () => {
    if (res.statusCode === 429) {
      const rateLimitLog = {
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
        type: 'RATE_LIMIT_EXCEEDED',
        method: req.method,
        url: req.url,
        ip: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent'),
        retryAfter: res.get('Retry-After'),
      };

      console.warn(`[RATE_LIMIT] Rate limit exceeded:`, JSON.stringify(rateLimitLog, null, 2));
    }
  });

  next();
};

// API usage analytics
interface APIUsageStats {
  endpoint: string;
  method: string;
  count: number;
  lastAccessed: string;
  averageResponseTime: number;
  errorRate: number;
}

const apiUsageStats = new Map<string, APIUsageStats>();

export const trackAPIUsage = (req: Request, res: Response, next: NextFunction) => {
  const endpoint = req.route?.path || req.url;
  const method = req.method;
  const key = `${method} ${endpoint}`;
  
  const startTime = Date.now();

  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    const isError = res.statusCode >= 400;

    const existing = apiUsageStats.get(key);
    if (existing) {
      existing.count++;
      existing.lastAccessed = new Date().toISOString();
      existing.averageResponseTime = (existing.averageResponseTime + responseTime) / 2;
      existing.errorRate = isError 
        ? (existing.errorRate + 1) / 2 
        : existing.errorRate * 0.9; // Decay error rate over time
    } else {
      apiUsageStats.set(key, {
        endpoint,
        method,
        count: 1,
        lastAccessed: new Date().toISOString(),
        averageResponseTime: responseTime,
        errorRate: isError ? 1 : 0,
      });
    }
  });

  next();
};

// Get API usage statistics
export const getAPIUsageStats = (): APIUsageStats[] => {
  return Array.from(apiUsageStats.values())
    .sort((a, b) => b.count - a.count) // Sort by usage count
    .slice(0, 20); // Top 20 endpoints
};

// Health monitoring
export const healthMonitor = {
  getSystemHealth: () => {
    const performanceStats = getPerformanceStats();
    const apiStats = getAPIUsageStats();
    
    return {
      performance: performanceStats,
      apiUsage: apiStats,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  },

  getAlerts: () => {
    const performanceStats = getPerformanceStats();
    const alerts = [];

    // High response time alert
    if (performanceStats.averageResponseTime > 5000) {
      alerts.push({
        type: 'HIGH_RESPONSE_TIME',
        message: `Average response time is ${performanceStats.averageResponseTime}ms`,
        severity: 'warning',
        timestamp: new Date().toISOString(),
      });
    }

    // High error rate alert
    const errorRequests = Object.entries(performanceStats.statusCodes)
      .filter(([code]) => parseInt(code) >= 400)
      .reduce((sum, [, count]) => sum + count, 0);
    
    const errorRate = performanceStats.totalRequests > 0 
      ? (errorRequests / performanceStats.totalRequests) * 100 
      : 0;

    if (errorRate > 10) {
      alerts.push({
        type: 'HIGH_ERROR_RATE',
        message: `Error rate is ${errorRate.toFixed(2)}%`,
        severity: 'critical',
        timestamp: new Date().toISOString(),
      });
    }

    return alerts;
  },
};