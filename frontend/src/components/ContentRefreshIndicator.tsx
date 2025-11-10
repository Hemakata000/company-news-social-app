import React, { useState, useEffect } from 'react';

interface ContentRefreshIndicatorProps {
  lastUpdated: Date | null;
  onRefresh: () => void;
  isRefreshing?: boolean;
  autoRefreshInterval?: number; // in minutes
  className?: string;
}

const ContentRefreshIndicator: React.FC<ContentRefreshIndicatorProps> = ({
  lastUpdated,
  onRefresh,
  isRefreshing = false,
  autoRefreshInterval = 15, // 15 minutes default
  className = ""
}) => {
  const [timeAgo, setTimeAgo] = useState<string>('');
  const [shouldAutoRefresh, setShouldAutoRefresh] = useState(false);

  // Update time ago display
  useEffect(() => {
    if (!lastUpdated) {
      setTimeAgo('Never');
      return;
    }

    const updateTimeAgo = () => {
      const now = new Date();
      const diffMs = now.getTime() - lastUpdated.getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMinutes < 1) {
        setTimeAgo('Just now');
      } else if (diffMinutes < 60) {
        setTimeAgo(`${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`);
      } else if (diffHours < 24) {
        setTimeAgo(`${diffHours} hour${diffHours === 1 ? '' : 's'} ago`);
      } else {
        setTimeAgo(`${diffDays} day${diffDays === 1 ? '' : 's'} ago`);
      }

      // Check if content should be auto-refreshed
      setShouldAutoRefresh(diffMinutes >= autoRefreshInterval);
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [lastUpdated, autoRefreshInterval]);

  const getStatusColor = () => {
    if (!lastUpdated) return 'text-gray-500';
    
    const now = new Date();
    const diffMinutes = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);
    
    if (diffMinutes < 5) return 'text-green-600';
    if (diffMinutes < 15) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = () => {
    if (isRefreshing) {
      return (
        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    }

    if (shouldAutoRefresh) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  return (
    <div className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg border ${className}`}>
      <div className="flex items-center space-x-2">
        <div className={getStatusColor()}>
          {getStatusIcon()}
        </div>
        <div className="text-sm">
          <span className="text-gray-600">Last updated: </span>
          <span className={`font-medium ${getStatusColor()}`}>
            {timeAgo}
          </span>
        </div>
        {shouldAutoRefresh && (
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
            Content may be stale
          </span>
        )}
      </div>

      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className={`flex items-center space-x-1 px-3 py-1 text-sm rounded-md transition-colors ${
          isRefreshing
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : shouldAutoRefresh
            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
        }`}
        title={isRefreshing ? 'Refreshing...' : 'Refresh content'}
      >
        <svg 
          className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
      </button>
    </div>
  );
};

export default ContentRefreshIndicator;