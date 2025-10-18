import React from 'react';

interface CanvasToolbarProps {
  onToggleShapes: () => void;
}

/**
 * CanvasToolbar Component
 * 
 * Floating toolbar at bottom-center of canvas.
 * Provides toggle button to open/close the shapes panel.
 * 
 * Position: Bottom-center (16px from bottom)
 * Note: Zoom controls are in ZoomControls component (bottom-right)
 */
export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  onToggleShapes,
}) => {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white rounded-lg shadow-lg px-4 py-2">
      {/* Shapes Toggle */}
      <button
        onClick={onToggleShapes}
        className="px-4 py-2 text-sm rounded transition-all duration-200 font-medium bg-white hover:bg-gray-100 text-gray-700 hover:shadow-sm"
        title="Toggle Shapes Panel"
      >
        🔲 Shapes
      </button>
    </div>
  );
};

