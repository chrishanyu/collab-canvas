import { useState, useEffect, useRef } from 'react';

export type ConnectionStatus = 'online' | 'offline' | 'reconnecting';

interface UseConnectionStatusReturn {
  status: ConnectionStatus;
  isConnected: boolean;
}

/**
 * Custom hook to monitor network connection status
 * 
 * Uses browser online/offline events to detect network connectivity.
 * Shows "reconnecting" state briefly when coming back online.
 * 
 * @returns Connection status and boolean flag
 */
export const useConnectionStatus = (): UseConnectionStatusReturn => {
  const [status, setStatus] = useState<ConnectionStatus>('online');
  const [isConnected, setIsConnected] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Initialize based on current navigator status
    if (!navigator.onLine) {
      setStatus('offline');
      setIsConnected(false);
    }

    // Handle going offline
    const handleOffline = () => {
      // Clear any pending reconnection timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      
      setStatus('offline');
      setIsConnected(false);
    };

    // Handle coming back online
    const handleOnline = () => {
      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      // Show "reconnecting" briefly when coming back online
      setStatus('reconnecting');
      setIsConnected(false);

      // After 2 seconds, switch to fully "online"
      timerRef.current = setTimeout(() => {
        setStatus('online');
        setIsConnected(true);
        timerRef.current = null;
      }, 2000);
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup event listeners on unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      // Clear any pending timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    status,
    isConnected,
  };
};

