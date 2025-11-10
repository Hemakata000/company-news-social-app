import React, { useState, useEffect, useRef } from 'react';

interface CopyButtonProps {
  content: string;
  onCopy?: () => void;
  platform?: string;
  index?: number;
  className?: string;
  showToast?: boolean;
}

const CopyButton: React.FC<CopyButtonProps> = ({ 
  content, 
  onCopy, 
  platform = '', 
  index = 0, 
  className = '',
  showToast = true
}) => {
  const [copied, setCopied] = useState(false);
  const [showKeyboardHint, setShowKeyboardHint] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      onCopy?.();
      
      // Show toast notification if enabled
      if (showToast) {
        showCopyToast();
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = content;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        setCopied(true);
        onCopy?.();
        
        if (showToast) {
          showCopyToast();
        }
      } catch (fallbackErr) {
        console.error('Fallback copy failed: ', fallbackErr);
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  const showCopyToast = () => {
    // Create and show a temporary toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity duration-300';
    toast.textContent = `${platform} content copied to clipboard!`;
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('opacity-100'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.add('opacity-0');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  };

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  // Global keyboard shortcut handler for power users
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Shift+C or Cmd+Shift+C for quick copy of focused post
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'C') {
        if (buttonRef.current && document.activeElement === buttonRef.current) {
          event.preventDefault();
          copyToClipboard();
        }
      }
      
      // Show keyboard hint on Alt key
      if (event.key === 'Alt') {
        setShowKeyboardHint(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === 'Alt') {
        setShowKeyboardHint(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [content]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={copyToClipboard}
        onDoubleClick={copyToClipboard} // Double-click for extra accessibility
        className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
          copied
            ? 'bg-green-100 text-green-700 scale-105'
            : 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:scale-105'
        } ${className}`}
        aria-label={`Copy ${platform} post ${index + 1} to clipboard. Use Ctrl+Shift+C when focused for keyboard shortcut.`}
        title={showKeyboardHint ? "Ctrl+Shift+C to copy" : "Click to copy"}
      >
        {copied ? (
          <>
            <svg className="w-3 h-3 mr-1 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy
          </>
        )}
      </button>
      
      {/* Keyboard shortcut hint */}
      {showKeyboardHint && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
          Ctrl+Shift+C
        </div>
      )}
    </div>
  );
};

export default CopyButton;