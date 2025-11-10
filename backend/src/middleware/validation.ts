import { Request, Response, NextFunction } from 'express';
import type { NewsHighlight } from '../services/ai/types.js';

// Custom error class for validation errors
export class ValidationError extends Error {
  public code: string;
  public field?: string;
  public value?: any;

  constructor(message: string, code: string = 'VALIDATION_ERROR', field?: string, value?: any) {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
    this.field = field;
    this.value = value;
  }
}

// Validate company name parameter
export const validateCompanyName = (req: Request, res: Response, next: NextFunction) => {
  const { companyName } = req.params;

  if (!companyName) {
    return next(new ValidationError('Company name is required', 'MISSING_COMPANY_NAME', 'companyName'));
  }

  if (typeof companyName !== 'string') {
    return next(new ValidationError('Company name must be a string', 'INVALID_COMPANY_NAME_TYPE', 'companyName', companyName));
  }

  const trimmedName = companyName.trim();
  if (trimmedName.length < 2) {
    return next(new ValidationError('Company name must be at least 2 characters long', 'COMPANY_NAME_TOO_SHORT', 'companyName', companyName));
  }

  if (trimmedName.length > 100) {
    return next(new ValidationError('Company name must be less than 100 characters', 'COMPANY_NAME_TOO_LONG', 'companyName', companyName));
  }

  // Check for potentially malicious input
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /\$\(/,
    /eval\(/i,
  ];

  if (dangerousPatterns.some(pattern => pattern.test(trimmedName))) {
    return next(new ValidationError('Company name contains invalid characters', 'INVALID_COMPANY_NAME_CONTENT', 'companyName', companyName));
  }

  // Update the parameter with the trimmed value
  req.params.companyName = trimmedName;
  next();
};

// Validate content generation request
export const validateContentRequest = (req: Request, res: Response, next: NextFunction) => {
  const { highlights, companyName, platforms, tone } = req.body;

  // Validate highlights
  if (!highlights) {
    return next(new ValidationError('Highlights are required', 'MISSING_HIGHLIGHTS', 'highlights'));
  }

  if (!Array.isArray(highlights)) {
    return next(new ValidationError('Highlights must be an array', 'INVALID_HIGHLIGHTS_TYPE', 'highlights', highlights));
  }

  if (highlights.length === 0) {
    return next(new ValidationError('At least one highlight is required', 'EMPTY_HIGHLIGHTS', 'highlights', highlights));
  }

  if (highlights.length > 10) {
    return next(new ValidationError('Maximum 10 highlights allowed', 'TOO_MANY_HIGHLIGHTS', 'highlights', highlights.length));
  }

  // Validate each highlight
  for (let i = 0; i < highlights.length; i++) {
    const highlight = highlights[i];
    
    if (!highlight || typeof highlight !== 'object') {
      return next(new ValidationError(`Highlight at index ${i} must be an object`, 'INVALID_HIGHLIGHT_TYPE', `highlights[${i}]`, highlight));
    }

    if (!highlight.text || typeof highlight.text !== 'string') {
      return next(new ValidationError(`Highlight at index ${i} must have a text property`, 'MISSING_HIGHLIGHT_TEXT', `highlights[${i}].text`, highlight.text));
    }

    if (highlight.text.trim().length < 10) {
      return next(new ValidationError(`Highlight at index ${i} text must be at least 10 characters`, 'HIGHLIGHT_TEXT_TOO_SHORT', `highlights[${i}].text`, highlight.text));
    }

    if (highlight.text.length > 500) {
      return next(new ValidationError(`Highlight at index ${i} text must be less than 500 characters`, 'HIGHLIGHT_TEXT_TOO_LONG', `highlights[${i}].text`, highlight.text));
    }

    // Validate importance if provided
    if (highlight.importance !== undefined) {
      if (typeof highlight.importance !== 'number' || highlight.importance < 0 || highlight.importance > 1) {
        return next(new ValidationError(`Highlight at index ${i} importance must be a number between 0 and 1`, 'INVALID_HIGHLIGHT_IMPORTANCE', `highlights[${i}].importance`, highlight.importance));
      }
    }
  }

  // Validate company name
  if (!companyName) {
    return next(new ValidationError('Company name is required', 'MISSING_COMPANY_NAME', 'companyName'));
  }

  if (typeof companyName !== 'string') {
    return next(new ValidationError('Company name must be a string', 'INVALID_COMPANY_NAME_TYPE', 'companyName', companyName));
  }

  const trimmedCompanyName = companyName.trim();
  if (trimmedCompanyName.length < 2) {
    return next(new ValidationError('Company name must be at least 2 characters long', 'COMPANY_NAME_TOO_SHORT', 'companyName', companyName));
  }

  if (trimmedCompanyName.length > 100) {
    return next(new ValidationError('Company name must be less than 100 characters', 'COMPANY_NAME_TOO_LONG', 'companyName', companyName));
  }

  // Validate platforms if provided
  if (platforms !== undefined) {
    if (!Array.isArray(platforms)) {
      return next(new ValidationError('Platforms must be an array', 'INVALID_PLATFORMS_TYPE', 'platforms', platforms));
    }

    const validPlatforms = ['linkedin', 'twitter', 'facebook', 'instagram'];
    const invalidPlatforms = platforms.filter(p => !validPlatforms.includes(p));
    
    if (invalidPlatforms.length > 0) {
      return next(new ValidationError(
        `Invalid platforms: ${invalidPlatforms.join(', ')}. Valid platforms: ${validPlatforms.join(', ')}`,
        'INVALID_PLATFORMS',
        'platforms',
        invalidPlatforms
      ));
    }

    if (platforms.length === 0) {
      return next(new ValidationError('At least one platform is required', 'EMPTY_PLATFORMS', 'platforms', platforms));
    }

    if (platforms.length > 4) {
      return next(new ValidationError('Maximum 4 platforms allowed', 'TOO_MANY_PLATFORMS', 'platforms', platforms.length));
    }
  }

  // Validate tone if provided
  if (tone !== undefined) {
    const validTones = ['professional', 'casual', 'enthusiastic'];
    if (!validTones.includes(tone)) {
      return next(new ValidationError(
        `Invalid tone: ${tone}. Valid tones: ${validTones.join(', ')}`,
        'INVALID_TONE',
        'tone',
        tone
      ));
    }
  }

  // Update request body with cleaned values
  req.body.companyName = trimmedCompanyName;
  req.body.highlights = highlights.map((h: any) => ({
    ...h,
    text: h.text.trim(),
  }));

  next();
};

// Validate query parameters for search endpoints
export const validateSearchQuery = (req: Request, res: Response, next: NextFunction) => {
  const { q: query } = req.query;

  if (!query) {
    return next(new ValidationError('Query parameter "q" is required', 'MISSING_QUERY', 'q'));
  }

  if (typeof query !== 'string') {
    return next(new ValidationError('Query must be a string', 'INVALID_QUERY_TYPE', 'q', query));
  }

  const trimmedQuery = query.trim();
  if (trimmedQuery.length < 2) {
    return next(new ValidationError('Query must be at least 2 characters long', 'QUERY_TOO_SHORT', 'q', query));
  }

  if (trimmedQuery.length > 100) {
    return next(new ValidationError('Query must be less than 100 characters', 'QUERY_TOO_LONG', 'q', query));
  }

  // Update query parameter with cleaned value
  req.query.q = trimmedQuery;
  next();
};

// Validate pagination parameters
export const validatePagination = (req: Request, res: Response, next: NextFunction) => {
  const { limit, offset } = req.query;

  if (limit !== undefined) {
    const limitNum = parseInt(limit as string);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return next(new ValidationError('Limit must be a number between 1 and 100', 'INVALID_LIMIT', 'limit', limit));
    }
    req.query.limit = limitNum.toString();
  }

  if (offset !== undefined) {
    const offsetNum = parseInt(offset as string);
    if (isNaN(offsetNum) || offsetNum < 0) {
      return next(new ValidationError('Offset must be a non-negative number', 'INVALID_OFFSET', 'offset', offset));
    }
    req.query.offset = offsetNum.toString();
  }

  next();
};