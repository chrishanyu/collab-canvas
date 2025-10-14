import { useEffect, useRef } from 'react';
import { subscribeToCanvasObjects } from '../services/canvasObjects.service';
import type { CanvasObject } from '../types';

/**
 * Custom hook for real-time synchronization of canvas objects (Performance Optimized)
 * 
 * Subscribes to Firestore changes for a specific canvas and updates local state.
 * 
 * Performance optimization: Uses a ref pattern to keep the callback stable,
 * preventing unnecessary Firebase re-subscriptions when the callback identity changes.
 * Only re-subscribes when canvasId actually changes.
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
  
  // Use ref to store the latest callback without triggering re-subscription
  // This prevents unnecessary Firebase re-subscriptions when callback identity changes
  const callbackRef = useRef(onShapesUpdate);
  
  // Keep callback ref up-to-date (runs synchronously, doesn't cause re-subscription)
  useEffect(() => {
    callbackRef.current = onShapesUpdate;
  }, [onShapesUpdate]);

  useEffect(() => {
    // Skip if no canvasId
    if (!canvasId) {
      return;
    }

    console.log(`[useRealtimeSync] Subscribing to canvas: ${canvasId}`);

    // Subscribe to real-time updates for this canvas
    // Use callbackRef.current to always call the latest callback
    const unsubscribe = subscribeToCanvasObjects(canvasId, (shapes) => {
      console.log(`[useRealtimeSync] Received ${shapes.length} shapes from canvas ${canvasId}`);
      // Call the latest callback from ref (doesn't cause re-subscription)
      callbackRef.current(shapes);
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
  }, [canvasId]); // Only re-subscribe when canvasId changes, not when callback changes

  return {
    // Can add additional status tracking here in the future if needed
    // e.g., isConnected, lastSyncTime, error, etc.
  };
}

