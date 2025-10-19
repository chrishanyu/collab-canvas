/**
 * CommandHistory Component
 * 
 * Displays recent AI commands with ability to re-run them
 * Persists command history to localStorage
 */

import React, { useState, useEffect } from 'react';
import { Clock, RefreshCw } from 'lucide-react';

interface CommandHistoryProps {
  canvasId: string;
  onSelectCommand: (command: string) => void;
}

interface CommandHistoryEntry {
  command: string;
  timestamp: number;
}

const MAX_HISTORY_SIZE = 10;
const STORAGE_KEY_PREFIX = 'ai-command-history-';

/**
 * Get command history from localStorage for a specific canvas
 */
const getCommandHistory = (canvasId: string): CommandHistoryEntry[] => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${canvasId}`;
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to load command history:', error);
    return [];
  }
};

/**
 * Save command history to localStorage
 */
const saveCommandHistory = (canvasId: string, history: CommandHistoryEntry[]) => {
  try {
    const key = `${STORAGE_KEY_PREFIX}${canvasId}`;
    localStorage.setItem(key, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save command history:', error);
  }
};

/**
 * Add a command to history (deduplicates and maintains max size)
 */
export const addToCommandHistory = (canvasId: string, command: string) => {
  const history = getCommandHistory(canvasId);
  
  // Remove duplicate if exists
  const filtered = history.filter(entry => entry.command !== command);
  
  // Add new command at the beginning
  const updated: CommandHistoryEntry[] = [
    { command, timestamp: Date.now() },
    ...filtered,
  ];
  
  // Keep only last MAX_HISTORY_SIZE entries
  const trimmed = updated.slice(0, MAX_HISTORY_SIZE);
  
  saveCommandHistory(canvasId, trimmed);
};

/**
 * Format timestamp for display
 */
const formatTimestamp = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

export const CommandHistory: React.FC<CommandHistoryProps> = ({
  canvasId,
  onSelectCommand,
}) => {
  const [history, setHistory] = useState<CommandHistoryEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Load history on mount and when canvasId changes
  useEffect(() => {
    const loadedHistory = getCommandHistory(canvasId);
    setHistory(loadedHistory);
  }, [canvasId]);

  // Refresh history periodically (in case another tab/user added commands)
  useEffect(() => {
    const interval = setInterval(() => {
      const loadedHistory = getCommandHistory(canvasId);
      setHistory(loadedHistory);
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [canvasId]);

  if (history.length === 0) {
    return null; // Don't show anything if no history
  }

  return (
    <div className="mt-3 border-t border-gray-200 pt-3">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors w-full"
      >
        <Clock className="w-4 h-4" />
        <span className="font-medium">Recent Commands ({history.length})</span>
        <svg
          className={`w-4 h-4 ml-auto transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* History List */}
      {isExpanded && (
        <div className="mt-2 space-y-1 max-h-64 overflow-y-auto">
          {history.map((entry, index) => (
            <button
              key={`${entry.timestamp}-${index}`}
              onClick={() => onSelectCommand(entry.command)}
              className="w-full text-left px-3 py-2 rounded hover:bg-gray-50 transition-colors group flex items-start gap-2"
              title="Click to re-run this command"
            >
              <RefreshCw className="w-3 h-3 mt-0.5 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-700 group-hover:text-gray-900 truncate">
                  {entry.command}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatTimestamp(entry.timestamp)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

