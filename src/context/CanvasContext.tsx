import React, { useState } from 'react';
import type { ReactNode } from 'react';
import type { CanvasObject } from '../types';
import { generateUniqueId } from '../utils/canvasHelpers';
import { CanvasContext } from './canvasContextDefinition';
import type { CanvasContextType } from './canvasContextDefinition';

export { CanvasContext };
export type { CanvasContextType };

interface CanvasProviderProps {
  children: ReactNode;
}

export const CanvasProvider: React.FC<CanvasProviderProps> = ({ children }) => {
  const [shapes, setShapes] = useState<CanvasObject[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [isCreatingShape, setIsCreatingShape] = useState(false);

  const createShape = (shapeData: Omit<CanvasObject, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'lastEditedBy'>) => {
    const newShape: CanvasObject = {
      ...shapeData,
      id: generateUniqueId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      lastEditedBy: shapeData.createdBy,
    };
    setShapes((prevShapes) => [...prevShapes, newShape]);
    return newShape;
  };

  const updateShape = (id: string, updates: Partial<CanvasObject>) => {
    setShapes((prevShapes) =>
      prevShapes.map((shape) =>
        shape.id === id
          ? { ...shape, ...updates, updatedAt: new Date() }
          : shape
      )
    );
  };

  const deleteShape = (id: string) => {
    setShapes((prevShapes) => prevShapes.filter((shape) => shape.id !== id));
    if (selectedShapeId === id) {
      setSelectedShapeId(null);
    }
  };

  const selectShape = (id: string | null) => {
    setSelectedShapeId(id);
  };

  const setCreatingShape = (isCreating: boolean) => {
    setIsCreatingShape(isCreating);
    if (isCreating) {
      setSelectedShapeId(null); // Deselect when entering creation mode
    }
  };

  const value: CanvasContextType = {
    shapes,
    selectedShapeId,
    editingTextId,
    isCreatingShape,
    createShape,
    updateShape,
    deleteShape,
    selectShape,
    setEditingTextId,
    setCreatingShape,
    setShapes,
  };

  return (
    <CanvasContext.Provider value={value}>
      {children}
    </CanvasContext.Provider>
  );
};

