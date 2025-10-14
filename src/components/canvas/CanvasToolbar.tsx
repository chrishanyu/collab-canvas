import React from 'react';

interface CanvasToolbarProps {
  onResetView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  currentZoom: number;
}

/**
 * CanvasToolbar Component
 * Provides toolbar controls for canvas navigation:
 * - Reset view to default position and zoom
 * - Zoom in/out buttons
 */
export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  onResetView,
  onZoomIn,
  onZoomOut,
  currentZoom,
}) => {
  return (
    <div className="absolute top-20 right-4 z-10 bg-white rounded-lg shadow-lg p-2 flex flex-col gap-2">
      <button
        onClick={onResetView}
        className="px-3 py-2 text-sm bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded transition-colors font-medium"
        title="Reset View (Ctrl+0)"
      >
        🎯 Reset
      </button>
      
      <div className="border-t border-gray-200 my-1"></div>
      
      <button
        onClick={onZoomIn}
        className="px-3 py-2 text-sm bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded transition-colors font-medium"
        title="Zoom In (Ctrl++)"
      >
        ➕ Zoom In
      </button>
      
      <div className="px-3 py-1 text-xs text-center text-gray-600 font-mono">
        {Math.round(currentZoom * 100)}%
      </div>
      
      <button
        onClick={onZoomOut}
        className="px-3 py-2 text-sm bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded transition-colors font-medium"
        title="Zoom Out (Ctrl+-)"
      >
        ➖ Zoom Out
      </button>
    </div>
  );
};

