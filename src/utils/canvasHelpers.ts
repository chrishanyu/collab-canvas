/**
 * Canvas Helper Utilities
 * Utility functions for canvas coordinate calculations, zoom constraints, and ID generation
 */

import Konva from 'konva';
import { MIN_ZOOM, MAX_ZOOM } from './constants';

/**
 * Get the absolute pointer position on the stage
 * @param stage - Konva Stage instance
 * @returns Object with x and y coordinates, or null if no pointer position
 */
export const getPointerPosition = (stage: Konva.Stage): { x: number; y: number } | null => {
  return stage.getPointerPosition();
};

/**
 * Get the pointer position relative to the canvas (accounting for pan and zoom)
 * This converts screen coordinates to canvas coordinates
 * @param stage - Konva Stage instance
 * @returns Object with x and y coordinates relative to canvas, or null if no pointer position
 */
export const getRelativePointerPosition = (stage: Konva.Stage): { x: number; y: number } | null => {
  const pointerPosition = stage.getPointerPosition();
  
  if (!pointerPosition) {
    return null;
  }

  const transform = stage.getAbsoluteTransform().copy();
  // Invert the transform to get canvas coordinates from screen coordinates
  transform.invert();
  
  return transform.point(pointerPosition);
};

/**
 * Constrain zoom value to stay within defined min/max bounds
 * @param zoom - The zoom value to constrain
 * @returns Constrained zoom value between MIN_ZOOM and MAX_ZOOM
 */
export const constrainZoom = (zoom: number): number => {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
};

/**
 * Generate a unique ID for canvas objects
 * Uses timestamp and random string for uniqueness
 * @returns Unique string ID
 */
export const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

