import React, { useState } from 'react';
import { Rect } from 'react-konva';
import type { CanvasObject } from '../../types';
import Konva from 'konva';

interface ShapeProps {
  shape: CanvasObject;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDragStart: (id: string) => void;
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
  onDragEnd,
  isBeingEdited = false,
  editorName,
  editorColor,
}: ShapeProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleDragStart = () => {
    onDragStart(shape.id);
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    onDragEnd(shape.id, node.x(), node.y());
  };

  const handleClick = () => {
    onSelect(shape.id);
  };

  // Determine stroke styling based on state priority
  // Priority: Selected > Being Edited > Hovered
  let stroke: string | undefined;
  let strokeWidth: number;
  let dash: number[] | undefined;
  
  if (isSelected) {
    // Selected: Solid green border
    stroke = '#10B981';
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
    stroke = undefined;
    strokeWidth = 0;
    dash = undefined;
  }

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
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        // Visual feedback
        stroke={stroke}
        strokeWidth={strokeWidth}
        dash={dash}
        opacity={isHovered && !isSelected && !isBeingEdited ? 0.8 : 1}
        // Add name for accessibility/debugging and potential tooltip
        name={isBeingEdited && editorName ? `editing-by-${editorName}` : undefined}
        // Performance optimization
        perfectDrawEnabled={false}
        // Cursor feedback
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'move';
            // Show tooltip for editing indicator
            if (isBeingEdited && editorName) {
              container.title = `${editorName} is editing this shape`;
            }
          }
          setIsHovered(true);
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'default';
            container.title = '';
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
  
  const editIndicatorEqual = 
    prevProps.isBeingEdited === nextProps.isBeingEdited &&
    prevProps.editorName === nextProps.editorName &&
    prevProps.editorColor === nextProps.editorColor;
  
  // Return true if nothing changed (prevents re-render)
  return shapeEqual && selectionEqual && editIndicatorEqual;
});

