import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { createCanvas, getUserCanvases, generateShareLink } from '../../services/canvas.service';
import type { Canvas } from '../../types';
import { CanvasCard } from './CanvasCard';
import { CreateCanvasModal } from './CreateCanvasModal';
import { ShareLinkModal } from './ShareLinkModal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorAlert } from '../common/ErrorAlert';

export const Dashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [canvases, setCanvases] = useState<Canvas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedCanvas, setSelectedCanvas] = useState<Canvas | null>(null);

  // Load user's canvases on mount
  useEffect(() => {
    loadCanvases();
  }, [currentUser]);

  const loadCanvases = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);
      const userCanvases = await getUserCanvases(currentUser.id);
      setCanvases(userCanvases);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load canvases');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCanvas = async (name: string) => {
    if (!currentUser) return;

    try {
      const newCanvas = await createCanvas(
        name,
        currentUser.id,
        currentUser.displayName
      );
      
      // Close modal and navigate to new canvas
      setIsCreateModalOpen(false);
      navigate(`/canvas/${newCanvas.id}`);
    } catch (err) {
      throw err; // Let modal handle the error display
    }
  };

  const handleShareCanvas = (canvas: Canvas) => {
    setSelectedCanvas(canvas);
    setIsShareModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CollabCanvas</h1>
              <p className="text-sm text-gray-500">
                Welcome back, {currentUser?.displayName}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Your Canvases</h2>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create New Canvas
          </button>
        </div>

        {error && (
          <div className="mb-6">
            <ErrorAlert message={error} />
          </div>
        )}

        {/* Canvas Grid */}
        {canvases.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white py-16">
            <svg
              className="mb-4 h-16 w-16 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"
              />
            </svg>
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No canvases yet
            </h3>
            <p className="mb-6 text-sm text-gray-500">
              Create one to get started!
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Create Your First Canvas
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {canvases.map((canvas) => (
              <CanvasCard
                key={canvas.id}
                canvas={canvas}
                onShare={handleShareCanvas}
                onDelete={loadCanvases}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateCanvasModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateCanvas}
      />

      <ShareLinkModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareLink={selectedCanvas ? generateShareLink(selectedCanvas.id) : ''}
        canvasName={selectedCanvas?.name || ''}
      />
    </div>
  );
};

