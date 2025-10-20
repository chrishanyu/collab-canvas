import React from 'react';
import { Rect, Group } from 'react-konva';
import type { CanvasObject } from '../../types';
import Konva from 'konva';

interface TransformHandlesProps {
  shape: CanvasObject;
  onResize: (id: string, x: number, y: number, width: number, height: number) => void;
  onResizeEnd: (id: string) => void;
  stageScale: number; // For scaling handle sizes to remain constant regardless of zoom
}

/**
 * TransformHandles Component
 * 
 * Renders resize handles for a selected shape.
 * - For regular shapes: 4 corner resize handles
 * - For text boxes: 2 edge handles (left and right) for horizontal resizing only
 * 
 * Only shown when a single shape is selected (not for multi-selection).
 */
export const TransformHandles: React.FC<TransformHandlesProps> = ({
  shape,
  onResize,
  onResizeEnd,
  stageScale,
}) => {
  // Handle size in pixels (will be scaled to appear constant size)
  const HANDLE_SIZE = 8;
  
  // Scale handles inversely to stage scale so they appear constant size
  const handleScale = 1 / stageScale;
  const handleStrokeWidth = 2 * handleScale;

  // Track drag start position for resize calculations
  const dragStartRef = React.useRef<{
    mouseX: number;
    mouseY: number;
    shapeX: number;
    shapeY: number;
    shapeWidth: number;
    shapeHeight: number;
  } | null>(null);

  // Track which edge is being dragged (for non-draggable edge handles)
  const activeEdgeRef = React.useRef<'left' | 'right' | null>(null);

  // Calculate handle positions based on shape type
  const getShapeBounds = () => {
    if (shape.type === 'circle') {
      // For circles, the bounds are based on radius
      const radius = shape.width / 2;
      return {
        left: shape.x,
        top: shape.y,
        right: shape.x + shape.width,
        bottom: shape.y + shape.height,
        centerX: shape.x + radius,
        centerY: shape.y + radius,
      };
    } else if (shape.type === 'ellipse') {
      // For ellipses, similar to circles
      return {
        left: shape.x,
        top: shape.y,
        right: shape.x + shape.width,
        bottom: shape.y + shape.height,
        centerX: shape.x + shape.width / 2,
        centerY: shape.y + shape.height / 2,
      };
    } else {
      // For rectangles and other shapes
      return {
        left: shape.x,
        top: shape.y,
        right: shape.x + shape.width,
        bottom: shape.y + shape.height,
        centerX: shape.x + shape.width / 2,
        centerY: shape.y + shape.height / 2,
      };
    }
  };

  const bounds = getShapeBounds();

  // Corner positions for resize handles
  const corners = {
    topLeft: { x: bounds.left, y: bounds.top },
    topRight: { x: bounds.right, y: bounds.top },
    bottomLeft: { x: bounds.left, y: bounds.bottom },
    bottomRight: { x: bounds.right, y: bounds.bottom },
  };

  // Resize logic for each corner
  const handleResizeDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    // Store initial state for resize calculations
    dragStartRef.current = {
      mouseX: pointerPos.x,
      mouseY: pointerPos.y,
      shapeX: shape.x,
      shapeY: shape.y,
      shapeWidth: shape.width,
      shapeHeight: shape.height,
    };
  };

  const handleResizeDragMove = (
    e: Konva.KonvaEventObject<DragEvent>,
    corner: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
  ) => {
    const stage = e.target.getStage();
    if (!stage || !dragStartRef.current) return;

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    const { mouseX, mouseY, shapeX, shapeY, shapeWidth, shapeHeight } = dragStartRef.current;
    
    // Calculate mouse delta (accounting for stage scale)
    const deltaX = (pointerPos.x - mouseX) / stageScale;
    const deltaY = (pointerPos.y - mouseY) / stageScale;

    let newX = shapeX;
    let newY = shapeY;
    let newWidth = shapeWidth;
    let newHeight = shapeHeight;

    // Apply resize based on which corner is being dragged
    switch (corner) {
      case 'topLeft':
        // Anchor: bottom-right stays fixed
        newX = shapeX + deltaX;
        newY = shapeY + deltaY;
        newWidth = shapeWidth - deltaX;
        newHeight = shapeHeight - deltaY;
        break;

      case 'topRight':
        // Anchor: bottom-left stays fixed
        newY = shapeY + deltaY;
        newWidth = shapeWidth + deltaX;
        newHeight = shapeHeight - deltaY;
        break;

      case 'bottomLeft':
        // Anchor: top-right stays fixed
        newX = shapeX + deltaX;
        newWidth = shapeWidth - deltaX;
        newHeight = shapeHeight + deltaY;
        break;

      case 'bottomRight':
        // Anchor: top-left stays fixed
        newWidth = shapeWidth + deltaX;
        newHeight = shapeHeight + deltaY;
        break;
    }

    // Enforce minimum size to prevent inversion
    const MIN_SIZE = 10;
    if (newWidth < MIN_SIZE || newHeight < MIN_SIZE) {
      return;
    }

    // Call the resize handler with new dimensions
    onResize(shape.id, newX, newY, newWidth, newHeight);
  };

  const handleResizeDragEnd = () => {
    dragStartRef.current = null;
    activeEdgeRef.current = null;
    // Save to Firebase after resize completes
    onResizeEnd(shape.id);
  };

  // Edge resize start (for horizontal-only resizing on text boxes)
  const handleEdgeResizeStart = (e: Konva.KonvaEventObject<MouseEvent>, edge: 'left' | 'right') => {
    e.cancelBubble = true;
    const stage = e.target.getStage();
    if (!stage) return;

    const pointerPos = stage.getPointerPosition();
    if (!pointerPos) return;

    // Store initial state for resize calculations
    dragStartRef.current = {
      mouseX: pointerPos.x,
      mouseY: pointerPos.y,
      shapeX: shape.x,
      shapeY: shape.y,
      shapeWidth: shape.width,
      shapeHeight: shape.height,
    };
    
    activeEdgeRef.current = edge;

    // Add stage mouse move and mouse up listeners
    const handleStageMouseMove = () => {
      if (!activeEdgeRef.current || !dragStartRef.current || !stage) return;

      const pointerPos = stage.getPointerPosition();
      if (!pointerPos) return;

      const { mouseX, shapeX, shapeWidth, shapeHeight } = dragStartRef.current;
      
      // Calculate mouse delta (accounting for stage scale)
      const deltaX = (pointerPos.x - mouseX) / stageScale;

      let newX = shapeX;
      let newWidth = shapeWidth;

      // Apply resize based on which edge is being dragged
      if (activeEdgeRef.current === 'left') {
        // Anchor: right edge stays fixed
        newX = shapeX + deltaX;
        newWidth = shapeWidth - deltaX;
      } else {
        // Anchor: left edge stays fixed
        newWidth = shapeWidth + deltaX;
      }

      // Enforce minimum size to prevent inversion
      const MIN_SIZE = 50; // Use MIN_TEXT_WIDTH for text boxes
      if (newWidth < MIN_SIZE) {
        return;
      }

      // Call the resize handler with new width (height will be auto-calculated)
      onResize(shape.id, newX, dragStartRef.current.shapeY, newWidth, shapeHeight);
    };

    const handleStageMouseUp = () => {
      stage.off('mousemove', handleStageMouseMove);
      stage.off('mouseup', handleStageMouseUp);
      handleResizeDragEnd();
    };

    stage.on('mousemove', handleStageMouseMove);
    stage.on('mouseup', handleStageMouseUp);
  };

  // Render a single resize handle (corner)
  const renderResizeHandle = (
    corner: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight',
    position: { x: number; y: number }
  ) => {
    return (
      <Rect
        key={`handle-${corner}`}
        x={position.x - (HANDLE_SIZE * handleScale) / 2}
        y={position.y - (HANDLE_SIZE * handleScale) / 2}
        width={HANDLE_SIZE * handleScale}
        height={HANDLE_SIZE * handleScale}
        fill="white"
        stroke="#3B82F6" // blue-500
        strokeWidth={handleStrokeWidth}
        cornerRadius={2 * handleScale}
        draggable={true}
        onDragStart={(e) => {
          e.cancelBubble = true; // Prevent stage drag
          handleResizeDragStart(e);
        }}
        onDragMove={(e) => {
          e.cancelBubble = true;
          handleResizeDragMove(e, corner);
        }}
        onDragEnd={(e) => {
          e.cancelBubble = true;
          handleResizeDragEnd();
        }}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            // Set cursor based on corner
            const cursors = {
              topLeft: 'nwse-resize',
              topRight: 'nesw-resize',
              bottomLeft: 'nesw-resize',
              bottomRight: 'nwse-resize',
            };
            container.style.cursor = cursors[corner];
          }
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'default';
          }
        }}
        perfectDrawEnabled={false}
      />
    );
  };

  // Render a single edge handle (for text boxes)
  const renderEdgeHandle = (
    edge: 'left' | 'right',
    position: { x: number; y: number }
  ) => {
    return (
      <Rect
        key={`handle-${edge}`}
        x={position.x - (HANDLE_SIZE * handleScale) / 2}
        y={position.y - (HANDLE_SIZE * handleScale) / 2}
        width={HANDLE_SIZE * handleScale}
        height={HANDLE_SIZE * handleScale}
        fill="white"
        stroke="#3B82F6" // blue-500
        strokeWidth={handleStrokeWidth}
        cornerRadius={2 * handleScale}
        draggable={false}
        onMouseDown={(e) => {
          handleEdgeResizeStart(e, edge);
        }}
        onMouseEnter={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'ew-resize'; // Horizontal resize cursor
          }
        }}
        onMouseLeave={(e) => {
          const container = e.target.getStage()?.container();
          if (container) {
            container.style.cursor = 'default';
          }
        }}
        perfectDrawEnabled={false}
      />
    );
  };

  // For text boxes, render edge handles (left and right only)
  // For other shapes, render corner handles
  const isTextBox = shape.type === 'text';

  return (
    <Group listening={true}>
      {isTextBox ? (
        <>
          {/* Edge handles for text boxes (horizontal resize only) */}
          {renderEdgeHandle('left', { x: bounds.left, y: bounds.centerY })}
          {renderEdgeHandle('right', { x: bounds.right, y: bounds.centerY })}
        </>
      ) : (
        <>
          {/* Corner handles for regular shapes */}
          {renderResizeHandle('topLeft', corners.topLeft)}
          {renderResizeHandle('topRight', corners.topRight)}
          {renderResizeHandle('bottomLeft', corners.bottomLeft)}
          {renderResizeHandle('bottomRight', corners.bottomRight)}
        </>
      )}
    </Group>
  );
};

