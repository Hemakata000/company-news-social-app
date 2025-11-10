import React, { useState } from 'react';

interface SearchOptionsProps {
  onOptionsChange: (options: {
    platforms: string[];
    tone: 'professional' | 'casual' | 'enthusiastic';
    forceRefresh: boolean;
  }) => void;
  disabled?: boolean;
}

const SearchOptions: React.FC<SearchOptionsProps> = ({ onOptionsChange, disabled = false }) => {
  const [platforms, setPlatforms] = useState<string[]>(['linkedin', 'twitter', 'facebook', 'instagram']);
  const [tone, setTone] = useState<'professional' | 'casual' | 'enthusiastic'>('professional');
  const [forceRefresh, setForceRefresh] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePlatformChange = (platform: string, checked: boolean) => {
    const newPlatforms = checked 
      ? [...platforms, platform]
      : platforms.filter(p => p !== platform);
    
    setPlatforms(newPlatforms);
    onOptionsChange({ platforms: newPlatforms, tone, forceRefresh });
  };

  const handleToneChange = (newTone: 'professional' | 'casual' | 'enthusiastic') => {
    setTone(newTone);
    onOptionsChange({ platforms, tone: newTone, forceRefresh });
  };

  const handleForceRefreshChange = (checked: boolean) => {
    setForceRefresh(checked);
    onOptionsChange({ platforms, tone, forceRefresh: checked });
  };

  return (
    <div className="mt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={disabled}
        className="flex items-center text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
      >
        <span>Search Options</span>
        <svg 
          className={`ml-1 w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-3 p-4 bg-gray-50 rounded-lg space-y-4">
          {/* Platform Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Social Media Platforms
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'linkedin', label: 'LinkedIn' },
                { id: 'twitter', label: 'Twitter' },
                { id: 'facebook', label: 'Facebook' },
                { id: 'instagram', label: 'Instagram' }
              ].map(platform => (
                <label key={platform.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={platforms.includes(platform.id)}
                    onChange={(e) => handlePlatformChange(platform.id, e.target.checked)}
                    disabled={disabled}
                    className="mr-2"
                  />
                  <span className="text-sm">{platform.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tone Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content Tone
            </label>
            <div className="flex space-x-4">
              {[
                { id: 'professional', label: 'Professional' },
                { id: 'casual', label: 'Casual' },
                { id: 'enthusiastic', label: 'Enthusiastic' }
              ].map(toneOption => (
                <label key={toneOption.id} className="flex items-center">
                  <input
                    type="radio"
                    name="tone"
                    value={toneOption.id}
                    checked={tone === toneOption.id}
                    onChange={() => handleToneChange(toneOption.id as any)}
                    disabled={disabled}
                    className="mr-2"
                  />
                  <span className="text-sm">{toneOption.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Force Refresh */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={forceRefresh}
                onChange={(e) => handleForceRefreshChange(e.target.checked)}
                disabled={disabled}
                className="mr-2"
              />
              <span className="text-sm">Force refresh (bypass cache)</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchOptions;