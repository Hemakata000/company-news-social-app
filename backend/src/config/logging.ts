import { Request, Response } from 'express';

// Logging levels
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

// Log entry interface
export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  requestId?: string;
  userId?: string;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// Production logger configuration
export class ProductionLogger {
  private static instance: ProductionLogger;
  private logLevel: LogLevel;
  private enableConsole: boolean;
  private enableFile: boolean;
  private enableExternal: boolean;

  private constructor() {
    this.logLevel = this.getLogLevel();
    this.enableConsole = process.env.NODE_ENV !== 'production';
    this.enableFile = process.env.ENABLE_FILE_LOGGING === 'true';
    this.enableExternal = process.env.ENABLE_EXTERNAL_LOGGING === 'true';
  }

  public static getInstance(): ProductionLogger {
    if (!ProductionLogger.instance) {
      ProductionLogger.instance = new ProductionLogger();
    }
    return ProductionLogger.instance;
  }

  private getLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toLowerCase() || 'info';
    switch (level) {
      case 'error': return LogLevel.ERROR;
      case 'warn': return LogLevel.WARN;
      case 'info': return LogLevel.INFO;
      case 'debug': return LogLevel.DEBUG;
      default: return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private formatLogEntry(level: string, message: string, metadata?: Record<string, any>, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
      };
    }

    return entry;
  }

  private writeLog(entry: LogEntry): void {
    const logString = process.env.LOG_FORMAT === 'json' 
      ? JSON.stringify(entry)
      : `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`;

    // Console logging
    if (this.enableConsole) {
      switch (entry.level) {
        case 'error':
          console.error(logString);
          break;
        case 'warn':
          console.warn(logString);
          break;
        case 'debug':
          console.debug(logString);
          break;
        default:
          console.log(logString);
      }
    }

    // External logging (Sentry, CloudWatch, etc.)
    if (this.enableExternal) {
      this.sendToExternalService(entry);
    }
  }

  private async sendToExternalService(entry: LogEntry): Promise<void> {
    try {
      // Sentry integration for errors
      if (entry.level === 'error' && process.env.ENABLE_SENTRY === 'true') {
        // Sentry would be configured here
        // Sentry.captureException(entry.error || new Error(entry.message));
      }

      // CloudWatch Logs integration
      if (process.env.AWS_CLOUDWATCH_LOG_GROUP) {
        // CloudWatch integration would be here
      }

      // Custom logging service integration
      if (process.env.CUSTOM_LOG_ENDPOINT) {
        // Custom service integration would be here
      }
    } catch (error) {
      console.error('Failed to send log to external service:', error);
    }
  }

  public error(message: string, error?: Error, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const entry = this.formatLogEntry('error', message, metadata, error);
      this.writeLog(entry);
    }
  }

  public warn(message: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const entry = this.formatLogEntry('warn', message, metadata);
      this.writeLog(entry);
    }
  }

  public info(message: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const entry = this.formatLogEntry('info', message, metadata);
      this.writeLog(entry);
    }
  }

  public debug(message: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const entry = this.formatLogEntry('debug', message, metadata);
      this.writeLog(entry);
    }
  }

  // Request-specific logging
  public logRequest(req: Request, res: Response, responseTime: number): void {
    const metadata = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      requestId: req.requestId,
    };

    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    const message = `${req.method} ${req.url} - ${res.statusCode} - ${responseTime}ms`;

    if (level === 'error') {
      this.error(message, undefined, metadata);
    } else if (level === 'warn') {
      this.warn(message, metadata);
    } else {
      this.info(message, metadata);
    }
  }

  // Security event logging
  public logSecurityEvent(type: string, req: Request, details?: Record<string, any>): void {
    const metadata = {
      type,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      requestId: req.requestId,
      ...details,
    };

    this.warn(`Security event: ${type}`, metadata);
  }

  // Performance logging
  public logPerformance(operation: string, duration: number, metadata?: Record<string, any>): void {
    const perfMetadata = {
      operation,
      duration,
      ...metadata,
    };

    if (duration > 5000) {
      this.warn(`Slow operation: ${operation} took ${duration}ms`, perfMetadata);
    } else {
      this.debug(`Performance: ${operation} took ${duration}ms`, perfMetadata);
    }
  }

  // Business logic logging
  public logBusinessEvent(event: string, metadata?: Record<string, any>): void {
    this.info(`Business event: ${event}`, metadata);
  }
}

// Export singleton instance
export const logger = ProductionLogger.getInstance();

// Structured logging helpers
export const createRequestLogger = (req: Request) => {
  return {
    info: (message: string, metadata?: Record<string, any>) => {
      logger.info(message, { ...metadata, requestId: req.requestId });
    },
    warn: (message: string, metadata?: Record<string, any>) => {
      logger.warn(message, { ...metadata, requestId: req.requestId });
    },
    error: (message: string, error?: Error, metadata?: Record<string, any>) => {
      logger.error(message, error, { ...metadata, requestId: req.requestId });
    },
    debug: (message: string, metadata?: Record<string, any>) => {
      logger.debug(message, { ...metadata, requestId: req.requestId });
    },
  };
};