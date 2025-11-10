import React, { useState } from 'react';
import { SocialPost } from '../../types';
import CharacterCounter from './CharacterCounter';
import CopyButton from './CopyButton';
import InlineEditor from './InlineEditor';

interface SocialPostCardProps {
  post: SocialPost;
  index: number;
  platform: string;
  maxLength: number;
  onCopy?: (content: string, index: number) => void;
  onEdit?: (updatedPost: SocialPost, index: number) => void;
  isEditable?: boolean;
  hashtagSuggestions?: string[];
}

const SocialPostCard: React.FC<SocialPostCardProps> = ({
  post,
  index,
  platform,
  maxLength,
  onCopy,
  onEdit,
  isEditable = false,
  hashtagSuggestions = []
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const isOverLimit = post.characterCount > maxLength;

  const handleSaveEdit = (updatedPost: SocialPost) => {
    if (onEdit) {
      onEdit(updatedPost, index);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <InlineEditor
        post={post}
        maxLength={maxLength}
        onSave={handleSaveEdit}
        onCancel={handleCancelEdit}
        hashtagSuggestions={hashtagSuggestions}
        platform={platform}
      />
    );
  }

  return (
    <div className="bg-gray-50 rounded-lg p-4 border hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Option {index + 1}
            </span>
            <div className="flex items-center space-x-2">
              <CharacterCounter 
                currentCount={post.characterCount}
                maxCount={maxLength}
              />
              <CopyButton 
                content={post.content + (post.hashtags.length > 0 ? ' ' + post.hashtags.join(' ') : '')}
                onCopy={() => onCopy?.(post.content, index)}
                platform={platform}
                index={index}
              />
              {isEditable && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  aria-label={`Edit ${platform} post ${index + 1}`}
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
      </div>

      {post.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {post.hashtags.map((hashtag, hashIndex) => (
            <span
              key={hashIndex}
              className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
            >
              {hashtag}
            </span>
          ))}
        </div>
      )}

      {isOverLimit && (
        <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            This post exceeds the {maxLength.toLocaleString()} character limit for {platform}
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialPostCard;