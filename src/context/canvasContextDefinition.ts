import { createContext } from 'react';
import type { CanvasObject } from '../types';

export interface CanvasContextType {
  shapes: CanvasObject[];
  selectedShapeId: string | null;
  isCreatingShape: boolean;
  createShape: (shape: Omit<CanvasObject, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'lastEditedBy'>) => CanvasObject;
  updateShape: (id: string, updates: Partial<CanvasObject>) => void;
  deleteShape: (id: string) => void;
  selectShape: (id: string | null) => void;
  setCreatingShape: (isCreating: boolean) => void;
  setShapes: (shapes: CanvasObject[]) => void;
}

export const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

