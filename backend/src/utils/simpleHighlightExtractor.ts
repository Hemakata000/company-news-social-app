/**
 * Simple highlight extractor that doesn't require AI
 * Extracts key sentences from article content
 */

export class SimpleHighlightExtractor {
  /**
   * Extract highlights from article content
   */
  static extractHighlights(content: string, maxHighlights: number = 3): string[] {
    if (!content || content.trim().length === 0) {
      return [];
    }

    // Clean the content
    const cleanContent = content
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim();

    // Split into sentences
    const sentences = cleanContent
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20 && s.length < 200); // Filter out too short or too long

    if (sentences.length === 0) {
      return [];
    }

    // Take first few sentences as highlights
    const highlights = sentences
      .slice(0, maxHighlights)
      .map(s => {
        // Ensure sentence ends with period
        if (!s.match(/[.!?]$/)) {
          s += '.';
        }
        return s;
      });

    return highlights;
  }

  /**
   * Extract highlights from title and content
   */
  static extractFromArticle(title: string, content: string): string[] {
    const highlights: string[] = [];

    // Add title as first highlight if it's meaningful
    if (title && title.length > 10) {
      highlights.push(title);
    }

    // Extract from content
    const contentHighlights = this.extractHighlights(content, 2);
    highlights.push(...contentHighlights);

    // Return max 3 highlights
    return highlights.slice(0, 3);
  }
}
