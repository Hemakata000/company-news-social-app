import React from 'react';

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
  className?: string;
  title?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  className = "",
  title = "Something went wrong"
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="w-16 h-16 mb-4 text-red-500">
        <svg 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24" 
          className="w-full h-full"
          aria-hidden="true"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
          />
        </svg>
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      
      <p className="text-gray-600 mb-4 max-w-md">
        {error}
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn btn-primary"
          aria-label="Retry the failed operation"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorState;