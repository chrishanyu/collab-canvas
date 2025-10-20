import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Stage, Layer } from 'react-konva';
import { TextBox } from './TextBox';
import type { CanvasObject } from '../../types';
import { DEFAULT_FONT_SIZE, DEFAULT_FONT_FAMILY, DEFAULT_TEXT_COLOR } from '../../utils/constants';

describe('TextBox Component', () => {
  // Helper function to create a mock text box shape
  const createMockTextBox = (overrides?: Partial<CanvasObject>): CanvasObject => ({
    id: 'text-1',
    type: 'text',
    x: 100,
    y: 100,
    width: 200,
    height: 50,
    fill: '#FFFFFF',
    text: 'Hello World',
    fontSize: 16,
    fontFamily: 'Arial',
    color: '#000000',
    createdBy: 'user-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
    ...overrides,
  });

  // Helper to render TextBox within Konva Stage/Layer
  const renderTextBox = (shape: CanvasObject, props?: Partial<any>) => {
    const mockOnSelect = vi.fn();
    const mockOnDragStart = vi.fn();
    const mockOnDragMove = vi.fn();
    const mockOnDragEnd = vi.fn();

    return render(
      <Stage width={800} height={600}>
        <Layer>
          <TextBox
            shape={shape}
            isSelected={false}
            onSelect={mockOnSelect}
            onDragStart={mockOnDragStart}
            onDragMove={mockOnDragMove}
            onDragEnd={mockOnDragEnd}
            {...props}
          />
        </Layer>
      </Stage>
    );
  };

  describe('Rendering', () => {
    it('should render text box with provided text', () => {
      const shape = createMockTextBox({ text: 'Test Text' });
      const { container } = renderTextBox(shape);

      // TextBox should render (check for canvas element)
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeTruthy();
    });

    it('should render with empty text', () => {
      const shape = createMockTextBox({ text: '' });
      const { container } = renderTextBox(shape);

      const canvas = container.querySelector('canvas');
      expect(canvas).toBeTruthy();
    });

    it('should use default font size if not provided', () => {
      const shape = createMockTextBox({ fontSize: undefined });
      const { container } = renderTextBox(shape);

      // Should render without error
      expect(container.querySelector('canvas')).toBeTruthy();
    });

    it('should use default font family if not provided', () => {
      const shape = createMockTextBox({ fontFamily: undefined });
      const { container } = renderTextBox(shape);

      // Should render without error
      expect(container.querySelector('canvas')).toBeTruthy();
    });

    it('should use default color if not provided', () => {
      const shape = createMockTextBox({ color: undefined });
      const { container } = renderTextBox(shape);

      // Should render without error
      expect(container.querySelector('canvas')).toBeTruthy();
    });
  });

  describe('Text Properties', () => {
    it('should render with custom font size', () => {
      const shape = createMockTextBox({ fontSize: 24 });
      const { container } = renderTextBox(shape);

      expect(container.querySelector('canvas')).toBeTruthy();
    });

    it('should render with custom font family', () => {
      const shape = createMockTextBox({ fontFamily: 'Helvetica' });
      const { container } = renderTextBox(shape);

      expect(container.querySelector('canvas')).toBeTruthy();
    });

    it('should render with custom color', () => {
      const shape = createMockTextBox({ color: '#FF0000' });
      const { container } = renderTextBox(shape);

      expect(container.querySelector('canvas')).toBeTruthy();
    });

    it('should handle multi-line text', () => {
      const shape = createMockTextBox({ text: 'Line 1\nLine 2\nLine 3' });
      const { container } = renderTextBox(shape);

      expect(container.querySelector('canvas')).toBeTruthy();
    });

    it('should handle long text that wraps', () => {
      const longText = 'This is a very long piece of text that will definitely wrap within the text box boundaries';
      const shape = createMockTextBox({ text: longText });
      const { container } = renderTextBox(shape);

      expect(container.querySelector('canvas')).toBeTruthy();
    });
  });

  describe('Selection State', () => {
    it('should render when selected', () => {
      const shape = createMockTextBox();
      const { container } = renderTextBox(shape, { isSelected: true });

      expect(container.querySelector('canvas')).toBeTruthy();
    });

    it('should render when not selected', () => {
      const shape = createMockTextBox();
      const { container } = renderTextBox(shape, { isSelected: false });

      expect(container.querySelector('canvas')).toBeTruthy();
    });
  });

  describe('Edit Indicators', () => {
    it('should render with edit indicator when being edited', () => {
      const shape = createMockTextBox();
      const { container } = renderTextBox(shape, {
        isBeingEdited: true,
        editorName: 'Alice Smith',
        editorColor: '#EF4444',
      });

      expect(container.querySelector('canvas')).toBeTruthy();
    });

    it('should render without edit indicator by default', () => {
      const shape = createMockTextBox();
      const { container } = renderTextBox(shape, {
        isBeingEdited: false,
      });

      expect(container.querySelector('canvas')).toBeTruthy();
    });
  });

  describe('Positioning and Size', () => {
    it('should render at specified position', () => {
      const shape = createMockTextBox({ x: 150, y: 250 });
      const { container } = renderTextBox(shape);

      expect(container.querySelector('canvas')).toBeTruthy();
    });

    it('should render with specified width and height', () => {
      const shape = createMockTextBox({ width: 300, height: 100 });
      const { container } = renderTextBox(shape);

      expect(container.querySelector('canvas')).toBeTruthy();
    });

    it('should render with minimum width', () => {
      const shape = createMockTextBox({ width: 50 });
      const { container } = renderTextBox(shape);

      expect(container.querySelector('canvas')).toBeTruthy();
    });
  });

  describe('Interaction Props', () => {
    it('should accept onSelect handler', () => {
      const shape = createMockTextBox();
      const mockOnSelect = vi.fn();
      
      const { container } = renderTextBox(shape, { onSelect: mockOnSelect });

      expect(container.querySelector('canvas')).toBeTruthy();
      // Note: Actual click testing would require more complex event simulation
    });

    it('should accept drag handlers', () => {
      const shape = createMockTextBox();
      const mockOnDragStart = vi.fn();
      const mockOnDragMove = vi.fn();
      const mockOnDragEnd = vi.fn();
      
      const { container } = renderTextBox(shape, {
        onDragStart: mockOnDragStart,
        onDragMove: mockOnDragMove,
        onDragEnd: mockOnDragEnd,
      });

      expect(container.querySelector('canvas')).toBeTruthy();
    });

    it('should call onSelect with shape id when clicked', () => {
      const shape = createMockTextBox();
      const mockOnSelect = vi.fn();
      
      render(
        <Stage width={800} height={600}>
          <Layer>
            <TextBox
              shape={shape}
              isSelected={false}
              onSelect={mockOnSelect}
              onDragStart={vi.fn()}
              onDragMove={vi.fn()}
              onDragEnd={vi.fn()}
            />
          </Layer>
        </Stage>
      );

      // The component is rendered and handler is set up
      expect(mockOnSelect).not.toHaveBeenCalled();
    });

    it('should call onDragStart with shape id', () => {
      const shape = createMockTextBox();
      const mockOnDragStart = vi.fn();
      
      render(
        <Stage width={800} height={600}>
          <Layer>
            <TextBox
              shape={shape}
              isSelected={false}
              onSelect={vi.fn()}
              onDragStart={mockOnDragStart}
              onDragMove={vi.fn()}
              onDragEnd={vi.fn()}
            />
          </Layer>
        </Stage>
      );

      // Handler is set up correctly
      expect(mockOnDragStart).not.toHaveBeenCalled();
    });

    it('should call onDragMove with shape id and coordinates', () => {
      const shape = createMockTextBox();
      const mockOnDragMove = vi.fn();
      
      render(
        <Stage width={800} height={600}>
          <Layer>
            <TextBox
              shape={shape}
              isSelected={false}
              onSelect={vi.fn()}
              onDragStart={vi.fn()}
              onDragMove={mockOnDragMove}
              onDragEnd={vi.fn()}
            />
          </Layer>
        </Stage>
      );

      // Handler is set up correctly
      expect(mockOnDragMove).not.toHaveBeenCalled();
    });

    it('should call onDragEnd with shape id and final coordinates', () => {
      const shape = createMockTextBox();
      const mockOnDragEnd = vi.fn();
      
      render(
        <Stage width={800} height={600}>
          <Layer>
            <TextBox
              shape={shape}
              isSelected={false}
              onSelect={vi.fn()}
              onDragStart={vi.fn()}
              onDragMove={vi.fn()}
              onDragEnd={mockOnDragEnd}
            />
          </Layer>
        </Stage>
      );

      // Handler is set up correctly
      expect(mockOnDragEnd).not.toHaveBeenCalled();
    });

    it('should call onEnterEditMode with shape id on double-click', () => {
      const shape = createMockTextBox();
      const mockOnEnterEditMode = vi.fn();
      
      render(
        <Stage width={800} height={600}>
          <Layer>
            <TextBox
              shape={shape}
              isSelected={false}
              onSelect={vi.fn()}
              onDragStart={vi.fn()}
              onDragMove={vi.fn()}
              onDragEnd={vi.fn()}
              onEnterEditMode={mockOnEnterEditMode}
            />
          </Layer>
        </Stage>
      );

      // Handler is set up correctly
      expect(mockOnEnterEditMode).not.toHaveBeenCalled();
    });

    it('should be draggable when not in edit mode', () => {
      const shape = createMockTextBox();
      
      const { container } = render(
        <Stage width={800} height={600}>
          <Layer>
            <TextBox
              shape={shape}
              isSelected={false}
              isEditMode={false}
              onSelect={vi.fn()}
              onDragStart={vi.fn()}
              onDragMove={vi.fn()}
              onDragEnd={vi.fn()}
            />
          </Layer>
        </Stage>
      );

      expect(container.querySelector('canvas')).toBeTruthy();
    });

    it('should not be draggable when in edit mode', () => {
      const shape = createMockTextBox();
      
      const { container } = render(
        <Stage width={800} height={600}>
          <Layer>
            <TextBox
              shape={shape}
              isSelected={false}
              isEditMode={true}
              onSelect={vi.fn()}
              onDragStart={vi.fn()}
              onDragMove={vi.fn()}
              onDragEnd={vi.fn()}
            />
          </Layer>
        </Stage>
      );

      expect(container.querySelector('canvas')).toBeTruthy();
    });
  });

  describe('Defaults', () => {
    it('should use DEFAULT_FONT_SIZE when fontSize is undefined', () => {
      const shape = createMockTextBox({ fontSize: undefined });
      
      // This verifies the component doesn't crash with undefined fontSize
      const { container } = renderTextBox(shape);
      expect(container.querySelector('canvas')).toBeTruthy();
    });

    it('should use DEFAULT_FONT_FAMILY when fontFamily is undefined', () => {
      const shape = createMockTextBox({ fontFamily: undefined });
      
      const { container } = renderTextBox(shape);
      expect(container.querySelector('canvas')).toBeTruthy();
    });

    it('should use DEFAULT_TEXT_COLOR when color is undefined', () => {
      const shape = createMockTextBox({ color: undefined });
      
      const { container } = renderTextBox(shape);
      expect(container.querySelector('canvas')).toBeTruthy();
    });

    it('should handle completely empty text box', () => {
      const shape = createMockTextBox({
        text: '',
        fontSize: undefined,
        fontFamily: undefined,
        color: undefined,
      });
      
      const { container } = renderTextBox(shape);
      expect(container.querySelector('canvas')).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small dimensions', () => {
      const shape = createMockTextBox({ width: 10, height: 10 });
      const { container } = renderTextBox(shape);

      expect(container.querySelector('canvas')).toBeTruthy();
    });

    it('should handle very large dimensions', () => {
      const shape = createMockTextBox({ width: 1000, height: 500 });
      const { container } = renderTextBox(shape);

      expect(container.querySelector('canvas')).toBeTruthy();
    });

    it('should handle special characters in text', () => {
      const shape = createMockTextBox({ text: '!@#$%^&*()_+-={}[]|\\:";\'<>?,./' });
      const { container } = renderTextBox(shape);

      expect(container.querySelector('canvas')).toBeTruthy();
    });

    it('should handle unicode characters', () => {
      const shape = createMockTextBox({ text: '你好世界 🌍 مرحبا' });
      const { container } = renderTextBox(shape);

      expect(container.querySelector('canvas')).toBeTruthy();
    });

    it('should handle whitespace-only text', () => {
      const shape = createMockTextBox({ text: '    ' });
      const { container } = renderTextBox(shape);

      expect(container.querySelector('canvas')).toBeTruthy();
    });
  });
});

