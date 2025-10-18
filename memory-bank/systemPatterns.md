# System Patterns: CollabCanvas Architecture

## Architecture Overview

CollabCanvas uses a **multi-canvas architecture** where each canvas is an isolated workspace with its own objects, presence, and real-time sync.

### Key Architectural Decisions

#### 1. Multi-Canvas Isolation
**Pattern:** Scoped collections per canvas
- Each canvas has unique ID (`canvasId`) used to scope all related data
- Firebase structure: `/canvas-objects/{canvasId}/objects/{objectId}`
- Presence structure: `/presence/{canvasId}/users/{userId}`
- **Why:** Prevents cross-contamination, enables independent scaling per canvas

#### 2. Real-Time Sync Strategy
**Pattern:** Firebase real-time listeners with optimistic updates
- Subscribe to Firestore `onSnapshot()` for automatic sync
- Local state updates immediately (optimistic)
- Firebase writes happen in background
- **Conflict Resolution:** Two-tiered defense (edit indicators + version checking)
- **Why:** Best balance of responsiveness and reliability for collaborative editing

#### 3. State Management
**Pattern:** React Context + Custom Hooks
- `AuthContext` → User authentication state
- `CanvasContext` → Canvas objects and selection state
- Custom hooks (`useAuth`, `useRealtimeSync`, `usePresence`) encapsulate logic
- **Why:** Built-in, no extra dependencies, sufficient for MVP scope

#### 4. Two-Tiered Conflict Resolution
**Pattern:** Prevention + Detection for zero data loss
- **Tier 1 (Prevention):** Real-time edit indicators with visual feedback
  - Active-edits collection tracks who's editing which shapes
  - Dashed borders with user colors show editing state
  - 30-second TTL prevents stale indicators
  - 80-90% conflict prevention rate
- **Tier 2 (Detection):** Version-based optimistic locking
  - Version number incremented on every update
  - Conflict detection on version mismatch
  - Automatic recovery with user notification
  - 100% conflict detection rate
- **Why:** Single-tier approaches have gaps; combined approach ensures zero data loss

#### 5. Component Architecture
**Pattern:** Smart/Presentational component separation
- **Smart components:** `Canvas`, `Dashboard`, `UserPresence` (contain logic)
- **Presentational components:** `Shape`, `Cursor`, `CanvasCard` (render only)
- **Why:** Clear separation of concerns, easy testing

## Core System Components

### Frontend Architecture

```
┌─────────────────────────────────────────┐
│           Browser (Client)              │
│  ┌───────────────────────────────────┐  │
│  │       React Application            │  │
│  │                                    │  │
│  │  Components:                       │  │
│  │  - Auth (Login, Register)          │  │
│  │  - Dashboard (Canvas Management)   │  │
│  │  - Canvas (Konva Stage + Layers)   │  │
│  │  - Shapes (Konva Rect/Circle/Text) │  │
│  │  - Presence (Cursors, Online Users)│  │
│  │                                    │  │
│  │  Context:                          │  │
│  │  - AuthContext                     │  │
│  │  - CanvasContext                   │  │
│  │                                    │  │
│  │  Hooks:                            │  │
│  │  - useAuth, useCanvas              │  │
│  │  - useRealtimeSync, usePresence    │  │
│  │                                    │  │
│  │  Services:                         │  │
│  │  - auth.service.ts                 │  │
│  │  - canvas.service.ts               │  │
│  │  - canvasObjects.service.ts        │  │
│  │  - presence.service.ts             │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                 ↕ 
          WebSocket/HTTPS
                 ↕
┌─────────────────────────────────────────┐
│      Firebase Backend (Google Cloud)    │
│  ┌───────────────────────────────────┐  │
│  │   Firebase Authentication         │  │
│  │   - Email/Password provider       │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │   Cloud Firestore                 │  │
│  │   Collections:                    │  │
│  │   - canvases (metadata)           │  │
│  │   - canvas-objects/{canvasId}     │  │
│  │   - user-canvases/{userId}        │  │
│  │   - presence/{canvasId}           │  │
│  │   - active-edits/{canvasId}       │  │
│  │   - users (profiles)              │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │   Real-time Sync Engine           │  │
│  │   - WebSocket connections         │  │
│  │   - onSnapshot() listeners        │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Data Flow Patterns

#### Pattern: Object Creation Flow
```
User Action (Create Shape)
  ↓
Canvas.handleStageMouseUp()
  ↓
1. Generate unique ID (local)
2. Update local state immediately (optimistic)
  ↓
canvasObjects.service.createShape(canvasId, shape)
  ↓
Firestore write to /canvas-objects/{canvasId}/objects/{objectId}
  ↓
Firebase triggers onSnapshot() for all listening clients on this canvas
  ↓
useRealtimeSync hook receives update
  ↓
Update local state for all clients viewing same canvas
  ↓
Konva re-renders with new shape
```

#### Pattern: Cursor Position Sync
```
User moves mouse in Canvas
  ↓
Canvas.onMouseMove() captures position (viewport coords)
  ↓
usePresence throttles updates (60fps = 16.6ms)
  ↓
presence.service.updateCursorPosition(canvasId, userId, x, y)
  ↓
Firestore write to /presence/{canvasId}/users/{userId}
  ↓
Firebase triggers onSnapshot() for all clients on this canvas
  ↓
usePresence hook receives updates
  ↓
Render Cursor components (HTML overlay, not Konva)
```

#### Pattern: Canvas Isolation
```
User A on Canvas "abc123"        User B on Canvas "xyz789"
         ↓                                  ↓
Subscribe to:                       Subscribe to:
- /canvas-objects/abc123/objects    - /canvas-objects/xyz789/objects
- /presence/abc123/users            - /presence/xyz789/users
         ↓                                  ↓
User A creates shape                User B creates shape
         ↓                                  ↓
Firestore writes to abc123          Firestore writes to xyz789
         ↓                                  ↓
Only clients on abc123 receive     Only clients on xyz789 receive
```

#### Pattern: Conflict Resolution (Two-Tiered Defense)
```
User A starts dragging shape
  ↓
Canvas.onDragStart() fired
  ↓
[TIER 1: PREVENTION]
Write to /active-edits/{canvasId}/shapes/{shapeId}
  {userId, userName, color, startedAt, expiresAt (30s TTL)}
  ↓
Firebase broadcasts to all users on canvas
  ↓
User B's useActiveEdits receives update
  ↓
Shape.tsx renders dashed border with User A's color
  ↓
User B sees "Alice Smith is editing" tooltip
  ↓
User B avoids editing that shape (80-90% conflict prevented)
  ↓
User A finishes drag
  ↓
Delete /active-edits/{canvasId}/shapes/{shapeId}
  ↓
Dashed border disappears for all users

---

[TIER 2: DETECTION] (If both users edit simultaneously)
User A loads shape (version: 5)
User B loads same shape (version: 5)
  ↓
User A updates → version incremented to 6 (atomic increment)
  ↓
User B tries to update with expectedVersion: 5
  ↓
canvasObjects.service checks: expectedVersion (5) !== serverVersion (6)
  ↓
Throw ConflictError(shapeId, 5, 6, lastEditedBy, lastEditedByName)
  ↓
Canvas.tsx catches ConflictError
  ↓
Show toast: "Shape was modified by Alice Smith. Reloading..."
  ↓
Revert User B's optimistic update
  ↓
Real-time sync provides latest version (6) to User B
  ↓
User B can retry edit (conflict detected, zero data loss)
```

## Design Patterns in Use

### 1. Observer Pattern (Real-Time Sync)
- **Implementation:** Firestore `onSnapshot()` listeners
- **Purpose:** Automatic updates when data changes
- **Location:** `useRealtimeSync.ts`, `usePresence.ts`
- **Benefit:** No polling, efficient real-time updates

### 2. Provider Pattern (State Management)
- **Implementation:** React Context API
- **Purpose:** Global state accessible to all components
- **Location:** `AuthContext.tsx`, `CanvasContext.tsx`
- **Benefit:** Avoid prop drilling, centralized state

### 3. Repository Pattern (Data Access)
- **Implementation:** Service layer abstraction
- **Purpose:** Encapsulate Firebase operations
- **Location:** `auth.service.ts`, `canvas.service.ts`, etc.
- **Benefit:** Easy to mock for testing, centralized logic

### 4. Optimistic UI Pattern
- **Implementation:** Update local state before server confirmation
- **Purpose:** Instant feedback, perceived performance
- **Location:** `Canvas.tsx` (shape creation/movement)
- **Benefit:** Feels responsive even with network latency

### 5. Memoization Pattern (Performance)
- **Implementation:** `React.memo()`, `useMemo()`, `useCallback()`
- **Purpose:** Prevent unnecessary re-renders
- **Location:** `Shape.tsx`, `Canvas.tsx`, `GridDots.tsx`
- **Benefit:** Maintains 60 FPS with many shapes

### 6. Throttling Pattern (Performance)
- **Implementation:** Time-based throttling for cursor updates
- **Purpose:** Limit Firebase write frequency
- **Location:** `usePresence.ts` (60fps = 16.6ms)
- **Benefit:** Reduces database writes, maintains smooth cursor

### 7. Cleanup Pattern (Memory Management)
- **Implementation:** `useEffect()` cleanup functions
- **Purpose:** Unsubscribe from listeners, remove presence
- **Location:** All hooks with subscriptions
- **Benefit:** No memory leaks, clean disconnects

### 8. Two-Tiered Defense Pattern (Conflict Resolution)
- **Implementation:** Prevention (edit indicators) + Detection (version checking)
- **Purpose:** Zero data loss in collaborative editing
- **Location:** `activeEdits.service.ts`, `canvasObjects.service.ts`, `Canvas.tsx`, `Shape.tsx`
- **Benefit:** 80-90% prevention + 100% detection = professional-grade collaboration

## Critical Implementation Paths

### Path 1: Initial Canvas Load
```
User navigates to /canvas/:canvasId
  ↓
CanvasWrapper extracts canvasId from URL
  ↓
canvas.service.getCanvasById(canvasId) - load metadata
  ↓
useRealtimeSync subscribes to /canvas-objects/{canvasId}/objects
  ↓
usePresence.setUserOnline(canvasId, userId, displayName)
  ↓
Canvas renders with Konva Stage
  ↓
GridDots renders optimized background
  ↓
Shapes render from synced state
  ↓
UserPresence shows cursors and online users for this canvas
```

### Path 2: Multi-User Collaboration
```
User A drags shape on Canvas abc123
  ↓
Shape.onDragEnd() fires with new position
  ↓
Canvas.handleShapeDragEnd() updates local state (optimistic)
  ↓
canvasObjects.service.updateShape(abc123, shapeId, {x, y})
  ↓
Firestore writes to /canvas-objects/abc123/objects/{shapeId}
  ↓
Firebase broadcasts to all clients subscribed to abc123
  ↓
User B's useRealtimeSync receives update
  ↓
User B's local state updates
  ↓
Konva re-renders shape at new position on User B's screen
```

### Path 3: Canvas Sharing
```
User clicks "Share" button on Canvas Card (Dashboard)
  ↓
ShareLinkModal opens with URL: /canvas/{canvasId}
  ↓
User copies link and sends to Collaborator
  ↓
Collaborator clicks link (not logged in)
  ↓
Redirect to /login with return URL
  ↓
After login, redirect to /canvas/:canvasId
  ↓
canvas.service.updateCanvasAccess(userId, canvasId, 'collaborator')
  ↓
Canvas appears in collaborator's dashboard
  ↓
Collaborator sees canvas and starts editing
```

## Performance Optimizations

### Grid Rendering Optimization
**Problem:** 5,000+ individual Circle components causing 15-30 FPS
**Solution:** Single Shape component with custom `sceneFunc` drawing all dots
**Result:** 60 FPS maintained

**Implementation:**
```typescript
// Old approach: 5000+ components
{dots.map(dot => <Circle key={dot.id} {...dot} />)}

// New approach: 1 component with custom draw
<Shape
  sceneFunc={(context, shape) => {
    // Single canvas draw call for all dots
    visibleDots.forEach(dot => {
      context.beginPath();
      context.arc(dot.x, dot.y, 1, 0, 2 * Math.PI);
      context.fill();
    });
  }}
/>
```

### Viewport Culling
Only render dots/shapes visible in current viewport
- Calculate visible bounds based on stage position and scale
- Filter objects outside viewport
- Prevents rendering thousands of off-screen objects

### Stable Subscriptions
Prevent unnecessary re-subscriptions to Firebase
- Use `useCallback` for stable function references
- Careful dependency arrays in `useEffect`
- Cleanup old listeners before creating new ones

## Component Relationships

### Canvas Component Hierarchy
```
App (Router)
  ├── AuthLayout (Public routes)
  │   ├── LoginForm
  │   └── RegisterForm
  │
  ├── Layout (Protected routes)
  │   ├── Header (Nav, User info, Logout)
  │   └── Dashboard
  │       └── CanvasCard[] (Grid of canvases)
  │           └── ShareLinkModal
  │
  └── CanvasWrapper (Protected route)
      └── Canvas (Konva Stage)
          ├── GridDots (Background layer)
          ├── Shape[] (Objects layer)
          ├── CanvasToolbar (UI overlay)
          └── UserPresence (HTML overlay)
              ├── Cursor[] (Other users)
              └── OnlineUsers (List)
```

### Service Layer Dependencies
```
Components/Hooks
  ↓
Service Layer
  ├── auth.service.ts → firebase.ts
  ├── canvas.service.ts → firebase.ts
  ├── canvasObjects.service.ts → firebase.ts
  └── presence.service.ts → firebase.ts
  ↓
Firebase SDK
  ↓
Google Cloud Backend
```

## Testing Strategy

### Unit Tests
- Test pure functions and services in isolation
- Mock Firebase dependencies
- Files: `canvasHelpers.test.ts`, `auth.service.test.ts`, etc.
- Coverage: 80%+ for utils and services

### Integration Tests
- Test component interactions and user flows
- Mock Firebase with in-memory data
- Files: `auth-flow.test.tsx`, `dashboard-flow.test.tsx`, etc.
- Coverage: All critical user paths

### Manual Testing
- Multi-browser collaboration (2+ windows)
- Canvas isolation verification
- Performance testing (500+ shapes)
- Network resilience (reconnection)

