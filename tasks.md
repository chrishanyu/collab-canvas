# CollabCanvas MVP - Task List & PR Breakdown

## Architecture Note
**Multi-Canvas Architecture:** This MVP uses a multi-canvas project management system. Users can create unlimited canvases, share them via links, and collaborate in real-time. Each canvas is isolated with its own objects, presence, and real-time sync. Users access a dashboard after login where they can create new canvases or view existing ones.

## Project File Structure

```
collabcanvas/
├── public/
│   └── vite.svg
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── AuthLayout.tsx
│   │   ├── dashboard/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── CanvasCard.tsx
│   │   │   ├── CreateCanvasModal.tsx
│   │   │   └── ShareLinkModal.tsx
│   │   ├── canvas/
│   │   │   ├── Canvas.tsx
│   │   │   ├── CanvasToolbar.tsx
│   │   │   ├── Shape.tsx
│   │   │   └── Cursor.tsx
│   │   ├── presence/
│   │   │   ├── UserPresence.tsx
│   │   │   └── OnlineUsers.tsx
│   │   └── layout/
│   │       ├── Header.tsx
│   │       └── Layout.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useCanvas.ts
│   │   ├── usePresence.ts
│   │   └── useRealtimeSync.ts
│   ├── services/
│   │   ├── firebase.ts
│   │   ├── auth.service.ts
│   │   ├── canvas.service.ts
│   │   ├── canvasObjects.service.ts
│   │   └── presence.service.ts
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── CanvasContext.tsx
│   ├── utils/
│   │   ├── canvasHelpers.ts
│   │   └── constants.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   ├── vite-env.d.ts
│   └── index.css
├── tests/
│   ├── setup.ts
│   ├── mocks/
│   │   └── firebase.mock.ts
│   ├── unit/
│   │   ├── canvasHelpers.test.ts
│   │   ├── auth.service.test.ts
│   │   └── canvas.service.test.ts
│   └── integration/
│       ├── auth-flow.test.tsx
│       ├── canvas-operations.test.tsx
│       └── realtime-sync.test.tsx
├── .env.example
├── .env.local (gitignored)
├── .gitignore
├── package.json
├── vite.config.ts
├── vitest.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── index.html
└── README.md
```

---

## PR #1: Project Setup & Configuration
**Goal:** Initialize Vite + React + Tailwind project with Firebase configuration  
**Branch:** `setup/initial-config`

### Tasks:
- [x] Initialize Vite React project (TypeScript)
  - **Files created:** `package.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`
  - **Command:** `npm create vite@latest collabcanvas -- --template react-ts`

- [x] Install core dependencies
  - **Files modified:** `package.json`
  - **Packages:** `firebase`, `konva`, `react-konva`, `react-router-dom`, `tailwindcss`, `@tailwindcss/postcss`, `postcss`, `autoprefixer`
  - **Command:** `npm install firebase konva react-konva react-router-dom && npm install -D tailwindcss @tailwindcss/postcss postcss autoprefixer`

- [x] Install testing dependencies
  - **Files modified:** `package.json`
  - **Packages:** `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`
  - **Command:** `npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom`

- [x] Configure Vitest
  - **Files created:** `vitest.config.ts`, `tests/setup.ts`
  - **Purpose:** Set up testing environment with jsdom and TypeScript

- [x] Configure Tailwind CSS
  - **Files created:** `tailwind.config.js`, `postcss.config.js`
  - **Files modified:** `src/index.css`
  - **Note:** Using Tailwind CSS 4 with `@tailwindcss/postcss`

- [x] Set up Firebase project
  - **Files created:** `src/services/firebase.ts`, `src/vite-env.d.ts`, `.env`
  - **Firebase Console:** Create new project, enable Firestore, enable Authentication
  - **Note:** Using TypeScript with type-safe imports

- [x] Configure environment variables
  - **Files created/modified:** `.env`, `.gitignore`
  - **Add:** Firebase config keys (API key, auth domain, project ID, etc.)
  - **Note:** Using `.env` (already in `.gitignore` via `*.local`)

- [x] Create basic folder structure
  - **Folders created:** `src/components/`, `src/hooks/`, `src/services/`, `src/context/`, `src/utils/`, `src/types/`, `tests/unit/`, `tests/integration/`, `tests/mocks/`

- [x] Create TypeScript type definitions
  - **Files created:** `src/types/index.ts`, `src/vite-env.d.ts`
  - **Types:** User, Canvas, CanvasObject, UserPresence, CanvasAccess

- [x] Update README with setup instructions
  - **Files modified:** `README.md`
  - **Add:** Testing instructions, architecture overview, TypeScript setup

**PR Review Checklist:**
- [x] Project builds without errors (`npm run build`)
- [x] Dev server runs without errors (`npm run dev`)
- [x] Tests run without errors (`npm run test`)
- [x] Tailwind styles are working
- [x] Firebase config is loaded from env variables
- [x] `.env` is gitignored
- [x] README has clear setup instructions
- [x] TypeScript configuration working
- [x] All dependencies installed correctly

---

## PR #2: Firebase Authentication System
**Goal:** Implement user registration, login, and auth context. All users must authenticate before accessing any canvas or dashboard.  
**Branch:** `feature/authentication`

### Tasks:
- [ ] Create Firebase auth service
  - **Files created:** `src/services/auth.service.js`
  - **Functions:** `registerUser()`, `loginUser()`, `logoutUser()`, `getCurrentUser()`

- [ ] **UNIT TEST: Auth service functions**
  - **Files created:** `tests/unit/auth.service.test.js`, `tests/mocks/firebase.mock.js`
  - **Test cases:**
    - `registerUser()` creates user with email/password
    - `loginUser()` authenticates valid credentials
    - `loginUser()` rejects invalid credentials
    - `logoutUser()` clears current user
    - `getCurrentUser()` returns authenticated user
  - **Mocking:** Mock Firebase auth methods
  - **Command:** `npm run test tests/unit/auth.service.test.js`

- [ ] Create Auth Context
  - **Files created:** `src/context/AuthContext.jsx`
  - **Exports:** `AuthProvider`, `useAuth` hook
  - **State:** `currentUser`, `loading`, `error`

- [ ] Create auth layout component
  - **Files created:** `src/components/auth/AuthLayout.jsx`
  - **Purpose:** Wrapper for login/register forms with styling

- [ ] Create login form
  - **Files created:** `src/components/auth/LoginForm.jsx`
  - **Fields:** Email, password
  - **Validation:** Basic email/password validation
  - **Styling:** Tailwind forms

- [ ] Create registration form
  - **Files created:** `src/components/auth/RegisterForm.jsx`
  - **Fields:** Display name, email, password, confirm password
  - **Validation:** Password match, email format

- [ ] **INTEGRATION TEST: Authentication flow**
  - **Files created:** `tests/integration/auth-flow.test.jsx`
  - **Test cases:**
    - User can register with valid credentials
    - User can log in after registration
    - User sees error with invalid email format
    - User sees error with mismatched passwords
    - User can log out and return to login screen
    - Auth state persists on page refresh
  - **Testing:** Full component rendering with React Testing Library
  - **Command:** `npm run test tests/integration/auth-flow.test.jsx`

- [ ] Create custom auth hook
  - **Files created:** `src/hooks/useAuth.js`
  - **Purpose:** Consume AuthContext, provide auth methods

- [ ] Update App.jsx with auth routing
  - **Files modified:** `src/App.jsx`
  - **Logic:** Show auth forms if not logged in, redirect to dashboard (`/dashboard`) immediately after login
  - **Routes:** Setup React Router with `/login`, `/register`, `/dashboard`, `/canvas/:canvasId`

- [ ] Add loading and error states
  - **Files modified:** `src/components/auth/LoginForm.jsx`, `RegisterForm.jsx`
  - **UI:** Loading spinners, error messages

**PR Review Checklist:**
- [ ] All unit tests pass (`npm run test tests/unit/auth.service.test.js`)
- [ ] All integration tests pass (`npm run test tests/integration/auth-flow.test.jsx`)
- [ ] Users can register with email/password
- [ ] Users can log in with existing credentials
- [ ] Users can log out
- [ ] Auth state persists on page refresh
- [ ] Display name is captured during registration
- [ ] Error messages display for invalid credentials
- [ ] Loading states show during auth operations

---

## PR #3: Dashboard & Canvas Management
**Goal:** Create dashboard, canvas creation, and sharing functionality  
**Branch:** `feature/dashboard`

### Tasks:
- [ ] Create canvas service for metadata
  - **Files created:** `src/services/canvas.service.js`
  - **Functions:** `createCanvas()`, `getCanvasById()`, `getUserCanvases()`, `updateCanvasAccess()`, `generateShareLink()`
  - **Note:** Manages canvas metadata (name, owner, timestamps), not canvas objects

- [ ] **UNIT TEST: Canvas metadata service**
  - **Files created:** `tests/unit/canvas.service.test.js`
  - **Test cases:**
    - `createCanvas()` creates canvas with correct metadata structure
    - `getCanvasById()` retrieves canvas by ID
    - `getUserCanvases()` returns all canvases for a user
    - `updateCanvasAccess()` adds canvas to user's access list
    - Canvas IDs are unique and valid
  - **Mocking:** Mock Firestore operations
  - **Command:** `npm run test tests/unit/canvas.service.test.js`

- [ ] Create Dashboard component
  - **Files created:** `src/components/dashboard/Dashboard.jsx`
  - **Features:** Display user's canvases, "Create New Canvas" button, empty state if no canvases
  - **Layout:** Grid of canvas cards

- [ ] Create CanvasCard component
  - **Files created:** `src/components/dashboard/CanvasCard.jsx`
  - **Display:** Canvas name, owner, created date, last modified, thumbnail (placeholder for now)
  - **Actions:** Click to open canvas, copy share link button

- [ ] Create CreateCanvasModal component
  - **Files created:** `src/components/dashboard/CreateCanvasModal.jsx`
  - **Fields:** Canvas name input
  - **Action:** Creates canvas in Firestore, redirects to new canvas

- [ ] Create ShareLinkModal component
  - **Files created:** `src/components/dashboard/ShareLinkModal.jsx`
  - **Display:** Full shareable URL, copy to clipboard button
  - **Format:** `https://app-url.com/canvas/:canvasId`

- [ ] Implement canvas creation logic
  - **Files modified:** `src/components/dashboard/Dashboard.jsx`
  - **Flow:** Click "Create" → modal opens → enter name → create in Firestore → add to user access → redirect to canvas

- [ ] Implement share link generation
  - **Files modified:** `src/components/dashboard/CanvasCard.jsx`
  - **Logic:** Generate link with canvas ID, copy to clipboard with feedback

- [ ] Handle canvas access via shared link
  - **Files modified:** `src/App.jsx`
  - **Logic:** When user navigates to `/canvas/:canvasId`, add canvas to their access list if not already present

- [ ] **INTEGRATION TEST: Dashboard flow**
  - **Files created:** `tests/integration/dashboard-flow.test.jsx`
  - **Test cases:**
    - User sees empty dashboard with "Create" button on first login
    - Clicking "Create" opens modal and creates canvas
    - New canvas appears in dashboard
    - Canvas card displays correct metadata
    - Clicking canvas card navigates to canvas
    - Share link button copies correct URL
    - Multiple canvases can be created
  - **Purpose:** Verify full dashboard and canvas management flow
  - **Command:** `npm run test tests/integration/dashboard-flow.test.jsx`

- [ ] Update routing in App.jsx
  - **Files modified:** `src/App.jsx`
  - **Routes:** `/dashboard` (protected), `/canvas/:canvasId` (protected)
  - **Logic:** Protected routes require authentication

**PR Review Checklist:**
- [ ] Unit tests pass for canvas service
- [ ] Integration tests pass for dashboard flow
- [ ] Users see dashboard after login
- [ ] "Create New Canvas" button works
- [ ] New canvases appear in dashboard with correct metadata
- [ ] Clicking canvas navigates to `/canvas/:canvasId`
- [ ] Share link generates and copies to clipboard
- [ ] Accessing `/canvas/:canvasId` via link adds canvas to user's dashboard
- [ ] Multiple canvases can be created independently

---

## PR #4: Basic Canvas with Pan & Zoom
**Goal:** Create Konva canvas with smooth pan/zoom functionality, accept canvasId from route  
**Branch:** `feature/canvas-core`

### Tasks:
- [ ] Create canvas constants
  - **Files created:** `src/utils/constants.js`
  - **Constants:** `CANVAS_WIDTH`, `CANVAS_HEIGHT`, `MIN_ZOOM`, `MAX_ZOOM`, `ZOOM_SPEED`
  - **Note:** Same constants used for all canvases

- [ ] Create canvas helper utilities
  - **Files created:** `src/utils/canvasHelpers.js`
  - **Functions:** `getPointerPosition()`, `getRelativePointerPosition()`, `constrainZoom()`, `generateUniqueId()`

- [ ] **UNIT TEST: Canvas helper functions**
  - **Files created:** `tests/unit/canvasHelpers.test.js`
  - **Test cases:**
    - `constrainZoom()` keeps zoom within min/max bounds
    - `constrainZoom()` allows valid zoom values
    - `getRelativePointerPosition()` calculates correct canvas coordinates
    - `generateUniqueId()` produces unique IDs
  - **Purpose:** Verify core canvas math is correct
  - **Command:** `npm run test tests/unit/canvasHelpers.test.js`

- [ ] Create Canvas component
  - **Files created:** `src/components/canvas/Canvas.jsx`
  - **Setup:** Konva Stage and Layer
  - **Features:** Basic rendering
  - **Routing:** Extract `canvasId` from URL params using `useParams()`
  - **Data:** Load canvas metadata from Firestore using canvasId

- [ ] Implement pan functionality
  - **Files modified:** `src/components/canvas/Canvas.jsx`
  - **Method:** Drag Stage to pan
  - **Event:** `onDragEnd` to save position

- [ ] Implement zoom functionality
  - **Files modified:** `src/components/canvas/Canvas.jsx`
  - **Method:** Mouse wheel zoom with pointer as center
  - **Event:** `onWheel` handler
  - **Constraints:** Min/max zoom limits

- [ ] Add canvas toolbar
  - **Files created:** `src/components/canvas/CanvasToolbar.jsx`
  - **Buttons:** Reset view, zoom in, zoom out
  - **Styling:** Tailwind fixed toolbar

- [ ] Create Layout component
  - **Files created:** `src/components/layout/Layout.jsx`, `Header.jsx`
  - **Purpose:** App shell with header and canvas area

- [ ] Update App.jsx with canvas
  - **Files modified:** `src/App.jsx`
  - **Logic:** Show canvas after authentication

- [ ] Test performance (60 FPS)
  - **Files modified:** `src/components/canvas/Canvas.jsx`
  - **Add:** FPS counter (dev only)

**PR Review Checklist:**
- [ ] Unit tests pass for canvas helpers
- [ ] Canvas renders in full viewport
- [ ] Drag to pan works smoothly
- [ ] Scroll to zoom works with mouse as center point
- [ ] Zoom constrained to min/max limits
- [ ] Toolbar buttons work (reset, zoom in/out)
- [ ] Performance stays at 60 FPS during pan/zoom
- [ ] Canvas visible only after authentication

---

## PR #5: Shape Creation & Manipulation
**Goal:** Add ability to create and move rectangles on canvas  
**Branch:** `feature/shapes`

### Tasks:
- [ ] Create Shape component
  - **Files created:** `src/components/canvas/Shape.jsx`
  - **Props:** `shape` object (id, type, x, y, width, height, fill)
  - **Support:** Rectangle rendering with Konva.Rect

- [ ] Add shape creation to toolbar
  - **Files modified:** `src/components/canvas/CanvasToolbar.jsx`
  - **Button:** "Add Rectangle"
  - **Action:** Trigger shape creation

- [ ] Implement shape creation logic
  - **Files modified:** `src/components/canvas/Canvas.jsx`
  - **Method:** `createShape()` - adds shape at center or click position
  - **State:** Local shapes array

- [ ] Add shape selection
  - **Files modified:** `src/components/canvas/Shape.jsx`, `Canvas.jsx`
  - **Event:** `onClick` handler
  - **State:** `selectedShapeId`
  - **Visual:** Highlight selected shape (border or transformer)

- [ ] Implement shape dragging
  - **Files modified:** `src/components/canvas/Shape.jsx`
  - **Props:** `draggable={true}`
  - **Event:** `onDragEnd` to update position
  - **Callback:** Pass position back to parent

- [ ] Add visual feedback
  - **Files modified:** `src/components/canvas/Shape.jsx`
  - **States:** Hover effect, selection highlight
  - **Cursor:** Pointer on hover

- [ ] Create canvas context
  - **Files created:** `src/context/CanvasContext.jsx`
  - **State:** `shapes`, `selectedShapeId`, `setShapes`, `selectShape`

- [ ] Create canvas hook
  - **Files created:** `src/hooks/useCanvas.js`
  - **Methods:** `createShape()`, `updateShape()`, `deleteShape()`, `selectShape()`

- [ ] **INTEGRATION TEST: Canvas operations**
  - **Files created:** `tests/integration/canvas-operations.test.jsx`
  - **Test cases:**
    - Clicking "Add Rectangle" creates a shape on canvas
    - Created shape has correct default properties (size, color, position)
    - Clicking a shape selects it (visual feedback present)
    - Selected shape can be dragged to new position
    - Shape position updates after drag
    - Multiple shapes can exist simultaneously
    - Creating 20 shapes maintains performance
  - **Purpose:** Verify shape creation and manipulation works end-to-end
  - **Command:** `npm run test tests/integration/canvas-operations.test.jsx`

**PR Review Checklist:**
- [ ] Integration tests pass for canvas operations
- [ ] Clicking "Add Rectangle" creates a new rectangle
- [ ] Shapes render with correct position and size
- [ ] Clicking a shape selects it (visual feedback)
- [ ] Dragging a shape moves it smoothly
- [ ] Shape position updates after drag
- [ ] Multiple shapes can be created
- [ ] Performance maintained with 20+ shapes

---

## PR #6: Firebase Realtime Sync - Objects
**Goal:** Sync shape creation and movement across all users viewing the same canvas  
**Branch:** `feature/realtime-objects`

### Tasks:
- [ ] Create Firestore data model
  - **Firebase Console:** Create `canvas-objects` collection with nested structure
  - **Structure:** `/canvas-objects/{canvasId}/objects/{objectId}`
  - **Fields:** `id`, `type`, `x`, `y`, `width`, `height`, `fill`, `createdBy`, `createdAt`, `updatedAt`
  - **Note:** Objects are scoped per canvas for isolation
  - **Files created:** Data model documentation in `README.md`

- [ ] Create canvas objects service
  - **Files created:** `src/services/canvasObjects.service.js`
  - **Functions:** `subscribeToCanvasObjects(canvasId)`, `createShape(canvasId, shape)`, `updateShape(canvasId, shapeId, updates)`, `deleteShape(canvasId, shapeId)`
  - **Note:** All functions require canvasId parameter to scope operations

- [ ] **UNIT TEST: Canvas objects service functions**
  - **Files created:** `tests/unit/canvasObjects.service.test.js`
  - **Test cases:**
    - `createShape(canvasId, shape)` adds shape to correct canvas in Firestore
    - `updateShape(canvasId, shapeId, updates)` modifies existing shape
    - `deleteShape(canvasId, shapeId)` removes shape from correct canvas
    - Objects are isolated per canvasId (canvas A ≠ canvas B)
    - Service handles Firestore errors gracefully
    - Shape IDs are unique and valid
  - **Mocking:** Mock Firestore operations
  - **Command:** `npm run test tests/unit/canvasObjects.service.test.js`

- [ ] Create realtime sync hook
  - **Files created:** `src/hooks/useRealtimeSync.js`
  - **Purpose:** Subscribe to specific canvas Firestore changes, update local state
  - **Parameters:** Accepts `canvasId` to subscribe to specific canvas
  - **Methods:** `syncShapes(canvasId)`, handle snapshot listeners per canvas
  - **Note:** Must unsubscribe when canvas changes or component unmounts

- [ ] Integrate Firebase sync into Canvas
  - **Files modified:** `src/components/canvas/Canvas.jsx`, `src/hooks/useCanvas.js`
  - **Logic:** Extract canvasId from route, subscribe to that canvas's objects on mount
  - **Cleanup:** Unsubscribe from Firestore when navigating away or unmounting

- [ ] Implement create shape sync
  - **Files modified:** `src/services/canvasObjects.service.js`, `src/hooks/useCanvas.js`
  - **Flow:** Create shape locally → Write to Firestore with canvasId → All clients viewing same canvas receive update

- [ ] Implement move shape sync
  - **Files modified:** `src/components/canvas/Shape.jsx`, `src/services/canvasObjects.service.js`
  - **Flow:** Drag shape → Update Firestore with canvasId on dragEnd → All clients in same canvas receive new position

- [ ] Add optimistic updates
  - **Files modified:** `src/hooks/useCanvas.js`
  - **Logic:** Update local state immediately, sync to Firebase in background

- [ ] Handle conflicts (last write wins)
  - **Files modified:** `src/services/canvas.service.js`
  - **Method:** Use Firestore server timestamps for ordering

- [ ] Add error handling
  - **Files modified:** `src/hooks/useRealtimeSync.js`
  - **Logic:** Retry failed writes, show error toasts

- [ ] **INTEGRATION TEST: Real-time sync (mock)**
  - **Files created:** `tests/integration/realtime-sync.test.jsx`
  - **Test cases:**
    - Creating shape triggers Firestore write with correct canvasId
    - Firestore listener receives updates and updates local state for specific canvas
    - Moving shape triggers Firestore update on specific canvas
    - Multiple shape operations sync in correct order per canvas
    - Reconnection reloads correct canvas state
    - Canvas isolation: changes in canvas A don't appear in canvas B
    - All users viewing same canvas see the same state
  - **Mocking:** Mock Firestore snapshot listeners
  - **Purpose:** Verify sync logic without actual Firebase calls
  - **Command:** `npm run test tests/integration/realtime-sync.test.jsx`

- [ ] Test with multiple browsers and canvases
  - **Testing:** Open 2+ browser windows on same canvas, create/move shapes, verify sync
  - **Testing:** Open browsers on different canvases, verify isolation

**PR Review Checklist:**
- [ ] Unit tests pass for canvas objects service
- [ ] Integration tests pass for sync logic
- [ ] Creating a shape in one browser shows in all browsers viewing same canvas
- [ ] Moving a shape in one browser updates for all users on same canvas
- [ ] Changes in canvas A don't affect canvas B (isolation verified)
- [ ] Sync latency is under 100ms
- [ ] No duplicate shapes appear
- [ ] Canvas state persists per canvas (refresh and shapes remain)
- [ ] Works with 2+ simultaneous users viewing the same canvas
- [ ] Handles network disconnects gracefully

---

## PR #7: Multiplayer Cursors & Presence
**Goal:** Show real-time cursor positions and names for all users viewing the same canvas  
**Branch:** `feature/multiplayer-presence`

### Tasks:
- [ ] Create Firestore presence data model
  - **Firebase Console:** Create `presence` collection with nested structure
  - **Structure:** `/presence/{canvasId}/users/{userId}`
  - **Fields:** `userId`, `displayName`, `cursorX`, `cursorY`, `color`, `lastSeen`
  - **Note:** Presence is isolated per canvas
  - **Files modified:** `README.md` (document data structure)

- [ ] Create presence service
  - **Files created:** `src/services/presence.service.js`
  - **Functions:** `updateCursorPosition(canvasId, userId, x, y)`, `setUserOnline(canvasId, userId)`, `setUserOffline(canvasId, userId)`, `subscribeToPresence(canvasId)`
  - **Note:** All functions require canvasId to scope presence to specific canvas

- [ ] Create Cursor component
  - **Files created:** `src/components/canvas/Cursor.jsx`
  - **Props:** `x`, `y`, `name`, `color`
  - **Render:** SVG cursor with name label

- [ ] Create presence hook
  - **Files created:** `src/hooks/usePresence.js`
  - **Parameters:** Accepts `canvasId` to track presence for specific canvas
  - **State:** Array of online users with cursor positions for this canvas
  - **Methods:** `updateCursor(x, y)`, `subscribeToUsers(canvasId)`
  - **Cleanup:** Unsubscribe and set user offline when leaving canvas

- [ ] Integrate cursor tracking in Canvas
  - **Files modified:** `src/components/canvas/Canvas.jsx`
  - **Event:** `onMouseMove` to track cursor position
  - **Logic:** Pass canvasId to presence hook
  - **Throttle:** Update Firebase max 60 times/second

- [ ] Render other users' cursors
  - **Files modified:** `src/components/canvas/Canvas.jsx`
  - **Loop:** Map over online users for this canvas, render Cursor component for each
  - **Note:** Only show users in the current canvas

- [ ] Assign unique colors to users
  - **Files created:** `src/utils/canvasHelpers.js` (add color generator)
  - **Logic:** Deterministic color based on userId

- [ ] Create online users list component
  - **Files created:** `src/components/presence/OnlineUsers.jsx`
  - **Display:** List of users currently viewing this specific canvas with colored dots
  - **Position:** Fixed sidebar or header
  - **Props:** Receives `canvasId` to display correct users

- [ ] Handle user online/offline status
  - **Files modified:** `src/hooks/usePresence.js`
  - **Logic:** Set online for this canvasId on mount, offline on unmount
  - **Firebase:** Use `onDisconnect()` for automatic cleanup per canvas
  - **Cleanup:** Remove presence when navigating to different canvas

- [ ] Add presence to UserPresence component
  - **Files created:** `src/components/presence/UserPresence.jsx`
  - **Purpose:** Wrapper component managing presence logic

- [ ] Optimize cursor updates
  - **Files modified:** `src/hooks/usePresence.js`
  - **Method:** Throttle/debounce cursor position updates
  - **Target:** <50ms latency

**PR Review Checklist:**
- [ ] Current user's cursor tracked on the canvas they're viewing
- [ ] Other users' cursors visible in real-time on the same canvas
- [ ] Each cursor shows the user's display name
- [ ] Cursors have unique colors per user
- [ ] Cursor updates feel smooth (<50ms latency)
- [ ] Online users list shows only users currently on this specific canvas
- [ ] User goes offline when closing browser or navigating away (removed from canvas presence)
- [ ] Presence is isolated: users in canvas A don't see cursors from canvas B
- [ ] No cursor flickering or jank

---

## PR #8: State Persistence & Reconnection
**Goal:** Ensure per-canvas state persists and handles reconnects  
**Branch:** `feature/persistence`

### Tasks:
- [ ] Implement per-canvas state persistence
  - **Files modified:** `src/services/canvasObjects.service.js`
  - **Logic:** All shape changes auto-saved to Firestore scoped by canvasId
  - **Note:** Each canvas maintains its own persistent state

- [ ] Add reconnection handling
  - **Files modified:** `src/hooks/useRealtimeSync.js`
  - **Logic:** Re-subscribe to specific canvas Firestore on reconnect
  - **Firebase:** Use `onSnapshot` which auto-handles reconnects
  - **Verify:** Correct canvasId is used after reconnection

- [ ] Handle refresh scenario
  - **Files modified:** `src/components/canvas/Canvas.jsx`
  - **Logic:** Extract canvasId from route, load all shapes for that canvas on mount
  - **Verify:** User sees the correct canvas state after refresh

- [ ] Add connection status indicator
  - **Files created:** `src/components/layout/ConnectionStatus.jsx`
  - **Display:** "Connected" / "Reconnecting..." badge

- [ ] Test disconnect scenarios
  - **Testing:** Kill network, refresh page, rejoin specific canvas
  - **Verify:** All shapes still present on that canvas, no data loss
  - **Test:** Switch between canvases, verify each maintains correct state

- [ ] Add optimistic UI for offline mode
  - **Files modified:** `src/hooks/useCanvas.js`
  - **Logic:** Queue changes while offline, sync to correct canvas when reconnected

**PR Review Checklist:**
- [ ] Refreshing page shows all existing shapes from the specific canvas
- [ ] Closing all browsers and reopening shows correct canvas state per canvasId
- [ ] Network disconnect shows status indicator
- [ ] Reconnecting syncs all missed updates from the correct canvas
- [ ] No duplicate shapes after reconnect
- [ ] Multiple refresh cycles don't break canvas state
- [ ] Switching between canvases maintains correct state for each

---

## PR #9: Performance Optimization & Polish
**Goal:** Ensure 60 FPS and handle 500+ objects per canvas  
**Branch:** `feature/performance`

### Tasks:
- [ ] Optimize Konva rendering
  - **Files modified:** `src/components/canvas/Canvas.jsx`
  - **Method:** Add layer caching, limit re-renders
  - **Note:** Critical for canvases with many concurrent users and objects

- [ ] Memoize Shape components
  - **Files modified:** `src/components/canvas/Shape.jsx`
  - **Method:** Wrap in `React.memo()`

- [ ] Add virtualization for many shapes
  - **Files modified:** `src/components/canvas/Canvas.jsx`
  - **Logic:** Only render shapes in viewport (if needed for 500+ objects on a canvas)

- [ ] Optimize cursor updates
  - **Files modified:** `src/hooks/usePresence.js`
  - **Method:** Batch cursor updates, reduce Firebase writes per canvas
  - **Note:** Important since multiple users' cursors tracked per canvas

- [ ] Add loading states
  - **Files created:** `src/components/common/LoadingSpinner.jsx`
  - **Usage:** Show while loading canvas data (dashboard, canvas objects)

- [ ] Performance testing
  - **Testing:** Create 500+ shapes on a single canvas, test FPS with multiple users
  - **Testing:** Test dashboard load time with 20+ canvases
  - **Tool:** Chrome DevTools Performance tab

- [ ] Error boundaries
  - **Files created:** `src/components/common/ErrorBoundary.jsx`
  - **Purpose:** Catch React errors gracefully

- [ ] Polish UI/UX
  - **Files modified:** All component files
  - **Improvements:** Better spacing, colors, hover states

**PR Review Checklist:**
- [ ] Any canvas maintains 60 FPS with pan/zoom
- [ ] 500+ shapes on a single canvas render without FPS drops
- [ ] Cursor movements feel smooth with multiple users on same canvas
- [ ] Dashboard loads quickly with 20+ canvases
- [ ] No console errors or warnings
- [ ] Loading states show appropriately (dashboard, canvas loading)
- [ ] Error states handled gracefully

---

## PR #10: Deployment & Documentation
**Goal:** Deploy to Vercel and finalize documentation  
**Branch:** `deployment/vercel`

### Tasks:
- [ ] Configure Vercel project
  - **Vercel Dashboard:** Connect GitHub repo
  - **Settings:** Set build command (`npm run build`), output directory (`dist`)

- [ ] Set environment variables in Vercel
  - **Vercel Dashboard:** Add all Firebase config variables
  - **Variables:** `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, etc.

- [ ] Test production build locally
  - **Command:** `npm run build && npm run preview`
  - **Verify:** All features work in production mode

- [ ] Configure Firebase for production
  - **Firebase Console:** Add Vercel domain to authorized domains
  - **Firestore:** Review security rules for production

- [ ] Deploy to Vercel
  - **Action:** Push to main branch, auto-deploy
  - **Verify:** Visit Vercel URL, test all features

- [ ] Update README with live demo link
  - **Files modified:** `README.md`
  - **Add:** Live URL, screenshots, demo video instructions

- [ ] Create architecture documentation
  - **Files modified:** `README.md`
  - **Sections:** Data flow, Firebase structure, component hierarchy
  - **Key points:** Single global canvas architecture, all users collaborate on same canvas

- [ ] Write setup instructions
  - **Files modified:** `README.md`
  - **Include:** Clone, install, env setup, Firebase config, local dev
  - **Note:** Explain that all authenticated users access the same global canvas

- [ ] Create MVP demo checklist
  - **Files created:** `MVP_CHECKLIST.md`
  - **List:** All MVP requirements with verification steps

**PR Review Checklist:**
- [ ] App deployed and accessible via public URL
- [ ] All environment variables configured correctly
- [ ] Firebase authentication works on production
- [ ] Real-time sync works on production
- [ ] No CORS or security errors
- [ ] README has clear setup instructions
- [ ] Demo video recorded (if required)

---

## PR #11: Final Testing & Bug Fixes
**Goal:** End-to-end testing and fix any remaining issues  
**Branch:** `testing/mvp-validation`

### Tasks:
- [ ] Run MVP validation tests
  - **Test:** All items from PRD success metrics
  - **Document:** Results in `MVP_CHECKLIST.md`

- [ ] Multi-user and multi-canvas testing
  - **Test:** 5+ users simultaneously on the same canvas
  - **Test:** Multiple users on different canvases (verify isolation)
  - **Verify:** No sync issues, no crashes, all users see correct state per canvas

- [ ] Cross-browser testing
  - **Browsers:** Chrome, Firefox, Safari
  - **Verify:** All features work consistently (dashboard, canvas creation, sharing, sync)

- [ ] Performance under load
  - **Test:** Create 500+ shapes on a single canvas with multiple users
  - **Test:** Create 20+ canvases and verify dashboard performance
  - **Measure:** FPS, sync latency, dashboard load time

- [ ] Bug fixes
  - **Files modified:** Various (based on bugs found)
  - **Priority:** Fix any blocking issues

- [ ] Final polish
  - **Files modified:** Component styling, error messages
  - **Goal:** Professional, polished feel

- [ ] Security review
  - **Files modified:** `firestore.rules`, `firebase.js`
  - **Check:** Proper auth rules, no exposed secrets

**PR Review Checklist:**
- [ ] All MVP requirements met (refer to PRD)
- [ ] Tested with 2+ simultaneous users on the same canvas
- [ ] All users on same canvas see the same state in real-time
- [ ] Canvas isolation verified (changes in canvas A don't affect canvas B)
- [ ] Dashboard works with multiple canvases
- [ ] Share links work correctly
- [ ] Tested on Chrome, Firefox, Safari
- [ ] Performance targets met (60 FPS, <100ms sync) per canvas
- [ ] No critical bugs remaining
- [ ] App feels polished and professional

---

## Quick Reference: Critical Files by Feature

### Authentication
- `src/services/auth.service.js`
- `src/context/AuthContext.jsx`
- `src/components/auth/LoginForm.jsx`
- `src/components/auth/RegisterForm.jsx`

### Dashboard & Canvas Management
- `src/components/dashboard/Dashboard.jsx`
- `src/components/dashboard/CanvasCard.jsx`
- `src/components/dashboard/CreateCanvasModal.jsx`
- `src/components/dashboard/ShareLinkModal.jsx`
- `src/services/canvas.service.js` (canvas metadata)

### Canvas Core
- `src/components/canvas/Canvas.jsx`
- `src/components/canvas/CanvasToolbar.jsx`
- `src/utils/canvasHelpers.js`

### Shapes
- `src/components/canvas/Shape.jsx`
- `src/hooks/useCanvas.js`
- `src/context/CanvasContext.jsx`

### Real-Time Sync (Per Canvas)
- `src/services/canvasObjects.service.js` (canvas objects)
- `src/hooks/useRealtimeSync.js`

### Multiplayer Presence (Per Canvas)
- `src/services/presence.service.js`
- `src/hooks/usePresence.js`
- `src/components/canvas/Cursor.jsx`
- `src/components/presence/OnlineUsers.jsx`

### Firebase Config
- `src/services/firebase.js`
- `.env.local`

---

## Testing Strategy Summary

**Note:** All tests assume a multi-canvas architecture where users can create and manage multiple isolated canvases with per-canvas sync and presence.

### Unit Tests (4 files)
These test pure functions and services in isolation with mocked dependencies:
1. **`tests/unit/canvasHelpers.test.js`** - Canvas math functions (zoom, coordinates)
2. **`tests/unit/auth.service.test.js`** - Authentication service methods
3. **`tests/unit/canvas.service.test.js`** - Canvas metadata service (creation, retrieval, access)
4. **`tests/unit/canvasObjects.service.test.js`** - Canvas objects service (per-canvas CRUD with canvasId)

### Integration Tests (4 files)
These test component interactions and user flows with mocked Firebase:
1. **`tests/integration/auth-flow.test.jsx`** - Complete registration → login → logout flow (redirects to dashboard)
2. **`tests/integration/dashboard-flow.test.jsx`** - Canvas creation, dashboard display, sharing links
3. **`tests/integration/canvas-operations.test.jsx`** - Shape creation, selection, and movement on specific canvas
4. **`tests/integration/realtime-sync.test.jsx`** - Sync logic with mocked Firestore listeners (per-canvas sync and isolation)

### When to Run Tests
- **During Development:** `npm run test -- --watch` for active test file
- **Before PR:** `npm run test` to run all tests
- **PR Gate:** All tests must pass before merging
- **CI/CD:** Configure GitHub Actions to run tests on push (optional but recommended)

### Test Coverage Goals
- **Unit Tests:** 80%+ coverage for utils and services
- **Integration Tests:** All critical user flows covered
- **Manual Testing:** Cross-browser, multi-user, multi-canvas scenarios (PRs #8, #11)

---

## Estimated Timeline (24 Hours)

- **PR #1** - Setup (with testing config): 1.5 hours
- **PR #2** - Auth (with tests): 2.5 hours
- **PR #3** - Dashboard & Canvas Management (with tests): 3 hours (new)
- **PR #4** - Canvas Core (with tests): 2 hours
- **PR #5** - Shapes (with tests): 2 hours
- **PR #6** - Realtime Sync (with tests): 3.5 hours (complex, per-canvas)
- **PR #7** - Presence (with tests): 2.5 hours (per-canvas)
- **PR #8** - Persistence: 1.5 hours
- **PR #9** - Performance: 2 hours
- **PR #10** - Deployment: 1.5 hours
- **PR #11** - Testing & Validation: 2 hours

**Total: 24 hours** (includes time for writing and debugging tests)

---

## Running Tests - Quick Reference

```bash
# Run all tests
npm run test

# Run specific test file
npm run test tests/unit/canvasHelpers.test.js

# Run tests in watch mode (for active development)
npm run test -- --watch

# Run tests with coverage report
npm run test -- --coverage

# Run only unit tests
npm run test tests/unit

# Run only integration tests
npm run test tests/integration
```

---

## Key Benefits of This Testing Strategy

1. **Fast Feedback Loop** - Unit tests run in milliseconds, catch bugs early
2. **Confidence in Refactoring** - Integration tests ensure features work end-to-end
3. **Automated Verification** - Tests validate multi-canvas isolation and per-canvas sync
4. **Documentation** - Test cases serve as usage examples for your code
5. **MVP Validation** - Tests prove core requirements are met before demo