# CollabCanvas - Product Requirements Document

## Project Status: MVP Complete ✅ → Phase 2 Active 🚀

Build a real-time collaborative canvas (Figma-like) where multiple users can simultaneously create, move, and manipulate shapes while seeing each other's cursors and changes in real-time.

**Phase 1 (MVP):** ✅ Complete - Core collaborative infrastructure proven  
**Phase 2 (Active):** Building advanced features and strengthening foundation  
**Timeline:** Quality and completeness over speed

**Architecture:** Multi-canvas architecture with project management. Users can create unlimited canvases, share them via links, and collaborate in real-time. Each canvas has its own isolated workspace with per-canvas presence and sync.

---

## MVP Achievement Summary

### What's Proven and Working ✅
- Real-time object synchronization (<100ms latency)
- Multiplayer cursor presence (<50ms latency)
- Canvas isolation (independent workspaces)
- Dashboard and canvas management
- Authentication and authorization
- 60 FPS performance with 500+ shapes
- **Total: 113/113 tests passing**

### Current Phase 2 Focus
- Infrastructure improvements (conflict detection, persistence, error handling)
- Canvas deletion and trash management
- Building toward undo/redo, state management improvements
- See `/tasks/prd-infrastructure-improvements.md` for current roadmap

---

## User Stories

### Anonymous/New User
- As a new visitor, I want to quickly understand what the app does so I can decide if I want to sign up
- As a new user, I want to create an account with minimal friction so I can start using the app immediately
- As a new user, after logging in I want to see a dashboard where I can create or access my canvases

### Canvas Owner (Primary Persona)
- As a canvas owner, I want to create new canvases so I can start different projects
- As a canvas owner, I want to see all my canvases in a dashboard so I can easily navigate between projects
- As a canvas owner, I want to generate a shareable link for my canvas so I can invite collaborators
- As a canvas owner, I want to see my canvas name, creation date, and last modified time so I can identify my projects

### Canvas User (Editor/Collaborator)
- As a canvas user, I want to access a canvas via a shared link so I can join and collaborate
- As a canvas user, I want to see a large workspace where I can pan and zoom smoothly so I can navigate the design space
- As a canvas user, I want to create basic shapes (rectangles, circles, text) so I can build simple designs
- As a canvas user, I want to move and resize objects so I can arrange the canvas layout
- As a canvas user, I want to see who else is online in this canvas so I know who I'm collaborating with on this project
- As a canvas user, I want to see other users' cursors with their names so I can follow what they're doing
- As a canvas user, I want my changes to appear instantly for all other users in this canvas so we can work together seamlessly
- As a canvas user, I want the canvas to save automatically so I don't lose work if I disconnect

### Collaborative User
- As a team member, I want to see real-time updates when someone creates or moves an object in this canvas so I stay in sync
- As a team member, I want to work simultaneously on the same canvas without breaking things so we can collaborate efficiently
- As a team member, I want to reconnect after a network issue and see all the latest changes so I can continue working

---

## Core Features (MVP Complete ✅)

### 1. Authentication System ✅ COMPLETE
**Implementation:**
- User registration (email/password or social login)
- User login with persistent sessions
- Each user has a display name visible to others
- Simple profile/account management
- Authentication required before accessing any canvas (no anonymous users)
- After successful login, user is directed to their dashboard

**Status:** ✅ Complete - 24 tests passing (15 unit + 9 integration)

### 2. Canvas/Project Management ✅ COMPLETE
**Implementation:**
- Dashboard view showing all canvases the user has created or accessed
- "Create New Canvas" functionality (unlimited canvases per user)
- Each canvas has metadata: name/title, created date, last modified date, owner info
- Canvas thumbnail/preview (optional but nice to have)
- Generate shareable link for any canvas (format: `/canvas/:canvasId`)
- Anyone with link and authentication can access and edit the canvas
- Clicking a shared link adds the canvas to user's dashboard automatically

**Nice to Have (if time permits):**
- Canvas thumbnails/previews
- Sort/filter canvases (by date, name)
- Search canvases

**Explicitly Out of Scope for MVP:**
- Deleting or archiving canvases
- Renaming canvases after creation
- Removing collaborators
- Permission levels (view-only vs edit)
- List of who has access to a canvas
- Canvas templates or duplication

**Status:** ✅ Complete - 32 tests passing (22 unit + 10 integration)

### 3. Canvas Core ✅ COMPLETE
**Implementation:**
- Large workspace (doesn't need to be infinite, but feels spacious)
- Smooth pan (click-drag background)
- Smooth zoom (scroll wheel or pinch)
- 60 FPS performance during all interactions
- Coordinate system for object positioning

**Status:** ✅ Complete - 60 FPS achieved, 16 unit tests passing

### 4. Shape Creation & Manipulation ✅ COMPLETE
**Implementation:**
- At least ONE shape type from: Rectangle, Circle, or Text
- Ability to create new objects (click button → place on canvas)
- Ability to select objects (click to select)
- Ability to move objects (drag selected object)
- Basic visual feedback (selection highlight, hover states)

**Nice to Have (if time permits):**
- Multiple shape types
- Resize handles
- Color picker
- Delete functionality

**Status:** ✅ Complete - 22 integration tests passing

### 5. Real-Time Synchronization ✅ COMPLETE
**Implementation:**
- Broadcast object creation to all users viewing the same canvas
- Broadcast object movement to all users in the same canvas
- Sync updates appear in <100ms
- Last-write-wins conflict resolution (document this choice)
- State persistence (all canvas objects save to database, scoped per canvas)
- Reconnection handling (user rejoins canvas and sees current state)
- Sync is isolated per canvas (changes in canvas A don't affect canvas B)

**Status:** ✅ Complete - Sub-100ms latency achieved, 19 unit tests passing

### 6. Multiplayer Presence ✅ COMPLETE
**Implementation:**
- Display other users' cursor positions in real-time within each canvas
- Show username label next to each cursor
- Cursor position sync in <50ms
- "Who's online" indicator (list of users currently viewing this specific canvas)
- Different cursor colors per user for easy identification
- Presence is isolated per canvas (only see users in the same canvas)

**Status:** ✅ Complete - Sub-50ms latency achieved (16.6ms with throttling)

### 7. Deployment ✅ COMPLETE
**Implementation:**
- Publicly accessible URL (Vercel deployment ready)
- Works on modern browsers (Chrome, Firefox, Safari)
- Handles 5+ concurrent users per canvas
- Supports 500+ objects without FPS drops

**Status:** ✅ Complete - Production-ready infrastructure

---

## Data Model

### Multi-Canvas Architecture
The application uses a multi-canvas data model with isolated workspaces:

**Canvases Collection:**
- Stores metadata for each canvas
- Document ID: unique canvas ID (used in URL `/canvas/:canvasId`)
- Fields:
  - `name`: Canvas title/name
  - `ownerId`: User ID of canvas creator
  - `ownerName`: Display name of owner
  - `createdAt`: Timestamp of creation
  - `updatedAt`: Timestamp of last modification
  - `thumbnail`: (optional) Preview image URL

**Canvas Objects Collection:**
- Stores all objects for all canvases
- Document structure: `/canvas-objects/{canvasId}/objects/{objectId}`
- Each object has: `id`, `type` (rect/circle/text), `x`, `y`, `width`, `height`, `fill`, `createdBy`, `createdAt`, `updatedAt`
- Objects are scoped per canvas for isolation

**User Canvas Access Collection:**
- Tracks which canvases each user has accessed (for dashboard display)
- Document structure: `/user-canvases/{userId}/canvases/{canvasId}`
- Fields: `canvasId`, `accessedAt`, `role` (owner or collaborator)
- Automatically created when user creates or accesses a canvas via link

**User Presence Collection:**
- Stores currently active users per canvas
- Document structure: `/presence/{canvasId}/users/{userId}`
- Fields: `userId`, `displayName`, `cursorX`, `cursorY`, `color`, `lastSeen`
- Automatically cleaned up on disconnect
- Isolated per canvas

**Users Collection:**
- User authentication data (managed by Firebase Auth)
- User profile data: `displayName`, `email`, `createdAt`

---

## Proposed Tech Stack

### Frontend
**Stack: React + Vite + Tailwind CSS + Konva.js**

**Why React:**
- Fast to prototype with hooks for state management
- Large ecosystem and familiar to most developers
- Easy integration with real-time libraries
- Good debugging tools

**Why Vite:**
- Lightning-fast dev server with HMR
- Optimized production builds
- Simple configuration
- Perfect for rapid MVP iteration

**Why Tailwind CSS:**
- Rapid UI development for auth forms and controls
- Utility-first approach speeds up styling
- Small bundle size with purging
- Great for prototyping UI chrome around canvas

**Why Konva.js:**
- Built on HTML5 Canvas for high performance
- Handles pan/zoom/transformations out of the box
- Event system for drag-drop built-in
- Lightweight and well-documented
- Perfect for 60 FPS target

### Backend & Real-Time Sync
**Recommendation: Firebase (Firestore + Authentication)**

**Why Firebase:**
- Real-time database with built-in WebSocket connections
- Authentication system included (email, Google, etc.)
- Hosting included for deployment
- Automatic scaling for concurrent users
- Simple SDK, minimal backend code needed
- Free tier sufficient for MVP testing

**Pros:**
- Fastest path to real-time sync
- No backend server code to write
- Built-in security rules
- Generous free tier

**Cons:**
- Vendor lock-in
- Limited query capabilities (could impact complex AI features later)
- Cost scaling at high usage
- Less control over data flow

**Alternative: Supabase (PostgreSQL + Realtime)**
- Open-source, self-hostable
- More powerful queries (SQL)
- Better for complex data relationships
- Slightly more complex setup

**Alternative: Custom WebSocket Server (Node.js + Socket.io)**
- Maximum control and flexibility
- Better for custom conflict resolution
- More DevOps overhead
- Requires server management

### Deployment
**Recommendation: Vercel (Frontend) + Firebase (Backend/DB)**

**Why:**
- Zero-config deployment from GitHub
- Automatic HTTPS and CDN
- Preview deployments for testing
- Free tier sufficient for MVP

### State Management
**Recommendation: React Context + useReducer**

**Why:**
- Built into React, no extra dependencies
- Sufficient for MVP scope
- Easy to migrate to Zustand/Redux later if needed

---

---

## Phase 2: Active Development 🚀

### Current Sprint: Infrastructure Improvements + Canvas Deletion
See `/tasks/prd-infrastructure-improvements.md` for detailed requirements.

**Focus Areas:**
1. **Infrastructure Reliability**
   - Connection status indicator
   - Viewport persistence  
   - Improved error handling
   - Version tracking for conflict detection

2. **Canvas Management**
   - Delete canvases (soft delete)
   - Trash view with restore
   - Permanent deletion

**Timeline:** ~2 weeks  
**Next Up:** Additional shape types, undo/redo, advanced styling

---

## Feature Backlog (Phase 2+)

### High Priority
- Additional shape types (circles, text, lines, arrows)
- Delete shapes functionality
- Undo/redo system
- Copy/paste shapes
- Rename canvases after creation
- Shape styling controls (colors, borders, opacity)

### Medium Priority
- Resize handles and rotation
- Multi-select shapes
- Keyboard shortcuts
- Shape alignment tools
- Canvas thumbnails/previews
- Permission levels (view-only vs edit)

### Future Enhancements
- AI agent integration
- Advanced transformations (skew, flip)
- Layer management
- Comments and annotations
- Canvas versioning/history
- Export to PNG/SVG
- Mobile optimization
- Freehand drawing

---

## Previously Out of MVP Scope (Now Available)

### Previously Deferred (Now In Scope for Phase 2+):
- 🎯 AI agent integration (future phase)
- 🚧 Deleting or archiving canvases (IN PROGRESS - Phase 2 Sprint 1)
- 🎯 Renaming canvases after creation
- 🎯 Removing collaborators from a canvas
- 🎯 Permission levels (view-only vs edit access)
- 🎯 Explicit list of who has access to a canvas
- 🎯 Canvas templates or duplication
- 🎯 Multiple shape types beyond rectangles (circles, text, lines - high priority)
- 🎯 Advanced transformations (rotation, resize handles, skew)
- 🎯 Layer management UI
- 🎯 Undo/redo functionality (high priority)
- 🎯 Copy/paste shapes
- 🎯 Shape styling beyond basic colors (color picker, gradients, shadows)
- 🎯 Keyboard shortcuts
- 🎯 Export/import functionality (PNG, SVG, PDF)
- 🎯 Collaborative permissions (editor/viewer roles)
- 🎯 Canvas versioning/history
- 🎯 Comments or annotations
- 🎯 Mobile optimization
- 🎯 Operational transform for conflict resolution (advanced)

### Technical Debt Acceptable for MVP:
- Simple "last write wins" conflict resolution
- No optimistic UI updates (show after server confirms)
- No data compression for network efficiency
- Basic error handling (refresh to recover)
- Minimal input validation
- No performance monitoring/analytics

---

## Technical Pitfalls & Considerations

### Performance Risks
**Problem:** Canvas rendering can drop below 60 FPS with many objects
**Mitigation:** 
- Use Konva's layer caching
- Limit re-renders with React.memo
- Debounce cursor position updates
- Test with 500+ objects early

### Real-Time Sync Challenges
**Problem:** Race conditions when multiple users edit simultaneously
**Mitigation:**
- Document "last write wins" strategy clearly
- Use server timestamps for ordering
- Test with 2+ users editing the same object
- Consider object-level locking later (not MVP)

### Firebase Limitations
**Problem:** Firestore has limits on write frequency (1 write/second per document)
**Mitigation:**
- Use separate documents for cursors vs objects
- Batch cursor updates
- Consider Realtime Database instead of Firestore if hit limits

### State Synchronization Complexity
**Problem:** Keeping local state in sync with server state
**Mitigation:**
- Single source of truth (Firebase)
- Subscribe to changes immediately on mount
- Clear reconciliation strategy on reconnect

### Authentication Edge Cases
**Problem:** Anonymous users, session management
**Decision:** Authentication required before canvas access for MVP simplicity. No anonymous or guest access. All users must create an account and log in to access the global shared canvas.

---

## Open Questions & Design Decisions Needed

Before implementation begins, the following details need to be finalized:

### Shape Properties & Behavior
- **Which shape type** for MVP? (Rectangle, Circle, or Text)
- **Size customization:** Fixed size or user-adjustable?
- **Color customization:** Single default color or user-selectable?
- **Text-specific:** If text is chosen, can users edit content after creation? Default font size?

### Shape Creation Flow
- **Placement method:**
  - Option A: Click button → shape appears at viewport center
  - Option B: Click button → click canvas to place
  - Option C: Click button → click and drag to create with custom size

### Data Persistence
- **Save timing:** When are changes written to Firebase?
  - On every mousemove during drag
  - On mouseup after drag completes
  - Debounced (e.g., every 100ms)

### Canvas Configuration
- **Canvas dimensions:** Actual pixel size (e.g., 10,000 x 10,000)?
- **Initial viewport position:** Where users start when first logging in (center, top-left, etc.)?
- **Cursor visibility:** Should users see their own cursor rendered (like others'), or only see other users' cursors?

---

## MVP Success Metrics - ACHIEVED ✅

### Functional Requirements (All Complete)
- ✅ Users can register and log in
- ✅ Users see dashboard after login with "Create New Canvas" button
- ✅ Users can create multiple canvases
- ✅ Dashboard displays all canvases user has created or accessed
- ✅ Users can generate and share canvas links
- ✅ Users can access canvas via shared link
- ✅ Canvas with pan and zoom working
- ✅ At least one shape type can be created
- ✅ Objects can be moved by dragging
- ✅ Real-time sync: changes visible to all users in same canvas <100ms
- ✅ Multiplayer cursors with names visible per canvas
- ✅ "Who's online" presence indicator per canvas
- ✅ Deployed and publicly accessible
- ✅ Works with 2+ simultaneous users on same canvas
- ✅ Multiple canvases can exist independently without interference

### Performance Requirements (All Met)
- 60 FPS during pan/zoom/drag operations on any canvas
- Sync latency <100ms for objects, <50ms for cursors per canvas
- Handles 5+ concurrent users on the same canvas
- No crashes with 500+ objects on a single canvas
- Dashboard loads quickly even with 20+ canvases
