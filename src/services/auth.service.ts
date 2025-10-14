import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { User } from '../types';

/**
 * Register a new user with email, password, and display name
 */
export const registerUser = async (
  email: string,
  password: string,
  displayName: string
): Promise<User> => {
  try {
    // Create user with email and password
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    
    const firebaseUser = userCredential.user;

    // Update user profile with display name
    await updateProfile(firebaseUser, {
      displayName,
    });

    // Create user document in Firestore
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      email: firebaseUser.email,
      displayName,
      createdAt: serverTimestamp(),
    });

    // Return user object
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName,
      createdAt: new Date(),
    };
  } catch (error: unknown) {
    console.error('Error registering user:', error);
    const message = error instanceof Error ? error.message : 'Failed to register user';
    throw new Error(message);
  }
};

/**
 * Log in an existing user with email and password
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    
    const firebaseUser = userCredential.user;

    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || '',
      createdAt: new Date(),
    };
  } catch (error: unknown) {
    console.error('Error logging in:', error);
    
    // Provide user-friendly error messages
    const errorCode = (error as { code?: string }).code;
    if (errorCode === 'auth/user-not-found') {
      throw new Error('No account found with this email');
    } else if (errorCode === 'auth/wrong-password') {
      throw new Error('Incorrect password');
    } else if (errorCode === 'auth/invalid-email') {
      throw new Error('Invalid email address');
    } else if (errorCode === 'auth/invalid-credential') {
      throw new Error('Invalid email or password');
    }
    
    const message = error instanceof Error ? error.message : 'Failed to log in';
    throw new Error(message);
  }
};

/**
 * Log out the current user
 */
export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: unknown) {
    console.error('Error logging out:', error);
    const message = error instanceof Error ? error.message : 'Failed to log out';
    throw new Error(message);
  }
};

/**
 * Get the currently authenticated user
 * Returns null if no user is logged in
 */
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

/**
 * Subscribe to authentication state changes
 * Returns an unsubscribe function
 */
export const onAuthStateChange = (
  callback: (user: FirebaseUser | null) => void
): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Convert Firebase User to our User type
 */
export const mapFirebaseUserToUser = (firebaseUser: FirebaseUser): User => {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || '',
    createdAt: new Date(),
  };
};

