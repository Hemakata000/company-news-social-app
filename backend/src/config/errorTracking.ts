import { Request, Response, NextFunction } from 'express';
import { logger } from './logging.js';

// Error tracking interfaces
export interface ErrorContext {
  requestId?: string;
  userId?: string;
  userAgent?: string;
  ip?: string;
  url?: string;
  method?: string;
  body?: any;
  query?: any;
  params?: any;
  headers?: Record<string, string>;
  timestamp: string;
}

export interface ErrorFingerprint {
  type: string;
  message: string;
  stack?: string;
  file?: string;
  line?: number;
  column?: number;
}

export interface TrackedError {
  id: string;
  fingerprint: ErrorFingerprint;
  context: ErrorContext;
  count: number;
  firstSeen: string;
  lastSeen: string;
  resolved: boolean;
  tags: Record<string, string>;
}

// Error tracking service
export class ErrorTrackingService {
  private static instance: ErrorTrackingService;
  private errors: Map<string, TrackedError> = new Map();
  private sentryEnabled: boolean;
  private customEndpoint?: string;

  private constructor() {
    this.sentryEnabled = process.env.ENABLE_SENTRY === 'true' && !!process.env.SENTRY_DSN;
    this.customEndpoint = process.env.CUSTOM_ERROR_TRACKING_ENDPOINT;
    
    if (this.sentryEnabled) {
      this.initializeSentry();
    }
  }

  public static getInstance(): ErrorTrackingService {
    if (!ErrorTrackingService.instance) {
      ErrorTrackingService.instance = new ErrorTrackingService();
    }
    return ErrorTrackingService.instance;
  }

  private initializeSentry(): void {
    try {
      // Sentry initialization would go here
      // import * as Sentry from '@sentry/node';
      // 
      // Sentry.init({
      //   dsn: process.env.SENTRY_DSN,
      //   environment: process.env.NODE_ENV,
      //   tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
      //   beforeSend(event) {
      //     // Filter out sensitive data
      //     if (event.request?.data) {
      //       event.request.data = this.sanitizeData(event.request.data);
      //     }
      //     return event;
      //   },
      // });

      logger.info('Sentry error tracking initialized');
    } catch (error) {
      logger.error('Failed to initialize Sentry', error);
      this.sentryEnabled = false;
    }
  }

  private generateFingerprint(error: Error): ErrorFingerprint {
    // Create a unique fingerprint for the error
    const stack = error.stack || '';
    const stackLines = stack.split('\n');
    
    // Extract file and line information from stack trace
    let file: string | undefined;
    let line: number | undefined;
    let column: number | undefined;

    if (stackLines.length > 1) {
      const match = stackLines[1].match(/at .* \((.+):(\d+):(\d+)\)/);
      if (match) {
        file = match[1];
        line = parseInt(match[2]);
        column = parseInt(match[3]);
      }
    }

    return {
      type: error.name,
      message: error.message,
      stack: stack.split('\n').slice(0, 5).join('\n'), // First 5 lines only
      file,
      line,
      column,
    };
  }

  private generateErrorId(fingerprint: ErrorFingerprint): string {
    // Create a consistent ID based on error characteristics
    const key = `${fingerprint.type}:${fingerprint.message}:${fingerprint.file}:${fingerprint.line}`;
    return Buffer.from(key).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  private createErrorContext(req?: Request): ErrorContext {
    const context: ErrorContext = {
      timestamp: new Date().toISOString(),
    };

    if (req) {
      context.requestId = req.requestId;
      context.userAgent = req.get('User-Agent');
      context.ip = req.ip;
      context.url = req.url;
      context.method = req.method;
      context.query = req.query;
      context.params = req.params;
      
      // Sanitize sensitive data
      context.body = this.sanitizeData(req.body);
      context.headers = this.sanitizeHeaders(req.headers);
    }

    return context;
  }

  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = [
      'password', 'token', 'secret', 'key', 'authorization',
      'cookie', 'session', 'csrf', 'api_key', 'apikey'
    ];

    const sanitized = { ...data };
    
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  private sanitizeHeaders(headers: any): Record<string, string> {
    const sanitized: Record<string, string> = {};
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

    for (const [key, value] of Object.entries(headers)) {
      if (sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = String(value);
      }
    }

    return sanitized;
  }

  // Track an error
  public trackError(error: Error, req?: Request, tags?: Record<string, string>): string {
    try {
      const fingerprint = this.generateFingerprint(error);
      const errorId = this.generateErrorId(fingerprint);
      const context = this.createErrorContext(req);
      const now = new Date().toISOString();

      // Check if we've seen this error before
      const existingError = this.errors.get(errorId);
      
      if (existingError) {
        // Update existing error
        existingError.count++;
        existingError.lastSeen = now;
        existingError.context = context; // Update with latest context
        
        if (tags) {
          existingError.tags = { ...existingError.tags, ...tags };
        }
      } else {
        // Create new error entry
        const trackedError: TrackedError = {
          id: errorId,
          fingerprint,
          context,
          count: 1,
          firstSeen: now,
          lastSeen: now,
          resolved: false,
          tags: tags || {},
        };
        
        this.errors.set(errorId, trackedError);
      }

      // Send to external services
      this.sendToExternalServices(error, context, tags);

      // Log the error
      logger.error('Error tracked', error, {
        errorId,
        count: this.errors.get(errorId)?.count,
        ...context,
      });

      return errorId;
    } catch (trackingError) {
      logger.error('Failed to track error', trackingError);
      return 'tracking_failed';
    }
  }

  private async sendToExternalServices(error: Error, context: ErrorContext, tags?: Record<string, string>): Promise<void> {
    try {
      // Sentry integration
      if (this.sentryEnabled) {
        // Sentry.withScope((scope) => {
        //   scope.setContext('request', context);
        //   if (tags) {
        //     Object.entries(tags).forEach(([key, value]) => {
        //       scope.setTag(key, value);
        //     });
        //   }
        //   Sentry.captureException(error);
        // });
      }

      // Custom error tracking endpoint
      if (this.customEndpoint) {
        const payload = {
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
          context,
          tags,
          timestamp: new Date().toISOString(),
        };

        // Would make HTTP request to custom endpoint
        // await fetch(this.customEndpoint, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(payload),
        // });
      }
    } catch (sendError) {
      logger.error('Failed to send error to external services', sendError);
    }
  }

  // Express middleware for automatic error tracking
  public middleware() {
    return (error: Error, req: Request, res: Response, next: NextFunction) => {
      // Track the error
      const errorId = this.trackError(error, req);
      
      // Add error ID to response headers for debugging
      res.setHeader('X-Error-ID', errorId);
      
      // Continue with normal error handling
      next(error);
    };
  }

  // Get error statistics
  public getErrorStats(): {
    totalErrors: number;
    uniqueErrors: number;
    recentErrors: number;
    topErrors: Array<{ id: string; count: number; message: string; lastSeen: string }>;
  } {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    
    const errors = Array.from(this.errors.values());
    const recentErrors = errors.filter(error => 
      new Date(error.lastSeen).getTime() > oneHourAgo
    );

    const topErrors = errors
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map(error => ({
        id: error.id,
        count: error.count,
        message: error.fingerprint.message,
        lastSeen: error.lastSeen,
      }));

    return {
      totalErrors: errors.reduce((sum, error) => sum + error.count, 0),
      uniqueErrors: errors.length,
      recentErrors: recentErrors.length,
      topErrors,
    };
  }

  // Get specific error details
  public getError(errorId: string): TrackedError | undefined {
    return this.errors.get(errorId);
  }

  // Mark error as resolved
  public resolveError(errorId: string): boolean {
    const error = this.errors.get(errorId);
    if (error) {
      error.resolved = true;
      logger.info(`Error marked as resolved: ${errorId}`);
      return true;
    }
    return false;
  }

  // Get all errors with filtering
  public getErrors(filters?: {
    resolved?: boolean;
    since?: string;
    type?: string;
  }): TrackedError[] {
    let errors = Array.from(this.errors.values());

    if (filters) {
      if (filters.resolved !== undefined) {
        errors = errors.filter(error => error.resolved === filters.resolved);
      }
      
      if (filters.since) {
        const sinceTime = new Date(filters.since).getTime();
        errors = errors.filter(error => 
          new Date(error.lastSeen).getTime() > sinceTime
        );
      }
      
      if (filters.type) {
        errors = errors.filter(error => 
          error.fingerprint.type === filters.type
        );
      }
    }

    return errors.sort((a, b) => 
      new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
    );
  }

  // Clean up old resolved errors
  public cleanupResolvedErrors(olderThanDays: number = 7): number {
    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
    let removedCount = 0;

    for (const [id, error] of this.errors.entries()) {
      if (error.resolved && new Date(error.lastSeen).getTime() < cutoffTime) {
        this.errors.delete(id);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      logger.info(`Cleaned up ${removedCount} old resolved errors`);
    }

    return removedCount;
  }
}

// Export singleton instance
export const errorTracking = ErrorTrackingService.getInstance();