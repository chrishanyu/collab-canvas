import React from 'react';

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
}

/**
 * ZoomControls Component
 * 
 * Floating zoom controls in the bottom-right corner.
 * Provides [-] and [+] buttons for zooming in/out by 25% increments.
 * 
 * Position: Fixed bottom-right (16px from edges)
 * Style: Floating button group with shadow
 */
export const ZoomControls: React.FC<ZoomControlsProps> = ({
  onZoomIn,
  onZoomOut,
}) => {
  return (
    <div className="absolute bottom-4 right-4 z-10 bg-white rounded-lg shadow-lg flex items-center">
      {/* Zoom Out Button */}
      <button
        onClick={onZoomOut}
        className="px-4 py-2 text-gray-700 hover:bg-gray-100 transition-all duration-200 font-bold text-lg rounded-l-lg border-r border-gray-200 hover:shadow-sm active:scale-95"
        title="Zoom Out (25%)"
        aria-label="Zoom out"
      >
        −
      </button>
      
      {/* Zoom In Button */}
      <button
        onClick={onZoomIn}
        className="px-4 py-2 text-gray-700 hover:bg-gray-100 transition-all duration-200 font-bold text-lg rounded-r-lg hover:shadow-sm active:scale-95"
        title="Zoom In (25%)"
        aria-label="Zoom in"
      >
        +
      </button>
    </div>
  );
};

