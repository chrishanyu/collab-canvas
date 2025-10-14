import React from 'react';

interface CursorProps {
  x: number;
  y: number;
  name: string;
  color: string;
  showName?: boolean;
}

/**
 * Cursor Component
 * Renders a user's cursor as an HTML/SVG overlay
 * Independent of canvas zoom/pan - uses viewport coordinates
 */
export const Cursor: React.FC<CursorProps> = ({ x, y, name, color, showName = true }) => {
  return (
    <div
      className="pointer-events-none absolute z-50 transition-transform duration-100 ease-out"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-2px, -2px)',
      }}
    >
      {/* Cursor SVG */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
        }}
      >
        {/* Cursor pointer shape */}
        <path
          d="M5.65376 12.3673L2 4.38415L11.6853 9.56213L9.09976 12.1477L11.2685 14.3164L8.08743 17.4975L5.65376 12.3673Z"
          fill={color}
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* User name label - only show if showName is true */}
      {showName && (
        <div
          className="ml-5 mt-0.5 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap"
          style={{
            backgroundColor: color,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          {name}
        </div>
      )}
    </div>
  );
};

