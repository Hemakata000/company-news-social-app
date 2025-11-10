import React from 'react';

interface SearchSuggestionsProps {
  suggestions: string[];
  onSelectSuggestion: (suggestion: string) => void;
  query: string;
  loading?: boolean;
}

const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  suggestions,
  onSelectSuggestion,
  query,
  loading = false
}) => {
  if (!query || query.length < 2) {
    return null;
  }

  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto mt-2">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center space-x-2">
            <div className="spinner"></div>
            <span className="text-sm text-gray-600">Loading suggestions...</span>
          </div>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-2xl mx-auto mt-2">
      <div className="bg-white rounded-lg shadow-sm border max-h-60 overflow-y-auto">
        <div className="p-2">
          <div className="text-xs text-gray-500 px-2 py-1 mb-1">
            Suggestions for "{query}"
          </div>
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion}-${index}`}
              onClick={() => onSelectSuggestion(suggestion)}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded transition-colors focus:outline-none focus:bg-blue-50 focus:text-blue-700"
              aria-label={`Select ${suggestion}`}
            >
              <div className="flex items-center">
                <svg 
                  className="w-4 h-4 mr-2 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                  />
                </svg>
                {suggestion}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchSuggestions;