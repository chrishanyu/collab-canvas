# PRD: Infrastructure Improvements & Canvas Deletion

**Status:** Phase 2 - Post-MVP  
**Priority:** High  
**Date:** October 15, 2025

---

## Introduction/Overview

With the MVP complete and collaborative infrastructure proven, we need to strengthen the foundation before building advanced features. This PRD covers critical infrastructure improvements (real-time sync reliability, conflict handling, persistence) plus the first user-requested feature: canvas deletion.

**Problem:** Current infrastructure uses Last-Write-Wins conflict resolution (data loss risk), lacks connection status visibility, and doesn't persist viewport state across page refreshes. Users also need the ability to delete canvases.

**Goal:** Improve reliability, user confidence, and data safety while adding essential canvas management functionality.

---

## Goals

1. **Improve User Confidence:** Show connection status, pending changes, and handle errors gracefully
2. **Prevent Data Loss:** Detect conflicts when multiple users edit simultaneously
3. **Improve UX:** Persist viewport state, provide better error messages
4. **Enable Canvas Management:** Users can permanently delete canvases they no longer need
5. **Maintain Performance:** Keep 60 FPS and sub-100ms sync latency

---

## User Stories

### Infrastructure
1. As a user, I want to know if I'm offline so I understand why my changes aren't syncing
2. As a user, I want my zoom level and position preserved when I refresh so I don't lose my place
3. As a user, I want to see which changes are pending (not yet saved) so I know when to wait
4. As a user, I want clear error messages when something fails so I know what to do
5. As a collaborator, I want to know if my change conflicts with another user's so I can resolve it

### Canvas Deletion
6. As a canvas owner, I want to permanently delete canvases I no longer need so my dashboard stays organized
7. As a canvas owner, I want a confirmation dialog before deletion so I don't accidentally delete important work
8. As a canvas owner, I want clear feedback after deletion so I know the operation succeeded

---

## Functional Requirements

### Infrastructure Improvements

#### FR-1: Connection Status Indicator
1.1. The system must display connection status in the header (Connected/Disconnected/Reconnecting)  
1.2. When offline, show yellow warning banner: "⚠️ Offline - Changes will sync when reconnected"  
1.3. When reconnecting, show: "⚠️ Reconnecting..."  
1.4. When back online, briefly show success: "✓ Connected" then auto-dismiss after 3 seconds  
1.5. Use Firebase `.info/connected` to detect connection state  

#### FR-2: Viewport Persistence
2.1. The system must save zoom level to localStorage when user zooms  
2.2. The system must save pan position (x, y) to localStorage when user pans  
2.3. The system must restore saved viewport state when canvas loads  
2.4. Viewport state must be stored per-canvas (different for each canvas)  
2.5. Use debouncing (500ms) to avoid excessive localStorage writes  
2.6. Storage key format: `canvas-viewport-{canvasId}`  

#### FR-3: Improved Error Handling
3.1. When shape creation fails, revert optimistic update and show toast: "Failed to create shape"  
3.2. When shape update fails, revert optimistic update and show toast: "Failed to save changes"  
3.3. All error toasts must include a "Retry" button  
3.4. Errors must be logged to console with full context for debugging  
3.5. Network errors should suggest checking connection  

#### FR-4: Pending Changes Indicator (Optional - Nice to Have)
4.1. Mark optimistic updates with `_pending: true` flag  
4.2. Show pending shapes with 70% opacity and dashed border  
4.3. Remove `_pending` flag when Firestore confirms the change  
4.4. Show count of pending changes in header: "⏳ 2 changes pending"  

#### FR-5: Conflict Detection Foundation
5.1. Add `version` field to CanvasObject type (starts at 1)  
5.2. Increment version on every update  
5.3. Add `lastEditedBy` field to track who last modified  
5.4. Include `updatedAt` server timestamp on all updates  
5.5. No conflict resolution UI yet (foundation only for Phase 3)  

### Canvas Deletion

#### FR-6: Permanent Delete Canvas
6.1. Canvas owner can click "Delete" button on canvas card  
6.2. Show confirmation dialog: "Delete {canvas name}? This cannot be undone!"  
6.3. On confirm, permanently delete canvas document from Firestore  
6.4. Delete all canvas objects (batch delete from `/canvas-objects/{canvasId}/objects/{objectId}`)  
6.5. Delete user access records for this canvas  
6.6. Only canvas owner can delete (check `ownerId === currentUser.id`)  
6.7. Canvas immediately removed from dashboard  
6.8. Show success toast: "Canvas deleted"  
6.9. Handle errors gracefully with user-facing error messages  

---

## Non-Goals (Out of Scope)

### Infrastructure
- ❌ Full Operational Transformation (complex, save for later)
- ❌ Conflict resolution UI (detection only, resolution in Phase 3)
- ❌ Offline mode with queued changes (Firebase handles basic offline)
- ❌ Migration to Zustand (separate effort, enables undo/redo later)
- ❌ Performance monitoring/analytics dashboard

### Canvas Deletion
- ❌ Soft delete with trash/restore (hard delete only for simplicity)
- ❌ Bulk operations (select multiple canvases to delete)
- ❌ Canvas size/storage limits
- ❌ Email notifications before deletion
- ❌ Undo after deletion (permanent delete only)
- ❌ Canvas versioning or backups

---

## Design Considerations

### Connection Status UI
- Fixed position in top-right of canvas header
- Colors: Green (connected), Yellow (reconnecting), Red (offline)
- Animated pulse for "reconnecting" state
- Auto-dismiss "connected" notification after 3 seconds

### Deletion Confirmation UI
- Modal dialog with canvas name and warning message
- Red "Delete" button (danger state)
- Gray "Cancel" button
- Clear warning: "This cannot be undone"
- Optional: Show what will be deleted (X shapes, created on date)

### Error Toasts
- Bottom-right corner position
- 5-second auto-dismiss (unless user interacts)
- Red background for errors
- Include retry button when applicable
- Stack multiple toasts if needed

---

## Technical Considerations

### Firebase Security Rules
- Ensure only canvas owners can delete canvases (check `ownerId === currentUser.id`)
- Deletion requires write permission to canvas document and all subcollections
- Read access remains the same (authenticated users can read all canvases)

### Data Model
- No additional fields needed for Canvas interface
- Deletion is immediate and permanent
- Clean up related collections on delete

### Performance
- Viewport persistence uses debouncing to avoid excessive localStorage writes
- Batch delete for canvas objects (use Firestore `writeBatch`)
- Deletion operations should complete in <2 seconds

### Testing
- Mock Firebase connection status changes
- Test localStorage persistence and restoration
- Test deletion permissions (owner vs non-owner)
- Test permanent deletion cleans up all related data (canvas, objects, access records)
- Test deletion error handling and rollback scenarios

---

## Success Metrics

### Infrastructure
1. **Reliability:** Zero data loss from conflicts during testing
2. **UX Improvement:** User sees connection status 100% of the time
3. **Persistence:** Viewport state restored correctly on all page refreshes
4. **Error Handling:** All errors show user-facing messages (no silent failures)

### Canvas Deletion
1. **Functionality:** Users can permanently delete canvases they own
2. **Safety:** Confirmation dialog prevents accidental deletion
3. **Permissions:** Non-owners cannot delete canvases (security works)
4. **Performance:** Deletion operations complete in <2 seconds
5. **Cleanup:** All related data (objects, access records) deleted

---

## Open Questions

1. **Connection Status:** Should we show connection status on Dashboard too, or only on Canvas view?
   - **Decision:** Canvas view only for now (most critical)

2. **Viewport Persistence:** Should we also persist selected shape ID?
   - **Decision:** No - clearing selection on refresh is expected behavior

3. **Deletion Approach:** Soft delete with trash or permanent delete?
   - **Decision:** Permanent delete - simpler implementation, users want it gone

4. **Conflict Detection:** Should we track version for ALL fields or just position?
   - **Decision:** All fields for now (simpler implementation)

5. **Delete Confirmation:** Single or double confirmation?
   - **Decision:** Single modal confirmation with clear warning text

---

## Implementation Phases

### Phase 1: Canvas Deletion (Priority)
- Backend deletion service method with ownership verification
- Delete button and confirmation dialog UI
- Permanent deletion of canvas and all related data
- Comprehensive testing of deletion flow and permissions

### Phase 2: Infrastructure Wins
- Connection status indicator
- Viewport persistence with localStorage
- Improved error handling with toasts

### Phase 3: Conflict Detection Foundation
- Version tracking in data model
- Conflict detection logic
- Comprehensive testing of all features

---

## Dependencies

- Existing Firebase setup (already configured)
- React Toastify or similar for toast notifications (need to add)
- No new external dependencies required

---

## Acceptance Criteria

### Infrastructure
- [ ] Connection status visible in canvas header
- [ ] Offline state shows warning banner
- [ ] Viewport state (zoom, pan) persists across page refreshes
- [ ] Failed operations show error toasts with retry option
- [ ] Version field added to CanvasObject type
- [ ] All operations maintain 60 FPS performance

### Canvas Deletion
- [ ] Canvas owners see delete button on their canvas cards
- [ ] Non-owners do not see delete button
- [ ] Delete permanently removes canvas and all related data
- [ ] Confirmation dialog prevents accidental deletion
- [ ] Canvas document deleted from Firestore
- [ ] All canvas objects deleted (batch operation)
- [ ] User access records cleaned up
- [ ] Deletion completes in <2 seconds
- [ ] Success toast shown after deletion
- [ ] Errors handled gracefully

### Testing
- [ ] Unit tests for all service methods
- [ ] Integration tests for deletion flow
- [ ] Manual testing with multiple users
- [ ] Edge case testing (network failures, permission checks)

---

## Timeline Estimate

| Task | Estimate |
|------|----------|
| Connection status indicator | 1 day |
| Viewport persistence | 1 day |
| Error handling improvements | 1 day |
| Canvas deletion backend | 0.5 days |
| Canvas deletion UI | 1 day |
| Testing and polish | 0.5 days |
| **Total** | **6 days (~1.5 weeks)** |

---

## Notes for Implementation

1. **Start with canvas deletion** - High priority user request, needs careful implementation
2. **Test deletion thoroughly** - CRITICAL: Permanent data loss risk if permissions or cleanup fails
3. **Verify ownership checks** - Must ensure only canvas owners can delete
4. **Test all cleanup paths** - Canvas document, all objects, all access records must be deleted
5. **Keep performance in mind** - Debounce localStorage, batch Firestore deletes
6. **Document decisions** - Version tracking is foundation for future conflict resolution

---

**Approved By:** [Pending]  
**Start Date:** [TBD]  
**Target Completion:** 1.5 weeks from start

