import React, { useRef, useEffect, useState } from 'react';
import type { CanvasObject } from '../../types';
import { DEFAULT_FONT_SIZE, DEFAULT_FONT_FAMILY, DEFAULT_TEXT_COLOR } from '../../utils/constants';

interface TextEditOverlayProps {
  shape: CanvasObject;
  stageX: number;
  stageY: number;
  stageScale: number;
  onTextChange: (id: string, newText: string) => void;
  onExitEditMode: () => void;
}

/**
 * TextEditOverlay Component
 * 
 * HTML textarea overlay for editing text boxes.
 * Rendered outside the Konva Stage to avoid React-Konva reconciler issues.
 * Positioned absolutely over the text box using stage coordinates.
 */
export const TextEditOverlay: React.FC<TextEditOverlayProps> = ({
  shape,
  stageX,
  stageY,
  stageScale,
  onTextChange,
  onExitEditMode,
}) => {
  const [textareaValue, setTextareaValue] = useState(shape.text || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0, width: 0 });

  // Calculate textarea position
  useEffect(() => {
    const stageContainer = document.querySelector('.konvajs-content');
    if (stageContainer) {
      const containerRect = stageContainer.getBoundingClientRect();
      const x = containerRect.left + (shape.x * stageScale) + stageX;
      const y = containerRect.top + (shape.y * stageScale) + stageY;
      const width = shape.width * stageScale;
      
      setPosition({ x, y, width });
    }
  }, [shape.x, shape.y, shape.width, stageX, stageY, stageScale]);

  // Auto-focus textarea when component mounts
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      // Don't select all text - let user continue typing from where they were
    }
  }, []);

  // Update local value when shape text changes (from external updates)
  useEffect(() => {
    setTextareaValue(shape.text || '');
  }, [shape.text]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextareaValue(e.target.value);
  };

  const handleBlur = async () => {
    if (textareaValue !== shape.text) {
      await onTextChange(shape.id, textareaValue);
    }
    onExitEditMode();
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (textareaValue !== shape.text) {
        await onTextChange(shape.id, textareaValue);
      }
      onExitEditMode();
    }
  };

  const fontSize = shape.fontSize || DEFAULT_FONT_SIZE;
  const fontFamily = shape.fontFamily || DEFAULT_FONT_FAMILY;
  const color = shape.color || DEFAULT_TEXT_COLOR;
  const isBold = shape.textFormat?.bold || false;
  const isItalic = shape.textFormat?.italic || false;

  return (
    <textarea
      ref={textareaRef}
      value={textareaValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${position.width}px`,
        minHeight: `${shape.height * stageScale}px`,
        fontSize: `${fontSize * stageScale}px`,
        fontFamily: fontFamily,
        fontWeight: isBold ? 'bold' : 'normal',
        fontStyle: isItalic ? 'italic' : 'normal',
        color: color,
        padding: '2px',
        border: '2px solid #3B82F6',
        borderRadius: '2px',
        background: 'rgba(255, 255, 255, 0.95)',
        outline: 'none',
        resize: 'none',
        overflow: 'auto',
        lineHeight: '1.2',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        zIndex: 1000,
        boxSizing: 'border-box',
      }}
    />
  );
};

