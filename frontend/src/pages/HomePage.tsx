import React, { useState, useMemo, useCallback } from 'react';
import { useSearch } from '../hooks/useSearch';
import SearchInput from '../components/SearchInput';
import SearchHistory from '../components/SearchHistory';
import SearchSuggestions from '../components/SearchSuggestions';
// import SearchOptions from '../components/SearchOptions';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import NewsHighlightsList from '../components/NewsHighlightsList';
// import SocialMediaContent from '../components/SocialMediaContent';
import ContentRefreshIndicator from '../components/ContentRefreshIndicator';

const HomePage: React.FC = () => {
  const {
    query,
    loading,
    error,
    newsData,
    socialContent,
    history,
    suggestions,
    suggestionsLoading,
    isOffline,
    isGeneratingContent,
    contentGenerationError,
    search,
    setQuery,
    clearResults,
    clearHistory,
    regenerateContent,
    clearContentError
  } = useSearch();

  const [searchOptions, setSearchOptions] = useState({
    platforms: ['linkedin', 'twitter', 'facebook', 'instagram'],
    tone: 'professional' as 'professional' | 'casual' | 'enthusiastic',
    forceRefresh: false
  });

  const [lastSearchTime, setLastSearchTime] = useState<Date | null>(null);

  // Memoized handlers to prevent unnecessary re-renders
  const handleSearch = useCallback((searchQuery: string) => {
    search(searchQuery, searchOptions);
    setLastSearchTime(new Date());
  }, [search, searchOptions]);

  const handleSelectHistory = useCallback((historyQuery: string) => {
    setQuery(historyQuery);
    search(historyQuery, searchOptions);
    setLastSearchTime(new Date());
  }, [setQuery, search, searchOptions]);

  const handleSelectSuggestion = useCallback((suggestion: string) => {
    setQuery(suggestion);
    search(suggestion, searchOptions);
    setLastSearchTime(new Date());
  }, [setQuery, search, searchOptions]);

  const handleRetry = useCallback(() => {
    if (query) {
      search(query, searchOptions);
      setLastSearchTime(new Date());
    }
  }, [query, search, searchOptions]);

  const handleRefresh = useCallback(() => {
    if (query) {
      search(query, { ...searchOptions, forceRefresh: true });
      setLastSearchTime(new Date());
    }
  }, [query, search, searchOptions]);

  const handleOptionsChange = useCallback((options: typeof searchOptions) => {
    setSearchOptions(options);
  }, []);

  // Social media regeneration disabled
  // const handleContentRegenerate = useCallback((platform: keyof SocialMediaContent, options?: any) => {
  //   regenerateContent(platform, {
  //     tone: searchOptions.tone,
  //     platforms: [platform]
  //   });
  // }, [regenerateContent, searchOptions.tone]);

  // Memoized computed values
  const hasResults = useMemo(() => !loading && !error && newsData.length > 0, [loading, error, newsData.length]);
  const showEmptyState = useMemo(() => !loading && !error && newsData.length === 0 && !query, [loading, error, newsData.length, query]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* LIVE API - NO MOCK DATA */}
      <div style={{
        background: 'linear-gradient(90deg, #4CAF50, #45a049)',
        color: 'white',
        padding: '15px',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: '18px',
        marginBottom: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }}>
        ✅ LIVE API CONNECTED - Real News Data Only (Build: {new Date().toISOString()})
      </div>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Company News Aggregator
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Get the latest company news and highlights instantly
        </p>
      </div>

      {/* Search Interface */}
      <div className="mb-8">
        <SearchInput
          onSearch={handleSearch}
          loading={loading}
          value={query}
          placeholder="Enter company name (e.g., Apple, Microsoft, Tesla)..."
        />
        
        <SearchSuggestions
          suggestions={suggestions}
          onSelectSuggestion={handleSelectSuggestion}
          query={query}
          loading={suggestionsLoading}
        />
        
        <SearchHistory
          history={history}
          onSelectHistory={handleSelectHistory}
          onClearHistory={clearHistory}
        />

        {/* Social Media Options Disabled */}
        {/* <SearchOptions
          onOptionsChange={handleOptionsChange}
          disabled={loading}
        /> */}
      </div>

      {/* Results Section */}
      {loading && (
        <LoadingState 
          message="Fetching latest company news..." 
          size="large"
        />
      )}

      {error && (
        <ErrorState
          error={error}
          onRetry={handleRetry}
          title="Failed to fetch company news"
        />
      )}

      {showEmptyState && (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            Search for Company News
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Enter a company name above to get the latest news highlights and articles.
          </p>
        </div>
      )}

      {/* News Highlights and Social Content */}
      {hasResults && (
        <div className="space-y-8">
          {/* Content Refresh Indicator */}
          <ContentRefreshIndicator
            lastUpdated={lastSearchTime}
            onRefresh={handleRefresh}
            isRefreshing={loading}
            autoRefreshInterval={15}
          />

          {/* News Highlights */}
          <NewsHighlightsList
            articles={newsData}
            loading={loading}
            error={error}
            onRetry={handleRetry}
          />

          {/* Social Media Content - DISABLED */}
          {/* {socialContent && (
            <SocialMediaContent 
              content={socialContent}
              onContentRegenerate={handleContentRegenerate}
              isEditable={true}
              isRegenerating={isGeneratingContent}
            />
          )} */}

          {/* Content Generation Error - DISABLED */}
          {/* {contentGenerationError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="text-yellow-800">{contentGenerationError}</span>
                <button
                  onClick={clearContentError}
                  className="ml-auto text-yellow-600 hover:text-yellow-800"
                >
                  ×
                </button>
              </div>
            </div>
          )} */}

          {/* Offline Mode Indicator */}
          {isOffline && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-600">You're currently offline. Showing cached content when available.</span>
              </div>
            </div>
          )}

          {/* Clear Results Button */}
          <div className="text-center">
            <button
              onClick={clearResults}
              className="btn btn-secondary"
            >
              Clear Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;