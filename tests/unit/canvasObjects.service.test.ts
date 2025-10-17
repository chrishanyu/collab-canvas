import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockSetDoc,
  mockGetDoc,
  mockGetDocs,
  mockUpdateDoc,
  mockDeleteDoc,
  mockOnSnapshot,
  mockDoc,
  mockCollection,
  mockQuery,
  mockOrderBy,
  mockTimestamp,
  mockIncrement,
  MockTimestamp,
  resetAllMocks,
} from '../mocks/firebase.mock';

// Import after mocks are set up
import {
  subscribeToCanvasObjects,
  getCanvasObjects,
  createShape,
  updateShape,
  deleteShape,
} from '../../src/services/canvasObjects.service';

describe('Canvas Objects Service', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.clearAllMocks();
  });

  describe('createShape', () => {
    it('should create shape with correct structure in the right canvas', async () => {
      // Arrange
      const canvasId = 'canvas-123';
      const shape = {
        type: 'rectangle' as const,
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        fill: '#3B82F6',
        createdBy: 'user-123',
      };
      
      const mockShapeRef = { id: 'shape-abc123' };
      mockCollection.mockReturnValue({ docs: [] });
      mockDoc.mockReturnValue(mockShapeRef);
      mockSetDoc.mockResolvedValue(undefined);

      // Act
      const result = await createShape(canvasId, shape);

      // Assert
      expect(mockCollection).toHaveBeenCalledWith(
        expect.anything(),
        'canvas-objects',
        canvasId,
        'objects'
      );
      expect(mockDoc).toHaveBeenCalled();
      expect(mockSetDoc).toHaveBeenCalledWith(
        mockShapeRef,
        expect.objectContaining({
          id: 'shape-abc123',
          type: 'rectangle',
          x: 100,
          y: 200,
          width: 150,
          height: 100,
          fill: '#3B82F6',
          createdBy: 'user-123',
        })
      );
      expect(result).toEqual({
        id: 'shape-abc123',
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        fill: '#3B82F6',
        createdBy: 'user-123',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        version: 1,
        lastEditedBy: 'user-123',
      });
    });

    it('should generate unique shape IDs', async () => {
      // Arrange
      const canvasId = 'canvas-123';
      const shape = {
        type: 'rectangle' as const,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        fill: '#000000',
        createdBy: 'user-123',
      };
      
      const mockShapeRef1 = { id: 'shape-unique-1' };
      const mockShapeRef2 = { id: 'shape-unique-2' };
      
      mockCollection.mockReturnValue({ docs: [] });
      mockDoc
        .mockReturnValueOnce(mockShapeRef1)
        .mockReturnValueOnce(mockShapeRef2);
      mockSetDoc.mockResolvedValue(undefined);

      // Act
      const result1 = await createShape(canvasId, shape);
      const result2 = await createShape(canvasId, shape);

      // Assert
      expect(result1.id).toBe('shape-unique-1');
      expect(result2.id).toBe('shape-unique-2');
      expect(result1.id).not.toBe(result2.id);
    });

    it('should throw error if shape creation fails', async () => {
      // Arrange
      const canvasId = 'canvas-123';
      const shape = {
        type: 'rectangle' as const,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        fill: '#000000',
        createdBy: 'user-123',
      };
      
      mockCollection.mockReturnValue({ docs: [] });
      mockDoc.mockReturnValue({ id: 'shape-123' });
      mockSetDoc.mockRejectedValue(new Error('Firestore error'));

      // Act & Assert
      await expect(createShape(canvasId, shape)).rejects.toThrow(
        'Failed to create shape'
      );
    });

    it('should create shapes in different canvases independently', async () => {
      // Arrange
      const canvasIdA = 'canvas-A';
      const canvasIdB = 'canvas-B';
      const shape = {
        type: 'rectangle' as const,
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        fill: '#000000',
        createdBy: 'user-123',
      };
      
      mockCollection.mockReturnValue({ docs: [] });
      mockDoc.mockReturnValue({ id: 'shape-123' });
      mockSetDoc.mockResolvedValue(undefined);

      // Act
      await createShape(canvasIdA, shape);
      await createShape(canvasIdB, shape);

      // Assert - should be called with different canvas IDs
      expect(mockCollection).toHaveBeenCalledWith(
        expect.anything(),
        'canvas-objects',
        canvasIdA,
        'objects'
      );
      expect(mockCollection).toHaveBeenCalledWith(
        expect.anything(),
        'canvas-objects',
        canvasIdB,
        'objects'
      );
    });
  });

  describe('updateShape', () => {
    it('should update existing shape with new data', async () => {
      // Arrange
      const canvasId = 'canvas-123';
      const shapeId = 'shape-abc123';
      const updates = {
        x: 250,
        y: 350,
      };
      
      const mockShapeRef = { id: shapeId };
      mockDoc.mockReturnValue(mockShapeRef);
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: shapeId,
        data: () => ({
          id: shapeId,
          type: 'rectangle',
          x: 100,
          y: 200,
          width: 150,
          height: 100,
          fill: '#3B82F6',
        }),
      });
      mockUpdateDoc.mockResolvedValue(undefined);

      // Act
      await updateShape(canvasId, shapeId, updates);

      // Assert
      expect(mockDoc).toHaveBeenCalledWith(
        expect.anything(),
        'canvas-objects',
        canvasId,
        'objects',
        shapeId
      );
      expect(mockGetDoc).toHaveBeenCalled();
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        mockShapeRef,
        expect.objectContaining({
          x: 250,
          y: 350,
        })
      );
    });

    it('should update shape in correct canvas', async () => {
      // Arrange
      const canvasId = 'canvas-456';
      const shapeId = 'shape-xyz';
      const updates = { fill: '#FF0000' };
      
      mockDoc.mockReturnValue({ id: shapeId });
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({}),
      });
      mockUpdateDoc.mockResolvedValue(undefined);

      // Act
      await updateShape(canvasId, shapeId, updates);

      // Assert
      expect(mockDoc).toHaveBeenCalledWith(
        expect.anything(),
        'canvas-objects',
        canvasId,
        'objects',
        shapeId
      );
    });

    it('should throw error if shape does not exist', async () => {
      // Arrange
      const canvasId = 'canvas-123';
      const shapeId = 'nonexistent-shape';
      const updates = { x: 100 };
      
      mockDoc.mockReturnValue({ id: shapeId });
      mockGetDoc.mockResolvedValue({
        exists: () => false,
      });

      // Act & Assert
      await expect(updateShape(canvasId, shapeId, updates)).rejects.toThrow(
        'Shape nonexistent-shape not found in canvas canvas-123'
      );
    });

    it('should throw error if update fails', async () => {
      // Arrange
      const canvasId = 'canvas-123';
      const shapeId = 'shape-abc123';
      const updates = { x: 100 };
      
      mockDoc.mockReturnValue({ id: shapeId });
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({}),
      });
      mockUpdateDoc.mockRejectedValue(new Error('Firestore error'));

      // Act & Assert
      await expect(updateShape(canvasId, shapeId, updates)).rejects.toThrow(
        'Failed to update shape'
      );
    });
  });

  describe('deleteShape', () => {
    it('should delete shape from correct canvas', async () => {
      // Arrange
      const canvasId = 'canvas-123';
      const shapeId = 'shape-abc123';
      
      const mockShapeRef = { id: shapeId };
      mockDoc.mockReturnValue(mockShapeRef);
      mockDeleteDoc.mockResolvedValue(undefined);

      // Act
      await deleteShape(canvasId, shapeId);

      // Assert
      expect(mockDoc).toHaveBeenCalledWith(
        expect.anything(),
        'canvas-objects',
        canvasId,
        'objects',
        shapeId
      );
      expect(mockDeleteDoc).toHaveBeenCalledWith(mockShapeRef);
    });

    it('should delete shapes from different canvases independently', async () => {
      // Arrange
      const canvasIdA = 'canvas-A';
      const canvasIdB = 'canvas-B';
      const shapeId = 'shape-123';
      
      mockDoc.mockReturnValue({ id: shapeId });
      mockDeleteDoc.mockResolvedValue(undefined);

      // Act
      await deleteShape(canvasIdA, shapeId);
      await deleteShape(canvasIdB, shapeId);

      // Assert
      expect(mockDoc).toHaveBeenCalledWith(
        expect.anything(),
        'canvas-objects',
        canvasIdA,
        'objects',
        shapeId
      );
      expect(mockDoc).toHaveBeenCalledWith(
        expect.anything(),
        'canvas-objects',
        canvasIdB,
        'objects',
        shapeId
      );
    });

    it('should throw error if delete fails', async () => {
      // Arrange
      const canvasId = 'canvas-123';
      const shapeId = 'shape-abc123';
      
      mockDoc.mockReturnValue({ id: shapeId });
      mockDeleteDoc.mockRejectedValue(new Error('Firestore error'));

      // Act & Assert
      await expect(deleteShape(canvasId, shapeId)).rejects.toThrow(
        'Failed to delete shape'
      );
    });
  });

  describe('getCanvasObjects', () => {
    it('should fetch all objects for a specific canvas', async () => {
      // Arrange
      const canvasId = 'canvas-123';
      const mockShape1 = {
        id: 'shape-1',
        data: () => ({
          type: 'rectangle',
          x: 100,
          y: 200,
          width: 150,
          height: 100,
          fill: '#3B82F6',
          createdBy: 'user-123',
          createdAt: new MockTimestamp(1640000000, 0),
          updatedAt: new MockTimestamp(1640000000, 0),
        }),
      };
      const mockShape2 = {
        id: 'shape-2',
        data: () => ({
          type: 'circle',
          x: 300,
          y: 400,
          width: 80,
          height: 80,
          fill: '#EF4444',
          createdBy: 'user-456',
          createdAt: new MockTimestamp(1640100000, 0),
          updatedAt: new MockTimestamp(1640100000, 0),
        }),
      };
      
      mockCollection.mockReturnValue({ path: 'objects' });
      mockQuery.mockReturnValue({});
      mockOrderBy.mockReturnValue({});
      mockGetDocs.mockResolvedValue({
        forEach: (callback: (doc: any) => void) => {
          callback(mockShape1);
          callback(mockShape2);
        },
      });

      // Act
      const result = await getCanvasObjects(canvasId);

      // Assert
      expect(mockCollection).toHaveBeenCalledWith(
        expect.anything(),
        'canvas-objects',
        canvasId,
        'objects'
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'shape-1',
        type: 'rectangle',
        x: 100,
        y: 200,
        width: 150,
        height: 100,
        fill: '#3B82F6',
        createdBy: 'user-123',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        version: 1, // Default for backward compatibility
        lastEditedBy: undefined, // Not present in mock data
      });
      expect(result[1].id).toBe('shape-2');
    });

    it('should return empty array if canvas has no objects', async () => {
      // Arrange
      const canvasId = 'empty-canvas';
      
      mockCollection.mockReturnValue({ path: 'objects' });
      mockQuery.mockReturnValue({});
      mockOrderBy.mockReturnValue({});
      mockGetDocs.mockResolvedValue({
        forEach: (callback: (doc: any) => void) => {
          // No objects
        },
      });

      // Act
      const result = await getCanvasObjects(canvasId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should convert Firestore Timestamps to Date objects', async () => {
      // Arrange
      const canvasId = 'canvas-123';
      const createdTimestamp = new MockTimestamp(1640000000, 0);
      const updatedTimestamp = new MockTimestamp(1640100000, 0);
      
      const mockShape = {
        id: 'shape-1',
        data: () => ({
          type: 'rectangle',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          fill: '#000000',
          createdBy: 'user-123',
          createdAt: createdTimestamp,
          updatedAt: updatedTimestamp,
        }),
      };
      
      mockCollection.mockReturnValue({ path: 'objects' });
      mockQuery.mockReturnValue({});
      mockOrderBy.mockReturnValue({});
      mockGetDocs.mockResolvedValue({
        forEach: (callback: (doc: any) => void) => {
          callback(mockShape);
        },
      });

      // Act
      const result = await getCanvasObjects(canvasId);

      // Assert
      expect(result[0].createdAt).toBeInstanceOf(Date);
      expect(result[0].updatedAt).toBeInstanceOf(Date);
    });

    it('should throw error if fetch fails', async () => {
      // Arrange
      const canvasId = 'canvas-123';
      
      mockCollection.mockReturnValue({ path: 'objects' });
      mockQuery.mockReturnValue({});
      mockOrderBy.mockReturnValue({});
      mockGetDocs.mockRejectedValue(new Error('Firestore error'));

      // Act & Assert
      await expect(getCanvasObjects(canvasId)).rejects.toThrow(
        'Failed to fetch canvas objects'
      );
    });
  });

  describe('subscribeToCanvasObjects', () => {
    it('should subscribe to objects in correct canvas', () => {
      // Arrange
      const canvasId = 'canvas-123';
      const callback = vi.fn();
      const mockUnsubscribe = vi.fn();
      
      mockCollection.mockReturnValue({ path: 'objects' });
      mockQuery.mockReturnValue({});
      mockOrderBy.mockReturnValue({});
      mockOnSnapshot.mockReturnValue(mockUnsubscribe);

      // Act
      const unsubscribe = subscribeToCanvasObjects(canvasId, callback);

      // Assert
      expect(mockCollection).toHaveBeenCalledWith(
        expect.anything(),
        'canvas-objects',
        canvasId,
        'objects'
      );
      expect(mockOnSnapshot).toHaveBeenCalled();
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should call callback with objects when snapshot updates', () => {
      // Arrange
      const canvasId = 'canvas-123';
      const callback = vi.fn();
      let snapshotCallback: ((snapshot: any) => void) | undefined;
      
      mockCollection.mockReturnValue({ path: 'objects' });
      mockQuery.mockReturnValue({});
      mockOrderBy.mockReturnValue({});
      mockOnSnapshot.mockImplementation((query, onNext) => {
        snapshotCallback = onNext;
        return vi.fn();
      });

      // Act
      subscribeToCanvasObjects(canvasId, callback);
      
      // Simulate Firestore snapshot
      const mockSnapshot = {
        forEach: (cb: (doc: any) => void) => {
          cb({
            id: 'shape-1',
            data: () => ({
              type: 'rectangle',
              x: 100,
              y: 200,
              width: 150,
              height: 100,
              fill: '#3B82F6',
              createdBy: 'user-123',
              createdAt: mockTimestamp,
              updatedAt: mockTimestamp,
            }),
          });
        },
      };
      
      snapshotCallback?.(mockSnapshot);

      // Assert
      expect(callback).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 'shape-1',
          type: 'rectangle',
          x: 100,
          y: 200,
        }),
      ]);
    });

    it('should handle subscription errors gracefully', () => {
      // Arrange
      const canvasId = 'canvas-123';
      const callback = vi.fn();
      let errorCallback: ((error: any) => void) | undefined;
      
      mockCollection.mockReturnValue({ path: 'objects' });
      mockQuery.mockReturnValue({});
      mockOrderBy.mockReturnValue({});
      mockOnSnapshot.mockImplementation((query, onNext, onError) => {
        errorCallback = onError;
        return vi.fn();
      });

      // Act
      subscribeToCanvasObjects(canvasId, callback);
      errorCallback?.(new Error('Firestore error'));

      // Assert - should call callback with empty array on error
      expect(callback).toHaveBeenCalledWith([]);
    });

    it('should isolate subscriptions per canvas', () => {
      // Arrange
      const canvasIdA = 'canvas-A';
      const canvasIdB = 'canvas-B';
      const callbackA = vi.fn();
      const callbackB = vi.fn();
      
      mockCollection.mockReturnValue({ path: 'objects' });
      mockQuery.mockReturnValue({});
      mockOrderBy.mockReturnValue({});
      mockOnSnapshot.mockReturnValue(vi.fn());

      // Act
      subscribeToCanvasObjects(canvasIdA, callbackA);
      subscribeToCanvasObjects(canvasIdB, callbackB);

      // Assert - should be called with different canvas IDs
      expect(mockCollection).toHaveBeenCalledWith(
        expect.anything(),
        'canvas-objects',
        canvasIdA,
        'objects'
      );
      expect(mockCollection).toHaveBeenCalledWith(
        expect.anything(),
        'canvas-objects',
        canvasIdB,
        'objects'
      );
    });
  });

  describe('Version Tracking', () => {
    describe('createShape - version tracking', () => {
      it('should set initial version to 1 when creating a shape', async () => {
        // Arrange
        const canvasId = 'canvas-123';
        const shape = {
          type: 'rectangle' as const,
          x: 100,
          y: 200,
          width: 150,
          height: 100,
          fill: '#3B82F6',
          createdBy: 'user-123',
        };
        
        const mockShapeRef = { id: 'shape-abc123' };
        mockCollection.mockReturnValue({ docs: [] });
        mockDoc.mockReturnValue(mockShapeRef);
        mockSetDoc.mockResolvedValue(undefined);

        // Act
        await createShape(canvasId, shape);

        // Assert - verify version is set to 1
        expect(mockSetDoc).toHaveBeenCalledWith(
          mockShapeRef,
          expect.objectContaining({
            version: 1,
          })
        );
      });

      it('should set lastEditedBy to creator when creating a shape', async () => {
        // Arrange
        const canvasId = 'canvas-123';
        const userId = 'user-456';
        const shape = {
          type: 'circle' as const,
          x: 50,
          y: 75,
          width: 100,
          height: 100,
          fill: '#FF5733',
          createdBy: userId,
        };
        
        const mockShapeRef = { id: 'shape-xyz789' };
        mockCollection.mockReturnValue({ docs: [] });
        mockDoc.mockReturnValue(mockShapeRef);
        mockSetDoc.mockResolvedValue(undefined);

        // Act
        await createShape(canvasId, shape);

        // Assert - verify lastEditedBy is set to creator
        expect(mockSetDoc).toHaveBeenCalledWith(
          mockShapeRef,
          expect.objectContaining({
            lastEditedBy: userId,
          })
        );
      });

      it('should include both version and lastEditedBy in created shape', async () => {
        // Arrange
        const canvasId = 'canvas-123';
        const userId = 'user-789';
        const shape = {
          type: 'rectangle' as const,
          x: 10,
          y: 20,
          width: 30,
          height: 40,
          fill: '#00FF00',
          createdBy: userId,
        };
        
        const mockShapeRef = { id: 'shape-new' };
        mockCollection.mockReturnValue({ docs: [] });
        mockDoc.mockReturnValue(mockShapeRef);
        mockSetDoc.mockResolvedValue(undefined);

        // Act
        await createShape(canvasId, shape);

        // Assert - verify both fields are present
        expect(mockSetDoc).toHaveBeenCalledWith(
          mockShapeRef,
          expect.objectContaining({
            version: 1,
            lastEditedBy: userId,
          })
        );
      });
    });

    describe('updateShape - version tracking', () => {
      it('should increment version using Firestore increment()', async () => {
        // Arrange
        const canvasId = 'canvas-123';
        const shapeId = 'shape-abc';
        const updates = { x: 150, y: 250 };
        const userId = 'user-123';

        mockDoc.mockReturnValue({ id: shapeId });
        mockGetDoc.mockResolvedValue({
          exists: () => true,
          data: () => ({ version: 2 }),
        });
        mockUpdateDoc.mockResolvedValue(undefined);

        // Act
        await updateShape(canvasId, shapeId, updates, userId);

        // Assert - verify increment(1) was called
        expect(mockIncrement).toHaveBeenCalledWith(1);
        
        // Verify updateDoc was called with the increment result
        expect(mockUpdateDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            version: { _increment: 1 }, // This is what mockIncrement returns
          })
        );
      });

      it('should set lastEditedBy to the user making the update', async () => {
        // Arrange
        const canvasId = 'canvas-123';
        const shapeId = 'shape-xyz';
        const updates = { fill: '#FF0000' };
        const userId = 'user-456';

        mockDoc.mockReturnValue({ id: shapeId });
        mockGetDoc.mockResolvedValue({
          exists: () => true,
          data: () => ({}),
        });
        mockUpdateDoc.mockResolvedValue(undefined);

        // Act
        await updateShape(canvasId, shapeId, updates, userId);

        // Assert - verify lastEditedBy is set
        expect(mockUpdateDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            lastEditedBy: userId,
          })
        );
      });

      it('should not set lastEditedBy if userId is not provided', async () => {
        // Arrange
        const canvasId = 'canvas-123';
        const shapeId = 'shape-xyz';
        const updates = { x: 100 };

        mockDoc.mockReturnValue({ id: shapeId });
        mockGetDoc.mockResolvedValue({
          exists: () => true,
          data: () => ({}),
        });
        mockUpdateDoc.mockResolvedValue(undefined);

        // Act
        await updateShape(canvasId, shapeId, updates); // No userId

        // Assert - verify lastEditedBy is not in the update
        const updateCall = mockUpdateDoc.mock.calls[0][1] as Record<string, any>;
        expect(updateCall).not.toHaveProperty('lastEditedBy');
        // But version should still be incremented
        expect(updateCall.version).toEqual({ _increment: 1 });
      });

      it('should include both version increment and lastEditedBy in update', async () => {
        // Arrange
        const canvasId = 'canvas-123';
        const shapeId = 'shape-abc';
        const updates = { x: 200, y: 300, width: 100 };
        const userId = 'user-999';

        mockDoc.mockReturnValue({ id: shapeId });
        mockGetDoc.mockResolvedValue({
          exists: () => true,
          data: () => ({ version: 5 }),
        });
        mockUpdateDoc.mockResolvedValue(undefined);

        // Act
        await updateShape(canvasId, shapeId, updates, userId);

        // Assert - verify both version and lastEditedBy are included
        expect(mockUpdateDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            version: { _increment: 1 },
            lastEditedBy: userId,
            ...updates,
          })
        );
      });

      it('should preserve other update data while adding version tracking', async () => {
        // Arrange
        const canvasId = 'canvas-123';
        const shapeId = 'shape-test';
        const updates = {
          x: 50,
          y: 75,
          width: 200,
          height: 150,
          fill: '#BLUE',
        };
        const userId = 'user-abc';

        mockDoc.mockReturnValue({ id: shapeId });
        mockGetDoc.mockResolvedValue({
          exists: () => true,
          data: () => ({}),
        });
        mockUpdateDoc.mockResolvedValue(undefined);

        // Act
        await updateShape(canvasId, shapeId, updates, userId);

        // Assert - verify all original updates are preserved
        expect(mockUpdateDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            x: 50,
            y: 75,
            width: 200,
            height: 150,
            fill: '#BLUE',
            version: { _increment: 1 },
            lastEditedBy: userId,
          })
        );
      });
    });
  });
});

