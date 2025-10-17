import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  setActiveEdit,
  clearActiveEdit,
  subscribeToActiveEdits,
} from '../../src/services/activeEdits.service';
import * as firestore from 'firebase/firestore';

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(() => ({ _seconds: Date.now() / 1000 })),
  Timestamp: {
    fromDate: vi.fn((date: Date) => ({
      toDate: () => date,
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0,
    })),
  },
}));

// Mock Firebase app
vi.mock('../../src/services/firebase', () => ({
  db: {},
}));

describe('ActiveEdits Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setActiveEdit', () => {
    it('should write correct data to Firestore', async () => {
      // Arrange
      const mockDocRef = { id: 'mock-doc-ref' };
      vi.mocked(firestore.doc).mockReturnValue(mockDocRef as any);
      vi.mocked(firestore.setDoc).mockResolvedValue(undefined);

      const canvasId = 'canvas-123';
      const shapeId = 'shape-456';
      const userId = 'user-789';
      const userName = 'Alice Smith';
      const color = '#3B82F6';

      // Act
      await setActiveEdit(canvasId, shapeId, userId, userName, color);

      // Assert
      expect(firestore.doc).toHaveBeenCalled();
      expect(firestore.setDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          userId,
          userName,
          color,
          startedAt: expect.any(Object),
          expiresAt: expect.any(Object),
        })
      );
    });

    it('should set expiresAt to 30 seconds from now', async () => {
      // Arrange
      const mockDocRef = { id: 'mock-doc-ref' };
      vi.mocked(firestore.doc).mockReturnValue(mockDocRef as any);
      vi.mocked(firestore.setDoc).mockResolvedValue(undefined);

      const beforeTime = Date.now();

      // Act
      await setActiveEdit('canvas-123', 'shape-456', 'user-789', 'Alice', '#3B82F6');

      // Assert
      expect(firestore.setDoc).toHaveBeenCalled();
      const callArgs = vi.mocked(firestore.setDoc).mock.calls[0][1] as any;
      
      // Check that expiresAt is roughly 30 seconds from startedAt
      const expiresAtTime = callArgs.expiresAt.toDate().getTime();
      const afterTime = Date.now();
      
      // expiresAt should be approximately 30 seconds (30000ms) from now
      // Allow some tolerance for execution time
      expect(expiresAtTime).toBeGreaterThanOrEqual(beforeTime + 29000);
      expect(expiresAtTime).toBeLessThanOrEqual(afterTime + 31000);
    });

    it('should throw error if setDoc fails', async () => {
      // Arrange
      const mockDocRef = { id: 'mock-doc-ref' };
      vi.mocked(firestore.doc).mockReturnValue(mockDocRef as any);
      vi.mocked(firestore.setDoc).mockRejectedValue(new Error('Firestore error'));

      // Act & Assert
      await expect(
        setActiveEdit('canvas-123', 'shape-456', 'user-789', 'Alice', '#3B82F6')
      ).rejects.toThrow('Failed to set active edit');
    });

    it('should include all required fields', async () => {
      // Arrange
      const mockDocRef = { id: 'mock-doc-ref' };
      vi.mocked(firestore.doc).mockReturnValue(mockDocRef as any);
      vi.mocked(firestore.setDoc).mockResolvedValue(undefined);

      // Act
      await setActiveEdit('canvas-123', 'shape-456', 'user-789', 'Bob Johnson', '#FF0000');

      // Assert
      const callArgs = vi.mocked(firestore.setDoc).mock.calls[0][1] as any;
      expect(callArgs).toHaveProperty('userId', 'user-789');
      expect(callArgs).toHaveProperty('userName', 'Bob Johnson');
      expect(callArgs).toHaveProperty('color', '#FF0000');
      expect(callArgs).toHaveProperty('startedAt');
      expect(callArgs).toHaveProperty('expiresAt');
    });
  });

  describe('clearActiveEdit', () => {
    it('should delete document from Firestore', async () => {
      // Arrange
      const mockDocRef = { id: 'mock-doc-ref' };
      vi.mocked(firestore.doc).mockReturnValue(mockDocRef as any);
      vi.mocked(firestore.deleteDoc).mockResolvedValue(undefined);

      const canvasId = 'canvas-123';
      const shapeId = 'shape-456';

      // Act
      await clearActiveEdit(canvasId, shapeId);

      // Assert
      expect(firestore.doc).toHaveBeenCalled();
      expect(firestore.deleteDoc).toHaveBeenCalledWith(mockDocRef);
    });

    it('should not throw error if delete fails (best-effort cleanup)', async () => {
      // Arrange
      const mockDocRef = { id: 'mock-doc-ref' };
      vi.mocked(firestore.doc).mockReturnValue(mockDocRef as any);
      vi.mocked(firestore.deleteDoc).mockRejectedValue(new Error('Document not found'));

      // Act & Assert - should not throw
      await expect(
        clearActiveEdit('canvas-123', 'shape-456')
      ).resolves.toBeUndefined();
    });

    it('should handle missing documents gracefully', async () => {
      // Arrange
      const mockDocRef = { id: 'mock-doc-ref' };
      vi.mocked(firestore.doc).mockReturnValue(mockDocRef as any);
      vi.mocked(firestore.deleteDoc).mockRejectedValue(
        new Error('No document to update')
      );

      // Act & Assert
      await expect(
        clearActiveEdit('canvas-123', 'nonexistent-shape')
      ).resolves.toBeUndefined();
    });
  });

  describe('subscribeToActiveEdits', () => {
    it('should call callback with active edits map', () => {
      // Arrange
      const mockUnsubscribe = vi.fn();
      const mockCallback = vi.fn();

      // Mock snapshot data
      const mockSnapshot = {
        forEach: (fn: (doc: any) => void) => {
          fn({
            id: 'shape-1',
            data: () => ({
              userId: 'user-123',
              userName: 'Alice',
              color: '#3B82F6',
              startedAt: {
                toDate: () => new Date(Date.now() - 5000), // 5 seconds ago
              },
              expiresAt: {
                toDate: () => new Date(Date.now() + 25000), // 25 seconds from now
              },
            }),
          });
          fn({
            id: 'shape-2',
            data: () => ({
              userId: 'user-456',
              userName: 'Bob',
              color: '#FF0000',
              startedAt: {
                toDate: () => new Date(Date.now() - 10000),
              },
              expiresAt: {
                toDate: () => new Date(Date.now() + 20000),
              },
            }),
          });
        },
      };

      vi.mocked(firestore.onSnapshot).mockImplementation(
        (collectionRef: any, onNext: any) => {
          onNext(mockSnapshot);
          return mockUnsubscribe;
        }
      );

      // Act
      const unsubscribe = subscribeToActiveEdits('canvas-123', mockCallback);

      // Assert
      expect(firestore.onSnapshot).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith(expect.any(Map));
      
      const activeEditsMap = mockCallback.mock.calls[0][0] as Map<string, any>;
      expect(activeEditsMap.size).toBe(2);
      expect(activeEditsMap.has('shape-1')).toBe(true);
      expect(activeEditsMap.has('shape-2')).toBe(true);
      expect(activeEditsMap.get('shape-1')?.userName).toBe('Alice');
      expect(activeEditsMap.get('shape-2')?.userName).toBe('Bob');
      
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should filter out expired edits (client-side check)', () => {
      // Arrange
      const mockUnsubscribe = vi.fn();
      const mockCallback = vi.fn();

      // Mock snapshot with one expired edit
      const mockSnapshot = {
        forEach: (fn: (doc: any) => void) => {
          // Valid edit
          fn({
            id: 'shape-1',
            data: () => ({
              userId: 'user-123',
              userName: 'Alice',
              color: '#3B82F6',
              startedAt: {
                toDate: () => new Date(Date.now() - 5000),
              },
              expiresAt: {
                toDate: () => new Date(Date.now() + 25000), // Future - valid
              },
            }),
          });
          // Expired edit
          fn({
            id: 'shape-2',
            data: () => ({
              userId: 'user-456',
              userName: 'Bob',
              color: '#FF0000',
              startedAt: {
                toDate: () => new Date(Date.now() - 40000),
              },
              expiresAt: {
                toDate: () => new Date(Date.now() - 10000), // Past - expired
              },
            }),
          });
        },
      };

      vi.mocked(firestore.onSnapshot).mockImplementation(
        (collectionRef: any, onNext: any) => {
          onNext(mockSnapshot);
          return mockUnsubscribe;
        }
      );

      // Act
      subscribeToActiveEdits('canvas-123', mockCallback);

      // Assert
      const activeEditsMap = mockCallback.mock.calls[0][0] as Map<string, any>;
      expect(activeEditsMap.size).toBe(1); // Only valid edit
      expect(activeEditsMap.has('shape-1')).toBe(true);
      expect(activeEditsMap.has('shape-2')).toBe(false); // Expired edit filtered out
    });

    it('should return unsubscribe function', () => {
      // Arrange
      const mockUnsubscribe = vi.fn();
      vi.mocked(firestore.onSnapshot).mockReturnValue(mockUnsubscribe);

      // Act
      const unsubscribe = subscribeToActiveEdits('canvas-123', vi.fn());

      // Assert
      expect(typeof unsubscribe).toBe('function');
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should handle subscription errors gracefully', () => {
      // Arrange
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();

      vi.mocked(firestore.onSnapshot).mockImplementation(
        (collectionRef: any, onNext: any, onError: any) => {
          // Trigger error callback
          onError(new Error('Subscription error'));
          return mockUnsubscribe;
        }
      );

      // Act
      subscribeToActiveEdits('canvas-123', mockCallback);

      // Assert - should call callback with empty map on error
      expect(mockCallback).toHaveBeenCalledWith(expect.any(Map));
      const activeEditsMap = mockCallback.mock.calls[0][0] as Map<string, any>;
      expect(activeEditsMap.size).toBe(0);
    });

    it('should validate data structure before adding to map', () => {
      // Arrange
      const mockUnsubscribe = vi.fn();
      const mockCallback = vi.fn();

      // Mock snapshot with invalid data
      const mockSnapshot = {
        forEach: (fn: (doc: any) => void) => {
          // Valid edit
          fn({
            id: 'shape-1',
            data: () => ({
              userId: 'user-123',
              userName: 'Alice',
              color: '#3B82F6',
              startedAt: {
                toDate: () => new Date(Date.now() - 5000),
              },
              expiresAt: {
                toDate: () => new Date(Date.now() + 25000),
              },
            }),
          });
          // Invalid edit (missing fields)
          fn({
            id: 'shape-2',
            data: () => ({
              userId: 'user-456',
              // Missing userName, color, timestamps
            }),
          });
        },
      };

      vi.mocked(firestore.onSnapshot).mockImplementation(
        (collectionRef: any, onNext: any) => {
          onNext(mockSnapshot);
          return mockUnsubscribe;
        }
      );

      // Act
      subscribeToActiveEdits('canvas-123', mockCallback);

      // Assert - only valid edit should be in map
      const activeEditsMap = mockCallback.mock.calls[0][0] as Map<string, any>;
      expect(activeEditsMap.size).toBe(1);
      expect(activeEditsMap.has('shape-1')).toBe(true);
      expect(activeEditsMap.has('shape-2')).toBe(false);
    });

    it('should scope active-edits per canvas (isolation)', () => {
      // Arrange
      const mockUnsubscribe = vi.fn();
      const mockCallback1 = vi.fn();
      const mockCallback2 = vi.fn();

      vi.mocked(firestore.collection).mockImplementation((db: any, path: string) => {
        return { path } as any;
      });

      vi.mocked(firestore.onSnapshot).mockReturnValue(mockUnsubscribe);

      // Act
      subscribeToActiveEdits('canvas-A', mockCallback1);
      subscribeToActiveEdits('canvas-B', mockCallback2);

      // Assert - should call collection with different paths
      const collectionCalls = vi.mocked(firestore.collection).mock.calls;
      expect(collectionCalls.length).toBeGreaterThanOrEqual(2);
      
      // Check that collections are scoped per canvas
      const paths = collectionCalls.map((call) => call[1]);
      expect(paths).toContain('active-edits/canvas-A/shapes');
      expect(paths).toContain('active-edits/canvas-B/shapes');
    });
  });
});

