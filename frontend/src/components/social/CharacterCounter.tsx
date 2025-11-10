import React from 'react';

interface CharacterCounterProps {
  currentCount: number;
  maxCount: number;
  className?: string;
}

const CharacterCounter: React.FC<CharacterCounterProps> = ({ 
  currentCount, 
  maxCount, 
  className = "" 
}) => {
  const isOverLimit = currentCount > maxCount;
  const isNearLimit = currentCount > maxCount * 0.9;

  const getCounterColor = () => {
    if (isOverLimit) return 'bg-red-100 text-red-700';
    if (isNearLimit) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  return (
    <span className={`text-xs px-2 py-1 rounded-full ${getCounterColor()} ${className}`}>
      {currentCount.toLocaleString()}/{maxCount.toLocaleString()}
    </span>
  );
};

export default CharacterCounter;