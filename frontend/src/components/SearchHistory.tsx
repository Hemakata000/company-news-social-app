import React from 'react';

interface SearchHistoryProps {
  history: string[];
  onSelectHistory: (query: string) => void;
  onClearHistory: () => void;
  maxItems?: number;
}

const SearchHistory: React.FC<SearchHistoryProps> = ({
  history,
  onSelectHistory,
  onClearHistory,
  maxItems = 5
}) => {
  if (history.length === 0) {
    return null;
  }

  const displayHistory = history.slice(0, maxItems);

  return (
    <div className="w-full max-w-2xl mx-auto mt-4">
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-700">Recent Searches</h3>
          <button
            onClick={onClearHistory}
            className="text-xs text-gray-500 hover:text-red-600 transition-colors"
            aria-label="Clear search history"
          >
            Clear All
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {displayHistory.map((query, index) => (
            <button
              key={`${query}-${index}`}
              onClick={() => onSelectHistory(query)}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-blue-100 hover:text-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              aria-label={`Search for ${query} again`}
            >
              {query}
            </button>
          ))}
        </div>
        
        {history.length > maxItems && (
          <p className="text-xs text-gray-500 mt-2">
            Showing {maxItems} of {history.length} recent searches
          </p>
        )}
      </div>
    </div>
  );
};

export default SearchHistory;