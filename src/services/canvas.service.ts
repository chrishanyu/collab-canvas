import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  serverTimestamp,
  Timestamp 
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
 * Generates shareable link for canvas
 * @param canvasId - Canvas ID
 * @returns Full shareable URL
 */
export function generateShareLink(canvasId: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/canvas/${canvasId}`;
}

