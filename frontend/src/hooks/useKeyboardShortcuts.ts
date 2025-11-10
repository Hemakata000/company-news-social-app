import { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  callback: (event: KeyboardEvent) => void;
  description?: string;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    shortcuts.forEach(shortcut => {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = shortcut.ctrlKey ? event.ctrlKey : !event.ctrlKey || shortcut.ctrlKey === false;
      const metaMatch = shortcut.metaKey ? event.metaKey : !event.metaKey || shortcut.metaKey === false;
      const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey || shortcut.shiftKey === false;
      const altMatch = shortcut.altKey ? event.altKey : !event.altKey || shortcut.altKey === false;

      if (keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch) {
        event.preventDefault();
        shortcut.callback(event);
      }
    });
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

// Predefined shortcuts for social media content
export const useSocialMediaShortcuts = (callbacks: {
  copyActive?: () => void;
  nextPlatform?: () => void;
  previousPlatform?: () => void;
  regenerateContent?: () => void;
}) => {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'c',
      ctrlKey: true,
      shiftKey: true,
      callback: () => callbacks.copyActive?.(),
      description: 'Copy active social media post'
    },
    {
      key: 'ArrowRight',
      ctrlKey: true,
      callback: () => callbacks.nextPlatform?.(),
      description: 'Switch to next platform'
    },
    {
      key: 'ArrowLeft',
      ctrlKey: true,
      callback: () => callbacks.previousPlatform?.(),
      description: 'Switch to previous platform'
    },
    {
      key: 'r',
      ctrlKey: true,
      shiftKey: true,
      callback: () => callbacks.regenerateContent?.(),
      description: 'Regenerate content for current platform'
    }
  ];

  useKeyboardShortcuts(shortcuts);

  return shortcuts;
};