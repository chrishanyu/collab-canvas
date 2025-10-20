import React, { useEffect, useState, useRef } from 'react';
import type { CanvasObject } from '../../types';
import { ColorPickerControl } from './ColorPickerControl';
import { ZIndexControls } from './ZIndexControls';
import { TextColorControl } from './TextColorControl';
import { TextStyleControls } from './TextStyleControls';
import { FontSizeControl } from './FontSizeControl';
import { DEFAULT_TEXT_COLOR, DEFAULT_FONT_SIZE } from '../../utils/constants';

export interface ShapeEditBarProps {
  shape: CanvasObject;
  stageScale: number;
  stageX: number;
  stageY: number;
  onUpdate: (updates: Partial<CanvasObject>) => void;
  onLivePreview?: (updates: Partial<CanvasObject>) => void; // Called during live preview (no Firebase)
  onColorCommit?: (color: string) => void; // Called when user commits color (not during preview)
  onBringToFront?: () => void; // Layer control handlers
  onSendToBack?: () => void;
  recentColors?: string[];
  children?: React.ReactNode;
}

/**
 * ShapeEditBar Component
 * 
 * Floating toolbar that appears above a selected shape for contextual editing.
 * Positioned 10px above the shape's top edge, centered horizontally.
 * 
 * Features:
 * - Follows shape during pan/zoom
 * - Smart positioning (flips below if near top edge)
 * - Extensible design for adding more controls
 * - Smooth fade in/out animation
 */
export const ShapeEditBar: React.FC<ShapeEditBarProps> = ({
  shape,
  stageScale,
  stageX,
  stageY,
  onUpdate,
  onLivePreview,
  onColorCommit,
  onBringToFront,
  onSendToBack,
  recentColors = [],
  children,
}) => {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);

  // Calculate screen position from canvas coordinates
  useEffect(() => {
    // Convert canvas coordinates to screen coordinates
    const screenX = shape.x * stageScale + stageX;
    const screenY = shape.y * stageScale + stageY;
    const screenWidth = shape.width * stageScale;
    const screenHeight = shape.height * stageScale;

    // Get bar width for centering (default 200px if not rendered yet)
    const barWidth = barRef.current?.offsetWidth || 200;
    const barHeight = barRef.current?.offsetHeight || 48;

    // Position bar 10px above shape, centered horizontally
    let top = screenY - barHeight - 10;
    let left = screenX + (screenWidth / 2) - (barWidth / 2);

    // Smart positioning: Flip below shape if too close to top edge
    const topEdgeThreshold = 60; // 60px from top
    if (top < topEdgeThreshold) {
      // Position below shape instead
      top = screenY + screenHeight + 10;
    }

    // Adjust horizontal position if near edges
    const horizontalPadding = 20;
    if (left < horizontalPadding) {
      left = horizontalPadding;
    } else if (left + barWidth > window.innerWidth - horizontalPadding) {
      left = window.innerWidth - barWidth - horizontalPadding;
    }

    setPosition({ top, left });
    
    // Trigger fade-in animation after position is calculated
    if (!isVisible) {
      // Small delay to ensure DOM is ready
      setTimeout(() => setIsVisible(true), 10);
    }
  }, [shape.x, shape.y, shape.width, shape.height, stageScale, stageX, stageY, isVisible]);

  // Recalculate position on window resize
  useEffect(() => {
    const handleResize = () => {
      // Force recalculation by temporarily hiding
      setIsVisible(false);
      setTimeout(() => setIsVisible(true), 10);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isTextBox = shape.type === 'text';

  // Text formatting handlers
  const handleToggleBold = () => {
    const currentBold = shape.textFormat?.bold || false;
    const updates = {
      textFormat: {
        ...shape.textFormat,
        bold: !currentBold,
      },
    };
    // Use live preview first for instant feedback, then commit
    if (onLivePreview) {
      onLivePreview(updates);
    }
    onUpdate(updates);
  };

  const handleToggleItalic = () => {
    const currentItalic = shape.textFormat?.italic || false;
    const updates = {
      textFormat: {
        ...shape.textFormat,
        italic: !currentItalic,
      },
    };
    // Use live preview first for instant feedback, then commit
    if (onLivePreview) {
      onLivePreview(updates);
    }
    onUpdate(updates);
  };

  const handleFontSizeChange = (fontSize: number) => {
    const updates = { fontSize };
    // Use live preview first for instant feedback, then commit
    if (onLivePreview) {
      onLivePreview(updates);
    }
    onUpdate(updates);
  };

  return (
    <div
      ref={barRef}
      className={`fixed z-[9999] bg-white rounded-lg shadow-lg transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        padding: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      }}
    >
      {/* Horizontal flex container for extensible controls */}
      <div className="flex items-center gap-2">
        {isTextBox ? (
          <>
            {/* Text Box Controls */}
            <TextColorControl
              value={shape.color || DEFAULT_TEXT_COLOR}
              onChange={(color) => onLivePreview ? onLivePreview({ color }) : onUpdate({ color })}
              onColorCommit={onColorCommit}
              recentColors={recentColors}
            />
            
            <TextStyleControls
              isBold={shape.textFormat?.bold || false}
              isItalic={shape.textFormat?.italic || false}
              onToggleBold={handleToggleBold}
              onToggleItalic={handleToggleItalic}
            />
            
            <FontSizeControl
              value={shape.fontSize || DEFAULT_FONT_SIZE}
              onChange={handleFontSizeChange}
            />
            
            {/* Z-Index Controls */}
            {onBringToFront && onSendToBack && (
              <ZIndexControls
                onBringToFront={onBringToFront}
                onSendToBack={onSendToBack}
              />
            )}
          </>
        ) : (
          <>
            {/* Regular Shape Controls */}
            <ColorPickerControl
              value={shape.fill}
              onChange={(color) => onLivePreview ? onLivePreview({ fill: color }) : onUpdate({ fill: color })}
              onColorCommit={onColorCommit}
              recentColors={recentColors}
            />
            
            {/* Z-Index Controls */}
            {onBringToFront && onSendToBack && (
              <ZIndexControls
                onBringToFront={onBringToFront}
                onSendToBack={onSendToBack}
              />
            )}
          </>
        )}
        
        {/* Additional controls can be added here */}
        {children}
      </div>
    </div>
  );
};

