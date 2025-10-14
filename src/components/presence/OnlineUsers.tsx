import React from 'react';

interface OnlineUser {
  userId: string;
  displayName: string;
  color: string;
}

interface OnlineUsersProps {
  users: OnlineUser[];
  currentUserId?: string;
}

/**
 * OnlineUsers Component
 * Displays list of users currently viewing this canvas
 * Positioned in top right corner of canvas
 */
export const OnlineUsers: React.FC<OnlineUsersProps> = ({ users, currentUserId }) => {
  if (users.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-20 right-4 z-20 bg-white rounded-lg shadow-lg px-3 py-2 min-w-[160px]">
      <div className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        Online ({users.length})
      </div>
      <div className="space-y-1.5">
        {users.map((user) => (
          <div
            key={user.userId}
            className="flex items-center gap-2 text-sm"
            title={user.displayName}
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: user.color }}
            />
            <span className="text-gray-700 truncate">
              {user.displayName}
              {user.userId === currentUserId && (
                <span className="text-gray-400 ml-1">(you)</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

