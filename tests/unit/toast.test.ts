import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { toast } from 'react-toastify';
import { showSuccessToast, showErrorToast, showInfoToast, showWarningToast } from '../../src/utils/toast';

// Mock react-toastify
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  },
}));

describe('Toast Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('showSuccessToast', () => {
    it('should call toast.success with correct message', () => {
      const message = 'Operation completed successfully';
      
      showSuccessToast(message);

      expect(toast.success).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledWith(
        message,
        expect.objectContaining({
          position: 'bottom-right',
          autoClose: 5000,
        })
      );
    });

    it('should apply default options for success toast', () => {
      showSuccessToast('Success message');

      expect(toast.success).toHaveBeenCalledWith(
        'Success message',
        expect.objectContaining({
          position: 'bottom-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        })
      );
    });

    it('should handle empty message', () => {
      showSuccessToast('');

      expect(toast.success).toHaveBeenCalledWith('', expect.any(Object));
    });

    it('should handle long messages', () => {
      const longMessage = 'This is a very long success message that contains a lot of information about what just happened in the application and should still be displayed correctly in the toast notification.';
      
      showSuccessToast(longMessage);

      expect(toast.success).toHaveBeenCalledWith(longMessage, expect.any(Object));
    });

    it('should handle special characters in message', () => {
      const specialMessage = 'Success! <script>alert("xss")</script> & "quotes" \'single\'';
      
      showSuccessToast(specialMessage);

      expect(toast.success).toHaveBeenCalledWith(specialMessage, expect.any(Object));
    });
  });

  describe('showErrorToast', () => {
    it('should call toast.error with correct message', () => {
      const message = 'An error occurred';
      
      showErrorToast(message);

      expect(toast.error).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledWith(
        message,
        expect.objectContaining({
          position: 'bottom-right',
          autoClose: 5000,
        })
      );
    });

    it('should apply default options for error toast', () => {
      showErrorToast('Error message');

      expect(toast.error).toHaveBeenCalledWith(
        'Error message',
        expect.objectContaining({
          position: 'bottom-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        })
      );
    });

    it('should handle error messages with technical details', () => {
      const technicalError = 'Failed to save: NetworkError: Connection timeout after 30000ms';
      
      showErrorToast(technicalError);

      expect(toast.error).toHaveBeenCalledWith(technicalError, expect.any(Object));
    });

    it('should handle empty error message', () => {
      showErrorToast('');

      expect(toast.error).toHaveBeenCalledWith('', expect.any(Object));
    });
  });

  describe('showInfoToast', () => {
    it('should call toast.info with correct message', () => {
      const message = 'Information message';
      
      showInfoToast(message);

      expect(toast.info).toHaveBeenCalledTimes(1);
      expect(toast.info).toHaveBeenCalledWith(
        message,
        expect.objectContaining({
          position: 'bottom-right',
          autoClose: 5000,
        })
      );
    });

    it('should apply default options for info toast', () => {
      showInfoToast('Info message');

      expect(toast.info).toHaveBeenCalledWith(
        'Info message',
        expect.objectContaining({
          position: 'bottom-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        })
      );
    });
  });

  describe('showWarningToast', () => {
    it('should call toast.warning with correct message', () => {
      const message = 'Warning message';
      
      showWarningToast(message);

      expect(toast.warning).toHaveBeenCalledTimes(1);
      expect(toast.warning).toHaveBeenCalledWith(
        message,
        expect.objectContaining({
          position: 'bottom-right',
          autoClose: 5000,
        })
      );
    });

    it('should apply default options for warning toast', () => {
      showWarningToast('Warning message');

      expect(toast.warning).toHaveBeenCalledWith(
        'Warning message',
        expect.objectContaining({
          position: 'bottom-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        })
      );
    });
  });

  describe('Toast Configuration', () => {
    it('should use bottom-right position for all toast types', () => {
      showSuccessToast('Success');
      showErrorToast('Error');
      showInfoToast('Info');
      showWarningToast('Warning');

      expect(toast.success).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ position: 'bottom-right' })
      );
      expect(toast.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ position: 'bottom-right' })
      );
      expect(toast.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ position: 'bottom-right' })
      );
      expect(toast.warning).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ position: 'bottom-right' })
      );
    });

    it('should auto-close after 5 seconds for all toast types', () => {
      showSuccessToast('Success');
      showErrorToast('Error');
      showInfoToast('Info');
      showWarningToast('Warning');

      expect(toast.success).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ autoClose: 5000 })
      );
      expect(toast.error).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ autoClose: 5000 })
      );
      expect(toast.info).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ autoClose: 5000 })
      );
      expect(toast.warning).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ autoClose: 5000 })
      );
    });

    it('should enable closeOnClick for all toast types', () => {
      showSuccessToast('Success');
      showErrorToast('Error');
      showInfoToast('Info');
      showWarningToast('Warning');

      [toast.success, toast.error, toast.info, toast.warning].forEach((toastFn) => {
        expect(toastFn).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ closeOnClick: true })
        );
      });
    });

    it('should enable pauseOnHover for all toast types', () => {
      showSuccessToast('Success');
      showErrorToast('Error');
      showInfoToast('Info');
      showWarningToast('Warning');

      [toast.success, toast.error, toast.info, toast.warning].forEach((toastFn) => {
        expect(toastFn).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ pauseOnHover: true })
        );
      });
    });

    it('should enable draggable for all toast types', () => {
      showSuccessToast('Success');
      showErrorToast('Error');
      showInfoToast('Info');
      showWarningToast('Warning');

      [toast.success, toast.error, toast.info, toast.warning].forEach((toastFn) => {
        expect(toastFn).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ draggable: true })
        );
      });
    });

    it('should show progress bar (hideProgressBar: false) for all toast types', () => {
      showSuccessToast('Success');
      showErrorToast('Error');
      showInfoToast('Info');
      showWarningToast('Warning');

      [toast.success, toast.error, toast.info, toast.warning].forEach((toastFn) => {
        expect(toastFn).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ hideProgressBar: false })
        );
      });
    });
  });

  describe('Multiple Toast Calls', () => {
    it('should handle multiple success toasts', () => {
      showSuccessToast('First success');
      showSuccessToast('Second success');
      showSuccessToast('Third success');

      expect(toast.success).toHaveBeenCalledTimes(3);
    });

    it('should handle mixed toast types', () => {
      showSuccessToast('Success');
      showErrorToast('Error');
      showInfoToast('Info');
      showWarningToast('Warning');

      expect(toast.success).toHaveBeenCalledTimes(1);
      expect(toast.error).toHaveBeenCalledTimes(1);
      expect(toast.info).toHaveBeenCalledTimes(1);
      expect(toast.warning).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid consecutive toast calls', () => {
      for (let i = 0; i < 10; i++) {
        showErrorToast(`Error ${i}`);
      }

      expect(toast.error).toHaveBeenCalledTimes(10);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null-like messages gracefully', () => {
      // TypeScript would prevent this, but test runtime behavior
      showSuccessToast(undefined as any);
      showErrorToast(null as any);

      expect(toast.success).toHaveBeenCalledWith(undefined, expect.any(Object));
      expect(toast.error).toHaveBeenCalledWith(null, expect.any(Object));
    });

    it('should handle numeric messages', () => {
      showSuccessToast(123 as any);
      showErrorToast(0 as any);

      expect(toast.success).toHaveBeenCalledWith(123, expect.any(Object));
      expect(toast.error).toHaveBeenCalledWith(0, expect.any(Object));
    });

    it('should handle messages with newlines', () => {
      const multilineMessage = 'Line 1\nLine 2\nLine 3';
      
      showInfoToast(multilineMessage);

      expect(toast.info).toHaveBeenCalledWith(multilineMessage, expect.any(Object));
    });

    it('should handle messages with HTML-like content', () => {
      const htmlMessage = '<div>Bold <strong>text</strong></div>';
      
      showWarningToast(htmlMessage);

      expect(toast.warning).toHaveBeenCalledWith(htmlMessage, expect.any(Object));
    });

    it('should handle very long messages', () => {
      const veryLongMessage = 'A'.repeat(1000);
      
      showErrorToast(veryLongMessage);

      expect(toast.error).toHaveBeenCalledWith(veryLongMessage, expect.any(Object));
    });

    it('should handle unicode characters', () => {
      const unicodeMessage = '🎉 Success! 成功 ✓ ✅';
      
      showSuccessToast(unicodeMessage);

      expect(toast.success).toHaveBeenCalledWith(unicodeMessage, expect.any(Object));
    });
  });

  describe('Function Arguments', () => {
    it('should pass exactly 2 arguments to toast functions', () => {
      showSuccessToast('Message');

      expect(toast.success).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object)
      );
      
      // Verify no extra arguments
      const callArgs = (toast.success as any).mock.calls[0];
      expect(callArgs).toHaveLength(2);
    });

    it('should not mutate the default options between calls', () => {
      showSuccessToast('First');
      const firstCallOptions = (toast.success as any).mock.calls[0][1];

      showSuccessToast('Second');
      const secondCallOptions = (toast.success as any).mock.calls[1][1];

      // Options should be equal but not the same object reference
      expect(firstCallOptions).toEqual(secondCallOptions);
      
      // Verify they have the same properties
      expect(firstCallOptions.position).toBe(secondCallOptions.position);
      expect(firstCallOptions.autoClose).toBe(secondCallOptions.autoClose);
    });
  });
});

