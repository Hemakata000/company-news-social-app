import type { NewsHighlight, SocialMediaPost, SocialContentResponse } from './types.js';

export interface ContentQualityScore {
  score: number; // 0-100
  issues: string[];
  warnings: string[];
  isAcceptable: boolean;
}

export interface HighlightQualityScore extends ContentQualityScore {
  highlightSpecificIssues: {
    tooGeneric: boolean;
    lacksConcreteness: boolean;
    poorImportanceScoring: boolean;
    incorrectCategorization: boolean;
  };
}

export interface SocialContentQualityScore extends ContentQualityScore {
  socialSpecificIssues: {
    exceedsCharacterLimit: boolean;
    poorHashtagQuality: boolean;
    inappropriateTone: boolean;
    lacksPlatformOptimization: boolean;
  };
}

export class ContentQualityValidator {
  private static readonly MIN_ACCEPTABLE_SCORE = 60;
  private static readonly MIN_HIGHLIGHT_LENGTH = 10;
  private static readonly MAX_HIGHLIGHT_LENGTH = 300;
  private static readonly GENERIC_PHRASES = [
    'the company',
    'it is important',
    'this is significant',
    'according to reports',
    'industry experts',
    'market analysts',
    'sources say'
  ];

  static validateHighlights(highlights: NewsHighlight[], companyName: string): HighlightQualityScore {
    const issues: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    const highlightSpecificIssues = {
      tooGeneric: false,
      lacksConcreteness: false,
      poorImportanceScoring: false,
      incorrectCategorization: false
    };

    // Check if we have any highlights
    if (highlights.length === 0) {
      issues.push('No highlights provided');
      score -= 50;
    }

    // Check each highlight
    highlights.forEach((highlight, index) => {
      // Length validation
      if (highlight.text.length < this.MIN_HIGHLIGHT_LENGTH) {
        issues.push(`Highlight ${index + 1} is too short (${highlight.text.length} chars)`);
        score -= 10;
      }

      if (highlight.text.length > this.MAX_HIGHLIGHT_LENGTH) {
        warnings.push(`Highlight ${index + 1} is quite long (${highlight.text.length} chars)`);
        score -= 5;
      }

      // Generic content check
      const isGeneric = this.GENERIC_PHRASES.some(phrase => 
        highlight.text.toLowerCase().includes(phrase.toLowerCase())
      );
      if (isGeneric) {
        highlightSpecificIssues.tooGeneric = true;
        warnings.push(`Highlight ${index + 1} contains generic phrases`);
        score -= 8;
      }

      // Concreteness check (look for numbers, specific facts)
      const hasNumbers = /\d/.test(highlight.text);
      const hasSpecificTerms = /\b(revenue|profit|loss|growth|decline|increase|decrease|million|billion|percent|%)\b/i.test(highlight.text);
      
      if (!hasNumbers && !hasSpecificTerms) {
        highlightSpecificIssues.lacksConcreteness = true;
        warnings.push(`Highlight ${index + 1} lacks concrete data or specific facts`);
        score -= 5;
      }

      // Company name inclusion check
      const companyNameVariations = [
        companyName.toLowerCase(),
        companyName.toLowerCase().replace(/\s+/g, ''),
        companyName.toLowerCase().split(' ')[0] // First word of company name
      ];

      const mentionsCompany = companyNameVariations.some(variation => 
        highlight.text.toLowerCase().includes(variation)
      );

      if (!mentionsCompany) {
        warnings.push(`Highlight ${index + 1} doesn't clearly reference the company`);
        score -= 3;
      }

      // Importance scoring validation
      if (highlight.importance < 1 || highlight.importance > 5) {
        highlightSpecificIssues.poorImportanceScoring = true;
        issues.push(`Highlight ${index + 1} has invalid importance score: ${highlight.importance}`);
        score -= 10;
      }

      // Category validation
      const validCategories = ['financial', 'operational', 'strategic', 'market', 'general'];
      if (!validCategories.includes(highlight.category)) {
        highlightSpecificIssues.incorrectCategorization = true;
        issues.push(`Highlight ${index + 1} has invalid category: ${highlight.category}`);
        score -= 8;
      }
    });

    // Check for duplicate or very similar highlights
    const duplicateCheck = this.checkForDuplicateHighlights(highlights);
    if (duplicateCheck.hasDuplicates) {
      warnings.push('Some highlights appear to be duplicates or very similar');
      score -= 10;
    }

    // Importance distribution check
    const importanceDistribution = this.analyzeImportanceDistribution(highlights);
    if (importanceDistribution.allSameImportance) {
      highlightSpecificIssues.poorImportanceScoring = true;
      warnings.push('All highlights have the same importance score');
      score -= 5;
    }

    return {
      score: Math.max(0, score),
      issues,
      warnings,
      isAcceptable: score >= this.MIN_ACCEPTABLE_SCORE,
      highlightSpecificIssues
    };
  }

  static validateSocialContent(
    response: SocialContentResponse, 
    requestedPlatforms: string[],
    companyName: string
  ): SocialContentQualityScore {
    const issues: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    const socialSpecificIssues = {
      exceedsCharacterLimit: false,
      poorHashtagQuality: false,
      inappropriateTone: false,
      lacksPlatformOptimization: false
    };

    // Check if we have posts for all requested platforms
    const providedPlatforms = response.posts.map(post => post.platform);
    const missingPlatforms = requestedPlatforms.filter(platform => 
      !providedPlatforms.includes(platform as any)
    );

    if (missingPlatforms.length > 0) {
      issues.push(`Missing content for platforms: ${missingPlatforms.join(', ')}`);
      score -= 20;
    }

    // Validate each post
    response.posts.forEach((post, index) => {
      // Character limit validation
      const characterLimits = {
        linkedin: 300,
        twitter: 280,
        facebook: 250,
        instagram: 200
      };

      const limit = characterLimits[post.platform];
      if (limit && post.characterCount > limit) {
        socialSpecificIssues.exceedsCharacterLimit = true;
        issues.push(`${post.platform} post ${index + 1} exceeds character limit: ${post.characterCount}/${limit}`);
        score -= 15;
      }

      // Content quality checks
      if (post.content.length < 20) {
        issues.push(`${post.platform} post ${index + 1} content is too short`);
        score -= 10;
      }

      // Company name inclusion
      const mentionsCompany = post.content.toLowerCase().includes(companyName.toLowerCase()) ||
        post.hashtags.some(tag => tag.toLowerCase().includes(companyName.toLowerCase().replace(/\s+/g, '')));

      if (!mentionsCompany) {
        warnings.push(`${post.platform} post ${index + 1} doesn't clearly reference the company`);
        score -= 5;
      }

      // Hashtag quality validation
      const hashtagQuality = this.validateHashtags(post.hashtags, post.platform);
      if (!hashtagQuality.isGood) {
        socialSpecificIssues.poorHashtagQuality = true;
        warnings.push(`${post.platform} post ${index + 1} has hashtag issues: ${hashtagQuality.issues.join(', ')}`);
        score -= hashtagQuality.penaltyScore;
      }

      // Platform-specific optimization check
      const platformOptimization = this.checkPlatformOptimization(post);
      if (!platformOptimization.isOptimized) {
        socialSpecificIssues.lacksPlatformOptimization = true;
        warnings.push(`${post.platform} post ${index + 1} lacks platform optimization: ${platformOptimization.issues.join(', ')}`);
        score -= 8;
      }

      // Tone appropriateness (basic check)
      const toneCheck = this.checkToneAppropriateness(post.content, post.platform);
      if (!toneCheck.isAppropriate) {
        socialSpecificIssues.inappropriateTone = true;
        warnings.push(`${post.platform} post ${index + 1} may have inappropriate tone: ${toneCheck.reason}`);
        score -= 5;
      }
    });

    return {
      score: Math.max(0, score),
      issues,
      warnings,
      isAcceptable: score >= this.MIN_ACCEPTABLE_SCORE,
      socialSpecificIssues
    };
  }

  private static checkForDuplicateHighlights(highlights: NewsHighlight[]): { hasDuplicates: boolean, duplicatePairs: number[][] } {
    const duplicatePairs: number[][] = [];
    
    for (let i = 0; i < highlights.length; i++) {
      for (let j = i + 1; j < highlights.length; j++) {
        const similarity = this.calculateTextSimilarity(highlights[i].text, highlights[j].text);
        if (similarity > 0.8) { // 80% similarity threshold
          duplicatePairs.push([i, j]);
        }
      }
    }

    return {
      hasDuplicates: duplicatePairs.length > 0,
      duplicatePairs
    };
  }

  private static analyzeImportanceDistribution(highlights: NewsHighlight[]): { allSameImportance: boolean, distribution: Record<number, number> } {
    const distribution: Record<number, number> = {};
    
    highlights.forEach(highlight => {
      distribution[highlight.importance] = (distribution[highlight.importance] || 0) + 1;
    });

    const uniqueImportanceScores = Object.keys(distribution).length;
    
    return {
      allSameImportance: uniqueImportanceScores === 1 && highlights.length > 1,
      distribution
    };
  }

  private static validateHashtags(hashtags: string[], platform: string): { isGood: boolean, issues: string[], penaltyScore: number } {
    const issues: string[] = [];
    let penaltyScore = 0;

    // Platform-specific hashtag limits
    const platformLimits = {
      linkedin: { max: 5, recommended: 3 },
      twitter: { max: 3, recommended: 2 },
      facebook: { max: 4, recommended: 2 },
      instagram: { max: 5, recommended: 4 }
    };

    const limits = platformLimits[platform as keyof typeof platformLimits];
    
    if (limits && hashtags.length > limits.max) {
      issues.push(`Too many hashtags (${hashtags.length}/${limits.max})`);
      penaltyScore += 5;
    }

    if (hashtags.length === 0) {
      issues.push('No hashtags provided');
      penaltyScore += 8;
    }

    // Validate hashtag format
    hashtags.forEach((tag, index) => {
      if (!tag.startsWith('#')) {
        issues.push(`Hashtag ${index + 1} missing # symbol`);
        penaltyScore += 2;
      }

      if (tag.length > 30) {
        issues.push(`Hashtag ${index + 1} too long`);
        penaltyScore += 2;
      }

      if (!/^#[a-zA-Z0-9_]+$/.test(tag)) {
        issues.push(`Hashtag ${index + 1} contains invalid characters`);
        penaltyScore += 3;
      }
    });

    return {
      isGood: issues.length === 0,
      issues,
      penaltyScore
    };
  }

  private static checkPlatformOptimization(post: SocialMediaPost): { isOptimized: boolean, issues: string[] } {
    const issues: string[] = [];

    // Platform-specific optimization checks
    switch (post.platform) {
      case 'linkedin':
        if (!this.containsBusinessKeywords(post.content)) {
          issues.push('Lacks business/professional keywords');
        }
        break;
      
      case 'twitter':
        if (!this.hasEngagementHooks(post.content)) {
          issues.push('Lacks engagement hooks or trending elements');
        }
        break;
      
      case 'facebook':
        if (!this.hasConversationalTone(post.content)) {
          issues.push('Lacks conversational tone or discussion starters');
        }
        break;
      
      case 'instagram':
        if (!this.hasVisualStorytelling(post.content)) {
          issues.push('Lacks visual storytelling elements');
        }
        break;
    }

    return {
      isOptimized: issues.length === 0,
      issues
    };
  }

  private static checkToneAppropriateness(content: string, platform: string): { isAppropriate: boolean, reason?: string } {
    const contentLower = content.toLowerCase();
    
    // Check for inappropriate elements
    if (contentLower.includes('urgent') || contentLower.includes('breaking')) {
      if (platform !== 'twitter') {
        return { isAppropriate: false, reason: 'Breaking news tone inappropriate for platform' };
      }
    }

    if (contentLower.includes('dm me') || contentLower.includes('link in bio')) {
      if (platform === 'linkedin') {
        return { isAppropriate: false, reason: 'Casual social media language inappropriate for LinkedIn' };
      }
    }

    return { isAppropriate: true };
  }

  private static containsBusinessKeywords(content: string): boolean {
    const businessKeywords = ['revenue', 'growth', 'market', 'industry', 'business', 'strategy', 'investment', 'performance', 'earnings'];
    return businessKeywords.some(keyword => content.toLowerCase().includes(keyword));
  }

  private static hasEngagementHooks(content: string): boolean {
    const hooks = ['what do you think', 'thoughts?', 'breaking:', 'just in:', '🧵', 'thread'];
    return hooks.some(hook => content.toLowerCase().includes(hook));
  }

  private static hasConversationalTone(content: string): boolean {
    const conversationalElements = ['what', 'how', 'why', 'do you', 'have you', 'thoughts', 'opinion'];
    return conversationalElements.some(element => content.toLowerCase().includes(element));
  }

  private static hasVisualStorytelling(content: string): boolean {
    const visualElements = ['behind', 'inside', 'look', 'see', 'watch', 'story', 'journey'];
    return visualElements.some(element => content.toLowerCase().includes(element));
  }

  private static calculateTextSimilarity(text1: string, text2: string): number {
    // Simple similarity calculation using word overlap
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set([...set1].filter(word => set2.has(word)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }
}