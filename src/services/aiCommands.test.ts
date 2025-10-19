/**
 * Unit Tests for AI Command Execution Service
 * 
 * Tests function call execution, validation, and error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  executeFunctionCall,
  executeFunctionCalls,
} from './aiCommands';
import * as canvasObjectsService from './canvasObjects.service';
import type { FunctionCall } from '../types/ai';
import type { CanvasObject } from '../types';

// Mock canvas objects service
vi.mock('./canvasObjects.service', () => ({
  createShape: vi.fn(),
  updateShape: vi.fn(),
  deleteShape: vi.fn(),
  getCanvasObjects: vi.fn(),
}));

describe('AI Command Execution Service', () => {
  const mockCanvasId = 'test-canvas-id';
  const mockUserId = 'test-user-id';
  const mockUserName = 'Test User';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('executeFunctionCall', () => {
    describe('createShape', () => {
      it('should successfully create a circle shape', async () => {
        const mockShape: CanvasObject = {
          id: 'shape-123',
          type: 'circle',
          x: 100,
          y: 200,
          width: 150,
          height: 150,
          fill: '#FF0000',
          createdBy: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
          lastEditedBy: mockUserId,
        };

        vi.mocked(canvasObjectsService.createShape).mockResolvedValue(mockShape);

        const functionCall: FunctionCall = {
          name: 'createShape',
          arguments: {
            type: 'circle',
            x: 100,
            y: 200,
            width: 150,
            height: 150,
            color: '#FF0000',
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(true);
        expect(result.shapeIds).toEqual(['shape-123']);
        expect(canvasObjectsService.createShape).toHaveBeenCalledTimes(1);
        expect(canvasObjectsService.createShape).toHaveBeenCalledWith(
          mockCanvasId,
          expect.objectContaining({
            type: 'circle',
            x: 100,
            y: 200,
            width: 150,
            height: 150,
            fill: '#FF0000',
            createdBy: mockUserId,
          })
        );
      });

      it('should successfully create a rectangle shape', async () => {
        const mockShape: CanvasObject = {
          id: 'shape-456',
          type: 'rectangle',
          x: 0,
          y: 0,
          width: 200,
          height: 100,
          fill: '#0000FF',
          createdBy: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
          lastEditedBy: mockUserId,
        };

        vi.mocked(canvasObjectsService.createShape).mockResolvedValue(mockShape);

        const functionCall: FunctionCall = {
          name: 'createShape',
          arguments: {
            type: 'rectangle',
            x: 0,
            y: 0,
            width: 200,
            height: 100,
            color: 'blue',
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(true);
        expect(result.shapeIds).toEqual(['shape-456']);
        expect(canvasObjectsService.createShape).toHaveBeenCalledWith(
          mockCanvasId,
          expect.objectContaining({
            type: 'rectangle',
            fill: '#0000FF', // Color normalized from 'blue' to hex
          })
        );
      });

      it('should successfully create a text shape with text content', async () => {
        const mockShape: CanvasObject = {
          id: 'shape-789',
          type: 'text',
          x: 50,
          y: 50,
          width: 200,
          height: 40,
          fill: '#000000',
          text: 'Hello World',
          createdBy: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
          lastEditedBy: mockUserId,
        };

        vi.mocked(canvasObjectsService.createShape).mockResolvedValue(mockShape);

        const functionCall: FunctionCall = {
          name: 'createShape',
          arguments: {
            type: 'text',
            x: 50,
            y: 50,
            width: 200,
            height: 40,
            color: 'black',
            text: 'Hello World',
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(true);
        expect(result.shapeIds).toEqual(['shape-789']);
        expect(canvasObjectsService.createShape).toHaveBeenCalledWith(
          mockCanvasId,
          expect.objectContaining({
            type: 'text',
            text: 'Hello World',
            fill: '#000000',
          })
        );
      });

      it('should normalize color names to hex codes', async () => {
        const mockShape: CanvasObject = {
          id: 'shape-red',
          type: 'circle',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          fill: '#FF0000',
          createdBy: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
          lastEditedBy: mockUserId,
        };

        vi.mocked(canvasObjectsService.createShape).mockResolvedValue(mockShape);

        const functionCall: FunctionCall = {
          name: 'createShape',
          arguments: {
            type: 'circle',
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            color: 'red', // Color name
          },
        };

        await executeFunctionCall(functionCall, mockCanvasId, mockUserId, mockUserName);

        expect(canvasObjectsService.createShape).toHaveBeenCalledWith(
          mockCanvasId,
          expect.objectContaining({
            fill: '#FF0000', // Normalized to hex
          })
        );
      });

      it('should fail when type is missing or invalid', async () => {
        const functionCall: FunctionCall = {
          name: 'createShape',
          arguments: {
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            color: 'red',
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid or missing shape type');
        expect(canvasObjectsService.createShape).not.toHaveBeenCalled();
      });

      it('should fail when coordinates are missing', async () => {
        const functionCall: FunctionCall = {
          name: 'createShape',
          arguments: {
            type: 'circle',
            width: 100,
            height: 100,
            color: 'red',
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid or missing coordinates');
        expect(canvasObjectsService.createShape).not.toHaveBeenCalled();
      });

      it('should fail when dimensions are missing', async () => {
        const functionCall: FunctionCall = {
          name: 'createShape',
          arguments: {
            type: 'circle',
            x: 0,
            y: 0,
            color: 'red',
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid or missing dimensions');
        expect(canvasObjectsService.createShape).not.toHaveBeenCalled();
      });

      it('should fail when color is missing', async () => {
        const functionCall: FunctionCall = {
          name: 'createShape',
          arguments: {
            type: 'circle',
            x: 0,
            y: 0,
            width: 100,
            height: 100,
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(false);
        expect(result.error).toContain('Missing color');
        expect(canvasObjectsService.createShape).not.toHaveBeenCalled();
      });

      it('should fail when text is missing for text shape', async () => {
        const functionCall: FunctionCall = {
          name: 'createShape',
          arguments: {
            type: 'text',
            x: 0,
            y: 0,
            width: 200,
            height: 40,
            color: 'black',
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(false);
        expect(result.error).toContain('Text content is required for text shapes');
        expect(canvasObjectsService.createShape).not.toHaveBeenCalled();
      });

      it('should handle service error when creating shape', async () => {
        vi.mocked(canvasObjectsService.createShape).mockRejectedValue(
          new Error('Firebase error')
        );

        const functionCall: FunctionCall = {
          name: 'createShape',
          arguments: {
            type: 'circle',
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            color: 'red',
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(false);
        expect(result.error).toContain('Firebase error');
      });
    });

    describe('moveShape', () => {
      it('should successfully move a shape', async () => {
        vi.mocked(canvasObjectsService.updateShape).mockResolvedValue();

        const functionCall: FunctionCall = {
          name: 'moveShape',
          arguments: {
            shapeId: 'shape-123',
            x: 200,
            y: 300,
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(true);
        expect(result.shapeIds).toEqual(['shape-123']);
        expect(canvasObjectsService.updateShape).toHaveBeenCalledTimes(1);
        expect(canvasObjectsService.updateShape).toHaveBeenCalledWith(
          mockCanvasId,
          'shape-123',
          { x: 200, y: 300 },
          mockUserId
        );
      });

      it('should fail when shapeId is missing', async () => {
        const functionCall: FunctionCall = {
          name: 'moveShape',
          arguments: {
            x: 200,
            y: 300,
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid or missing shapeId');
        expect(canvasObjectsService.updateShape).not.toHaveBeenCalled();
      });

      it('should fail when coordinates are missing', async () => {
        const functionCall: FunctionCall = {
          name: 'moveShape',
          arguments: {
            shapeId: 'shape-123',
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid or missing coordinates');
        expect(canvasObjectsService.updateShape).not.toHaveBeenCalled();
      });

      it('should handle service error when moving shape', async () => {
        vi.mocked(canvasObjectsService.updateShape).mockRejectedValue(
          new Error('Shape not found')
        );

        const functionCall: FunctionCall = {
          name: 'moveShape',
          arguments: {
            shapeId: 'shape-123',
            x: 200,
            y: 300,
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(false);
        expect(result.error).toContain('Shape not found');
      });
    });

    describe('getCanvasState', () => {
      it('should successfully get canvas state', async () => {
        const mockShapes: CanvasObject[] = [
          {
            id: 'shape-1',
            type: 'circle',
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            fill: '#FF0000',
            createdBy: mockUserId,
            createdAt: new Date(),
            updatedAt: new Date(),
            version: 1,
            lastEditedBy: mockUserId,
          },
        ];

        vi.mocked(canvasObjectsService.getCanvasObjects).mockResolvedValue(mockShapes);

        const functionCall: FunctionCall = {
          name: 'getCanvasState',
          arguments: {},
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(true);
        expect(result.shapeIds).toEqual([]);
        expect(canvasObjectsService.getCanvasObjects).toHaveBeenCalledWith(mockCanvasId);
      });

      it('should handle service error when getting canvas state', async () => {
        vi.mocked(canvasObjectsService.getCanvasObjects).mockRejectedValue(
          new Error('Canvas not found')
        );

        const functionCall: FunctionCall = {
          name: 'getCanvasState',
          arguments: {},
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(false);
        expect(result.error).toContain('Canvas not found');
      });
    });

    describe('unknown function', () => {
      it('should return error for unknown function name', async () => {
        const functionCall: FunctionCall = {
          name: 'unknownFunction',
          arguments: {},
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(false);
        expect(result.error).toContain('Unknown function: unknownFunction');
      });
    });
  });

  describe('executeFunctionCalls', () => {
    it('should execute multiple function calls successfully', async () => {
      const mockShape1: CanvasObject = {
        id: 'shape-1',
        type: 'circle',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        fill: '#FF0000',
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        lastEditedBy: mockUserId,
      };

      const mockShape2: CanvasObject = {
        id: 'shape-2',
        type: 'rectangle',
        x: 200,
        y: 200,
        width: 150,
        height: 75,
        fill: '#0000FF',
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        lastEditedBy: mockUserId,
      };

      vi.mocked(canvasObjectsService.createShape)
        .mockResolvedValueOnce(mockShape1)
        .mockResolvedValueOnce(mockShape2);

      const functionCalls: FunctionCall[] = [
        {
          name: 'createShape',
          arguments: {
            type: 'circle',
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            color: 'red',
          },
        },
        {
          name: 'createShape',
          arguments: {
            type: 'rectangle',
            x: 200,
            y: 200,
            width: 150,
            height: 75,
            color: 'blue',
          },
        },
      ];

      const result = await executeFunctionCalls(
        functionCalls,
        mockCanvasId,
        mockUserId,
        mockUserName
      );

      expect(result.success).toBe(true);
      expect(result.shapeIds).toEqual(['shape-1', 'shape-2']);
      expect(canvasObjectsService.createShape).toHaveBeenCalledTimes(2);
    });

    it('should continue on partial failure and report partial success', async () => {
      const mockShape: CanvasObject = {
        id: 'shape-1',
        type: 'circle',
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        fill: '#FF0000',
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        lastEditedBy: mockUserId,
      };

      vi.mocked(canvasObjectsService.createShape)
        .mockResolvedValueOnce(mockShape)
        .mockRejectedValueOnce(new Error('Second shape failed'));

      const functionCalls: FunctionCall[] = [
        {
          name: 'createShape',
          arguments: {
            type: 'circle',
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            color: 'red',
          },
        },
        {
          name: 'createShape',
          arguments: {
            type: 'rectangle',
            x: 200,
            y: 200,
            width: 150,
            height: 75,
            color: 'blue',
          },
        },
      ];

      const result = await executeFunctionCalls(
        functionCalls,
        mockCanvasId,
        mockUserId,
        mockUserName
      );

      expect(result.success).toBe(true); // Partial success
      expect(result.shapeIds).toEqual(['shape-1']); // Only first shape
      expect(result.error).toContain('Partial success');
      expect(result.error).toContain('Second shape failed');
    });

    it('should return failure when all function calls fail', async () => {
      const functionCalls: FunctionCall[] = [
        {
          name: 'createShape',
          arguments: {
            type: 'invalid',
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            color: 'red',
          },
        },
      ];

      const result = await executeFunctionCalls(
        functionCalls,
        mockCanvasId,
        mockUserId,
        mockUserName
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should handle empty function calls array', async () => {
      const result = await executeFunctionCalls(
        [],
        mockCanvasId,
        mockUserId,
        mockUserName
      );

      expect(result.success).toBe(true);
      expect(result.shapeIds).toEqual([]);
    });
  });

  describe('Manipulation Commands', () => {
    describe('resizeShape', () => {
      it('should successfully resize a shape', async () => {
        vi.mocked(canvasObjectsService.updateShape).mockResolvedValue();

        const functionCall: FunctionCall = {
          name: 'resizeShape',
          arguments: {
            shapeId: 'shape-123',
            width: 200,
            height: 150,
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(true);
        expect(result.shapeIds).toEqual(['shape-123']);
        expect(canvasObjectsService.updateShape).toHaveBeenCalledWith(
          mockCanvasId,
          'shape-123',
          { width: 200, height: 150 },
          mockUserId
        );
      });

      it('should fail when shapeId is missing', async () => {
        const functionCall: FunctionCall = {
          name: 'resizeShape',
          arguments: {
            width: 200,
            height: 150,
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid or missing shapeId');
      });

      it('should fail when dimensions are invalid', async () => {
        const functionCall: FunctionCall = {
          name: 'resizeShape',
          arguments: {
            shapeId: 'shape-123',
            width: -100,
            height: 150,
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(false);
        expect(result.error).toContain('positive numbers');
      });
    });

    describe('rotateShape', () => {
      it('should successfully rotate a shape', async () => {
        vi.mocked(canvasObjectsService.updateShape).mockResolvedValue();

        const functionCall: FunctionCall = {
          name: 'rotateShape',
          arguments: {
            shapeId: 'shape-123',
            degrees: 45,
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(true);
        expect(result.shapeIds).toEqual(['shape-123']);
        expect(canvasObjectsService.updateShape).toHaveBeenCalledWith(
          mockCanvasId,
          'shape-123',
          { rotation: 45 },
          mockUserId
        );
      });

      it('should normalize rotation degrees to 0-360 range', async () => {
        vi.mocked(canvasObjectsService.updateShape).mockResolvedValue();

        const functionCall: FunctionCall = {
          name: 'rotateShape',
          arguments: {
            shapeId: 'shape-123',
            degrees: 450, // Should normalize to 90
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(true);
        expect(canvasObjectsService.updateShape).toHaveBeenCalledWith(
          mockCanvasId,
          'shape-123',
          { rotation: 90 },
          mockUserId
        );
      });

      it('should handle negative rotation degrees', async () => {
        vi.mocked(canvasObjectsService.updateShape).mockResolvedValue();

        const functionCall: FunctionCall = {
          name: 'rotateShape',
          arguments: {
            shapeId: 'shape-123',
            degrees: -45, // Should normalize to 315
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(true);
        expect(canvasObjectsService.updateShape).toHaveBeenCalledWith(
          mockCanvasId,
          'shape-123',
          { rotation: 315 },
          mockUserId
        );
      });
    });

    describe('updateShapeColor', () => {
      it('should successfully update shape color', async () => {
        vi.mocked(canvasObjectsService.updateShape).mockResolvedValue();

        const functionCall: FunctionCall = {
          name: 'updateShapeColor',
          arguments: {
            shapeId: 'shape-123',
            color: 'red',
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(true);
        expect(canvasObjectsService.updateShape).toHaveBeenCalledWith(
          mockCanvasId,
          'shape-123',
          { fill: '#FF0000' }, // Color normalized
          mockUserId
        );
      });

      it('should handle hex color codes', async () => {
        vi.mocked(canvasObjectsService.updateShape).mockResolvedValue();

        const functionCall: FunctionCall = {
          name: 'updateShapeColor',
          arguments: {
            shapeId: 'shape-123',
            color: '#00FF00',
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(true);
        expect(canvasObjectsService.updateShape).toHaveBeenCalledWith(
          mockCanvasId,
          'shape-123',
          { fill: '#00FF00' },
          mockUserId
        );
      });
    });

    describe('deleteShape', () => {
      it('should successfully delete a shape', async () => {
        vi.mocked(canvasObjectsService.deleteShape).mockResolvedValue();

        const functionCall: FunctionCall = {
          name: 'deleteShape',
          arguments: {
            shapeId: 'shape-123',
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(true);
        expect(result.shapeIds).toEqual(['shape-123']);
        expect(canvasObjectsService.deleteShape).toHaveBeenCalledWith(
          mockCanvasId,
          'shape-123'
        );
      });

      it('should fail when shapeId is missing', async () => {
        const functionCall: FunctionCall = {
          name: 'deleteShape',
          arguments: {},
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid or missing shapeId');
      });
    });
  });

  describe('Layout Commands', () => {
    const mockShapes: CanvasObject[] = [
      {
        id: 'shape-1',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        fill: '#FF0000',
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        lastEditedBy: mockUserId,
      },
      {
        id: 'shape-2',
        type: 'circle',
        x: 0,
        y: 0,
        width: 80,
        height: 80,
        fill: '#0000FF',
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        lastEditedBy: mockUserId,
      },
      {
        id: 'shape-3',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 120,
        height: 60,
        fill: '#00FF00',
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        lastEditedBy: mockUserId,
      },
    ];

    describe('arrangeHorizontally', () => {
      it('should arrange shapes in a horizontal row', async () => {
        vi.mocked(canvasObjectsService.getCanvasObjects).mockResolvedValue(mockShapes);
        vi.mocked(canvasObjectsService.updateShape).mockResolvedValue();

        const functionCall: FunctionCall = {
          name: 'arrangeHorizontally',
          arguments: {
            shapeIds: ['shape-1', 'shape-2', 'shape-3'],
            spacing: 20,
            startX: 0,
            startY: 100,
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(true);
        expect(canvasObjectsService.updateShape).toHaveBeenCalledTimes(3);
        
        // First shape at startX
        expect(canvasObjectsService.updateShape).toHaveBeenNthCalledWith(
          1,
          mockCanvasId,
          'shape-1',
          { x: 0, y: 100 },
          mockUserId
        );
        
        // Second shape at startX + width1 + spacing
        expect(canvasObjectsService.updateShape).toHaveBeenNthCalledWith(
          2,
          mockCanvasId,
          'shape-2',
          { x: 120, y: 100 }, // 0 + 100 + 20
          mockUserId
        );
      });

      it('should use default spacing if not provided', async () => {
        vi.mocked(canvasObjectsService.getCanvasObjects).mockResolvedValue([mockShapes[0], mockShapes[1]]);
        vi.mocked(canvasObjectsService.updateShape).mockResolvedValue();

        const functionCall: FunctionCall = {
          name: 'arrangeHorizontally',
          arguments: {
            shapeIds: ['shape-1', 'shape-2'],
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(true);
      });

      it('should fail when shapeIds array is empty', async () => {
        const functionCall: FunctionCall = {
          name: 'arrangeHorizontally',
          arguments: {
            shapeIds: [],
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid or missing shapeIds array');
      });
    });

    describe('arrangeVertically', () => {
      it('should arrange shapes in a vertical column', async () => {
        vi.mocked(canvasObjectsService.getCanvasObjects).mockResolvedValue(mockShapes);
        vi.mocked(canvasObjectsService.updateShape).mockResolvedValue();

        const functionCall: FunctionCall = {
          name: 'arrangeVertically',
          arguments: {
            shapeIds: ['shape-1', 'shape-2'],
            spacing: 30,
            startX: 50,
            startY: 0,
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(true);
        expect(canvasObjectsService.updateShape).toHaveBeenCalledTimes(2);
        
        // First shape at startY
        expect(canvasObjectsService.updateShape).toHaveBeenNthCalledWith(
          1,
          mockCanvasId,
          'shape-1',
          { x: 50, y: 0 },
          mockUserId
        );
        
        // Second shape at startY + height1 + spacing
        expect(canvasObjectsService.updateShape).toHaveBeenNthCalledWith(
          2,
          mockCanvasId,
          'shape-2',
          { x: 50, y: 80 }, // 0 + 50 + 30
          mockUserId
        );
      });
    });

    describe('createGrid', () => {
      it('should create a grid of shapes', async () => {
        const mockCreatedShape: CanvasObject = {
          id: 'grid-shape',
          type: 'rectangle',
          x: 0,
          y: 0,
          width: 50,
          height: 50,
          fill: '#0000FF',
          createdBy: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
          lastEditedBy: mockUserId,
        };

        vi.mocked(canvasObjectsService.createShape).mockResolvedValue(mockCreatedShape);

        const functionCall: FunctionCall = {
          name: 'createGrid',
          arguments: {
            rows: 2,
            cols: 3,
            shapeType: 'rectangle',
            size: 50,
            spacing: 10,
            color: 'blue',
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(true);
        expect(canvasObjectsService.createShape).toHaveBeenCalledTimes(6); // 2 rows * 3 cols
        expect(result.shapeIds?.length).toBe(6);
      });

      it('should fail when grid is too large', async () => {
        const functionCall: FunctionCall = {
          name: 'createGrid',
          arguments: {
            rows: 20,
            cols: 20,
            shapeType: 'rectangle',
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(false);
        expect(result.error).toContain('Grid too large');
      });

      it('should fail when rows or cols are invalid', async () => {
        const functionCall: FunctionCall = {
          name: 'createGrid',
          arguments: {
            rows: 0,
            cols: 3,
            shapeType: 'rectangle',
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(false);
        expect(result.error).toContain('positive numbers');
      });
    });

    describe('distributeEvenly', () => {
      it('should distribute shapes evenly horizontally', async () => {
        const shapesToDistribute = [
          { ...mockShapes[0], x: 0 },
          { ...mockShapes[1], x: 100 },
          { ...mockShapes[2], x: 200 },
        ];

        vi.mocked(canvasObjectsService.getCanvasObjects).mockResolvedValue(shapesToDistribute);
        vi.mocked(canvasObjectsService.updateShape).mockResolvedValue();

        const functionCall: FunctionCall = {
          name: 'distributeEvenly',
          arguments: {
            shapeIds: ['shape-1', 'shape-2', 'shape-3'],
            direction: 'horizontal',
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(true);
        // Only middle shape should be updated (first and last stay in place)
        expect(canvasObjectsService.updateShape).toHaveBeenCalledTimes(1);
      });

      it('should distribute shapes evenly vertically', async () => {
        const shapesToDistribute = [
          { ...mockShapes[0], y: 0 },
          { ...mockShapes[1], y: 100 },
          { ...mockShapes[2], y: 200 },
        ];

        vi.mocked(canvasObjectsService.getCanvasObjects).mockResolvedValue(shapesToDistribute);
        vi.mocked(canvasObjectsService.updateShape).mockResolvedValue();

        const functionCall: FunctionCall = {
          name: 'distributeEvenly',
          arguments: {
            shapeIds: ['shape-1', 'shape-2', 'shape-3'],
            direction: 'vertical',
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(true);
        expect(canvasObjectsService.updateShape).toHaveBeenCalledTimes(1);
      });

      it('should fail when less than 2 shapes provided', async () => {
        const functionCall: FunctionCall = {
          name: 'distributeEvenly',
          arguments: {
            shapeIds: ['shape-1'],
            direction: 'horizontal',
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(false);
        expect(result.error).toContain('at least 2 shapes');
      });

      it('should fail when direction is invalid', async () => {
        const functionCall: FunctionCall = {
          name: 'distributeEvenly',
          arguments: {
            shapeIds: ['shape-1', 'shape-2'],
            direction: 'diagonal',
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid direction');
      });
    });
  });

  describe('Query Commands', () => {
    const mockShapes: CanvasObject[] = [
      {
        id: 'shape-red-1',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        fill: '#FF0000',
        createdBy: mockUserId,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date(),
        version: 1,
        lastEditedBy: mockUserId,
      },
      {
        id: 'shape-blue-1',
        type: 'circle',
        x: 0,
        y: 0,
        width: 80,
        height: 80,
        fill: '#0000FF',
        createdBy: mockUserId,
        createdAt: new Date('2025-01-02'),
        updatedAt: new Date(),
        version: 1,
        lastEditedBy: mockUserId,
      },
      {
        id: 'shape-red-2',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 120,
        height: 60,
        fill: '#FF0000',
        createdBy: mockUserId,
        createdAt: new Date('2025-01-03'),
        updatedAt: new Date(),
        version: 1,
        lastEditedBy: mockUserId,
      },
    ];

    describe('getShapesByColor', () => {
      it('should find shapes by color name', async () => {
        vi.mocked(canvasObjectsService.getCanvasObjects).mockResolvedValue(mockShapes);

        const functionCall: FunctionCall = {
          name: 'getShapesByColor',
          arguments: {
            color: 'red',
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(true);
        expect(result.shapeIds).toEqual(['shape-red-1', 'shape-red-2']);
      });

      it('should find shapes by hex color', async () => {
        vi.mocked(canvasObjectsService.getCanvasObjects).mockResolvedValue(mockShapes);

        const functionCall: FunctionCall = {
          name: 'getShapesByColor',
          arguments: {
            color: '#0000FF',
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(true);
        expect(result.shapeIds).toEqual(['shape-blue-1']);
      });

      it('should return empty array when no shapes match', async () => {
        vi.mocked(canvasObjectsService.getCanvasObjects).mockResolvedValue(mockShapes);

        const functionCall: FunctionCall = {
          name: 'getShapesByColor',
          arguments: {
            color: 'green',
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(true);
        expect(result.shapeIds).toEqual([]);
      });
    });

    describe('getShapesByType', () => {
      it('should find shapes by type', async () => {
        vi.mocked(canvasObjectsService.getCanvasObjects).mockResolvedValue(mockShapes);

        const functionCall: FunctionCall = {
          name: 'getShapesByType',
          arguments: {
            type: 'rectangle',
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(true);
        expect(result.shapeIds).toEqual(['shape-red-1', 'shape-red-2']);
      });

      it('should find circles', async () => {
        vi.mocked(canvasObjectsService.getCanvasObjects).mockResolvedValue(mockShapes);

        const functionCall: FunctionCall = {
          name: 'getShapesByType',
          arguments: {
            type: 'circle',
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(true);
        expect(result.shapeIds).toEqual(['shape-blue-1']);
      });

      it('should fail when type is invalid', async () => {
        const functionCall: FunctionCall = {
          name: 'getShapesByType',
          arguments: {
            type: 'triangle',
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid or missing shape type');
      });
    });

    describe('getSelectedShapes', () => {
      it('should return selected shape IDs from arguments', async () => {
        const functionCall: FunctionCall = {
          name: 'getSelectedShapes',
          arguments: {
            selectedShapeIds: ['shape-1', 'shape-2'],
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(true);
        expect(result.shapeIds).toEqual(['shape-1', 'shape-2']);
      });

      it('should return empty array when no shapes selected', async () => {
        const functionCall: FunctionCall = {
          name: 'getSelectedShapes',
          arguments: {},
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(true);
        expect(result.shapeIds).toEqual([]);
      });
    });

    describe('getRecentShapes', () => {
      it('should return most recent shapes', async () => {
        vi.mocked(canvasObjectsService.getCanvasObjects).mockResolvedValue(mockShapes);

        const functionCall: FunctionCall = {
          name: 'getRecentShapes',
          arguments: {
            count: 2,
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(true);
        // Should return newest first (shape-red-2, shape-blue-1)
        expect(result.shapeIds).toHaveLength(2);
        expect(result.shapeIds).toContain('shape-red-2');
        expect(result.shapeIds).toContain('shape-blue-1');
      });

      it('should use default count if not provided', async () => {
        vi.mocked(canvasObjectsService.getCanvasObjects).mockResolvedValue(mockShapes);

        const functionCall: FunctionCall = {
          name: 'getRecentShapes',
          arguments: {},
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(true);
        expect(result.shapeIds).toHaveLength(3); // All 3 shapes (less than default of 5)
      });

      it('should fail when count is invalid', async () => {
        const functionCall: FunctionCall = {
          name: 'getRecentShapes',
          arguments: {
            count: -1,
          },
        };

        const result = await executeFunctionCall(
          functionCall,
          mockCanvasId,
          mockUserId,
          mockUserName
        );

        expect(result.success).toBe(false);
        expect(result.error).toContain('positive number');
      });
    });
  });
});

