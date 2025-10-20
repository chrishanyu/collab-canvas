/**
 * AICommandInput Component
 * 
 * Basic AI command input interface (MVP version)
 * Positioned as a floating panel for easy access
 */

import React, { useState, useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { useAIAgent } from '../../hooks/useAIAgent';
import type { CanvasState } from '../../types/ai';
import { CommandHistory, addToCommandHistory } from './CommandHistory';

interface AICommandInputProps {
  canvasId: string;
  userId: string;
  userName: string;
  canvasState?: CanvasState;
  onClose?: () => void;
  onShapesCreated?: (shapeIds: string[]) => void;
}

export const AICommandInput: React.FC<AICommandInputProps> = ({
  canvasId,
  userId,
  userName,
  canvasState,
  onClose,
  onShapesCreated,
}) => {
  const [command, setCommand] = useState('');
  const { state, executeCommand } = useAIAgent({
    canvasId,
    userId,
    userName,
    canvasState,
    onShapesCreated,
  });

  // Track previous status to detect transitions
  const previousStatusRef = useRef(state.status);

  // Clear input and save to history when transitioning to success state
  useEffect(() => {
    if (previousStatusRef.current !== 'success' && state.status === 'success') {
      // Save command to history before clearing
      if (state.lastCommand) {
        addToCommandHistory(canvasId, state.lastCommand);
      }
      setCommand('');
    }
    previousStatusRef.current = state.status;
  }, [state.status, state.lastCommand, canvasId]);

  const handleSubmit = async () => {
    if (!command.trim() || state.isLoading) return;
    await executeCommand(command);
  };

  const handleSelectHistoryCommand = (historicalCommand: string) => {
    setCommand(historicalCommand);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Status indicator color
  const getBorderColor = () => {
    switch (state.status) {
      case 'processing':
        return 'border-blue-500';
      case 'success':
        return 'border-green-500';
      case 'error':
        return 'border-red-500';
      default:
        return 'border-gray-300 focus-within:border-blue-400';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 w-80 bg-white rounded-lg shadow-lg border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <span className="font-semibold text-gray-800">AI Assistant</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
            title="Close AI Panel (Cmd/Ctrl+K)"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4">
        <div className={`flex items-center gap-2 border-2 rounded-lg transition-colors ${getBorderColor()}`}>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Create a red circle..."
            disabled={state.isLoading}
            className="flex-1 px-3 py-2 outline-none rounded-l-lg disabled:bg-gray-50 disabled:text-gray-500"
          />
          <button
            onClick={handleSubmit}
            disabled={!command.trim() || state.isLoading}
            className={`px-4 py-2 rounded-r-lg font-medium transition-colors ${
              state.isLoading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : command.trim()
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {state.isLoading ? (
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              'Send'
            )}
          </button>
        </div>

        {/* Status Messages */}
        {state.isLoading && (
          <div className="mt-2 text-sm text-blue-600 flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>AI is thinking...</span>
          </div>
        )}

        {state.error && (
          <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
            {state.error}
          </div>
        )}

        {/* Example Hints */}
        {!state.isLoading && !state.error && (
          <div className="mt-3 text-xs text-gray-500">
            <p className="font-medium mb-1">Try:</p>
            <ul className="space-y-1">
              <li>"Create a blue circle"</li>
              <li>"Make a red rectangle"</li>
              <li>"Add text that says Hello"</li>
            </ul>
          </div>
        )}

        {/* Command History */}
        {!state.isLoading && (
          <CommandHistory
            canvasId={canvasId}
            onSelectCommand={handleSelectHistoryCommand}
          />
        )}
      </div>
    </div>
  );
};

