import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useActiveEdits } from '../../src/hooks/useActiveEdits';
import * as activeEditsService from '../../src/services/activeEdits.service';
import type { ActiveEdit } from '../../src/services/activeEdits.service';

// Mock the activeEdits service
vi.mock('../../src/services/activeEdits.service', () => ({
  subscribeToActiveEdits: vi.fn(),
  setActiveEdit: vi.fn(),
  clearActiveEdit: vi.fn(),
}));

describe('useActiveEdits Hook', () => {
  const mockCanvasId = 'canvas-123';
  const mockUserId = 'user-456';
  const mockUserName = 'Alice Smith';
  const mockColor = '#3B82F6';
  const mockShapeId = 'shape-789';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Subscription Management', () => {
    it('subscribes to active edits on mount', () => {
      const mockUnsubscribe = vi.fn();
      vi.mocked(activeEditsService.subscribeToActiveEdits).mockReturnValue(
        mockUnsubscribe
      );

      renderHook(() => useActiveEdits(mockCanvasId, mockUserId));

      expect(activeEditsService.subscribeToActiveEdits).toHaveBeenCalledWith(
        mockCanvasId,
        expect.any(Function)
      );
    });

    it('calls unsubscribe on unmount', () => {
      const mockUnsubscribe = vi.fn();
      vi.mocked(activeEditsService.subscribeToActiveEdits).mockReturnValue(
        mockUnsubscribe
      );

      const { unmount } = renderHook(() =>
        useActiveEdits(mockCanvasId, mockUserId)
      );

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('updates activeEdits state when subscription callback is called', async () => {
      let subscriptionCallback: ((edits: Map<string, ActiveEdit>) => void) | null =
        null;

      vi.mocked(activeEditsService.subscribeToActiveEdits).mockImplementation(
        (canvasId, callback) => {
          subscriptionCallback = callback;
          return vi.fn();
        }
      );

      const { result } = renderHook(() =>
        useActiveEdits(mockCanvasId, mockUserId)
      );

      // Initially empty
      expect(result.current.activeEdits.size).toBe(0);

      // Simulate subscription update
      const mockActiveEdits = new Map<string, ActiveEdit>([
        [
          mockShapeId,
          {
            userId: 'user-999',
            userName: 'Bob Jones',
            color: '#EF4444',
            startedAt: new Date(),
            expiresAt: new Date(Date.now() + 30000),
          },
        ],
      ]);

      subscriptionCallback?.(mockActiveEdits);

      await waitFor(() => {
        expect(result.current.activeEdits.size).toBe(1);
        expect(result.current.activeEdits.get(mockShapeId)).toBeDefined();
      });
    });

    it('does not subscribe if canvasId is empty', () => {
      renderHook(() => useActiveEdits('', mockUserId));

      expect(activeEditsService.subscribeToActiveEdits).not.toHaveBeenCalled();
    });
  });

  describe('setShapeEditing', () => {
    it('calls setActiveEdit service with correct parameters', async () => {
      vi.mocked(activeEditsService.setActiveEdit).mockResolvedValue();
      vi.mocked(activeEditsService.clearActiveEdit).mockResolvedValue();
      vi.mocked(activeEditsService.subscribeToActiveEdits).mockReturnValue(
        vi.fn()
      );

      const { result } = renderHook(() =>
        useActiveEdits(mockCanvasId, mockUserId)
      );

      await result.current.setShapeEditing(
        mockShapeId,
        mockUserName,
        mockColor
      );

      expect(activeEditsService.setActiveEdit).toHaveBeenCalledWith(
        mockCanvasId,
        mockShapeId,
        mockUserId,
        mockUserName,
        mockColor
      );
    });

    it('handles errors gracefully when setActiveEdit fails', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const mockError = new Error('Firestore error');

      vi.mocked(activeEditsService.setActiveEdit).mockRejectedValue(mockError);
      vi.mocked(activeEditsService.clearActiveEdit).mockResolvedValue();
      vi.mocked(activeEditsService.subscribeToActiveEdits).mockReturnValue(
        vi.fn()
      );

      const { result } = renderHook(() =>
        useActiveEdits(mockCanvasId, mockUserId)
      );

      await result.current.setShapeEditing(
        mockShapeId,
        mockUserName,
        mockColor
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error setting shape editing:',
        mockError
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('clearShapeEditing', () => {
    it('calls clearActiveEdit service with correct parameters', async () => {
      vi.mocked(activeEditsService.setActiveEdit).mockResolvedValue();
      vi.mocked(activeEditsService.clearActiveEdit).mockResolvedValue();
      vi.mocked(activeEditsService.subscribeToActiveEdits).mockReturnValue(
        vi.fn()
      );

      const { result } = renderHook(() =>
        useActiveEdits(mockCanvasId, mockUserId)
      );

      await result.current.clearShapeEditing(mockShapeId);

      expect(activeEditsService.clearActiveEdit).toHaveBeenCalledWith(
        mockCanvasId,
        mockShapeId
      );
    });

    it('handles errors gracefully when clearActiveEdit fails', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const mockError = new Error('Firestore error');

      vi.mocked(activeEditsService.setActiveEdit).mockResolvedValue();
      vi.mocked(activeEditsService.clearActiveEdit).mockRejectedValue(
        mockError
      );
      vi.mocked(activeEditsService.subscribeToActiveEdits).mockReturnValue(
        vi.fn()
      );

      const { result } = renderHook(() =>
        useActiveEdits(mockCanvasId, mockUserId)
      );

      await result.current.clearShapeEditing(mockShapeId);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error clearing shape editing:',
        mockError
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('isShapeBeingEdited', () => {
    it('returns true when shape is in active edits', async () => {
      let subscriptionCallback: ((edits: Map<string, ActiveEdit>) => void) | null =
        null;

      vi.mocked(activeEditsService.subscribeToActiveEdits).mockImplementation(
        (canvasId, callback) => {
          subscriptionCallback = callback;
          return vi.fn();
        }
      );

      const { result } = renderHook(() =>
        useActiveEdits(mockCanvasId, mockUserId)
      );

      // Add shape to active edits
      const mockActiveEdits = new Map<string, ActiveEdit>([
        [
          mockShapeId,
          {
            userId: 'user-999',
            userName: 'Bob Jones',
            color: '#EF4444',
            startedAt: new Date(),
            expiresAt: new Date(Date.now() + 30000),
          },
        ],
      ]);

      subscriptionCallback?.(mockActiveEdits);

      await waitFor(() => {
        expect(result.current.isShapeBeingEdited(mockShapeId)).toBe(true);
      });
    });

    it('returns false when shape is not in active edits', () => {
      vi.mocked(activeEditsService.setActiveEdit).mockResolvedValue();
      vi.mocked(activeEditsService.clearActiveEdit).mockResolvedValue();
      vi.mocked(activeEditsService.subscribeToActiveEdits).mockReturnValue(
        vi.fn()
      );

      const { result } = renderHook(() =>
        useActiveEdits(mockCanvasId, mockUserId)
      );

      expect(result.current.isShapeBeingEdited(mockShapeId)).toBe(false);
    });
  });

  describe('getShapeEditor', () => {
    it('returns editor info when shape is being edited', async () => {
      let subscriptionCallback: ((edits: Map<string, ActiveEdit>) => void) | null =
        null;

      vi.mocked(activeEditsService.subscribeToActiveEdits).mockImplementation(
        (canvasId, callback) => {
          subscriptionCallback = callback;
          return vi.fn();
        }
      );

      const { result } = renderHook(() =>
        useActiveEdits(mockCanvasId, mockUserId)
      );

      const mockActiveEdit: ActiveEdit = {
        userId: 'user-999',
        userName: 'Bob Jones',
        color: '#EF4444',
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 30000),
      };

      const mockActiveEdits = new Map<string, ActiveEdit>([
        [mockShapeId, mockActiveEdit],
      ]);

      subscriptionCallback?.(mockActiveEdits);

      await waitFor(() => {
        const editor = result.current.getShapeEditor(mockShapeId);
        expect(editor).toBeDefined();
        expect(editor?.userId).toBe('user-999');
        expect(editor?.userName).toBe('Bob Jones');
        expect(editor?.color).toBe('#EF4444');
      });
    });

    it('returns undefined when shape is not being edited', () => {
      vi.mocked(activeEditsService.setActiveEdit).mockResolvedValue();
      vi.mocked(activeEditsService.clearActiveEdit).mockResolvedValue();
      vi.mocked(activeEditsService.subscribeToActiveEdits).mockReturnValue(
        vi.fn()
      );

      const { result } = renderHook(() =>
        useActiveEdits(mockCanvasId, mockUserId)
      );

      expect(result.current.getShapeEditor(mockShapeId)).toBeUndefined();
    });
  });

  describe('isCurrentUserEditing', () => {
    it('returns true when current user is editing the shape', async () => {
      let subscriptionCallback: ((edits: Map<string, ActiveEdit>) => void) | null =
        null;

      vi.mocked(activeEditsService.subscribeToActiveEdits).mockImplementation(
        (canvasId, callback) => {
          subscriptionCallback = callback;
          return vi.fn();
        }
      );

      const { result } = renderHook(() =>
        useActiveEdits(mockCanvasId, mockUserId)
      );

      // Add shape being edited by current user
      const mockActiveEdits = new Map<string, ActiveEdit>([
        [
          mockShapeId,
          {
            userId: mockUserId, // Same as current user
            userName: mockUserName,
            color: mockColor,
            startedAt: new Date(),
            expiresAt: new Date(Date.now() + 30000),
          },
        ],
      ]);

      subscriptionCallback?.(mockActiveEdits);

      await waitFor(() => {
        expect(result.current.isCurrentUserEditing(mockShapeId)).toBe(true);
      });
    });

    it('returns false when another user is editing the shape', async () => {
      let subscriptionCallback: ((edits: Map<string, ActiveEdit>) => void) | null =
        null;

      vi.mocked(activeEditsService.subscribeToActiveEdits).mockImplementation(
        (canvasId, callback) => {
          subscriptionCallback = callback;
          return vi.fn();
        }
      );

      const { result } = renderHook(() =>
        useActiveEdits(mockCanvasId, mockUserId)
      );

      // Add shape being edited by different user
      const mockActiveEdits = new Map<string, ActiveEdit>([
        [
          mockShapeId,
          {
            userId: 'different-user-id',
            userName: 'Bob Jones',
            color: '#EF4444',
            startedAt: new Date(),
            expiresAt: new Date(Date.now() + 30000),
          },
        ],
      ]);

      subscriptionCallback?.(mockActiveEdits);

      await waitFor(() => {
        expect(result.current.isCurrentUserEditing(mockShapeId)).toBe(false);
      });
    });

    it('returns false when shape is not being edited', () => {
      vi.mocked(activeEditsService.setActiveEdit).mockResolvedValue();
      vi.mocked(activeEditsService.clearActiveEdit).mockResolvedValue();
      vi.mocked(activeEditsService.subscribeToActiveEdits).mockReturnValue(
        vi.fn()
      );

      const { result } = renderHook(() =>
        useActiveEdits(mockCanvasId, mockUserId)
      );

      expect(result.current.isCurrentUserEditing(mockShapeId)).toBe(false);
    });
  });

  describe('Cleanup on Unmount', () => {
    it('clears all active edits for current user on unmount', async () => {
      vi.mocked(activeEditsService.setActiveEdit).mockResolvedValue();
      vi.mocked(activeEditsService.clearActiveEdit).mockResolvedValue();
      vi.mocked(activeEditsService.subscribeToActiveEdits).mockReturnValue(
        vi.fn()
      );

      const { result, unmount } = renderHook(() =>
        useActiveEdits(mockCanvasId, mockUserId)
      );

      // User starts editing two shapes
      await result.current.setShapeEditing('shape-1', mockUserName, mockColor);
      await result.current.setShapeEditing('shape-2', mockUserName, mockColor);

      // Unmount the hook
      unmount();

      // Wait for async cleanup
      await waitFor(() => {
        // Should have cleared both shapes
        expect(activeEditsService.clearActiveEdit).toHaveBeenCalledWith(
          mockCanvasId,
          'shape-1'
        );
        expect(activeEditsService.clearActiveEdit).toHaveBeenCalledWith(
          mockCanvasId,
          'shape-2'
        );
      });
    });

    it('handles cleanup errors gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const mockError = new Error('Cleanup failed');

      vi.mocked(activeEditsService.setActiveEdit).mockResolvedValue();
      vi.mocked(activeEditsService.clearActiveEdit).mockRejectedValue(
        mockError
      );
      vi.mocked(activeEditsService.subscribeToActiveEdits).mockReturnValue(
        vi.fn()
      );

      const { result, unmount } = renderHook(() =>
        useActiveEdits(mockCanvasId, mockUserId)
      );

      // User starts editing
      await result.current.setShapeEditing(mockShapeId, mockUserName, mockColor);

      // Unmount (should not throw)
      unmount();

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error clearing active edit on unmount:',
          mockError
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('does not clear shapes that were already manually cleared', async () => {
      vi.mocked(activeEditsService.setActiveEdit).mockResolvedValue();
      vi.mocked(activeEditsService.clearActiveEdit).mockResolvedValue();
      vi.mocked(activeEditsService.subscribeToActiveEdits).mockReturnValue(
        vi.fn()
      );

      const { result, unmount } = renderHook(() =>
        useActiveEdits(mockCanvasId, mockUserId)
      );

      // User starts editing
      await result.current.setShapeEditing(mockShapeId, mockUserName, mockColor);

      // Clear the service mock to reset call counts
      vi.mocked(activeEditsService.clearActiveEdit).mockClear();

      // User manually clears the shape
      await result.current.clearShapeEditing(mockShapeId);

      // Verify manual clear was called
      expect(activeEditsService.clearActiveEdit).toHaveBeenCalledTimes(1);

      // Clear again to reset
      vi.mocked(activeEditsService.clearActiveEdit).mockClear();

      // Unmount
      unmount();

      // Should NOT call clear again for this shape
      await waitFor(
        () => {
          expect(activeEditsService.clearActiveEdit).not.toHaveBeenCalled();
        },
        { timeout: 500 }
      );
    });
  });

  describe('Callback Stability', () => {
    it('maintains callback identity across re-renders when dependencies unchanged', () => {
      vi.mocked(activeEditsService.setActiveEdit).mockResolvedValue();
      vi.mocked(activeEditsService.clearActiveEdit).mockResolvedValue();
      vi.mocked(activeEditsService.subscribeToActiveEdits).mockReturnValue(
        vi.fn()
      );

      const { result, rerender } = renderHook(() =>
        useActiveEdits(mockCanvasId, mockUserId)
      );

      const firstCallbacks = {
        setShapeEditing: result.current.setShapeEditing,
        clearShapeEditing: result.current.clearShapeEditing,
        isShapeBeingEdited: result.current.isShapeBeingEdited,
        getShapeEditor: result.current.getShapeEditor,
        isCurrentUserEditing: result.current.isCurrentUserEditing,
      };

      // Re-render with same props
      rerender();

      expect(result.current.setShapeEditing).toBe(firstCallbacks.setShapeEditing);
      expect(result.current.clearShapeEditing).toBe(
        firstCallbacks.clearShapeEditing
      );
      expect(result.current.isShapeBeingEdited).toBe(
        firstCallbacks.isShapeBeingEdited
      );
      expect(result.current.getShapeEditor).toBe(firstCallbacks.getShapeEditor);
      expect(result.current.isCurrentUserEditing).toBe(
        firstCallbacks.isCurrentUserEditing
      );
    });
  });
});

