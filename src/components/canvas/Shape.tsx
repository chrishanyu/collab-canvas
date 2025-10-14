import React, { useState } from 'react';
import { Rect } from 'react-konva';
import type { CanvasObject } from '../../types';
import Konva from 'konva';

interface ShapeProps {
  shape: CanvasObject;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
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
export const Shape = React.memo(({ shape, isSelected, onSelect, onDragEnd }: ShapeProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    onDragEnd(shape.id, node.x(), node.y());
  };

  const handleClick = () => {
    onSelect(shape.id);
  };

  // Render rectangle shape
  if (shape.type === 'rectangle') {
    return (
      <Rect
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        fill={shape.fill}
        draggable
        onClick={handleClick}
        onTap={handleClick}
        onDragEnd={handleDragEnd}
        // Visual feedback
        stroke={isSelected ? '#10B981' : isHovered ? '#6B7280' : undefined}
        strokeWidth={isSelected ? 3 : isHovered ? 2 : 0}
        opacity={isHovered && !isSelected ? 0.8 : 1}
        // Performance optimization
        perfectDrawEnabled={false}
        // Cursor feedback
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'move';
          }
          setIsHovered(true);
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'default';
          }
          setIsHovered(false);
        }}
      />
    );
  }

  // Placeholder for other shape types (circle, text) - to be implemented later
  return null;
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
  
  // Return true if nothing changed (prevents re-render)
  return shapeEqual && selectionEqual;
});

