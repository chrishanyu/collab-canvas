import React from 'react';

export const CanvasPlaceholder: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Canvas View</h1>
        <p className="text-gray-600">
          Canvas functionality coming in PR #4-7
        </p>
      </div>
    </div>
  );
};

