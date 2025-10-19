/**
 * AI Command Execution Service
 * 
 * Executes function calls returned by the AI service
 * Uses existing canvas services for all operations
 */

import { createShape, updateShape, getCanvasObjects } from './canvasObjects.service';
import { normalizeColor } from '../utils/aiPrompts';
import type { CanvasObject, ShapeType } from '../types';
import type { FunctionCall, ExecutionResult, CanvasState } from '../types/ai';

/**
 * Execute a single AI function call
 */
export async function executeFunctionCall(
  functionCall: FunctionCall,
  canvasId: string,
  userId: string,
  userName: string
): Promise<ExecutionResult> {
  try {
    switch (functionCall.name) {
      case 'createShape':
        return await executeCreateShape(functionCall.arguments, canvasId, userId);
      
      case 'moveShape':
        return await executeMoveShape(functionCall.arguments, canvasId, userId);
      
      case 'getCanvasState':
        return await executeGetCanvasState(canvasId);
      
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
    const shapes = await getCanvasObjects(canvasId);

    // Convert to simplified state for AI
    const canvasState: CanvasState = {
      shapes: shapes.map(shape => ({
        id: shape.id,
        type: shape.type,
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
        fill: shape.fill,
        text: shape.text,
      })),
    };

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

