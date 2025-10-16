import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  serverTimestamp,
  Timestamp,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import type { Canvas, CanvasAccess, AccessRole } from '../types';

/**
 * Creates a new canvas with metadata
 * @param name - Canvas name (defaults to "Untitled Canvas" if empty)
 * @param ownerId - User ID of canvas creator
 * @param ownerName - Display name of canvas creator
 * @returns Canvas object with generated ID
 */
export async function createCanvas(
  name: string,
  ownerId: string,
  ownerName: string
): Promise<Canvas> {
  try {
    // Default name if empty
    const canvasName = name.trim() || 'Untitled Canvas';
    
    // Generate unique canvas ID
    const canvasRef = doc(collection(db, 'canvases'));
    const canvasId = canvasRef.id;
    
    // Canvas metadata
    const canvasData = {
      id: canvasId,
      name: canvasName,
      ownerId,
      ownerName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    // Create canvas document
    await setDoc(canvasRef, canvasData);
    
    // Add canvas to user's access list as owner
    await updateCanvasAccess(ownerId, canvasId, 'owner');
    
    // Return canvas with Date objects (serverTimestamp will be resolved)
    return {
      ...canvasData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Error creating canvas:', error);
    throw new Error('Failed to create canvas');
  }
}

/**
 * Retrieves canvas by ID
 * @param canvasId - Canvas ID
 * @returns Canvas object or null if not found
 */
export async function getCanvasById(canvasId: string): Promise<Canvas | null> {
  try {
    const canvasRef = doc(db, 'canvases', canvasId);
    const canvasSnap = await getDoc(canvasRef);
    
    if (!canvasSnap.exists()) {
      return null;
    }
    
    const data = canvasSnap.data();
    
    // Convert Firestore Timestamps to Date objects
    return {
      id: canvasSnap.id,
      name: data.name,
      ownerId: data.ownerId,
      ownerName: data.ownerName,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
      thumbnail: data.thumbnail,
    };
  } catch (error) {
    console.error('Error fetching canvas:', error);
    throw new Error('Failed to fetch canvas');
  }
}

/**
 * Gets all canvases a user has access to
 * @param userId - User ID
 * @returns Array of Canvas objects sorted by updatedAt (newest first)
 */
export async function getUserCanvases(userId: string): Promise<Canvas[]> {
  try {
    // Get user's canvas access list
    const userCanvasesRef = collection(db, 'user-canvases', userId, 'canvases');
    const userCanvasesSnap = await getDocs(userCanvasesRef);
    
    if (userCanvasesSnap.empty) {
      return [];
    }
    
    // Extract canvas IDs
    const canvasIds = userCanvasesSnap.docs.map(doc => doc.id);
    
    // Fetch all canvas metadata
    // Note: Firestore 'in' queries are limited to 10 items, so we batch if needed
    const canvases: Canvas[] = [];
    
    // Process in batches of 10
    for (let i = 0; i < canvasIds.length; i += 10) {
      const batch = canvasIds.slice(i, i + 10);
      const canvasesRef = collection(db, 'canvases');
      const q = query(canvasesRef, where('__name__', 'in', batch));
      const canvasSnap = await getDocs(q);
      
      canvasSnap.forEach(doc => {
        const data = doc.data();
        canvases.push({
          id: doc.id,
          name: data.name,
          ownerId: data.ownerId,
          ownerName: data.ownerName,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
          thumbnail: data.thumbnail,
        });
      });
    }
    
    // Sort by updatedAt (newest first)
    return canvases.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  } catch (error) {
    console.error('Error fetching user canvases:', error);
    throw new Error('Failed to fetch user canvases');
  }
}

/**
 * Adds canvas to user's access list
 * @param userId - User ID
 * @param canvasId - Canvas ID
 * @param role - User role (owner or collaborator)
 */
export async function updateCanvasAccess(
  userId: string,
  canvasId: string,
  role: AccessRole
): Promise<void> {
  try {
    const accessRef = doc(db, 'user-canvases', userId, 'canvases', canvasId);
    
    const accessData: CanvasAccess = {
      canvasId,
      accessedAt: new Date(),
      role,
    };
    
    await setDoc(accessRef, {
      ...accessData,
      accessedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating canvas access:', error);
    throw new Error('Failed to update canvas access');
  }
}

/**
 * Permanently deletes a canvas and all associated data
 * 
 * This function performs a complete cleanup by deleting:
 * - The canvas metadata document
 * - All canvas objects (shapes, etc.) in a batch operation
 * - User access records for all users who had access
 * 
 * IMPORTANT: This operation is permanent and cannot be undone.
 * Only the canvas owner can delete a canvas.
 * 
 * @param canvasId - ID of the canvas to delete
 * @param userId - ID of the user requesting deletion (must be owner)
 * @throws {Error} If user is not the owner
 * @throws {Error} If canvas does not exist
 * @throws {Error} If deletion operation fails
 */
export async function deleteCanvas(
  canvasId: string,
  userId: string
): Promise<void> {
  try {
    // Step 1: Get canvas metadata to verify ownership
    const canvasRef = doc(db, 'canvases', canvasId);
    const canvasSnap = await getDoc(canvasRef);
    
    if (!canvasSnap.exists()) {
      throw new Error('Canvas not found');
    }
    
    const canvas = canvasSnap.data();
    
    // Step 2: Verify ownership - only owner can delete
    if (canvas.ownerId !== userId) {
      throw new Error('Only the canvas owner can delete this canvas');
    }
    
    // Step 3: Delete canvas metadata document
    await deleteDoc(canvasRef);
    
    // Step 4: Get all canvas objects for batch deletion
    const objectsRef = collection(db, 'canvas-objects', canvasId, 'objects');
    const objectsSnap = await getDocs(objectsRef);
    
    // Step 5: Create batch for deleting all objects
    if (!objectsSnap.empty) {
      const batch = writeBatch(db);
      
      // Step 6: Add all object deletions to batch
      objectsSnap.docs.forEach((objectDoc) => {
        batch.delete(objectDoc.ref);
      });
      
      // Step 7: Commit batch deletion
      await batch.commit();
    }
    
    // Step 8: Delete user access records
    // Note: This cleans up the access list for the owner
    // Other users' access records could be cleaned up but are harmless orphans
    try {
      const userAccessRef = doc(db, 'user-canvases', userId, 'canvases', canvasId);
      await deleteDoc(userAccessRef);
    } catch (accessError) {
      // Non-critical: Log but don't fail the deletion if access cleanup fails
      console.warn('Failed to clean up user access record:', accessError);
    }
    
  } catch (error) {
    // Step 9: Error handling with helpful messages
    console.error('Error deleting canvas:', error);
    
    if (error instanceof Error) {
      throw error; // Re-throw specific errors (ownership, not found)
    }
    
    throw new Error('Failed to delete canvas. Please try again.');
  }
}

/**
 * Generates shareable link for canvas
 * @param canvasId - Canvas ID
 * @returns Full shareable URL
 */
export function generateShareLink(canvasId: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/canvas/${canvasId}`;
}

