import React from 'react';

interface LoadingButtonProps {
  loading: boolean;
  loadingText?: string;
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading,
  loadingText = 'Loading...',
  children,
  type = 'button',
  disabled = false,
  onClick,
  className = '',
}) => {
  const defaultClasses = `w-full flex justify-center items-center px-4 py-3 border border-transparent rounded-lg text-white font-medium transition-all ${
    loading || disabled
      ? 'bg-gray-400 cursor-not-allowed'
      : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
  }`;

  return (
    <button
      type={type}
      disabled={loading || disabled}
      onClick={onClick}
      className={className || defaultClasses}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
};

