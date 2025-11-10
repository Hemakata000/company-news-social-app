import type { NewsHighlight } from '../services/ai/types.js';

export interface HighlightValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateHighlight(highlight: NewsHighlight): HighlightValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate text content
  if (!highlight.text || typeof highlight.text !== 'string') {
    errors.push('Highlight text is required and must be a string');
  } else {
    const text = highlight.text.trim();
    if (text.length === 0) {
      errors.push('Highlight text cannot be empty');
    } else if (text.length < 10) {
      warnings.push('Highlight text is very short (less than 10 characters)');
    } else if (text.length > 500) {
      warnings.push('Highlight text is very long (more than 500 characters)');
    }
  }

  // Validate importance
  if (typeof highlight.importance !== 'number') {
    errors.push('Importance must be a number');
  } else if (highlight.importance < 1 || highlight.importance > 5) {
    errors.push('Importance must be between 1 and 5');
  }

  // Validate category
  const validCategories = ['financial', 'operational', 'strategic', 'market', 'general'];
  if (!validCategories.includes(highlight.category)) {
    errors.push(`Category must be one of: ${validCategories.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function validateHighlights(highlights: NewsHighlight[]): HighlightValidationResult {
  if (!Array.isArray(highlights)) {
    return {
      isValid: false,
      errors: ['Highlights must be an array'],
      warnings: []
    };
  }

  if (highlights.length === 0) {
    return {
      isValid: false,
      errors: ['At least one highlight is required'],
      warnings: []
    };
  }

  if (highlights.length > 10) {
    return {
      isValid: false,
      errors: ['Too many highlights (maximum 10 allowed)'],
      warnings: []
    };
  }

  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  highlights.forEach((highlight, index) => {
    const validation = validateHighlight(highlight);
    
    validation.errors.forEach(error => {
      allErrors.push(`Highlight ${index + 1}: ${error}`);
    });
    
    validation.warnings.forEach(warning => {
      allWarnings.push(`Highlight ${index + 1}: ${warning}`);
    });
  });

  // Check for duplicate highlights
  const textSet = new Set();
  highlights.forEach((highlight, index) => {
    const normalizedText = highlight.text.toLowerCase().trim();
    if (textSet.has(normalizedText)) {
      allWarnings.push(`Highlight ${index + 1}: Duplicate or very similar content detected`);
    }
    textSet.add(normalizedText);
  });

  // Check importance distribution
  const importanceCounts = highlights.reduce((acc, h) => {
    acc[h.importance] = (acc[h.importance] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  if (highlights.length > 3 && !importanceCounts[4] && !importanceCounts[5]) {
    allWarnings.push('No high-importance highlights found (4-5 rating)');
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings
  };
}

export function formatHighlightForDisplay(highlight: NewsHighlight): string {
  const importanceStars = '★'.repeat(highlight.importance) + '☆'.repeat(5 - highlight.importance);
  const categoryTag = `[${highlight.category.toUpperCase()}]`;
  
  return `${categoryTag} ${importanceStars} ${highlight.text}`;
}

export function formatHighlightsForSummary(highlights: NewsHighlight[]): string {
  if (highlights.length === 0) {
    return 'No highlights available.';
  }

  // Sort by importance (highest first)
  const sortedHighlights = [...highlights].sort((a, b) => b.importance - a.importance);
  
  return sortedHighlights
    .map((highlight, index) => `${index + 1}. ${highlight.text}`)
    .join('\n');
}

export function filterHighlightsByCategory(
  highlights: NewsHighlight[], 
  categories: NewsHighlight['category'][]
): NewsHighlight[] {
  return highlights.filter(highlight => categories.includes(highlight.category));
}

export function filterHighlightsByImportance(
  highlights: NewsHighlight[], 
  minImportance: number = 1
): NewsHighlight[] {
  return highlights.filter(highlight => highlight.importance >= minImportance);
}

export function getHighlightStats(highlights: NewsHighlight[]): {
  total: number;
  byCategory: Record<string, number>;
  byImportance: Record<number, number>;
  averageImportance: number;
} {
  const byCategory: Record<string, number> = {};
  const byImportance: Record<number, number> = {};
  let totalImportance = 0;

  highlights.forEach(highlight => {
    byCategory[highlight.category] = (byCategory[highlight.category] || 0) + 1;
    byImportance[highlight.importance] = (byImportance[highlight.importance] || 0) + 1;
    totalImportance += highlight.importance;
  });

  return {
    total: highlights.length,
    byCategory,
    byImportance,
    averageImportance: highlights.length > 0 ? totalImportance / highlights.length : 0
  };
}