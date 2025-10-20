import { createContext } from 'react';
import type { CanvasObject } from '../types';

export interface CanvasContextType {
  shapes: CanvasObject[];
  selectedShapeId: string | null;
  editingTextId: string | null; // ID of text box currently being edited
  isCreatingShape: boolean;
  createShape: (shape: Omit<CanvasObject, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'lastEditedBy'>) => CanvasObject;
  updateShape: (id: string, updates: Partial<CanvasObject>) => void;
  deleteShape: (id: string) => void;
  selectShape: (id: string | null) => void;
  setEditingTextId: (id: string | null) => void; // Function to set text editing mode
  setCreatingShape: (isCreating: boolean) => void;
  setShapes: (shapes: CanvasObject[]) => void;
}

export const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

