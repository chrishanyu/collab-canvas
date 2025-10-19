import { useEffect, useRef } from 'react';

/**
 * Keyboard shortcut handler function type
 */
type ShortcutHandler = (event: KeyboardEvent) => void;

/**
 * Keyboard shortcut configuration
 */
interface ShortcutConfig {
  key: string;
  meta?: boolean; // Cmd on Mac, Ctrl on Windows
  ctrl?: boolean; // Explicit Ctrl key
  shift?: boolean;
  alt?: boolean;
  handler: ShortcutHandler;
  preventDefault?: boolean;
}

/**
 * useKeyboardShortcuts Hook
 * 
 * Manages keyboard event listeners and shortcut handlers for the canvas.
 * Supports platform-specific shortcuts (Cmd on Mac, Ctrl on Windows).
 * 
 * @param shortcuts - Array of shortcut configurations
 * @param enabled - Whether keyboard shortcuts are enabled (default: true)
 * 
 * @example
 * ```tsx
 * useKeyboardShortcuts([
 *   { key: 'Delete', handler: handleDelete, preventDefault: true },
 *   { key: 'd', meta: true, handler: handleDuplicate, preventDefault: true },
 *   { key: 'c', meta: true, handler: handleCopy },
 * ], isCanvasFocused);
 * ```
 */
export const useKeyboardShortcuts = (
  shortcuts: ShortcutConfig[],
  enabled: boolean = true
) => {
  // Use ref to avoid recreating the handler on every render
  const shortcutsRef = useRef<ShortcutConfig[]>(shortcuts);
  
  // Update ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      const isInputElement = 
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;
      
      if (isInputElement) return;

      // Check each registered shortcut
      for (const shortcut of shortcutsRef.current) {
        if (matchesShortcut(event, shortcut)) {
          if (shortcut.preventDefault) {
            event.preventDefault();
          }
          shortcut.handler(event);
          break; // Only trigger first matching shortcut
        }
      }
    };

    // Add listener to window for global keyboard shortcuts
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled]);
};

/**
 * Check if keyboard event matches a shortcut configuration
 */
function matchesShortcut(event: KeyboardEvent, shortcut: ShortcutConfig): boolean {
  // Check key match (case-insensitive for letter keys)
  const eventKey = event.key.toLowerCase();
  const shortcutKey = shortcut.key.toLowerCase();
  
  if (eventKey !== shortcutKey) return false;

  // Check modifier keys
  // 'meta' means Cmd on Mac, Ctrl on Windows (using metaKey for Mac, ctrlKey for Windows)
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  if (shortcut.meta !== undefined) {
    const metaPressed = isMac ? event.metaKey : event.ctrlKey;
    if (shortcut.meta !== metaPressed) return false;
  }

  // Explicit ctrl key check (for cross-platform compatibility)
  if (shortcut.ctrl !== undefined) {
    if (shortcut.ctrl !== event.ctrlKey) return false;
  }

  if (shortcut.shift !== undefined) {
    if (shortcut.shift !== event.shiftKey) return false;
  }

  if (shortcut.alt !== undefined) {
    if (shortcut.alt !== event.altKey) return false;
  }

  // If we got here, all conditions match
  return true;
}

/**
 * Utility function to detect if running on Mac
 */
export const isMacOS = (): boolean => {
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
};

/**
 * Utility function to format keyboard shortcut for display
 * @example formatShortcut('d', true) => "⌘D" on Mac, "Ctrl+D" on Windows
 */
export const formatShortcut = (
  key: string,
  meta?: boolean,
  shift?: boolean,
  alt?: boolean
): string => {
  const isMac = isMacOS();
  const parts: string[] = [];

  if (meta) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }
  if (alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }

  // Capitalize first letter of key
  const displayKey = key.length === 1 ? key.toUpperCase() : key;
  parts.push(displayKey);

  return isMac ? parts.join('') : parts.join('+');
};

