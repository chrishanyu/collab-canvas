import React from 'react';

interface CanvasHeaderProps {
  canvasName: string;
  onShare: () => void;
}

/**
 * CanvasHeader Component
 * 
 * Floating navigation card in the top-left corner of the canvas.
 * Provides back button to dashboard and displays canvas name.
 * 
 * Position: Fixed top-left (16px from edges)
 * Style: Floating card with shadow
 */
export const CanvasHeader: React.FC<CanvasHeaderProps> = ({ canvasName, onShare }) => {
  return (
    <div className="absolute top-4 left-4 z-20 bg-white rounded-lg shadow-lg px-4 py-3 flex items-center gap-3">
      {/* Back Button */}
      <a
        href="/dashboard"
        className="text-gray-600 hover:text-gray-900 transition-all duration-200 hover:scale-110"
        title="Back to Dashboard"
      >
        <svg 
          className="w-5 h-5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M10 19l-7-7m0 0l7-7m-7 7h18" 
          />
        </svg>
      </a>
      
      {/* Divider */}
      <div className="h-6 w-px bg-gray-300"></div>
      
      {/* Canvas Name */}
      <h1 className="text-base font-semibold text-gray-900 max-w-xs truncate">
        {canvasName}
      </h1>
      
      {/* Share Button */}
      <button
        onClick={onShare}
        className="rounded-md p-2 text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
        aria-label={`Share ${canvasName}`}
        title="Share canvas"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
      </button>
    </div>
  );
};

