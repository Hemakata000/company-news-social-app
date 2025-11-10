-- Performance optimization indexes for Company News Social App

-- Add composite indexes for better query performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_news_articles_company_fetched 
ON news_articles(company_id, fetched_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_news_articles_published_source 
ON news_articles(published_at DESC, source_name);

-- Add partial indexes for recent articles (last 30 days)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_news_articles_recent 
ON news_articles(company_id, published_at DESC) 
WHERE published_at > NOW() - INTERVAL '30 days';

-- Add GIN index for full-text search on article content
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_news_articles_content_search 
ON news_articles USING GIN(to_tsvector('english', title || ' ' || COALESCE(content, '')));

-- Add GIN index for highlights array search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_news_articles_highlights_gin 
ON news_articles USING GIN(highlights);

-- Add index for company aliases search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_aliases_gin 
ON companies USING GIN(aliases);

-- Add covering index for social content queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_social_content_covering 
ON social_content(article_id, platform) 
INCLUDE (content, hashtags, character_count, generated_at);

-- Add index for cache cleanup queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_news_articles_cleanup 
ON news_articles(fetched_at) 
WHERE fetched_at < NOW() - INTERVAL '7 days';

-- Add statistics for better query planning
ANALYZE companies;
ANALYZE news_articles;
ANALYZE social_content;

-- Create materialized view for popular companies (updated periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS popular_companies AS
SELECT 
  c.id,
  c.name,
  c.ticker_symbol,
  COUNT(na.id) as article_count,
  MAX(na.published_at) as latest_article_date
FROM companies c
LEFT JOIN news_articles na ON c.id = na.company_id
WHERE na.published_at > NOW() - INTERVAL '30 days'
GROUP BY c.id, c.name, c.ticker_symbol
HAVING COUNT(na.id) > 0
ORDER BY article_count DESC, latest_article_date DESC;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_popular_companies_article_count 
ON popular_companies(article_count DESC);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_popular_companies()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY popular_companies;
END;
$$ LANGUAGE plpgsql;

-- Create stored procedure for optimized company news retrieval
CREATE OR REPLACE FUNCTION get_company_news_optimized(
  p_company_id INTEGER,
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id INTEGER,
  title TEXT,
  content TEXT,
  highlights TEXT[],
  source_url TEXT,
  source_name VARCHAR(255),
  published_at TIMESTAMP,
  social_content_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    na.id,
    na.title,
    na.content,
    na.highlights,
    na.source_url,
    na.source_name,
    na.published_at,
    COUNT(sc.id) as social_content_count
  FROM news_articles na
  LEFT JOIN social_content sc ON na.id = sc.article_id
  WHERE na.company_id = p_company_id
    AND na.published_at > NOW() - INTERVAL '30 days'
  GROUP BY na.id, na.title, na.content, na.highlights, na.source_url, na.source_name, na.published_at
  ORDER BY na.published_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Create function for batch article insertion with conflict handling
CREATE OR REPLACE FUNCTION insert_articles_batch(
  articles JSONB
)
RETURNS INTEGER AS $$
DECLARE
  inserted_count INTEGER := 0;
  article JSONB;
BEGIN
  FOR article IN SELECT * FROM jsonb_array_elements(articles)
  LOOP
    INSERT INTO news_articles (
      company_id, title, content, highlights, source_url, source_name, published_at
    )
    VALUES (
      (article->>'company_id')::INTEGER,
      article->>'title',
      article->>'content',
      ARRAY(SELECT jsonb_array_elements_text(article->'highlights')),
      article->>'source_url',
      article->>'source_name',
      (article->>'published_at')::TIMESTAMP
    )
    ON CONFLICT (source_url) DO UPDATE SET
      title = EXCLUDED.title,
      content = EXCLUDED.content,
      highlights = EXCLUDED.highlights,
      source_name = EXCLUDED.source_name,
      published_at = EXCLUDED.published_at,
      fetched_at = NOW();
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
  END LOOP;
  
  RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;