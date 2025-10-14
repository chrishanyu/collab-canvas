import { vi } from 'vitest';

// Mock Firebase User
export const mockFirebaseUser = {
  uid: 'test-user-id-123',
  email: 'test@example.com',
  displayName: 'Test User',
  updateProfile: vi.fn().mockResolvedValue(undefined),
};

// Mock UserCredential
export const mockUserCredential = {
  user: mockFirebaseUser,
};

// Mock Firebase Auth functions
export const mockCreateUserWithEmailAndPassword = vi.fn();
export const mockSignInWithEmailAndPassword = vi.fn();
export const mockSignOut = vi.fn();
export const mockUpdateProfile = vi.fn();
export const mockOnAuthStateChanged = vi.fn();

// Mock Firestore functions
export const mockSetDoc = vi.fn();
export const mockDoc = vi.fn();
export const mockServerTimestamp = vi.fn(() => ({ _seconds: Date.now() / 1000 }));

// Mock auth object
export const mockAuth = {
  currentUser: null as typeof mockFirebaseUser | null,
};

// Mock db object
export const mockDb = {};

// Setup mocks for firebase/auth
vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: (...args: unknown[]) =>
    mockCreateUserWithEmailAndPassword(...args),
  signInWithEmailAndPassword: (...args: unknown[]) =>
    mockSignInWithEmailAndPassword(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
  updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
  onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...args),
  getAuth: vi.fn(() => mockAuth),
}));

// Setup mocks for firebase/firestore
vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  serverTimestamp: () => mockServerTimestamp(),
  getFirestore: vi.fn(() => mockDb),
}));

// Setup mocks for firebase/app
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

// Helper to reset all mocks
export const resetAllMocks = () => {
  mockCreateUserWithEmailAndPassword.mockReset();
  mockSignInWithEmailAndPassword.mockReset();
  mockSignOut.mockReset();
  mockUpdateProfile.mockReset();
  mockOnAuthStateChanged.mockReset();
  mockSetDoc.mockReset();
  mockDoc.mockReset();
  mockAuth.currentUser = null;
};

