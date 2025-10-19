import React from 'react';
import { ChevronsUp, ChevronsDown } from 'lucide-react';

interface ZIndexControlsProps {
  onBringToFront: () => void;
  onSendToBack: () => void;
}

/**
 * ZIndexControls Component
 * 
 * Layer management buttons for reordering shapes on the canvas.
 * 
 * Features:
 * - Bring to Front: Moves shape above all others
 * - Send to Back: Moves shape below all others
 * - Only visible when exactly 1 shape selected
 */
export const ZIndexControls: React.FC<ZIndexControlsProps> = ({
  onBringToFront,
  onSendToBack,
}) => {

  return (
    <>
      {/* Vertical Divider */}
      <div className="w-px h-8 bg-gray-300 mx-1" />

      {/* Layer Control Buttons */}
      <div className="flex items-center gap-1">
        {/* Bring to Front */}
        <button
          onClick={onBringToFront}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 active:bg-gray-200 transition-colors group"
          title="Bring to Front"
        >
          <ChevronsUp size={18} className="text-gray-700 group-hover:text-gray-900" />
        </button>

        {/* Send to Back */}
        <button
          onClick={onSendToBack}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 active:bg-gray-200 transition-colors group"
          title="Send to Back"
        >
          <ChevronsDown size={18} className="text-gray-700 group-hover:text-gray-900" />
        </button>
      </div>
    </>
  );
};

