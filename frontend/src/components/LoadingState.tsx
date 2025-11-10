import React from 'react';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading...",
  size = 'medium',
  className = ""
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <div className={`spinner ${sizeClasses[size]} mb-4`}></div>
      <p className={`text-gray-600 ${textSizeClasses[size]}`}>
        {message}
      </p>
    </div>
  );
};

export default LoadingState;