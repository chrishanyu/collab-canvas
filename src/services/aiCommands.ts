/**
 * AI Command Execution Service
 * 
 * Executes function calls returned by the AI service
 * Uses existing canvas services for all operations
 */

import { createShape, updateShape, deleteShape, getCanvasObjects } from './canvasObjects.service';
import type { CanvasObject, ShapeType } from '../types';
import type { FunctionCall, ExecutionResult } from '../types/ai';

/**
 * Color mapping for common color names
 */
const COLOR_MAP: Record<string, string> = {
  red: '#FF0000',
  blue: '#0000FF',
  green: '#00FF00',
  yellow: '#FFFF00',
  orange: '#FFA500',
  purple: '#800080',
  pink: '#FFC0CB',
  black: '#000000',
  white: '#FFFFFF',
  gray: '#808080',
  grey: '#808080',
  brown: '#A52A2A',
};

/**
 * Normalize color input (convert color names to hex codes)
 */
function normalizeColor(color: string): string {
  const normalized = color.toLowerCase().trim();
  return COLOR_MAP[normalized] || color;
}

/**
 * Execute a single AI function call
 */
export async function executeFunctionCall(
  functionCall: FunctionCall,
  canvasId: string,
  userId: string,
  _userName: string
): Promise<ExecutionResult> {
  try {
    switch (functionCall.name) {
      // Creation commands
      case 'createShape':
        return await executeCreateShape(functionCall.arguments, canvasId, userId);
      
      // Manipulation commands
      case 'moveShape':
        return await executeMoveShape(functionCall.arguments, canvasId, userId);
      
      case 'resizeShape':
        return await executeResizeShape(functionCall.arguments, canvasId, userId);
      
      case 'rotateShape':
        return await executeRotateShape(functionCall.arguments, canvasId, userId);
      
      case 'updateShapeColor':
        return await executeUpdateShapeColor(functionCall.arguments, canvasId, userId);
      
      case 'deleteShape':
        return await executeDeleteShape(functionCall.arguments, canvasId, userId);
      
      // Layout commands
      case 'arrangeHorizontally':
        return await executeArrangeHorizontally(functionCall.arguments, canvasId, userId);
      
      case 'arrangeVertically':
        return await executeArrangeVertically(functionCall.arguments, canvasId, userId);
      
      case 'createGrid':
        return await executeCreateGrid(functionCall.arguments, canvasId, userId);
      
      case 'distributeEvenly':
        return await executeDistributeEvenly(functionCall.arguments, canvasId, userId);
      
      // Query commands
      case 'getCanvasState':
        return await executeGetCanvasState(canvasId);
      
      case 'getShapesByColor':
        return await executeGetShapesByColor(functionCall.arguments, canvasId);
      
      case 'getShapesByType':
        return await executeGetShapesByType(functionCall.arguments, canvasId);
      
      case 'getSelectedShapes':
        return await executeGetSelectedShapes(functionCall.arguments, canvasId);
      
      case 'getRecentShapes':
        return await executeGetRecentShapes(functionCall.arguments, canvasId);
      
      default:
        return {
          success: false,
          error: `Unknown function: ${functionCall.name}`,
        };
    }
  } catch (error: any) {
    console.error(`Error executing ${functionCall.name}:`, error);
    return {
      success: false,
      error: error.message || 'Command execution failed',
    };
  }
}

/**
 * Execute multiple AI function calls in sequence
 */
export async function executeFunctionCalls(
  functionCalls: FunctionCall[],
  canvasId: string,
  userId: string,
  userName: string
): Promise<ExecutionResult> {
  const shapeIds: string[] = [];
  let lastError: string | undefined;

  for (const functionCall of functionCalls) {
    const result = await executeFunctionCall(functionCall, canvasId, userId, userName);
    
    if (result.success) {
      if (result.shapeIds) {
        shapeIds.push(...result.shapeIds);
      }
    } else {
      // Log error but continue executing (partial success is acceptable)
      console.warn(`Function call failed: ${functionCall.name}`, result.error);
      lastError = result.error;
    }
  }

  // If we created some shapes but had errors, still report success
  if (shapeIds.length > 0) {
    return {
      success: true,
      shapeIds,
      error: lastError ? `Partial success: ${lastError}` : undefined,
    };
  }

  // If we had errors and no shapes created, report failure
  if (lastError) {
    return {
      success: false,
      error: lastError,
    };
  }

  // All functions executed successfully (but didn't create shapes)
  return {
    success: true,
    shapeIds: [],
  };
}

/**
 * Execute createShape function call
 */
async function executeCreateShape(
  args: Record<string, any>,
  canvasId: string,
  userId: string
): Promise<ExecutionResult> {
  const { type, x, y, width, height, color, text } = args;

  // Validate required arguments
  if (!type || !['rectangle', 'circle', 'text'].includes(type)) {
    return {
      success: false,
      error: 'Invalid or missing shape type',
    };
  }

  if (typeof x !== 'number' || typeof y !== 'number') {
    return {
      success: false,
      error: 'Invalid or missing coordinates',
    };
  }

  if (typeof width !== 'number' || typeof height !== 'number') {
    return {
      success: false,
      error: 'Invalid or missing dimensions',
    };
  }

  if (!color) {
    return {
      success: false,
      error: 'Missing color',
    };
  }

  // Normalize color (convert color names to hex)
  const normalizedColor = normalizeColor(color);

  // For text shapes, validate text content
  if (type === 'text' && !text) {
    return {
      success: false,
      error: 'Text content is required for text shapes',
    };
  }

  // Create shape using existing canvas service
  try {
    const shape: Omit<CanvasObject, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'lastEditedBy'> = {
      type: type as ShapeType,
      x,
      y,
      width,
      height,
      fill: normalizedColor,
      createdBy: userId,
      ...(type === 'text' && text ? { text } : {}),
    };

    const createdShape = await createShape(canvasId, shape);

    return {
      success: true,
      shapeIds: [createdShape.id],
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to create shape',
    };
  }
}

/**
 * Execute moveShape function call
 */
async function executeMoveShape(
  args: Record<string, any>,
  canvasId: string,
  userId: string
): Promise<ExecutionResult> {
  const { shapeId, x, y } = args;

  // Validate required arguments
  if (!shapeId || typeof shapeId !== 'string') {
    return {
      success: false,
      error: 'Invalid or missing shapeId',
    };
  }

  if (typeof x !== 'number' || typeof y !== 'number') {
    return {
      success: false,
      error: 'Invalid or missing coordinates',
    };
  }

  // Update shape using existing canvas service
  try {
    await updateShape(canvasId, shapeId, { x, y }, userId);

    return {
      success: true,
      shapeIds: [shapeId],
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to move shape',
    };
  }
}

/**
 * Execute getCanvasState function call
 * Returns current canvas state for AI context
 */
async function executeGetCanvasState(canvasId: string): Promise<ExecutionResult> {
  try {
    // Fetch canvas objects but don't need to return them to the UI
    // This function is used by AI to get context, the data is already in memory
    await getCanvasObjects(canvasId);

    // Note: This function is used for AI context, not user-facing
    // Success but no shapes created
    return {
      success: true,
      shapeIds: [],
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to get canvas state',
    };
  }
}

// ==================== MANIPULATION COMMANDS ====================

/**
 * Execute resizeShape function call
 */
async function executeResizeShape(
  args: Record<string, any>,
  canvasId: string,
  userId: string
): Promise<ExecutionResult> {
  const { shapeId, width, height } = args;

  // Validate required arguments
  if (!shapeId || typeof shapeId !== 'string') {
    return {
      success: false,
      error: 'Invalid or missing shapeId',
    };
  }

  if (typeof width !== 'number' || typeof height !== 'number') {
    return {
      success: false,
      error: 'Invalid or missing dimensions',
    };
  }

  if (width <= 0 || height <= 0) {
    return {
      success: false,
      error: 'Width and height must be positive numbers',
    };
  }

  // Update shape using existing canvas service
  try {
    await updateShape(canvasId, shapeId, { width, height }, userId);

    return {
      success: true,
      shapeIds: [shapeId],
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to resize shape',
    };
  }
}

/**
 * Execute rotateShape function call
 */
async function executeRotateShape(
  args: Record<string, any>,
  canvasId: string,
  userId: string
): Promise<ExecutionResult> {
  const { shapeId, degrees } = args;

  // Validate required arguments
  if (!shapeId || typeof shapeId !== 'string') {
    return {
      success: false,
      error: 'Invalid or missing shapeId',
    };
  }

  if (typeof degrees !== 'number') {
    return {
      success: false,
      error: 'Invalid or missing rotation degrees',
    };
  }

  // Normalize degrees to 0-360 range
  const normalizedDegrees = ((degrees % 360) + 360) % 360;

  // Update shape using existing canvas service
  try {
    await updateShape(canvasId, shapeId, { rotation: normalizedDegrees }, userId);

    return {
      success: true,
      shapeIds: [shapeId],
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to rotate shape',
    };
  }
}

/**
 * Execute updateShapeColor function call
 */
async function executeUpdateShapeColor(
  args: Record<string, any>,
  canvasId: string,
  userId: string
): Promise<ExecutionResult> {
  const { shapeId, color } = args;

  // Validate required arguments
  if (!shapeId || typeof shapeId !== 'string') {
    return {
      success: false,
      error: 'Invalid or missing shapeId',
    };
  }

  if (!color) {
    return {
      success: false,
      error: 'Missing color',
    };
  }

  // Normalize color (convert color names to hex)
  const normalizedColor = normalizeColor(color);

  // Update shape using existing canvas service
  try {
    await updateShape(canvasId, shapeId, { fill: normalizedColor }, userId);

    return {
      success: true,
      shapeIds: [shapeId],
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to update shape color',
    };
  }
}

/**
 * Execute deleteShape function call
 */
async function executeDeleteShape(
  args: Record<string, any>,
  canvasId: string,
  _userId: string
): Promise<ExecutionResult> {
  const { shapeId } = args;

  // Validate required arguments
  if (!shapeId || typeof shapeId !== 'string') {
    return {
      success: false,
      error: 'Invalid or missing shapeId',
    };
  }

  // Delete shape using existing canvas service
  try {
    await deleteShape(canvasId, shapeId);

    return {
      success: true,
      shapeIds: [shapeId],
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to delete shape',
    };
  }
}

// ==================== LAYOUT COMMANDS ====================

/**
 * Execute arrangeHorizontally function call
 */
async function executeArrangeHorizontally(
  args: Record<string, any>,
  canvasId: string,
  userId: string
): Promise<ExecutionResult> {
  const { shapeIds, spacing = 20, startX = 0, startY = 0 } = args;

  // Validate required arguments
  if (!Array.isArray(shapeIds) || shapeIds.length === 0) {
    return {
      success: false,
      error: 'Invalid or missing shapeIds array',
    };
  }

  // Get all shapes to calculate dimensions
  try {
    const allShapes = await getCanvasObjects(canvasId);
    const shapesToArrange = allShapes.filter(shape => shapeIds.includes(shape.id));

    if (shapesToArrange.length === 0) {
      return {
        success: false,
        error: 'No shapes found with provided IDs',
      };
    }

    // Calculate positions
    let currentX = startX;

    // Update each shape position
    for (const shape of shapesToArrange) {
      await updateShape(canvasId, shape.id, { x: currentX, y: startY }, userId);
      currentX += shape.width + spacing;
    }

    return {
      success: true,
      shapeIds,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to arrange shapes horizontally',
    };
  }
}

/**
 * Execute arrangeVertically function call
 */
async function executeArrangeVertically(
  args: Record<string, any>,
  canvasId: string,
  userId: string
): Promise<ExecutionResult> {
  const { shapeIds, spacing = 20, startX = 0, startY = 0 } = args;

  // Validate required arguments
  if (!Array.isArray(shapeIds) || shapeIds.length === 0) {
    return {
      success: false,
      error: 'Invalid or missing shapeIds array',
    };
  }

  // Get all shapes to calculate dimensions
  try {
    const allShapes = await getCanvasObjects(canvasId);
    const shapesToArrange = allShapes.filter(shape => shapeIds.includes(shape.id));

    if (shapesToArrange.length === 0) {
      return {
        success: false,
        error: 'No shapes found with provided IDs',
      };
    }

    // Calculate positions
    let currentY = startY;

    // Update each shape position
    for (const shape of shapesToArrange) {
      await updateShape(canvasId, shape.id, { x: startX, y: currentY }, userId);
      currentY += shape.height + spacing;
    }

    return {
      success: true,
      shapeIds,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to arrange shapes vertically',
    };
  }
}

/**
 * Execute createGrid function call
 * Creates multiple shapes in a grid pattern
 */
async function executeCreateGrid(
  args: Record<string, any>,
  canvasId: string,
  userId: string
): Promise<ExecutionResult> {
  const { rows, cols, shapeType, size = 50, spacing = 20, color = 'blue' } = args;

  // Validate required arguments
  if (typeof rows !== 'number' || typeof cols !== 'number') {
    return {
      success: false,
      error: 'Invalid or missing rows/cols',
    };
  }

  if (rows <= 0 || cols <= 0) {
    return {
      success: false,
      error: 'Rows and cols must be positive numbers',
    };
  }

  if (!shapeType || !['rectangle', 'circle'].includes(shapeType)) {
    return {
      success: false,
      error: 'Invalid shape type (must be rectangle or circle)',
    };
  }

  // Limit grid size to prevent abuse
  const totalShapes = rows * cols;
  if (totalShapes > 100) {
    return {
      success: false,
      error: 'Grid too large (maximum 100 shapes)',
    };
  }

  // Normalize color
  const normalizedColor = normalizeColor(color);

  // Calculate starting position (center the grid)
  const totalWidth = cols * size + (cols - 1) * spacing;
  const totalHeight = rows * size + (rows - 1) * spacing;
  const startX = -totalWidth / 2;
  const startY = -totalHeight / 2;

  // Create all shapes
  const createdIds: string[] = [];

  try {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * (size + spacing);
        const y = startY + row * (size + spacing);

        const shape: Omit<CanvasObject, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'lastEditedBy'> = {
          type: shapeType as ShapeType,
          x,
          y,
          width: size,
          height: size,
          fill: normalizedColor,
          createdBy: userId,
        };

        const createdShape = await createShape(canvasId, shape);
        createdIds.push(createdShape.id);
      }
    }

    return {
      success: true,
      shapeIds: createdIds,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to create grid',
    };
  }
}

/**
 * Execute distributeEvenly function call
 */
async function executeDistributeEvenly(
  args: Record<string, any>,
  canvasId: string,
  userId: string
): Promise<ExecutionResult> {
  const { shapeIds, direction } = args;

  // Validate required arguments
  if (!Array.isArray(shapeIds) || shapeIds.length < 2) {
    return {
      success: false,
      error: 'Need at least 2 shapes to distribute',
    };
  }

  if (!direction || !['horizontal', 'vertical'].includes(direction)) {
    return {
      success: false,
      error: 'Invalid direction (must be horizontal or vertical)',
    };
  }

  // Get all shapes
  try {
    const allShapes = await getCanvasObjects(canvasId);
    const shapesToDistribute = allShapes.filter(shape => shapeIds.includes(shape.id));

    if (shapesToDistribute.length < 2) {
      return {
        success: false,
        error: 'Not enough shapes found with provided IDs',
      };
    }

    // Sort shapes by position
    if (direction === 'horizontal') {
      shapesToDistribute.sort((a, b) => a.x - b.x);
      
      // Find leftmost and rightmost positions
      const first = shapesToDistribute[0];
      const last = shapesToDistribute[shapesToDistribute.length - 1];
      const totalSpace = last.x - first.x;
      const gap = totalSpace / (shapesToDistribute.length - 1);

      // Update positions
      for (let i = 1; i < shapesToDistribute.length - 1; i++) {
        const newX = first.x + gap * i;
        await updateShape(canvasId, shapesToDistribute[i].id, { x: newX }, userId);
      }
    } else {
      shapesToDistribute.sort((a, b) => a.y - b.y);
      
      // Find topmost and bottommost positions
      const first = shapesToDistribute[0];
      const last = shapesToDistribute[shapesToDistribute.length - 1];
      const totalSpace = last.y - first.y;
      const gap = totalSpace / (shapesToDistribute.length - 1);

      // Update positions
      for (let i = 1; i < shapesToDistribute.length - 1; i++) {
        const newY = first.y + gap * i;
        await updateShape(canvasId, shapesToDistribute[i].id, { y: newY }, userId);
      }
    }

    return {
      success: true,
      shapeIds,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to distribute shapes evenly',
    };
  }
}

// ==================== QUERY COMMANDS ====================

/**
 * Execute getShapesByColor function call
 */
async function executeGetShapesByColor(
  args: Record<string, any>,
  canvasId: string
): Promise<ExecutionResult> {
  const { color } = args;

  if (!color) {
    return {
      success: false,
      error: 'Missing color',
    };
  }

  try {
    const allShapes = await getCanvasObjects(canvasId);
    const normalizedColor = normalizeColor(color);
    
    const matchingShapes = allShapes.filter(shape => 
      shape.fill?.toLowerCase() === normalizedColor.toLowerCase()
    );

    return {
      success: true,
      shapeIds: matchingShapes.map(s => s.id),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to get shapes by color',
    };
  }
}

/**
 * Execute getShapesByType function call
 */
async function executeGetShapesByType(
  args: Record<string, any>,
  canvasId: string
): Promise<ExecutionResult> {
  const { type } = args;

  if (!type || !['rectangle', 'circle', 'text'].includes(type)) {
    return {
      success: false,
      error: 'Invalid or missing shape type',
    };
  }

  try {
    const allShapes = await getCanvasObjects(canvasId);
    const matchingShapes = allShapes.filter(shape => shape.type === type);

    return {
      success: true,
      shapeIds: matchingShapes.map(s => s.id),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to get shapes by type',
    };
  }
}

/**
 * Execute getSelectedShapes function call
 * Note: This requires canvas state to be passed in the request
 */
async function executeGetSelectedShapes(
  args: Record<string, any>,
  _canvasId: string
): Promise<ExecutionResult> {
  try {
    // In a real implementation, selected shapes would come from canvas state
    // For now, we'll return empty as this requires frontend state integration
    const selectedShapeIds = args.selectedShapeIds || [];

    return {
      success: true,
      shapeIds: selectedShapeIds,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to get selected shapes',
    };
  }
}

/**
 * Execute getRecentShapes function call
 */
async function executeGetRecentShapes(
  args: Record<string, any>,
  canvasId: string
): Promise<ExecutionResult> {
  const { count = 5 } = args;

  if (typeof count !== 'number' || count <= 0) {
    return {
      success: false,
      error: 'Invalid count (must be positive number)',
    };
  }

  try {
    const allShapes = await getCanvasObjects(canvasId);
    
    // Sort by creation date (newest first) and take the count
    const recentShapes = allShapes
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, count);

    return {
      success: true,
      shapeIds: recentShapes.map(s => s.id),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to get recent shapes',
    };
  }
}

