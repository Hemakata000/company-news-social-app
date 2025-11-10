import React from 'react';

interface PlatformTabProps {
  platform: {
    name: string;
    icon: React.ReactNode;
    color: string;
    maxLength: number;
  };
  isActive: boolean;
  postCount: number;
  onClick: () => void;
}

const PlatformTab: React.FC<PlatformTabProps> = ({ 
  platform, 
  isActive, 
  postCount, 
  onClick 
}) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg font-medium transition-colors ${
        isActive
          ? `${platform.color} shadow-sm`
          : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
      }`}
      aria-label={`View ${platform.name} content`}
    >
      {platform.icon}
      <span>{platform.name}</span>
      <span className={`text-xs px-2 py-0.5 rounded-full ${
        isActive ? 'bg-white bg-opacity-20' : 'bg-gray-200 text-gray-600'
      }`}>
        {postCount}
      </span>
    </button>
  );
};

export default PlatformTab;