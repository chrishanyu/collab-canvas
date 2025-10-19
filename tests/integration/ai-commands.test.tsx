/**
 * End-to-End Integration Tests for AI Commands
 * 
 * Tests the complete flow: User inputs command → AI processes → Shape appears on canvas
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AICommandInput } from '../../src/components/ai/AICommandInput';
import * as aiService from '../../src/services/ai.service';
import * as canvasObjectsService from '../../src/services/canvasObjects.service';
import type { AICommandResponse } from '../../src/types/ai';
import type { CanvasObject } from '../../src/types';

// Mock services
vi.mock('../../src/services/ai.service');
vi.mock('../../src/services/canvasObjects.service', () => ({
  createShape: vi.fn(),
  updateShape: vi.fn(),
  deleteShape: vi.fn(),
  getCanvasObjects: vi.fn(),
}));
vi.mock('../../src/utils/toast', () => ({
  showSuccessToast: vi.fn(),
  showErrorToast: vi.fn(),
}));

describe('AI Commands - End-to-End Integration', () => {
  const mockCanvasId = 'test-canvas-id';
  const mockUserId = 'test-user-id';
  const mockUserName = 'Test User';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Shape Commands', () => {
    it('should create a red circle when user types "Create a red circle"', async () => {
      const user = userEvent.setup();

      // Mock AI response
      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
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
        ],
        executionTime: 1234,
      };

      // Mock created shape
      const mockCreatedShape: CanvasObject = {
        id: 'shape-red-circle-123',
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

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);
      vi.mocked(canvasObjectsService.createShape).mockResolvedValue(mockCreatedShape);

      // Render component
      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
        />
      );

      // User types command
      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Create a red circle{Enter}');

      // Wait for AI service to be called
      await waitFor(() => {
        expect(aiService.sendAICommand).toHaveBeenCalledWith(
          'Create a red circle',
          mockCanvasId,
          mockUserId,
          undefined
        );
      });

      // Wait for shape creation to be called
      await waitFor(() => {
        expect(canvasObjectsService.createShape).toHaveBeenCalledWith(
          mockCanvasId,
          expect.objectContaining({
            type: 'circle',
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            fill: '#FF0000',
            createdBy: mockUserId,
          })
        );
      });

      // Verify shape was created with correct properties
      const createShapeCall = vi.mocked(canvasObjectsService.createShape).mock.calls[0];
      const createdShapeData = createShapeCall[1];
      expect(createdShapeData.type).toBe('circle');
      expect(createdShapeData.fill).toBe('#FF0000'); // Color normalized from 'red'
      expect(createdShapeData.width).toBe(100);
      expect(createdShapeData.height).toBe(100);
    });

    it('should create a blue rectangle when user types "Make a blue rectangle"', async () => {
      const user = userEvent.setup();

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'createShape',
            arguments: {
              type: 'rectangle',
              x: 100,
              y: 200,
              width: 200,
              height: 150,
              color: 'blue',
            },
          },
        ],
      };

      const mockCreatedShape: CanvasObject = {
        id: 'shape-blue-rect-456',
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 200,
        height: 150,
        fill: '#0000FF',
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        lastEditedBy: mockUserId,
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);
      vi.mocked(canvasObjectsService.createShape).mockResolvedValue(mockCreatedShape);

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Make a blue rectangle{Enter}');

      await waitFor(() => {
        expect(canvasObjectsService.createShape).toHaveBeenCalledWith(
          mockCanvasId,
          expect.objectContaining({
            type: 'rectangle',
            fill: '#0000FF',
            x: 100,
            y: 200,
            width: 200,
            height: 150,
          })
        );
      });
    });

    it('should create a text shape when user types "Add text that says Hello"', async () => {
      const user = userEvent.setup();

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'createShape',
            arguments: {
              type: 'text',
              x: 0,
              y: 0,
              width: 200,
              height: 40,
              color: 'black',
              text: 'Hello',
            },
          },
        ],
      };

      const mockCreatedShape: CanvasObject = {
        id: 'shape-text-789',
        type: 'text',
        x: 0,
        y: 0,
        width: 200,
        height: 40,
        fill: '#000000',
        text: 'Hello',
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        lastEditedBy: mockUserId,
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);
      vi.mocked(canvasObjectsService.createShape).mockResolvedValue(mockCreatedShape);

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Add text that says Hello{Enter}');

      await waitFor(() => {
        expect(canvasObjectsService.createShape).toHaveBeenCalledWith(
          mockCanvasId,
          expect.objectContaining({
            type: 'text',
            text: 'Hello',
            fill: '#000000',
          })
        );
      });
    });
  });

  describe('Multiple Shape Commands', () => {
    it('should create multiple shapes for complex command', async () => {
      const user = userEvent.setup();

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
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
        ],
      };

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

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);
      vi.mocked(canvasObjectsService.createShape)
        .mockResolvedValueOnce(mockShape1)
        .mockResolvedValueOnce(mockShape2);

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Create a red circle and a blue rectangle{Enter}');

      await waitFor(() => {
        expect(canvasObjectsService.createShape).toHaveBeenCalledTimes(2);
      });

      // Verify first shape (circle)
      const firstCall = vi.mocked(canvasObjectsService.createShape).mock.calls[0];
      expect(firstCall[1].type).toBe('circle');
      expect(firstCall[1].fill).toBe('#FF0000');

      // Verify second shape (rectangle)
      const secondCall = vi.mocked(canvasObjectsService.createShape).mock.calls[1];
      expect(secondCall[1].type).toBe('rectangle');
      expect(secondCall[1].fill).toBe('#0000FF');
    });
  });

  describe('Move Shape Commands', () => {
    it('should move a shape when user types move command', async () => {
      const user = userEvent.setup();

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'moveShape',
            arguments: {
              shapeId: 'shape-123',
              x: 300,
              y: 400,
            },
          },
        ],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);
      vi.mocked(canvasObjectsService.updateShape).mockResolvedValue();

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Move the circle to 300, 400{Enter}');

      await waitFor(() => {
        expect(canvasObjectsService.updateShape).toHaveBeenCalledWith(
          mockCanvasId,
          'shape-123',
          { x: 300, y: 400 },
          mockUserId
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle AI service errors gracefully', async () => {
      const user = userEvent.setup();

      vi.mocked(aiService.sendAICommand).mockRejectedValue(
        new Error('AI service unavailable')
      );

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Create a circle{Enter}');

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('AI service unavailable')).toBeInTheDocument();
      });

      // Should not attempt to create shape
      expect(canvasObjectsService.createShape).not.toHaveBeenCalled();
    });

    it('should handle shape creation errors gracefully', async () => {
      const user = userEvent.setup();

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
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
        ],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);
      vi.mocked(canvasObjectsService.createShape).mockRejectedValue(
        new Error('Firebase permission denied')
      );

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Create a circle{Enter}');

      // Should show error after attempting to create shape
      await waitFor(() => {
        expect(screen.getByText(/Firebase permission denied/i)).toBeInTheDocument();
      });
    });
  });

  describe('Canvas State Context', () => {
    it('should pass canvas state to AI when provided', async () => {
      const user = userEvent.setup();

      const canvasState = {
        shapes: [
          {
            id: 'existing-shape-1',
            type: 'circle',
            x: 50,
            y: 50,
            width: 100,
            height: 100,
            fill: '#FF0000',
          },
        ],
        selectedShapeIds: ['existing-shape-1'],
      };

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'createShape',
            arguments: {
              type: 'rectangle',
              x: 200,
              y: 200,
              width: 100,
              height: 100,
              color: 'blue',
            },
          },
        ],
      };

      const mockCreatedShape: CanvasObject = {
        id: 'new-shape',
        type: 'rectangle',
        x: 200,
        y: 200,
        width: 100,
        height: 100,
        fill: '#0000FF',
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        lastEditedBy: mockUserId,
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);
      vi.mocked(canvasObjectsService.createShape).mockResolvedValue(mockCreatedShape);

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
          canvasState={canvasState}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Create a blue rectangle next to it{Enter}');

      await waitFor(() => {
        expect(aiService.sendAICommand).toHaveBeenCalledWith(
          'Create a blue rectangle next to it',
          mockCanvasId,
          mockUserId,
          canvasState
        );
      });
    });
  });

  describe('User Experience', () => {
    it('should show loading state while processing', async () => {
      const user = userEvent.setup();

      // Mock slow AI response
      vi.mocked(aiService.sendAICommand).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                success: true,
                functionCalls: [
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
                ],
              });
            }, 100);
          })
      );

      const mockCreatedShape: CanvasObject = {
        id: 'shape-123',
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

      vi.mocked(canvasObjectsService.createShape).mockResolvedValue(mockCreatedShape);

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Create a circle{Enter}');

      // Should show loading message
      await waitFor(() => {
        expect(screen.getByText('AI is thinking...')).toBeInTheDocument();
      });

      // Should eventually complete
      await waitFor(
        () => {
          expect(canvasObjectsService.createShape).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );
    });
  });

  describe('Manipulation Commands', () => {
    it('should resize a shape when user types resize command', async () => {
      const user = userEvent.setup();

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'resizeShape',
            arguments: {
              shapeId: 'shape-123',
              width: 200,
              height: 150,
            },
          },
        ],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);
      vi.mocked(canvasObjectsService.updateShape).mockResolvedValue();

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Make the rectangle 200x150{Enter}');

      await waitFor(() => {
        expect(canvasObjectsService.updateShape).toHaveBeenCalledWith(
          mockCanvasId,
          'shape-123',
          { width: 200, height: 150 },
          mockUserId
        );
      });
    });

    it('should rotate a shape when user types rotate command', async () => {
      const user = userEvent.setup();

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'rotateShape',
            arguments: {
              shapeId: 'shape-456',
              degrees: 45,
            },
          },
        ],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);
      vi.mocked(canvasObjectsService.updateShape).mockResolvedValue();

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Rotate that rectangle 45 degrees{Enter}');

      await waitFor(() => {
        expect(canvasObjectsService.updateShape).toHaveBeenCalledWith(
          mockCanvasId,
          'shape-456',
          { rotation: 45 },
          mockUserId
        );
      });
    });

    it('should update shape color when user types color change command', async () => {
      const user = userEvent.setup();

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'updateShapeColor',
            arguments: {
              shapeId: 'shape-789',
              color: 'purple',
            },
          },
        ],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);
      vi.mocked(canvasObjectsService.updateShape).mockResolvedValue();

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Change the circle to purple{Enter}');

      await waitFor(() => {
        expect(canvasObjectsService.updateShape).toHaveBeenCalledWith(
          mockCanvasId,
          'shape-789',
          { fill: '#800080' }, // Color normalized
          mockUserId
        );
      });
    });

    it('should delete a shape when user types delete command', async () => {
      const user = userEvent.setup();

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'deleteShape',
            arguments: {
              shapeId: 'shape-999',
            },
          },
        ],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);
      vi.mocked(canvasObjectsService.deleteShape).mockResolvedValue();

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Delete that shape{Enter}');

      await waitFor(() => {
        expect(canvasObjectsService.deleteShape).toHaveBeenCalledWith(
          mockCanvasId,
          'shape-999'
        );
      });
    });

    it('should handle rotation with negative degrees', async () => {
      const user = userEvent.setup();

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'rotateShape',
            arguments: {
              shapeId: 'shape-101',
              degrees: -45,
            },
          },
        ],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);
      vi.mocked(canvasObjectsService.updateShape).mockResolvedValue();

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Rotate left 45 degrees{Enter}');

      await waitFor(() => {
        expect(canvasObjectsService.updateShape).toHaveBeenCalledWith(
          mockCanvasId,
          'shape-101',
          { rotation: 315 }, // -45 normalized to 315
          mockUserId
        );
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

    it('should arrange shapes horizontally', async () => {
      const user = userEvent.setup();

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'arrangeHorizontally',
            arguments: {
              shapeIds: ['shape-1', 'shape-2', 'shape-3'],
              spacing: 20,
              startX: 0,
              startY: 100,
            },
          },
        ],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);
      vi.mocked(canvasObjectsService.getCanvasObjects).mockResolvedValue(mockShapes);
      vi.mocked(canvasObjectsService.updateShape).mockResolvedValue();

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Arrange these shapes in a row{Enter}');

      await waitFor(() => {
        expect(canvasObjectsService.updateShape).toHaveBeenCalledTimes(3);
      });

      // Verify shapes were updated with new positions
      const calls = vi.mocked(canvasObjectsService.updateShape).mock.calls;
      expect(calls[0][1]).toBe('shape-1');
      expect(calls[1][1]).toBe('shape-2');
      expect(calls[2][1]).toBe('shape-3');
    });

    it('should arrange shapes vertically', async () => {
      const user = userEvent.setup();

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'arrangeVertically',
            arguments: {
              shapeIds: ['shape-1', 'shape-2'],
              spacing: 30,
              startX: 50,
              startY: 0,
            },
          },
        ],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);
      vi.mocked(canvasObjectsService.getCanvasObjects).mockResolvedValue(mockShapes);
      vi.mocked(canvasObjectsService.updateShape).mockResolvedValue();

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Stack these vertically{Enter}');

      await waitFor(() => {
        expect(canvasObjectsService.updateShape).toHaveBeenCalledTimes(2);
      });
    });

    it('should create a grid of shapes', async () => {
      const user = userEvent.setup();

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'createGrid',
            arguments: {
              rows: 2,
              cols: 3,
              shapeType: 'rectangle',
              size: 50,
              spacing: 10,
              color: 'blue',
            },
          },
        ],
      };

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

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);
      vi.mocked(canvasObjectsService.createShape).mockResolvedValue(mockCreatedShape);

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Create a 2x3 grid of blue squares{Enter}');

      await waitFor(() => {
        expect(canvasObjectsService.createShape).toHaveBeenCalledTimes(6); // 2 rows * 3 cols
      });
    });

    it('should distribute shapes evenly', async () => {
      const user = userEvent.setup();

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'distributeEvenly',
            arguments: {
              shapeIds: ['shape-1', 'shape-2', 'shape-3'],
              direction: 'horizontal',
            },
          },
        ],
      };

      const distributedShapes = [
        { ...mockShapes[0], x: 0 },
        { ...mockShapes[1], x: 100 },
        { ...mockShapes[2], x: 200 },
      ];

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);
      vi.mocked(canvasObjectsService.getCanvasObjects).mockResolvedValue(distributedShapes);
      vi.mocked(canvasObjectsService.updateShape).mockResolvedValue();

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Space these shapes evenly{Enter}');

      await waitFor(() => {
        expect(canvasObjectsService.updateShape).toHaveBeenCalled();
      });
    });

    it('should handle large grid creation', async () => {
      const user = userEvent.setup();

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'createGrid',
            arguments: {
              rows: 5,
              cols: 5,
              shapeType: 'circle',
              size: 40,
              spacing: 15,
              color: 'green',
            },
          },
        ],
      };

      const mockCreatedShape: CanvasObject = {
        id: 'grid-circle',
        type: 'circle',
        x: 0,
        y: 0,
        width: 40,
        height: 40,
        fill: '#00FF00',
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        lastEditedBy: mockUserId,
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);
      vi.mocked(canvasObjectsService.createShape).mockResolvedValue(mockCreatedShape);

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Create a 5x5 grid of green circles{Enter}');

      await waitFor(() => {
        expect(canvasObjectsService.createShape).toHaveBeenCalledTimes(25); // 5 rows * 5 cols
      });
    });
  });

  describe('Query Commands', () => {
    const mockQueryShapes: CanvasObject[] = [
      {
        id: 'red-rect-1',
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
        id: 'blue-circle-1',
        type: 'circle',
        x: 100,
        y: 100,
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
        id: 'red-rect-2',
        type: 'rectangle',
        x: 200,
        y: 200,
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

    it('should query shapes by color and then modify them', async () => {
      const user = userEvent.setup();

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'getShapesByColor',
            arguments: {
              color: 'red',
            },
          },
          {
            name: 'updateShapeColor',
            arguments: {
              shapeId: 'red-rect-1',
              color: 'blue',
            },
          },
          {
            name: 'updateShapeColor',
            arguments: {
              shapeId: 'red-rect-2',
              color: 'blue',
            },
          },
        ],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);
      vi.mocked(canvasObjectsService.getCanvasObjects).mockResolvedValue(mockQueryShapes);
      vi.mocked(canvasObjectsService.updateShape).mockResolvedValue();

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Make all red shapes blue{Enter}');

      await waitFor(() => {
        expect(canvasObjectsService.getCanvasObjects).toHaveBeenCalled();
        expect(canvasObjectsService.updateShape).toHaveBeenCalledTimes(2);
      });
    });

    it('should query shapes by type', async () => {
      const user = userEvent.setup();

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'getShapesByType',
            arguments: {
              type: 'rectangle',
            },
          },
        ],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);
      vi.mocked(canvasObjectsService.getCanvasObjects).mockResolvedValue(mockQueryShapes);

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Show me all rectangles{Enter}');

      await waitFor(() => {
        expect(canvasObjectsService.getCanvasObjects).toHaveBeenCalled();
      });
    });

    it('should get recent shapes and operate on them', async () => {
      const user = userEvent.setup();

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'getRecentShapes',
            arguments: {
              count: 2,
            },
          },
          {
            name: 'deleteShape',
            arguments: {
              shapeId: 'red-rect-2',
            },
          },
          {
            name: 'deleteShape',
            arguments: {
              shapeId: 'blue-circle-1',
            },
          },
        ],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);
      vi.mocked(canvasObjectsService.getCanvasObjects).mockResolvedValue(mockQueryShapes);
      vi.mocked(canvasObjectsService.deleteShape).mockResolvedValue();

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Delete the last 2 shapes{Enter}');

      await waitFor(() => {
        expect(canvasObjectsService.deleteShape).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle query with no results', async () => {
      const user = userEvent.setup();

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'getShapesByColor',
            arguments: {
              color: 'purple',
            },
          },
        ],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);
      vi.mocked(canvasObjectsService.getCanvasObjects).mockResolvedValue(mockQueryShapes);

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Find purple shapes{Enter}');

      await waitFor(() => {
        expect(canvasObjectsService.getCanvasObjects).toHaveBeenCalled();
      });
      // Should complete without error even though no shapes match
    });

    it('should handle selected shapes context', async () => {
      const user = userEvent.setup();

      const canvasState = {
        shapes: mockQueryShapes,
        selectedShapeIds: ['red-rect-1', 'blue-circle-1'],
      };

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'getSelectedShapes',
            arguments: {
              selectedShapeIds: ['red-rect-1', 'blue-circle-1'],
            },
          },
          {
            name: 'arrangeHorizontally',
            arguments: {
              shapeIds: ['red-rect-1', 'blue-circle-1'],
              spacing: 20,
            },
          },
        ],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);
      vi.mocked(canvasObjectsService.getCanvasObjects).mockResolvedValue(mockQueryShapes);
      vi.mocked(canvasObjectsService.updateShape).mockResolvedValue();

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
          canvasState={canvasState}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Arrange the selected shapes in a row{Enter}');

      await waitFor(() => {
        expect(canvasObjectsService.updateShape).toHaveBeenCalled();
      });
    });
  });

  describe('Complex Multi-Step Commands', () => {
    it('should execute login form creation', async () => {
      const user = userEvent.setup();

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'createShape',
            arguments: {
              type: 'text',
              x: 0,
              y: -150,
              width: 200,
              height: 40,
              color: 'black',
              text: 'Login',
            },
          },
          {
            name: 'createShape',
            arguments: {
              type: 'rectangle',
              x: 0,
              y: -80,
              width: 300,
              height: 40,
              color: 'gray',
              text: 'Email',
            },
          },
          {
            name: 'createShape',
            arguments: {
              type: 'rectangle',
              x: 0,
              y: -20,
              width: 300,
              height: 40,
              color: 'gray',
              text: 'Password',
            },
          },
          {
            name: 'createShape',
            arguments: {
              type: 'rectangle',
              x: 0,
              y: 50,
              width: 300,
              height: 40,
              color: 'blue',
              text: 'Sign In',
            },
          },
        ],
      };

      const mockShape: CanvasObject = {
        id: 'form-element',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 300,
        height: 40,
        fill: '#808080',
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        lastEditedBy: mockUserId,
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);
      vi.mocked(canvasObjectsService.createShape).mockResolvedValue(mockShape);

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Create a login form{Enter}');

      await waitFor(() => {
        expect(canvasObjectsService.createShape).toHaveBeenCalledTimes(4);
      });

      // Verify all elements were created
      const calls = vi.mocked(canvasObjectsService.createShape).mock.calls;
      expect(calls[0][1].type).toBe('text'); // Header
      expect(calls[1][1].type).toBe('rectangle'); // Email field
      expect(calls[2][1].type).toBe('rectangle'); // Password field
      expect(calls[3][1].type).toBe('rectangle'); // Submit button
    });

    it('should execute navigation bar creation', async () => {
      const user = userEvent.setup();

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'createShape',
            arguments: {
              type: 'rectangle',
              x: 0,
              y: -400,
              width: 1000,
              height: 60,
              color: 'blue',
            },
          },
          {
            name: 'createShape',
            arguments: {
              type: 'text',
              x: -400,
              y: -400,
              width: 100,
              height: 40,
              color: 'white',
              text: 'Home',
            },
          },
          {
            name: 'createShape',
            arguments: {
              type: 'text',
              x: -250,
              y: -400,
              width: 100,
              height: 40,
              color: 'white',
              text: 'About',
            },
          },
          {
            name: 'createShape',
            arguments: {
              type: 'text',
              x: -100,
              y: -400,
              width: 100,
              height: 40,
              color: 'white',
              text: 'Services',
            },
          },
          {
            name: 'createShape',
            arguments: {
              type: 'text',
              x: 50,
              y: -400,
              width: 100,
              height: 40,
              color: 'white',
              text: 'Contact',
            },
          },
        ],
      };

      const mockShape: CanvasObject = {
        id: 'nav-element',
        type: 'text',
        x: 0,
        y: 0,
        width: 100,
        height: 40,
        fill: '#FFFFFF',
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        lastEditedBy: mockUserId,
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);
      vi.mocked(canvasObjectsService.createShape).mockResolvedValue(mockShape);

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Design a navigation bar with 4 menu items{Enter}');

      await waitFor(() => {
        expect(canvasObjectsService.createShape).toHaveBeenCalledTimes(5);
      });
    });

    it('should execute product card creation', async () => {
      const user = userEvent.setup();

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'createShape',
            arguments: {
              type: 'rectangle',
              x: 0,
              y: 0,
              width: 300,
              height: 400,
              color: 'white',
            },
          },
          {
            name: 'createShape',
            arguments: {
              type: 'rectangle',
              x: 0,
              y: -120,
              width: 280,
              height: 180,
              color: 'gray',
            },
          },
          {
            name: 'createShape',
            arguments: {
              type: 'text',
              x: 0,
              y: 60,
              width: 280,
              height: 40,
              color: 'black',
              text: 'Product Name',
            },
          },
          {
            name: 'createShape',
            arguments: {
              type: 'text',
              x: 0,
              y: 110,
              width: 280,
              height: 30,
              color: 'gray',
              text: '$99.99',
            },
          },
          {
            name: 'createShape',
            arguments: {
              type: 'rectangle',
              x: 0,
              y: 160,
              width: 280,
              height: 40,
              color: 'blue',
              text: 'Add to Cart',
            },
          },
        ],
      };

      const mockShape: CanvasObject = {
        id: 'card-element',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 300,
        height: 400,
        fill: '#FFFFFF',
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        lastEditedBy: mockUserId,
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);
      vi.mocked(canvasObjectsService.createShape).mockResolvedValue(mockShape);

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Make a product card layout{Enter}');

      await waitFor(() => {
        expect(canvasObjectsService.createShape).toHaveBeenCalledTimes(5);
      });
    });

    it('should execute dashboard grid with arrangement', async () => {
      const user = userEvent.setup();

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'createGrid',
            arguments: {
              rows: 2,
              cols: 3,
              shapeType: 'rectangle',
              size: 150,
              spacing: 30,
              color: 'blue',
            },
          },
        ],
      };

      const mockShape: CanvasObject = {
        id: 'dashboard-card',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 150,
        height: 150,
        fill: '#3B82F6',
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        lastEditedBy: mockUserId,
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);
      vi.mocked(canvasObjectsService.createShape).mockResolvedValue(mockShape);

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Create a dashboard with 6 stat cards in a grid{Enter}');

      await waitFor(() => {
        expect(canvasObjectsService.createShape).toHaveBeenCalledTimes(6);
      });
    });

    it('should execute flowchart creation with vertical arrangement', async () => {
      const user = userEvent.setup();

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'createShape',
            arguments: {
              type: 'rectangle',
              x: 0,
              y: -150,
              width: 150,
              height: 80,
              color: 'blue',
              text: 'Start',
            },
          },
          {
            name: 'createShape',
            arguments: {
              type: 'rectangle',
              x: 0,
              y: 0,
              width: 150,
              height: 80,
              color: 'green',
              text: 'Process',
            },
          },
          {
            name: 'createShape',
            arguments: {
              type: 'rectangle',
              x: 0,
              y: 150,
              width: 150,
              height: 80,
              color: 'red',
              text: 'End',
            },
          },
        ],
      };

      const mockShape: CanvasObject = {
        id: 'flowchart-step',
        type: 'rectangle',
        x: 0,
        y: 0,
        width: 150,
        height: 80,
        fill: '#3B82F6',
        createdBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        lastEditedBy: mockUserId,
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);
      vi.mocked(canvasObjectsService.createShape).mockResolvedValue(mockShape);

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Create a simple flowchart with 3 steps{Enter}');

      await waitFor(() => {
        expect(canvasObjectsService.createShape).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('Error Scenarios for New Commands', () => {
    it('should handle resize command with invalid dimensions', async () => {
      const user = userEvent.setup();

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'resizeShape',
            arguments: {
              shapeId: 'shape-123',
              width: -100,
              height: 50,
            },
          },
        ],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Resize that shape{Enter}');

      // Should show error for invalid dimensions
      await waitFor(() => {
        expect(screen.getByText(/positive numbers/i)).toBeInTheDocument();
      });
    });

    it('should handle grid creation that exceeds limit', async () => {
      const user = userEvent.setup();

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'createGrid',
            arguments: {
              rows: 20,
              cols: 20,
              shapeType: 'rectangle',
            },
          },
        ],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Create a huge 20x20 grid{Enter}');

      // Should show error for grid too large
      await waitFor(() => {
        expect(screen.getByText(/Grid too large/i)).toBeInTheDocument();
      });
    });

    it('should handle delete command for non-existent shape', async () => {
      const user = userEvent.setup();

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'deleteShape',
            arguments: {
              shapeId: 'non-existent-shape',
            },
          },
        ],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);
      vi.mocked(canvasObjectsService.deleteShape).mockRejectedValue(
        new Error('Shape not found')
      );

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Delete that shape{Enter}');

      await waitFor(() => {
        expect(screen.getByText(/Shape not found/i)).toBeInTheDocument();
      });
    });

    it('should handle arrange command with empty shape list', async () => {
      const user = userEvent.setup();

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'arrangeHorizontally',
            arguments: {
              shapeIds: [],
              spacing: 20,
            },
          },
        ],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Arrange these shapes{Enter}');

      await waitFor(() => {
        expect(screen.getByText(/Invalid or missing shapeIds/i)).toBeInTheDocument();
      });
    });

    it('should handle distribute command with insufficient shapes', async () => {
      const user = userEvent.setup();

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'distributeEvenly',
            arguments: {
              shapeIds: ['shape-1'],
              direction: 'horizontal',
            },
          },
        ],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Distribute evenly{Enter}');

      await waitFor(() => {
        expect(screen.getByText(/at least 2 shapes/i)).toBeInTheDocument();
      });
    });

    it('should handle query returning no results gracefully', async () => {
      const user = userEvent.setup();

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'getShapesByColor',
            arguments: {
              color: 'purple',
            },
          },
          {
            name: 'deleteShape',
            arguments: {
              shapeId: undefined,
            },
          },
        ],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);
      vi.mocked(canvasObjectsService.getCanvasObjects).mockResolvedValue([]);

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Delete all purple shapes{Enter}');

      // Should handle gracefully even though no shapes found
      await waitFor(() => {
        expect(canvasObjectsService.getCanvasObjects).toHaveBeenCalled();
      });
    });
  });

  describe('Canvas State Context with New Commands', () => {
    it('should use canvas state to find shapes for manipulation', async () => {
      const user = userEvent.setup();

      const canvasState = {
        shapes: [
          {
            id: 'existing-rect',
            type: 'rectangle',
            x: 50,
            y: 50,
            width: 100,
            height: 100,
            fill: '#FF0000',
          },
        ],
        selectedShapeIds: [],
      };

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'getShapesByType',
            arguments: {
              type: 'rectangle',
            },
          },
          {
            name: 'rotateShape',
            arguments: {
              shapeId: 'existing-rect',
              degrees: 90,
            },
          },
        ],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);
      vi.mocked(canvasObjectsService.getCanvasObjects).mockResolvedValue([
        {
          id: 'existing-rect',
          type: 'rectangle',
          x: 50,
          y: 50,
          width: 100,
          height: 100,
          fill: '#FF0000',
          createdBy: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
          lastEditedBy: mockUserId,
        },
      ]);
      vi.mocked(canvasObjectsService.updateShape).mockResolvedValue();

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
          canvasState={canvasState}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Rotate the rectangle 90 degrees{Enter}');

      await waitFor(() => {
        expect(aiService.sendAICommand).toHaveBeenCalledWith(
          'Rotate the rectangle 90 degrees',
          mockCanvasId,
          mockUserId,
          canvasState
        );
        expect(canvasObjectsService.updateShape).toHaveBeenCalledWith(
          mockCanvasId,
          'existing-rect',
          { rotation: 90 },
          mockUserId
        );
      });
    });

    it('should use selected shapes for layout operations', async () => {
      const user = userEvent.setup();

      const canvasState = {
        shapes: [
          {
            id: 'shape-1',
            type: 'rectangle',
            x: 0,
            y: 0,
            width: 100,
            height: 50,
            fill: '#FF0000',
          },
          {
            id: 'shape-2',
            type: 'circle',
            x: 200,
            y: 200,
            width: 80,
            height: 80,
            fill: '#0000FF',
          },
          {
            id: 'shape-3',
            type: 'rectangle',
            x: 400,
            y: 400,
            width: 120,
            height: 60,
            fill: '#00FF00',
          },
        ],
        selectedShapeIds: ['shape-1', 'shape-3'],
      };

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'getSelectedShapes',
            arguments: {
              selectedShapeIds: ['shape-1', 'shape-3'],
            },
          },
          {
            name: 'distributeEvenly',
            arguments: {
              shapeIds: ['shape-1', 'shape-3'],
              direction: 'horizontal',
            },
          },
        ],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);
      vi.mocked(canvasObjectsService.getCanvasObjects).mockResolvedValue([
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
          id: 'shape-3',
          type: 'rectangle',
          x: 400,
          y: 400,
          width: 120,
          height: 60,
          fill: '#00FF00',
          createdBy: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
          lastEditedBy: mockUserId,
        },
      ]);
      vi.mocked(canvasObjectsService.updateShape).mockResolvedValue();

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
          canvasState={canvasState}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Distribute selected shapes evenly{Enter}');

      await waitFor(() => {
        expect(aiService.sendAICommand).toHaveBeenCalledWith(
          'Distribute selected shapes evenly',
          mockCanvasId,
          mockUserId,
          canvasState
        );
      });
    });

    it('should pass comprehensive canvas state for complex operations', async () => {
      const user = userEvent.setup();

      const canvasState = {
        shapes: [
          {
            id: 'red-rect',
            type: 'rectangle',
            x: 0,
            y: 0,
            width: 100,
            height: 50,
            fill: '#FF0000',
          },
          {
            id: 'blue-circle',
            type: 'circle',
            x: 200,
            y: 200,
            width: 80,
            height: 80,
            fill: '#0000FF',
          },
          {
            id: 'green-rect',
            type: 'rectangle',
            x: 400,
            y: 400,
            width: 120,
            height: 60,
            fill: '#00FF00',
          },
        ],
        selectedShapeIds: ['blue-circle'],
      };

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'getShapesByColor',
            arguments: {
              color: 'red',
            },
          },
          {
            name: 'getSelectedShapes',
            arguments: {
              selectedShapeIds: ['blue-circle'],
            },
          },
          {
            name: 'arrangeHorizontally',
            arguments: {
              shapeIds: ['red-rect', 'blue-circle'],
              spacing: 30,
            },
          },
        ],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);
      vi.mocked(canvasObjectsService.getCanvasObjects).mockResolvedValue([
        {
          id: 'red-rect',
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
          id: 'blue-circle',
          type: 'circle',
          x: 200,
          y: 200,
          width: 80,
          height: 80,
          fill: '#0000FF',
          createdBy: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
          lastEditedBy: mockUserId,
        },
      ]);
      vi.mocked(canvasObjectsService.updateShape).mockResolvedValue();

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
          canvasState={canvasState}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Arrange the red shape and selected shape in a row{Enter}');

      await waitFor(() => {
        expect(aiService.sendAICommand).toHaveBeenCalledWith(
          'Arrange the red shape and selected shape in a row',
          mockCanvasId,
          mockUserId,
          canvasState
        );
      });
    });

    it('should handle empty canvas state for new commands', async () => {
      const user = userEvent.setup();

      const canvasState = {
        shapes: [],
        selectedShapeIds: [],
      };

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'createGrid',
            arguments: {
              rows: 3,
              cols: 3,
              shapeType: 'rectangle',
              size: 50,
              spacing: 15,
              color: 'blue',
            },
          },
        ],
      };

      const mockShape: CanvasObject = {
        id: 'new-grid-shape',
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

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);
      vi.mocked(canvasObjectsService.createShape).mockResolvedValue(mockShape);

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
          canvasState={canvasState}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Create a 3x3 grid of blue squares{Enter}');

      await waitFor(() => {
        expect(canvasObjectsService.createShape).toHaveBeenCalledTimes(9);
      });
    });

    it('should use recent shapes when no specific reference is given', async () => {
      const user = userEvent.setup();

      const canvasState = {
        shapes: [
          {
            id: 'old-shape',
            type: 'rectangle',
            x: 0,
            y: 0,
            width: 100,
            height: 50,
            fill: '#FF0000',
          },
          {
            id: 'recent-shape-1',
            type: 'circle',
            x: 200,
            y: 200,
            width: 80,
            height: 80,
            fill: '#0000FF',
          },
          {
            id: 'recent-shape-2',
            type: 'rectangle',
            x: 400,
            y: 400,
            width: 120,
            height: 60,
            fill: '#00FF00',
          },
        ],
        selectedShapeIds: [],
      };

      const mockAIResponse: AICommandResponse = {
        success: true,
        functionCalls: [
          {
            name: 'getRecentShapes',
            arguments: {
              count: 2,
            },
          },
          {
            name: 'updateShapeColor',
            arguments: {
              shapeId: 'recent-shape-1',
              color: 'yellow',
            },
          },
          {
            name: 'updateShapeColor',
            arguments: {
              shapeId: 'recent-shape-2',
              color: 'yellow',
            },
          },
        ],
      };

      vi.mocked(aiService.sendAICommand).mockResolvedValue(mockAIResponse);
      vi.mocked(canvasObjectsService.getCanvasObjects).mockResolvedValue([
        {
          id: 'recent-shape-1',
          type: 'circle',
          x: 200,
          y: 200,
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
          id: 'recent-shape-2',
          type: 'rectangle',
          x: 400,
          y: 400,
          width: 120,
          height: 60,
          fill: '#00FF00',
          createdBy: mockUserId,
          createdAt: new Date('2025-01-03'),
          updatedAt: new Date(),
          version: 1,
          lastEditedBy: mockUserId,
        },
      ]);
      vi.mocked(canvasObjectsService.updateShape).mockResolvedValue();

      render(
        <AICommandInput
          canvasId={mockCanvasId}
          userId={mockUserId}
          userName={mockUserName}
          canvasState={canvasState}
        />
      );

      const input = screen.getByPlaceholderText('Create a red circle...');
      await user.type(input, 'Make those shapes yellow{Enter}');

      await waitFor(() => {
        expect(canvasObjectsService.updateShape).toHaveBeenCalledTimes(2);
      });
    });
  });
});

