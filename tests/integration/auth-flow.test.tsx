import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../../src/App';
import { AuthProvider } from '../../src/context/AuthContext';
import * as authService from '../../src/services/auth.service';

// Mock Firebase
vi.mock('../../src/services/firebase', () => ({
  auth: {},
  db: {},
}));

// Helper to render App with all providers
const renderApp = (initialRoute = '/') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  describe('Registration Flow', () => {
    it('should display registration form when navigating to /register', async () => {
      // Mock no authenticated user
      vi.spyOn(authService, 'onAuthStateChange').mockImplementation((callback) => {
        callback(null);
        return vi.fn(); // unsubscribe function
      });

      renderApp();

      // Wait for auth state to load
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Should redirect to /login by default
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();

      // Click "Create one now" link to go to register
      const createAccountLink = screen.getByText('Create one now');
      await userEvent.click(createAccountLink);

      // Should show registration form
      await waitFor(() => {
        expect(screen.getByText('Create Your Account')).toBeInTheDocument();
      });
      expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('should register a new user with valid credentials', async () => {
      const mockUser = {
        uid: 'test-uid-123',
        email: 'newuser@example.com',
        displayName: 'New User',
      };

      // Mock auth state change to simulate no user initially
      vi.spyOn(authService, 'onAuthStateChange').mockImplementation((callback) => {
        callback(null);
        return vi.fn();
      });

      // Mock successful registration
      vi.spyOn(authService, 'registerUser').mockResolvedValue(mockUser);

      renderApp();

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Navigate to register
      const createAccountLink = screen.getByText('Create one now');
      await userEvent.click(createAccountLink);

      await waitFor(() => {
        expect(screen.getByText('Create Your Account')).toBeInTheDocument();
      });

      // Fill in registration form
      const displayNameInput = screen.getByLabelText(/display name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await userEvent.type(displayNameInput, 'New User');
      await userEvent.type(emailInput, 'newuser@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.type(confirmPasswordInput, 'password123');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await userEvent.click(submitButton);

      // Verify registerUser was called with correct arguments
      await waitFor(() => {
        expect(authService.registerUser).toHaveBeenCalledWith(
          'newuser@example.com',
          'password123',
          'New User'
        );
      });
    });

    it('should show validation error for mismatched passwords', async () => {
      vi.spyOn(authService, 'onAuthStateChange').mockImplementation((callback) => {
        callback(null);
        return vi.fn();
      });

      renderApp();

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Navigate to register
      const createAccountLink = screen.getByText('Create one now');
      await userEvent.click(createAccountLink);

      await waitFor(() => {
        expect(screen.getByText('Create Your Account')).toBeInTheDocument();
      });

      // Fill in form with mismatched passwords
      await userEvent.type(screen.getByLabelText(/display name/i), 'Test User');
      await userEvent.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
      await userEvent.type(screen.getByLabelText(/confirm password/i), 'different456');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await userEvent.click(submitButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });

      // Should not call registerUser
      expect(authService.registerUser).not.toHaveBeenCalled();
    });

  });

  describe('Login Flow', () => {
    it('should display login form by default', async () => {
      vi.spyOn(authService, 'onAuthStateChange').mockImplementation((callback) => {
        callback(null);
        return vi.fn();
      });

      renderApp();

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should login user with valid credentials', async () => {
      const mockUser = {
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: 'Test User',
      };

      vi.spyOn(authService, 'onAuthStateChange').mockImplementation((callback) => {
        callback(null);
        return vi.fn();
      });

      // Mock successful login
      vi.spyOn(authService, 'loginUser').mockResolvedValue(mockUser);

      renderApp();

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Fill in login form
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);

      // Verify loginUser was called
      await waitFor(() => {
        expect(authService.loginUser).toHaveBeenCalledWith(
          'test@example.com',
          'password123'
        );
      });
    });

    it('should show error message for invalid credentials', async () => {
      vi.spyOn(authService, 'onAuthStateChange').mockImplementation((callback) => {
        callback(null);
        return vi.fn();
      });

      // Mock failed login
      vi.spyOn(authService, 'loginUser').mockRejectedValue(
        new Error('Invalid credentials')
      );

      renderApp();

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Fill in login form
      await userEvent.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await userEvent.type(screen.getByPlaceholderText(/enter your password/i), 'wrongpassword');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });

    it('should show validation error for missing email', async () => {
      vi.spyOn(authService, 'onAuthStateChange').mockImplementation((callback) => {
        callback(null);
        return vi.fn();
      });

      renderApp();

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Only fill password, leave email empty
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      await userEvent.type(passwordInput, 'password123');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await userEvent.click(submitButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });

      expect(authService.loginUser).not.toHaveBeenCalled();
    });
  });

  describe('Navigation Between Forms', () => {
    it('should navigate from login to register and back', async () => {
      vi.spyOn(authService, 'onAuthStateChange').mockImplementation((callback) => {
        callback(null);
        return vi.fn();
      });

      renderApp('/login');

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Should start at login
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();

      // Navigate to register
      const createAccountLink = screen.getByText('Create one now');
      await userEvent.click(createAccountLink);

      await waitFor(() => {
        expect(screen.getByText('Create Your Account')).toBeInTheDocument();
      });

      // Navigate back to login
      const signInLink = screen.getByText('Sign in instead');
      await userEvent.click(signInLink);

      await waitFor(() => {
        expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      });
    });
  });


  describe('Logout Flow', () => {
    it('should logout user and redirect to login', async () => {
      const mockUser = {
        uid: 'test-uid-123',
        email: 'test@example.com',
        displayName: 'Test User',
      };

      let authCallback: ((user: any) => void) | null = null;

      // Mock authenticated user initially
      vi.spyOn(authService, 'onAuthStateChange').mockImplementation((callback) => {
        authCallback = callback;
        callback({
          uid: mockUser.uid,
          email: mockUser.email,
          displayName: mockUser.displayName,
        } as any);
        return vi.fn();
      });

      // Mock logout
      vi.spyOn(authService, 'logoutUser').mockImplementation(async () => {
        // Simulate auth state change to null after logout
        if (authCallback) {
          authCallback(null);
        }
      });

      renderApp();

      // Wait for dashboard to appear
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });

      // Click logout button
      const logoutButton = screen.getByRole('button', { name: /logout/i });
      await userEvent.click(logoutButton);

      // Should call logoutUser
      expect(authService.logoutUser).toHaveBeenCalled();

      // Should redirect to login
      await waitFor(() => {
        expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      });
    });
  });

});

