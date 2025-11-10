import { Request, Response } from 'express';
import { logger } from './logging.js';

// Metrics collection interfaces
export interface SystemMetrics {
  timestamp: string;
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
    heap: NodeJS.MemoryUsage;
  };
  uptime: number;
  activeConnections: number;
}

export interface ApplicationMetrics {
  timestamp: string;
  requests: {
    total: number;
    successful: number;
    failed: number;
    averageResponseTime: number;
  };
  endpoints: Record<string, {
    count: number;
    averageResponseTime: number;
    errorRate: number;
  }>;
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
  };
  external: {
    newsAPI: {
      requests: number;
      failures: number;
      averageResponseTime: number;
    };
    aiService: {
      requests: number;
      failures: number;
      averageResponseTime: number;
    };
  };
}

export interface Alert {
  id: string;
  type: 'performance' | 'error' | 'security' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
  resolved?: boolean;
  resolvedAt?: string;
}

// Monitoring service
export class MonitoringService {
  private static instance: MonitoringService;
  private metrics: ApplicationMetrics;
  private alerts: Alert[] = [];
  private metricsHistory: ApplicationMetrics[] = [];
  private readonly maxHistorySize = 1000;
  private readonly alertRetentionHours = 24;

  private constructor() {
    this.metrics = this.initializeMetrics();
    this.startMetricsCollection();
    this.startAlertCleanup();
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private initializeMetrics(): ApplicationMetrics {
    return {
      timestamp: new Date().toISOString(),
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        averageResponseTime: 0,
      },
      endpoints: {},
      cache: {
        hits: 0,
        misses: 0,
        hitRate: 0,
      },
      external: {
        newsAPI: {
          requests: 0,
          failures: 0,
          averageResponseTime: 0,
        },
        aiService: {
          requests: 0,
          failures: 0,
          averageResponseTime: 0,
        },
      },
    };
  }

  private startMetricsCollection(): void {
    if (process.env.ENABLE_METRICS_COLLECTION !== 'true') {
      return;
    }

    // Collect metrics every minute
    setInterval(() => {
      this.collectMetrics();
    }, 60000);
  }

  private startAlertCleanup(): void {
    // Clean up old alerts every hour
    setInterval(() => {
      this.cleanupOldAlerts();
    }, 3600000);
  }

  private collectMetrics(): void {
    try {
      // Store current metrics in history
      this.metricsHistory.push({ ...this.metrics });
      
      // Keep only recent history
      if (this.metricsHistory.length > this.maxHistorySize) {
        this.metricsHistory = this.metricsHistory.slice(-this.maxHistorySize);
      }

      // Reset counters for next collection period
      this.metrics.timestamp = new Date().toISOString();
      
      logger.debug('Metrics collected', { 
        totalRequests: this.metrics.requests.total,
        averageResponseTime: this.metrics.requests.averageResponseTime,
      });
    } catch (error) {
      logger.error('Failed to collect metrics', error);
    }
  }

  private cleanupOldAlerts(): void {
    const cutoffTime = Date.now() - (this.alertRetentionHours * 60 * 60 * 1000);
    const initialCount = this.alerts.length;
    
    this.alerts = this.alerts.filter(alert => 
      new Date(alert.timestamp).getTime() > cutoffTime
    );

    const removedCount = initialCount - this.alerts.length;
    if (removedCount > 0) {
      logger.debug(`Cleaned up ${removedCount} old alerts`);
    }
  }

  // Record request metrics
  public recordRequest(req: Request, res: Response, responseTime: number): void {
    this.metrics.requests.total++;
    
    if (res.statusCode >= 200 && res.statusCode < 400) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }

    // Update average response time
    const totalTime = this.metrics.requests.averageResponseTime * (this.metrics.requests.total - 1) + responseTime;
    this.metrics.requests.averageResponseTime = totalTime / this.metrics.requests.total;

    // Record endpoint-specific metrics
    const endpoint = `${req.method} ${req.route?.path || req.url}`;
    if (!this.metrics.endpoints[endpoint]) {
      this.metrics.endpoints[endpoint] = {
        count: 0,
        averageResponseTime: 0,
        errorRate: 0,
      };
    }

    const endpointMetrics = this.metrics.endpoints[endpoint];
    endpointMetrics.count++;
    
    // Update endpoint average response time
    const endpointTotalTime = endpointMetrics.averageResponseTime * (endpointMetrics.count - 1) + responseTime;
    endpointMetrics.averageResponseTime = endpointTotalTime / endpointMetrics.count;
    
    // Update error rate
    const isError = res.statusCode >= 400;
    const errorCount = endpointMetrics.errorRate * (endpointMetrics.count - 1) + (isError ? 1 : 0);
    endpointMetrics.errorRate = errorCount / endpointMetrics.count;

    // Check for performance alerts
    this.checkPerformanceAlerts(responseTime, endpoint);
  }

  // Record cache metrics
  public recordCacheHit(): void {
    this.metrics.cache.hits++;
    this.updateCacheHitRate();
  }

  public recordCacheMiss(): void {
    this.metrics.cache.misses++;
    this.updateCacheHitRate();
  }

  private updateCacheHitRate(): void {
    const total = this.metrics.cache.hits + this.metrics.cache.misses;
    this.metrics.cache.hitRate = total > 0 ? this.metrics.cache.hits / total : 0;
  }

  // Record external service metrics
  public recordExternalServiceCall(service: 'newsAPI' | 'aiService', responseTime: number, success: boolean): void {
    const serviceMetrics = this.metrics.external[service];
    serviceMetrics.requests++;
    
    if (!success) {
      serviceMetrics.failures++;
    }

    // Update average response time
    const totalTime = serviceMetrics.averageResponseTime * (serviceMetrics.requests - 1) + responseTime;
    serviceMetrics.averageResponseTime = totalTime / serviceMetrics.requests;

    // Check for external service alerts
    this.checkExternalServiceAlerts(service, success, responseTime);
  }

  // Alert management
  public createAlert(type: Alert['type'], severity: Alert['severity'], message: string, metadata?: Record<string, any>): void {
    const alert: Alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      message,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.alerts.push(alert);
    
    // Log alert based on severity
    if (severity === 'critical' || severity === 'high') {
      logger.error(`Alert created: ${message}`, undefined, { alert });
    } else {
      logger.warn(`Alert created: ${message}`, { alert });
    }

    // Send to external monitoring services
    this.sendAlertToExternalServices(alert);
  }

  public resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
      logger.info(`Alert resolved: ${alert.message}`, { alertId });
    }
  }

  private checkPerformanceAlerts(responseTime: number, endpoint: string): void {
    // High response time alert
    if (responseTime > 10000) {
      this.createAlert(
        'performance',
        'high',
        `High response time detected: ${responseTime}ms for ${endpoint}`,
        { responseTime, endpoint }
      );
    }

    // Check average response time
    if (this.metrics.requests.averageResponseTime > 5000 && this.metrics.requests.total > 10) {
      this.createAlert(
        'performance',
        'medium',
        `Average response time is high: ${this.metrics.requests.averageResponseTime}ms`,
        { averageResponseTime: this.metrics.requests.averageResponseTime }
      );
    }
  }

  private checkExternalServiceAlerts(service: string, success: boolean, responseTime: number): void {
    const serviceMetrics = this.metrics.external[service as keyof typeof this.metrics.external];
    
    // High failure rate
    const failureRate = serviceMetrics.requests > 0 ? serviceMetrics.failures / serviceMetrics.requests : 0;
    if (failureRate > 0.1 && serviceMetrics.requests > 5) {
      this.createAlert(
        'error',
        'high',
        `High failure rate for ${service}: ${(failureRate * 100).toFixed(2)}%`,
        { service, failureRate, requests: serviceMetrics.requests }
      );
    }

    // Slow external service
    if (responseTime > 15000) {
      this.createAlert(
        'performance',
        'medium',
        `Slow external service response: ${service} took ${responseTime}ms`,
        { service, responseTime }
      );
    }
  }

  private async sendAlertToExternalServices(alert: Alert): Promise<void> {
    try {
      // Sentry integration
      if (process.env.ENABLE_SENTRY === 'true' && alert.severity === 'critical') {
        // Sentry.captureMessage(alert.message, 'error');
      }

      // Slack/Discord webhook integration
      if (process.env.ALERT_WEBHOOK_URL && (alert.severity === 'critical' || alert.severity === 'high')) {
        // Send webhook notification
      }

      // PagerDuty integration for critical alerts
      if (process.env.PAGERDUTY_INTEGRATION_KEY && alert.severity === 'critical') {
        // Trigger PagerDuty incident
      }
    } catch (error) {
      logger.error('Failed to send alert to external services', error);
    }
  }

  // Get current system metrics
  public getSystemMetrics(): SystemMetrics {
    const memUsage = process.memoryUsage();
    const totalMemory = require('os').totalmem();
    const usedMemory = totalMemory - require('os').freemem();

    return {
      timestamp: new Date().toISOString(),
      cpu: {
        usage: process.cpuUsage().user / 1000000, // Convert to seconds
        loadAverage: require('os').loadavg(),
      },
      memory: {
        used: usedMemory,
        total: totalMemory,
        percentage: (usedMemory / totalMemory) * 100,
        heap: memUsage,
      },
      uptime: process.uptime(),
      activeConnections: 0, // Would need to track this separately
    };
  }

  // Get application metrics
  public getApplicationMetrics(): ApplicationMetrics {
    return { ...this.metrics };
  }

  // Get metrics history
  public getMetricsHistory(hours: number = 1): ApplicationMetrics[] {
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    return this.metricsHistory.filter(metric => 
      new Date(metric.timestamp).getTime() > cutoffTime
    );
  }

  // Get active alerts
  public getActiveAlerts(): Alert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  // Get all alerts
  public getAllAlerts(): Alert[] {
    return [...this.alerts];
  }

  // Health check
  public getHealthStatus(): { status: string; checks: Record<string, any> } {
    const systemMetrics = this.getSystemMetrics();
    const appMetrics = this.getApplicationMetrics();
    const activeAlerts = this.getActiveAlerts();

    const checks = {
      memory: {
        status: systemMetrics.memory.percentage < 90 ? 'healthy' : 'unhealthy',
        usage: `${systemMetrics.memory.percentage.toFixed(2)}%`,
      },
      responseTime: {
        status: appMetrics.requests.averageResponseTime < 5000 ? 'healthy' : 'degraded',
        average: `${appMetrics.requests.averageResponseTime}ms`,
      },
      errorRate: {
        status: appMetrics.requests.total > 0 && (appMetrics.requests.failed / appMetrics.requests.total) < 0.05 ? 'healthy' : 'degraded',
        rate: appMetrics.requests.total > 0 ? `${((appMetrics.requests.failed / appMetrics.requests.total) * 100).toFixed(2)}%` : '0%',
      },
      alerts: {
        status: activeAlerts.length === 0 ? 'healthy' : 'warning',
        count: activeAlerts.length,
      },
    };

    const overallStatus = Object.values(checks).every(check => check.status === 'healthy') 
      ? 'healthy' 
      : Object.values(checks).some(check => check.status === 'unhealthy') 
        ? 'unhealthy' 
        : 'degraded';

    return {
      status: overallStatus,
      checks,
    };
  }
}

// Export singleton instance
export const monitoring = MonitoringService.getInstance();