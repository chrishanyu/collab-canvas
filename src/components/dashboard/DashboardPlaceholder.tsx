import React from 'react';
import { useAuth } from '../../hooks/useAuth';

export const DashboardPlaceholder: React.FC = () => {
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Logout
            </button>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="text-lg text-gray-700">
              Welcome, <span className="font-semibold">{currentUser?.displayName}</span>!
            </p>
            <p className="text-gray-600 mt-2">
              Dashboard functionality coming in PR #3
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

