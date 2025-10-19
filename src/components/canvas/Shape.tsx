import React, { useState } from 'react';
import { Rect, Circle, Ellipse, Star, RegularPolygon } from 'react-konva';
import type { CanvasObject } from '../../types';
import Konva from 'konva';

interface ShapeProps {
  shape: CanvasObject;
  isSelected: boolean;
  onSelect: (id: string, event?: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragStart: (id: string) => void;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  isBeingEdited?: boolean;
  editorName?: string;
  editorColor?: string;
}

/**
 * Shape Component (Memoized for Performance)
 * 
 * Only re-renders when:
 * - Shape position/size/color changes
 * - Selection state changes
 * 
 * This prevents unnecessary re-renders when other shapes change,
 * dramatically improving performance with many shapes (500+)
 */
export const Shape = React.memo(({ 
  shape, 
  isSelected, 
  onSelect, 
  onDragStart,
  onDragMove,
  onDragEnd,
  isBeingEdited = false,
  editorName,
  editorColor,
}: ShapeProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleDragStart = () => {
    onDragStart(shape.id);
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    let currentX = node.x();
    let currentY = node.y();
    
    // For center-based shapes, convert center position back to top-left equivalent
    if (shape.type !== 'rectangle') {
      currentX = node.x() - shape.width / 2;
      currentY = node.y() - shape.height / 2;
    }
    
    onDragMove(shape.id, currentX, currentY);
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    let finalX = node.x();
    let finalY = node.y();
    
    // For center-based shapes, convert center position back to top-left equivalent
    // This ensures consistent storage format in the database
    if (shape.type !== 'rectangle') {
      finalX = node.x() - shape.width / 2;
      finalY = node.y() - shape.height / 2;
    }
    
    onDragEnd(shape.id, finalX, finalY);
  };

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    onSelect(shape.id, e);
  };

  // Determine stroke styling based on state priority
  // Priority: Selected > Being Edited > Hovered > Default shape stroke
  let stroke: string | undefined;
  let strokeWidth: number;
  let dash: number[] | undefined;
  
  if (isSelected) {
    // Selected: Solid blue border
    stroke = '#3B82F6'; // blue-500
    strokeWidth = 3;
    dash = undefined;
  } else if (isBeingEdited && editorColor) {
    // Being edited: Pulsing border with editor's color
    stroke = editorColor;
    strokeWidth = 2;
    dash = [8, 4]; // Dashed border for edit indicator
  } else if (isHovered) {
    // Hovered: Gray border
    stroke = '#6B7280';
    strokeWidth = 2;
    dash = undefined;
  } else {
    // Default: Use shape's own stroke properties if defined
    stroke = shape.stroke;
    strokeWidth = shape.strokeWidth || 0;
    dash = undefined;
  }

  // Common props for all shapes
  const commonProps = {
    fill: shape.fill,
    draggable: true,
    onClick: handleClick,
    onTap: handleClick,
    onDragStart: handleDragStart,
    onDragMove: handleDragMove,
    onDragEnd: handleDragEnd,
    stroke,
    strokeWidth,
    dash,
    opacity: isHovered && !isSelected && !isBeingEdited ? 0.8 : 1,
    name: isBeingEdited && editorName ? `editing-by-${editorName}` : undefined,
    perfectDrawEnabled: false,
    onMouseEnter: (e: Konva.KonvaEventObject<MouseEvent>) => {
      const container = e.target.getStage()?.container();
      if (container) {
        container.style.cursor = 'move';
        if (isBeingEdited && editorName) {
          container.title = `${editorName} is editing this shape`;
        }
      }
      setIsHovered(true);
    },
    onMouseLeave: (e: Konva.KonvaEventObject<MouseEvent>) => {
      const container = e.target.getStage()?.container();
      if (container) {
        container.style.cursor = 'default';
        container.title = '';
      }
      setIsHovered(false);
    },
  };

  // Render based on shape type
  switch (shape.type) {
    case 'rectangle':
      return (
        <Rect
          x={shape.x}
          y={shape.y}
          width={shape.width}
          height={shape.height}
          {...commonProps}
        />
      );

    case 'circle':
      // Circle uses center point (x, y) and radius
      return (
        <Circle
          x={shape.x + shape.width / 2}
          y={shape.y + shape.height / 2}
          radius={shape.width / 2}
          {...commonProps}
        />
      );

    case 'ellipse':
      // Ellipse uses center point and separate radiuses for X and Y
      return (
        <Ellipse
          x={shape.x + shape.width / 2}
          y={shape.y + shape.height / 2}
          radiusX={shape.width / 2}
          radiusY={shape.height / 2}
          {...commonProps}
        />
      );

    case 'star':
      // Star uses center point, outer radius, inner radius, and number of points
      return (
        <Star
          x={shape.x + shape.width / 2}
          y={shape.y + shape.height / 2}
          numPoints={5}
          innerRadius={shape.width / 4}
          outerRadius={shape.width / 2}
          {...commonProps}
        />
      );

    case 'pentagon':
      // Pentagon is a regular polygon with 5 sides
      return (
        <RegularPolygon
          x={shape.x + shape.width / 2}
          y={shape.y + shape.height / 2}
          sides={5}
          radius={shape.width / 2}
          {...commonProps}
        />
      );

    case 'octagon':
      // Octagon is a regular polygon with 8 sides
      return (
        <RegularPolygon
          x={shape.x + shape.width / 2}
          y={shape.y + shape.height / 2}
          sides={8}
          radius={shape.width / 2}
          {...commonProps}
        />
      );

    default:
      return null;
  }
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  // Returns true if props are equal (skip re-render)
  // Returns false if props changed (re-render)
  
  const shapeEqual = 
    prevProps.shape.id === nextProps.shape.id &&
    prevProps.shape.x === nextProps.shape.x &&
    prevProps.shape.y === nextProps.shape.y &&
    prevProps.shape.width === nextProps.shape.width &&
    prevProps.shape.height === nextProps.shape.height &&
    prevProps.shape.fill === nextProps.shape.fill &&
    prevProps.shape.type === nextProps.shape.type;
  
  const selectionEqual = prevProps.isSelected === nextProps.isSelected;
  
  const editIndicatorEqual = 
    prevProps.isBeingEdited === nextProps.isBeingEdited &&
    prevProps.editorName === nextProps.editorName &&
    prevProps.editorColor === nextProps.editorColor;
  
  // Return true if nothing changed (prevents re-render)
  return shapeEqual && selectionEqual && editIndicatorEqual;
});

