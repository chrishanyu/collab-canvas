import React, { useEffect, useState } from 'react';
import { useConnectionStatus } from '../../hooks/useConnectionStatus';

/**
 * ConnectionIndicator Component
 * 
 * Displays a banner below the canvas header to show network connection status.
 * Positioned at 60px from top (below the header) to avoid blocking navigation.
 * - Green "Connected": Shows briefly when connection is restored, auto-dismisses after 3s
 * - Yellow "Reconnecting...": Shows when coming back online
 * - Red "Offline": Shows when network connection is lost
 */
export const ConnectionIndicator: React.FC = () => {
  const { status } = useConnectionStatus();
  const [showConnected, setShowConnected] = useState(false);
  const [prevStatus, setPrevStatus] = useState(status);

  useEffect(() => {
    // If status changed from offline/reconnecting to online, show "Connected" briefly
    if (status === 'online' && (prevStatus === 'offline' || prevStatus === 'reconnecting')) {
      setShowConnected(true);

      // Auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        setShowConnected(false);
      }, 3000);

      return () => clearTimeout(timer);
    }

    setPrevStatus(status);
  }, [status, prevStatus]);

  // Don't show anything if online and not showing success message
  if (status === 'online' && !showConnected) {
    return null;
  }

  // Determine banner styles based on status
  const getStatusStyles = () => {
    if (showConnected) {
      return {
        bg: 'bg-green-500',
        text: 'Connected',
        icon: '✓',
      };
    }

    switch (status) {
      case 'reconnecting':
        return {
          bg: 'bg-yellow-500',
          text: 'Reconnecting...',
          icon: '↻',
        };
      case 'offline':
        return {
          bg: 'bg-red-500',
          text: 'You are offline. Changes will not be saved.',
          icon: '⚠',
        };
      default:
        return null;
    }
  };

  const styles = getStatusStyles();
  if (!styles) return null;

  return (
    <div
      className={`fixed left-0 right-0 top-[60px] z-50 ${styles.bg} px-4 py-2 text-center text-sm font-medium text-white shadow-lg transition-all duration-300 ease-in-out`}
      role="alert"
    >
      <span className="mr-2 inline-block">{styles.icon}</span>
      {styles.text}
    </div>
  );
};

