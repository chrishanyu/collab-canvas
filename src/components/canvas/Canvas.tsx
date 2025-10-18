import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { useAuth } from '../../hooks/useAuth';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';
import { useToast } from '../../hooks/useToast';
import { usePersistedViewport } from '../../hooks/usePersistedViewport';
import { useActiveEdits } from '../../hooks/useActiveEdits';
import { getCanvasById } from '../../services/canvas.service';
import { createShape as createShapeInFirebase, updateShape as updateShapeInFirebase, deleteShape as deleteShapeInFirebase } from '../../services/canvasObjects.service';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorAlert } from '../common/ErrorAlert';
import { ConnectionIndicator } from '../common/ConnectionIndicator';
import { CanvasHeader } from './CanvasHeader';
import { CanvasToolbar } from './CanvasToolbar';
import { ShapesPanel } from './ShapesPanel';
import { ZoomControls } from './ZoomControls';
import { ShareLinkModal } from '../dashboard/ShareLinkModal';
import { Shape } from './Shape';
import { PreviewShape } from './PreviewShape';
import { GridDots } from './GridDots';
import { UserPresence } from '../presence/UserPresence';
import { constrainZoom, getRelativePointerPosition, generateUniqueId, getUserCursorColor } from '../../utils/canvasHelpers';
import type { Canvas as CanvasType, CanvasObject, ShapeType } from '../../types';
import { ConflictError } from '../../types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from '../../utils/constants';

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
  const { showError, showWarning } = useToast();
  const stageRef = useRef<Konva.Stage>(null);

  const [canvas, setCanvas] = useState<CanvasType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stage dimensions (viewport size)
  const [stageWidth, setStageWidth] = useState(window.innerWidth);
  const [stageHeight, setStageHeight] = useState(window.innerHeight);

  // Stage position and scale (persisted in localStorage)
  const {
    stageScale,
    setStageScale,
    stageX,
    setStageX,
    stageY,
    setStageY,
  } = usePersistedViewport(canvasId || 'default');

  // Shape state
  const [shapes, setShapes] = useState<CanvasObject[]>([]);
  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
  
  // Shape creation state
  const [creatingShapeType, setCreatingShapeType] = useState<string | null>(null);
  
  // Shapes panel state
  const [isShapesPanelOpen, setIsShapesPanelOpen] = useState(false);
  
  // Preview shape state (for ghost shape following cursor)
  const [previewPosition, setPreviewPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Share modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  // Track which shape is currently being dragged
  const draggingShapeIdRef = useRef<string | null>(null);

  // Presence state
  const updateCursorRef = useRef<((x: number, y: number) => void) | null>(null);

  // Active edits tracking
  const {
    setShapeEditing,
    clearShapeEditing,
    getShapeEditor,
  } = useActiveEdits(canvasId || '', currentUser?.id || '');

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

  // Update browser tab title with canvas name
  useEffect(() => {
    if (canvas?.name) {
      document.title = `${canvas.name} - CollabCanvas`;
    }
    
    // Cleanup: reset to default title on unmount
    return () => {
      document.title = 'CollabCanvas';
    };
  }, [canvas?.name]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC key: Cancel shape creation, close panel, or deselect shape
      if (e.key === 'Escape') {
        e.preventDefault();
        
        // Priority: Cancel shape creation first
        if (creatingShapeType) {
          setCreatingShapeType(null);
          setPreviewPosition(null);
          return;
        }
        
        // Then close shapes panel
        if (isShapesPanelOpen) {
          setIsShapesPanelOpen(false);
          return;
        }
        
        // Finally deselect shape
        if (selectedShapeId) {
          setSelectedShapeId(null);
          return;
        }
      }
      
      // Delete/Backspace key: Delete selected shape
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedShapeId) {
        // Prevent backspace from navigating back in browser
        e.preventDefault();
        
        // Delete the selected shape
        if (canvasId) {
          deleteShapeInFirebase(canvasId, selectedShapeId)
            .then(() => {
              // Optimistically remove from local state
              setShapes(prevShapes => prevShapes.filter(s => s.id !== selectedShapeId));
              setSelectedShapeId(null);
            })
            .catch((error) => {
              console.error('Failed to delete shape:', error);
              showError('Failed to delete shape. Please try again.');
            });
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [creatingShapeType, isShapesPanelOpen, selectedShapeId, canvasId, showError]);

  // Real-time sync: Subscribe to Firestore changes for this canvas
  // Smart merge to prevent unnecessary re-renders and flickering
  const handleShapesUpdate = useCallback((syncedShapes: CanvasObject[]) => {
    setShapes(prevShapes => {
      // Create a map for efficient lookup
      const syncedMap = new Map(syncedShapes.map(s => [s.id, s]));
      
      // Track if we need to update state
      let hasChanges = false;
      
      // Merge synced shapes with existing shapes
      const merged = prevShapes.map(prevShape => {
        const syncedShape = syncedMap.get(prevShape.id);
        
        if (!syncedShape) {
          // Shape was deleted remotely
          hasChanges = true;
          return null; // Will be filtered out
        }
        
        // Skip update for shape currently being dragged
        // This prevents flicker during drag by letting Konva manage the position
        if (draggingShapeIdRef.current === prevShape.id) {
          syncedMap.delete(prevShape.id);
          return prevShape;
        }
        
        // Deep comparison - only update if actually different
        if (
          prevShape.x !== syncedShape.x ||
          prevShape.y !== syncedShape.y ||
          prevShape.width !== syncedShape.width ||
          prevShape.height !== syncedShape.height ||
          prevShape.fill !== syncedShape.fill ||
          prevShape.version !== syncedShape.version
        ) {
          hasChanges = true;
          syncedMap.delete(prevShape.id);
          return syncedShape; // Use new reference only if changed
        }
        
        // Shape unchanged - keep same reference to prevent re-render
        syncedMap.delete(prevShape.id);
        return prevShape;
      }).filter((shape): shape is CanvasObject => shape !== null);
      
      // Add new shapes that don't exist in prevShapes
      if (syncedMap.size > 0) {
        hasChanges = true;
        syncedMap.forEach(newShape => {
          merged.push(newShape);
        });
      }
      
      // Only update state if something actually changed
      return hasChanges ? merged : prevShapes;
    });
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

    // Determine zoom direction (smooth, continuous zoom)
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = constrainZoom(oldScale + direction * 0.05);

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

  // Zoom in by 25%
  const handleZoomIn = () => {
    const newScale = constrainZoom(stageScale + 0.25);
    setStageScale(newScale);
  };

  // Zoom out by 25%
  const handleZoomOut = () => {
    const newScale = constrainZoom(stageScale - 0.25);
    setStageScale(newScale);
  };

  // Shapes panel handlers
  const handleToggleShapesPanel = () => {
    setIsShapesPanelOpen(!isShapesPanelOpen);
  };

  const handleSelectShape = (shapeType: string) => {
    setCreatingShapeType(shapeType);
    setSelectedShapeId(null); // Deselect any selected shape
  };

  const handleCloseShapesPanel = () => {
    setIsShapesPanelOpen(false);
  };

  // Handle mouse move on stage for preview shape
  const handleStageMouseMove = () => {
    if (!creatingShapeType) {
      setPreviewPosition(null);
      return;
    }
    
    const stage = stageRef.current;
    if (!stage) return;
    
    const pos = getRelativePointerPosition(stage);
    if (pos) {
      setPreviewPosition(pos);
    }
  };

  const handleStageMouseDown = async (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Click on empty space deselects shapes (if not in creation mode)
    const clickedOnEmpty = e.target === e.target.getStage();
    
    if (!creatingShapeType) {
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
    setCreatingShapeType(null);
    setPreviewPosition(null);

    // Default shape size
    const DEFAULT_SHAPE_WIDTH = 100;
    const DEFAULT_SHAPE_HEIGHT = 100;

    // Create shape centered at click position based on type
    const shapeData = {
      type: creatingShapeType as ShapeType,
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
      version: 1, // Initial version
      lastEditedBy: currentUser.id, // Set to creator
    };
    setShapes([...shapes, optimisticShape]);

    // Write to Firebase in background
    try {
      await createShapeInFirebase(canvasId, shapeData);
      // Firestore listener will update with the actual shape from server
    } catch (error) {
      console.error('Failed to create shape in Firebase:', error);
      // Show error notification to user
      showError('Failed to create shape. Please try again.');
      // Revert optimistic update on error
      setShapes(shapes); // Remove the optimistic shape
    }
  };

  // Shape interaction handlers
  const handleSelectShapeId = (id: string) => {
    setSelectedShapeId(id);
  };

  const handleShapeDragStart = (id: string) => {
    // Mark shape as being dragged to prevent Firebase updates during drag
    draggingShapeIdRef.current = id;
    
    // Set active edit indicator so other users see this shape is being edited
    if (currentUser) {
      const userColor = getUserCursorColor(currentUser.id, currentUser.id);
      setShapeEditing(id, currentUser.displayName || 'Unknown', userColor);
    }
  };

  const handleShapeDragEnd = async (id: string, x: number, y: number) => {
    if (!canvasId || !currentUser) return;

    // Store original shape for rollback
    const originalShape = shapes.find(shape => shape.id === id);
    
    if (!originalShape) {
      draggingShapeIdRef.current = null;
      return;
    }

    // Round coordinates to avoid floating point precision issues
    const roundedX = Math.round(x);
    const roundedY = Math.round(y);

    // Skip update if position hasn't actually changed
    if (Math.round(originalShape.x) === roundedX && Math.round(originalShape.y) === roundedY) {
      draggingShapeIdRef.current = null;
      return;
    }

    // Optimistic update: Only update the dragged shape, preserve all other references
    setShapes(prevShapes =>
      prevShapes.map((shape) =>
        shape.id === id
          ? { 
              ...shape, 
              x: roundedX, 
              y: roundedY, 
              updatedAt: new Date(),
              version: shape.version + 1, // Increment version optimistically
              lastEditedBy: currentUser.id, // Track who edited
            }
          : shape // Keep same reference for unchanged shapes
      )
    );

    // Clear dragging state to allow Firebase updates again
    draggingShapeIdRef.current = null;
    
    // Clear active edit indicator
    clearShapeEditing(id);

    // Write to Firebase with version checking for conflict detection
    try {
      await updateShapeInFirebase(
        canvasId, 
        id, 
        { x: roundedX, y: roundedY }, 
        currentUser.id,
        originalShape.version // Pass local version for conflict detection
      );
      // Firestore listener will confirm the update
    } catch (error) {
      // Handle conflict errors specifically
      if (error instanceof ConflictError) {
        console.warn('Conflict detected:', error);
        
        // Show user-friendly notification with conflicting user's name
        const editorName = error.lastEditedByName || 'Another user';
        showWarning(
          `Shape was modified by ${editorName}. Reloading latest version...`
        );
        
        // Revert optimistic update - real-time sync will provide latest server version
        setShapes(prevShapes =>
          prevShapes.map((shape) =>
            shape.id === id ? originalShape : shape
          )
        );
        
        // Note: The Firestore listener will automatically update with the server's version
        return;
      }
      
      // Handle other errors (network, permissions, etc.)
      console.error('Failed to update shape in Firebase:', error);
      showError('Failed to save changes. Please try again.');
      
      // Rollback: Restore original position
      setShapes(prevShapes =>
        prevShapes.map((shape) =>
          shape.id === id ? originalShape : shape
        )
      );
    }
  };

  // Handle cursor movement for presence
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (updateCursorRef.current) {
      // Convert viewport coordinates to canvas coordinates
      // This ensures cursors appear in the same position regardless of zoom/pan
      const canvasX = (e.clientX - stageX) / stageScale;
      const canvasY = (e.clientY - stageY) / stageScale;
      updateCursorRef.current(canvasX, canvasY);
    }
  };

  // Callback to receive updateCursor function from UserPresence
  const handleCursorMove = useCallback((updateCursor: (x: number, y: number) => void) => {
    updateCursorRef.current = updateCursor;
  }, []);

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
    const viewportBottom = viewportTop + stageHeight / stageScale;

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
  }, [shapes, stageScale, stageX, stageY, stageWidth, stageHeight, selectedShapeId]);

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
      className="relative w-full h-screen overflow-hidden bg-gray-100"
      onMouseMove={handleMouseMove}
    >
      {/* Connection Status Indicator */}
      <ConnectionIndicator />

      {/* Floating Canvas Header */}
        <CanvasHeader 
          canvasName={canvas.name} 
          onShare={() => setIsShareModalOpen(true)}
        />

      {/* Canvas Toolbar */}
      <CanvasToolbar
        onToggleShapes={handleToggleShapesPanel}
      />

      {/* Shapes Panel */}
      <ShapesPanel
        isOpen={isShapesPanelOpen}
        selectedShape={creatingShapeType}
        onSelectShape={handleSelectShape}
        onClose={handleCloseShapesPanel}
      />

      {/* Zoom Controls */}
      <ZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
      />

      {/* Konva Stage */}
      <div 
        className="w-full h-full"
        style={{ cursor: creatingShapeType ? 'crosshair' : 'default' }}
      >
        <Stage
          ref={stageRef}
          width={stageWidth}
          height={stageHeight}
          scaleX={stageScale}
          scaleY={stageScale}
          x={stageX}
          y={stageY}
          draggable={!creatingShapeType} // Disable pan while creating shapes
          onDragEnd={handleDragEnd}
          onWheel={handleWheel}
          onMouseMove={handleStageMouseMove}
          onMouseDown={handleStageMouseDown}
        >
          {/* Background Grid Layer - scales with zoom */}
          <Layer listening={false}>
            <GridDots
              width={stageWidth}
              height={stageHeight}
              stageScale={stageScale}
              stageX={stageX}
              stageY={stageY}
              canvasWidth={CANVAS_WIDTH}
              canvasHeight={CANVAS_HEIGHT}
            />
          </Layer>
          
          {/* Main Content Layer */}
          <Layer listening={true} imageSmoothingEnabled={false}>
            {/* Render visible shapes only (viewport virtualization) */}
            {visibleShapes.map((shape) => {
              // Get edit indicator info for this shape
              const editor = getShapeEditor(shape.id);
              const isBeingEdited = !!editor;
              const editorName = editor?.userName;
              const editorColor = editor?.color;
              
              return (
                <Shape
                  key={shape.id}
                  shape={shape}
                  isSelected={shape.id === selectedShapeId}
                  onSelect={handleSelectShapeId}
                  onDragStart={handleShapeDragStart}
                  onDragEnd={handleShapeDragEnd}
                  isBeingEdited={isBeingEdited}
                  editorName={editorName}
                  editorColor={editorColor}
                />
              );
            })}
            
            {/* Preview/Ghost shape during creation */}
            {creatingShapeType && previewPosition && (
              <PreviewShape
                shapeType={creatingShapeType as ShapeType}
                x={previewPosition.x}
                y={previewPosition.y}
              />
            )}
          </Layer>
        </Stage>
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
        headerHeight={0}
      />

      {/* Share Modal */}
      <ShareLinkModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareLink={`${window.location.origin}/canvas/${canvasId}`}
        canvasName={canvas.name}
      />
    </div>
  );
};

