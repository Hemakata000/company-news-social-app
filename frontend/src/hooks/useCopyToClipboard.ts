import { useState, useCallback } from 'react';

interface UseCopyToClipboardReturn {
  copied: boolean;
  copyToClipboard: (text: string) => Promise<boolean>;
  resetCopied: () => void;
}

export const useCopyToClipboard = (resetDelay: number = 2000): UseCopyToClipboardReturn => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
    try {
      // Modern clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        
        // Auto-reset after delay
        setTimeout(() => setCopied(false), resetDelay);
        return true;
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        textArea.style.opacity = '0';
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          setCopied(true);
          setTimeout(() => setCopied(false), resetDelay);
          return true;
        }
        return false;
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }, [resetDelay]);

  const resetCopied = useCallback(() => {
    setCopied(false);
  }, []);

  return {
    copied,
    copyToClipboard,
    resetCopied
  };
};