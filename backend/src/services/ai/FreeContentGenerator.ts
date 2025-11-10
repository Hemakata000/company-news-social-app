// Free rule-based social media content generator (no AI needed!)
import { NewsArticle } from '../../models/types.js';

interface SocialPost {
  platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram';
  content: string;
  hashtags: string[];
  characterCount: number;
}

export class FreeContentGenerator {
  // Extract key phrases from article
  private extractKeyPhrases(text: string, limit: number = 5): string[] {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4);
    
    // Remove common words
    const stopWords = new Set([
      'about', 'after', 'before', 'being', 'could', 'during', 'every',
      'first', 'found', 'great', 'having', 'other', 'should', 'their',
      'there', 'these', 'those', 'under', 'where', 'which', 'while', 'would'
    ]);
    
    const filtered = words.filter(word => !stopWords.has(word));
    
    // Count frequency
    const frequency: Record<string, number> = {};
    filtered.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });
    
    // Get top phrases
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word]) => word);
  }

  // Generate hashtags from article
  private generateHashtags(article: NewsArticle, companyName: string): string[] {
    const hashtags = new Set<string>();
    
    // Add company name
    const companyTag = companyName.replace(/[^\w]/g, '');
    hashtags.add(`#${companyTag}`);
    
    // Extract key phrases
    const keyPhrases = this.extractKeyPhrases(article.title + ' ' + article.content, 3);
    keyPhrases.forEach(phrase => {
      const tag = phrase.charAt(0).toUpperCase() + phrase.slice(1);
      hashtags.add(`#${tag}`);
    });
    
    // Add generic business hashtags
    const genericTags = ['#Business', '#News', '#Technology', '#Finance', '#Innovation'];
    genericTags.slice(0, 2).forEach(tag => hashtags.add(tag));
    
    return Array.from(hashtags).slice(0, 5);
  }

  // Detect sentiment from article
  private detectSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = [
      'growth', 'success', 'profit', 'gain', 'increase', 'rise', 'up', 'high',
      'strong', 'better', 'improve', 'win', 'achieve', 'breakthrough', 'innovation',
      'launch', 'expand', 'record', 'best', 'excellent', 'outstanding'
    ];
    
    const negativeWords = [
      'loss', 'decline', 'fall', 'drop', 'down', 'low', 'weak', 'worse',
      'fail', 'crisis', 'problem', 'issue', 'concern', 'risk', 'threat',
      'lawsuit', 'scandal', 'layoff', 'cut', 'reduce', 'struggle'
    ];
    
    const lowerText = text.toLowerCase();
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) negativeCount++;
    });
    
    if (positiveCount > negativeCount + 1) return 'positive';
    if (negativeCount > positiveCount + 1) return 'negative';
    return 'neutral';
  }

  // Generate LinkedIn post
  private generateLinkedInPost(article: NewsArticle, companyName: string): SocialPost {
    const sentiment = this.detectSentiment(article.title + ' ' + article.content);
    const hashtags = this.generateHashtags(article, companyName);
    
    let intro = '';
    if (sentiment === 'positive') {
      intro = '📈 Exciting news from ' + companyName + '!\n\n';
    } else if (sentiment === 'negative') {
      intro = '📊 Important update on ' + companyName + ':\n\n';
    } else {
      intro = '📰 Latest from ' + companyName + ':\n\n';
    }
    
    const summary = article.title;
    const cta = '\n\nWhat are your thoughts on this development?\n\n';
    const hashtagString = hashtags.join(' ');
    
    const content = intro + summary + cta + hashtagString;
    
    return {
      platform: 'linkedin',
      content: content.slice(0, 3000),
      hashtags,
      characterCount: content.length
    };
  }

  // Generate Twitter post
  private generateTwitterPost(article: NewsArticle, companyName: string): SocialPost {
    const sentiment = this.detectSentiment(article.title);
    const hashtags = this.generateHashtags(article, companyName).slice(0, 3);
    
    let emoji = '📰';
    if (sentiment === 'positive') emoji = '🚀';
    if (sentiment === 'negative') emoji = '⚠️';
    
    // Keep it short for Twitter
    const title = article.title.length > 200 
      ? article.title.slice(0, 197) + '...' 
      : article.title;
    
    const content = `${emoji} ${title}\n\n${hashtags.join(' ')}`;
    
    return {
      platform: 'twitter',
      content: content.slice(0, 280),
      hashtags,
      characterCount: content.length
    };
  }

  // Generate Facebook post
  private generateFacebookPost(article: NewsArticle, companyName: string): SocialPost {
    const sentiment = this.detectSentiment(article.title + ' ' + article.content);
    const hashtags = this.generateHashtags(article, companyName);
    
    let intro = '';
    if (sentiment === 'positive') {
      intro = '🎉 Great news! ';
    } else if (sentiment === 'negative') {
      intro = '📢 Breaking: ';
    } else {
      intro = '📰 News Update: ';
    }
    
    const summary = article.title;
    const engagement = '\n\nWhat do you think about this? Share your thoughts below! 👇';
    const hashtagString = '\n\n' + hashtags.join(' ');
    
    const content = intro + summary + engagement + hashtagString;
    
    return {
      platform: 'facebook',
      content: content.slice(0, 5000),
      hashtags,
      characterCount: content.length
    };
  }

  // Generate Instagram caption
  private generateInstagramPost(article: NewsArticle, companyName: string): SocialPost {
    const hashtags = this.generateHashtags(article, companyName);
    const sentiment = this.detectSentiment(article.title);
    
    let emoji = '📱';
    if (sentiment === 'positive') emoji = '✨';
    if (sentiment === 'negative') emoji = '📊';
    
    // Instagram style - shorter, more visual
    const title = article.title.length > 150 
      ? article.title.slice(0, 147) + '...' 
      : article.title;
    
    const content = `${emoji} ${title}\n\n${companyName} making headlines!\n\n${hashtags.join(' ')} #BusinessNews #TechNews`;
    
    return {
      platform: 'instagram',
      content: content.slice(0, 2200),
      hashtags,
      characterCount: content.length
    };
  }

  // Main method to generate all social posts
  async generateSocialContent(
    article: NewsArticle,
    companyName: string
  ): Promise<SocialPost[]> {
    return [
      this.generateLinkedInPost(article, companyName),
      this.generateTwitterPost(article, companyName),
      this.generateFacebookPost(article, companyName),
      this.generateInstagramPost(article, companyName)
    ];
  }

  // Generate highlights from article
  async generateHighlights(article: NewsArticle): Promise<string[]> {
    const text = article.content || article.title;
    
    // Split into sentences
    const sentences = text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20 && s.length < 200);
    
    // Take first 3-5 meaningful sentences
    return sentences.slice(0, Math.min(5, sentences.length));
  }

  // Health check
  async healthCheck(): Promise<{ status: 'healthy'; provider: string }> {
    return {
      status: 'healthy',
      provider: 'FreeContentGenerator'
    };
  }
}

// Export singleton instance
export const freeContentGenerator = new FreeContentGenerator();
