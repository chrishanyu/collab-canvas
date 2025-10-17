import { useState, useEffect } from 'react';
import { DEFAULT_ZOOM, DEFAULT_CANVAS_X, DEFAULT_CANVAS_Y } from '../utils/constants';

interface ViewportState {
  scale: number;
  x: number;
  y: number;
}

interface UsePersistedViewportReturn {
  stageScale: number;
  setStageScale: (scale: number) => void;
  stageX: number;
  setStageX: (x: number) => void;
  stageY: number;
  setStageY: (y: number) => void;
}

/**
 * Custom hook to persist viewport state (zoom and pan) in localStorage
 * 
 * @param canvasId - Unique canvas identifier
 * @returns Viewport state and setters
 */
export const usePersistedViewport = (canvasId: string): UsePersistedViewportReturn => {
  const STORAGE_KEY = `canvas-viewport-${canvasId}`;

  // Initialize state from localStorage or use defaults
  const [stageScale, setStageScale] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: ViewportState = JSON.parse(saved);
        return parsed.scale ?? DEFAULT_ZOOM;
      }
    } catch (error) {
      console.error('Failed to load viewport state from localStorage:', error);
    }
    return DEFAULT_ZOOM;
  });

  const [stageX, setStageX] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: ViewportState = JSON.parse(saved);
        return parsed.x ?? DEFAULT_CANVAS_X;
      }
    } catch (error) {
      console.error('Failed to load viewport state from localStorage:', error);
    }
    return DEFAULT_CANVAS_X;
  });

  const [stageY, setStageY] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: ViewportState = JSON.parse(saved);
        return parsed.y ?? DEFAULT_CANVAS_Y;
      }
    } catch (error) {
      console.error('Failed to load viewport state from localStorage:', error);
    }
    return DEFAULT_CANVAS_Y;
  });

  // Save to localStorage with debouncing (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const viewportState: ViewportState = {
          scale: stageScale,
          x: stageX,
          y: stageY,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(viewportState));
      } catch (error) {
        console.error('Failed to save viewport state to localStorage:', error);
      }
    }, 500);

    // Cleanup: clear timeout on unmount or when dependencies change
    return () => clearTimeout(timer);
  }, [stageScale, stageX, stageY, STORAGE_KEY]);

  return {
    stageScale,
    setStageScale,
    stageX,
    setStageX,
    stageY,
    setStageY,
  };
};

