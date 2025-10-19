import React from 'react';
import { Rect, Circle, Ellipse, Star, RegularPolygon } from 'react-konva';
import type { ShapeType } from '../../types';
import { DEFAULT_SHAPE_FILL, DEFAULT_SHAPE_STROKE, DEFAULT_SHAPE_STROKE_WIDTH } from '../../utils/constants';

interface PreviewShapeProps {
  shapeType: ShapeType;
  x: number;
  y: number;
  size?: number;
}

/**
 * PreviewShape Component
 * 
 * Renders a ghost/preview shape that follows the cursor during shape creation.
 * The preview shape appears semi-transparent with a dashed border.
 * Uses the same default styling as actual shapes for consistency.
 * 
 * Design: Easily extensible for new shape types - just add a new case to the switch.
 */
export const PreviewShape: React.FC<PreviewShapeProps> = ({ 
  shapeType, 
  x, 
  y, 
  size = 100 
}) => {
  const previewProps = {
    opacity: 0.6, // Semi-transparent for preview effect
    fill: DEFAULT_SHAPE_FILL, // White fill
    stroke: DEFAULT_SHAPE_STROKE, // Gray-800 border
    strokeWidth: DEFAULT_SHAPE_STROKE_WIDTH, // 2px border
    dash: [5, 5], // Dashed border for preview indication
    listening: false,
    perfectDrawEnabled: false,
  };

  switch (shapeType) {
    case 'rectangle':
      return (
        <Rect
          x={x - size / 2}
          y={y - size / 2}
          width={size}
          height={size}
          {...previewProps}
        />
      );
    
    case 'circle':
      return (
        <Circle
          x={x}
          y={y}
          radius={size / 2}
          {...previewProps}
        />
      );
    
    case 'ellipse':
      return (
        <Ellipse
          x={x}
          y={y}
          radiusX={size / 2}
          radiusY={size / 2}
          {...previewProps}
        />
      );
    
    case 'star':
      return (
        <Star
          x={x}
          y={y}
          numPoints={5}
          innerRadius={size / 4}
          outerRadius={size / 2}
          {...previewProps}
        />
      );
    
    case 'pentagon':
      return (
        <RegularPolygon
          x={x}
          y={y}
          sides={5}
          radius={size / 2}
          {...previewProps}
        />
      );
    
    case 'octagon':
      return (
        <RegularPolygon
          x={x}
          y={y}
          sides={8}
          radius={size / 2}
          {...previewProps}
        />
      );
    
    default:
      return null;
  }
};

