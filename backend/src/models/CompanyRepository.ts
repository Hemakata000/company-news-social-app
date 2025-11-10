import { pool } from '../config/database.js';
import { Company, CreateCompanyData, CompanyWithArticles } from './types.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const COMPANIES_FILE = path.join(__dirname, '../../data/companies.json');

// Helper to read companies from JSON
function readCompanies(): Company[] {
  try {
    const data = fs.readFileSync(COMPANIES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Helper to write companies to JSON
function writeCompanies(companies: Company[]): void {
  fs.writeFileSync(COMPANIES_FILE, JSON.stringify(companies, null, 2));
}

export class CompanyRepository {
  // Find company by exact name
  static async findByName(name: string): Promise<Company | null> {
    try {
      const companies = readCompanies();
      const company = companies.find(c => c.name.toLowerCase() === name.toLowerCase());
      return company || null;
    } catch (error) {
      console.error('Error finding company by name:', error);
      throw error;
    }
  }

  // Find company by name or alias
  static async findByNameOrAlias(searchName: string): Promise<Company | null> {
    try {
      const companies = readCompanies();
      const lowerSearch = searchName.toLowerCase();
      
      const company = companies.find(c => 
        c.name.toLowerCase() === lowerSearch ||
        c.ticker_symbol?.toLowerCase() === lowerSearch ||
        (Array.isArray(c.aliases) && c.aliases.some(alias => 
          alias.toLowerCase() === lowerSearch
        ))
      );
      
      return company || null;
    } catch (error) {
      console.error('Error finding company by name or alias:', error);
      throw error;
    }
  }

  // Create new company
  static async create(data: CreateCompanyData): Promise<Company> {
    try {
      const companies = readCompanies();
      const newId = companies.length > 0 ? Math.max(...companies.map(c => c.id)) + 1 : 1;
      
      const newCompany: Company = {
        id: newId,
        name: data.name,
        aliases: data.aliases || [],
        ticker_symbol: data.ticker_symbol || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      companies.push(newCompany);
      writeCompanies(companies);
      
      return newCompany;
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  }

  // Update company
  static async update(id: number, data: Partial<CreateCompanyData>): Promise<Company | null> {
    try {
      const companies = readCompanies();
      const index = companies.findIndex(c => c.id === id);
      
      if (index === -1) return null;
      
      companies[index] = {
        ...companies[index],
        ...data,
        updated_at: new Date().toISOString()
      };
      
      writeCompanies(companies);
      return companies[index];
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  }

  // Find or create company
  static async findOrCreate(name: string, aliases?: string[], ticker_symbol?: string): Promise<Company> {
    try {
      // First try to find existing company
      let company = await this.findByNameOrAlias(name);
      
      if (!company) {
        // Create new company if not found
        company = await this.create({
          name,
          aliases,
          ticker_symbol
        });
      }
      
      return company;
    } catch (error) {
      console.error('Error in findOrCreate:', error);
      throw error;
    }
  }

  // Get company with recent articles
  static async findWithRecentArticles(id: number, limit: number = 10): Promise<CompanyWithArticles | null> {
    try {
      const company = await this.findById(id);
      if (!company) return null;
      
      // Read news articles
      const newsFile = path.join(__dirname, '../../data/news.json');
      const newsData = fs.readFileSync(newsFile, 'utf-8');
      const allArticles = JSON.parse(newsData);
      
      // Filter articles for this company and sort by date
      const articles = allArticles
        .filter((a: any) => a.company_id === id)
        .sort((a: any, b: any) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
        .slice(0, limit);
      
      return {
        ...company,
        articles
      };
    } catch (error) {
      console.error('Error finding company with articles:', error);
      throw error;
    }
  }

  // Find company by ID
  static async findById(id: number): Promise<Company | null> {
    try {
      const companies = readCompanies();
      const company = companies.find(c => c.id === id);
      return company || null;
    } catch (error) {
      console.error('Error finding company by ID:', error);
      throw error;
    }
  }

  // Get all companies
  static async findAll(limit: number = 100, offset: number = 0): Promise<Company[]> {
    try {
      const companies = readCompanies();
      return companies
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(offset, offset + limit);
    } catch (error) {
      console.error('Error finding all companies:', error);
      throw error;
    }
  }

  // Delete company
  static async delete(id: number): Promise<boolean> {
    try {
      const companies = readCompanies();
      const filtered = companies.filter(c => c.id !== id);
      
      if (filtered.length === companies.length) return false;
      
      writeCompanies(filtered);
      return true;
    } catch (error) {
      console.error('Error deleting company:', error);
      throw error;
    }
  }
}
