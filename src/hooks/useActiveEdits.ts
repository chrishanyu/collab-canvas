import { useState, useEffect, useCallback, useRef } from 'react';
import type { ActiveEdit } from '../services/activeEdits.service';
import {
  subscribeToActiveEdits,
  setActiveEdit as setActiveEditService,
  clearActiveEdit as clearActiveEditService,
} from '../services/activeEdits.service';

/**
 * Hook for managing active edit indicators on a canvas.
 * Tracks which shapes are currently being edited by which users.
 *
 * @param canvasId - The canvas ID to monitor
 * @param currentUserId - The current user's ID
 * @returns Object with active edits state and control functions
 *
 * @example
 * ```tsx
 * const {
 *   activeEdits,
 *   setShapeEditing,
 *   clearShapeEditing,
 *   isShapeBeingEdited,
 *   getShapeEditor
 * } = useActiveEdits('canvas-123', 'user-456');
 *
 * // When user starts dragging
 * setShapeEditing('shape-789', 'Alice', '#3B82F6');
 *
 * // Check if shape is being edited
 * if (isShapeBeingEdited('shape-789')) {
 *   console.log('Someone is editing this shape!');
 * }
 *
 * // When user stops dragging
 * clearShapeEditing('shape-789');
 * ```
 */
export function useActiveEdits(canvasId: string, currentUserId: string) {
  const [activeEdits, setActiveEdits] = useState<Map<string, ActiveEdit>>(
    new Map()
  );

  // Track shapes this user is currently editing for cleanup
  const userEditingShapesRef = useRef<Set<string>>(new Set());

  /**
   * Subscribe to active edits for this canvas
   */
  useEffect(() => {
    if (!canvasId) return;

    const unsubscribe = subscribeToActiveEdits(canvasId, (edits) => {
      setActiveEdits(edits);
    });

    return () => {
      unsubscribe();
    };
  }, [canvasId]);

  /**
   * Cleanup all active edits for current user on unmount
   */
  useEffect(() => {
    return () => {
      // Clear all shapes this user was editing
      const shapesToClear = Array.from(userEditingShapesRef.current);
      shapesToClear.forEach((shapeId) => {
        clearActiveEditService(canvasId, shapeId).catch((error) => {
          console.error('Error clearing active edit on unmount:', error);
        });
      });
      userEditingShapesRef.current.clear();
    };
  }, [canvasId]);

  /**
   * Mark a shape as being edited by the current user.
   * Called when user starts dragging or editing a shape.
   *
   * @param shapeId - The shape ID being edited
   * @param userName - The current user's display name
   * @param color - The current user's cursor color
   */
  const setShapeEditing = useCallback(
    async (shapeId: string, userName: string, color: string) => {
      try {
        await setActiveEditService(
          canvasId,
          shapeId,
          currentUserId,
          userName,
          color
        );
        // Track that this user is editing this shape
        userEditingShapesRef.current.add(shapeId);
      } catch (error) {
        console.error('Error setting shape editing:', error);
      }
    },
    [canvasId, currentUserId]
  );

  /**
   * Clear the active edit indicator for a shape.
   * Called when user stops dragging or editing a shape.
   *
   * @param shapeId - The shape ID to clear
   */
  const clearShapeEditing = useCallback(
    async (shapeId: string) => {
      try {
        await clearActiveEditService(canvasId, shapeId);
        // Remove from tracking
        userEditingShapesRef.current.delete(shapeId);
      } catch (error) {
        console.error('Error clearing shape editing:', error);
      }
    },
    [canvasId]
  );

  /**
   * Check if a shape is currently being edited by anyone.
   *
   * @param shapeId - The shape ID to check
   * @returns True if the shape is being edited
   */
  const isShapeBeingEdited = useCallback(
    (shapeId: string): boolean => {
      return activeEdits.has(shapeId);
    },
    [activeEdits]
  );

  /**
   * Get the editor information for a shape.
   *
   * @param shapeId - The shape ID to check
   * @returns ActiveEdit object if shape is being edited, undefined otherwise
   */
  const getShapeEditor = useCallback(
    (shapeId: string): ActiveEdit | undefined => {
      return activeEdits.get(shapeId);
    },
    [activeEdits]
  );

  /**
   * Check if the current user is editing a specific shape.
   *
   * @param shapeId - The shape ID to check
   * @returns True if current user is editing this shape
   */
  const isCurrentUserEditing = useCallback(
    (shapeId: string): boolean => {
      const editor = activeEdits.get(shapeId);
      return editor?.userId === currentUserId;
    },
    [activeEdits, currentUserId]
  );

  return {
    activeEdits,
    setShapeEditing,
    clearShapeEditing,
    isShapeBeingEdited,
    getShapeEditor,
    isCurrentUserEditing,
  };
}

