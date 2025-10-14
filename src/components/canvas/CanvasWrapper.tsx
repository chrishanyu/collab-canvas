import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getCanvasById, updateCanvasAccess } from '../../services/canvas.service';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorAlert } from '../common/ErrorAlert';
import { Canvas } from './Canvas';

/**
 * CanvasWrapper handles canvas access logic:
 * - Checks if canvas exists
 * - Adds canvas to user's access list if not already present
 * - Renders the Canvas component
 */
export const CanvasWrapper: React.FC = () => {
  const { canvasId } = useParams<{ canvasId: string }>();
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCanvasAccess = async () => {
      if (!canvasId || !currentUser) return;

      try {
        setLoading(true);
        setError(null);

        // Check if canvas exists
        const canvas = await getCanvasById(canvasId);
        
        if (!canvas) {
          setError('Canvas not found');
          setLoading(false);
          return;
        }

        // Add canvas to user's access list if accessing via shared link
        // This is a collaborator if they're not the owner
        const role = canvas.ownerId === currentUser.id ? 'owner' : 'collaborator';
        await updateCanvasAccess(currentUser.id, canvasId, role);

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to access canvas');
        setLoading(false);
      }
    };

    handleCanvasAccess();
  }, [canvasId, currentUser]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md">
          <ErrorAlert message={error} />
          <div className="mt-4 text-center">
            <a
              href="/dashboard"
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              Return to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <Canvas />;
};

