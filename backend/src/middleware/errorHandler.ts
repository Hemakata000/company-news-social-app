import { Request, Response, NextFunction } from 'express';
import { ValidationError } from './validation.js';

// Standard error response interface
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    field?: string;
    timestamp: string;
    requestId?: string;
  };
  fallback?: {
    data: any;
    source: string;
    message: string;
  };
}

// Custom error classes
export class APIError extends Error {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode: number = 500, code: string = 'API_ERROR', details?: any) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ServiceUnavailableError extends APIError {
  public fallbackData?: any;
  public fallbackSource?: string;

  constructor(message: string, fallbackData?: any, fallbackSource?: string) {
    super(message, 503, 'SERVICE_UNAVAILABLE');
    this.fallbackData = fallbackData;
    this.fallbackSource = fallbackSource;
  }
}

export class RateLimitError extends APIError {
  public retryAfter?: number;

  constructor(message: string = 'Rate limit exceeded', retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.retryAfter = retryAfter;
  }
}

export class NotFoundError extends APIError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class BadRequestError extends APIError {
  constructor(message: string = 'Bad request') {
    super(message, 400, 'BAD_REQUEST');
  }
}

// Generate unique request ID for tracking
const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Add request ID to all requests
export const addRequestId = (req: Request, res: Response, next: NextFunction) => {
  const requestId = generateRequestId();
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};

// Log errors with context
const logError = (error: Error, req: Request, context?: any) => {
  const logData = {
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    context,
  };

  console.error('API Error:', JSON.stringify(logData, null, 2));
};

// Main error handling middleware
export const handleApiError = (error: Error, req: Request, res: Response, next: NextFunction) => {
  // If response already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(error);
  }

  const requestId = req.requestId || generateRequestId();
  const timestamp = new Date().toISOString();

  // Handle different error types
  if (error instanceof ValidationError) {
    logError(error, req, { field: error.field, value: error.value });
    
    const response: ErrorResponse = {
      error: {
        code: error.code,
        message: error.message,
        field: error.field,
        timestamp,
        requestId,
      },
    };

    return res.status(400).json(response);
  }

  if (error instanceof ServiceUnavailableError) {
    logError(error, req, { fallbackAvailable: !!error.fallbackData });
    
    const response: ErrorResponse = {
      error: {
        code: error.code,
        message: error.message,
        timestamp,
        requestId,
      },
    };

    // Include fallback data if available
    if (error.fallbackData && error.fallbackSource) {
      response.fallback = {
        data: error.fallbackData,
        source: error.fallbackSource,
        message: 'Serving cached or fallback data due to service unavailability',
      };
    }

    return res.status(error.statusCode).json(response);
  }

  if (error instanceof RateLimitError) {
    logError(error, req, { retryAfter: error.retryAfter });
    
    if (error.retryAfter) {
      res.setHeader('Retry-After', error.retryAfter.toString());
    }

    const response: ErrorResponse = {
      error: {
        code: error.code,
        message: error.message,
        timestamp,
        requestId,
      },
    };

    return res.status(error.statusCode).json(response);
  }

  if (error instanceof APIError) {
    logError(error, req, { details: error.details });
    
    const response: ErrorResponse = {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp,
        requestId,
      },
    };

    return res.status(error.statusCode).json(response);
  }

  // Handle specific known error types
  if (error.name === 'SyntaxError' && 'body' in error) {
    logError(error, req, { type: 'JSON_PARSE_ERROR' });
    
    const response: ErrorResponse = {
      error: {
        code: 'INVALID_JSON',
        message: 'Invalid JSON in request body',
        timestamp,
        requestId,
      },
    };

    return res.status(400).json(response);
  }

  if (error.name === 'UnauthorizedError') {
    logError(error, req, { type: 'UNAUTHORIZED' });
    
    const response: ErrorResponse = {
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        timestamp,
        requestId,
      },
    };

    return res.status(401).json(response);
  }

  // Handle database errors
  if (error.message.includes('ECONNREFUSED') || error.message.includes('connection')) {
    logError(error, req, { type: 'DATABASE_CONNECTION_ERROR' });
    
    const response: ErrorResponse = {
      error: {
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database service is temporarily unavailable',
        timestamp,
        requestId,
      },
    };

    return res.status(503).json(response);
  }

  // Handle timeout errors
  if (error.message.includes('timeout') || error.name === 'TimeoutError') {
    logError(error, req, { type: 'TIMEOUT_ERROR' });
    
    const response: ErrorResponse = {
      error: {
        code: 'REQUEST_TIMEOUT',
        message: 'Request timed out. Please try again.',
        timestamp,
        requestId,
      },
    };

    return res.status(408).json(response);
  }

  // Handle external API errors
  if (error.message.includes('API') || error.message.includes('fetch')) {
    logError(error, req, { type: 'EXTERNAL_API_ERROR' });
    
    const response: ErrorResponse = {
      error: {
        code: 'EXTERNAL_SERVICE_ERROR',
        message: 'External service is temporarily unavailable',
        timestamp,
        requestId,
      },
    };

    return res.status(502).json(response);
  }

  // Default server error
  logError(error, req, { type: 'UNHANDLED_ERROR' });
  
  const response: ErrorResponse = {
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : error.message,
      timestamp,
      requestId,
    },
  };

  // Include stack trace in development
  if (process.env.NODE_ENV !== 'production') {
    response.error.details = {
      stack: error.stack,
      name: error.name,
    };
  }

  res.status(500).json(response);
};

// Graceful degradation helper
export const withFallback = async <T>(
  primaryOperation: () => Promise<T>,
  fallbackOperation: () => Promise<T>,
  fallbackSource: string
): Promise<T> => {
  try {
    return await primaryOperation();
  } catch (error) {
    console.warn(`Primary operation failed, using fallback (${fallbackSource}):`, error);
    
    try {
      return await fallbackOperation();
    } catch (fallbackError) {
      console.error(`Fallback operation also failed:`, fallbackError);
      throw new ServiceUnavailableError(
        'Service temporarily unavailable and no fallback data available',
        null,
        fallbackSource
      );
    }
  }
};

// Async error wrapper for route handlers
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Health check error handler
export const handleHealthCheckError = (error: Error): { status: string; error: string } => {
  console.error('Health check error:', error);
  
  return {
    status: 'unhealthy',
    error: error.message || 'Unknown health check error',
  };
};

// Declare module augmentation for Request interface
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}