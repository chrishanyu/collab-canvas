import React from 'react';
import { MousePointer2, Hand, Shapes, Type as TypeIcon } from 'lucide-react';

interface CanvasToolbarProps {
  interactionMode: 'select' | 'pan';
  onSetMode: (mode: 'select' | 'pan') => void;
  onToggleShapes: () => void;
  onCreateText: () => void;
}

/**
 * CanvasToolbar Component
 * 
 * Floating toolbar at bottom-center of canvas.
 * Provides mode toggle buttons (Select/Pan) and action buttons (Shapes/Text).
 * 
 * Layout: [Select][Pan] | [Shapes][Text]
 * Position: Bottom-center (16px from bottom)
 * Note: Zoom controls are in ZoomControls component (bottom-right)
 */
export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  interactionMode,
  onSetMode,
  onToggleShapes,
  onCreateText,
}) => {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-white rounded-lg shadow-lg px-2 py-2 flex items-center gap-2">
      {/* Mode Toggle Buttons */}
      <div className="flex items-center rounded-md overflow-hidden border border-gray-200">
        {/* Select Mode Button */}
        <button
          onClick={() => onSetMode('select')}
          className={`px-3 py-2 text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
            interactionMode === 'select'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          title="Select Mode (Click shapes, drag to select multiple)"
        >
          <MousePointer2 className="w-4 h-4" />
        </button>
        
        {/* Pan Mode Button */}
        <button
          onClick={() => onSetMode('pan')}
          className={`px-3 py-2 text-sm font-medium transition-all duration-200 border-l border-gray-200 flex items-center gap-1 ${
            interactionMode === 'pan'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          title="Pan Mode (Drag to move canvas)"
        >
          <Hand className="w-4 h-4" />
        </button>
      </div>

      {/* Vertical Separator */}
      <div className="w-px h-8 bg-gray-300"></div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1">
        {/* Shapes Button */}
        <button
          onClick={onToggleShapes}
          className="px-3 py-2 text-sm rounded transition-all duration-200 font-medium bg-white hover:bg-gray-100 text-gray-700 flex items-center gap-1.5"
          title="Toggle Shapes Panel"
        >
          <Shapes className="w-4 h-4" />
          <span>Shapes</span>
        </button>
        
        {/* Vertical Separator */}
        <div className="w-px h-8 bg-gray-300"></div>
        
        {/* Text Button */}
        <button
          onClick={onCreateText}
          className="px-3 py-2 text-sm rounded transition-all duration-200 font-medium bg-white hover:bg-gray-100 text-gray-700 flex items-center gap-1"
          title="Create Text Box"
        >
          <TypeIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

