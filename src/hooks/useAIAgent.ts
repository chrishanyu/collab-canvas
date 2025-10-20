/**
 * useAIAgent Hook
 * 
 * Manages AI command state and execution
 */

import { useState, useCallback } from 'react';
import { sendAICommand } from '../services/ai.service';
import { executeFunctionCalls } from '../services/aiCommands';
import type { AIAgentState, CanvasState } from '../types/ai';
import { showErrorToast, showSuccessToast } from '../utils/toast';

interface UseAIAgentProps {
  canvasId: string;
  userId: string;
  userName: string;
  canvasState?: CanvasState;
  onShapesCreated?: (shapeIds: string[]) => void; // Callback when AI creates shapes
}

interface UseAIAgentReturn {
  state: AIAgentState;
  executeCommand: (command: string) => Promise<void>;
  reset: () => void;
}

/**
 * Hook for AI command execution
 */
export function useAIAgent({ 
  canvasId, 
  userId, 
  userName,
  canvasState,
  onShapesCreated
}: UseAIAgentProps): UseAIAgentReturn {
  const [state, setState] = useState<AIAgentState>({
    status: 'idle',
    isLoading: false,
    error: undefined,
    lastCommand: undefined,
  });

  /**
   * Execute an AI command
   */
  const executeCommand = useCallback(async (command: string) => {
    if (!command.trim()) {
      showErrorToast('Please enter a command');
      return;
    }

    // Set loading state
    setState({
      status: 'processing',
      isLoading: true,
      error: undefined,
      lastCommand: command,
    });

    try {
      // 1. Send command to AI service
      const response = await sendAICommand(command, canvasId, userId, canvasState);

      if (!response.success || !response.functionCalls || response.functionCalls.length === 0) {
        throw new Error(response.error || 'No actions could be generated from your command');
      }

      // 2. Execute function calls locally
      const executionResult = await executeFunctionCalls(
        response.functionCalls,
        canvasId,
        userId,
        userName
      );

      if (!executionResult.success) {
        throw new Error(executionResult.error || 'Failed to execute command');
      }

      // 3. Success!
      setState({
        status: 'success',
        isLoading: false,
        error: undefined,
        lastCommand: command,
      });

      // Show success message
      const shapeCount = executionResult.shapeIds?.length || 0;
      if (shapeCount > 0) {
        showSuccessToast(`✓ Created ${shapeCount} shape${shapeCount > 1 ? 's' : ''}`);
        
        // Auto-select created shapes if callback provided
        if (onShapesCreated && executionResult.shapeIds) {
          onShapesCreated(executionResult.shapeIds);
        }
      } else {
        showSuccessToast('✓ Command executed successfully');
      }

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          status: 'idle',
        }));
      }, 2000);

    } catch (error: any) {
      console.error('AI command error:', error);
      
      const errorMessage = error.message || 'An error occurred';
      
      setState({
        status: 'error',
        isLoading: false,
        error: errorMessage,
        lastCommand: command,
      });

      showErrorToast(errorMessage);

      // Reset to idle after 5 seconds
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          status: 'idle',
          error: undefined,
        }));
      }, 5000);
    }
  }, [canvasId, userId, userName, canvasState, onShapesCreated]);

  /**
   * Reset state to idle
   */
  const reset = useCallback(() => {
    setState({
      status: 'idle',
      isLoading: false,
      error: undefined,
      lastCommand: undefined,
    });
  }, []);

  return {
    state,
    executeCommand,
    reset,
  };
}

