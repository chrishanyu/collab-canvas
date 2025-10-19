/**
 * Unit Tests for useAIAgent Hook
 * 
 * Tests state transitions, command execution, and error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAIAgent } from './useAIAgent';
import * as aiService from '../services/ai.service';
import * as aiCommands from '../services/aiCommands';
import * as toast from '../utils/toast';
import type { AICommandResponse, ExecutionResult } from '../types/ai';

// Mock services
vi.mock('../services/ai.service', () => ({
  sendAICommand: vi.fn(),
}));

vi.mock('../services/aiCommands', () => ({
  executeFunctionCalls: vi.fn(),
}));

vi.mock('../utils/toast', () => ({
  showSuccessToast: vi.fn(),
  showErrorToast: vi.fn(),
}));

describe('useAIAgent', () => {
  const mockProps = {
    canvasId: 'test-canvas-id',
    userId: 'test-user-id',
    userName: 'Test User',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with idle state', () => {
      const { result } = renderHook(() => useAIAgent(mockProps));

      expect(result.current.state.status).toBe('idle');
      expect(result.current.state.isLoading).toBe(false);
      expect(result.current.state.error).toBeUndefined();
      expect(result.current.state.lastCommand).toBeUndefined();
    });

    it('should provide executeCommand function', () => {
      const { result } = renderHook(() => useAIAgent(mockProps));

      expect(result.current.executeCommand).toBeDefined();
      expect(typeof result.current.executeCommand).toBe('function');
    });

    it('should provide reset function', () => {
      const { result } = renderHook(() => useAIAgent(mockProps));

      expect(result.current.reset).toBeDefined();
      expect(typeof result.current.reset).toBe('function');
    });
  });

  describe('executeCommand - Success Flow', () => {
    it('should successfully execute a command and update state', async () => {
      const mockResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'createShape',
            arguments: {
              type: 'circle',
              x: 0,
              y: 0,
              width: 100,
              height: 100,
              color: 'red',
            },
          },
        ],
      };

      const mockExecution: ExecutionResult = {
        success: true,
        shapeIds: ['shape-123'],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockResponse);
      vi.mocked(aiCommands.executeFunctionCalls).mockResolvedValue(mockExecution);

      const { result } = renderHook(() => useAIAgent(mockProps));

      // Execute command
      await act(async () => {
        await result.current.executeCommand('Create a red circle');
      });

      // Should show success toast
      expect(toast.showSuccessToast).toHaveBeenCalledWith('✓ Created 1 shape');

      // Should call AI service with correct parameters
      expect(aiService.sendAICommand).toHaveBeenCalledWith(
        'Create a red circle',
        mockProps.canvasId,
        mockProps.userId,
        undefined
      );

      // Should execute function calls
      expect(aiCommands.executeFunctionCalls).toHaveBeenCalledWith(
        mockResponse.functionCalls,
        mockProps.canvasId,
        mockProps.userId,
        mockProps.userName
      );
    });

    it('should transition through processing to success state', async () => {
      const mockResponse: AICommandResponse = {
        success: true,
        functionCalls: [{ name: 'createShape', arguments: {} }],
      };

      const mockExecution: ExecutionResult = {
        success: true,
        shapeIds: ['shape-1'],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockResponse);
      vi.mocked(aiCommands.executeFunctionCalls).mockResolvedValue(mockExecution);

      const { result } = renderHook(() => useAIAgent(mockProps));

      // Start execution
      let executePromise: Promise<void>;
      act(() => {
        executePromise = result.current.executeCommand('test command');
      });

      // Should be processing
      await waitFor(() => {
        expect(result.current.state.status).toBe('processing');
        expect(result.current.state.isLoading).toBe(true);
        expect(result.current.state.lastCommand).toBe('test command');
      });

      // Wait for completion
      await act(async () => {
        await executePromise!;
      });

      // Should be success
      expect(result.current.state.status).toBe('success');
      expect(result.current.state.isLoading).toBe(false);
      expect(result.current.state.error).toBeUndefined();
    });

    it('should show correct success message for multiple shapes', async () => {
      const mockResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          { name: 'createShape', arguments: {} },
          { name: 'createShape', arguments: {} },
        ],
      };

      const mockExecution: ExecutionResult = {
        success: true,
        shapeIds: ['shape-1', 'shape-2'],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockResponse);
      vi.mocked(aiCommands.executeFunctionCalls).mockResolvedValue(mockExecution);

      const { result } = renderHook(() => useAIAgent(mockProps));

      await act(async () => {
        await result.current.executeCommand('Create shapes');
      });

      expect(toast.showSuccessToast).toHaveBeenCalledWith('✓ Created 2 shapes');
    });

    it('should show generic success message when no shapes created', async () => {
      const mockResponse: AICommandResponse = {
        success: true,
        functionCalls: [{ name: 'getCanvasState', arguments: {} }],
      };

      const mockExecution: ExecutionResult = {
        success: true,
        shapeIds: [],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockResponse);
      vi.mocked(aiCommands.executeFunctionCalls).mockResolvedValue(mockExecution);

      const { result } = renderHook(() => useAIAgent(mockProps));

      await act(async () => {
        await result.current.executeCommand('Get canvas state');
      });

      expect(toast.showSuccessToast).toHaveBeenCalledWith('✓ Command executed successfully');
    });

    it('should reset to idle after 2 seconds on success', async () => {
      vi.useFakeTimers();

      const mockResponse: AICommandResponse = {
        success: true,
        functionCalls: [{ name: 'createShape', arguments: {} }],
      };

      const mockExecution: ExecutionResult = {
        success: true,
        shapeIds: ['shape-1'],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockResponse);
      vi.mocked(aiCommands.executeFunctionCalls).mockResolvedValue(mockExecution);

      const { result } = renderHook(() => useAIAgent(mockProps));

      await act(async () => {
        await result.current.executeCommand('test');
      });

      expect(result.current.state.status).toBe('success');

      // Fast-forward 2 seconds
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.state.status).toBe('idle');

      vi.useRealTimers();
    });

    it('should include canvas state when provided', async () => {
      const canvasState = {
        shapes: [
          { id: '1', type: 'circle', x: 0, y: 0, width: 100, height: 100, fill: '#FF0000' },
        ],
        selectedShapeIds: [],
      };

      const propsWithState = { ...mockProps, canvasState };

      const mockResponse: AICommandResponse = {
        success: true,
        functionCalls: [{ name: 'createShape', arguments: {} }],
      };

      const mockExecution: ExecutionResult = {
        success: true,
        shapeIds: ['shape-1'],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockResponse);
      vi.mocked(aiCommands.executeFunctionCalls).mockResolvedValue(mockExecution);

      const { result } = renderHook(() => useAIAgent(propsWithState));

      await act(async () => {
        await result.current.executeCommand('test');
      });

      expect(aiService.sendAICommand).toHaveBeenCalledWith(
        'test',
        mockProps.canvasId,
        mockProps.userId,
        canvasState
      );
    });
  });

  describe('executeCommand - Error Handling', () => {
    it('should handle empty command', async () => {
      const { result } = renderHook(() => useAIAgent(mockProps));

      await act(async () => {
        await result.current.executeCommand('');
      });

      expect(toast.showErrorToast).toHaveBeenCalledWith('Please enter a command');
      expect(aiService.sendAICommand).not.toHaveBeenCalled();
    });

    it('should handle whitespace-only command', async () => {
      const { result } = renderHook(() => useAIAgent(mockProps));

      await act(async () => {
        await result.current.executeCommand('   ');
      });

      expect(toast.showErrorToast).toHaveBeenCalledWith('Please enter a command');
      expect(aiService.sendAICommand).not.toHaveBeenCalled();
    });

    it('should handle AI service error', async () => {
      vi.mocked(aiService.sendAICommand).mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useAIAgent(mockProps));

      await act(async () => {
        await result.current.executeCommand('test command');
      });

      expect(result.current.state.status).toBe('error');
      expect(result.current.state.isLoading).toBe(false);
      expect(result.current.state.error).toBe('Network error');
      expect(toast.showErrorToast).toHaveBeenCalledWith('Network error');
    });

    it('should handle AI response with no function calls', async () => {
      const mockResponse: AICommandResponse = {
        success: true,
        functionCalls: [],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAIAgent(mockProps));

      await act(async () => {
        await result.current.executeCommand('test command');
      });

      expect(result.current.state.status).toBe('error');
      expect(result.current.state.error).toContain('No actions could be generated');
      expect(toast.showErrorToast).toHaveBeenCalled();
    });

    it('should handle AI response with success=false', async () => {
      const mockResponse: AICommandResponse = {
        success: false,
        error: 'Invalid command',
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAIAgent(mockProps));

      await act(async () => {
        await result.current.executeCommand('test command');
      });

      expect(result.current.state.status).toBe('error');
      expect(result.current.state.error).toBe('Invalid command');
      expect(toast.showErrorToast).toHaveBeenCalledWith('Invalid command');
    });

    it('should handle function execution error', async () => {
      const mockResponse: AICommandResponse = {
        success: true,
        functionCalls: [{ name: 'createShape', arguments: {} }],
      };

      const mockExecution: ExecutionResult = {
        success: false,
        error: 'Failed to create shape',
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockResponse);
      vi.mocked(aiCommands.executeFunctionCalls).mockResolvedValue(mockExecution);

      const { result } = renderHook(() => useAIAgent(mockProps));

      await act(async () => {
        await result.current.executeCommand('test command');
      });

      expect(result.current.state.status).toBe('error');
      expect(result.current.state.error).toBe('Failed to create shape');
      expect(toast.showErrorToast).toHaveBeenCalledWith('Failed to create shape');
    });

    it('should reset to idle after 5 seconds on error', async () => {
      vi.useFakeTimers();

      vi.mocked(aiService.sendAICommand).mockRejectedValue(new Error('Test error'));

      const { result } = renderHook(() => useAIAgent(mockProps));

      await act(async () => {
        await result.current.executeCommand('test');
      });

      expect(result.current.state.status).toBe('error');
      expect(result.current.state.error).toBe('Test error');

      // Fast-forward 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.state.status).toBe('idle');
      expect(result.current.state.error).toBeUndefined();

      vi.useRealTimers();
    });

    it('should handle error without message', async () => {
      vi.mocked(aiService.sendAICommand).mockRejectedValue({});

      const { result } = renderHook(() => useAIAgent(mockProps));

      await act(async () => {
        await result.current.executeCommand('test command');
      });

      expect(result.current.state.error).toBe('An error occurred');
      expect(toast.showErrorToast).toHaveBeenCalledWith('An error occurred');
    });
  });

  describe('reset', () => {
    it('should reset state to idle', async () => {
      vi.mocked(aiService.sendAICommand).mockRejectedValue(new Error('Test error'));

      const { result } = renderHook(() => useAIAgent(mockProps));

      // Cause error
      await act(async () => {
        await result.current.executeCommand('test');
      });

      expect(result.current.state.status).toBe('error');
      expect(result.current.state.error).toBe('Test error');

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.state.status).toBe('idle');
      expect(result.current.state.isLoading).toBe(false);
      expect(result.current.state.error).toBeUndefined();
      expect(result.current.state.lastCommand).toBeUndefined();
    });
  });

  describe('State Transitions', () => {
    it('should maintain lastCommand across state transitions', async () => {
      const mockResponse: AICommandResponse = {
        success: true,
        functionCalls: [{ name: 'createShape', arguments: {} }],
      };

      const mockExecution: ExecutionResult = {
        success: true,
        shapeIds: ['shape-1'],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockResponse);
      vi.mocked(aiCommands.executeFunctionCalls).mockResolvedValue(mockExecution);

      const { result } = renderHook(() => useAIAgent(mockProps));

      await act(async () => {
        await result.current.executeCommand('my test command');
      });

      expect(result.current.state.lastCommand).toBe('my test command');
    });

    it('should clear error on successful command after error', async () => {
      // First command fails
      vi.mocked(aiService.sendAICommand).mockRejectedValueOnce(new Error('Error 1'));

      const { result } = renderHook(() => useAIAgent(mockProps));

      await act(async () => {
        await result.current.executeCommand('first');
      });

      expect(result.current.state.error).toBe('Error 1');

      // Second command succeeds
      const mockResponse: AICommandResponse = {
        success: true,
        functionCalls: [{ name: 'createShape', arguments: {} }],
      };

      const mockExecution: ExecutionResult = {
        success: true,
        shapeIds: ['shape-1'],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockResponse);
      vi.mocked(aiCommands.executeFunctionCalls).mockResolvedValue(mockExecution);

      await act(async () => {
        await result.current.executeCommand('second');
      });

      expect(result.current.state.error).toBeUndefined();
      expect(result.current.state.status).toBe('success');
    });
  });
});

