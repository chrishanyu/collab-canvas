import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { User as FirebaseUser } from 'firebase/auth';
import {
  mockCreateUserWithEmailAndPassword,
  mockSignInWithEmailAndPassword,
  mockSignOut,
  mockUpdateProfile,
  mockOnAuthStateChanged,
  mockSetDoc,
  mockDoc,
  mockAuth,
  mockUserCredential,
  mockFirebaseUser,
  resetAllMocks,
} from '../mocks/firebase.mock';

// Import after mocks are set up
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  onAuthStateChange,
  mapFirebaseUserToUser,
} from '../../src/services/auth.service';

describe('Auth Service', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should create user with email/password and display name', async () => {
      // Arrange
      const email = 'newuser@example.com';
      const password = 'password123';
      const displayName = 'New User';

      mockCreateUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);
      mockUpdateProfile.mockResolvedValue(undefined);
      mockSetDoc.mockResolvedValue(undefined);
      mockDoc.mockReturnValue({ id: 'test-doc-id' });

      // Act
      const result = await registerUser(email, password, displayName);

      // Assert
      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        email,
        password
      );
      expect(mockUpdateProfile).toHaveBeenCalledWith(mockFirebaseUser, {
        displayName,
      });
      expect(mockSetDoc).toHaveBeenCalled();
      expect(result).toEqual({
        id: mockFirebaseUser.uid,
        email: mockFirebaseUser.email,
        displayName,
        createdAt: expect.any(Date),
      });
    });

    it('should throw error if registration fails', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      const displayName = 'Test User';
      const errorMessage = 'Email already in use';

      mockCreateUserWithEmailAndPassword.mockRejectedValue(
        new Error(errorMessage)
      );

      // Act & Assert
      await expect(
        registerUser(email, password, displayName)
      ).rejects.toThrow(errorMessage);
    });

    it('should create user document in Firestore', async () => {
      // Arrange
      const email = 'user@example.com';
      const password = 'password123';
      const displayName = 'User Name';

      mockCreateUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);
      mockUpdateProfile.mockResolvedValue(undefined);
      mockSetDoc.mockResolvedValue(undefined);
      mockDoc.mockReturnValue({ id: 'users/test-user-id-123' });

      // Act
      await registerUser(email, password, displayName);

      // Assert
      expect(mockDoc).toHaveBeenCalled();
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          email: mockFirebaseUser.email,
          displayName,
        })
      );
    });
  });

  describe('loginUser', () => {
    it('should authenticate user with valid credentials', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';

      mockSignInWithEmailAndPassword.mockResolvedValue(mockUserCredential);

      // Act
      const result = await loginUser(email, password);

      // Assert
      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        email,
        password
      );
      expect(result).toEqual({
        id: mockFirebaseUser.uid,
        email: mockFirebaseUser.email,
        displayName: mockFirebaseUser.displayName,
        createdAt: expect.any(Date),
      });
    });

    it('should reject invalid credentials', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'wrongpassword';

      mockSignInWithEmailAndPassword.mockRejectedValue({
        code: 'auth/invalid-credential',
        message: 'Invalid credentials',
      });

      // Act & Assert
      await expect(loginUser(email, password)).rejects.toThrow(
        'Invalid email or password'
      );
    });

    it('should provide user-friendly error for user not found', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      const password = 'password123';

      mockSignInWithEmailAndPassword.mockRejectedValue({
        code: 'auth/user-not-found',
        message: 'User not found',
      });

      // Act & Assert
      await expect(loginUser(email, password)).rejects.toThrow(
        'No account found with this email'
      );
    });

    it('should provide user-friendly error for wrong password', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'wrongpassword';

      mockSignInWithEmailAndPassword.mockRejectedValue({
        code: 'auth/wrong-password',
        message: 'Wrong password',
      });

      // Act & Assert
      await expect(loginUser(email, password)).rejects.toThrow(
        'Incorrect password'
      );
    });

    it('should provide user-friendly error for invalid email', async () => {
      // Arrange
      const email = 'invalid-email';
      const password = 'password123';

      mockSignInWithEmailAndPassword.mockRejectedValue({
        code: 'auth/invalid-email',
        message: 'Invalid email',
      });

      // Act & Assert
      await expect(loginUser(email, password)).rejects.toThrow(
        'Invalid email address'
      );
    });
  });

  describe('logoutUser', () => {
    it('should sign out the current user', async () => {
      // Arrange
      mockSignOut.mockResolvedValue(undefined);

      // Act
      await logoutUser();

      // Assert
      expect(mockSignOut).toHaveBeenCalledWith(expect.anything());
    });

    it('should throw error if logout fails', async () => {
      // Arrange
      const errorMessage = 'Logout failed';
      mockSignOut.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(logoutUser()).rejects.toThrow(errorMessage);
    });
  });

  describe('getCurrentUser', () => {
    it('should return authenticated user', () => {
      // Arrange
      mockAuth.currentUser = mockFirebaseUser;

      // Act
      const result = getCurrentUser();

      // Assert
      expect(result).toBe(mockFirebaseUser);
    });

    it('should return null when no user is authenticated', () => {
      // Arrange
      mockAuth.currentUser = null;

      // Act
      const result = getCurrentUser();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('onAuthStateChange', () => {
    it('should subscribe to auth state changes', () => {
      // Arrange
      const callback = vi.fn();
      const unsubscribe = vi.fn();

      // Mock the Firebase onAuthStateChanged function to return unsubscribe
      mockOnAuthStateChanged.mockReturnValue(unsubscribe);

      // Act
      const result = onAuthStateChange(callback);

      // Assert
      expect(mockOnAuthStateChanged).toHaveBeenCalledWith(
        expect.anything(),
        callback
      );
      expect(result).toBe(unsubscribe);
    });
  });

  describe('mapFirebaseUserToUser', () => {
    it('should convert Firebase user to app User type', () => {
      // Act
      const result = mapFirebaseUserToUser(mockFirebaseUser as unknown as FirebaseUser);

      // Assert
      expect(result).toEqual({
        id: mockFirebaseUser.uid,
        email: mockFirebaseUser.email,
        displayName: mockFirebaseUser.displayName,
        createdAt: expect.any(Date),
      });
    });

    it('should handle missing email and displayName', () => {
      // Arrange
      const userWithoutInfo = {
        ...mockFirebaseUser,
        email: null,
        displayName: null,
      };

      // Act
      const result = mapFirebaseUserToUser(userWithoutInfo as unknown as FirebaseUser);

      // Assert
      expect(result).toEqual({
        id: mockFirebaseUser.uid,
        email: '',
        displayName: '',
        createdAt: expect.any(Date),
      });
    });
  });
});

