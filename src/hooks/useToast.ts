import { showSuccessToast, showErrorToast, showInfoToast, showWarningToast } from '../utils/toast';

/**
 * Custom hook for toast notifications
 * Provides convenient methods for showing different types of toasts
 */
export const useToast = () => {
  return {
    showSuccess: showSuccessToast,
    showError: showErrorToast,
    showInfo: showInfoToast,
    showWarning: showWarningToast,
  };
};

