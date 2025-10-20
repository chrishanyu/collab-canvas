import { describe, it, expect, vi, beforeEach } from 'vitest';
import Konva from 'konva';
import {
  getPointerPosition,
  getRelativePointerPosition,
  constrainZoom,
  generateUniqueId,
  calculateTextHeight,
  wrapText,
  getTextMetrics,
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

  describe('Text Helper Functions', () => {
    // Mock canvas context for text measurement
    let mockContext: any;
    let mockCanvas: any;

    beforeEach(() => {
      // Mock measureText to return predictable widths
      mockContext = {
        font: '',
        measureText: vi.fn((text: string) => ({
          width: text.length * 10, // 10px per character (simple mock)
        })),
      };

      mockCanvas = {
        getContext: vi.fn(() => mockContext),
      };

      // Mock document.createElement for canvas
      vi.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);
    });

    describe('calculateTextHeight', () => {
      it('should return single line height for empty text', () => {
        const height = calculateTextHeight('', 200, 16, 'Arial');
        
        // Empty text should return one line: fontSize * lineHeight (16 * 1.2)
        expect(height).toBe(16 * 1.2);
      });

      it('should calculate height for single line text', () => {
        const text = 'Hello';
        const height = calculateTextHeight(text, 200, 16, 'Arial');
        
        // Single line: 16 * 1.2 = 19.2
        expect(height).toBe(16 * 1.2);
      });

      it('should calculate height for text that wraps', () => {
        // Text that exceeds width and should wrap
        const text = 'This is a very long line of text that will wrap';
        // With 10px per character, this is 480px wide
        // Width is 200px, so it will wrap into multiple lines
        
        const height = calculateTextHeight(text, 200, 16, 'Arial');
        
        // Should be more than one line
        expect(height).toBeGreaterThan(16 * 1.2);
      });

      it('should handle text with explicit newlines', () => {
        const text = 'Line 1\nLine 2\nLine 3';
        const height = calculateTextHeight(text, 200, 16, 'Arial', 1.2);
        
        // 3 lines * (16 * 1.2) = 57.6
        expect(height).toBe(3 * 16 * 1.2);
      });

      it('should use custom line height multiplier', () => {
        const text = 'Hello';
        const height = calculateTextHeight(text, 200, 16, 'Arial', 1.5);
        
        // Single line with 1.5 line height: 16 * 1.5 = 24
        expect(height).toBe(16 * 1.5);
      });

      it('should handle empty lines in text', () => {
        const text = 'Line 1\n\nLine 3';
        const height = calculateTextHeight(text, 200, 16, 'Arial', 1.2);
        
        // 3 lines (including empty line): 3 * 16 * 1.2
        expect(height).toBe(3 * 16 * 1.2);
      });
    });

    describe('wrapText', () => {
      it('should return empty array for empty text', () => {
        const lines = wrapText('', 200, 16, 'Arial');
        
        expect(lines).toEqual(['']);
      });

      it('should not wrap short text', () => {
        const text = 'Hello';
        const lines = wrapText(text, 200, 16, 'Arial');
        
        // 'Hello' is 50px wide, fits in 200px
        expect(lines).toEqual(['Hello']);
      });

      it('should wrap long text into multiple lines', () => {
        // Each word is 10-30px, sentence is > 200px
        const text = 'This is a very long line that will wrap';
        const lines = wrapText(text, 200, 16, 'Arial');
        
        // Should wrap into multiple lines
        expect(lines.length).toBeGreaterThan(1);
        
        // Each line should be an array element
        lines.forEach(line => {
          expect(typeof line).toBe('string');
        });
      });

      it('should preserve explicit newlines', () => {
        const text = 'Line 1\nLine 2\nLine 3';
        const lines = wrapText(text, 200, 16, 'Arial');
        
        // Should have at least 3 lines
        expect(lines.length).toBeGreaterThanOrEqual(3);
      });

      it('should handle text with empty lines', () => {
        const text = 'Line 1\n\nLine 3';
        const lines = wrapText(text, 200, 16, 'Arial');
        
        // Should preserve empty line
        expect(lines.length).toBe(3);
        expect(lines[1]).toBe('');
      });

      it('should wrap each word if it exceeds width', () => {
        const text = 'Hello World';
        const lines = wrapText(text, 50, 16, 'Arial');
        
        // 'Hello' = 50px, 'World' = 50px, 'Hello World' = 110px
        // With width = 50px, should wrap
        expect(lines.length).toBeGreaterThan(1);
      });
    });

    describe('getTextMetrics', () => {
      it('should return zero width for empty text', () => {
        const metrics = getTextMetrics('', 16, 'Arial');
        
        expect(metrics.width).toBe(0);
        expect(metrics.height).toBe(16);
      });

      it('should calculate width for text', () => {
        const text = 'Hello World';
        const metrics = getTextMetrics(text, 16, 'Arial');
        
        // Mock returns 10px per character: 11 chars * 10 = 110px
        expect(metrics.width).toBe(110);
        expect(metrics.height).toBe(16);
      });

      it('should return height equal to fontSize', () => {
        const metrics = getTextMetrics('Test', 24, 'Arial');
        
        // Height should match font size (single line)
        expect(metrics.height).toBe(24);
      });

      it('should handle different font sizes', () => {
        const text = 'Test';
        
        const metrics16 = getTextMetrics(text, 16, 'Arial');
        const metrics24 = getTextMetrics(text, 24, 'Arial');
        
        expect(metrics16.height).toBe(16);
        expect(metrics24.height).toBe(24);
      });

      it('should measure text with different content', () => {
        const shortText = getTextMetrics('Hi', 16, 'Arial');
        const longText = getTextMetrics('Hello World', 16, 'Arial');
        
        // Longer text should have greater width
        expect(longText.width).toBeGreaterThan(shortText.width);
      });
    });
  });
});

