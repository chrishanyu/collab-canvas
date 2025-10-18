import React from 'react';

interface ShapesPanelProps {
  isOpen: boolean;
  selectedShape: string | null;
  onSelectShape: (shapeType: string) => void;
  onClose: () => void;
}

// Shape configuration for extensibility
const AVAILABLE_SHAPES = [
  { type: 'rectangle', icon: '⬛', label: 'Rectangle' },
  { type: 'circle', icon: '⚫', label: 'Circle' },
  { type: 'ellipse', icon: '⬮', label: 'Ellipse' },
  { type: 'star', icon: '⭐', label: 'Star' },
  { type: 'pentagon', icon: '⬠', label: 'Pentagon' },
  { type: 'octagon', icon: '⬣', label: 'Octagon' },
];

/**
 * ShapesPanel Component
 * 
 * Floating panel displaying available shapes for creation.
 * Positioned on the left side below the navigation header.
 * 
 * Features:
 * - Extensible shape configuration
 * - Visual selection feedback
 * - Scroll support for future shape additions
 */
export const ShapesPanel: React.FC<ShapesPanelProps> = ({
  isOpen,
  selectedShape,
  onSelectShape,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-24 left-4 z-10 bg-white rounded-lg shadow-lg p-2 w-40 max-h-96 overflow-y-auto transition-opacity duration-200 ease-out opacity-100">
      {/* Panel Header */}
      <div className="flex items-center justify-between mb-2 px-2">
        <h3 className="text-xs font-semibold text-gray-700 uppercase">Shapes</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          title="Close panel (ESC)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Shape Buttons */}
      <div className="flex flex-col gap-1">
        {AVAILABLE_SHAPES.map((shape) => (
          <button
            key={shape.type}
            onClick={() => onSelectShape(shape.type)}
            className={`px-3 py-2 text-sm rounded transition-all duration-200 font-medium text-left flex items-center gap-2 ${
              selectedShape === shape.type
                ? 'bg-blue-500 text-white border-2 border-blue-600 scale-105'
                : 'bg-white hover:bg-gray-100 text-gray-700 border-2 border-transparent hover:scale-102'
            }`}
            title={`Create ${shape.label}`}
          >
            <span className="text-base">{shape.icon}</span>
            <span>{shape.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

