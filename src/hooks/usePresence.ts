import { useEffect, useState, useRef, useCallback } from 'react';
import {
  subscribeToPresence,
  updateCursorPosition,
  setUserOnline,
  setUserOffline,
} from '../services/presence.service';
import type { UserPresence } from '../types';

/**
 * usePresence Hook
 * Manages real-time user presence for a specific canvas
 * - Tracks cursor positions with 60fps throttling
 * - Handles online/offline status
 * - Isolated per canvasId
 */
export const usePresence = (
  canvasId: string | undefined,
  userId: string | undefined,
  displayName: string | undefined
) => {
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);
  const pendingUpdateRef = useRef<{ x: number; y: number } | null>(null);
  const isOnlineRef = useRef(false);

  // Throttle interval for 60fps (16.6ms)
  const THROTTLE_MS = 1000 / 60;

  /**
   * Update cursor position (throttled to 60fps)
   */
  const updateCursor = useCallback(
    (x: number, y: number) => {
      if (!canvasId || !userId || !displayName) return;

      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateTimeRef.current;

      // If enough time has passed, update immediately
      if (timeSinceLastUpdate >= THROTTLE_MS) {
        updateCursorPosition(canvasId, userId, displayName, x, y).catch(
          (error) => {
            console.error('Failed to update cursor position:', error);
          }
        );
        lastUpdateTimeRef.current = now;
        pendingUpdateRef.current = null;

        // Clear any pending timer
        if (throttleTimerRef.current) {
          clearTimeout(throttleTimerRef.current);
          throttleTimerRef.current = null;
        }
      } else {
        // Store pending update and schedule it
        pendingUpdateRef.current = { x, y };

        // Clear existing timer if any
        if (throttleTimerRef.current) {
          clearTimeout(throttleTimerRef.current);
        }

        // Schedule the pending update
        throttleTimerRef.current = setTimeout(() => {
          if (pendingUpdateRef.current && canvasId && userId && displayName) {
            const { x: pendingX, y: pendingY } = pendingUpdateRef.current;
            updateCursorPosition(
              canvasId,
              userId,
              displayName,
              pendingX,
              pendingY
            ).catch((error) => {
              console.error('Failed to update cursor position:', error);
            });
            lastUpdateTimeRef.current = Date.now();
            pendingUpdateRef.current = null;
          }
          throttleTimerRef.current = null;
        }, THROTTLE_MS - timeSinceLastUpdate);
      }
    },
    [canvasId, userId, displayName, THROTTLE_MS]
  );

  /**
   * Set up presence subscription and online status
   */
  useEffect(() => {
    if (!canvasId || !userId || !displayName) return;

    // Set user as online for this canvas
    setUserOnline(canvasId, userId, displayName)
      .then(() => {
        isOnlineRef.current = true;
      })
      .catch((error) => {
        console.error('Failed to set user online:', error);
      });

    // Subscribe to presence updates for this canvas
    const unsubscribe = subscribeToPresence(canvasId, (users) => {
      setOnlineUsers(users);
    });

    // Cleanup function
    return () => {
      // Unsubscribe from presence
      unsubscribe();

      // Clear throttle timer
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
        throttleTimerRef.current = null;
      }

      // Set user as offline for this canvas
      if (isOnlineRef.current) {
        setUserOffline(canvasId, userId).catch((error) => {
          console.error('Failed to set user offline:', error);
        });
      isOnlineRef.current = false;
    }
  };
}, [canvasId, userId, displayName]);

  /**
   * Handle browser close/tab close - set user offline
   */
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (canvasId && userId && isOnlineRef.current) {
        // Use sendBeacon for reliability during page unload
        // Note: This is best-effort; Firestore may not process it in time
        setUserOffline(canvasId, userId).catch(() => {
          // Silently fail - user will appear offline after timeout
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && canvasId && userId && isOnlineRef.current) {
        // User switched tabs or minimized window
        setUserOffline(canvasId, userId).catch(() => {
          // Silently fail
        });
      } else if (document.visibilityState === 'visible' && canvasId && userId && displayName) {
        // User returned - set back online
        setUserOnline(canvasId, userId, displayName).catch(() => {
          // Silently fail
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [canvasId, userId, displayName]);

  return {
    onlineUsers,
    updateCursor,
  };
};

