import { useCanvasContext } from './useCanvasContext';
import { CanvasObject } from '../types';

/**
 * Custom hook for canvas operations
 * Provides convenient methods for shape manipulation
 */
export const useCanvas = () => {
  const context = useCanvasContext();

  /**
   * Create a new rectangle shape
   */
  const createRectangle = (
    x: number,
    y: number,
    width: number,
    height: number,
    fill: string,
    createdBy: string
  ): CanvasObject => {
    const shapeData: Omit<CanvasObject, 'id' | 'createdAt' | 'updatedAt'> = {
      type: 'rectangle',
      x,
      y,
      width,
      height,
      fill,
      createdBy,
    };
    return context.createShape(shapeData);
  };

  /**
   * Move a shape to a new position
   */
  const moveShape = (id: string, x: number, y: number) => {
    context.updateShape(id, { x, y });
  };

  /**
   * Resize a shape
   */
  const resizeShape = (id: string, width: number, height: number) => {
    context.updateShape(id, { width, height });
  };

  /**
   * Change shape color
   */
  const changeShapeColor = (id: string, fill: string) => {
    context.updateShape(id, { fill });
  };

  /**
   * Get a specific shape by ID
   */
  const getShapeById = (id: string): CanvasObject | undefined => {
    return context.shapes.find((shape) => shape.id === id);
  };

  /**
   * Get all shapes
   */
  const getAllShapes = (): CanvasObject[] => {
    return context.shapes;
  };

  /**
   * Clear all shapes
   */
  const clearAllShapes = () => {
    context.setShapes([]);
    context.selectShape(null);
  };

  /**
   * Deselect current shape
   */
  const deselectShape = () => {
    context.selectShape(null);
  };

  return {
    // State
    shapes: context.shapes,
    selectedShapeId: context.selectedShapeId,
    selectedShape: context.selectedShapeId
      ? getShapeById(context.selectedShapeId)
      : null,
    isCreatingShape: context.isCreatingShape,

    // Shape creation
    createShape: context.createShape,
    createRectangle,

    // Shape manipulation
    updateShape: context.updateShape,
    moveShape,
    resizeShape,
    changeShapeColor,
    deleteShape: context.deleteShape,

    // Shape selection
    selectShape: context.selectShape,
    deselectShape,

    // Shape queries
    getShapeById,
    getAllShapes,
    clearAllShapes,

    // Creation mode
    setCreatingShape: context.setCreatingShape,
    
    // Direct state setters (for advanced use cases)
    setShapes: context.setShapes,
  };
};

