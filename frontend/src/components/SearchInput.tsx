import React, { useState, useCallback } from 'react';

interface SearchInputProps {
  onSearch: (query: string) => void;
  loading?: boolean;
  placeholder?: string;
  value?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({
  onSearch,
  loading = false,
  placeholder = "Enter company name...",
  value = ""
}) => {
  const [searchQuery, setSearchQuery] = useState(value);
  const [error, setError] = useState<string | null>(null);

  const validateInput = (input: string): string | null => {
    if (!input.trim()) {
      return "Company name is required";
    }
    if (input.trim().length < 2) {
      return "Company name must be at least 2 characters";
    }
    if (input.length > 100) {
      return "Company name must be less than 100 characters";
    }
    // Basic validation for special characters
    if (!/^[a-zA-Z0-9\s&.-]+$/.test(input)) {
      return "Company name contains invalid characters";
    }
    return null;
  };

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateInput(searchQuery);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setError(null);
    onSearch(searchQuery.trim());
  }, [searchQuery, onSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={loading}
            className={`w-full px-4 py-3 pr-12 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
              error 
                ? 'border-red-500 bg-red-50' 
                : 'border-gray-300 bg-white hover:border-gray-400'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label="Company name search"
            aria-invalid={!!error}
            aria-describedby={error ? 'search-error' : undefined}
          />
          
          <button
            type="submit"
            disabled={loading || !searchQuery.trim()}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 rounded-md font-medium transition-all ${
              loading || !searchQuery.trim()
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
            aria-label="Search for company news"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="spinner"></div>
                <span>Searching...</span>
              </div>
            ) : (
              'Search'
            )}
          </button>
        </div>
        
        {error && (
          <div id="search-error" className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </div>
        )}
      </form>
    </div>
  );
};

export default SearchInput;