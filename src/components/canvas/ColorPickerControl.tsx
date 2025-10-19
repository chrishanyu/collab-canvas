import React, { useState, useRef, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { Paintbrush } from 'lucide-react';

interface ColorPickerControlProps {
  value: string;
  onChange: (color: string) => void;
  onColorCommit?: (color: string) => void; // Called when user commits the color (not during dragging)
  recentColors?: string[];
}

// Default 16-color palette (4x4 grid) - common design tool colors
const DEFAULT_PALETTE = [
  // Row 1: Grayscale
  '#FFFFFF', '#E5E7EB', '#9CA3AF', '#374151',
  // Row 2: Primary colors
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
  // Row 3: Secondary colors
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
  // Row 4: Darker variants
  '#991B1B', '#92400E', '#065F46', '#1E3A8A',
];

/**
 * ColorPickerControl Component
 * 
 * Color picker button with popover for selecting shape fill colors.
 * 
 * Features:
 * - Shows current color on button
 * - Opens popover with react-colorful picker
 * - 16-color default palette (4x4 grid)
 * - Recent colors row (max 8)
 * - Click outside to close
 */
export const ColorPickerControl: React.FC<ColorPickerControlProps> = ({
  value,
  onChange,
  onColorCommit,
  recentColors = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [initialColor, setInitialColor] = useState(value); // Track color when popover opened
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside and commit color
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        // Commit the color before closing (user is done picking)
        if (onColorCommit && value !== initialColor) {
          onColorCommit(value);
        }
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, value, initialColor, onColorCommit]);

  const handleColorSelect = (color: string) => {
    onChange(color);
    // Explicit color selection (palette/recent color click) - commit immediately
    if (onColorCommit) {
      onColorCommit(color);
    }
    setIsOpen(false);
  };

  // Track when popover opens to store initial color
  const handleTogglePopover = () => {
    if (!isOpen) {
      // Opening popover - store current color
      setInitialColor(value);
      setIsOpen(true);
    } else {
      // Closing popover - commit color if changed
      if (onColorCommit && value !== initialColor) {
        onColorCommit(value);
      }
      setIsOpen(false);
    }
  };

  // Determine if color is light or dark for icon contrast
  const isLightColor = (hex: string) => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma > 128;
  };

  return (
    <div className="relative">
      {/* Color Picker Button */}
      <button
        ref={buttonRef}
        onClick={handleTogglePopover}
        className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center group"
        style={{ backgroundColor: value }}
        title="Fill Color"
      >
        <Paintbrush
          size={16}
          className={`${
            isLightColor(value) ? 'text-gray-700' : 'text-white'
          } group-hover:scale-110 transition-transform`}
        />
      </button>

      {/* Color Picker Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-[10000]"
          style={{ width: '240px' }}
        >
          {/* react-colorful picker */}
          <div className="mb-4">
            <HexColorPicker color={value} onChange={onChange} />
          </div>

          {/* Current Color Display with Hex Value */}
          <div className="mb-4">
            <div className="text-xs font-medium text-gray-700 mb-2">Current Color</div>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded border border-gray-300"
                style={{ backgroundColor: value }}
              />
              <input
                type="text"
                value={value.toUpperCase()}
                onChange={(e) => {
                  const hex = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(hex)) {
                    onChange(hex);
                  }
                }}
                className="flex-1 px-2 py-1 text-xs font-mono border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="#FFFFFF"
              />
            </div>
          </div>

          {/* Recent Colors */}
          {recentColors.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-medium text-gray-700 mb-2">Recent Colors</div>
              <div className="flex gap-1 flex-wrap">
                {recentColors.map((color, index) => (
                  <button
                    key={`${color}-${index}`}
                    onClick={() => handleColorSelect(color)}
                    className="w-7 h-7 rounded border border-gray-300 hover:border-gray-400 hover:scale-110 transition-all"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Default Color Palette (4x4 grid) */}
          <div>
            <div className="text-xs font-medium text-gray-700 mb-2">Default Palette</div>
            <div className="grid grid-cols-4 gap-1">
              {DEFAULT_PALETTE.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  className="w-12 h-12 rounded border border-gray-300 hover:border-gray-400 hover:scale-105 transition-all"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

