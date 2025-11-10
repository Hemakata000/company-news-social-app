-- Initial database schema for Company News Social App (SQLite)

-- Create companies table for caching and normalization
CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  aliases TEXT, -- JSON array of alternative names
  ticker_symbol TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Create index on company name for faster lookups
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_ticker ON companies(ticker_symbol);

-- Create news articles cache table
CREATE TABLE IF NOT EXISTS news_articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  highlights TEXT, -- JSON array of extracted highlights
  source_url TEXT NOT NULL UNIQUE,
  source_name TEXT,
  published_at TEXT,
  fetched_at TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Create indexes for news articles
CREATE INDEX IF NOT EXISTS idx_news_articles_company_id ON news_articles(company_id);
CREATE INDEX IF NOT EXISTS idx_news_articles_published_at ON news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_company_published ON news_articles(company_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_articles_source_url ON news_articles(source_url);

-- Create social content cache table
CREATE TABLE IF NOT EXISTS social_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER REFERENCES news_articles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'twitter', 'facebook', 'instagram')),
  content TEXT NOT NULL,
  hashtags TEXT, -- JSON array of hashtags
  character_count INTEGER,
  generated_at TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Create indexes for social content
CREATE INDEX IF NOT EXISTS idx_social_content_article_id ON social_content(article_id);
CREATE INDEX IF NOT EXISTS idx_social_content_platform ON social_content(platform);
CREATE INDEX IF NOT EXISTS idx_social_content_article_platform ON social_content(article_id, platform);

-- Create trigger to update updated_at timestamp for companies
CREATE TRIGGER IF NOT EXISTS update_companies_updated_at 
    AFTER UPDATE ON companies 
    FOR EACH ROW 
BEGIN
    UPDATE companies SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Insert some sample data for testing
INSERT OR IGNORE INTO companies (name, aliases, ticker_symbol) VALUES 
  ('Apple Inc.', '["Apple", "AAPL"]', 'AAPL'),
  ('Microsoft Corporation', '["Microsoft", "MSFT"]', 'MSFT'),
  ('Google LLC', '["Google", "Alphabet", "GOOGL"]', 'GOOGL'),
  ('Amazon.com Inc.', '["Amazon", "AMZN"]', 'AMZN'),
  ('Tesla Inc.', '["Tesla", "TSLA"]', 'TSLA'),
  ('Accenture', '["Accenture", "ACN"]', 'ACN'),
  ('Wipro Limited', '["Wipro", "WIT"]', 'WIT');
