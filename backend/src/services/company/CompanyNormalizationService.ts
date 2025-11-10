import { CompanyRepository } from '../../models/CompanyRepository.js';
import { Company, CreateCompanyData } from '../../models/types.js';

export interface CompanyMatch {
  company: Company;
  confidence: number;
  matchType: 'exact' | 'alias' | 'fuzzy' | 'ticker';
}

export interface NormalizationResult {
  normalizedName: string;
  matches: CompanyMatch[];
  suggestedCompany?: Company;
  isValid: boolean;
  validationErrors: string[];
}

export class CompanyNormalizationService {
  private commonSuffixes = [
    'inc', 'incorporated', 'corp', 'corporation', 'ltd', 'limited', 
    'llc', 'co', 'company', 'group', 'holdings', 'enterprises',
    'technologies', 'tech', 'systems', 'solutions', 'services'
  ];
  
  private commonPrefixes = ['the'];

  constructor() {
    // No dependencies needed since we use static repository methods
  }

  async normalizeCompanyName(input: string): Promise<NormalizationResult> {
    const validationErrors = this.validateInput(input);
    if (validationErrors.length > 0) {
      return {
        normalizedName: input.trim(),
        matches: [],
        isValid: false,
        validationErrors
      };
    }

    const normalizedName = this.sanitizeCompanyName(input);
    const matches = await this.findCompanyMatches(normalizedName);
    
    return {
      normalizedName,
      matches: matches.sort((a, b) => b.confidence - a.confidence),
      suggestedCompany: matches.length > 0 ? matches[0].company : undefined,
      isValid: true,
      validationErrors: []
    };
  }

  private validateInput(input: string): string[] {
    const errors: string[] = [];
    
    if (!input || typeof input !== 'string') {
      errors.push('Company name is required');
      return errors;
    }
    
    const trimmed = input.trim();
    if (trimmed.length === 0) {
      errors.push('Company name cannot be empty');
    }
    
    if (trimmed.length < 2) {
      errors.push('Company name must be at least 2 characters long');
    }
    
    if (trimmed.length > 255) {
      errors.push('Company name cannot exceed 255 characters');
    }
    
    // Check for suspicious patterns
    if (/^\d+$/.test(trimmed)) {
      errors.push('Company name cannot be only numbers');
    }
    
    if (/^[^a-zA-Z0-9\s&.-]+$/.test(trimmed)) {
      errors.push('Company name contains invalid characters');
    }
    
    return errors;
  }

  sanitizeCompanyName(input: string): string {
    let normalized = input.trim();
    
    // Convert to lowercase for processing
    let lower = normalized.toLowerCase();
    
    // Remove common prefixes
    this.commonPrefixes.forEach(prefix => {
      const pattern = new RegExp(`^${prefix}\\s+`, 'i');
      lower = lower.replace(pattern, '');
    });
    
    // Remove common suffixes
    this.commonSuffixes.forEach(suffix => {
      const patterns = [
        new RegExp(`\\s+${suffix}\\.?$`, 'i'),
        new RegExp(`\\s+${suffix}\\s*$`, 'i')
      ];
      patterns.forEach(pattern => {
        lower = lower.replace(pattern, '');
      });
    });
    
    // Clean up whitespace and special characters
    lower = lower
      .replace(/\s+/g, ' ')  // Multiple spaces to single space
      .replace(/[^\w\s&.-]/g, '') // Remove special chars except &, ., -
      .trim();
    
    // Return with proper capitalization
    return this.capitalizeCompanyName(lower);
  }

  private capitalizeCompanyName(name: string): string {
    return name
      .split(' ')
      .map(word => {
        if (word.length === 0) return word;
        
        // Handle special cases
        if (['and', 'of', 'the', 'for', 'in', 'on', 'at', 'by'].includes(word.toLowerCase()) && word !== name.split(' ')[0]) {
          return word.toLowerCase();
        }
        
        // Handle abbreviations (all caps if 2-3 letters)
        if (word.length <= 3 && /^[a-zA-Z]+$/.test(word)) {
          return word.toUpperCase();
        }
        
        // Regular capitalization
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }

  private async findCompanyMatches(normalizedName: string): Promise<CompanyMatch[]> {
    const matches: CompanyMatch[] = [];
    
    try {
      // Get all companies for matching (in a real app, this would be paginated/indexed)
      const companies = await CompanyRepository.findAll(1000, 0);
      
      for (const company of companies) {
        const match = this.calculateMatch(normalizedName, company);
        if (match.confidence > 0.3) { // Only include matches with >30% confidence
          matches.push(match);
        }
      }
      
      return matches;
    } catch (error) {
      console.error('Error finding company matches:', error);
      return [];
    }
  }

  private calculateMatch(input: string, company: Company): CompanyMatch {
    const inputLower = input.toLowerCase();
    const companyNameLower = company.name.toLowerCase();
    
    // Exact match
    if (inputLower === companyNameLower) {
      return {
        company,
        confidence: 1.0,
        matchType: 'exact'
      };
    }
    
    // Ticker symbol match
    if (company.ticker_symbol && inputLower === company.ticker_symbol.toLowerCase()) {
      return {
        company,
        confidence: 0.95,
        matchType: 'ticker'
      };
    }
    
    // Alias match
    if (company.aliases && company.aliases.length > 0) {
      for (const alias of company.aliases) {
        if (inputLower === alias.toLowerCase()) {
          return {
            company,
            confidence: 0.9,
            matchType: 'alias'
          };
        }
      }
    }
    
    // Fuzzy matching
    const fuzzyScore = this.calculateFuzzyScore(inputLower, companyNameLower);
    if (fuzzyScore > 0.3) {
      return {
        company,
        confidence: fuzzyScore,
        matchType: 'fuzzy'
      };
    }
    
    return {
      company,
      confidence: 0,
      matchType: 'fuzzy'
    };
  }

  private calculateFuzzyScore(input: string, target: string): number {
    // Simple fuzzy matching using Levenshtein distance
    const distance = this.levenshteinDistance(input, target);
    const maxLength = Math.max(input.length, target.length);
    
    if (maxLength === 0) return 1;
    
    const similarity = 1 - (distance / maxLength);
    
    // Boost score for substring matches
    if (target.includes(input) || input.includes(target)) {
      return Math.max(similarity, 0.7);
    }
    
    // Boost score for word matches
    const inputWords = input.split(' ');
    const targetWords = target.split(' ');
    const wordMatches = inputWords.filter(word => 
      targetWords.some(targetWord => targetWord.includes(word) || word.includes(targetWord))
    ).length;
    
    if (wordMatches > 0) {
      const wordScore = wordMatches / Math.max(inputWords.length, targetWords.length);
      return Math.max(similarity, wordScore * 0.8);
    }
    
    return similarity;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) {
      matrix[0][i] = i;
    }
    
    for (let j = 0; j <= str2.length; j++) {
      matrix[j][0] = j;
    }
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  async findOrCreateCompany(companyName: string, tickerSymbol?: string): Promise<Company> {
    const normalizationResult = await this.normalizeCompanyName(companyName);
    
    if (!normalizationResult.isValid) {
      throw new Error(`Invalid company name: ${normalizationResult.validationErrors.join(', ')}`);
    }
    
    // If we have a high-confidence match, return it
    if (normalizationResult.suggestedCompany && normalizationResult.matches[0]?.confidence > 0.8) {
      return normalizationResult.suggestedCompany;
    }
    
    // Otherwise, create a new company
    const createData: CreateCompanyData = {
      name: normalizationResult.normalizedName,
      ticker_symbol: tickerSymbol || undefined,
      aliases: companyName !== normalizationResult.normalizedName ? [companyName] : []
    };
    
    return await CompanyRepository.create(createData);
  }

  async addCompanyAlias(companyId: number, alias: string): Promise<Company> {
    const normalizationResult = await this.normalizeCompanyName(alias);
    
    if (!normalizationResult.isValid) {
      throw new Error(`Invalid alias: ${normalizationResult.validationErrors.join(', ')}`);
    }
    
    const company = await CompanyRepository.findById(companyId);
    if (!company) {
      throw new Error('Company not found');
    }
    
    const updatedAliases = [...(company.aliases || [])];
    if (!updatedAliases.includes(normalizationResult.normalizedName)) {
      updatedAliases.push(normalizationResult.normalizedName);
    }
    
    const updatedCompany = await CompanyRepository.update(companyId, { aliases: updatedAliases });
    if (!updatedCompany) {
      throw new Error('Failed to update company');
    }
    
    return updatedCompany;
  }
}