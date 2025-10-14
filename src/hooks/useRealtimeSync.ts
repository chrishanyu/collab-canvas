import { useEffect, useRef } from 'react';
import { subscribeToCanvasObjects } from '../services/canvasObjects.service';
import type { CanvasObject } from '../types';

/**
 * Custom hook for real-time synchronization of canvas objects
 * Subscribes to Firestore changes for a specific canvas and updates local state
 * 
 * @param canvasId - The canvas ID to subscribe to
 * @param onShapesUpdate - Callback function to update shapes when Firestore changes
 * @returns Object with sync status and error handling
 */
export function useRealtimeSync(
  canvasId: string | undefined,
  onShapesUpdate: (shapes: CanvasObject[]) => void
) {
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Skip if no canvasId
    if (!canvasId) {
      return;
    }

    console.log(`[useRealtimeSync] Subscribing to canvas: ${canvasId}`);

    // Subscribe to real-time updates for this canvas
    const unsubscribe = subscribeToCanvasObjects(canvasId, (shapes) => {
      console.log(`[useRealtimeSync] Received ${shapes.length} shapes from canvas ${canvasId}`);
      onShapesUpdate(shapes);
    });

    // Store unsubscribe function
    unsubscribeRef.current = unsubscribe;

    // Cleanup: unsubscribe when canvasId changes or component unmounts
    return () => {
      console.log(`[useRealtimeSync] Unsubscribing from canvas: ${canvasId}`);
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [canvasId, onShapesUpdate]);

  return {
    // Can add additional status tracking here in the future if needed
    // e.g., isConnected, lastSyncTime, error, etc.
  };
}

