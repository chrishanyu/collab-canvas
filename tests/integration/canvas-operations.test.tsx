import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, renderHook, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactNode } from 'react';
import { CanvasProvider } from '../../src/context/CanvasContext';
import { useCanvasContext } from '../../src/hooks/useCanvasContext';
import { useCanvas } from '../../src/hooks/useCanvas';
import { CanvasToolbar } from '../../src/components/canvas/CanvasToolbar';
import { Shape } from '../../src/components/canvas/Shape';
import { CanvasObject } from '../../src/types';
import { resetAllMocks } from '../mocks/firebase.mock';

// Mock canvas helpers
vi.mock('../../src/utils/canvasHelpers', () => ({
  constrainZoom: vi.fn((zoom) => Math.max(0.1, Math.min(3, zoom))),
  getRelativePointerPosition: vi.fn((stage) => ({ x: 100, y: 100 })),
  generateUniqueId: vi.fn(() => `shape-${Date.now()}`),
}));

describe('Canvas Context Tests', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <CanvasProvider>{children}</CanvasProvider>
  );

  beforeEach(() => {
    resetAllMocks();
    vi.clearAllMocks();
  });

  it('should initialize with empty shapes', () => {
    const { result } = renderHook(() => useCanvasContext(), { wrapper });

    expect(result.current.shapes).toEqual([]);
    expect(result.current.selectedShapeId).toBeNull();
    expect(result.current.isCreatingShape).toBe(false);
  });

  it('should create a new shape', () => {
    const { result } = renderHook(() => useCanvasContext(), { wrapper });

    act(() => {
      result.current.createShape({
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 150,
        height: 100,
        fill: '#3B82F6',
        createdBy: 'user-123',
      });
    });

    expect(result.current.shapes).toHaveLength(1);
    expect(result.current.shapes[0]).toMatchObject({
      type: 'rectangle',
      x: 100,
      y: 100,
      width: 150,
      height: 100,
      fill: '#3B82F6',
    });
    expect(result.current.shapes[0].id).toBeDefined();
    expect(result.current.shapes[0].createdAt).toBeInstanceOf(Date);
  });

  it('should update an existing shape', () => {
    const { result } = renderHook(() => useCanvasContext(), { wrapper });

    let shapeId: string;

    act(() => {
      const shape = result.current.createShape({
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 150,
        height: 100,
        fill: '#3B82F6',
        createdBy: 'user-123',
      });
      shapeId = shape.id;
    });

    act(() => {
      result.current.updateShape(shapeId, { x: 200, y: 200 });
    });

    expect(result.current.shapes[0].x).toBe(200);
    expect(result.current.shapes[0].y).toBe(200);
    expect(result.current.shapes[0].updatedAt).toBeInstanceOf(Date);
  });

  it('should delete a shape', () => {
    const { result } = renderHook(() => useCanvasContext(), { wrapper });

    let shapeId: string;

    act(() => {
      const shape = result.current.createShape({
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 150,
        height: 100,
        fill: '#3B82F6',
        createdBy: 'user-123',
      });
      shapeId = shape.id;
    });

    expect(result.current.shapes).toHaveLength(1);

    act(() => {
      result.current.deleteShape(shapeId);
    });

    expect(result.current.shapes).toHaveLength(0);
  });

  it('should select and deselect shapes', () => {
    const { result } = renderHook(() => useCanvasContext(), { wrapper });

    let shapeId: string;

    act(() => {
      const shape = result.current.createShape({
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 150,
        height: 100,
        fill: '#3B82F6',
        createdBy: 'user-123',
      });
      shapeId = shape.id;
    });

    act(() => {
      result.current.selectShape(shapeId);
    });

    expect(result.current.selectedShapeId).toBe(shapeId);

    act(() => {
      result.current.selectShape(null);
    });

    expect(result.current.selectedShapeId).toBeNull();
  });

  it('should manage creation mode', () => {
    const { result } = renderHook(() => useCanvasContext(), { wrapper });

    expect(result.current.isCreatingShape).toBe(false);

    act(() => {
      result.current.setCreatingShape(true);
    });

    expect(result.current.isCreatingShape).toBe(true);
    expect(result.current.selectedShapeId).toBeNull();

    act(() => {
      result.current.setCreatingShape(false);
    });

    expect(result.current.isCreatingShape).toBe(false);
  });

  it('should handle multiple shapes', () => {
    const { result } = renderHook(() => useCanvasContext(), { wrapper });

    act(() => {
      result.current.createShape({
        type: 'rectangle',
        x: 100,
        y: 100,
        width: 150,
        height: 100,
        fill: '#3B82F6',
        createdBy: 'user-123',
      });
      result.current.createShape({
        type: 'rectangle',
        x: 300,
        y: 300,
        width: 200,
        height: 150,
        fill: '#EF4444',
        createdBy: 'user-123',
      });
      result.current.createShape({
        type: 'rectangle',
        x: 500,
        y: 500,
        width: 100,
        height: 100,
        fill: '#10B981',
        createdBy: 'user-123',
      });
    });

    expect(result.current.shapes).toHaveLength(3);
    expect(result.current.shapes[0].fill).toBe('#3B82F6');
    expect(result.current.shapes[1].fill).toBe('#EF4444');
    expect(result.current.shapes[2].fill).toBe('#10B981');
  });
});

describe('Canvas Hook Tests', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <CanvasProvider>{children}</CanvasProvider>
  );

  beforeEach(() => {
    resetAllMocks();
    vi.clearAllMocks();
  });

  it('should create a rectangle with helper method', () => {
    const { result } = renderHook(() => useCanvas(), { wrapper });

    act(() => {
      result.current.createRectangle(50, 50, 100, 100, '#3B82F6', 'user-123');
    });

    expect(result.current.shapes).toHaveLength(1);
    expect(result.current.shapes[0]).toMatchObject({
      type: 'rectangle',
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      fill: '#3B82F6',
    });
  });

  it('should move a shape', () => {
    const { result } = renderHook(() => useCanvas(), { wrapper });

    let shapeId: string;

    act(() => {
      const shape = result.current.createRectangle(50, 50, 100, 100, '#3B82F6', 'user-123');
      shapeId = shape.id;
    });

    act(() => {
      result.current.moveShape(shapeId, 150, 150);
    });

    expect(result.current.shapes[0].x).toBe(150);
    expect(result.current.shapes[0].y).toBe(150);
  });

  it('should resize a shape', () => {
    const { result } = renderHook(() => useCanvas(), { wrapper });

    let shapeId: string;

    act(() => {
      const shape = result.current.createRectangle(50, 50, 100, 100, '#3B82F6', 'user-123');
      shapeId = shape.id;
    });

    act(() => {
      result.current.resizeShape(shapeId, 200, 200);
    });

    expect(result.current.shapes[0].width).toBe(200);
    expect(result.current.shapes[0].height).toBe(200);
  });

  it('should change shape color', () => {
    const { result } = renderHook(() => useCanvas(), { wrapper });

    let shapeId: string;

    act(() => {
      const shape = result.current.createRectangle(50, 50, 100, 100, '#3B82F6', 'user-123');
      shapeId = shape.id;
    });

    act(() => {
      result.current.changeShapeColor(shapeId, '#EF4444');
    });

    expect(result.current.shapes[0].fill).toBe('#EF4444');
  });

  it('should get shape by ID', () => {
    const { result } = renderHook(() => useCanvas(), { wrapper });

    let shapeId: string;

    act(() => {
      const shape = result.current.createRectangle(50, 50, 100, 100, '#3B82F6', 'user-123');
      shapeId = shape.id;
    });

    const shape = result.current.getShapeById(shapeId);
    expect(shape).toBeDefined();
    expect(shape?.id).toBe(shapeId);
  });

  it('should get all shapes', () => {
    const { result } = renderHook(() => useCanvas(), { wrapper });

    act(() => {
      result.current.createRectangle(50, 50, 100, 100, '#3B82F6', 'user-123');
      result.current.createRectangle(150, 150, 100, 100, '#EF4444', 'user-123');
    });

    const allShapes = result.current.getAllShapes();
    expect(allShapes).toHaveLength(2);
  });

  it('should clear all shapes', () => {
    const { result } = renderHook(() => useCanvas(), { wrapper });

    act(() => {
      result.current.createRectangle(50, 50, 100, 100, '#3B82F6', 'user-123');
      result.current.createRectangle(150, 150, 100, 100, '#EF4444', 'user-123');
    });

    expect(result.current.shapes).toHaveLength(2);

    act(() => {
      result.current.clearAllShapes();
    });

    expect(result.current.shapes).toHaveLength(0);
    expect(result.current.selectedShapeId).toBeNull();
  });

  it('should track selected shape', () => {
    const { result } = renderHook(() => useCanvas(), { wrapper });

    let shapeId: string;

    act(() => {
      const shape = result.current.createRectangle(50, 50, 100, 100, '#3B82F6', 'user-123');
      shapeId = shape.id;
    });

    act(() => {
      result.current.selectShape(shapeId);
    });

    expect(result.current.selectedShapeId).toBe(shapeId);
    expect(result.current.selectedShape).toBeDefined();
    expect(result.current.selectedShape?.id).toBe(shapeId);
  });
});

describe('Canvas Toolbar Tests', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.clearAllMocks();
  });

  it('should render toolbar with all buttons', () => {
    const mockHandlers = {
      onResetView: vi.fn(),
      onZoomIn: vi.fn(),
      onZoomOut: vi.fn(),
      onAddRectangle: vi.fn(),
    };

    render(
      <CanvasToolbar
        {...mockHandlers}
        currentZoom={1}
        isCreatingShape={false}
      />
    );

    expect(screen.getByTitle(/Add Rectangle/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Reset View/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Zoom In/i)).toBeInTheDocument();
    expect(screen.getByTitle(/Zoom Out/i)).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should call onAddRectangle when Add Rectangle button is clicked', async () => {
    const user = userEvent.setup();
    const mockHandlers = {
      onResetView: vi.fn(),
      onZoomIn: vi.fn(),
      onZoomOut: vi.fn(),
      onAddRectangle: vi.fn(),
    };

    render(
      <CanvasToolbar
        {...mockHandlers}
        currentZoom={1}
        isCreatingShape={false}
      />
    );

    const addButton = screen.getByTitle(/Add Rectangle/i);
    await user.click(addButton);

    expect(mockHandlers.onAddRectangle).toHaveBeenCalledTimes(1);
  });

  it('should show "Click to place" when in creation mode', () => {
    const mockHandlers = {
      onResetView: vi.fn(),
      onZoomIn: vi.fn(),
      onZoomOut: vi.fn(),
      onAddRectangle: vi.fn(),
    };

    render(
      <CanvasToolbar
        {...mockHandlers}
        currentZoom={1}
        isCreatingShape={true}
      />
    );

    expect(screen.getByText(/Click to place/i)).toBeInTheDocument();
  });

  it('should call zoom handlers when zoom buttons are clicked', async () => {
    const user = userEvent.setup();
    const mockHandlers = {
      onResetView: vi.fn(),
      onZoomIn: vi.fn(),
      onZoomOut: vi.fn(),
      onAddRectangle: vi.fn(),
    };

    render(
      <CanvasToolbar
        {...mockHandlers}
        currentZoom={1}
        isCreatingShape={false}
      />
    );

    await user.click(screen.getByTitle(/Zoom In/i));
    expect(mockHandlers.onZoomIn).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTitle(/Zoom Out/i));
    expect(mockHandlers.onZoomOut).toHaveBeenCalledTimes(1);

    await user.click(screen.getByTitle(/Reset View/i));
    expect(mockHandlers.onResetView).toHaveBeenCalledTimes(1);
  });

  it('should display current zoom level', () => {
    const mockHandlers = {
      onResetView: vi.fn(),
      onZoomIn: vi.fn(),
      onZoomOut: vi.fn(),
      onAddRectangle: vi.fn(),
    };

    const { rerender } = render(
      <CanvasToolbar
        {...mockHandlers}
        currentZoom={1}
        isCreatingShape={false}
      />
    );

    expect(screen.getByText('100%')).toBeInTheDocument();

    rerender(
      <CanvasToolbar
        {...mockHandlers}
        currentZoom={1.5}
        isCreatingShape={false}
      />
    );

    expect(screen.getByText('150%')).toBeInTheDocument();

    rerender(
      <CanvasToolbar
        {...mockHandlers}
        currentZoom={0.5}
        isCreatingShape={false}
      />
    );

    expect(screen.getByText('50%')).toBeInTheDocument();
  });
});

describe('Performance Tests', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <CanvasProvider>{children}</CanvasProvider>
  );

  beforeEach(() => {
    resetAllMocks();
    vi.clearAllMocks();
  });

  it('should handle creating 20+ shapes efficiently', () => {
    const { result } = renderHook(() => useCanvas(), { wrapper });

    const startTime = performance.now();

    act(() => {
      for (let i = 0; i < 25; i++) {
        result.current.createRectangle(
          i * 50,
          i * 50,
          100,
          100,
          `#${Math.floor(Math.random()*16777215).toString(16)}`,
          'user-123'
        );
      }
    });

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(result.current.shapes).toHaveLength(25);
    expect(duration).toBeLessThan(100); // Should complete in less than 100ms
  });

  it('should handle updating multiple shapes efficiently', () => {
    const { result } = renderHook(() => useCanvas(), { wrapper });

    const shapeIds: string[] = [];

    act(() => {
      for (let i = 0; i < 20; i++) {
        const shape = result.current.createRectangle(
          i * 50,
          i * 50,
          100,
          100,
          '#3B82F6',
          'user-123'
        );
        shapeIds.push(shape.id);
      }
    });

    const startTime = performance.now();

    act(() => {
      shapeIds.forEach((id, index) => {
        result.current.moveShape(id, index * 100, index * 100);
      });
    });

    const endTime = performance.now();
    const duration = endTime - startTime;

    expect(duration).toBeLessThan(100); // Should complete in less than 100ms
  });
});
