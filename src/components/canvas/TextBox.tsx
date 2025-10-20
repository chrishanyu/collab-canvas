import React, { useState } from 'react';
import { Text, Group, Rect } from 'react-konva';
import type { CanvasObject } from '../../types';
import Konva from 'konva';
import { DEFAULT_FONT_SIZE, DEFAULT_FONT_FAMILY, DEFAULT_TEXT_COLOR } from '../../utils/constants';

interface TextBoxProps {
  shape: CanvasObject;
  isSelected: boolean;
  isEditMode?: boolean; // Is this text box in edit mode?
  onSelect: (id: string, event?: Konva.KonvaEventObject<MouseEvent>) => void;
  onDragStart: (id: string) => void;
  onDragMove: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string, x: number, y: number) => void;
  onEnterEditMode?: (id: string) => void; // Enter edit mode (double-click)
  isBeingEdited?: boolean;
  editorName?: string;
  editorColor?: string;
}

/**
 * TextBox Component (Memoized for Performance)
 * 
 * Renders text boxes using Konva Text component with:
 * - Automatic text wrapping at box boundaries
 * - Multi-line support
 * - Selection and hover states
 * - Edit indicators for collaborative editing
 * 
 * Note: This component renders read-only text.
 * Edit mode (textarea overlay) will be added in Task 3.0
 */
export const TextBox = React.memo(({
  shape,
  isSelected,
  isEditMode = false,
  onSelect,
  onDragStart,
  onDragMove,
  onDragEnd,
  onEnterEditMode,
  isBeingEdited = false,
  editorName,
  editorColor,
}: TextBoxProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleDragStart = () => {
    onDragStart(shape.id);
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const currentX = node.x();
    const currentY = node.y();
    
    onDragMove(shape.id, currentX, currentY);
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target;
    const finalX = node.x();
    const finalY = node.y();
    
    onDragEnd(shape.id, finalX, finalY);
  };

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    onSelect(shape.id, e);
  };

  // Double-click to enter edit mode
  const handleDoubleClick = () => {
    if (onEnterEditMode) {
      onEnterEditMode(shape.id);
    }
  };

  // Determine border styling based on state priority
  // Priority: Selected > Being Edited > Hovered > No border
  let borderStroke: string | undefined;
  let borderStrokeWidth: number = 0;
  let borderDash: number[] | undefined;
  let showBorder = false;
  
  if (isSelected) {
    // Selected: Solid blue border
    borderStroke = '#3B82F6'; // blue-500
    borderStrokeWidth = 2;
    borderDash = undefined;
    showBorder = true;
  } else if (isBeingEdited && editorColor) {
    // Being edited: Dashed border with editor's color
    borderStroke = editorColor;
    borderStrokeWidth = 2;
    borderDash = [8, 4]; // Dashed border for edit indicator
    showBorder = true;
  } else if (isHovered) {
    // Hovered: Light gray border
    borderStroke = '#9CA3AF'; // gray-400
    borderStrokeWidth = 1;
    borderDash = undefined;
    showBorder = true;
  }

  // Get text properties with defaults
  const text = shape.text || '';
  const fontSize = shape.fontSize || DEFAULT_FONT_SIZE;
  const fontFamily = shape.fontFamily || DEFAULT_FONT_FAMILY;
  const color = shape.color || DEFAULT_TEXT_COLOR;
  
  // Get text formatting
  const isBold = shape.textFormat?.bold || false;
  const isItalic = shape.textFormat?.italic || false;
  
  // Build fontStyle string for Konva (e.g., "bold italic" or "normal")
  const fontStyle = [
    isBold ? 'bold' : '',
    isItalic ? 'italic' : '',
  ].filter(Boolean).join(' ') || 'normal';

  return (
    <Group
      x={shape.x}
      y={shape.y}
      width={shape.width}
      height={shape.height}
      draggable={!isEditMode}
      onClick={handleClick}
      onTap={handleClick}
      onDblClick={handleDoubleClick}
      onDblTap={handleDoubleClick}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onMouseEnter={(e: Konva.KonvaEventObject<MouseEvent>) => {
        const container = e.target.getStage()?.container();
        if (container) {
          container.style.cursor = 'move';
          if (isBeingEdited && editorName) {
            container.title = `${editorName} is editing this text`;
          }
        }
        setIsHovered(true);
      }}
      onMouseLeave={(e: Konva.KonvaEventObject<MouseEvent>) => {
        const container = e.target.getStage()?.container();
        if (container) {
          container.style.cursor = 'default';
          container.title = '';
        }
        setIsHovered(false);
      }}
    >
      {/* Hit Area - invisible rectangle for mouse interaction */}
      <Rect
        x={0}
        y={0}
        width={shape.width}
        height={shape.height}
        fill="transparent"
        listening={true}
        perfectDrawEnabled={false}
      />
      
      {/* Border Rectangle - shows when selected, being edited, or hovered */}
      {showBorder && (
        <Rect
          x={0}
          y={0}
          width={shape.width}
          height={shape.height}
          stroke={borderStroke}
          strokeWidth={borderStrokeWidth}
          dash={borderDash}
          fill="transparent"
          listening={false}
          perfectDrawEnabled={false}
        />
      )}
      
      {/* Text Content */}
      <Text
        x={0}
        y={0}
        width={shape.width}
        height={shape.height}
        text={text}
        fontSize={fontSize}
        fontFamily={fontFamily}
        fontStyle={fontStyle}
        fill={color}
        wrap="word"
        align="left"
        opacity={isEditMode ? 0 : 1}
        listening={false}
        perfectDrawEnabled={false}
      />
    </Group>
  );
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
    prevProps.shape.text === nextProps.shape.text &&
    prevProps.shape.fontSize === nextProps.shape.fontSize &&
    prevProps.shape.fontFamily === nextProps.shape.fontFamily &&
    prevProps.shape.color === nextProps.shape.color &&
    prevProps.shape.type === nextProps.shape.type &&
    prevProps.shape.textFormat?.bold === nextProps.shape.textFormat?.bold &&
    prevProps.shape.textFormat?.italic === nextProps.shape.textFormat?.italic;
  
  const selectionEqual = prevProps.isSelected === nextProps.isSelected;
  const editModeEqual = prevProps.isEditMode === nextProps.isEditMode;
  
  const editIndicatorEqual = 
    prevProps.isBeingEdited === nextProps.isBeingEdited &&
    prevProps.editorName === nextProps.editorName &&
    prevProps.editorColor === nextProps.editorColor;
  
  // Return true if nothing changed (prevents re-render)
  return shapeEqual && selectionEqual && editModeEqual && editIndicatorEqual;
});

