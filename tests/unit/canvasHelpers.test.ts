import { describe, it, expect, vi } from 'vitest';
import Konva from 'konva';
import {
  getPointerPosition,
  getRelativePointerPosition,
  constrainZoom,
  generateUniqueId,
} from '../../src/utils/canvasHelpers';
import { MIN_ZOOM, MAX_ZOOM } from '../../src/utils/constants';

describe('canvasHelpers', () => {
  describe('getPointerPosition', () => {
    it('should return pointer position from stage', () => {
      // Mock stage with minimal implementation
      const mockStage = {
        getPointerPosition: vi.fn().mockReturnValue({ x: 100, y: 200 }),
      } as unknown as Konva.Stage;

      const position = getPointerPosition(mockStage);

      expect(position).toEqual({ x: 100, y: 200 });
      expect(mockStage.getPointerPosition).toHaveBeenCalled();
    });

    it('should return null when no pointer position available', () => {
      const mockStage = {
        getPointerPosition: vi.fn().mockReturnValue(null),
      } as unknown as Konva.Stage;

      const position = getPointerPosition(mockStage);

      expect(position).toBeNull();
    });
  });

  describe('getRelativePointerPosition', () => {
    it('should return relative pointer position accounting for transform', () => {
      const mockTransform = {
        copy: vi.fn().mockReturnThis(),
        invert: vi.fn(),
        point: vi.fn().mockReturnValue({ x: 400, y: 300 }),
      };

      const mockStage = {
        getPointerPosition: vi.fn().mockReturnValue({ x: 400, y: 300 }),
        getAbsoluteTransform: vi.fn().mockReturnValue(mockTransform),
      } as unknown as Konva.Stage;

      const position = getRelativePointerPosition(mockStage);

      expect(position).not.toBeNull();
      expect(position).toEqual({ x: 400, y: 300 });
      expect(mockStage.getPointerPosition).toHaveBeenCalled();
      expect(mockStage.getAbsoluteTransform).toHaveBeenCalled();
      expect(mockTransform.copy).toHaveBeenCalled();
      expect(mockTransform.invert).toHaveBeenCalled();
      expect(mockTransform.point).toHaveBeenCalledWith({ x: 400, y: 300 });
    });

    it('should account for stage scale (zoom)', () => {
      const mockTransform = {
        copy: vi.fn().mockReturnThis(),
        invert: vi.fn(),
        point: vi.fn().mockReturnValue({ x: 50, y: 50 }),
      };

      const mockStage = {
        getPointerPosition: vi.fn().mockReturnValue({ x: 100, y: 100 }),
        getAbsoluteTransform: vi.fn().mockReturnValue(mockTransform),
      } as unknown as Konva.Stage;

      const position = getRelativePointerPosition(mockStage);

      expect(position).not.toBeNull();
      // At 2x zoom, screen position (100, 100) should map to canvas position (50, 50)
      expect(position!.x).toBe(50);
      expect(position!.y).toBe(50);
    });

    it('should account for stage position (pan)', () => {
      const mockTransform = {
        copy: vi.fn().mockReturnThis(),
        invert: vi.fn(),
        point: vi.fn().mockReturnValue({ x: 100, y: 100 }),
      };

      const mockStage = {
        getPointerPosition: vi.fn().mockReturnValue({ x: 200, y: 200 }),
        getAbsoluteTransform: vi.fn().mockReturnValue(mockTransform),
      } as unknown as Konva.Stage;

      const position = getRelativePointerPosition(mockStage);

      expect(position).not.toBeNull();
      // With pan offset, screen (200, 200) should map to canvas (100, 100)
      expect(position!.x).toBe(100);
      expect(position!.y).toBe(100);
    });

    it('should account for both scale and position', () => {
      const mockTransform = {
        copy: vi.fn().mockReturnThis(),
        invert: vi.fn(),
        point: vi.fn().mockReturnValue({ x: 200, y: 200 }),
      };

      const mockStage = {
        getPointerPosition: vi.fn().mockReturnValue({ x: 150, y: 150 }),
        getAbsoluteTransform: vi.fn().mockReturnValue(mockTransform),
      } as unknown as Konva.Stage;

      const position = getRelativePointerPosition(mockStage);

      expect(position).not.toBeNull();
      // At 0.5x zoom with (50, 50) pan, screen (150, 150) should map to canvas (200, 200)
      expect(position!.x).toBe(200);
      expect(position!.y).toBe(200);
    });

    it('should return null when no pointer position available', () => {
      const mockStage = {
        getPointerPosition: vi.fn().mockReturnValue(null),
      } as unknown as Konva.Stage;

      const position = getRelativePointerPosition(mockStage);

      expect(position).toBeNull();
    });
  });

  describe('constrainZoom', () => {
    it('should keep zoom within min/max bounds - too low', () => {
      const tooLow = 0.05; // Below MIN_ZOOM (0.1)
      const constrained = constrainZoom(tooLow);

      expect(constrained).toBe(MIN_ZOOM);
    });

    it('should keep zoom within min/max bounds - too high', () => {
      const tooHigh = 5; // Above MAX_ZOOM (3)
      const constrained = constrainZoom(tooHigh);

      expect(constrained).toBe(MAX_ZOOM);
    });

    it('should allow valid zoom values within range', () => {
      const validZooms = [0.1, 0.5, 1, 1.5, 2, 2.5, 3];

      validZooms.forEach(zoom => {
        const constrained = constrainZoom(zoom);
        expect(constrained).toBe(zoom);
      });
    });

    it('should handle exact min and max values', () => {
      expect(constrainZoom(MIN_ZOOM)).toBe(MIN_ZOOM);
      expect(constrainZoom(MAX_ZOOM)).toBe(MAX_ZOOM);
    });

    it('should handle edge cases', () => {
      expect(constrainZoom(0)).toBe(MIN_ZOOM);
      expect(constrainZoom(100)).toBe(MAX_ZOOM);
      expect(constrainZoom(-1)).toBe(MIN_ZOOM);
    });
  });

  describe('generateUniqueId', () => {
    it('should produce unique IDs', () => {
      const id1 = generateUniqueId();
      const id2 = generateUniqueId();
      const id3 = generateUniqueId();

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it('should generate IDs with expected format', () => {
      const id = generateUniqueId();

      // Should be a string
      expect(typeof id).toBe('string');

      // Should contain a hyphen separating timestamp and random part
      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
    });

    it('should generate IDs with timestamp prefix', () => {
      const beforeTimestamp = Date.now();
      const id = generateUniqueId();
      const afterTimestamp = Date.now();

      const [timestampPart] = id.split('-');
      const timestamp = parseInt(timestampPart, 10);

      expect(timestamp).toBeGreaterThanOrEqual(beforeTimestamp);
      expect(timestamp).toBeLessThanOrEqual(afterTimestamp);
    });

    it('should generate multiple unique IDs in rapid succession', () => {
      const ids = new Set();
      const count = 100;

      for (let i = 0; i < count; i++) {
        ids.add(generateUniqueId());
      }

      // All IDs should be unique
      expect(ids.size).toBe(count);
    });
  });
});

