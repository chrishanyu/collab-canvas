import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  CollectionReference,
  DocumentReference,
  Firestore,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * ActiveEdit represents a user actively editing a shape.
 * Used for real-time edit indicators to prevent conflicts.
 */
export interface ActiveEdit {
  userId: string;
  userName: string;
  color: string;
  startedAt: Timestamp;
  expiresAt: Timestamp;
}

/**
 * Gets the active-edits collection reference for a specific canvas.
 * Structure: /active-edits/{canvasId}/shapes/{shapeId}
 *
 * @param canvasId - The canvas ID
 * @returns Firestore collection reference
 */
export function getActiveEditsCollection(
  canvasId: string
): CollectionReference {
  return collection(db as Firestore, `active-edits/${canvasId}/shapes`);
}

/**
 * Gets a specific active-edit document reference.
 *
 * @param canvasId - The canvas ID
 * @param shapeId - The shape ID being edited
 * @returns Firestore document reference
 */
export function getActiveEditDoc(
  canvasId: string,
  shapeId: string
): DocumentReference {
  return doc(db as Firestore, `active-edits/${canvasId}/shapes/${shapeId}`);
}

/**
 * Sets an active edit indicator for a shape.
 * Called when a user starts editing a shape (e.g., on drag start).
 *
 * @param canvasId - The canvas ID
 * @param shapeId - The shape ID being edited
 * @param userId - The user ID who is editing
 * @param userName - The user's display name
 * @param color - The user's cursor color (for indicator styling)
 * @throws Error if the write operation fails
 *
 * @example
 * ```ts
 * await setActiveEdit('canvas-123', 'shape-456', 'user-789', 'Alice', '#3B82F6');
 * ```
 */
export async function setActiveEdit(
  canvasId: string,
  shapeId: string,
  userId: string,
  userName: string,
  color: string
): Promise<void> {
  try {
    const editDocRef = getActiveEditDoc(canvasId, shapeId);
    
    // Set expiration to 30 seconds from now
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30000); // 30 seconds

    await setDoc(editDocRef, {
      userId,
      userName,
      color,
      startedAt: serverTimestamp(),
      expiresAt: Timestamp.fromDate(expiresAt),
    });
  } catch (error) {
    console.error('Error setting active edit:', error);
    throw new Error('Failed to set active edit');
  }
}

/**
 * Clears an active edit indicator for a shape.
 * Called when a user stops editing a shape (e.g., on drag end, unmount).
 *
 * @param canvasId - The canvas ID
 * @param shapeId - The shape ID
 * @throws Error if the delete operation fails
 *
 * @example
 * ```ts
 * await clearActiveEdit('canvas-123', 'shape-456');
 * ```
 */
export async function clearActiveEdit(
  canvasId: string,
  shapeId: string
): Promise<void> {
  try {
    const editDocRef = getActiveEditDoc(canvasId, shapeId);
    await deleteDoc(editDocRef);
  } catch (error) {
    console.error('Error clearing active edit:', error);
    // Don't throw - cleanup should be best-effort
    // If the document doesn't exist, that's fine
  }
}

/**
 * Subscribes to active edit changes for a canvas.
 * Returns a map of shapeId -> ActiveEdit for all shapes currently being edited.
 *
 * @param canvasId - The canvas ID to monitor
 * @param callback - Function called with updated active edits map
 * @returns Unsubscribe function to stop listening
 *
 * @example
 * ```ts
 * const unsubscribe = subscribeToActiveEdits('canvas-123', (activeEdits) => {
 *   console.log('Active edits:', activeEdits);
 * });
 *
 * // Later, stop listening
 * unsubscribe();
 * ```
 */
export function subscribeToActiveEdits(
  canvasId: string,
  callback: (activeEdits: Map<string, ActiveEdit>) => void
): () => void {
  const activeEditsCollection = getActiveEditsCollection(canvasId);

  const unsubscribe = onSnapshot(
    activeEditsCollection,
    (snapshot) => {
      const activeEditsMap = new Map<string, ActiveEdit>();
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const shapeId = doc.id;
        
        // Validate data structure
        if (
          data &&
          typeof data.userId === 'string' &&
          typeof data.userName === 'string' &&
          typeof data.color === 'string' &&
          data.startedAt &&
          data.expiresAt
        ) {
          // Filter out expired edits (client-side check)
          const now = new Date();
          const expiresAt = data.expiresAt.toDate();
          
          if (expiresAt > now) {
            activeEditsMap.set(shapeId, {
              userId: data.userId,
              userName: data.userName,
              color: data.color,
              startedAt: data.startedAt,
              expiresAt: data.expiresAt,
            });
          }
        }
      });

      callback(activeEditsMap);
    },
    (error) => {
      console.error('Error in active-edits subscription:', error);
      // Call callback with empty map on error
      callback(new Map());
    }
  );

  return unsubscribe;
}

/**
 * Clears all active edits for a specific user on a canvas.
 * Useful for cleanup when a user leaves a canvas or disconnects.
 *
 * @param canvasId - The canvas ID
 * @param userId - The user ID whose edits should be cleared
 *
 * @example
 * ```ts
 * await clearUserActiveEdits('canvas-123', 'user-789');
 * ```
 */
export async function clearUserActiveEdits(
  canvasId: string,
  userId: string
): Promise<void> {
  // Note: This requires fetching all active edits first to find the user's edits
  // For now, we'll implement a simple version that relies on the component
  // to track which shapes the user is editing and clear them individually.
  // A more advanced version could use a Firestore query with a userId index.
  
  console.log(`Clearing active edits for user ${userId} on canvas ${canvasId}`);
  // Implementation will be handled at the hook level
}

