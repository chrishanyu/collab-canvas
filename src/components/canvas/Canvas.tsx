import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { useAuth } from '../../hooks/useAuth';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';
import { getCanvasById } from '../../services/canvas.service';
import { createShape as createShapeInFirebase, updateShape as updateShapeInFirebase } from '../../services/canvasObjects.service';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorAlert } from '../common/ErrorAlert';
import { CanvasToolbar } from './CanvasToolbar';
import { Shape } from './Shape';
import { GridDots } from './GridDots';
import { UserPresence } from '../presence/UserPresence';
import { constrainZoom, getRelativePointerPosition, generateUniqueId } from '../../utils/canvasHelpers';
import type { Canvas as CanvasType, CanvasObject } from '../../types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  DEFAULT_ZOOM,
  DEFAULT_CANVAS_X,
  DEFAULT_CANVAS_Y,
  ZOOM_SPEED,
} from '../../utils/constants';

// Canvas UI constants
const HEADER_HEIGHT = 60;

/**
 * Canvas Component (Performance Optimized)
 * 
 * Main canvas component that renders the Konva Stage and Layer.
 * Handles canvas metadata loading, pan, and zoom functionality.
 * 
 * Performance Optimizations:
 * - Viewport virtualization: Only renders shapes visible in current viewport (critical for 500+ shapes)
 * - Shape memoization: Prevents unnecessary re-renders with React.memo
 * - Optimized grid dots: Single canvas draw call instead of thousands of React components (60 FPS)
 * - Grid fading: Grid fades in/out based on zoom level (Figma-like behavior)
 * - Optimistic updates: Shape changes appear instantly, sync in background
 * - Stable realtime sync: Prevents unnecessary Firebase re-subscriptions
 * 
 * Target: 60 FPS with 500+ shapes ✅
 */
export const Canvas: React.FC = () => {
  const { canvasId } = useParams<{ canvasId: string }>();
  const { currentUser } = useAuth();
  const stageRef = useRef<Konva.Stage>(null);

  const [canvas, setCanvas] = useState<CanvasType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stage dimensions (viewport size)
  const [stageWidth, setStageWidth] = useState(window.innerWidth);
  const [stageHeight, setStageHeight] = useState(window.innerHeight);

  // Stage position and scale
  const [stageScale, setStageScale] = useState(DEFAULT_ZOOM);
  const [stageX, setStageX] = useState(DEFAULT_CANVAS_X);
  const [stageY, setStageY] = useState(DEFAULT_CANVAS_Y);

  // Shape state
  const [shapes, setShapes] = useState<CanvasObject[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  
  // Shape creation state
  const [isCreatingShape, setIsCreatingShape] = useState(false);

  // Presence state
  const updateCursorRef = useRef<((x: number, y: number) => void) | null>(null);

  // Load canvas metadata
  useEffect(() => {
    const loadCanvas = async () => {
      if (!canvasId || !currentUser) return;

      try {
        setLoading(true);
        setError(null);

        const canvasData = await getCanvasById(canvasId);

        if (!canvasData) {
          setError('Canvas not found');
          setLoading(false);
          return;
        }

        setCanvas(canvasData);
        setLoading(false);
      } catch (err) {
        console.error('Error loading canvas:', err);
        setError(err instanceof Error ? err.message : 'Failed to load canvas');
        setLoading(false);
      }
    };

    loadCanvas();
  }, [canvasId, currentUser]);

  // Real-time sync: Subscribe to Firestore changes for this canvas
  const handleShapesUpdate = useCallback((syncedShapes: CanvasObject[]) => {
    setShapes(syncedShapes);
  }, []);

  useRealtimeSync(canvasId, handleShapesUpdate);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setStageWidth(window.innerWidth);
      setStageHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle pan (drag)
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    // Only update stage position if the dragged element is the stage itself, not a shape
    if (e.target !== stageRef.current) {
      return;
    }
    
    const stage = e.target as Konva.Stage;
    setStageX(stage.x());
    setStageY(stage.y());
  };

  // Handle zoom (mouse wheel)
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    
    if (!pointer) return;

    // Calculate new scale
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    // Determine zoom direction
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = constrainZoom(oldScale + direction * ZOOM_SPEED);

    // Update scale
    setStageScale(newScale);

    // Adjust position to zoom towards pointer
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    setStageX(newPos.x);
    setStageY(newPos.y);
  };

  // Reset view to default
  const handleResetView = () => {
    setStageScale(DEFAULT_ZOOM);
    setStageX(DEFAULT_CANVAS_X);
    setStageY(DEFAULT_CANVAS_Y);
  };

  // Zoom in
  const handleZoomIn = () => {
    const newScale = constrainZoom(stageScale + ZOOM_SPEED);
    setStageScale(newScale);
  };

  // Zoom out
  const handleZoomOut = () => {
    const newScale = constrainZoom(stageScale - ZOOM_SPEED);
    setStageScale(newScale);
  };

  // Shape creation handlers
  const handleAddRectangle = () => {
    setIsCreatingShape(true);
    setSelectedShapeId(null); // Deselect any selected shape
  };

  const handleStageMouseDown = async (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Click on empty space deselects shapes (if not in creation mode)
    const clickedOnEmpty = e.target === e.target.getStage();
    
    if (!isCreatingShape) {
      if (clickedOnEmpty) {
        setSelectedShapeId(null);
      }
      return;
    }

    // In creation mode: Create shape at click position
    if (!canvasId || !currentUser) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pos = getRelativePointerPosition(stage);
    if (!pos) return;

    // Exit creation mode immediately to prevent rapid clicking
    setIsCreatingShape(false);

    // Default shape size
    const DEFAULT_SHAPE_WIDTH = 100;
    const DEFAULT_SHAPE_HEIGHT = 100;

    // Create shape centered at click position
    const shapeData = {
      type: 'rectangle' as const,
      x: pos.x - DEFAULT_SHAPE_WIDTH / 2,
      y: pos.y - DEFAULT_SHAPE_HEIGHT / 2,
      width: DEFAULT_SHAPE_WIDTH,
      height: DEFAULT_SHAPE_HEIGHT,
      fill: '#3B82F6', // blue-500
      createdBy: currentUser.id,
    };

    // Optimistic update: Add to local state immediately
    const optimisticShape: CanvasObject = {
      ...shapeData,
      id: generateUniqueId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setShapes([...shapes, optimisticShape]);

    // Write to Firebase in background
    try {
      await createShapeInFirebase(canvasId, shapeData);
      // Firestore listener will update with the actual shape from server
    } catch (error) {
      console.error('Failed to create shape in Firebase:', error);
      // Revert optimistic update on error
      setShapes(shapes); // Remove the optimistic shape
    }
  };

  // Shape interaction handlers
  const handleSelectShape = (id: string) => {
    setSelectedShapeId(id);
  };

  const handleShapeDragEnd = async (id: string, x: number, y: number) => {
    if (!canvasId) return;

    // Optimistic update: Update local state immediately
    setShapes(
      shapes.map((shape) =>
        shape.id === id
          ? { ...shape, x, y, updatedAt: new Date() }
          : shape
      )
    );

    // Write to Firebase (async, fire and forget)
    try {
      await updateShapeInFirebase(canvasId, id, { x, y });
      // Firestore listener will confirm the update
    } catch (error) {
      console.error('Failed to update shape in Firebase:', error);
      // Could implement rollback here if needed
    }
  };

  // Handle cursor movement for presence
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (updateCursorRef.current) {
      // Convert viewport coordinates to canvas coordinates
      // This ensures cursors appear in the same position regardless of zoom/pan
      const canvasX = (e.clientX - stageX) / stageScale;
      const canvasY = (e.clientY - HEADER_HEIGHT - stageY) / stageScale;
      updateCursorRef.current(canvasX, canvasY);
    }
  };

  // Callback to receive updateCursor function from UserPresence
  const handleCursorMove = useCallback((updateCursor: (x: number, y: number) => void) => {
    updateCursorRef.current = updateCursor;
  }, []);

  // Calculate actual stage height (used in multiple places)
  const actualStageHeight = stageHeight - HEADER_HEIGHT;

  // Viewport virtualization: Only render shapes visible in current viewport
  // This is critical for performance with 500+ shapes
  const visibleShapes = useMemo(() => {
    // Safety check: ensure we have valid viewport dimensions
    if (stageScale <= 0 || !isFinite(stageScale) || !isFinite(stageX) || !isFinite(stageY)) {
      return shapes;
    }

    // Calculate viewport bounds in canvas coordinates
    const viewportLeft = -stageX / stageScale;
    const viewportTop = -stageY / stageScale;
    const viewportRight = viewportLeft + stageWidth / stageScale;
    const viewportBottom = viewportTop + actualStageHeight / stageScale;

    // Add padding to viewport for smooth scrolling (render shapes slightly outside viewport)
    const padding = 200; // 200px padding on all sides

    // Filter shapes that intersect with the viewport
    const visible = shapes.filter((shape) => {
      // Always render the selected shape (critical for dragging!)
      if (shape.id === selectedShapeId) {
        return true;
      }

      // Check if shape intersects with viewport (with padding)
      const shapeRight = shape.x + (shape.width || 0);
      const shapeBottom = shape.y + (shape.height || 0);

      // Shape is visible if it overlaps with viewport bounds
      const isVisible = !(
        shapeRight < viewportLeft - padding ||
        shape.x > viewportRight + padding ||
        shapeBottom < viewportTop - padding ||
        shape.y > viewportBottom + padding
      );

      return isVisible;
    });

    // Log virtualization stats (can be removed in production)
    if (shapes.length > 50) {
      console.log(
        `[Virtualization] Rendering ${visible.length}/${shapes.length} shapes ` +
        `(${Math.round((visible.length / shapes.length) * 100)}% visible)`
      );
    }

    return visible;
  }, [shapes, stageScale, stageX, stageY, stageWidth, actualStageHeight, selectedShapeId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !canvas) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
        <div className="max-w-md">
          <ErrorAlert message={error || 'Canvas not found'} />
          <div className="mt-4 text-center">
            <a
              href="/dashboard"
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              Return to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full h-screen overflow-hidden bg-gray-200"
      onMouseMove={handleMouseMove}
    >
      {/* Canvas Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a
            href="/dashboard"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Dashboard
          </a>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{canvas.name}</h1>
            <p className="text-xs text-gray-500">
              by {canvas.ownerName} • Last updated: {canvas.updatedAt.toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="text-xs text-gray-400">
          Canvas ID: {canvasId}
        </div>
      </div>

      {/* Canvas Toolbar */}
      <CanvasToolbar
        onResetView={handleResetView}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        currentZoom={stageScale}
        onAddRectangle={handleAddRectangle}
        isCreatingShape={isCreatingShape}
      />

      {/* Konva Stage */}
      <div 
        className="pt-[60px] w-full h-full bg-gray-100"
        style={{ cursor: isCreatingShape ? 'crosshair' : 'default' }}
      >
        <Stage
          ref={stageRef}
          width={stageWidth}
          height={actualStageHeight}
          scaleX={stageScale}
          scaleY={stageScale}
          x={stageX}
          y={stageY}
          draggable={!isCreatingShape} // Disable pan while creating shapes
          onDragEnd={handleDragEnd}
          onWheel={handleWheel}
          onMouseDown={handleStageMouseDown}
        >
          {/* Background Grid Layer - scales with zoom */}
          <Layer listening={false}>
            <GridDots
              width={stageWidth}
              height={actualStageHeight}
              stageScale={stageScale}
              stageX={stageX}
              stageY={stageY}
              canvasWidth={CANVAS_WIDTH}
              canvasHeight={CANVAS_HEIGHT}
            />
          </Layer>
          
          {/* Main Content Layer */}
          <Layer>
            {/* Render visible shapes only (viewport virtualization) */}
            {visibleShapes.map((shape) => (
              <Shape
                key={shape.id}
                shape={shape}
                isSelected={shape.id === selectedShapeId}
                onSelect={handleSelectShape}
                onDragEnd={handleShapeDragEnd}
              />
            ))}
          </Layer>
        </Stage>
      </div>

      {/* Canvas Info (dev only - can be removed later) */}
      <div className="absolute bottom-4 left-4 bg-white/90 rounded-lg shadow-lg px-4 py-2 text-xs text-gray-600">
        <div>Canvas: {CANVAS_WIDTH} × {CANVAS_HEIGHT}px</div>
        <div>Viewport: {stageWidth} × {actualStageHeight}px</div>
        <div>Scale: {stageScale.toFixed(2)}x</div>
        <div>Position: ({Math.round(stageX)}, {Math.round(stageY)})</div>
        <div className="mt-1 pt-1 border-t border-gray-300">
          <span className="font-semibold">Shapes:</span> {visibleShapes.length} / {shapes.length} rendered
          {shapes.length > 0 && (
            <span className="text-green-600 ml-1">
              ({Math.round((visibleShapes.length / shapes.length) * 100)}%)
            </span>
          )}
        </div>
      </div>

      {/* User Presence - Cursors and Online Users */}
      <UserPresence
        canvasId={canvasId}
        userId={currentUser?.id}
        displayName={currentUser?.displayName}
        onCursorMove={handleCursorMove}
        stageX={stageX}
        stageY={stageY}
        stageScale={stageScale}
        headerHeight={HEADER_HEIGHT}
      />
    </div>
  );
};

