import React, { useState, useRef, useEffect } from 'react';

interface HashtagManagerProps {
  hashtags: string[];
  onHashtagsChange: (hashtags: string[]) => void;
  suggestions?: string[];
  maxHashtags?: number;
  className?: string;
}

const HashtagManager: React.FC<HashtagManagerProps> = ({
  hashtags,
  onHashtagsChange,
  suggestions = [],
  maxHashtags = 10,
  className = ''
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = suggestions.filter(
        suggestion => 
          suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
          !hashtags.includes(suggestion)
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
    }
  }, [inputValue, suggestions, hashtags]);

  const addHashtag = (hashtag: string) => {
    const cleanHashtag = hashtag.startsWith('#') ? hashtag : `#${hashtag}`;
    
    if (hashtags.length >= maxHashtags) {
      return;
    }

    if (!hashtags.includes(cleanHashtag) && cleanHashtag.length > 1) {
      onHashtagsChange([...hashtags, cleanHashtag]);
    }
    
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeHashtag = (index: number) => {
    const newHashtags = hashtags.filter((_, i) => i !== index);
    onHashtagsChange(newHashtags);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addHashtag(inputValue.trim());
      }
    } else if (e.key === 'Backspace' && !inputValue && hashtags.length > 0) {
      removeHashtag(hashtags.length - 1);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    addHashtag(suggestion);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex flex-wrap items-center gap-2 p-2 border border-gray-300 rounded-md focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
        {hashtags.map((hashtag, index) => (
          <span
            key={index}
            className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
          >
            {hashtag}
            <button
              onClick={() => removeHashtag(index)}
              className="ml-1 text-blue-500 hover:text-blue-700 focus:outline-none"
              aria-label={`Remove ${hashtag}`}
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </span>
        ))}
        
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleInputKeyDown}
          onFocus={() => setShowSuggestions(filteredSuggestions.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={hashtags.length === 0 ? "Add hashtags..." : ""}
          className="flex-1 min-w-0 border-none outline-none text-sm"
          disabled={hashtags.length >= maxHashtags}
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Counter */}
      <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
        <span>
          {hashtags.length}/{maxHashtags} hashtags
        </span>
        <span className="text-gray-400">
          Press Enter, Space, or Comma to add
        </span>
      </div>
    </div>
  );
};

export default HashtagManager;