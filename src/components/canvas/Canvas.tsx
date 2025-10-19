import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Stage, Layer, Rect } from 'react-konva';
import Konva from 'konva';
import { useAuth } from '../../hooks/useAuth';
import { useRealtimeSync } from '../../hooks/useRealtimeSync';
import { useToast } from '../../hooks/useToast';
import { usePersistedViewport } from '../../hooks/usePersistedViewport';
import { useActiveEdits } from '../../hooks/useActiveEdits';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useRecentColors } from '../../hooks/useRecentColors';
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
import { ShapeEditBar } from './ShapeEditBar';
import { AICommandInput } from '../ai/AICommandInput';
import { constrainZoom, getRelativePointerPosition, generateUniqueId, getMaxZIndex, getMinZIndex } from '../../utils/canvasHelpers';
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
  const { showError, showWarning, showSuccess } = useToast();
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
  
  // AI panel state
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  
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
  
  // Clipboard state for copy/paste
  const [clipboardShapes, setClipboardShapes] = useState<CanvasObject[]>([]);
  
  // Track which shape is currently being dragged
  const draggingShapeIdRef = useRef<string | null>(null);
  
  // Track initial positions of all selected shapes for group drag
  const groupDragStartPositions = useRef<Map<string, { x: number; y: number }>>(new Map());
  
  // Track pending Firebase writes to prevent race conditions
  // Map<shapeId, expectedVersion> - shapes with pending writes won't be updated by Firebase listener
  const pendingUpdates = useRef<Map<string, number>>(new Map());
  
  // Debounce timer for arrow key Firebase updates
  const arrowKeyDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
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

  // Recent colors management (stored per-user in Firebase)
  const { recentColors, addRecentColor } = useRecentColors(currentUser?.id);

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

  // Clear clipboard when switching canvases
  useEffect(() => {
    setClipboardShapes([]);
  }, [canvasId]);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (arrowKeyDebounceTimer.current) {
        clearTimeout(arrowKeyDebounceTimer.current);
      }
    };
  }, []);

  // Keyboard shortcut handlers
  const handleEscape = useCallback(() => {
        // Priority: Cancel shape creation first
        if (creatingShapeType) {
          setCreatingShapeType(null);
          setPreviewPosition(null);
          return;
        }
        
        // Then close AI panel
        if (isAIPanelOpen) {
          setIsAIPanelOpen(false);
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
    }
  }, [creatingShapeType, isAIPanelOpen, isShapesPanelOpen, selectedShapeIds, clearSelection]);

  const handleDeleteShapes = useCallback(() => {
    if (selectedShapeIds.length === 0 || !canvasId) return;
    
    // Optimistically remove from local state first
    setShapes(prevShapes => prevShapes.filter(s => !selectedShapeIds.includes(s.id)));
    
    // Delete each selected shape from Firebase
          selectedShapeIds.forEach(shapeId => {
            deleteShapeInFirebase(canvasId, shapeId)
              .catch(error => {
                console.error('Failed to delete shape:', error);
                showError(`Failed to delete shape. Please try again.`);
          // Note: Firebase sync will restore the shape if delete failed
              });
          });
          
          // Clear selection after deleting
          clearSelection();
  }, [selectedShapeIds, canvasId, clearSelection, showError]);

  const handleCopy = useCallback(() => {
    if (selectedShapeIds.length === 0) return;
    
    // Get the selected shapes
    const shapesToCopy = shapes.filter(s => selectedShapeIds.includes(s.id));
    
    // Store in clipboard state
    setClipboardShapes(shapesToCopy);
    
    // Show success toast
    const count = shapesToCopy.length;
    showSuccess(`Copied ${count} shape${count !== 1 ? 's' : ''}`);
  }, [selectedShapeIds, shapes, showSuccess]);

  const handlePaste = useCallback(async () => {
    if (clipboardShapes.length === 0 || !canvasId || !currentUser) return;
    
    // Calculate the bounding box center of all clipboard shapes
    const bounds = {
      minX: Math.min(...clipboardShapes.map(s => s.x)),
      maxX: Math.max(...clipboardShapes.map(s => s.x + s.width)),
      minY: Math.min(...clipboardShapes.map(s => s.y)),
      maxY: Math.max(...clipboardShapes.map(s => s.y + s.height)),
    };
    const clipboardCenterX = (bounds.minX + bounds.maxX) / 2;
    const clipboardCenterY = (bounds.minY + bounds.maxY) / 2;
    
    // Calculate the viewport center in canvas coordinates
    // Convert screen center to canvas coordinates using stage position and scale
    const viewportCenterX = (window.innerWidth / 2 - stageX) / stageScale;
    const viewportCenterY = (window.innerHeight / 2 - stageY) / stageScale;
    
    // Calculate offset to move clipboard center to viewport center
    const offsetX = viewportCenterX - clipboardCenterX;
    const offsetY = viewportCenterY - clipboardCenterY;
    
    const newShapeIds: string[] = [];
    
    // Paste each shape with offset to center in viewport (preserving relative positions)
    for (const shape of clipboardShapes) {
      // Generate unique ID client-side for optimistic update
      const newId = generateUniqueId();
      newShapeIds.push(newId);
      
      // Create shape data with offset to center in viewport
      const shapeData = {
        type: shape.type,
        x: shape.x + offsetX,
        y: shape.y + offsetY,
        width: shape.width,
        height: shape.height,
        fill: shape.fill,
        stroke: shape.stroke,
        strokeWidth: shape.strokeWidth,
        rotation: shape.rotation,
        text: shape.text,
        textFormat: shape.textFormat,
        createdBy: currentUser.id,
      };
      
      // Create optimistic shape for immediate local update
      const optimisticShape: CanvasObject = {
        ...shapeData,
        id: newId,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        lastEditedBy: currentUser.id,
      };
      
      // Add to local state immediately (optimistic update)
      setShapes(prevShapes => [...prevShapes, optimisticShape]);
      
      // Sync to Firebase with the same ID (in background)
      createShapeInFirebase(canvasId, shapeData, newId)
        .catch(error => {
          console.error('Failed to paste shape:', error);
          showError('Failed to paste shape. Please try again.');
          // Remove from local state on failure
          setShapes(prevShapes => prevShapes.filter(s => s.id !== newId));
        });
    }
    
    // Auto-select pasted shapes immediately
    setSelectedShapeIds(newShapeIds);
    
    // Show success toast
    const count = clipboardShapes.length;
    showSuccess(`Pasted ${count} shape${count !== 1 ? 's' : ''}`);
  }, [clipboardShapes, canvasId, currentUser, stageX, stageY, stageScale, showSuccess, showError]);

  const handleCut = useCallback(() => {
    if (selectedShapeIds.length === 0 || !canvasId) return;
    
    // Copy to clipboard first
    const shapesToCut = shapes.filter(s => selectedShapeIds.includes(s.id));
    setClipboardShapes(shapesToCut);
    
    // Optimistically remove from local state
    setShapes(prevShapes => prevShapes.filter(s => !selectedShapeIds.includes(s.id)));
    
    // Delete each shape from Firebase
    selectedShapeIds.forEach(shapeId => {
      deleteShapeInFirebase(canvasId, shapeId)
        .catch(error => {
          console.error('Failed to cut shape:', error);
          showError('Failed to cut shape. Please try again.');
        });
    });
    
    // Clear selection after cutting
    clearSelection();
    
    // Show success toast
    const count = shapesToCut.length;
    showSuccess(`Cut ${count} shape${count !== 1 ? 's' : ''}`);
  }, [selectedShapeIds, shapes, canvasId, clearSelection, showSuccess, showError]);

  const handleDuplicate = useCallback(async () => {
    if (selectedShapeIds.length === 0 || !canvasId || !currentUser) return;
    
    const shapesToDuplicate = shapes.filter(s => selectedShapeIds.includes(s.id));
    const newShapeIds: string[] = [];
    
    // Duplicate each shape with 10px offset
    for (const shape of shapesToDuplicate) {
      // Generate unique ID client-side
      const newId = generateUniqueId();
      newShapeIds.push(newId);
      
      // Create shape data with 10px offset (not 20px like paste)
      const shapeData = {
        type: shape.type,
        x: shape.x + 10,
        y: shape.y + 10,
        width: shape.width,
        height: shape.height,
        fill: shape.fill,
        stroke: shape.stroke,
        strokeWidth: shape.strokeWidth,
        rotation: shape.rotation,
        text: shape.text,
        textFormat: shape.textFormat,
        createdBy: currentUser.id,
      };
      
      // Create optimistic shape
      const optimisticShape: CanvasObject = {
        ...shapeData,
        id: newId,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        lastEditedBy: currentUser.id,
      };
      
      // Add to local state immediately
      setShapes(prevShapes => [...prevShapes, optimisticShape]);
      
      // Sync to Firebase
      createShapeInFirebase(canvasId, shapeData, newId)
        .catch(error => {
          console.error('Failed to duplicate shape:', error);
          showError('Failed to duplicate shape. Please try again.');
          setShapes(prevShapes => prevShapes.filter(s => s.id !== newId));
        });
    }
    
    // Auto-select duplicated shapes (deselect originals)
    setSelectedShapeIds(newShapeIds);
    
    // Show success toast
    const count = shapesToDuplicate.length;
    showSuccess(`Duplicated ${count} shape${count !== 1 ? 's' : ''}`);
  }, [selectedShapeIds, shapes, canvasId, currentUser, showSuccess, showError]);

  // Arrow key movement handler
  const handleArrowKeyMove = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (selectedShapeIds.length === 0 || !canvasId || !currentUser) return;
    
    // Calculate movement delta (10px per keypress)
    const step = 10;
    const deltaX = direction === 'left' ? -step : direction === 'right' ? step : 0;
    const deltaY = direction === 'up' ? -step : direction === 'down' ? step : 0;
    
    // Store the shape IDs we're moving (snapshot current selection)
    const shapesToMove = [...selectedShapeIds];
    
    // Optimistic update: Move shapes immediately
    setShapes(prevShapes => {
      return prevShapes.map(shape => {
        if (shapesToMove.includes(shape.id)) {
          const updatedShape = {
            ...shape,
            x: shape.x + deltaX,
            y: shape.y + deltaY,
            updatedAt: new Date(),
            version: shape.version + 1,
            lastEditedBy: currentUser.id,
          };
          
          // Register pending update with NEW version
          pendingUpdates.current.set(shape.id, updatedShape.version);
          
          return updatedShape;
        }
        return shape;
      });
    });
    
    // Debounced Firebase update (100ms)
    // This prevents too many Firebase writes during rapid key presses
    if (arrowKeyDebounceTimer.current) {
      clearTimeout(arrowKeyDebounceTimer.current);
    }
    
    arrowKeyDebounceTimer.current = setTimeout(() => {
      // Use setShapes to access current state
      setShapes(currentShapes => {
        // Get the shapes that were moved (using the snapshot IDs)
        const movedShapes = currentShapes.filter(s => shapesToMove.includes(s.id));
        
        // Update them in Firebase WITHOUT version checking
        // Arrow key movements are low-risk position-only updates by the current user
        // Skip version checking to avoid conflicts during rapid keypresses
        Promise.all(
          movedShapes.map(async shape => {
            try {
              await updateShapeInFirebase(
                canvasId,
                shape.id,
                { x: shape.x, y: shape.y },
                currentUser.id
                // No version parameter = skip conflict checking
              );
            } catch (error) {
              console.error(`Failed to update shape ${shape.id}:`, error);
              // Silently fail - shape is already moved locally
            }
          })
        ).catch(error => {
          console.error('Failed to update shape positions:', error);
          // Don't show error toast for arrow key movements
          
          // Clear pending updates on error
          shapesToMove.forEach(shapeId => {
            pendingUpdates.current.delete(shapeId);
          });
        });
        
        // Clear timer reference
        arrowKeyDebounceTimer.current = null;
        
        // Return unchanged - we're just reading current state
        return currentShapes;
      });
    }, 100);
  }, [selectedShapeIds, canvasId, currentUser]);

  // Z-index handler functions (layer management)
  const handleBringToFront = useCallback(() => {
    if (selectedShapeIds.length !== 1 || !canvasId || !currentUser) return;
    
    const shapeId = selectedShapeIds[0];
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape) return;
    
    const maxZ = getMaxZIndex(shapes);
    const newZIndex = maxZ + 1;
    
    // Optimistic update with version increment and pending update tracking
    setShapes(prevShapes =>
      prevShapes.map(s => {
        if (s.id === shapeId) {
          const updatedShape = {
            ...s,
            zIndex: newZIndex,
            updatedAt: new Date(),
            version: s.version + 1,
            lastEditedBy: currentUser.id,
          };
          
          // Register pending update so Firebase listener doesn't overwrite
          pendingUpdates.current.set(s.id, updatedShape.version);
          
          return updatedShape;
        }
        return s;
      })
    );
    
    // Sync to Firebase with version for conflict detection
    updateShapeInFirebase(canvasId, shapeId, { zIndex: newZIndex }, currentUser.id, shape.version)
      .catch(error => {
        console.error('Failed to update z-index:', error);
        showError('Failed to update layer. Please try again.');
        // Clear pending update on error
        pendingUpdates.current.delete(shapeId);
      });
  }, [selectedShapeIds, shapes, canvasId, currentUser, showError]);

  const handleSendToBack = useCallback(() => {
    if (selectedShapeIds.length !== 1 || !canvasId || !currentUser) return;
    
    const shapeId = selectedShapeIds[0];
    const shape = shapes.find(s => s.id === shapeId);
    if (!shape) return;
    
    const minZ = getMinZIndex(shapes);
    
    // Optimistic update with version increment and pending update tracking
    setShapes(prevShapes =>
      prevShapes.map(s => {
        if (s.id === shapeId) {
          const updatedShape = {
            ...s,
            zIndex: minZ - 1,
            updatedAt: new Date(),
            version: s.version + 1,
            lastEditedBy: currentUser.id,
          };
          
          // Register pending update so Firebase listener doesn't overwrite
          pendingUpdates.current.set(s.id, updatedShape.version);
          
          return updatedShape;
        }
        return s;
      })
    );
    
    // Sync to Firebase with version for conflict detection
    updateShapeInFirebase(canvasId, shapeId, { zIndex: minZ - 1 }, currentUser.id, shape.version)
      .catch(error => {
        console.error('Failed to update z-index:', error);
        showError('Failed to update layer. Please try again.');
        // Clear pending update on error
        pendingUpdates.current.delete(shapeId);
      });
  }, [selectedShapeIds, shapes, canvasId, currentUser, showError]);

  // AI panel handlers
  const handleToggleAI = useCallback(() => {
    setIsAIPanelOpen((prev) => !prev);
  }, []);

  // Keyboard shortcuts setup
  useKeyboardShortcuts([
    // ESC: Clear selection, close panels, cancel modes
    {
      key: 'Escape',
      handler: handleEscape,
      preventDefault: true,
    },
    // Delete/Backspace: Remove selected shapes
    {
      key: 'Delete',
      handler: handleDeleteShapes,
      preventDefault: true,
    },
    {
      key: 'Backspace',
      handler: handleDeleteShapes,
      preventDefault: true,
    },
    // Cmd+C: Copy selected shapes
    {
      key: 'c',
      meta: true,
      handler: handleCopy,
      preventDefault: false, // Allow browser copy for text inputs
    },
    // Cmd+V: Paste shapes
    {
      key: 'v',
      meta: true,
      handler: handlePaste,
      preventDefault: false, // Allow browser paste for text inputs
    },
    // Cmd+X: Cut selected shapes
    {
      key: 'x',
      meta: true,
      handler: handleCut,
      preventDefault: false, // Allow browser cut for text inputs
    },
    // Cmd+D: Duplicate selected shapes
    {
      key: 'd',
      meta: true,
      handler: handleDuplicate,
      preventDefault: true, // Prevent browser bookmark dialog
    },
    // Cmd/Ctrl+K: Toggle AI panel
    {
      key: 'k',
      meta: true,
      handler: handleToggleAI,
      preventDefault: true,
    },
    // Arrow keys: Move shapes 10px
    {
      key: 'ArrowUp',
      handler: () => handleArrowKeyMove('up'),
      preventDefault: true,
    },
    {
      key: 'ArrowDown',
      handler: () => handleArrowKeyMove('down'),
      preventDefault: true,
    },
    {
      key: 'ArrowLeft',
      handler: () => handleArrowKeyMove('left'),
      preventDefault: true,
    },
    {
      key: 'ArrowRight',
      handler: () => handleArrowKeyMove('right'),
      preventDefault: true,
    },
  ]);

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
        
        // Skip update for shapes currently being dragged (single or group)
        // This prevents flicker during drag by letting Konva manage the position
        if (groupDragStartPositions.current.has(prevShape.id)) {
          syncedMap.delete(prevShape.id);
          return prevShape;
        }
        
        // Skip update for shapes with pending Firebase writes
        // Wait until Firebase confirms the write (version >= expected)
        const expectedVersion = pendingUpdates.current.get(prevShape.id);
        if (expectedVersion !== undefined) {
          if (syncedShape.version >= expectedVersion) {
            // Firebase write confirmed! Remove from pending
            pendingUpdates.current.delete(prevShape.id);
            // Allow the update to proceed
          } else {
            // Still waiting for Firebase write to complete
            syncedMap.delete(prevShape.id);
            return prevShape;
          }
        }
        
        // Deep comparison - only update if actually different
        if (
          prevShape.x !== syncedShape.x ||
          prevShape.y !== syncedShape.y ||
          prevShape.width !== syncedShape.width ||
          prevShape.height !== syncedShape.height ||
          prevShape.fill !== syncedShape.fill ||
          prevShape.zIndex !== syncedShape.zIndex ||
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

    // Generate unique ID client-side for optimistic update
    const shapeId = generateUniqueId();

    // Optimistic update: Add to local state immediately
    const optimisticShape: CanvasObject = {
      ...shapeData,
      id: shapeId,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1, // Initial version
      lastEditedBy: currentUser.id, // Set to creator
    };
    
    setShapes(prevShapes => [...prevShapes, optimisticShape]);
    
    // Write to Firebase in background with same ID
    try {
      await createShapeInFirebase(canvasId, shapeData, shapeId);
      // Firestore listener will sync the confirmed shape from server
    } catch (error) {
      console.error('Failed to create shape in Firebase:', error);
      showError('Failed to create shape. Please try again.');
      // Revert optimistic update on error
      setShapes(prevShapes => prevShapes.filter(s => s.id !== shapeId));
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
    
    const shape = shapes.find(s => s.id === id);
    
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

    // Get the ORIGINAL position from before drag started (not current state!)
    const startPos = groupDragStartPositions.current.get(id);
    if (!startPos) {
      draggingShapeIdRef.current = null;
      groupDragStartPositions.current.clear();
      return;
    }

    // Store shape for version checking
    const shape = shapes.find(s => s.id === id);
    
    if (!shape) {
      draggingShapeIdRef.current = null;
      groupDragStartPositions.current.clear();
      return;
    }

    // Round coordinates to avoid floating point precision issues
    const roundedX = Math.round(x);
    const roundedY = Math.round(y);

    // Calculate delta movement from ORIGINAL start position
    const deltaX = roundedX - Math.round(startPos.x);
    const deltaY = roundedY - Math.round(startPos.y);

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
          
          const updatedShape = { 
            ...shape, 
            x: newX, 
            y: newY, 
            updatedAt: new Date(),
            version: shape.version + 1, // Increment version optimistically
            lastEditedBy: currentUser.id, // Track who edited
          };
          
          // Register this shape as having a pending Firebase write
          // The listener will only accept updates with version >= this
          pendingUpdates.current.set(shape.id, updatedShape.version);
          
          return updatedShape;
        }
        return shape; // Keep same reference for unchanged shapes
      })
    );

    // Clear drag refs immediately
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
          shape.version
        );
      }
      
      // Note: pendingUpdates will be cleared automatically by handleShapesUpdate
      // when Firebase listener confirms the write (version >= expected)
      
    } catch (error) {
      // Clear pending updates on error so shapes can receive Firebase updates again
      shapesToUpdate.forEach(shapeId => {
        pendingUpdates.current.delete(shapeId);
      });
      
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

    // Sort shapes by zIndex (lowest to highest) so they render in correct layering order
    // Create new array to ensure React detects the change
    const sorted = [...visible].sort((a, b) => {
      const aZ = a.zIndex ?? 0;
      const bZ = b.zIndex ?? 0;
      return aZ - bZ; // Ascending order: lower zIndex renders first (bottom)
    });

    // Log virtualization stats (can be removed in production)
    if (shapes.length > 50) {
      console.log(
        `[Virtualization] Rendering ${sorted.length}/${shapes.length} shapes ` +
        `(${Math.round((sorted.length / shapes.length) * 100)}% visible)`
      );
    }

    return sorted;
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
        isAIPanelOpen={isAIPanelOpen}
        onToggleAI={handleToggleAI}
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

      {/* Shape Edit Bar - Only show when exactly 1 shape is selected */}
      {selectedShapeIds.length === 1 && (() => {
        const selectedShape = shapes.find(s => s.id === selectedShapeIds[0]);
        if (!selectedShape) return null;

        const handleShapeUpdate = (updates: Partial<CanvasObject>) => {
          if (!canvasId || !currentUser) return;

          // Optimistic update (live preview during color picker dragging)
          setShapes(prevShapes =>
            prevShapes.map(shape =>
              shape.id === selectedShape.id
                ? { ...shape, ...updates, updatedAt: new Date() }
                : shape
            )
          );

          // Sync to Firebase
          updateShapeInFirebase(canvasId, selectedShape.id, updates, currentUser.id)
            .catch(error => {
              console.error('Failed to update shape:', error);
              showError('Failed to update shape. Please try again.');
            });
        };

        // Called when user commits a color (closes popover or clicks swatch)
        const handleColorCommit = (color: string) => {
          addRecentColor(color);
        };

        return (
          <ShapeEditBar
            shape={selectedShape}
            stageScale={stageScale}
            stageX={stageX}
            stageY={stageY}
            onUpdate={handleShapeUpdate}
            onColorCommit={handleColorCommit}
            onBringToFront={handleBringToFront}
            onSendToBack={handleSendToBack}
            recentColors={recentColors}
          />
        );
      })()}

      {/* AI Command Input - Conditional Floating Panel */}
      {currentUser && canvasId && isAIPanelOpen && (
        <AICommandInput
          canvasId={canvasId}
          userId={currentUser.id}
          userName={currentUser.displayName}
          onClose={handleToggleAI}
          canvasState={{
            shapes: shapes.map(shape => ({
              id: shape.id,
              type: shape.type,
              x: shape.x,
              y: shape.y,
              width: shape.width,
              height: shape.height,
              fill: shape.fill,
              text: shape.text,
            })),
            selectedShapeIds,
            viewport: {
              x: stageX,
              y: stageY,
              scale: stageScale,
            },
          }}
        />
      )}

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

