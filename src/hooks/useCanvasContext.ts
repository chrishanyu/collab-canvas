import { useContext } from 'react';
import { CanvasContext } from '../context/canvasContextDefinition';

/**
 * Custom hook to access the Canvas Context
 * Must be used within a CanvasProvider
 */
export const useCanvasContext = () => {
  const context = useContext(CanvasContext);
  if (context === undefined) {
    throw new Error('useCanvasContext must be used within a CanvasProvider');
  }
  return context;
};

