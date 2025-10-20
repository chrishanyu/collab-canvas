// User types
export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
}

// Canvas types
export interface Canvas {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  createdAt: Date;
  updatedAt: Date;
  thumbnail?: string;
}

// Canvas object types
export type ShapeType = 'rectangle' | 'circle' | 'text' | 'ellipse' | 'star' | 'pentagon' | 'octagon';

export interface CanvasObject {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke?: string; // Border color
  strokeWidth?: number; // Border width in pixels
  rotation?: number; // Rotation angle in degrees
  zIndex?: number; // Layer order - higher values render on top (default: 0)
  
  // Text-specific properties (for type='text')
  text?: string; // Text content for text boxes
  fontSize?: number; // Font size in pixels (default: 16)
  fontFamily?: string; // Font family (default: 'Arial')
  color?: string; // Text color (default: '#000000')
  
  // Future text formatting (not implemented in V1)
  textFormat?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    fontWeight?: number | 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    textDecoration?: 'none' | 'underline' | 'line-through';
  };
  
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  version: number; // For conflict detection - increments on each update
  lastEditedBy?: string; // Tracks which user last edited this object
}

// Presence types
export interface UserPresence {
  userId: string;
  displayName: string;
  cursorX: number;
  cursorY: number;
  lastSeen: Date;
}

// Canvas access types
export type AccessRole = 'owner' | 'collaborator';

export interface CanvasAccess {
  canvasId: string;
  accessedAt: Date;
  role: AccessRole;
}

// Error types
export { ConflictError } from './errors';

