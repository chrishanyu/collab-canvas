import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Stage, Layer, Rect } from 'react-konva';
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
import { TransformHandles } from './TransformHandles';
import { GridDots } from './GridDots';
import { UserPresence } from '../presence/UserPresence';
import { constrainZoom, getRelativePointerPosition, generateUniqueId } from '../../utils/canvasHelpers';
import type { Canvas as CanvasType, CanvasObject, ShapeType } from '../../types';
import { ConflictError } from '../../types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  DEFAULT_SHAPE_FILL,
  DEFAULT_SHAPE_STROKE,
  DEFAULT_SHAPE_STROKE_WIDTH,
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
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]); // Multi-selection support
  
  // Interaction mode state ('pan' is default)
  const [interactionMode, setInteractionMode] = useState<'select' | 'pan'>('pan');
  
  // Shape creation state
  const [creatingShapeType, setCreatingShapeType] = useState<string | null>(null);
  
  // Shapes panel state
  const [isShapesPanelOpen, setIsShapesPanelOpen] = useState(false);
  
  // Preview shape state (for ghost shape following cursor)
  const [previewPosition, setPreviewPosition] = useState<{ x: number; y: number } | null>(null);
  
  // Selection rectangle state (for drag-to-select in Select mode)
  const [selectionRect, setSelectionRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  
  // Share modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  // Track which shape is currently being dragged
  const draggingShapeIdRef = useRef<string | null>(null);
  
  // Track initial positions of all selected shapes for group drag
  const groupDragStartPositions = useRef<Map<string, { x: number; y: number }>>(new Map());
  
  // Track if stage was panned (to distinguish click from drag in Pan mode)
  const stagePannedRef = useRef<boolean>(false);
  
  // Track if mousedown was on empty space (to prevent clearing selection when dragging shapes)
  const mouseDownOnEmptyRef = useRef<boolean>(false);

  // Presence state
  const updateCursorRef = useRef<((x: number, y: number) => void) | null>(null);

  // Active edits tracking (for showing OTHER users' edits)
  const {
    getShapeEditor,
  } = useActiveEdits(canvasId || '', currentUser?.id || '');

  // Selection helper functions
  const isSelected = useCallback((shapeId: string): boolean => {
    return selectedShapeIds.includes(shapeId);
  }, [selectedShapeIds]);

  const addToSelection = useCallback((shapeId: string) => {
    setSelectedShapeIds(prev => {
      if (prev.includes(shapeId)) return prev;
      return [...prev, shapeId];
    });
  }, []);

  const removeFromSelection = useCallback((shapeId: string) => {
    setSelectedShapeIds(prev => prev.filter(id => id !== shapeId));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedShapeIds([]);
  }, []);

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
        
        // Finally deselect shapes
        if (selectedShapeIds.length > 0) {
          clearSelection();
          return;
        }
      }
      
      // Delete/Backspace key: Delete selected shapes
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedShapeIds.length > 0) {
        // Prevent backspace from navigating back in browser
        e.preventDefault();
        
        // Delete all selected shapes
        if (canvasId) {
          // Delete each selected shape
          selectedShapeIds.forEach(shapeId => {
            deleteShapeInFirebase(canvasId, shapeId)
              .then(() => {
                // Optimistically remove from local state
                setShapes(prevShapes => prevShapes.filter(s => s.id !== shapeId));
              })
              .catch(error => {
                console.error('Failed to delete shape:', error);
                showError(`Failed to delete shape. Please try again.`);
              });
          });
          
          // Clear selection after deleting
          clearSelection();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [creatingShapeType, isShapesPanelOpen, selectedShapeIds, canvasId, showError, clearSelection]);

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
    
    // Mark that stage was panned
    stagePannedRef.current = true;
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

  // Mode toggle handlers
  const handleSetMode = (mode: 'select' | 'pan') => {
    setInteractionMode(mode);
  };

  // Text creation handler
  const handleCreateText = () => {
    // Text feature coming soon - placeholder for future implementation
    showWarning('Text feature coming soon!');
  };

  const handleSelectShape = (shapeType: string) => {
    setCreatingShapeType(shapeType);
    clearSelection(); // Deselect any selected shapes
  };

  const handleCloseShapesPanel = () => {
    setIsShapesPanelOpen(false);
  };

  // Handle mouse move on stage for preview shape
  const handleStageMouseMove = () => {
    const stage = stageRef.current;
    if (!stage) return;
    
    const pos = getRelativePointerPosition(stage);
    if (!pos) return;
    
    // Update selection rectangle if dragging
    if (selectionRect) {
      const width = pos.x - selectionRect.x;
      const height = pos.y - selectionRect.y;
      setSelectionRect({
        ...selectionRect,
        width,
        height,
      });
      return;
    }
    
    // Update preview shape position if creating
    if (creatingShapeType) {
      setPreviewPosition(pos);
    } else {
      setPreviewPosition(null);
    }
  };

  const handleStageMouseUp = () => {
    // In Pan mode: Check if this was a click (not a pan) on empty space
    if (interactionMode === 'pan' && !stagePannedRef.current && !creatingShapeType && mouseDownOnEmptyRef.current) {
      // Click on empty space in Pan mode - clear selection
      clearSelection();
      mouseDownOnEmptyRef.current = false;
      return;
    }
    
    // Reset flag
    mouseDownOnEmptyRef.current = false;
    
    // Finalize selection rectangle (Select mode)
    if (selectionRect) {
      // Find shapes that intersect with the selection rectangle
      const rect = selectionRect;
      
      // Check if this was just a click (no drag) - width and height are both very small
      const wasClick = Math.abs(rect.width) < 3 && Math.abs(rect.height) < 3;
      
      if (wasClick) {
        // Simple click on empty space - clear selection
        clearSelection();
      } else {
        // Actual drag - find intersecting shapes
        // Normalize rectangle (handle negative width/height from dragging left/up)
        const x = rect.width < 0 ? rect.x + rect.width : rect.x;
        const y = rect.height < 0 ? rect.y + rect.height : rect.y;
        const width = Math.abs(rect.width);
        const height = Math.abs(rect.height);
        
        // Find intersecting shapes using bounding box collision
        const intersectingShapes = shapes.filter(shape => {
          const shapeRight = shape.x + shape.width;
          const shapeBottom = shape.y + shape.height;
          const rectRight = x + width;
          const rectBottom = y + height;
          
          // Check if rectangles intersect
          return !(
            shapeRight < x ||
            shape.x > rectRight ||
            shapeBottom < y ||
            shape.y > rectBottom
          );
        });
        
        // Update selection with intersecting shapes (or clear if none found)
        setSelectedShapeIds(intersectingShapes.map(s => s.id));
      }
      
      // Clear selection rectangle
      setSelectionRect(null);
    }
  };

  const handleStageMouseDown = async (e: Konva.KonvaEventObject<MouseEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    
    if (!creatingShapeType) {
      if (clickedOnEmpty) {
        // Track that mousedown was on empty space
        mouseDownOnEmptyRef.current = true;
        
        // Reset pan tracking
        stagePannedRef.current = false;
        
        // In Select mode: Start selection rectangle
        if (interactionMode === 'select') {
          const stage = stageRef.current;
          if (stage) {
            const pos = getRelativePointerPosition(stage);
            if (pos) {
              setSelectionRect({
                x: pos.x,
                y: pos.y,
                width: 0,
                height: 0,
              });
            }
          }
        }
        // In Pan mode: Wait for mouseup to determine if it was a click or pan
      } else {
        // Clicked on a shape, not empty space
        mouseDownOnEmptyRef.current = false;
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
      fill: DEFAULT_SHAPE_FILL, // White fill
      stroke: DEFAULT_SHAPE_STROKE, // Gray-800 border
      strokeWidth: DEFAULT_SHAPE_STROKE_WIDTH, // 2px border
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
    
    setShapes(prevShapes => [...prevShapes, optimisticShape]);
    
    // Write to Firebase in background
    try {
      await createShapeInFirebase(canvasId, shapeData);
      // Firestore listener will update with the actual shape from server
    } catch (error) {
      console.error('Failed to create shape in Firebase:', error);
      showError('Failed to create shape. Please try again.');
      // Revert optimistic update on error
      setShapes(prevShapes => prevShapes.filter(s => s.id !== optimisticShape.id));
    }
  };

  // Shape interaction handlers
  const handleSelectShapeId = (id: string, event?: Konva.KonvaEventObject<MouseEvent>) => {
    const shiftKey = event?.evt?.shiftKey || false;
    
    if (shiftKey) {
      // Shift+click: Add or remove from selection
      if (isSelected(id)) {
        removeFromSelection(id);
      } else {
        addToSelection(id);
      }
    } else {
      // Normal click: Replace selection
      setSelectedShapeIds([id]);
    }
  };

  const handleShapeDragStart = (id: string) => {
    // Check if this is a group drag BEFORE potentially changing selection
    const wasAlreadySelected = isSelected(id);
    const isGroupDragStart = wasAlreadySelected && selectedShapeIds.length > 1;
    
    // Ensure the shape is selected when drag starts (if not already)
    if (!wasAlreadySelected) {
      setSelectedShapeIds([id]);
    }
    
    // Mark shape as being dragged to prevent Firebase updates during drag
    draggingShapeIdRef.current = id;
    
    // Store initial positions for all shapes that will move (group or single)
    const positions = new Map<string, { x: number; y: number }>();
    
    if (isGroupDragStart) {
      // Group drag: store all selected shapes
      selectedShapeIds.forEach(shapeId => {
        const shape = shapes.find(s => s.id === shapeId);
        if (shape) {
          positions.set(shapeId, { x: shape.x, y: shape.y });
        }
      });
    } else {
      // Single drag: store just this shape
      const shape = shapes.find(s => s.id === id);
      if (shape) {
        positions.set(id, { x: shape.x, y: shape.y });
      }
    }
    
    groupDragStartPositions.current = positions;
    
    // Note: We don't set edit indicators for the current user's own drags
    // The selection state (blue border) provides sufficient visual feedback
    // Edit indicators are only for showing OTHER users' edits in real-time collaboration
  };

  const handleShapeDragMove = (id: string, x: number, y: number) => {
    const startPos = groupDragStartPositions.current.get(id);
    if (!startPos) return;
    
    // Calculate delta from original position
    const deltaX = x - startPos.x;
    const deltaY = y - startPos.y;
    
    // Update positions in real-time (so TransformHandles and other shapes follow)
    setShapes(prevShapes =>
      prevShapes.map(shape => {
        if (groupDragStartPositions.current.has(shape.id)) {
          const shapeStartPos = groupDragStartPositions.current.get(shape.id);
          if (shapeStartPos) {
            return {
              ...shape,
              x: shapeStartPos.x + deltaX,
              y: shapeStartPos.y + deltaY,
            };
          }
        }
        return shape;
      })
    );
  };

  const handleShapeDragEnd = async (id: string, x: number, y: number) => {
    if (!canvasId || !currentUser) return;

    // Store original shape for rollback
    const originalShape = shapes.find(shape => shape.id === id);
    
    if (!originalShape) {
      draggingShapeIdRef.current = null;
      groupDragStartPositions.current.clear();
      return;
    }

    // Round coordinates to avoid floating point precision issues
    const roundedX = Math.round(x);
    const roundedY = Math.round(y);

    // Calculate delta movement
    const deltaX = roundedX - Math.round(originalShape.x);
    const deltaY = roundedY - Math.round(originalShape.y);

    // Skip update if position hasn't actually changed
    if (deltaX === 0 && deltaY === 0) {
      draggingShapeIdRef.current = null;
      groupDragStartPositions.current.clear();
      return;
    }

    // Check if this is a group drag
    const isGroupDrag = groupDragStartPositions.current.size > 1;
    const shapesToUpdate = isGroupDrag ? Array.from(groupDragStartPositions.current.keys()) : [id];
    
    // Store start positions before clearing (needed for Firebase updates and rollback)
    const startPositions = new Map(groupDragStartPositions.current);

    // Optimistic update: Update dragged shape(s)
    setShapes(prevShapes =>
      prevShapes.map((shape) => {
        if (shapesToUpdate.includes(shape.id)) {
          const startPos = startPositions.get(shape.id);
          const newX = startPos ? Math.round(startPos.x + deltaX) : (shape.id === id ? roundedX : shape.x);
          const newY = startPos ? Math.round(startPos.y + deltaY) : (shape.id === id ? roundedY : shape.y);
          
          return { 
            ...shape, 
            x: newX, 
            y: newY, 
            updatedAt: new Date(),
            version: shape.version + 1, // Increment version optimistically
            lastEditedBy: currentUser.id, // Track who edited
          };
        }
        return shape; // Keep same reference for unchanged shapes
      })
    );

    // Clear dragging state to allow Firebase updates again
    draggingShapeIdRef.current = null;
    groupDragStartPositions.current.clear();

    // Write to Firebase with version checking for conflict detection
    try {
      if (isGroupDrag) {
        // Batch update all selected shapes
        const updates = shapesToUpdate.map(shapeId => {
          const shape = shapes.find(s => s.id === shapeId);
          const startPos = startPositions.get(shapeId);
          
          if (!shape || !startPos) return null;
          
          const newX = Math.round(startPos.x + deltaX);
          const newY = Math.round(startPos.y + deltaY);
          
          return {
            shapeId,
            updates: { x: newX, y: newY },
            version: shape.version,
          };
        }).filter(Boolean) as Array<{ shapeId: string; updates: { x: number; y: number }; version: number }>;
        
        // Update all shapes in parallel
        await Promise.all(
          updates.map(({ shapeId, updates: shapeUpdates, version }) =>
            updateShapeInFirebase(
              canvasId,
              shapeId,
              shapeUpdates,
              currentUser.id,
              version
            )
          )
        );
      } else {
        // Single shape update
        await updateShapeInFirebase(
          canvasId, 
          id, 
          { x: roundedX, y: roundedY }, 
          currentUser.id,
          originalShape.version
        );
      }
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
        
        // Revert optimistic update - restore to start positions before drag
        setShapes(prevShapes =>
          prevShapes.map((shape) => {
            if (shapesToUpdate.includes(shape.id)) {
              const startPos = startPositions.get(shape.id);
              if (startPos) {
                return {
                  ...shape,
                  x: startPos.x,
                  y: startPos.y,
                };
              }
            }
            return shape;
          })
        );
        
        // Note: The Firestore listener will automatically update with the server's version
        return;
      }
      
      // Handle other errors (network, permissions, etc.)
      console.error('Failed to update shape in Firebase:', error);
      showError('Failed to save changes. Please try again.');
      
      // Rollback: Restore original positions before drag
      setShapes(prevShapes =>
        prevShapes.map((shape) => {
          if (shapesToUpdate.includes(shape.id)) {
            const startPos = startPositions.get(shape.id);
            if (startPos) {
              return {
                ...shape,
                x: startPos.x,
                y: startPos.y,
              };
            }
          }
          return shape;
        })
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

  // Transform handlers (resize and rotate)
  const handleResize = useCallback((id: string, x: number, y: number, width: number, height: number) => {
    // Optimistically update shape dimensions in local state
    setShapes(prevShapes =>
      prevShapes.map(shape =>
        shape.id === id
          ? {
              ...shape,
              x: Math.round(x),
              y: Math.round(y),
              width: Math.round(width),
              height: Math.round(height),
            }
          : shape
      )
    );
  }, []);

  const handleResizeEnd = useCallback(async (id: string) => {
    if (!canvasId || !currentUser) return;

    const shape = shapes.find(s => s.id === id);
    if (!shape) return;

    // Save to Firebase
    try {
      await updateShapeInFirebase(
        canvasId,
        id,
        {
          x: shape.x,
          y: shape.y,
          width: shape.width,
          height: shape.height,
        },
        currentUser.id,
        shape.version
      );
    } catch (error) {
      console.error('Failed to save resize:', error);
      showError('Failed to save changes. Please try again.');
    }
  }, [canvasId, currentUser, shapes, showError]);

  // Cursor styling based on interaction mode
  const cursorClass = useMemo(() => {
    // Creating shape: crosshair cursor
    if (creatingShapeType) {
      return 'cursor-crosshair';
    }
    
    // Pan mode: grab cursor (will change to grabbing during drag in Stage handlers)
    if (interactionMode === 'pan') {
      return 'cursor-grab';
    }
    
    // Select mode: default cursor
    return 'cursor-default';
  }, [interactionMode, creatingShapeType]);

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
      // Always render selected shapes (critical for dragging!)
      if (isSelected(shape.id)) {
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
  }, [shapes, stageScale, stageX, stageY, stageWidth, stageHeight, isSelected]);

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
      className={`relative w-full h-screen overflow-hidden bg-gray-100 ${cursorClass}`}
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
        interactionMode={interactionMode}
        onSetMode={handleSetMode}
        onToggleShapes={handleToggleShapesPanel}
        onCreateText={handleCreateText}
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
          draggable={!creatingShapeType && !selectionRect} // Disable pan while creating shapes or selecting
          onDragEnd={handleDragEnd}
          onWheel={handleWheel}
          onMouseMove={handleStageMouseMove}
          onMouseDown={handleStageMouseDown}
          onMouseUp={handleStageMouseUp}
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
                  isSelected={isSelected(shape.id)}
                  onSelect={handleSelectShapeId}
                  onDragStart={handleShapeDragStart}
                  onDragMove={handleShapeDragMove}
                  onDragEnd={handleShapeDragEnd}
                  isBeingEdited={isBeingEdited}
                  editorName={editorName}
                  editorColor={editorColor}
                />
              );
            })}
            
            {/* Transform handles (resize only) - only for single selection */}
            {selectedShapeIds.length === 1 && (() => {
              const selectedShape = shapes.find(s => s.id === selectedShapeIds[0]);
              return selectedShape ? (
                <TransformHandles
                  shape={selectedShape}
                  onResize={handleResize}
                  onResizeEnd={handleResizeEnd}
                  stageScale={stageScale}
                />
              ) : null;
            })()}
            
            {/* Preview/Ghost shape during creation */}
            {creatingShapeType && previewPosition && (
              <PreviewShape
                shapeType={creatingShapeType as ShapeType}
                x={previewPosition.x}
                y={previewPosition.y}
              />
            )}
            
            {/* Selection rectangle (drag-to-select) */}
            {selectionRect && (
              <Rect
                x={selectionRect.width < 0 ? selectionRect.x + selectionRect.width : selectionRect.x}
                y={selectionRect.height < 0 ? selectionRect.y + selectionRect.height : selectionRect.y}
                width={Math.abs(selectionRect.width)}
                height={Math.abs(selectionRect.height)}
                fill="rgba(59, 130, 246, 0.2)" // Blue with 20% opacity
                stroke="#3B82F6" // Blue-500
                strokeWidth={1}
                dash={[5, 5]}
                listening={false}
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

