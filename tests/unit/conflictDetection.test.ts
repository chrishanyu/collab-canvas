import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateShape } from '../../src/services/canvasObjects.service';
import { ConflictError } from '../../src/types';

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(() => ({ id: 'mock-doc-id' })),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(() => 'mock-timestamp'),
  increment: vi.fn((value) => `increment(${value})`),
  Timestamp: {
    fromDate: vi.fn((date) => date),
    now: vi.fn(() => new Date()),
  },
  query: vi.fn(),
  orderBy: vi.fn(),
  getDocs: vi.fn(),
}));

// Mock firebase initialization
vi.mock('../../src/services/firebase', () => ({
  db: {},
}));

// Get mocked functions
import { getDoc, updateDoc } from 'firebase/firestore';

const mockGetDoc = getDoc as unknown as ReturnType<typeof vi.fn>;
const mockUpdateDoc = updateDoc as unknown as ReturnType<typeof vi.fn>;

describe('Conflict Detection - Version Checking', () => {
  const canvasId = 'test-canvas';
  const shapeId = 'test-shape';
  const userId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateShape with version checking', () => {
    it('should succeed when versions match', async () => {
      // Arrange: Mock shape with version 5
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          id: shapeId,
          version: 5,
          lastEditedBy: 'user-456',
          x: 100,
          y: 100,
        }),
      });

      mockUpdateDoc.mockResolvedValueOnce(undefined);

      // Act: Update with matching local version
      await updateShape(canvasId, shapeId, { x: 150, y: 150 }, userId, 5);

      // Assert: Update should proceed
      expect(mockGetDoc).toHaveBeenCalledTimes(1);
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          x: 150,
          y: 150,
          updatedAt: 'mock-timestamp',
          version: 'increment(1)',
          lastEditedBy: userId,
        })
      );
    });

    it('should throw ConflictError when versions mismatch', async () => {
      // Arrange: Mock shape with version 7 (server)
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          id: shapeId,
          version: 7,
          lastEditedBy: 'user-789',
          lastEditedByName: 'Alice Smith',
          x: 100,
          y: 100,
        }),
      });

      // Act & Assert: Update with version 5 (local) should throw ConflictError
      await expect(
        updateShape(canvasId, shapeId, { x: 150, y: 150 }, userId, 5)
      ).rejects.toThrow(ConflictError);

      // Verify update was NOT called
      expect(mockUpdateDoc).not.toHaveBeenCalled();
    });

    it('should include all conflict details in ConflictError', async () => {
      // Arrange: Mock shape data
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          id: shapeId,
          version: 10,
          lastEditedBy: 'user-999',
          lastEditedByName: 'Bob Johnson',
          x: 100,
          y: 100,
        }),
      });

      // Act: Trigger conflict
      try {
        await updateShape(canvasId, shapeId, { x: 150, y: 150 }, userId, 8);
        expect.fail('Should have thrown ConflictError');
      } catch (error) {
        // Assert: Verify ConflictError details
        expect(error).toBeInstanceOf(ConflictError);
        
        if (error instanceof ConflictError) {
          expect(error.shapeId).toBe(shapeId);
          expect(error.localVersion).toBe(8);
          expect(error.serverVersion).toBe(10);
          expect(error.lastEditedBy).toBe('user-999');
          expect(error.lastEditedByName).toBe('Bob Johnson');
          expect(error.message).toContain('Bob Johnson');
          expect(error.message).toContain('8');
          expect(error.message).toContain('10');
        }
      }
    });

    it('should proceed normally when localVersion is not provided', async () => {
      // Arrange: Mock shape
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          id: shapeId,
          version: 5,
          lastEditedBy: 'user-456',
          x: 100,
          y: 100,
        }),
      });

      mockUpdateDoc.mockResolvedValueOnce(undefined);

      // Act: Update without version (backward compatible)
      await updateShape(canvasId, shapeId, { x: 150, y: 150 }, userId);

      // Assert: Should succeed without version checking
      expect(mockGetDoc).toHaveBeenCalledTimes(1);
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    });

    it('should handle missing version field (backward compatibility)', async () => {
      // Arrange: Mock old shape without version field
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          id: shapeId,
          // No version field
          lastEditedBy: 'user-456',
          x: 100,
          y: 100,
        }),
      });

      mockUpdateDoc.mockResolvedValueOnce(undefined);

      // Act: Update with localVersion 1 (should match default)
      await updateShape(canvasId, shapeId, { x: 150, y: 150 }, userId, 1);

      // Assert: Should succeed (defaults to version 1)
      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictError when old shape (no version) conflicts', async () => {
      // Arrange: Mock old shape without version field
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          id: shapeId,
          // No version field (defaults to 1)
          lastEditedBy: 'user-456',
          x: 100,
          y: 100,
        }),
      });

      // Act & Assert: Update with localVersion 5 should conflict (server defaults to 1)
      await expect(
        updateShape(canvasId, shapeId, { x: 150, y: 150 }, userId, 5)
      ).rejects.toThrow(ConflictError);

      expect(mockUpdateDoc).not.toHaveBeenCalled();
    });

    it('should distinguish ConflictError from other Firestore errors', async () => {
      // Arrange: Mock shape (normal case)
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          id: shapeId,
          version: 5,
          lastEditedBy: 'user-456',
          x: 100,
          y: 100,
        }),
      });

      // Mock Firestore error (not a conflict)
      mockUpdateDoc.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert: Should throw generic Error, not ConflictError
      await expect(
        updateShape(canvasId, shapeId, { x: 150, y: 150 }, userId, 5)
      ).rejects.toThrow('Failed to update shape');

      // Should NOT throw ConflictError
      await expect(
        updateShape(canvasId, shapeId, { x: 150, y: 150 }, userId, 5)
      ).rejects.not.toThrow(ConflictError);
    });

    it('should throw error when shape does not exist', async () => {
      // Arrange: Mock non-existent shape
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
      });

      // Act & Assert: Should throw "not found" error
      await expect(
        updateShape(canvasId, shapeId, { x: 150, y: 150 }, userId, 5)
      ).rejects.toThrow(`Shape ${shapeId} not found`);

      expect(mockUpdateDoc).not.toHaveBeenCalled();
    });

    it('should use "unknown" when lastEditedBy is missing', async () => {
      // Arrange: Mock shape without lastEditedBy
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          id: shapeId,
          version: 3,
          // No lastEditedBy field
          x: 100,
          y: 100,
        }),
      });

      // Act: Trigger conflict
      try {
        await updateShape(canvasId, shapeId, { x: 150, y: 150 }, userId, 1);
        expect.fail('Should have thrown ConflictError');
      } catch (error) {
        // Assert: Should default to "unknown"
        expect(error).toBeInstanceOf(ConflictError);
        
        if (error instanceof ConflictError) {
          expect(error.lastEditedBy).toBe('unknown');
        }
      }
    });
  });

  describe('ConflictError type', () => {
    it('should be distinguishable from generic Error', () => {
      const conflictError = new ConflictError(
        'shape-1',
        5,
        10,
        'user-123',
        'Alice'
      );
      const genericError = new Error('Generic error');

      expect(conflictError).toBeInstanceOf(ConflictError);
      expect(conflictError).toBeInstanceOf(Error);
      expect(genericError).not.toBeInstanceOf(ConflictError);
    });

    it('should have correct error name', () => {
      const conflictError = new ConflictError(
        'shape-1',
        5,
        10,
        'user-123'
      );

      expect(conflictError.name).toBe('ConflictError');
    });

    it('should generate user-friendly message', () => {
      const conflictError = new ConflictError(
        'shape-abc',
        2,
        7,
        'user-456',
        'Charlie Brown'
      );

      expect(conflictError.message).toContain('shape-abc');
      expect(conflictError.message).toContain('Charlie Brown');
      expect(conflictError.message).toContain('2');
      expect(conflictError.message).toContain('7');
    });

    it('should fall back to userId when name not provided', () => {
      const conflictError = new ConflictError(
        'shape-xyz',
        1,
        3,
        'user-789'
        // No name provided
      );

      expect(conflictError.message).toContain('user-789');
      expect(conflictError.lastEditedByName).toBeUndefined();
    });
  });
});

