import { pool } from '../config/database.js';
import { NewsArticle, CreateNewsArticleData } from './types.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const NEWS_FILE = path.join(__dirname, '../../data/news.json');

// Helper to read news from JSON
function readNews(): NewsArticle[] {
  try {
    const data = fs.readFileSync(NEWS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Helper to write news to JSON
function writeNews(news: NewsArticle[]): void {
  fs.writeFileSync(NEWS_FILE, JSON.stringify(news, null, 2));
}

export class NewsArticleRepository {
  // Create new article
  static async create(data: CreateNewsArticleData): Promise<NewsArticle> {
    try {
      const articles = readNews();
      const newId = articles.length > 0 ? Math.max(...articles.map(a => a.id)) + 1 : 1;
      
      const newArticle: NewsArticle = {
        id: newId,
        company_id: data.company_id,
        title: data.title,
        content: data.content || null,
        highlights: data.highlights || [],
        source_url: data.source_url,
        source_name: data.source_name || null,
        published_at: data.published_at || new Date().toISOString(),
        fetched_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      
      articles.push(newArticle);
      writeNews(articles);
      
      return newArticle;
    } catch (error) {
      console.error('Error creating news article:', error);
      throw error;
    }
  }

  // Find articles by company ID
  static async findByCompanyId(
    companyId: number,
    options: { limit?: number; offset?: number } = {}
  ): Promise<NewsArticle[]> {
    try {
      const articles = readNews();
      const { limit = 10, offset = 0 } = options;
      
      return articles
        .filter(a => a.company_id === companyId)
        .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
        .slice(offset, offset + limit);
    } catch (error) {
      console.error('Error finding articles by company ID:', error);
      throw error;
    }
  }

  // Find article by source URL
  static async findBySourceUrl(sourceUrl: string): Promise<NewsArticle | null> {
    try {
      const articles = readNews();
      const article = articles.find(a => a.source_url === sourceUrl);
      return article || null;
    } catch (error) {
      console.error('Error finding article by source URL:', error);
      throw error;
    }
  }

  // Find article by ID
  static async findById(id: number): Promise<NewsArticle | null> {
    try {
      const articles = readNews();
      const article = articles.find(a => a.id === id);
      return article || null;
    } catch (error) {
      console.error('Error finding article by ID:', error);
      throw error;
    }
  }

  // Update article
  static async update(id: number, data: Partial<CreateNewsArticleData>): Promise<NewsArticle | null> {
    try {
      const articles = readNews();
      const index = articles.findIndex(a => a.id === id);
      
      if (index === -1) return null;
      
      articles[index] = {
        ...articles[index],
        ...data
      };
      
      writeNews(articles);
      return articles[index];
    } catch (error) {
      console.error('Error updating article:', error);
      throw error;
    }
  }

  // Delete article
  static async delete(id: number): Promise<boolean> {
    try {
      const articles = readNews();
      const filtered = articles.filter(a => a.id !== id);
      
      if (filtered.length === articles.length) return false;
      
      writeNews(filtered);
      return true;
    } catch (error) {
      console.error('Error deleting article:', error);
      throw error;
    }
  }

  // Get recent articles across all companies
  static async findRecent(limit: number = 20): Promise<NewsArticle[]> {
    try {
      const articles = readNews();
      return articles
        .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error finding recent articles:', error);
      throw error;
    }
  }

  // Bulk create articles
  static async createMany(articles: CreateNewsArticleData[]): Promise<NewsArticle[]> {
    try {
      const existingArticles = readNews();
      const newArticles: NewsArticle[] = [];
      let nextId = existingArticles.length > 0 ? Math.max(...existingArticles.map(a => a.id)) + 1 : 1;
      
      for (const data of articles) {
        // Check if article already exists by source URL
        const exists = existingArticles.some(a => a.source_url === data.source_url);
        if (exists) continue;
        
        const newArticle: NewsArticle = {
          id: nextId++,
          company_id: data.company_id,
          title: data.title,
          content: data.content || null,
          highlights: data.highlights || [],
          source_url: data.source_url,
          source_name: data.source_name || null,
          published_at: data.published_at || new Date().toISOString(),
          fetched_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
        
        newArticles.push(newArticle);
      }
      
      if (newArticles.length > 0) {
        const allArticles = [...existingArticles, ...newArticles];
        writeNews(allArticles);
      }
      
      return newArticles;
    } catch (error) {
      console.error('Error creating many articles:', error);
      throw error;
    }
  }
}
