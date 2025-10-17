import { toast } from 'react-toastify';

/**
 * Default toast configuration
 */
const defaultOptions = {
  position: 'bottom-right' as const,
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

/**
 * Show a success toast notification
 * @param message - The message to display
 */
export const showSuccessToast = (message: string) => {
  toast.success(message, defaultOptions);
};

/**
 * Show an error toast notification
 * @param message - The message to display
 */
export const showErrorToast = (message: string) => {
  toast.error(message, defaultOptions);
};

/**
 * Show an info toast notification
 * @param message - The message to display
 */
export const showInfoToast = (message: string) => {
  toast.info(message, defaultOptions);
};

/**
 * Show a warning toast notification
 * @param message - The message to display
 */
export const showWarningToast = (message: string) => {
  toast.warning(message, defaultOptions);
};

