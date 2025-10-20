import React, { useState, useRef, useEffect } from 'react';

interface FontSizeControlProps {
  value: number;
  onChange: (size: number) => void;
}

// Predefined font sizes
const FONT_SIZES = [
  { label: 'Small', value: 14 },
  { label: 'Medium', value: 16 },
  { label: 'Large', value: 20 },
];

/**
 * FontSizeControl Component
 * 
 * Dropdown selector for text font size.
 * Offers three preset sizes: Small (14px), Medium (16px), Large (20px).
 */
export const FontSizeControl: React.FC<FontSizeControlProps> = ({
  value,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (size: number) => {
    onChange(size);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative border-l border-gray-200 pl-2">
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center gap-1 px-2 h-8 
          bg-gray-100 hover:bg-gray-200 rounded
          text-sm text-gray-700 transition-colors
        "
        title="Font Size"
      >
        <span className="font-medium">{value}px</span>
        <svg 
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="
          absolute top-full left-0 mt-1
          bg-white rounded-lg shadow-lg border border-gray-200
          min-w-[120px] py-1 z-[10000]
        ">
          {FONT_SIZES.map((size) => (
            <button
              key={size.value}
              onClick={() => handleSelect(size.value)}
              className={`
                w-full px-3 py-2 text-left text-sm
                hover:bg-gray-100 transition-colors
                ${size.value === value ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'}
              `}
            >
              <div className="flex items-center justify-between">
                <span>{size.label}</span>
                <span className="text-xs text-gray-500">{size.value}px</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

