import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';
import type { CanvasObject } from '../types';

/**
 * Canvas Objects Service
 * Handles CRUD operations for canvas objects (shapes) with real-time sync
 * All operations are scoped by canvasId for isolation
 */

/**
 * Gets the Firestore reference for a canvas's objects collection
 * @param canvasId - Canvas ID
 * @returns Collection reference
 */
function getObjectsCollection(canvasId: string) {
  return collection(db, 'canvas-objects', canvasId, 'objects');
}

/**
 * Gets the Firestore reference for a specific object
 * @param canvasId - Canvas ID
 * @param objectId - Object ID
 * @returns Document reference
 */
function getObjectDoc(canvasId: string, objectId: string) {
  return doc(db, 'canvas-objects', canvasId, 'objects', objectId);
}

/**
 * Subscribes to real-time updates for all objects in a canvas
 * @param canvasId - Canvas ID to subscribe to
 * @param callback - Function called with updated objects array
 * @returns Unsubscribe function
 */
export function subscribeToCanvasObjects(
  canvasId: string,
  callback: (objects: CanvasObject[]) => void
): () => void {
  try {
    const objectsRef = getObjectsCollection(canvasId);
    const q = query(objectsRef, orderBy('createdAt', 'asc'));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const objects: CanvasObject[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          objects.push({
            id: doc.id,
            type: data.type,
            x: data.x,
            y: data.y,
            width: data.width,
            height: data.height,
            fill: data.fill,
            createdBy: data.createdBy,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
          });
        });
        
        callback(objects);
      },
      (error) => {
        console.error('Error in canvas objects subscription:', error);
        // Still call callback with empty array on error
        callback([]);
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to canvas objects:', error);
    // Return no-op unsubscribe function
    return () => {};
  }
}

/**
 * Gets all objects for a canvas (one-time fetch)
 * @param canvasId - Canvas ID
 * @returns Array of canvas objects
 */
export async function getCanvasObjects(canvasId: string): Promise<CanvasObject[]> {
  try {
    const objectsRef = getObjectsCollection(canvasId);
    const q = query(objectsRef, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    
    const objects: CanvasObject[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      objects.push({
        id: doc.id,
        type: data.type,
        x: data.x,
        y: data.y,
        width: data.width,
        height: data.height,
        fill: data.fill,
        createdBy: data.createdBy,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
      });
    });
    
    return objects;
  } catch (error) {
    console.error('Error fetching canvas objects:', error);
    throw new Error('Failed to fetch canvas objects');
  }
}

/**
 * Creates a new shape in a canvas
 * @param canvasId - Canvas ID
 * @param shape - Shape data (without id, createdAt, updatedAt)
 * @returns Created shape with id and timestamps
 */
export async function createShape(
  canvasId: string,
  shape: Omit<CanvasObject, 'id' | 'createdAt' | 'updatedAt'>
): Promise<CanvasObject> {
  try {
    // Generate unique shape ID
    const objectsRef = getObjectsCollection(canvasId);
    const shapeRef = doc(objectsRef);
    const shapeId = shapeRef.id;
    
    // Shape data with timestamps
    const shapeData = {
      id: shapeId,
      type: shape.type,
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height,
      fill: shape.fill,
      createdBy: shape.createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    // Create shape document
    await setDoc(shapeRef, shapeData);
    
    // Return shape with Date objects (serverTimestamp will be resolved)
    return {
      ...shapeData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Error creating shape:', error);
    throw new Error('Failed to create shape');
  }
}

/**
 * Updates an existing shape in a canvas
 * @param canvasId - Canvas ID
 * @param shapeId - Shape ID
 * @param updates - Partial shape data to update
 */
export async function updateShape(
  canvasId: string,
  shapeId: string,
  updates: Partial<Omit<CanvasObject, 'id' | 'createdAt' | 'createdBy'>>
): Promise<void> {
  try {
    const shapeRef = getObjectDoc(canvasId, shapeId);
    
    // Check if shape exists
    const shapeSnap = await getDoc(shapeRef);
    if (!shapeSnap.exists()) {
      throw new Error(`Shape ${shapeId} not found in canvas ${canvasId}`);
    }
    
    // Update with server timestamp
    await updateDoc(shapeRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating shape:', error);
    // Rethrow specific errors (like "not found")
    if (error instanceof Error && error.message.includes('not found')) {
      throw error;
    }
    throw new Error('Failed to update shape');
  }
}

/**
 * Deletes a shape from a canvas
 * @param canvasId - Canvas ID
 * @param shapeId - Shape ID
 */
export async function deleteShape(
  canvasId: string,
  shapeId: string
): Promise<void> {
  try {
    const shapeRef = getObjectDoc(canvasId, shapeId);
    await deleteDoc(shapeRef);
  } catch (error) {
    console.error('Error deleting shape:', error);
    throw new Error('Failed to delete shape');
  }
}

