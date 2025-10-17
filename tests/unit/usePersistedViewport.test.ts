import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePersistedViewport } from '../../src/hooks/usePersistedViewport';

describe('usePersistedViewport', () => {
  const mockCanvasId = 'test-canvas-123';
  const STORAGE_KEY = `canvas-viewport-${mockCanvasId}`;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllTimers();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should initialize with default values when no saved state exists', () => {
      const { result } = renderHook(() => usePersistedViewport(mockCanvasId));

      expect(result.current.stageScale).toBe(1); // DEFAULT_ZOOM
      expect(result.current.stageX).toBe(0); // DEFAULT_CANVAS_X
      expect(result.current.stageY).toBe(0); // DEFAULT_CANVAS_Y
    });

    it('should restore viewport state from localStorage on mount', () => {
      // Arrange: Set saved viewport state
      const savedState = {
        scale: 1.5,
        x: 100,
        y: 200,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));

      // Act: Render hook
      const { result } = renderHook(() => usePersistedViewport(mockCanvasId));

      // Assert: State should be restored
      expect(result.current.stageScale).toBe(1.5);
      expect(result.current.stageX).toBe(100);
      expect(result.current.stageY).toBe(200);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      // Arrange: Set invalid JSON in localStorage
      localStorage.setItem(STORAGE_KEY, 'invalid-json-{{{');

      // Act: Render hook (should not throw)
      const { result } = renderHook(() => usePersistedViewport(mockCanvasId));

      // Assert: Should fall back to default values
      expect(result.current.stageScale).toBe(1);
      expect(result.current.stageX).toBe(0);
      expect(result.current.stageY).toBe(0);
    });

    it('should handle partial saved state gracefully', () => {
      // Arrange: Set incomplete saved state (missing some fields)
      const partialState = {
        scale: 2.0,
        // x and y missing
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(partialState));

      // Act: Render hook
      const { result } = renderHook(() => usePersistedViewport(mockCanvasId));

      // Assert: Should use saved scale, default for missing fields
      expect(result.current.stageScale).toBe(2.0);
      expect(result.current.stageX).toBe(0);
      expect(result.current.stageY).toBe(0);
    });
  });

  describe('Storage Key', () => {
    it('should use correct storage key per canvas', () => {
      const canvasId1 = 'canvas-1';
      const canvasId2 = 'canvas-2';

      // Save state for canvas 1
      const state1 = { scale: 1.5, x: 100, y: 200 };
      localStorage.setItem(`canvas-viewport-${canvasId1}`, JSON.stringify(state1));

      // Save state for canvas 2
      const state2 = { scale: 2.0, x: 300, y: 400 };
      localStorage.setItem(`canvas-viewport-${canvasId2}`, JSON.stringify(state2));

      // Render hook for canvas 1
      const { result: result1 } = renderHook(() => usePersistedViewport(canvasId1));
      expect(result1.current.stageScale).toBe(1.5);
      expect(result1.current.stageX).toBe(100);
      expect(result1.current.stageY).toBe(200);

      // Render hook for canvas 2
      const { result: result2 } = renderHook(() => usePersistedViewport(canvasId2));
      expect(result2.current.stageScale).toBe(2.0);
      expect(result2.current.stageX).toBe(300);
      expect(result2.current.stageY).toBe(400);
    });

    it('should not conflict between different canvas IDs', () => {
      const canvasA = 'canvas-a';
      const canvasB = 'canvas-b';

      const { result: resultA } = renderHook(() => usePersistedViewport(canvasA));
      const { result: resultB } = renderHook(() => usePersistedViewport(canvasB));

      // Update canvas A
      act(() => {
        resultA.current.setStageScale(3.0);
      });

      // Wait for debounce
      vi.useFakeTimers();
      act(() => {
        vi.advanceTimersByTime(500);
      });
      vi.useRealTimers();

      // Canvas B should remain unchanged
      expect(resultB.current.stageScale).toBe(1); // Default value
    });
  });

  describe('Saving Viewport State', () => {
    it('should save viewport state to localStorage', async () => {
      const { result } = renderHook(() => usePersistedViewport(mockCanvasId));

      // Act: Update viewport state
      act(() => {
        result.current.setStageScale(2.0);
        result.current.setStageX(150);
        result.current.setStageY(250);
      });

      // Wait for debounce (500ms)
      vi.useFakeTimers();
      act(() => {
        vi.advanceTimersByTime(500);
      });
      vi.useRealTimers();

      // Assert: State should be saved to localStorage
      await waitFor(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        expect(saved).toBeTruthy();
        
        const parsedState = JSON.parse(saved!);
        expect(parsedState.scale).toBe(2.0);
        expect(parsedState.x).toBe(150);
        expect(parsedState.y).toBe(250);
      });
    });

    it('should debounce localStorage writes', async () => {
      const { result } = renderHook(() => usePersistedViewport(mockCanvasId));
      vi.useFakeTimers();

      // Spy on localStorage.setItem
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

      // Act: Make multiple rapid updates
      act(() => {
        result.current.setStageScale(1.1);
      });

      act(() => {
        vi.advanceTimersByTime(100); // 100ms
      });

      act(() => {
        result.current.setStageScale(1.2);
      });

      act(() => {
        vi.advanceTimersByTime(100); // 100ms
      });

      act(() => {
        result.current.setStageScale(1.3);
      });

      // Assert: localStorage.setItem should NOT be called yet
      expect(setItemSpy).not.toHaveBeenCalled();

      // Wait for full debounce period
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Assert: localStorage.setItem should be called ONCE with final value
      expect(setItemSpy).toHaveBeenCalledTimes(1);
      
      const savedCall = setItemSpy.mock.calls[0];
      expect(savedCall[0]).toBe(STORAGE_KEY);
      
      const savedData = JSON.parse(savedCall[1] as string);
      expect(savedData.scale).toBe(1.3); // Final value

      setItemSpy.mockRestore();
      vi.useRealTimers();
    });

    it('should reset debounce timer on each state change', () => {
      const { result } = renderHook(() => usePersistedViewport(mockCanvasId));
      vi.useFakeTimers();

      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

      // First update
      act(() => {
        result.current.setStageScale(1.5);
      });

      // Wait 400ms (not enough to trigger save)
      act(() => {
        vi.advanceTimersByTime(400);
      });

      // Second update (resets timer)
      act(() => {
        result.current.setStageX(100);
      });

      // Wait another 400ms (total 800ms, but timer was reset)
      act(() => {
        vi.advanceTimersByTime(400);
      });

      // Should not have saved yet
      expect(setItemSpy).not.toHaveBeenCalled();

      // Wait final 100ms to complete the 500ms after last update
      act(() => {
        vi.advanceTimersByTime(100);
      });

      // Now it should have saved
      expect(setItemSpy).toHaveBeenCalledTimes(1);

      setItemSpy.mockRestore();
      vi.useRealTimers();
    });

    it('should handle localStorage write errors gracefully', () => {
      const { result } = renderHook(() => usePersistedViewport(mockCanvasId));
      vi.useFakeTimers();

      // Mock localStorage.setItem to throw error
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
        .mockImplementation(() => {
          throw new Error('Quota exceeded');
        });

      // Spy on console.error
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act: Update state (should not throw)
      act(() => {
        result.current.setStageScale(2.0);
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Assert: Error should be logged but not thrown
      expect(consoleErrorSpy).toHaveBeenCalled();

      setItemSpy.mockRestore();
      consoleErrorSpy.mockRestore();
      vi.useRealTimers();
    });
  });

  describe('State Setters', () => {
    it('should update stageScale correctly', () => {
      const { result } = renderHook(() => usePersistedViewport(mockCanvasId));

      act(() => {
        result.current.setStageScale(2.5);
      });

      expect(result.current.stageScale).toBe(2.5);
    });

    it('should update stageX correctly', () => {
      const { result } = renderHook(() => usePersistedViewport(mockCanvasId));

      act(() => {
        result.current.setStageX(300);
      });

      expect(result.current.stageX).toBe(300);
    });

    it('should update stageY correctly', () => {
      const { result } = renderHook(() => usePersistedViewport(mockCanvasId));

      act(() => {
        result.current.setStageY(400);
      });

      expect(result.current.stageY).toBe(400);
    });

    it('should allow updating multiple state values independently', () => {
      const { result } = renderHook(() => usePersistedViewport(mockCanvasId));

      act(() => {
        result.current.setStageScale(1.8);
        result.current.setStageX(120);
        result.current.setStageY(240);
      });

      expect(result.current.stageScale).toBe(1.8);
      expect(result.current.stageX).toBe(120);
      expect(result.current.stageY).toBe(240);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup debounce timer on unmount', () => {
      const { result, unmount } = renderHook(() => usePersistedViewport(mockCanvasId));
      vi.useFakeTimers();

      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

      // Update state
      act(() => {
        result.current.setStageScale(3.0);
      });

      // Unmount before debounce completes
      unmount();

      // Advance timers
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Assert: Should not save after unmount
      expect(setItemSpy).not.toHaveBeenCalled();

      setItemSpy.mockRestore();
      vi.useRealTimers();
    });
  });
});

