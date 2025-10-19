/**
 * Canvas Constants
 * These constants define the behavior and limits of the canvas workspace.
 * Applied to all canvases in the application.
 */

/**
 * Canvas dimensions in pixels
 * Defines a large workspace that feels spacious but is still manageable
 */
export const CANVAS_WIDTH = 10000;
export const CANVAS_HEIGHT = 10000;

/**
 * Zoom limits
 * MIN_ZOOM: Maximum zoom out level (0.1 = 10% of original size)
 * MAX_ZOOM: Maximum zoom in level (3 = 300% of original size)
 */
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 3;

/**
 * Zoom speed
 * Controls how fast zooming happens on scroll
 * Higher values = faster zoom, lower values = more granular control
 * Current: 0.05 = 5% zoom increments for smooth control
 */
export const ZOOM_SPEED = 0.05;

/**
 * Default zoom level when canvas first loads
 */
export const DEFAULT_ZOOM = 1;

/**
 * Default canvas position (where the viewport starts)
 */
export const DEFAULT_CANVAS_X = 0;
export const DEFAULT_CANVAS_Y = 0;

/**
 * Default shape styling
 * Applied to all newly created shapes for a clean, professional look
 */
export const DEFAULT_SHAPE_FILL = '#FFFFFF'; // White fill
export const DEFAULT_SHAPE_STROKE = '#1F2937'; // Gray-800 border
export const DEFAULT_SHAPE_STROKE_WIDTH = 2; // 2px border

