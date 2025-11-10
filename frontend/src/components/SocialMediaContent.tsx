import React, { useState, useCallback, useMemo } from 'react';
import { SocialMediaContent as SocialMediaContentType, SocialPost } from '../types';
import PlatformTab from './social/PlatformTab';
import SocialPostCard from './social/SocialPostCard';
import ContentRegenerator from './social/ContentRegenerator';
import { LinkedInIcon, TwitterIcon, FacebookIcon, InstagramIcon } from './social/PlatformIcons';
import { useSocialMediaShortcuts } from '../hooks/useKeyboardShortcuts';

interface SocialMediaContentProps {
  content: SocialMediaContentType;
  className?: string;
  onContentEdit?: (platform: keyof SocialMediaContentType, index: number, updatedPost: SocialPost) => void;
  onContentRegenerate?: (platform: keyof SocialMediaContentType, options?: any) => void;
  isEditable?: boolean;
  isRegenerating?: boolean;
  hashtagSuggestions?: Record<keyof SocialMediaContentType, string[]>;
}

interface PlatformConfig {
  name: string;
  icon: React.ReactNode;
  color: string;
  maxLength: number;
  description: string;
}

const SocialMediaContent: React.FC<SocialMediaContentProps> = React.memo(({ 
  content, 
  className = "",
  onContentEdit,
  onContentRegenerate,
  isEditable = false,
  isRegenerating = false,
  hashtagSuggestions = {
    linkedin: [],
    twitter: [],
    facebook: [],
    instagram: []
  }
}) => {
  const [activeTab, setActiveTab] = useState<keyof SocialMediaContentType>('linkedin');
  const [activePostIndex, setActivePostIndex] = useState(0);

  // Memoize platform configuration to prevent recreation on every render
  const platforms: Record<keyof SocialMediaContentType, PlatformConfig> = useMemo(() => ({
    linkedin: {
      name: 'LinkedIn',
      color: 'bg-blue-600 text-white',
      maxLength: 3000,
      description: 'Professional networking platform - ideal for business insights and industry news',
      icon: <LinkedInIcon />
    },
    twitter: {
      name: 'Twitter',
      color: 'bg-sky-500 text-white',
      maxLength: 280,
      description: 'Microblogging platform - perfect for quick updates and breaking news',
      icon: <TwitterIcon />
    },
    facebook: {
      name: 'Facebook',
      color: 'bg-blue-700 text-white',
      maxLength: 63206,
      description: 'Social networking platform - great for detailed posts and community engagement',
      icon: <FacebookIcon />
    },
    instagram: {
      name: 'Instagram',
      color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
      maxLength: 2200,
      description: 'Visual-first platform - best for engaging captions with visual content',
      icon: <InstagramIcon />
    }
  }), []);

  const platformKeys = useMemo(() => Object.keys(platforms) as (keyof SocialMediaContentType)[], [platforms]);

  const handleCopy = useCallback((content: string, index: number) => {
    // Optional callback for copy analytics or notifications
    console.log(`Copied ${activeTab} post ${index + 1}`);
  }, [activeTab]);

  const handleEdit = useCallback((updatedPost: SocialPost, index: number) => {
    if (onContentEdit) {
      onContentEdit(activeTab, index, updatedPost);
    }
  }, [activeTab, onContentEdit]);

  const handleRegenerate = useCallback((options?: any) => {
    if (onContentRegenerate) {
      onContentRegenerate(activeTab, options);
    }
  }, [activeTab, onContentRegenerate]);

  const handleNextPlatform = useCallback(() => {
    const currentIndex = platformKeys.indexOf(activeTab);
    const nextIndex = (currentIndex + 1) % platformKeys.length;
    setActiveTab(platformKeys[nextIndex]);
    setActivePostIndex(0);
  }, [activeTab, platformKeys]);

  const handlePreviousPlatform = useCallback(() => {
    const currentIndex = platformKeys.indexOf(activeTab);
    const previousIndex = currentIndex === 0 ? platformKeys.length - 1 : currentIndex - 1;
    setActiveTab(platformKeys[previousIndex]);
    setActivePostIndex(0);
  }, [activeTab, platformKeys]);

  const handleCopyActive = useCallback(() => {
    const activePosts = content[activeTab];
    if (activePosts.length > 0 && activePosts[activePostIndex]) {
      const post = activePosts[activePostIndex];
      const fullContent = post.content + (post.hashtags.length > 0 ? ' ' + post.hashtags.join(' ') : '');
      navigator.clipboard.writeText(fullContent);
      handleCopy(fullContent, activePostIndex);
    }
  }, [activeTab, activePostIndex, content, handleCopy]);

  // Set up keyboard shortcuts
  useSocialMediaShortcuts({
    copyActive: handleCopyActive,
    nextPlatform: handleNextPlatform,
    previousPlatform: handlePreviousPlatform,
    regenerateContent: () => handleRegenerate()
  });



  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            Social Media Content
          </h2>
          {isEditable && onContentRegenerate && (
            <ContentRegenerator
              platform={platforms[activeTab].name}
              onRegenerate={handleRegenerate}
              isLoading={isRegenerating}
            />
          )}
        </div>

        {/* Platform Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
          {Object.entries(platforms).map(([key, platform]) => {
            const platformKey = key as keyof SocialMediaContentType;
            const posts = content[platformKey];

            return (
              <PlatformTab
                key={key}
                platform={platform}
                isActive={activeTab === platformKey}
                postCount={posts.length}
                onClick={() => setActiveTab(platformKey)}
              />
            );
          })}
        </div>

        {/* Content Display */}
        <div className="space-y-4">
          {content[activeTab].length > 0 ? (
            content[activeTab].map((post, index) => (
              <div
                key={index}
                className={`transition-all duration-200 ${
                  activePostIndex === index ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                }`}
                onClick={() => setActivePostIndex(index)}
              >
                <SocialPostCard
                  post={post}
                  index={index}
                  platform={platforms[activeTab].name}
                  maxLength={platforms[activeTab].maxLength}
                  onCopy={handleCopy}
                  onEdit={handleEdit}
                  isEditable={isEditable}
                  hashtagSuggestions={hashtagSuggestions[activeTab]}
                />
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="mb-4">
                <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-lg font-medium mb-2">No {platforms[activeTab].name} content available</p>
              <p className="text-sm">Generate content by searching for company news first</p>
              {isEditable && onContentRegenerate && (
                <button
                  onClick={() => handleRegenerate()}
                  className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Generate {platforms[activeTab].name} Content
                </button>
              )}
            </div>
          )}
        </div>

        {/* Platform Info and Keyboard Shortcuts */}
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {platforms[activeTab].icon}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-800 mb-1">
                  {platforms[activeTab].name} Guidelines
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {platforms[activeTab].description}
                </p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>Character limit: {platforms[activeTab].maxLength.toLocaleString()}</span>
                  <span>•</span>
                  <span>Posts available: {content[activeTab].length}</span>
                  {activePostIndex < content[activeTab].length && (
                    <>
                      <span>•</span>
                      <span>Active: Post {activePostIndex + 1}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Keyboard Shortcuts</h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
              <div className="flex justify-between">
                <span>Copy active post:</span>
                <kbd className="px-1 py-0.5 bg-blue-200 rounded">Ctrl+Shift+C</kbd>
              </div>
              <div className="flex justify-between">
                <span>Next platform:</span>
                <kbd className="px-1 py-0.5 bg-blue-200 rounded">Ctrl+→</kbd>
              </div>
              <div className="flex justify-between">
                <span>Previous platform:</span>
                <kbd className="px-1 py-0.5 bg-blue-200 rounded">Ctrl+←</kbd>
              </div>
              <div className="flex justify-between">
                <span>Regenerate content:</span>
                <kbd className="px-1 py-0.5 bg-blue-200 rounded">Ctrl+Shift+R</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default SocialMediaContent;