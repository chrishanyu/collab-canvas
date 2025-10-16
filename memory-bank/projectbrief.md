# Project Brief: CollabCanvas MVP

## Vision
Build a real-time collaborative canvas application (Figma-like) where multiple users can simultaneously create, move, and manipulate shapes while seeing each other's cursors and changes in real-time.

## Project Status
**MVP COMPLETE ✅** - Core collaborative infrastructure proven and working

## Core Objectives
1. ✅ **Collaborative infrastructure proven** - Real-time sync and multiplayer presence working
2. ✅ **Multi-canvas architecture** - Users can create unlimited canvases, share via links, collaborate in isolated workspaces
3. 🚀 **Phase 2: Advanced Features** - Building beyond MVP, no timeline constraints

## Key Requirements

### Authentication (Required)
- User registration and login (email/password)
- Display names visible to collaborators
- No anonymous/guest access - authentication required for all features
- After login → redirect to dashboard

### Multi-Canvas Management (Core Feature)
- Dashboard showing all user's canvases
- Unlimited canvas creation per user
- Each canvas has: name, owner, creation/modification dates
- Shareable links: `/canvas/:canvasId`
- Anyone with link + auth can access and edit
- Canvases are completely isolated workspaces

### Canvas Workspace
- Large, responsive workspace with smooth pan and zoom
- 60 FPS performance target
- Basic shape creation: Rectangle (MVP focus)
- Select and move objects by dragging
- Zoom: 0.1x to 3x with mouse wheel
- Pan: drag background

### Real-Time Collaboration (Per Canvas)
- Object sync: changes appear <100ms for all users on same canvas
- Cursor sync: positions appear <50ms for all users on same canvas
- Presence isolation: users only see others on the same canvas
- Last-write-wins conflict resolution
- Auto-save to Firebase (Firestore)
- Reconnection handling

### Multiplayer Presence (Per Canvas)
- See other users' cursors with names
- "Who's online" list (only for current canvas)
- Unique colors per user
- Presence cleanup on disconnect

## Success Criteria
- ✅ Users can register, login, logout
- ✅ Users see dashboard after login
- ✅ Users can create multiple canvases
- ✅ Canvases display in dashboard with metadata
- ✅ Users can generate and share canvas links
- ✅ Canvas supports smooth pan and zoom at 60 FPS
- ✅ Users can create and move shapes
- ✅ Changes sync in real-time across users on same canvas
- ✅ Cursors visible in real-time with names on same canvas
- ✅ Works with 5+ concurrent users per canvas
- ✅ Handles 500+ objects per canvas without FPS drops
- ✅ Deployed and publicly accessible

## Phase 2 Feature Candidates (Now In Scope)
These features were deferred from MVP and are now available to build:
- 🎯 **High Priority Candidates:**
  - Additional shape types (circles, text, lines, arrows, polygons)
  - Shape styling (colors, borders, opacity, shadows)
  - Delete/archive canvases
  - Rename canvases after creation
  - Undo/redo functionality
  - Copy/paste shapes
  - Keyboard shortcuts
  
- 🔮 **Advanced Features:**
  - AI agent integration
  - Permission levels (view-only vs edit)
  - Advanced transformations (rotation, resize handles, skew)
  - Layer management and grouping
  - Comments and annotations
  - Canvas versioning/history
  - Shape alignment and distribution tools
  - Export to PNG/SVG
  - Canvas templates
  
- 📱 **Platform Expansion:**
  - Mobile/tablet optimization
  - Touch gesture support
  - Offline mode improvements

## Development Status
**Phase 1 (MVP):** ✅ Complete
**Phase 2 (Advanced Features):** 🚀 Ready to begin
**No timeline constraints** - Quality and feature completeness over speed

## Technical Constraints
- Must maintain 60 FPS during pan/zoom/drag
- Sync latency: <100ms for objects, <50ms for cursors
- Handle 500+ shapes per canvas
- Support 5+ concurrent users per canvas
- Browser support: Chrome, Firefox, Safari (desktop)

