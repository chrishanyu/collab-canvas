/**
 * Unit Tests for Canvas Objects Service - Batch Operations
 * 
 * Tests batch write functionality for creating multiple shapes efficiently
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createShapesBatch } from './canvasObjects.service';
import { writeBatch, doc } from 'firebase/firestore';
import type { CanvasObject } from '../types';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  writeBatch: vi.fn(),
  serverTimestamp: vi.fn(() => 'TIMESTAMP_PLACEHOLDER'),
}));

vi.mock('./firebase', () => ({
  db: {},
}));

describe('Canvas Objects Service - Batch Operations', () => {
  const mockCanvasId = 'test-canvas';
  const mockUserId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createShapesBatch', () => {
    it('should create multiple shapes in a single batch', async () => {
      const mockCommit = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn();
      const mockBatch = {
        set: mockSet,
        commit: mockCommit,
      };

      vi.mocked(writeBatch).mockReturnValue(mockBatch as any);
      vi.mocked(doc).mockImplementation((() => ({
        id: `shape-${Math.random()}`,
      })) as any);

      const shapes: Array<Omit<CanvasObject, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'lastEditedBy'>> = [
        {
          type: 'rectangle',
          x: 0,
          y: 0,
          width: 100,
          height: 50,
          fill: '#FF0000',
          createdBy: mockUserId,
        },
        {
          type: 'circle',
          x: 100,
          y: 100,
          width: 75,
          height: 75,
          fill: '#00FF00',
          createdBy: mockUserId,
        },
        {
          type: 'rectangle',
          x: 200,
          y: 200,
          width: 120,
          height: 80,
          fill: '#0000FF',
          createdBy: mockUserId,
        },
      ];

      const result = await createShapesBatch(mockCanvasId, shapes);

      // Should return correct number of shapes
      expect(result).toHaveLength(3);
      
      // Should call batch.set for each shape
      expect(mockSet).toHaveBeenCalledTimes(3);
      
      // Should commit once
      expect(mockCommit).toHaveBeenCalledTimes(1);

      // Each returned shape should have required properties
      result.forEach((shape, index) => {
        expect(shape.id).toBeDefined();
        expect(shape.type).toBe(shapes[index].type);
        expect(shape.x).toBe(shapes[index].x);
        expect(shape.y).toBe(shapes[index].y);
        expect(shape.width).toBe(shapes[index].width);
        expect(shape.height).toBe(shapes[index].height);
        expect(shape.fill).toBe(shapes[index].fill);
        expect(shape.version).toBe(1);
        expect(shape.createdBy).toBe(mockUserId);
      });
    });

    it('should return empty array for empty input', async () => {
      const result = await createShapesBatch(mockCanvasId, []);
      expect(result).toEqual([]);
    });

    it('should handle shapes with optional properties', async () => {
      const mockCommit = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn();
      const mockBatch = {
        set: mockSet,
        commit: mockCommit,
      };

      vi.mocked(writeBatch).mockReturnValue(mockBatch as any);
      vi.mocked(doc).mockImplementation((() => ({
        id: 'shape-with-options',
      })) as any);

      const shapes: Array<Omit<CanvasObject, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'lastEditedBy'>> = [
        {
          type: 'rectangle',
          x: 0,
          y: 0,
          width: 100,
          height: 50,
          fill: '#FF0000',
          stroke: '#000000',
          strokeWidth: 2,
          rotation: 45,
          text: 'Hello',
          textFormat: { fontSize: 16, fontFamily: 'Arial' },
          createdBy: mockUserId,
        },
      ];

      const result = await createShapesBatch(mockCanvasId, shapes);

      expect(result).toHaveLength(1);
      expect(result[0].stroke).toBe('#000000');
      expect(result[0].strokeWidth).toBe(2);
      expect(result[0].rotation).toBe(45);
      expect(result[0].text).toBe('Hello');
      expect(result[0].textFormat).toEqual({ fontSize: 16, fontFamily: 'Arial' });
    });

    it('should use custom IDs if provided', async () => {
      const mockCommit = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn();
      const mockBatch = {
        set: mockSet,
        commit: mockCommit,
      };

      vi.mocked(writeBatch).mockReturnValue(mockBatch as any);
      
      const customIds = ['custom-id-1', 'custom-id-2'];
      vi.mocked(doc).mockImplementation(((_, customId) => ({
        id: customId || 'generated-id',
      })) as any);

      const shapes: Array<Omit<CanvasObject, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'lastEditedBy'>> = [
        {
          type: 'rectangle',
          x: 0,
          y: 0,
          width: 100,
          height: 50,
          fill: '#FF0000',
          createdBy: mockUserId,
        },
        {
          type: 'circle',
          x: 100,
          y: 100,
          width: 75,
          height: 75,
          fill: '#00FF00',
          createdBy: mockUserId,
        },
      ];

      const result = await createShapesBatch(mockCanvasId, shapes, customIds);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('custom-id-1');
      expect(result[1].id).toBe('custom-id-2');
    });

    it('should reject batches larger than 500 shapes', async () => {
      const shapes: Array<Omit<CanvasObject, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'lastEditedBy'>> = 
        Array.from({ length: 501 }, (_, i) => ({
          type: 'rectangle',
          x: i,
          y: i,
          width: 50,
          height: 50,
          fill: '#FF0000',
          createdBy: mockUserId,
        }));

      await expect(
        createShapesBatch(mockCanvasId, shapes)
      ).rejects.toThrow();
    });

    it('should handle batch commit failure', async () => {
      const mockCommit = vi.fn().mockRejectedValue(new Error('Firebase error'));
      const mockSet = vi.fn();
      const mockBatch = {
        set: mockSet,
        commit: mockCommit,
      };

      vi.mocked(writeBatch).mockReturnValue(mockBatch as any);
      vi.mocked(doc).mockImplementation((() => ({
        id: 'shape-id',
      })) as any);

      const shapes: Array<Omit<CanvasObject, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'lastEditedBy'>> = [
        {
          type: 'rectangle',
          x: 0,
          y: 0,
          width: 100,
          height: 50,
          fill: '#FF0000',
          createdBy: mockUserId,
        },
      ];

      await expect(
        createShapesBatch(mockCanvasId, shapes)
      ).rejects.toThrow('Failed to create shapes in batch');
    });

    it('should set default zIndex to 0 for all shapes', async () => {
      const mockCommit = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn();
      const mockBatch = {
        set: mockSet,
        commit: mockCommit,
      };

      vi.mocked(writeBatch).mockReturnValue(mockBatch as any);
      vi.mocked(doc).mockImplementation((() => ({
        id: 'shape-id',
      })) as any);

      const shapes: Array<Omit<CanvasObject, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'lastEditedBy'>> = [
        {
          type: 'rectangle',
          x: 0,
          y: 0,
          width: 100,
          height: 50,
          fill: '#FF0000',
          createdBy: mockUserId,
        },
      ];

      const result = await createShapesBatch(mockCanvasId, shapes);

      expect(result[0].zIndex).toBe(0);
    });

    it('should set version to 1 for all new shapes', async () => {
      const mockCommit = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn();
      const mockBatch = {
        set: mockSet,
        commit: mockCommit,
      };

      vi.mocked(writeBatch).mockReturnValue(mockBatch as any);
      vi.mocked(doc).mockImplementation((() => ({
        id: 'shape-id',
      })) as any);

      const shapes: Array<Omit<CanvasObject, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'lastEditedBy'>> = [
        {
          type: 'rectangle',
          x: 0,
          y: 0,
          width: 100,
          height: 50,
          fill: '#FF0000',
          createdBy: mockUserId,
        },
        {
          type: 'circle',
          x: 100,
          y: 100,
          width: 75,
          height: 75,
          fill: '#00FF00',
          createdBy: mockUserId,
        },
      ];

      const result = await createShapesBatch(mockCanvasId, shapes);

      result.forEach(shape => {
        expect(shape.version).toBe(1);
      });
    });

    it('should set lastEditedBy to creator for all new shapes', async () => {
      const mockCommit = vi.fn().mockResolvedValue(undefined);
      const mockSet = vi.fn();
      const mockBatch = {
        set: mockSet,
        commit: mockCommit,
      };

      vi.mocked(writeBatch).mockReturnValue(mockBatch as any);
      vi.mocked(doc).mockImplementation((() => ({
        id: 'shape-id',
      })) as any);

      const shapes: Array<Omit<CanvasObject, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'lastEditedBy'>> = [
        {
          type: 'rectangle',
          x: 0,
          y: 0,
          width: 100,
          height: 50,
          fill: '#FF0000',
          createdBy: mockUserId,
        },
      ];

      const result = await createShapesBatch(mockCanvasId, shapes);

      expect(result[0].lastEditedBy).toBe(mockUserId);
    });
  });
});

