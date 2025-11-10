// Simple JSON-based database for MVP (no SQL needed!)
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database directory
const DB_DIR = path.join(__dirname, '../../data');
const COMPANIES_FILE = path.join(DB_DIR, 'companies.json');
const NEWS_FILE = path.join(DB_DIR, 'news.json');
const SOCIAL_FILE = path.join(DB_DIR, 'social.json');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initialize JSON files
function initFiles() {
  if (!fs.existsSync(COMPANIES_FILE)) {
    fs.writeFileSync(COMPANIES_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(NEWS_FILE)) {
    fs.writeFileSync(NEWS_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(SOCIAL_FILE)) {
    fs.writeFileSync(SOCIAL_FILE, JSON.stringify([], null, 2));
  }
}

initFiles();

// Simple in-memory cache
const cache = {
  companies: JSON.parse(fs.readFileSync(COMPANIES_FILE, 'utf-8')),
  news: JSON.parse(fs.readFileSync(NEWS_FILE, 'utf-8')),
  social: JSON.parse(fs.readFileSync(SOCIAL_FILE, 'utf-8'))
};

// Save to disk
function saveToFile(type: 'companies' | 'news' | 'social') {
  const file = type === 'companies' ? COMPANIES_FILE : type === 'news' ? NEWS_FILE : SOCIAL_FILE;
  fs.writeFileSync(file, JSON.stringify(cache[type], null, 2));
}

// Simple query executor
export const pool = {
  query: async (text: string, params?: any[]) => {
    try {
      const upperText = text.trim().toUpperCase();
      
      // Handle SELECT queries
      if (upperText.startsWith('SELECT')) {
        if (upperText.includes('FROM COMPANIES')) {
          return { rows: cache.companies, rowCount: cache.companies.length };
        }
        if (upperText.includes('FROM NEWS_ARTICLES')) {
          return { rows: cache.news, rowCount: cache.news.length };
        }
        if (upperText.includes('FROM SOCIAL_CONTENT')) {
          return { rows: cache.social, rowCount: cache.social.length };
        }
        // Generic SELECT (for migrations)
        return { rows: [{ test: 1 }], rowCount: 1 };
      }
      
      // Handle INSERT queries
      if (upperText.startsWith('INSERT')) {
        if (upperText.includes('INTO COMPANIES')) {
          const id = cache.companies.length + 1;
          const newItem = { id, ...params };
          cache.companies.push(newItem);
          saveToFile('companies');
          return { rows: [], rowCount: 1, lastID: id };
        }
        if (upperText.includes('INTO NEWS_ARTICLES')) {
          const id = cache.news.length + 1;
          const newItem = { id, ...params };
          cache.news.push(newItem);
          saveToFile('news');
          return { rows: [], rowCount: 1, lastID: id };
        }
        if (upperText.includes('INTO SOCIAL_CONTENT')) {
          const id = cache.social.length + 1;
          const newItem = { id, ...params };
          cache.social.push(newItem);
          saveToFile('social');
          return { rows: [], rowCount: 1, lastID: id };
        }
        // Generic INSERT (for migrations table)
        return { rows: [], rowCount: 1, lastID: 1 };
      }
      
      // Handle CREATE TABLE (for migrations)
      if (upperText.startsWith('CREATE')) {
        console.log('✅ Table created (using JSON storage)');
        return { rows: [], rowCount: 0 };
      }
      
      // Handle other queries
      return { rows: [], rowCount: 0 };
      
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  },
  
  connect: async () => ({
    query: pool.query,
    release: () => {}
  })
};

// Test database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const result = await pool.query('SELECT 1 as test');
    console.log('✅ JSON database connected successfully');
    console.log(`📁 Database location: ${DB_DIR}`);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Graceful shutdown
export const closePool = async (): Promise<void> => {
  try {
    saveToFile('companies');
    saveToFile('news');
    saveToFile('social');
    console.log('Database saved and closed');
  } catch (error) {
    console.error('Error closing database:', error);
  }
};

// Auto-save periodically
setInterval(() => {
  saveToFile('companies');
  saveToFile('news');
  saveToFile('social');
}, 30000); // Save every 30 seconds
