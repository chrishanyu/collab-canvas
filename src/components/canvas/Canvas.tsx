import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { useAuth } from '../../hooks/useAuth';
import { getCanvasById } from '../../services/canvas.service';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorAlert } from '../common/ErrorAlert';
import { CanvasToolbar } from './CanvasToolbar';
import { constrainZoom } from '../../utils/canvasHelpers';
import type { Canvas as CanvasType } from '../../types';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  DEFAULT_ZOOM,
  DEFAULT_CANVAS_X,
  DEFAULT_CANVAS_Y,
  ZOOM_SPEED,
} from '../../utils/constants';

/**
 * Canvas Component
 * Main canvas component that renders the Konva Stage and Layer
 * Handles canvas metadata loading, pan, and zoom functionality
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
    <div className="relative w-full h-screen overflow-hidden bg-gray-100">
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
      />

      {/* Konva Stage */}
      <div className="pt-[60px] w-full h-full">
        <Stage
          ref={stageRef}
          width={stageWidth}
          height={stageHeight - 60} // Subtract header height
          scaleX={stageScale}
          scaleY={stageScale}
          x={stageX}
          y={stageY}
          draggable={true}
          onDragEnd={handleDragEnd}
          onWheel={handleWheel}
        >
          <Layer>
            {/* Canvas objects will be rendered here in future tasks */}
            {/* For now, the layer is empty - just basic rendering */}
          </Layer>
        </Stage>
      </div>

      {/* Canvas Info (dev only - can be removed later) */}
      <div className="absolute bottom-4 left-4 bg-white/90 rounded-lg shadow-lg px-4 py-2 text-xs text-gray-600">
        <div>Canvas: {CANVAS_WIDTH} × {CANVAS_HEIGHT}px</div>
        <div>Viewport: {stageWidth} × {stageHeight - 60}px</div>
        <div>Scale: {stageScale.toFixed(2)}x</div>
        <div>Position: ({Math.round(stageX)}, {Math.round(stageY)})</div>
      </div>
    </div>
  );
};

