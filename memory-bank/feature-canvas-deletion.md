# Feature Implementation: Canvas Deletion

**Priority:** High (User-requested first feature)  
**Estimated Time:** 2-3 days  
**Complexity:** Medium

---

## Feature Overview

Allow users to delete canvases they own from the dashboard. Include soft-delete (move to trash) with ability to restore or permanently delete.

### User Stories
1. As a canvas owner, I want to delete canvases I no longer need
2. As a canvas owner, I want to see deleted canvases in a trash folder
3. As a canvas owner, I want to restore accidentally deleted canvases
4. As a canvas owner, I want to permanently delete canvases from trash

---

## Design Decisions

### Approach: Soft Delete (Recommended)

**Why soft delete?**
- Prevent accidental data loss
- User can recover from mistakes
- Safer UX (undo-friendly)
- Industry standard (Google Drive, Figma, etc.)

**How it works:**
1. User clicks "Delete" → Canvas moved to trash (not deleted from DB)
2. Canvas marked with `deletedAt` timestamp and `deletedBy` user ID
3. Canvas hidden from main dashboard
4. Canvas appears in "Trash" view
5. User can "Restore" (clear `deletedAt`) or "Delete Forever" (actual deletion)
6. Auto-purge trash after 30 days (optional)

### Alternative: Hard Delete (Not Recommended)
- Immediate deletion from database
- No recovery possible
- Requires confirmation dialog
- Risky for user data

**Decision:** Implement soft delete with trash folder.

---

## Data Model Changes

### Update `Canvas` Type

```typescript
// src/types/index.ts
export interface Canvas {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  createdAt: Date;
  updatedAt: Date;
  
  // NEW: Soft delete fields
  deletedAt?: Date;      // Timestamp when deleted (null = not deleted)
  deletedBy?: string;    // User ID who deleted it
  isDeleted?: boolean;   // Computed: !!deletedAt (for easier querying)
}
```

### Firestore Security Rules Update

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ... existing rules
    
    // Canvas collection rules
    match /canvases/{canvasId} {
      // Only owner can delete/restore canvas
      allow delete: if request.auth != null 
                    && resource.data.ownerId == request.auth.uid;
      
      // Only owner can update deletedAt field
      allow update: if request.auth != null 
                    && resource.data.ownerId == request.auth.uid;
      
      // Anyone authenticated can read (for shared canvases)
      allow read: if request.auth != null;
    }
  }
}
```

---

## Implementation Plan

### Step 1: Backend Service Methods (1 day)

**File:** `src/services/canvas.service.ts`

```typescript
/**
 * Soft-deletes a canvas (moves to trash)
 * Only the owner can delete
 */
export async function deleteCanvas(
  canvasId: string, 
  userId: string
): Promise<void> {
  try {
    const canvasRef = doc(db, 'canvases', canvasId);
    const canvasSnap = await getDoc(canvasRef);
    
    if (!canvasSnap.exists()) {
      throw new Error('Canvas not found');
    }
    
    const canvasData = canvasSnap.data();
    
    // Check ownership
    if (canvasData.ownerId !== userId) {
      throw new Error('Only the canvas owner can delete it');
    }
    
    // Soft delete: Update deletedAt timestamp
    await updateDoc(canvasRef, {
      deletedAt: serverTimestamp(),
      deletedBy: userId,
      isDeleted: true,
      updatedAt: serverTimestamp()
    });
    
    console.log(`Canvas ${canvasId} moved to trash`);
  } catch (error) {
    console.error('Error deleting canvas:', error);
    throw error;
  }
}

/**
 * Restores a deleted canvas from trash
 */
export async function restoreCanvas(
  canvasId: string,
  userId: string
): Promise<void> {
  try {
    const canvasRef = doc(db, 'canvases', canvasId);
    const canvasSnap = await getDoc(canvasRef);
    
    if (!canvasSnap.exists()) {
      throw new Error('Canvas not found');
    }
    
    const canvasData = canvasSnap.data();
    
    // Check ownership
    if (canvasData.ownerId !== userId) {
      throw new Error('Only the canvas owner can restore it');
    }
    
    // Restore: Remove deleted fields
    await updateDoc(canvasRef, {
      deletedAt: deleteField(),
      deletedBy: deleteField(),
      isDeleted: false,
      updatedAt: serverTimestamp()
    });
    
    console.log(`Canvas ${canvasId} restored from trash`);
  } catch (error) {
    console.error('Error restoring canvas:', error);
    throw error;
  }
}

/**
 * Permanently deletes a canvas (hard delete)
 * This is irreversible!
 */
export async function permanentlyDeleteCanvas(
  canvasId: string,
  userId: string
): Promise<void> {
  try {
    const canvasRef = doc(db, 'canvases', canvasId);
    const canvasSnap = await getDoc(canvasRef);
    
    if (!canvasSnap.exists()) {
      throw new Error('Canvas not found');
    }
    
    const canvasData = canvasSnap.data();
    
    // Check ownership
    if (canvasData.ownerId !== userId) {
      throw new Error('Only the canvas owner can permanently delete it');
    }
    
    // Delete canvas metadata
    await deleteDoc(canvasRef);
    
    // Delete all canvas objects (nested collection)
    const objectsRef = collection(db, 'canvas-objects', canvasId, 'objects');
    const objectsSnap = await getDocs(objectsRef);
    
    const batch = writeBatch(db);
    objectsSnap.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    
    // Delete user access records
    // Note: This requires querying user-canvases for all users
    // For MVP, we can skip this (orphaned records won't break anything)
    
    console.log(`Canvas ${canvasId} permanently deleted`);
  } catch (error) {
    console.error('Error permanently deleting canvas:', error);
    throw error;
  }
}

/**
 * Gets deleted canvases for a user (trash view)
 */
export async function getDeletedCanvases(userId: string): Promise<Canvas[]> {
  try {
    const userCanvasesRef = collection(db, 'user-canvases', userId, 'canvases');
    const snapshot = await getDocs(userCanvasesRef);
    
    const canvasPromises = snapshot.docs.map(async (docSnap) => {
      const accessData = docSnap.data();
      const canvasId = accessData.canvasId;
      
      const canvasRef = doc(db, 'canvases', canvasId);
      const canvasSnap = await getDoc(canvasRef);
      
      if (!canvasSnap.exists()) return null;
      
      const data = canvasSnap.data();
      
      // Only return deleted canvases
      if (!data.isDeleted) return null;
      
      return {
        id: canvasSnap.id,
        name: data.name,
        ownerId: data.ownerId,
        ownerName: data.ownerName,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        deletedAt: data.deletedAt?.toDate(),
        deletedBy: data.deletedBy,
        isDeleted: data.isDeleted
      } as Canvas;
    });
    
    const canvases = await Promise.all(canvasPromises);
    return canvases.filter((canvas): canvas is Canvas => canvas !== null)
                   .sort((a, b) => b.deletedAt!.getTime() - a.deletedAt!.getTime());
  } catch (error) {
    console.error('Error fetching deleted canvases:', error);
    throw error;
  }
}

/**
 * Update getUserCanvases to exclude deleted canvases
 */
export async function getUserCanvases(userId: string): Promise<Canvas[]> {
  try {
    const userCanvasesRef = collection(db, 'user-canvases', userId, 'canvases');
    const snapshot = await getDocs(userCanvasesRef);
    
    const canvasPromises = snapshot.docs.map(async (docSnap) => {
      const accessData = docSnap.data();
      const canvasId = accessData.canvasId;
      
      const canvasRef = doc(db, 'canvases', canvasId);
      const canvasSnap = await getDoc(canvasRef);
      
      if (!canvasSnap.exists()) return null;
      
      const data = canvasSnap.data();
      
      // UPDATED: Exclude deleted canvases from main dashboard
      if (data.isDeleted) return null;
      
      return {
        id: canvasSnap.id,
        name: data.name,
        ownerId: data.ownerId,
        ownerName: data.ownerName,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Canvas;
    });
    
    const canvases = await Promise.all(canvasPromises);
    return canvases.filter((canvas): canvas is Canvas => canvas !== null)
                   .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  } catch (error) {
    console.error('Error fetching user canvases:', error);
    throw error;
  }
}
```

### Step 2: Update CanvasCard Component (0.5 days)

**File:** `src/components/dashboard/CanvasCard.tsx`

Add delete button and confirmation dialog:

```typescript
import { useState } from 'react';
import { deleteCanvas } from '../../services/canvas.service';
import { useAuth } from '../../hooks/useAuth';

export const CanvasCard: React.FC<CanvasCardProps> = ({ canvas, onDelete }) => {
  const { currentUser } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const isOwner = canvas.ownerId === currentUser?.id;
  
  const handleDelete = async () => {
    if (!currentUser) return;
    
    setDeleting(true);
    try {
      await deleteCanvas(canvas.id, currentUser.id);
      onDelete?.(canvas.id); // Notify parent to refresh list
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Failed to delete canvas:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete canvas');
    } finally {
      setDeleting(false);
    }
  };
  
  return (
    <div className="relative group">
      {/* Existing canvas card content */}
      
      {/* Delete button (only for owners) */}
      {isOwner && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // Don't navigate to canvas
            setShowDeleteDialog(true);
          }}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 
                     transition-opacity bg-red-500 hover:bg-red-600 
                     text-white p-2 rounded"
          title="Delete canvas"
        >
          🗑️
        </button>
      )}
      
      {/* Delete confirmation dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
             onClick={() => setShowDeleteDialog(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md"
               onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Delete Canvas?</h3>
            <p className="mb-6">
              "{canvas.name}" will be moved to trash. You can restore it later.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600
                           disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Move to Trash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

### Step 3: Create Trash View Component (1 day)

**File:** `src/components/dashboard/TrashView.tsx`

```typescript
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  getDeletedCanvases, 
  restoreCanvas, 
  permanentlyDeleteCanvas 
} from '../../services/canvas.service';
import type { Canvas } from '../../types';

export const TrashView: React.FC = () => {
  const { currentUser } = useAuth();
  const [deletedCanvases, setDeletedCanvases] = useState<Canvas[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!currentUser) return;
    
    loadDeletedCanvases();
  }, [currentUser]);
  
  const loadDeletedCanvases = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const canvases = await getDeletedCanvases(currentUser.id);
      setDeletedCanvases(canvases);
    } catch (error) {
      console.error('Failed to load trash:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRestore = async (canvasId: string) => {
    if (!currentUser) return;
    
    try {
      await restoreCanvas(canvasId, currentUser.id);
      await loadDeletedCanvases(); // Refresh list
    } catch (error) {
      console.error('Failed to restore canvas:', error);
      alert('Failed to restore canvas');
    }
  };
  
  const handlePermanentDelete = async (canvasId: string, canvasName: string) => {
    if (!confirm(`Permanently delete "${canvasName}"? This cannot be undone!`)) {
      return;
    }
    
    if (!currentUser) return;
    
    try {
      await permanentlyDeleteCanvas(canvasId, currentUser.id);
      await loadDeletedCanvases(); // Refresh list
    } catch (error) {
      console.error('Failed to permanently delete canvas:', error);
      alert('Failed to delete canvas');
    }
  };
  
  if (loading) {
    return <div>Loading trash...</div>;
  }
  
  if (deletedCanvases.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Trash is empty</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Trash</h2>
      <p className="text-sm text-gray-600">
        Deleted canvases are kept for 30 days
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deletedCanvases.map((canvas) => (
          <div key={canvas.id} className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold mb-2">{canvas.name}</h3>
            <p className="text-sm text-gray-500 mb-4">
              Deleted {canvas.deletedAt?.toLocaleDateString()}
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={() => handleRestore(canvas.id)}
                className="flex-1 px-3 py-2 bg-blue-500 text-white rounded 
                           hover:bg-blue-600"
              >
                Restore
              </button>
              <button
                onClick={() => handlePermanentDelete(canvas.id, canvas.name)}
                className="px-3 py-2 bg-red-500 text-white rounded 
                           hover:bg-red-600"
              >
                Delete Forever
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Step 4: Update Dashboard Navigation (0.5 days)

**File:** `src/components/dashboard/Dashboard.tsx`

Add tabs to switch between "My Canvases" and "Trash":

```typescript
import { useState } from 'react';
import { TrashView } from './TrashView';

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'canvases' | 'trash'>('canvases');
  
  return (
    <div>
      {/* Tab navigation */}
      <div className="border-b mb-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('canvases')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'canvases' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent hover:border-gray-300'
            }`}
          >
            My Canvases
          </button>
          <button
            onClick={() => setActiveTab('trash')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeTab === 'trash' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent hover:border-gray-300'
            }`}
          >
            Trash
          </button>
        </div>
      </div>
      
      {/* Content */}
      {activeTab === 'canvases' ? (
        // Existing canvas grid
        <CanvasGrid />
      ) : (
        <TrashView />
      )}
    </div>
  );
};
```

### Step 5: Add Tests (1 day)

**File:** `tests/unit/canvas.service.test.ts`

```typescript
describe('Canvas deletion', () => {
  it('soft deletes a canvas', async () => {
    const canvasId = 'canvas-123';
    const userId = 'user-owner';
    
    await deleteCanvas(canvasId, userId);
    
    expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        deletedAt: expect.any(Object),
        deletedBy: userId,
        isDeleted: true
      })
    );
  });
  
  it('throws error if non-owner tries to delete', async () => {
    const canvasId = 'canvas-123';
    const nonOwnerId = 'user-not-owner';
    
    await expect(
      deleteCanvas(canvasId, nonOwnerId)
    ).rejects.toThrow('Only the canvas owner can delete');
  });
  
  it('restores a deleted canvas', async () => {
    const canvasId = 'canvas-123';
    const userId = 'user-owner';
    
    await restoreCanvas(canvasId, userId);
    
    expect(mockFirestore.updateDoc).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        isDeleted: false
      })
    );
  });
  
  it('permanently deletes canvas and all objects', async () => {
    const canvasId = 'canvas-123';
    const userId = 'user-owner';
    
    await permanentlyDeleteCanvas(canvasId, userId);
    
    // Canvas metadata deleted
    expect(mockFirestore.deleteDoc).toHaveBeenCalled();
    
    // Objects deleted (batch)
    expect(mockFirestore.writeBatch).toHaveBeenCalled();
  });
});
```

---

## User Experience Flow

### Flow 1: Delete Canvas
```
1. User hovers over canvas card
2. Delete button (🗑️) appears in corner
3. User clicks delete
4. Confirmation dialog: "Move to trash?"
5. User confirms
6. Canvas disappears from dashboard
7. Toast: "Canvas moved to trash. Undo?"
8. Canvas appears in Trash tab
```

### Flow 2: Restore from Trash
```
1. User navigates to "Trash" tab
2. Sees list of deleted canvases
3. Clicks "Restore" on a canvas
4. Canvas moves back to main dashboard
5. Toast: "Canvas restored"
```

### Flow 3: Permanent Delete
```
1. User navigates to "Trash" tab
2. Clicks "Delete Forever" on a canvas
3. Confirmation: "This cannot be undone!"
4. User confirms
5. Canvas and all objects permanently deleted
6. Toast: "Canvas permanently deleted"
```

---

## Edge Cases to Handle

1. **Non-owner tries to delete**
   - Check ownership in service
   - Show error: "Only the owner can delete this canvas"

2. **Canvas already open when deleted**
   - Show error banner: "This canvas has been deleted"
   - Redirect to dashboard

3. **Collaborator viewing canvas when owner deletes**
   - Canvas disappears from their dashboard
   - If currently viewing, show error and redirect

4. **Network failure during delete**
   - Show error toast
   - Canvas remains in dashboard
   - Retry button

5. **Deleted canvas in URL**
   - Check `isDeleted` flag when loading canvas
   - Show error: "Canvas not found or has been deleted"
   - Redirect to dashboard

---

## Testing Checklist

- [ ] Owner can delete their canvas
- [ ] Non-owner cannot delete canvas
- [ ] Deleted canvas appears in trash
- [ ] Deleted canvas hidden from main dashboard
- [ ] Can restore canvas from trash
- [ ] Restored canvas appears in main dashboard
- [ ] Can permanently delete from trash
- [ ] Permanently deleted canvas is gone forever
- [ ] All objects deleted with canvas
- [ ] Error handling for non-owners
- [ ] Error handling for network failures
- [ ] Confirmation dialogs work correctly

---

## Deployment Checklist

- [ ] Update Firestore security rules
- [ ] Test in development
- [ ] Add migration for existing canvases (set isDeleted=false)
- [ ] Deploy to production
- [ ] Monitor for errors
- [ ] User acceptance testing

---

## Future Enhancements (Not in MVP)

- Auto-purge trash after 30 days
- Bulk operations (select multiple, restore all, delete all)
- "Undo" immediately after delete (before leaving page)
- Email notification before auto-purge
- Trash size limit (max X canvases in trash)

---

## Estimated Timeline

| Task | Time |
|------|------|
| Backend service methods | 1 day |
| Update CanvasCard with delete | 0.5 days |
| Create TrashView component | 1 day |
| Update Dashboard navigation | 0.5 days |
| Write tests | 1 day |
| **Total** | **4 days** |

Add 1 day buffer for bugs/polish = **5 days total**

---

## Ready to Start?

Next steps:
1. Confirm this approach works for you
2. Start with Step 1 (backend service methods)
3. Test thoroughly before moving to UI
4. Add tests alongside implementation

Should I start implementing the backend service methods?

