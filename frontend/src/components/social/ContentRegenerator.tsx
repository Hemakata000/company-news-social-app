import React, { useState } from 'react';

interface ContentRegeneratorProps {
  platform: string;
  onRegenerate: (options: RegenerationOptions) => void;
  isLoading?: boolean;
  className?: string;
}

interface RegenerationOptions {
  tone?: 'professional' | 'casual' | 'enthusiastic' | 'informative';
  length?: 'short' | 'medium' | 'long';
  includeHashtags?: boolean;
  includeEmojis?: boolean;
  focusKeywords?: string[];
}

const ContentRegenerator: React.FC<ContentRegeneratorProps> = ({
  platform,
  onRegenerate,
  isLoading = false,
  className = ''
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<RegenerationOptions>({
    tone: 'professional',
    length: 'medium',
    includeHashtags: true,
    includeEmojis: false,
    focusKeywords: []
  });
  const [customKeywords, setCustomKeywords] = useState('');

  const handleRegenerate = () => {
    const finalOptions = {
      ...options,
      focusKeywords: customKeywords
        .split(',')
        .map(keyword => keyword.trim())
        .filter(keyword => keyword.length > 0)
    };
    
    onRegenerate(finalOptions);
    setShowOptions(false);
  };

  const handleQuickRegenerate = () => {
    onRegenerate(options);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center space-x-2">
        <button
          onClick={handleQuickRegenerate}
          disabled={isLoading}
          className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            isLoading
              ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
              : 'text-blue-700 bg-blue-100 hover:bg-blue-200'
          }`}
        >
          {isLoading ? (
            <>
              <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Regenerating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Regenerate
            </>
          )}
        </button>

        <button
          onClick={() => setShowOptions(!showOptions)}
          className="inline-flex items-center px-2 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          aria-label="Regeneration options"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>

      {/* Options Panel */}
      {showOptions && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-300 rounded-lg shadow-lg z-20 p-4">
          <h4 className="font-medium text-gray-800 mb-4">Regeneration Options</h4>
          
          <div className="space-y-4">
            {/* Tone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tone
              </label>
              <select
                value={options.tone}
                onChange={(e) => setOptions(prev => ({ ...prev, tone: e.target.value as any }))}
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="enthusiastic">Enthusiastic</option>
                <option value="informative">Informative</option>
              </select>
            </div>

            {/* Length */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Length
              </label>
              <div className="flex space-x-2">
                {(['short', 'medium', 'long'] as const).map((length) => (
                  <button
                    key={length}
                    onClick={() => setOptions(prev => ({ ...prev, length }))}
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                      options.length === length
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {length.charAt(0).toUpperCase() + length.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeHashtags}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeHashtags: e.target.checked }))}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Include hashtags</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeEmojis}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeEmojis: e.target.checked }))}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Include emojis</span>
              </label>
            </div>

            {/* Custom Keywords */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Focus Keywords (comma-separated)
              </label>
              <input
                type="text"
                value={customKeywords}
                onChange={(e) => setCustomKeywords(e.target.value)}
                placeholder="innovation, technology, growth"
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200">
              <button
                onClick={() => setShowOptions(false)}
                className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerate}
                disabled={isLoading}
                className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                  isLoading
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                    : 'text-white bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Regenerate with Options
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentRegenerator;