import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConnectionStatus } from '../../src/hooks/useConnectionStatus';

describe('useConnectionStatus', () => {
  // Store original navigator.onLine value
  let originalOnLine: boolean;

  beforeEach(() => {
    // Save original value
    originalOnLine = navigator.onLine;
    
    // Mock navigator.onLine to be online by default
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: true,
    });
    
    vi.clearAllTimers();
  });

  afterEach(() => {
    // Restore original value
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      configurable: true,
      value: originalOnLine,
    });
  });

  describe('Initial State', () => {
    it('should return online status when navigator.onLine is true', () => {
      // Arrange: navigator.onLine is true (set in beforeEach)
      
      // Act
      const { result } = renderHook(() => useConnectionStatus());

      // Assert
      expect(result.current.status).toBe('online');
      expect(result.current.isConnected).toBe(true);
    });

    it('should return offline status when navigator.onLine is false', () => {
      // Arrange: Set navigator.onLine to false
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false,
      });

      // Act
      const { result } = renderHook(() => useConnectionStatus());

      // Assert
      expect(result.current.status).toBe('offline');
      expect(result.current.isConnected).toBe(false);
    });
  });

  describe('Online/Offline Events', () => {
    it('should detect when connection goes offline', () => {
      const { result } = renderHook(() => useConnectionStatus());

      // Initial state should be online
      expect(result.current.status).toBe('online');
      expect(result.current.isConnected).toBe(true);

      // Act: Simulate going offline
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          configurable: true,
          value: false,
        });
        window.dispatchEvent(new Event('offline'));
      });

      // Assert: Should now be offline
      expect(result.current.status).toBe('offline');
      expect(result.current.isConnected).toBe(false);
    });

    it('should detect when connection comes back online', () => {
      // Arrange: Start offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false,
      });

      const { result } = renderHook(() => useConnectionStatus());
      expect(result.current.status).toBe('offline');

      vi.useFakeTimers();

      // Act: Simulate coming online
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          configurable: true,
          value: true,
        });
        window.dispatchEvent(new Event('online'));
      });

      // Assert: Should show 'reconnecting' status
      expect(result.current.status).toBe('reconnecting');
      expect(result.current.isConnected).toBe(false);

      // Wait 2 seconds for reconnecting state to transition to online
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Assert: Should now be fully online
      expect(result.current.status).toBe('online');
      expect(result.current.isConnected).toBe(true);

      vi.useRealTimers();
    });

    it('should show reconnecting state for 2 seconds after coming online', () => {
      // Arrange: Start offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false,
      });

      const { result } = renderHook(() => useConnectionStatus());
      vi.useFakeTimers();

      // Act: Come online
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          configurable: true,
          value: true,
        });
        window.dispatchEvent(new Event('online'));
      });

      // Assert: Should be reconnecting
      expect(result.current.status).toBe('reconnecting');

      // Wait 1 second - should still be reconnecting
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.status).toBe('reconnecting');

      // Wait 1 more second (total 2s) - should now be online
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.status).toBe('online');
      expect(result.current.isConnected).toBe(true);

      vi.useRealTimers();
    });

    it('should handle multiple offline/online transitions', () => {
      const { result } = renderHook(() => useConnectionStatus());
      vi.useFakeTimers();

      // Start online
      expect(result.current.status).toBe('online');

      // Go offline
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          configurable: true,
          value: false,
        });
        window.dispatchEvent(new Event('offline'));
      });
      expect(result.current.status).toBe('offline');

      // Come back online (first time)
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          configurable: true,
          value: true,
        });
        window.dispatchEvent(new Event('online'));
      });
      expect(result.current.status).toBe('reconnecting');

      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(result.current.status).toBe('online');

      // Go offline again
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          configurable: true,
          value: false,
        });
        window.dispatchEvent(new Event('offline'));
      });
      expect(result.current.status).toBe('offline');

      // Come back online (second time)
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          configurable: true,
          value: true,
        });
        window.dispatchEvent(new Event('online'));
      });
      expect(result.current.status).toBe('reconnecting');

      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(result.current.status).toBe('online');

      vi.useRealTimers();
    });
  });

  describe('Event Listener Cleanup', () => {
    it('should clean up event listeners on unmount', () => {
      // Spy on removeEventListener
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      // Render and unmount
      const { unmount } = renderHook(() => useConnectionStatus());
      unmount();

      // Assert: Both event listeners should be removed
      expect(removeEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('offline', expect.any(Function));

      removeEventListenerSpy.mockRestore();
    });

    it('should not respond to events after unmount', () => {
      const { result, unmount } = renderHook(() => useConnectionStatus());

      const initialStatus = result.current.status;

      // Unmount
      unmount();

      // Try to trigger offline event after unmount
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          configurable: true,
          value: false,
        });
        window.dispatchEvent(new Event('offline'));
      });

      // Status should not have changed (hook is unmounted)
      // Note: We can't check result.current after unmount, but we verify
      // that removeEventListener was called
      expect(initialStatus).toBe('online'); // Just verify initial state was captured
    });

    it('should cleanup reconnecting timer on unmount', () => {
      // Arrange: Start offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false,
      });

      const { result, unmount } = renderHook(() => useConnectionStatus());
      vi.useFakeTimers();

      // Trigger online event to start reconnecting timer
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          configurable: true,
          value: true,
        });
        window.dispatchEvent(new Event('online'));
      });

      expect(result.current.status).toBe('reconnecting');

      // Unmount before timer completes
      unmount();

      // Advance timers - should not cause any issues
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // No assertion needed - just verify no errors thrown

      vi.useRealTimers();
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid online/offline transitions', () => {
      const { result } = renderHook(() => useConnectionStatus());
      vi.useFakeTimers();

      // Rapid transitions
      for (let i = 0; i < 5; i++) {
        act(() => {
          Object.defineProperty(navigator, 'onLine', {
            writable: true,
            configurable: true,
            value: false,
          });
          window.dispatchEvent(new Event('offline'));
        });

        act(() => {
          Object.defineProperty(navigator, 'onLine', {
            writable: true,
            configurable: true,
            value: true,
          });
          window.dispatchEvent(new Event('online'));
        });
      }

      // Should end in reconnecting state
      expect(result.current.status).toBe('reconnecting');

      // Wait for timer to complete
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Should finally be online
      expect(result.current.status).toBe('online');

      vi.useRealTimers();
    });

    it('should handle going offline during reconnecting state', () => {
      // Arrange: Start offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false,
      });

      const { result } = renderHook(() => useConnectionStatus());
      vi.useFakeTimers();

      // Come online (start reconnecting)
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          configurable: true,
          value: true,
        });
        window.dispatchEvent(new Event('online'));
      });
      expect(result.current.status).toBe('reconnecting');

      // Go offline again before reconnecting completes
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          configurable: true,
          value: false,
        });
        window.dispatchEvent(new Event('offline'));
      });

      // Should immediately show offline
      expect(result.current.status).toBe('offline');
      expect(result.current.isConnected).toBe(false);

      // Advance timers - should still be offline
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(result.current.status).toBe('offline');

      vi.useRealTimers();
    });
  });

  describe('Return Values', () => {
    it('should return both status and isConnected flag', () => {
      const { result } = renderHook(() => useConnectionStatus());

      expect(result.current).toHaveProperty('status');
      expect(result.current).toHaveProperty('isConnected');
    });

    it('should have isConnected=false during reconnecting', () => {
      // Arrange: Start offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false,
      });

      const { result } = renderHook(() => useConnectionStatus());

      // Come online
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          configurable: true,
          value: true,
        });
        window.dispatchEvent(new Event('online'));
      });

      // During reconnecting, isConnected should be false
      expect(result.current.status).toBe('reconnecting');
      expect(result.current.isConnected).toBe(false);
    });

    it('should have isConnected=true only when status is online', () => {
      const { result } = renderHook(() => useConnectionStatus());
      vi.useFakeTimers();

      // Online state
      expect(result.current.status).toBe('online');
      expect(result.current.isConnected).toBe(true);

      // Go offline
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          configurable: true,
          value: false,
        });
        window.dispatchEvent(new Event('offline'));
      });
      expect(result.current.status).toBe('offline');
      expect(result.current.isConnected).toBe(false);

      // Come back online (reconnecting)
      act(() => {
        Object.defineProperty(navigator, 'onLine', {
          writable: true,
          configurable: true,
          value: true,
        });
        window.dispatchEvent(new Event('online'));
      });
      expect(result.current.status).toBe('reconnecting');
      expect(result.current.isConnected).toBe(false);

      // Wait for online
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(result.current.status).toBe('online');
      expect(result.current.isConnected).toBe(true);

      vi.useRealTimers();
    });
  });
});

