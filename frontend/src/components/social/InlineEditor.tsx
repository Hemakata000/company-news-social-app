import React, { useState, useRef, useEffect } from 'react';
import { SocialPost } from '../../types';
import HashtagManager from './HashtagManager';
import CharacterCounter from './CharacterCounter';

interface InlineEditorProps {
  post: SocialPost;
  maxLength: number;
  onSave: (updatedPost: SocialPost) => void;
  onCancel: () => void;
  hashtagSuggestions?: string[];
  platform: string;
}

const InlineEditor: React.FC<InlineEditorProps> = ({
  post,
  maxLength,
  onSave,
  onCancel,
  hashtagSuggestions = [],
  platform
}) => {
  const [content, setContent] = useState(post.content);
  const [hashtags, setHashtags] = useState(post.hashtags);
  const [characterCount, setCharacterCount] = useState(post.characterCount);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Calculate character count including hashtags
    const hashtagText = hashtags.join(' ');
    const totalContent = content + (hashtags.length > 0 ? ' ' + hashtagText : '');
    setCharacterCount(totalContent.length);
  }, [content, hashtags]);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handleSave = () => {
    const updatedPost: SocialPost = {
      content: content.trim(),
      hashtags,
      characterCount
    };
    onSave(updatedPost);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSave();
    }
  };

  const isOverLimit = characterCount > maxLength;
  const isNearLimit = characterCount > maxLength * 0.9;

  return (
    <div className="space-y-4 p-4 bg-white border border-gray-300 rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-800">Edit {platform} Post</h4>
        <CharacterCounter 
          currentCount={characterCount}
          maxCount={maxLength}
        />
      </div>

      {/* Content Editor */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Content
        </label>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`w-full p-3 border rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            isOverLimit ? 'border-red-300' : isNearLimit ? 'border-yellow-300' : 'border-gray-300'
          }`}
          placeholder={`Write your ${platform} post content...`}
          rows={4}
          style={{ minHeight: '100px' }}
        />
        {isOverLimit && (
          <p className="text-xs text-red-600">
            Content exceeds the {maxLength} character limit for {platform}
          </p>
        )}
      </div>

      {/* Hashtag Manager */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Hashtags
        </label>
        <HashtagManager
          hashtags={hashtags}
          onHashtagsChange={setHashtags}
          suggestions={hashtagSuggestions}
          maxHashtags={platform === 'twitter' ? 2 : 10}
        />
      </div>

      {/* Preview */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Preview
        </label>
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-gray-800 whitespace-pre-wrap mb-2">
            {content || <span className="text-gray-400 italic">Your content will appear here...</span>}
          </p>
          {hashtags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {hashtags.map((hashtag, index) => (
                <span
                  key={index}
                  className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full"
                >
                  {hashtag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Press Ctrl+Enter to save, Escape to cancel
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isOverLimit || !content.trim()}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              isOverLimit || !content.trim()
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                : 'text-white bg-blue-600 hover:bg-blue-700'
            }`}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default InlineEditor;