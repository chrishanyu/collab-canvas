import React from 'react';
import { usePresence } from '../../hooks/usePresence';
import { Cursor } from '../canvas/Cursor';
import { OnlineUsers } from './OnlineUsers';
import { getUserCursorColor } from '../../utils/canvasHelpers';

interface UserPresenceProps {
  canvasId: string | undefined;
  userId: string | undefined;
  displayName: string | undefined;
  onCursorMove: (updateCursor: (x: number, y: number) => void) => void;
  stageX: number;
  stageY: number;
  stageScale: number;
  headerHeight: number;
}

/**
 * UserPresence Component
 * Wrapper component that manages presence logic for a canvas
 * - Renders other users' cursors as overlays
 * - Shows online users list
 * - Handles cursor tracking
 */
export const UserPresence: React.FC<UserPresenceProps> = ({
  canvasId,
  userId,
  displayName,
  onCursorMove,
  stageX,
  stageY,
  stageScale,
  headerHeight,
}) => {
  const { onlineUsers, updateCursor } = usePresence(
    canvasId,
    userId,
    displayName
  );

  // Pass updateCursor function to parent via callback
  React.useEffect(() => {
    onCursorMove(updateCursor);
  }, [updateCursor, onCursorMove]);

  return (
    <>
      {/* Render all users' cursors as overlays (including current user) */}
      {onlineUsers.map((user) => {
        // Generate color client-side: current user = black, others = deterministic color
        const color = user.userId === userId 
          ? '#000000' 
          : getUserCursorColor(user.userId, '__NOT_CURRENT__');
        
        const isCurrentUser = user.userId === userId;
        
        // Convert canvas coordinates to viewport coordinates
        // This ensures cursors appear correctly regardless of each user's zoom/pan
        const viewportX = user.cursorX * stageScale + stageX;
        const viewportY = user.cursorY * stageScale + stageY + headerHeight;
        
        return (
          <Cursor
            key={user.userId}
            x={viewportX}
            y={viewportY}
            name={user.displayName}
            color={color}
            showName={!isCurrentUser}
          />
        );
      })}

      {/* Online users list */}
      <OnlineUsers 
        users={onlineUsers.map((user) => ({
          ...user,
          color: user.userId === userId 
            ? '#000000' 
            : getUserCursorColor(user.userId, '__NOT_CURRENT__')
        }))} 
        currentUserId={userId} 
      />
    </>
  );
};

