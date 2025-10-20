import React from 'react';
import { ColorPickerControl } from './ColorPickerControl';

interface TextColorControlProps {
  value: string;
  onChange: (color: string) => void;
  onColorCommit?: (color: string) => void;
  recentColors?: string[];
}

/**
 * TextColorControl Component
 * 
 * Color picker specifically for text color (not fill).
 * Shows "A" icon instead of paintbrush.
 */
export const TextColorControl: React.FC<TextColorControlProps> = ({
  value,
  onChange,
  onColorCommit,
  recentColors = [],
}) => {
  return (
    <ColorPickerControl
      value={value}
      onChange={onChange}
      onColorCommit={onColorCommit}
      recentColors={recentColors}
      showTextIcon={true}
    />
  );
};

