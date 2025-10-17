import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { deleteCanvas } from '../../services/canvas.service';
import type { Canvas } from '../../types';
import { DeleteCanvasModal } from './DeleteCanvasModal';

interface CanvasCardProps {
  canvas: Canvas;
  onShare: (canvas: Canvas) => void;
  onDelete: () => void; // Callback to refresh dashboard after deletion
}

export const CanvasCard: React.FC<CanvasCardProps> = ({ canvas, onShare, onDelete }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { showError, showSuccess } = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if current user is the canvas owner
  const isOwner = canvas.ownerId === currentUser?.id;

  const handleCardClick = () => {
    navigate(`/canvas/${canvas.id}`);
  };

  const handleShareClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click navigation
    onShare(canvas);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click navigation
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!currentUser) return;

    try {
      setIsDeleting(true);
      await deleteCanvas(canvas.id, currentUser.id);
      
      // Success - show success message, close modal and refresh dashboard
      showSuccess('Canvas deleted successfully');
      setShowDeleteModal(false);
      onDelete(); // Refresh dashboard
    } catch (error) {
      // Error handling - show error notification
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete canvas';
      showError(errorMessage);
      console.error('Error deleting canvas:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className="group relative flex h-64 cursor-pointer flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleCardClick();
          }
        }}
      >
        {/* Delete Button (Owner Only) */}
        {isOwner && (
          <button
            onClick={handleDeleteClick}
            className="absolute right-2 top-2 rounded-md p-2 text-gray-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
            aria-label={`Delete ${canvas.name}`}
            title="Delete canvas"
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}

        {/* Canvas Thumbnail Placeholder */}
      <div className="mb-4 flex h-32 items-center justify-center rounded-md bg-gradient-to-br from-indigo-50 to-purple-50">
        {canvas.thumbnail ? (
          <img
            src={canvas.thumbnail}
            alt={canvas.name}
            className="h-full w-full rounded-md object-cover"
          />
        ) : (
          <svg
            className="h-16 w-16 text-indigo-300"
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
        )}
      </div>

      {/* Canvas Info */}
      <div className="flex flex-1 flex-col">
        <h3 className="mb-1 line-clamp-2 text-lg font-semibold text-gray-900 group-hover:text-indigo-600">
          {canvas.name}
        </h3>
        <p className="mb-2 text-sm text-gray-500">by {canvas.ownerName}</p>

        <div className="mt-auto flex items-center justify-between">
          <div className="text-xs text-gray-400">
            <p>Created {formatDate(canvas.createdAt)}</p>
            <p>Modified {formatDate(canvas.updatedAt)}</p>
          </div>

          <button
            onClick={handleShareClick}
            className="rounded-md p-2 text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
            aria-label={`Share ${canvas.name}`}
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
      </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteCanvasModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        canvasName={canvas.name}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
};

