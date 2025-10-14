import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Stage, Layer, Circle } from 'react-konva';
import Konva from 'konva';
import { useAuth } from '../../hooks/useAuth';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';
import { getCanvasById } from '../../services/canvas.service';
import { createShape as createShapeInFirebase, updateShape as updateShapeInFirebase } from '../../services/canvasObjects.service';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorAlert } from '../common/ErrorAlert';
import { CanvasToolbar } from './CanvasToolbar';
import { Shape } from './Shape';
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
const MAX_GRID_DOTS = 10000; // Safety limit to prevent performance issues

/**
 * Canvas Component (Performance Optimized)
 * 
 * Main canvas component that renders the Konva Stage and Layer.
 * Handles canvas metadata loading, pan, and zoom functionality.
 * 
 * Performance Optimizations:
 * - Viewport virtualization: Only renders shapes visible in current viewport (critical for 500+ shapes)
 * - Shape memoization: Prevents unnecessary re-renders with React.memo
 * - Grid layer caching: Static grid is cached to reduce draw calls
 * - Memoized grid dots: Grid only recalculates when viewport changes
 * - Viewport culling: Only visible grid dots are rendered
 * - Optimistic updates: Shape changes appear instantly, sync in background
 * - Stable realtime sync: Prevents unnecessary Firebase re-subscriptions
 * 
 * Note: Shape layer is NOT cached to preserve interactivity (drag, click, etc.)
 * 
 * Target: 60 FPS with 500+ shapes ✅
 */
export const Canvas: React.FC = () => {
  const { canvasId } = useParams<{ canvasId: string }>();
  const { currentUser } = useAuth();
  const stageRef = useRef<Konva.Stage>(null);
  
  // Layer ref for grid caching optimization
  const gridLayerRef = useRef<Konva.Layer>(null);

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
  const [newShapeStart, setNewShapeStart] = useState<{ x: number; y: number } | null>(null);
  const [newShapePreview, setNewShapePreview] = useState<CanvasObject | null>(null);

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

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Only handle shape creation if in creation mode
    if (!isCreatingShape) {
      // Click on empty space deselects shapes
      const clickedOnEmpty = e.target === e.target.getStage();
      if (clickedOnEmpty) {
        setSelectedShapeId(null);
      }
      return;
    }

    // Start creating shape
    const stage = stageRef.current;
    if (!stage) return;

    const pos = getRelativePointerPosition(stage);
    if (!pos) return;

    setNewShapeStart(pos);
  };

  const handleStageMouseMove = () => {
    if (!isCreatingShape || !newShapeStart) return;

    const stage = stageRef.current;
    if (!stage) return;

    const pos = getRelativePointerPosition(stage);
    if (!pos) return;

    // Calculate rectangle dimensions
    const width = pos.x - newShapeStart.x;
    const height = pos.y - newShapeStart.y;

    // Create preview shape
    const preview: CanvasObject = {
      id: 'preview',
      type: 'rectangle',
      x: width >= 0 ? newShapeStart.x : pos.x,
      y: height >= 0 ? newShapeStart.y : pos.y,
      width: Math.abs(width),
      height: Math.abs(height),
      fill: '#3B82F6', // blue-500
      createdBy: currentUser?.id || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setNewShapePreview(preview);
  };

  const handleStageMouseUp = async () => {
    if (!isCreatingShape || !newShapePreview || !canvasId || !currentUser) return;

    // Only create shape if it has meaningful size (at least 5x5 pixels)
    if (newShapePreview.width >= 5 && newShapePreview.height >= 5) {
      const shapeData = {
        type: newShapePreview.type,
        x: newShapePreview.x,
        y: newShapePreview.y,
        width: newShapePreview.width,
        height: newShapePreview.height,
        fill: newShapePreview.fill,
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

      // Write to Firebase (async, fire and forget)
      try {
        await createShapeInFirebase(canvasId, shapeData);
        // Firestore listener will update with the actual shape from server
      } catch (error) {
        console.error('Failed to create shape in Firebase:', error);
        // Revert optimistic update on error
        setShapes(shapes); // Remove the optimistic shape
      }
    }

    // Reset creation state
    setIsCreatingShape(false);
    setNewShapeStart(null);
    setNewShapePreview(null);
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

  // Generate grid dots for background (optimized for viewport)
  // Memoized to prevent unnecessary re-renders
  const gridDots = useMemo(() => {
    const dots: React.ReactElement[] = [];
    const dotSpacing = 20; // 20px spacing between dots
    const dotRadius = 1; // 1px dot radius
    const dotColor = '#d1d5db'; // gray-300

    // Prevent errors when stageScale, stageX, or stageY are invalid
    if (
      stageScale <= 0 || 
      !isFinite(stageScale) || 
      !isFinite(stageX) || 
      !isFinite(stageY)
    ) {
      return dots;
    }

    // Calculate visible area based on current pan and zoom with safety checks
    const viewportWidth = stageWidth / stageScale;
    const viewportHeight = actualStageHeight / stageScale;
    const viewportX = -stageX / stageScale;
    const viewportY = -stageY / stageScale;

    // Add padding for smooth scrolling
    const padding = dotSpacing * 5;

    const visibleStartX = Math.floor((viewportX - padding) / dotSpacing) * dotSpacing;
    const visibleEndX = Math.ceil((viewportX + viewportWidth + padding) / dotSpacing) * dotSpacing;
    const visibleStartY = Math.floor((viewportY - padding) / dotSpacing) * dotSpacing;
    const visibleEndY = Math.ceil((viewportY + viewportHeight + padding) / dotSpacing) * dotSpacing;

    // Safety check: if range is invalid, return empty
    const xRange = visibleEndX - visibleStartX;
    const yRange = visibleEndY - visibleStartY;
    if (xRange < 0 || yRange < 0 || !isFinite(xRange) || !isFinite(yRange)) {
      return dots;
    }

    // Safety check: prevent rendering too many dots
    const estimatedDots = (xRange / dotSpacing) * (yRange / dotSpacing);
    if (estimatedDots > MAX_GRID_DOTS) {
      return dots;
    }

    // Render all visible dots
    for (let x = visibleStartX; x <= visibleEndX; x += dotSpacing) {
      for (let y = visibleStartY; y <= visibleEndY; y += dotSpacing) {
        dots.push(
          <Circle
            key={`dot-${x}-${y}`}
            x={x}
            y={y}
            radius={dotRadius}
            fill={dotColor}
            listening={false}
            perfectDrawEnabled={false}
          />
        );
      }
    }

    return dots;
  }, [stageScale, stageX, stageY, stageWidth, actualStageHeight]);

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

  // Layer caching optimization: Cache grid layer when it changes
  // The grid is relatively static (only changes on pan/zoom), so caching improves performance
  // NOTE: We only cache the grid layer (not shapes) because caching interactive layers
  // can interfere with event handling (clicks, drags, etc.)
  useEffect(() => {
    const gridLayer = gridLayerRef.current;
    if (!gridLayer) return;

    // Clear any existing cache and redraw
    gridLayer.clearCache();
    gridLayer.cache();
    gridLayer.batchDraw();
  }, [gridDots]); // Recache when grid dots change (pan/zoom/resize)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !canvas) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
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
      className="relative w-full h-screen overflow-hidden bg-gray-100"
      onMouseMove={handleMouseMove}
      style={{ cursor: 'none' }}
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
      <div className="pt-[60px] w-full h-full bg-gray-50">
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
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
        >
          {/* Background Grid Layer - scales with zoom */}
          <Layer ref={gridLayerRef} listening={false}>
            {gridDots}
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
            
            {/* Render preview shape while creating */}
            {newShapePreview && (
              <Shape
                key="preview"
                shape={newShapePreview}
                isSelected={false}
                onSelect={() => {}}
                onDragEnd={() => {}}
              />
            )}
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

