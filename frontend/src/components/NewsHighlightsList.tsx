import React, { useState, useMemo } from 'react';
import { NewsArticle } from '../types';
import NewsArticleCard from './NewsArticleCard';

interface NewsHighlightsListProps {
  articles: NewsArticle[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

const NewsHighlightsList: React.FC<NewsHighlightsListProps> = React.memo(({
  articles,
  loading = false,
  error = null,
  onRetry,
  className = ""
}) => {
  const [sortBy, setSortBy] = useState<'date' | 'source'>('date');
  const [filterBy, setFilterBy] = useState<string>('all');

  // Memoize unique sources for filtering to prevent recalculation
  const uniqueSources = useMemo(() => 
    Array.from(new Set(articles.map(article => article.sourceName))), 
    [articles]
  );

  // Memoize expensive sorting and filtering operations
  const processedArticles = useMemo(() => {
    let filtered = articles;

    // Apply source filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(article => article.sourceName === filterBy);
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      } else {
        return a.sourceName.localeCompare(b.sourceName);
      }
    });
  }, [articles, sortBy, filterBy]);

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-8 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="spinner w-8 h-8 mr-3"></div>
          <span className="text-gray-600">Loading news highlights...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-8 text-center ${className}`}>
        <div className="w-16 h-16 mx-auto mb-4 text-red-500">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load News</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn btn-primary"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-8 text-center ${className}`}>
        <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No News Found</h3>
        <p className="text-gray-600">
          We couldn't find any recent news for this company. Try searching for a different company name.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header with controls */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Latest News & Highlights
            </h2>
            <p className="text-gray-600 mt-1">
              {processedArticles.length} article{processedArticles.length !== 1 ? 's' : ''} found
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Source Filter */}
            {uniqueSources.length > 1 && (
              <div className="flex items-center space-x-2">
                <label htmlFor="source-filter" className="text-sm font-medium text-gray-700">
                  Source:
                </label>
                <select
                  id="source-filter"
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Sources</option>
                  {uniqueSources.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort Options */}
            <div className="flex items-center space-x-2">
              <label htmlFor="sort-by" className="text-sm font-medium text-gray-700">
                Sort by:
              </label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'source')}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="date">Date (Newest First)</option>
                <option value="source">Source Name</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Articles List */}
      <div className="space-y-6">
        {processedArticles.map((article) => (
          <NewsArticleCard
            key={article.id}
            article={article}
            className="hover:scale-[1.01] transition-transform"
          />
        ))}
      </div>

      {/* Footer */}
      {processedArticles.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Showing {processedArticles.length} of {articles.length} articles
            {filterBy !== 'all' && ` from ${filterBy}`}
          </p>
        </div>
      )}
    </div>
  );
});

export default NewsHighlightsList;