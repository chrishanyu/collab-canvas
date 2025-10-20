import React from 'react';

interface TextStyleControlsProps {
  isBold: boolean;
  isItalic: boolean;
  onToggleBold: () => void;
  onToggleItalic: () => void;
}

/**
 * TextStyleControls Component
 * 
 * Toggle buttons for text formatting:
 * - Bold (B button)
 * - Italic (I button)
 */
export const TextStyleControls: React.FC<TextStyleControlsProps> = ({
  isBold,
  isItalic,
  onToggleBold,
  onToggleItalic,
}) => {
  return (
    <div className="flex items-center gap-1 border-l border-gray-200 pl-2">
      {/* Bold Toggle */}
      <button
        onClick={onToggleBold}
        className={`
          w-8 h-8 rounded flex items-center justify-center
          font-bold text-sm transition-colors
          ${isBold 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }
        `}
        title="Bold"
      >
        B
      </button>

      {/* Italic Toggle */}
      <button
        onClick={onToggleItalic}
        className={`
          w-8 h-8 rounded flex items-center justify-center
          italic text-sm font-serif transition-colors
          ${isItalic 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }
        `}
        title="Italic"
      >
        I
      </button>
    </div>
  );
};

