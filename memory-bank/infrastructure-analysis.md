# Infrastructure Analysis & Improvement Plan

**Date:** October 15, 2025  
**Focus Areas:** Real-time sync, conflict resolution, state management, persistence, reconnection

---

## Current State Assessment

### ✅ What's Working Well

#### 1. Real-Time Synchronization
**Current Implementation:**
- Firebase Firestore `onSnapshot()` for real-time updates
- Optimized subscription pattern (only re-subscribes when `canvasId` changes)
- Uses ref pattern to keep callbacks stable
- Ordered by `createdAt` for consistent rendering

**Performance:**
- Sub-100ms latency ✅ (target met)
- Efficient: Only subscribes to current canvas
- Stable: No unnecessary re-subscriptions

**Code Location:**
- `src/hooks/useRealtimeSync.ts` - Subscription hook
- `src/services/canvasObjects.service.ts` - Firebase operations

#### 2. Optimistic Updates
**Current Implementation:**
- Local state updates immediately (instant UI feedback)
- Firebase write happens in background
- Firestore listener confirms changes

**Example (Shape Creation):**
```typescript
// 1. Optimistic: Update local state immediately
setShapes([...shapes, optimisticShape]);

// 2. Write to Firebase (async)
await createShapeInFirebase(canvasId, shapeData);

// 3. Firestore listener receives confirmation
// handleShapesUpdate() called with server data
```

**Performance:**
- Zero perceived latency ✅
- Smooth user experience
- Rollback on error (partially implemented)

#### 3. Canvas Isolation
**Current Implementation:**
- Nested Firestore collections: `/canvas-objects/{canvasId}/objects/{objectId}`
- All operations scoped by `canvasId`
- Clean separation between canvases

**Benefits:**
- No cross-contamination ✅
- Scales independently per canvas
- Clear data boundaries

---

## Areas for Improvement

### 🔧 1. Conflict Resolution (Currently: Last-Write-Wins)

#### Current Approach: Last-Write-Wins (LWW)
**How it works:**
- Each write includes `serverTimestamp()`
- Firebase orders operations by server time
- Last write overwrites previous value

**Problems:**
```
Time: 0ms          50ms         100ms        150ms
User A: Drags shape to (100, 100) → Firebase write
User B:            Drags same shape to (200, 200) → Firebase write
Result:            User A's change LOST (overwritten by User B)
```

**When LWW Fails:**
- Two users drag same shape simultaneously
- Two users edit same object properties
- One user's work gets silently overwritten
- No indication of conflict

#### Proposed Improvement: Operational Transformation (OT) Lite

**Concept:**
Instead of overwriting entire state, track *operations* (deltas):
- "User A moved shape X by (+20, +30)"
- "User B moved shape X by (+50, -10)"
- Result: Apply both transforms → final position is (+70, +20) from original

**Benefits:**
- Both users' changes preserved
- No silent data loss
- Feels more natural for collaboration

**Complexity:**
- Medium-High (requires operation log)
- Need to handle operation ordering
- Need to resolve conflicting operations

#### Alternative: Conflict Detection + User Resolution

**Simpler Approach:**
1. Track version numbers or update timestamps
2. Detect when two users edit same object simultaneously
3. Show visual indicator (conflict warning)
4. Let users resolve manually (keep mine / keep theirs / merge)

**Benefits:**
- Simpler to implement than OT
- User stays in control
- Clear visibility of conflicts

**Implementation:**
```typescript
interface CanvasObject {
  // ... existing fields
  version: number;  // Increment on each update
  lastEditedBy?: string;  // Track who last edited
}

// On drag end
async function handleShapeDragEnd(id: string, x: number, y: number) {
  const currentShape = shapes.find(s => s.id === id);
  
  // Optimistic update
  setShapes(shapes.map(s => 
    s.id === id ? { ...s, x, y, version: s.version + 1 } : s
  ));
  
  try {
    // Conditional update (only if version matches)
    await updateShapeWithVersionCheck(canvasId, id, { 
      x, 
      y, 
      expectedVersion: currentShape.version 
    });
  } catch (ConflictError) {
    // Someone else edited this shape!
    showConflictDialog(id, 'position');
    // Revert to server state
    await refreshShape(id);
  }
}
```

**Recommendation:** Start with conflict *detection* (version numbers), add resolution UI later.

---

### 🔧 2. State Management (Currently: Component State)

#### Current Approach: Local Component State
**How it works:**
- `useState` for shapes, selection, creation mode
- Firestore listener updates state via callback
- Works well for single canvas view

**Limitations:**
```typescript
// Canvas.tsx
const [shapes, setShapes] = useState<CanvasObject[]>([]);
const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);

// Problem: State is tied to Canvas component lifecycle
// - Lost on unmount/remount
// - Can't share with other components
// - Undo/redo would need separate state management
```

#### Proposed Improvement: Centralized State Management

**Option A: Zustand (Recommended)**
Simple, performant state management outside React:

```typescript
// store/canvasStore.ts
import create from 'zustand';

interface CanvasStore {
  // Current canvas state
  shapes: Record<string, CanvasObject[]>;  // canvasId → shapes
  selectedShapeIds: Record<string, string | null>;
  
  // History for undo/redo
  history: {
    past: CanvasObject[][];
    present: CanvasObject[];
    future: CanvasObject[][];
  };
  
  // Actions
  setShapes: (canvasId: string, shapes: CanvasObject[]) => void;
  selectShape: (canvasId: string, shapeId: string | null) => void;
  undo: (canvasId: string) => void;
  redo: (canvasId: string) => void;
}

export const useCanvasStore = create<CanvasStore>((set) => ({
  shapes: {},
  selectedShapeIds: {},
  history: { past: [], present: [], future: [] },
  
  setShapes: (canvasId, shapes) => 
    set((state) => ({
      shapes: { ...state.shapes, [canvasId]: shapes }
    })),
  
  selectShape: (canvasId, shapeId) =>
    set((state) => ({
      selectedShapeIds: { ...state.selectedShapeIds, [canvasId]: shapeId }
    })),
    
  undo: (canvasId) => {
    // Implement undo logic
  },
  
  redo: (canvasId) => {
    // Implement redo logic
  }
}));
```

**Benefits:**
- State persists across component remounts
- Easy to add undo/redo
- Can be accessed from anywhere
- Great DevTools support
- Minimal performance overhead

**Option B: Redux Toolkit**
More structured, better for complex state:
- Full Redux with less boilerplate
- Time-travel debugging
- Redux DevTools
- Steeper learning curve

**Recommendation:** Use **Zustand** for simplicity and performance. Can migrate to Redux later if needed.

---

### 🔧 3. Persistence & Reconnection

#### Current State: Firebase Handles Most Cases

**What Works:**
- Firebase SDK automatically persists pending writes
- Auto-reconnects after network drop
- Local cache continues serving data offline
- Pending writes queued and sent on reconnect

**What's Missing:**

#### 3.1. Reconnection State Visibility
User doesn't know if they're offline or reconnecting:

```typescript
// Add connection status tracking
import { onDisconnect, ref, set } from 'firebase/database';

// Track connection state
useEffect(() => {
  const connectedRef = ref(realtimeDb, '.info/connected');
  
  onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
      console.log('Connected to Firebase');
      setConnectionStatus('connected');
    } else {
      console.log('Disconnected from Firebase');
      setConnectionStatus('disconnected');
    }
  });
}, []);

// Show UI indicator
{connectionStatus === 'disconnected' && (
  <div className="fixed top-4 right-4 bg-yellow-500 px-4 py-2 rounded">
    ⚠️ Reconnecting...
  </div>
)}
```

#### 3.2. State Recovery After Refresh
**Problem:**
```
1. User edits canvas
2. User refreshes browser (Cmd+R)
3. Canvas loads, but:
   - Scroll position lost
   - Zoom level reset to 1x
   - Selected shape cleared
   - Creation mode cleared
```

**Solution:** Persist viewport state to localStorage

```typescript
// hooks/usePersistedViewport.ts
export function usePersistedViewport(canvasId: string) {
  const STORAGE_KEY = `canvas-viewport-${canvasId}`;
  
  // Load from localStorage
  const [stageScale, setStageScale] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).scale : DEFAULT_ZOOM;
  });
  
  const [stageX, setStageX] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).x : DEFAULT_CANVAS_X;
  });
  
  const [stageY, setStageY] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).y : DEFAULT_CANVAS_Y;
  });
  
  // Save to localStorage (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        scale: stageScale,
        x: stageX,
        y: stageY
      }));
    }, 500); // Debounce 500ms
    
    return () => clearTimeout(timer);
  }, [stageScale, stageX, stageY, STORAGE_KEY]);
  
  return { stageScale, setStageScale, stageX, setStageX, stageY, setStageY };
}
```

#### 3.3. Pending Changes Indicator
Show user which changes are pending (not yet confirmed by server):

```typescript
interface CanvasObject {
  // ... existing fields
  _pending?: boolean;  // Optimistic update not yet confirmed
  _error?: string;     // Failed to sync
}

// When creating shape
const optimisticShape: CanvasObject = {
  ...shapeData,
  id: generateUniqueId(),
  createdAt: new Date(),
  updatedAt: new Date(),
  _pending: true,  // Mark as pending
};

// In Firestore listener callback
const handleShapesUpdate = (syncedShapes: CanvasObject[]) => {
  // Mark all synced shapes as confirmed (remove _pending flag)
  const confirmedShapes = syncedShapes.map(s => ({ ...s, _pending: false }));
  setShapes(confirmedShapes);
};

// Visual indicator in Shape component
{shape._pending && (
  <Rect
    // ... shape props
    opacity={0.7}  // Dim pending shapes
    dash={[5, 5]}  // Dashed border
  />
)}
```

---

### 🔧 4. Error Handling & Rollback

#### Current State: Partial Implementation
- Errors logged to console
- Basic rollback on shape creation failure
- No user-facing error messages

#### Improvements Needed:

```typescript
// Better error handling with user feedback
const handleShapeDragEnd = async (id: string, x: number, y: number) => {
  if (!canvasId) return;
  
  // Store original position for rollback
  const originalShape = shapes.find(s => s.id === id);
  if (!originalShape) return;
  
  // Optimistic update
  setShapes(shapes.map(s => 
    s.id === id 
      ? { ...s, x, y, updatedAt: new Date(), _pending: true }
      : s
  ));
  
  try {
    await updateShapeInFirebase(canvasId, id, { x, y });
    // Success - Firestore listener will confirm
  } catch (error) {
    console.error('Failed to update shape:', error);
    
    // Rollback to original position
    setShapes(shapes.map(s =>
      s.id === id ? originalShape : s
    ));
    
    // Show user-facing error
    showToast({
      type: 'error',
      message: 'Failed to save changes. Please try again.',
      duration: 3000
    });
  }
};
```

---

## Implementation Priority

### Phase 1: Foundation (1 week)
1. **Add connection status indicator** (1 day)
   - Show online/offline/reconnecting state
   - Visual indicator in header
   - Auto-dismiss when reconnected

2. **Implement viewport persistence** (2 days)
   - Save zoom/pan to localStorage
   - Restore on reload
   - Per-canvas storage

3. **Improve error handling** (2 days)
   - User-facing error messages (toast/alert)
   - Better rollback on failures
   - Retry logic for transient errors

### Phase 2: Conflict Resolution (1-2 weeks)
1. **Add version tracking** (3 days)
   - Add `version` field to CanvasObject
   - Increment on each update
   - Track `lastEditedBy`

2. **Implement conflict detection** (4 days)
   - Check version before update
   - Throw ConflictError on mismatch
   - Refresh shape from server on conflict

3. **Build conflict resolution UI** (3 days)
   - Show conflict dialog
   - Options: Keep mine / Keep theirs / Cancel
   - Visual indicator on conflicted shapes

### Phase 3: State Management Migration (1-2 weeks)
1. **Set up Zustand store** (2 days)
   - Create canvas store
   - Migrate shapes state
   - Migrate selection state

2. **Add undo/redo foundation** (3 days)
   - History tracking in store
   - Undo/redo actions
   - Keyboard shortcuts (Cmd+Z, Cmd+Shift+Z)

3. **Migrate remaining state** (2-3 days)
   - Creation mode
   - Viewport state (optional)
   - Presence state (optional)

---

## Technical Decisions Needed

### 1. Conflict Resolution Strategy
**Question:** Which approach for conflicts?
- Option A: Version tracking + detection + manual resolution (Recommended)
- Option B: Full Operational Transformation (complex, but no conflicts)
- Option C: Stay with Last-Write-Wins (simple, but loses data)

**Recommendation:** Start with Option A (version tracking). Can evolve to OT later if needed.

### 2. State Management Library
**Question:** Which library for centralized state?
- Option A: Zustand (simple, lightweight, recommended)
- Option B: Redux Toolkit (more structure, steeper curve)
- Option C: Jotai/Recoil (atomic state, modern but less mature)

**Recommendation:** Zustand for Phase 2. Proven, simple, great DX.

### 3. Persistence Strategy
**Question:** What to persist to localStorage?
- Viewport state (zoom, pan) - YES
- Selected shape ID - NO (clears on reload is expected)
- Creation mode - NO (clears on reload is expected)
- Recent canvases - YES (for dashboard quick access)

---

## Next Steps

1. **Review this analysis** - Confirm priorities and technical decisions
2. **Choose first feature** - Still want to build canvas deletion next?
3. **Plan infrastructure work** - Decide which improvements to tackle first
4. **Create implementation tasks** - Break down into PRs

**Suggested Order:**
1. Add connection status indicator (quick win, improves UX)
2. Implement canvas deletion (user-requested feature)
3. Add viewport persistence (quality of life improvement)
4. Improve error handling (better UX)
5. Add version tracking + conflict detection (better reliability)
6. Migrate to Zustand (enables undo/redo)
7. Build undo/redo (major productivity boost)

**Your call:** What would you like to tackle first?

