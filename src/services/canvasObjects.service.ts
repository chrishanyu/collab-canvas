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
  orderBy,
  increment
} from 'firebase/firestore';
import { db } from './firebase';
import type { CanvasObject } from '../types';
import { ConflictError } from '../types';

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
            stroke: data.stroke,
            strokeWidth: data.strokeWidth,
            rotation: data.rotation,
            text: data.text,
            textFormat: data.textFormat,
            createdBy: data.createdBy,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
            version: data.version || 1, // Default to 1 for backward compatibility
            lastEditedBy: data.lastEditedBy,
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
        stroke: data.stroke,
        strokeWidth: data.strokeWidth,
        rotation: data.rotation,
        text: data.text,
        textFormat: data.textFormat,
        createdBy: data.createdBy,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(data.updatedAt),
        version: data.version || 1, // Default to 1 for backward compatibility
        lastEditedBy: data.lastEditedBy,
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
 * @param shape - Shape data (without id, createdAt, updatedAt, version, lastEditedBy)
 * @returns Created shape with id and timestamps
 */
export async function createShape(
  canvasId: string,
  shape: Omit<CanvasObject, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'lastEditedBy'>
): Promise<CanvasObject> {
  try {
    // Generate unique shape ID
    const objectsRef = getObjectsCollection(canvasId);
    const shapeRef = doc(objectsRef);
    const shapeId = shapeRef.id;
    
    // Shape data with timestamps and version tracking
    // Filter out undefined values (Firebase doesn't accept undefined)
    const shapeData: Record<string, unknown> = {
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
      version: 1, // Initial version
      lastEditedBy: shape.createdBy, // Set to creator initially
    };
    
    // Only include optional properties if they are defined
    if (shape.stroke !== undefined) shapeData.stroke = shape.stroke;
    if (shape.strokeWidth !== undefined) shapeData.strokeWidth = shape.strokeWidth;
    if (shape.rotation !== undefined) shapeData.rotation = shape.rotation;
    if (shape.text !== undefined) shapeData.text = shape.text;
    if (shape.textFormat !== undefined) shapeData.textFormat = shape.textFormat;
    
    // Create shape document
    await setDoc(shapeRef, shapeData);
    
    // Return shape with Date objects (serverTimestamp will be resolved)
    const createdShape: CanvasObject = {
      id: shapeId,
      type: shape.type,
      x: shape.x,
      y: shape.y,
      width: shape.width,
      height: shape.height,
      fill: shape.fill,
      stroke: shape.stroke,
      strokeWidth: shape.strokeWidth,
      rotation: shape.rotation,
      text: shape.text,
      textFormat: shape.textFormat,
      createdBy: shape.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      lastEditedBy: shape.createdBy,
    };
    
    return createdShape;
  } catch (error) {
    console.error('Error creating shape:', error);
    throw new Error('Failed to create shape');
  }
}

/**
 * Updates an existing shape in a canvas with optimistic locking
 * 
 * This function implements version-based conflict detection. If a localVersion
 * is provided, it will be checked against the server version before updating.
 * If the versions don't match, a ConflictError is thrown, indicating that
 * another user has modified the shape since this user started editing.
 * 
 * @param canvasId - Canvas ID
 * @param shapeId - Shape ID
 * @param updates - Partial shape data to update
 * @param userId - ID of user making the update (for version tracking)
 * @param localVersion - Optional version number for conflict detection
 * @throws {ConflictError} When localVersion doesn't match server version
 * @throws {Error} When shape is not found or update fails
 */
export async function updateShape(
  canvasId: string,
  shapeId: string,
  updates: Partial<Omit<CanvasObject, 'id' | 'createdAt' | 'createdBy' | 'version' | 'lastEditedBy'>>,
  userId?: string,
  localVersion?: number
): Promise<void> {
  try {
    const shapeRef = getObjectDoc(canvasId, shapeId);
    
    // Fetch current shape for existence check and version validation
    const shapeSnap = await getDoc(shapeRef);
    if (!shapeSnap.exists()) {
      throw new Error(`Shape ${shapeId} not found in canvas ${canvasId}`);
    }
    
    const shapeData = shapeSnap.data();
    
    // Version-based conflict detection (optimistic locking)
    if (localVersion !== undefined) {
      const serverVersion = shapeData.version || 1; // Default to 1 for backward compatibility
      
      if (localVersion !== serverVersion) {
        // Conflict detected! Another user modified this shape
        const lastEditedBy = shapeData.lastEditedBy || 'unknown';
        const lastEditedByName = shapeData.lastEditedByName; // Optional field
        
        throw new ConflictError(
          shapeId,
          localVersion,
          serverVersion,
          lastEditedBy,
          lastEditedByName
        );
      }
    }
    
    // No conflict - proceed with update
    const updateData: Record<string, unknown> = {
      ...updates,
      updatedAt: serverTimestamp(),
      version: increment(1), // Increment version for conflict detection
    };
    
    // Add lastEditedBy if userId is provided
    if (userId) {
      updateData.lastEditedBy = userId;
    }
    
    await updateDoc(shapeRef, updateData);
  } catch (error) {
    console.error('Error updating shape:', error);
    
    // Rethrow ConflictError as-is (don't wrap it)
    if (error instanceof ConflictError) {
      throw error;
    }
    
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

