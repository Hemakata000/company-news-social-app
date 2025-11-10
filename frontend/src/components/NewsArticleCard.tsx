import React from 'react';
import { NewsArticle } from '../types';

interface NewsArticleCardProps {
  article: NewsArticle;
  className?: string;
}

const NewsArticleCard: React.FC<NewsArticleCardProps> = ({ article, className = "" }) => {
  const handleSourceClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  return (
    <div className={`bg-white rounded-lg shadow-md border hover:shadow-lg transition-shadow ${className}`}>
      <div className="p-6">
        {/* Article Header */}
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 leading-tight flex-1 mr-4">
            {article.title}
          </h3>
          <button
            onClick={() => handleSourceClick(article.sourceUrl)}
            className="flex-shrink-0 inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={`Read full article from ${article.sourceName}`}
          >
            <svg 
              className="w-4 h-4 mr-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
              />
            </svg>
            Read Full
          </button>
        </div>

        {/* Article Metadata */}
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <span className="font-medium text-gray-700">{article.sourceName}</span>
          <span className="mx-2">•</span>
          <time dateTime={article.publishedAt.toISOString()}>
            {formatDate(article.publishedAt)}
          </time>
        </div>

        {/* Highlights Section */}
        <div className="mb-4">
          <h4 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
            <svg 
              className="w-5 h-5 mr-2 text-yellow-500" 
              fill="currentColor" 
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path 
                fillRule="evenodd" 
                d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" 
                clipRule="evenodd" 
              />
            </svg>
            Key Highlights
          </h4>
          
          {article.highlights.length > 0 ? (
            <ul className="space-y-2">
              {article.highlights.map((highlight, index) => (
                <li 
                  key={index} 
                  className="flex items-start"
                >
                  <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3"></span>
                  <span className="text-gray-700 leading-relaxed">{highlight}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 italic">No highlights available for this article.</p>
          )}
        </div>

        {/* Source Link */}
        <div className="pt-4 border-t border-gray-100">
          <button
            onClick={() => handleSourceClick(article.sourceUrl)}
            className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 transition-colors group"
            aria-label={`View original article on ${article.sourceName}`}
          >
            <svg 
              className="w-4 h-4 mr-2 group-hover:text-blue-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" 
              />
            </svg>
            View original article on {article.sourceName}
            <svg 
              className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsArticleCard;