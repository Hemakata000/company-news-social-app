import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple migration - just create data files with initial data
export const runMigrations = async (): Promise<void> => {
  try {
    console.log('🚀 Starting database setup...');
    
    const DB_DIR = join(__dirname, '../../data');
    
    // Ensure directory exists
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
      console.log('✅ Created data directory');
    }
    
    // Initialize companies file with sample data
    const companiesFile = join(DB_DIR, 'companies.json');
    if (!fs.existsSync(companiesFile)) {
      const companies = [
        { id: 1, name: 'Apple Inc.', aliases: ['Apple', 'AAPL'], ticker_symbol: 'AAPL', created_at: new Date().toISOString() },
        { id: 2, name: 'Microsoft Corporation', aliases: ['Microsoft', 'MSFT'], ticker_symbol: 'MSFT', created_at: new Date().toISOString() },
        { id: 3, name: 'Google LLC', aliases: ['Google', 'Alphabet', 'GOOGL'], ticker_symbol: 'GOOGL', created_at: new Date().toISOString() },
        { id: 4, name: 'Amazon.com Inc.', aliases: ['Amazon', 'AMZN'], ticker_symbol: 'AMZN', created_at: new Date().toISOString() },
        { id: 5, name: 'Tesla Inc.', aliases: ['Tesla', 'TSLA'], ticker_symbol: 'TSLA', created_at: new Date().toISOString() },
        { id: 6, name: 'Accenture', aliases: ['Accenture', 'ACN'], ticker_symbol: 'ACN', created_at: new Date().toISOString() },
        { id: 7, name: 'Wipro Limited', aliases: ['Wipro', 'WIT'], ticker_symbol: 'WIT', created_at: new Date().toISOString() }
      ];
      fs.writeFileSync(companiesFile, JSON.stringify(companies, null, 2));
      console.log('✅ Created companies.json with sample data');
    } else {
      console.log('⏭️  companies.json already exists');
    }
    
    // Initialize news file
    const newsFile = join(DB_DIR, 'news.json');
    if (!fs.existsSync(newsFile)) {
      fs.writeFileSync(newsFile, JSON.stringify([], null, 2));
      console.log('✅ Created news.json');
    } else {
      console.log('⏭️  news.json already exists');
    }
    
    // Initialize social content file
    const socialFile = join(DB_DIR, 'social.json');
    if (!fs.existsSync(socialFile)) {
      fs.writeFileSync(socialFile, JSON.stringify([], null, 2));
      console.log('✅ Created social.json');
    } else {
      console.log('⏭️  social.json already exists');
    }
    
    console.log('✅ All migrations completed successfully');
    console.log(`📁 Database location: ${DB_DIR}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => {
      console.log('✅ Migration process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration process failed:', error);
      process.exit(1);
    });
}
