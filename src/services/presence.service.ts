import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { UserPresence } from '../types';

/**
 * Presence Service
 * Manages real-time user presence per canvas
 * All functions are scoped by canvasId for canvas isolation
 */

/**
 * Update user's cursor position for a specific canvas
 * @param canvasId - The canvas ID to scope presence to
 * @param userId - User ID
 * @param displayName - User's display name
 * @param x - Cursor X position (canvas coordinates, independent of zoom/pan)
 * @param y - Cursor Y position (canvas coordinates, independent of zoom/pan)
 */
export const updateCursorPosition = async (
  canvasId: string,
  userId: string,
  displayName: string,
  x: number,
  y: number
): Promise<void> => {
  try {
    const presenceRef = doc(db, 'presence', canvasId, 'users', userId);
    
    await setDoc(presenceRef, {
      userId,
      displayName,
      cursorX: x,
      cursorY: y,
      lastSeen: serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    console.error('Error updating cursor position:', error);
    throw error;
  }
};

/**
 * Set user as online for a specific canvas
 * @param canvasId - The canvas ID to scope presence to
 * @param userId - User ID
 * @param displayName - User's display name
 */
export const setUserOnline = async (
  canvasId: string,
  userId: string,
  displayName: string
): Promise<void> => {
  try {
    const presenceRef = doc(db, 'presence', canvasId, 'users', userId);
    
    await setDoc(presenceRef, {
      userId,
      displayName,
      cursorX: 0,
      cursorY: 0,
      lastSeen: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error setting user online:', error);
    throw error;
  }
};

/**
 * Set user as offline for a specific canvas (remove presence)
 * @param canvasId - The canvas ID to scope presence to
 * @param userId - User ID
 */
export const setUserOffline = async (
  canvasId: string,
  userId: string
): Promise<void> => {
  try {
    const presenceRef = doc(db, 'presence', canvasId, 'users', userId);
    await deleteDoc(presenceRef);
  } catch (error) {
    console.error('Error setting user offline:', error);
    throw error;
  }
};

/**
 * Subscribe to presence updates for a specific canvas
 * @param canvasId - The canvas ID to scope presence to
 * @param callback - Callback function with array of online users
 * @returns Unsubscribe function
 */
export const subscribeToPresence = (
  canvasId: string,
  callback: (users: UserPresence[]) => void
): (() => void) => {
  try {
    const presenceCollectionRef = collection(db, 'presence', canvasId, 'users');
    const q = query(presenceCollectionRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users: UserPresence[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          userId: data.userId,
          displayName: data.displayName,
          cursorX: data.cursorX,
          cursorY: data.cursorY,
          lastSeen: data.lastSeen?.toDate() || new Date(),
        });
      });

      callback(users);
    }, (error) => {
      console.error('Error in presence subscription:', error);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to presence:', error);
    // Return no-op unsubscribe function
    return () => {};
  }
};

/**
 * Setup automatic cleanup on disconnect for a specific canvas
 * Note: Firestore doesn't support onDisconnect natively.
 * We'll handle cleanup in the hook using beforeunload and visibility events.
 * This function is a placeholder for future Real-time Database integration if needed.
 * 
 * @param _canvasId - The canvas ID to scope presence to
 * @param _userId - User ID
 */
export const setupDisconnectCleanup = async (
  _canvasId: string,
  _userId: string
): Promise<void> => {
  // Note: Firestore doesn't have onDisconnect like Realtime Database
  // Cleanup will be handled via beforeunload and visibilitychange events in the hook
  // This is a no-op for now, but kept for API consistency
};

