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

/**
 * Generate cursor color for a user
 * Current user always gets black, all others get random colors
 * @param userId - User ID
 * @param currentUserId - Current logged-in user ID
 * @returns Hex color string
 */
export const getUserCursorColor = (userId: string, currentUserId: string): string => {
  // Current user always gets black
  if (userId === currentUserId) {
    return '#000000';
  }

  // Predefined colors for other users (vibrant, distinguishable colors)
  const userColors = [
    '#EF4444', // red-500
    '#F59E0B', // amber-500
    '#10B981', // emerald-500
    '#3B82F6', // blue-500
    '#8B5CF6', // violet-500
    '#EC4899', // pink-500
    '#06B6D4', // cyan-500
    '#F97316', // orange-500
    '#14B8A6', // teal-500
    '#6366F1', // indigo-500
  ];

  // Generate deterministic but pseudo-random index from userId
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % userColors.length;

  return userColors[index];
};

/**
 * Get the maximum zIndex from an array of shapes
 * @param shapes - Array of canvas objects
 * @returns Maximum zIndex value, or 0 if no shapes
 */
export const getMaxZIndex = (shapes: Array<{ zIndex?: number }>): number => {
  if (shapes.length === 0) return 0;
  
  const zIndices = shapes.map(shape => shape.zIndex ?? 0);
  return Math.max(...zIndices);
};

/**
 * Get the minimum zIndex from an array of shapes
 * @param shapes - Array of canvas objects
 * @returns Minimum zIndex value, or 0 if no shapes
 */
export const getMinZIndex = (shapes: Array<{ zIndex?: number }>): number => {
  if (shapes.length === 0) return 0;
  
  const zIndices = shapes.map(shape => shape.zIndex ?? 0);
  return Math.min(...zIndices);
};

/**
 * Text Box Helper Functions
 * Utilities for text measurement, wrapping, and height calculation
 */

/**
 * Calculate text height based on content, width, font size, and font family
 * Uses canvas measureText API to accurately measure text dimensions
 * @param text - The text content to measure
 * @param width - Maximum width for text wrapping
 * @param fontSize - Font size in pixels
 * @param fontFamily - Font family name
 * @param lineHeight - Line height multiplier (default: 1.2)
 * @returns Height in pixels needed to display the text
 */
export const calculateTextHeight = (
  text: string,
  width: number,
  fontSize: number,
  fontFamily: string,
  lineHeight: number = 1.2
): number => {
  if (!text || text.trim() === '') {
    // Empty text - return one line height
    return fontSize * lineHeight;
  }

  // Create a temporary canvas for text measurement
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) {
    // Fallback if canvas context is not available
    const lines = text.split('\n').length;
    return lines * fontSize * lineHeight;
  }

  context.font = `${fontSize}px ${fontFamily}`;
  
  // Split text by existing newlines
  const paragraphs = text.split('\n');
  let totalLines = 0;

  // Process each paragraph separately
  paragraphs.forEach(paragraph => {
    if (paragraph.trim() === '') {
      totalLines += 1; // Empty line
      return;
    }

    // Word wrapping logic
    const words = paragraph.split(' ');
    let currentLine = '';
    let lineCount = 0;

    words.forEach((word, index) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > width && currentLine !== '') {
        // Line exceeds width, wrap to next line
        lineCount++;
        currentLine = word;
      } else {
        currentLine = testLine;
      }

      // Last word - count the current line
      if (index === words.length - 1) {
        lineCount++;
      }
    });

    totalLines += lineCount;
  });

  return totalLines * fontSize * lineHeight;
};

/**
 * Wrap text to fit within a given width
 * Returns an array of lines that fit within the width constraint
 * @param text - The text content to wrap
 * @param width - Maximum width for each line
 * @param fontSize - Font size in pixels
 * @param fontFamily - Font family name
 * @returns Array of wrapped text lines
 */
export const wrapText = (
  text: string,
  width: number,
  fontSize: number,
  fontFamily: string
): string[] => {
  if (!text || text.trim() === '') {
    return [''];
  }

  // Create a temporary canvas for text measurement
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) {
    // Fallback - return lines split by newlines
    return text.split('\n');
  }

  context.font = `${fontSize}px ${fontFamily}`;
  
  const allLines: string[] = [];
  const paragraphs = text.split('\n');

  // Process each paragraph separately
  paragraphs.forEach(paragraph => {
    if (paragraph.trim() === '') {
      allLines.push(''); // Preserve empty lines
      return;
    }

    const words = paragraph.split(' ');
    let currentLine = '';

    words.forEach((word) => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > width && currentLine !== '') {
        // Line exceeds width, wrap to next line
        allLines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    // Add remaining text
    if (currentLine) {
      allLines.push(currentLine);
    }
  });

  return allLines.length > 0 ? allLines : [''];
};

/**
 * Get text metrics for a given string
 * Returns width and height information
 * @param text - The text to measure
 * @param fontSize - Font size in pixels
 * @param fontFamily - Font family name
 * @returns Object with width and height metrics
 */
export const getTextMetrics = (
  text: string,
  fontSize: number,
  fontFamily: string
): { width: number; height: number } => {
  if (!text || text.trim() === '') {
    return { width: 0, height: fontSize };
  }

  // Create a temporary canvas for text measurement
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) {
    // Fallback estimation
    return {
      width: text.length * fontSize * 0.6, // Rough estimate
      height: fontSize
    };
  }

  context.font = `${fontSize}px ${fontFamily}`;
  const metrics = context.measureText(text);
  
  return {
    width: metrics.width,
    height: fontSize // Single line height
  };
};
