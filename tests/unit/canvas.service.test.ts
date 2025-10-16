import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockSetDoc,
  mockGetDoc,
  mockGetDocs,
  mockDeleteDoc,
  mockDoc,
  mockCollection,
  mockQuery,
  mockWhere,
  mockTimestamp,
  mockWriteBatch,
  mockBatch,
  MockTimestamp,
  resetAllMocks,
} from '../mocks/firebase.mock';

// Import after mocks are set up
import {
  createCanvas,
  getCanvasById,
  getUserCanvases,
  updateCanvasAccess,
  generateShareLink,
  deleteCanvas,
} from '../../src/services/canvas.service';

describe('Canvas Service', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.clearAllMocks();
    // Mock window.location.origin for generateShareLink
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'https://test-app.com',
      },
      writable: true,
    });
  });

  describe('createCanvas', () => {
    it('should create canvas with correct metadata structure', async () => {
      // Arrange
      const name = 'My Design Canvas';
      const ownerId = 'user-123';
      const ownerName = 'John Doe';
      
      const mockCanvasRef = { id: 'canvas-abc123' };
      mockCollection.mockReturnValue({ docs: [] });
      mockDoc.mockReturnValue(mockCanvasRef);
      mockSetDoc.mockResolvedValue(undefined);

      // Act
      const result = await createCanvas(name, ownerId, ownerName);

      // Assert
      expect(mockDoc).toHaveBeenCalled();
      expect(mockSetDoc).toHaveBeenCalledWith(
        mockCanvasRef,
        expect.objectContaining({
          id: 'canvas-abc123',
          name: 'My Design Canvas',
          ownerId: 'user-123',
          ownerName: 'John Doe',
        })
      );
      expect(result).toEqual({
        id: 'canvas-abc123',
        name: 'My Design Canvas',
        ownerId: 'user-123',
        ownerName: 'John Doe',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should use default name "Untitled Canvas" if name is empty', async () => {
      // Arrange
      const name = '';
      const ownerId = 'user-123';
      const ownerName = 'John Doe';
      
      const mockCanvasRef = { id: 'canvas-xyz789' };
      mockCollection.mockReturnValue({ docs: [] });
      mockDoc.mockReturnValue(mockCanvasRef);
      mockSetDoc.mockResolvedValue(undefined);

      // Act
      const result = await createCanvas(name, ownerId, ownerName);

      // Assert
      expect(result.name).toBe('Untitled Canvas');
    });

    it('should use default name if name is only whitespace', async () => {
      // Arrange
      const name = '   ';
      const ownerId = 'user-123';
      const ownerName = 'John Doe';
      
      const mockCanvasRef = { id: 'canvas-xyz789' };
      mockCollection.mockReturnValue({ docs: [] });
      mockDoc.mockReturnValue(mockCanvasRef);
      mockSetDoc.mockResolvedValue(undefined);

      // Act
      const result = await createCanvas(name, ownerId, ownerName);

      // Assert
      expect(result.name).toBe('Untitled Canvas');
    });

    it('should automatically add canvas to owner access list', async () => {
      // Arrange
      const name = 'Test Canvas';
      const ownerId = 'user-123';
      const ownerName = 'John Doe';
      
      const mockCanvasRef = { id: 'canvas-abc123' };
      mockCollection.mockReturnValue({ docs: [] });
      mockDoc.mockReturnValue(mockCanvasRef);
      mockSetDoc.mockResolvedValue(undefined);

      // Act
      await createCanvas(name, ownerId, ownerName);

      // Assert - should be called twice (once for canvas, once for access)
      expect(mockSetDoc).toHaveBeenCalledTimes(2);
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          canvasId: 'canvas-abc123',
          role: 'owner',
        })
      );
    });

    it('should throw error if canvas creation fails', async () => {
      // Arrange
      const name = 'Test Canvas';
      const ownerId = 'user-123';
      const ownerName = 'John Doe';
      
      mockCollection.mockReturnValue({ docs: [] });
      mockDoc.mockReturnValue({ id: 'canvas-abc123' });
      mockSetDoc.mockRejectedValue(new Error('Firestore error'));

      // Act & Assert
      await expect(createCanvas(name, ownerId, ownerName)).rejects.toThrow(
        'Failed to create canvas'
      );
    });

    it('should generate unique canvas IDs', async () => {
      // Arrange
      const mockCanvasRef1 = { id: 'canvas-unique-1' };
      const mockCanvasRef2 = { id: 'canvas-unique-2' };
      
      mockCollection.mockReturnValue({ docs: [] });
      mockDoc
        .mockReturnValueOnce(mockCanvasRef1)
        .mockReturnValueOnce({ id: 'access-1' })
        .mockReturnValueOnce(mockCanvasRef2)
        .mockReturnValueOnce({ id: 'access-2' });
      mockSetDoc.mockResolvedValue(undefined);

      // Act
      const result1 = await createCanvas('Canvas 1', 'user-1', 'User One');
      const result2 = await createCanvas('Canvas 2', 'user-2', 'User Two');

      // Assert
      expect(result1.id).toBe('canvas-unique-1');
      expect(result2.id).toBe('canvas-unique-2');
      expect(result1.id).not.toBe(result2.id);
    });
  });

  describe('getCanvasById', () => {
    it('should retrieve canvas by ID', async () => {
      // Arrange
      const canvasId = 'canvas-abc123';
      const mockCanvasData = {
        name: 'Test Canvas',
        ownerId: 'user-123',
        ownerName: 'John Doe',
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
      };
      
      mockDoc.mockReturnValue({ id: canvasId });
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: canvasId,
        data: () => mockCanvasData,
      });

      // Act
      const result = await getCanvasById(canvasId);

      // Assert
      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'canvases', canvasId);
      expect(mockGetDoc).toHaveBeenCalled();
      expect(result).toEqual({
        id: canvasId,
        name: 'Test Canvas',
        ownerId: 'user-123',
        ownerName: 'John Doe',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        thumbnail: undefined,
      });
    });

    it('should return null if canvas does not exist', async () => {
      // Arrange
      const canvasId = 'nonexistent-canvas';
      
      mockDoc.mockReturnValue({ id: canvasId });
      mockGetDoc.mockResolvedValue({
        exists: () => false,
        id: canvasId,
        data: () => null,
      });

      // Act
      const result = await getCanvasById(canvasId);

      // Assert
      expect(result).toBeNull();
    });

    it('should convert Firestore Timestamps to Date objects', async () => {
      // Arrange
      const canvasId = 'canvas-abc123';
      const createdTimestamp = new MockTimestamp(1640000000, 0);
      const updatedTimestamp = new MockTimestamp(1640100000, 0);
      
      const mockCanvasData = {
        name: 'Test Canvas',
        ownerId: 'user-123',
        ownerName: 'John Doe',
        createdAt: createdTimestamp,
        updatedAt: updatedTimestamp,
      };
      
      mockDoc.mockReturnValue({ id: canvasId });
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: canvasId,
        data: () => mockCanvasData,
      });

      // Act
      const result = await getCanvasById(canvasId);

      // Assert
      expect(result?.createdAt).toBeInstanceOf(Date);
      expect(result?.updatedAt).toBeInstanceOf(Date);
    });

    it('should include thumbnail if present', async () => {
      // Arrange
      const canvasId = 'canvas-abc123';
      const mockCanvasData = {
        name: 'Test Canvas',
        ownerId: 'user-123',
        ownerName: 'John Doe',
        createdAt: mockTimestamp,
        updatedAt: mockTimestamp,
        thumbnail: 'https://example.com/thumb.jpg',
      };
      
      mockDoc.mockReturnValue({ id: canvasId });
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: canvasId,
        data: () => mockCanvasData,
      });

      // Act
      const result = await getCanvasById(canvasId);

      // Assert
      expect(result?.thumbnail).toBe('https://example.com/thumb.jpg');
    });

    it('should throw error if fetching fails', async () => {
      // Arrange
      const canvasId = 'canvas-abc123';
      
      mockDoc.mockReturnValue({ id: canvasId });
      mockGetDoc.mockRejectedValue(new Error('Firestore error'));

      // Act & Assert
      await expect(getCanvasById(canvasId)).rejects.toThrow(
        'Failed to fetch canvas'
      );
    });
  });

  describe('getUserCanvases', () => {
    it('should return all canvases for a user', async () => {
      // Arrange
      const userId = 'user-123';
      const mockUserCanvases = {
        empty: false,
        docs: [
          { id: 'canvas-1' },
          { id: 'canvas-2' },
        ],
      };
      
      const mockCanvas1 = {
        id: 'canvas-1',
        data: () => ({
          name: 'Canvas 1',
          ownerId: userId,
          ownerName: 'John Doe',
          createdAt: new MockTimestamp(1640000000, 0),
          updatedAt: new MockTimestamp(1640200000, 0),
        }),
      };
      
      const mockCanvas2 = {
        id: 'canvas-2',
        data: () => ({
          name: 'Canvas 2',
          ownerId: userId,
          ownerName: 'John Doe',
          createdAt: new MockTimestamp(1640100000, 0),
          updatedAt: new MockTimestamp(1640100000, 0),
        }),
      };
      
      mockCollection.mockReturnValue({ path: 'user-canvases' });
      mockGetDocs
        .mockResolvedValueOnce(mockUserCanvases)
        .mockResolvedValueOnce({
          forEach: (callback: (doc: any) => void) => {
            callback(mockCanvas1);
            callback(mockCanvas2);
          },
        });
      mockQuery.mockReturnValue({});
      mockWhere.mockReturnValue({});

      // Act
      const result = await getUserCanvases(userId);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Canvas 1');
      expect(result[1].name).toBe('Canvas 2');
    });

    it('should return empty array if user has no canvases', async () => {
      // Arrange
      const userId = 'user-123';
      
      mockCollection.mockReturnValue({ path: 'user-canvases' });
      mockGetDocs.mockResolvedValue({
        empty: true,
        docs: [],
      });

      // Act
      const result = await getUserCanvases(userId);

      // Assert
      expect(result).toEqual([]);
    });

    it('should sort canvases by updatedAt (newest first)', async () => {
      // Arrange
      const userId = 'user-123';
      const mockUserCanvases = {
        empty: false,
        docs: [
          { id: 'canvas-old' },
          { id: 'canvas-new' },
        ],
      };
      
      const mockCanvasOld = {
        id: 'canvas-old',
        data: () => ({
          name: 'Old Canvas',
          ownerId: userId,
          ownerName: 'John Doe',
          createdAt: new MockTimestamp(1640000000, 0),
          updatedAt: new MockTimestamp(1640000000, 0), // Older
        }),
      };
      
      const mockCanvasNew = {
        id: 'canvas-new',
        data: () => ({
          name: 'New Canvas',
          ownerId: userId,
          ownerName: 'John Doe',
          createdAt: new MockTimestamp(1640100000, 0),
          updatedAt: new MockTimestamp(1640200000, 0), // Newer
        }),
      };
      
      mockCollection.mockReturnValue({ path: 'user-canvases' });
      mockGetDocs
        .mockResolvedValueOnce(mockUserCanvases)
        .mockResolvedValueOnce({
          forEach: (callback: (doc: any) => void) => {
            callback(mockCanvasOld);
            callback(mockCanvasNew);
          },
        });
      mockQuery.mockReturnValue({});
      mockWhere.mockReturnValue({});

      // Act
      const result = await getUserCanvases(userId);

      // Assert
      expect(result[0].name).toBe('New Canvas'); // Newest first
      expect(result[1].name).toBe('Old Canvas');
    });

    it('should handle batches for more than 10 canvases', async () => {
      // Arrange
      const userId = 'user-123';
      const canvasIds = Array.from({ length: 15 }, (_, i) => `canvas-${i}`);
      const mockUserCanvases = {
        empty: false,
        docs: canvasIds.map(id => ({ id })),
      };
      
      mockCollection.mockReturnValue({ path: 'user-canvases' });
      mockGetDocs.mockResolvedValueOnce(mockUserCanvases);
      
      // Mock two batches (10 + 5)
      mockGetDocs
        .mockResolvedValueOnce({
          forEach: (callback: (doc: any) => void) => {
            for (let i = 0; i < 10; i++) {
              callback({
                id: `canvas-${i}`,
                data: () => ({
                  name: `Canvas ${i}`,
                  ownerId: userId,
                  ownerName: 'John Doe',
                  createdAt: new MockTimestamp(1640000000 + i, 0),
                  updatedAt: new MockTimestamp(1640000000 + i, 0),
                }),
              });
            }
          },
        })
        .mockResolvedValueOnce({
          forEach: (callback: (doc: any) => void) => {
            for (let i = 10; i < 15; i++) {
              callback({
                id: `canvas-${i}`,
                data: () => ({
                  name: `Canvas ${i}`,
                  ownerId: userId,
                  ownerName: 'John Doe',
                  createdAt: new MockTimestamp(1640000000 + i, 0),
                  updatedAt: new MockTimestamp(1640000000 + i, 0),
                }),
              });
            }
          },
        });
      
      mockQuery.mockReturnValue({});
      mockWhere.mockReturnValue({});

      // Act
      const result = await getUserCanvases(userId);

      // Assert
      expect(result).toHaveLength(15);
      expect(mockQuery).toHaveBeenCalledTimes(2); // Two batches
    });

    it('should throw error if fetching fails', async () => {
      // Arrange
      const userId = 'user-123';
      
      mockCollection.mockReturnValue({ path: 'user-canvases' });
      mockGetDocs.mockRejectedValue(new Error('Firestore error'));

      // Act & Assert
      await expect(getUserCanvases(userId)).rejects.toThrow(
        'Failed to fetch user canvases'
      );
    });
  });

  describe('updateCanvasAccess', () => {
    it('should add canvas to user access list as owner', async () => {
      // Arrange
      const userId = 'user-123';
      const canvasId = 'canvas-abc123';
      const role = 'owner';
      
      mockDoc.mockReturnValue({ id: 'access-doc' });
      mockSetDoc.mockResolvedValue(undefined);

      // Act
      await updateCanvasAccess(userId, canvasId, role);

      // Assert
      expect(mockDoc).toHaveBeenCalledWith(
        expect.anything(),
        'user-canvases',
        userId,
        'canvases',
        canvasId
      );
      expect(mockSetDoc).toHaveBeenCalledWith(
        { id: 'access-doc' },
        expect.objectContaining({
          canvasId: 'canvas-abc123',
          role: 'owner',
        })
      );
    });

    it('should add canvas to user access list as collaborator', async () => {
      // Arrange
      const userId = 'user-456';
      const canvasId = 'canvas-abc123';
      const role = 'collaborator';
      
      mockDoc.mockReturnValue({ id: 'access-doc' });
      mockSetDoc.mockResolvedValue(undefined);

      // Act
      await updateCanvasAccess(userId, canvasId, role);

      // Assert
      expect(mockSetDoc).toHaveBeenCalledWith(
        { id: 'access-doc' },
        expect.objectContaining({
          canvasId: 'canvas-abc123',
          role: 'collaborator',
        })
      );
    });

    it('should throw error if update fails', async () => {
      // Arrange
      const userId = 'user-123';
      const canvasId = 'canvas-abc123';
      const role = 'owner';
      
      mockDoc.mockReturnValue({ id: 'access-doc' });
      mockSetDoc.mockRejectedValue(new Error('Firestore error'));

      // Act & Assert
      await expect(updateCanvasAccess(userId, canvasId, role)).rejects.toThrow(
        'Failed to update canvas access'
      );
    });
  });

  describe('generateShareLink', () => {
    it('should generate correct shareable URL', () => {
      // Arrange
      const canvasId = 'canvas-abc123';

      // Act
      const result = generateShareLink(canvasId);

      // Assert
      expect(result).toBe('https://test-app.com/canvas/canvas-abc123');
    });

    it('should use current window origin', () => {
      // Arrange
      Object.defineProperty(window, 'location', {
        value: {
          origin: 'https://production-app.com',
        },
        writable: true,
      });
      const canvasId = 'canvas-xyz789';

      // Act
      const result = generateShareLink(canvasId);

      // Assert
      expect(result).toBe('https://production-app.com/canvas/canvas-xyz789');
    });

    it('should handle different canvas IDs', () => {
      // Arrange
      const canvasId1 = 'short-id';
      const canvasId2 = 'very-long-canvas-id-with-many-characters-123';

      // Act
      const result1 = generateShareLink(canvasId1);
      const result2 = generateShareLink(canvasId2);

      // Assert
      expect(result1).toBe('https://test-app.com/canvas/short-id');
      expect(result2).toBe('https://test-app.com/canvas/very-long-canvas-id-with-many-characters-123');
    });
  });

  describe('deleteCanvas', () => {
    it('should successfully delete canvas document', async () => {
      // Arrange
      const canvasId = 'canvas-abc123';
      const userId = 'user-123';
      
      const mockCanvasData = {
        name: 'Test Canvas',
        ownerId: userId,
        ownerName: 'John Doe',
      };
      
      mockDoc.mockReturnValue({ id: canvasId });
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockCanvasData,
      });
      mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
      mockDeleteDoc.mockResolvedValue(undefined);

      // Act
      await deleteCanvas(canvasId, userId);

      // Assert
      expect(mockDeleteDoc).toHaveBeenCalledWith({ id: canvasId });
    });

    it('should delete all canvas objects using batch', async () => {
      // Arrange
      const canvasId = 'canvas-abc123';
      const userId = 'user-123';
      
      const mockCanvasData = {
        name: 'Test Canvas',
        ownerId: userId,
      };
      
      const mockObject1 = { ref: { id: 'obj-1' } };
      const mockObject2 = { ref: { id: 'obj-2' } };
      const mockObject3 = { ref: { id: 'obj-3' } };
      
      mockDoc.mockReturnValue({ id: canvasId });
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockCanvasData,
      });
      mockCollection.mockReturnValue({ path: 'canvas-objects' });
      mockGetDocs.mockResolvedValueOnce({
        empty: false,
        docs: [mockObject1, mockObject2, mockObject3],
      });
      mockWriteBatch.mockReturnValue(mockBatch);
      mockDeleteDoc.mockResolvedValue(undefined);

      // Act
      await deleteCanvas(canvasId, userId);

      // Assert
      expect(mockWriteBatch).toHaveBeenCalled();
      expect(mockBatch.delete).toHaveBeenCalledTimes(3);
      expect(mockBatch.delete).toHaveBeenCalledWith(mockObject1.ref);
      expect(mockBatch.delete).toHaveBeenCalledWith(mockObject2.ref);
      expect(mockBatch.delete).toHaveBeenCalledWith(mockObject3.ref);
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should delete user access records', async () => {
      // Arrange
      const canvasId = 'canvas-abc123';
      const userId = 'user-123';
      
      const mockCanvasData = {
        name: 'Test Canvas',
        ownerId: userId,
      };
      
      mockDoc.mockReturnValue({ id: 'mock-doc' });
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockCanvasData,
      });
      mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
      mockDeleteDoc.mockResolvedValue(undefined);

      // Act
      await deleteCanvas(canvasId, userId);

      // Assert
      // Should be called twice: once for canvas, once for user access
      expect(mockDeleteDoc).toHaveBeenCalledTimes(2);
    });

    it('should throw error if user is not owner', async () => {
      // Arrange
      const canvasId = 'canvas-abc123';
      const userId = 'user-123';
      const differentUserId = 'user-456';
      
      const mockCanvasData = {
        name: 'Test Canvas',
        ownerId: differentUserId, // Different owner
        ownerName: 'Jane Doe',
      };
      
      mockDoc.mockReturnValue({ id: canvasId });
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockCanvasData,
      });

      // Act & Assert
      await expect(deleteCanvas(canvasId, userId)).rejects.toThrow(
        'Only the canvas owner can delete this canvas'
      );
      expect(mockDeleteDoc).not.toHaveBeenCalled();
    });

    it('should throw error if canvas does not exist', async () => {
      // Arrange
      const canvasId = 'nonexistent-canvas';
      const userId = 'user-123';
      
      mockDoc.mockReturnValue({ id: canvasId });
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
        data: () => null,
      });

      // Act & Assert
      await expect(deleteCanvas(canvasId, userId)).rejects.toThrow(
        'Canvas not found'
      );
      expect(mockDeleteDoc).not.toHaveBeenCalled();
    });

    it('should handle Firestore errors gracefully (network failure)', async () => {
      // Arrange
      const canvasId = 'canvas-abc123';
      const userId = 'user-123';
      
      mockDoc.mockReturnValue({ id: canvasId });
      mockGetDoc.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(deleteCanvas(canvasId, userId)).rejects.toThrow();
    });

    it('should throw appropriate error if batch delete fails', async () => {
      // Arrange
      const canvasId = 'canvas-abc123';
      const userId = 'user-123';
      
      const mockCanvasData = {
        name: 'Test Canvas',
        ownerId: userId,
      };
      
      const mockObject1 = { ref: { id: 'obj-1' } };
      
      mockDoc.mockReturnValue({ id: canvasId });
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockCanvasData,
      });
      mockCollection.mockReturnValue({ path: 'canvas-objects' });
      mockGetDocs.mockResolvedValueOnce({
        empty: false,
        docs: [mockObject1],
      });
      mockWriteBatch.mockReturnValue(mockBatch);
      mockBatch.commit.mockRejectedValue(new Error('Batch commit failed'));

      // Act & Assert
      await expect(deleteCanvas(canvasId, userId)).rejects.toThrow();
    });

    it('should handle case with zero objects gracefully', async () => {
      // Arrange
      const canvasId = 'canvas-abc123';
      const userId = 'user-123';
      
      const mockCanvasData = {
        name: 'Empty Canvas',
        ownerId: userId,
      };
      
      mockDoc.mockReturnValue({ id: canvasId });
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockCanvasData,
      });
      mockGetDocs.mockResolvedValue({
        empty: true,
        docs: [],
      });
      mockDeleteDoc.mockResolvedValue(undefined);

      // Act
      await deleteCanvas(canvasId, userId);

      // Assert
      expect(mockWriteBatch).not.toHaveBeenCalled();
      expect(mockBatch.delete).not.toHaveBeenCalled();
      expect(mockDeleteDoc).toHaveBeenCalledTimes(2); // Canvas and user access
    });

    it('should handle case with 100+ objects (batch limits)', async () => {
      // Arrange
      const canvasId = 'canvas-abc123';
      const userId = 'user-123';
      
      const mockCanvasData = {
        name: 'Large Canvas',
        ownerId: userId,
      };
      
      // Create 100+ mock objects
      const mockObjects = Array.from({ length: 150 }, (_, i) => ({
        ref: { id: `obj-${i}` },
      }));
      
      mockDoc.mockReturnValue({ id: canvasId });
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockCanvasData,
      });
      mockCollection.mockReturnValue({ path: 'canvas-objects' });
      mockGetDocs.mockResolvedValueOnce({
        empty: false,
        docs: mockObjects,
      });
      mockWriteBatch.mockReturnValue(mockBatch);
      mockDeleteDoc.mockResolvedValue(undefined);

      // Act
      await deleteCanvas(canvasId, userId);

      // Assert
      expect(mockBatch.delete).toHaveBeenCalledTimes(150);
      expect(mockBatch.commit).toHaveBeenCalled();
    });

    it('should not fail if user access cleanup fails', async () => {
      // Arrange
      const canvasId = 'canvas-abc123';
      const userId = 'user-123';
      
      const mockCanvasData = {
        name: 'Test Canvas',
        ownerId: userId,
      };
      
      mockDoc.mockReturnValue({ id: canvasId });
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockCanvasData,
      });
      mockGetDocs.mockResolvedValue({ empty: true, docs: [] });
      mockDeleteDoc
        .mockResolvedValueOnce(undefined) // Canvas deletion succeeds
        .mockRejectedValueOnce(new Error('Access cleanup failed')); // User access fails

      // Act & Assert - should not throw
      await expect(deleteCanvas(canvasId, userId)).resolves.not.toThrow();
    });
  });
});

