# Product Requirements Document: Conflict Detection & Resolution System

**Feature:** Real-time Collaborative Editing with Conflict Prevention  
**Implementation Strategy:** Two-Tiered Defense (Prevention + Detection)  
**Phase:** Phase 4 - Post-Infrastructure  
**Status:** Planning  
**Date:** October 17, 2025

---

## Executive Summary

As CollabCanvas evolves into a multi-user collaborative platform, we need to prevent data loss when multiple users edit the same canvas objects simultaneously. This PRD outlines a **two-tiered conflict management system** that combines prevention and detection:

### Tier 1: Real-Time Edit Indicators (Prevention)
Visual feedback showing which shapes are currently being edited by which users. This proactive approach prevents most conflicts by making users aware of ongoing edits before they start their own changes.

### Tier 2: Version-Based Conflict Detection (Safety Net)
Automatic detection of conflicting changes through version checking. When conflicts do occur (race conditions, network issues, etc.), the system catches them immediately and guides users to recover gracefully.

**Impact:** This dual approach prevents 80-90% of conflicts through awareness and catches the remaining 10-20% through version validation, ensuring zero data loss while maintaining a smooth, collaborative user experience.

---

## Problem Statement

### Current Issues

1. **Silent Overwrites:** Last-write-wins conflict resolution causes users to unknowingly overwrite each other's changes
2. **No Edit Awareness:** Users don't know when others are editing the same shape
3. **Data Loss Risk:** In high-collaboration scenarios, work can be lost without warning
4. **Poor UX:** No feedback when conflicts occur, leading to confusion and frustration

### User Impact

**Scenario:**
- Alice is moving a rectangle to position (100, 150)
- Bob simultaneously moves the same rectangle to (200, 300)
- Whoever saves last wins, the other user's change is silently lost
- Neither user is aware of the conflict

**Result:** Frustration, lost work, lack of trust in the platform

---

## Goals

### Primary Goals

1. **Prevent Conflicts:** Reduce conflicts by 80-90% through real-time awareness
2. **Zero Data Loss:** Catch all remaining conflicts with version checking
3. **Maintain Performance:** Sub-100ms update latency preserved
4. **Professional UX:** Figma-like collaborative experience

### Secondary Goals

1. Provide clear visual feedback during editing
2. Gracefully handle edge cases (network issues, race conditions)
3. Maintain code simplicity and testability
4. Prepare foundation for future manual conflict resolution UI

### Non-Goals (Out of Scope)

- ❌ Manual conflict resolution UI (future enhancement)
- ❌ Shape locking/permissions system
- ❌ Operational Transform (OT) or CRDT algorithms
- ❌ Edit history/undo across users
- ❌ Real-time text collaboration within shapes

---

## User Stories

### Real-Time Edit Indicators (Prevention Tier)

**Story 1: See Who's Editing**
```
As a canvas user,
When another user is actively editing a shape,
I want to see a visual indicator with their name,
So that I know to wait or edit a different shape.
```

**Acceptance Criteria:**
- Shape shows pulsing colored border when being edited
- Border color matches the editor's cursor color
- Tooltip shows "Alice Smith is editing this shape"
- Indicator appears within 200ms of edit start
- Indicator disappears within 1 second of edit end

---

**Story 2: Start Editing Indicator**
```
As a canvas user,
When I start dragging or editing a shape,
I want other users to see that I'm editing it,
So that they don't try to edit the same shape simultaneously.
```

**Acceptance Criteria:**
- Edit indicator activates on mousedown (drag start)
- Other users see the indicator within 200ms
- Indicator persists during entire drag operation
- Indicator clears on mouseup (drag end)
- Indicator auto-expires after 30s if not cleared

---

**Story 3: Multiple Editors**
```
As a canvas user,
When viewing a canvas with multiple active users,
I want to see edit indicators for all shapes being edited,
So that I can make informed decisions about what to edit.
```

**Acceptance Criteria:**
- Can see multiple edit indicators simultaneously
- Each indicator uses the editor's unique color
- Edit indicators don't interfere with shape interaction
- Performance maintained with 5+ concurrent editors

---

### Version-Based Conflict Detection (Safety Net Tier)

**Story 4: Conflict Detection**
```
As a system,
When a user tries to save changes to a shape,
I need to verify the version matches the server,
So that I can detect if someone else has modified it.
```

**Acceptance Criteria:**
- Version checked before every update
- Mismatch triggers conflict detection
- Original server data retrieved on conflict
- Error thrown with conflict details

---

**Story 5: Conflict Notification**
```
As a canvas user,
When my changes conflict with another user's changes,
I want to be notified immediately with clear information,
So that I understand what happened and can retry my edit.
```

**Acceptance Criteria:**
- Toast notification appears immediately on conflict
- Message shows who made the conflicting change
- Message is clear and non-technical
- Shape reloads to latest server state
- User can immediately retry their edit

---

**Story 6: Automatic Recovery**
```
As a canvas user,
When a conflict is detected,
I want the shape to automatically reload to the latest state,
So that I can see the current version and retry my edit.
```

**Acceptance Criteria:**
- Conflicted shape reverts to server state
- Reversion is smooth (no jarring transitions)
- All other shapes remain unaffected
- User can immediately start new edit

---

## Functional Requirements

### Tier 1: Real-Time Edit Indicators (Prevention)

#### R1.1: Active Edit Tracking

**Description:** Track which shapes are currently being edited by which users

**Requirements:**
- R1.1.1: Create Firestore collection `/active-edits/{canvasId}/shapes/{shapeId}`
- R1.1.2: Write active-edit document on shape edit start (mousedown, drag start)
- R1.1.3: Delete active-edit document on shape edit end (mouseup, drag end)
- R1.1.4: Include userId, userName, color, and timestamp in active-edit
- R1.1.5: Set TTL (time-to-live) of 30 seconds for auto-cleanup
- R1.1.6: Subscribe to active-edits for current canvas in real-time

#### R1.2: Visual Edit Indicators

**Description:** Display visual feedback when shapes are being edited

**Requirements:**
- R1.2.1: Show pulsing colored border around shapes being edited
- R1.2.2: Use editor's cursor color for indicator border
- R1.2.3: Display tooltip with editor's name on hover
- R1.2.4: Indicator appears/disappears with smooth transition
- R1.2.5: Indicator doesn't interfere with shape selection or dragging
- R1.2.6: Multiple indicators supported on different shapes

#### R1.3: Edit State Management

**Description:** Manage edit state lifecycle and cleanup

**Requirements:**
- R1.3.1: Set active-edit on shape drag start
- R1.3.2: Clear active-edit on shape drag end
- R1.3.3: Clear active-edit on canvas unmount
- R1.3.4: Clear active-edit on browser beforeunload
- R1.3.5: Clear active-edit on visibility change (tab switch)
- R1.3.6: Handle stale active-edits (30s expiration)

---

### Tier 2: Version-Based Conflict Detection (Safety Net)

#### R2.1: Version Checking

**Description:** Verify shape version before updates to detect conflicts

**Requirements:**
- R2.1.1: Include `localVersion` parameter in all update operations
- R2.1.2: Fetch current shape version from Firestore before update
- R2.1.3: Compare localVersion with serverVersion
- R2.1.4: If versions match, proceed with update (increment version)
- R2.1.5: If versions mismatch, throw ConflictError
- R2.1.6: Version check must be atomic (race condition safe)

#### R2.2: Conflict Detection

**Description:** Detect and report conflicts when they occur

**Requirements:**
- R2.2.1: Create ConflictError type with details (shapeId, versions, editor)
- R2.2.2: Throw ConflictError when version mismatch detected
- R2.2.3: Include conflicting user information in error
- R2.2.4: Log conflict details for monitoring/debugging
- R2.2.5: Preserve user's local changes in memory (for potential retry)

#### R2.3: Conflict Resolution

**Description:** Automatic recovery from conflicts

**Requirements:**
- R2.3.1: Catch ConflictError in update handlers
- R2.3.2: Display user-friendly toast notification
- R2.3.3: Show who made the conflicting change
- R2.3.4: Reload shape from server (revert to server state)
- R2.3.5: Allow user to immediately retry their edit
- R2.3.6: Maintain canvas stability (other shapes unaffected)

---

## Technical Considerations

### Firestore Data Model

#### New Collection: `active-edits`

**Structure:**
```
/active-edits/{canvasId}/shapes/{shapeId}
```

**Document Schema:**
```typescript
{
  userId: string;           // User ID of editor
  userName: string;         // Display name
  color: string;            // User's cursor color (for indicator)
  startedAt: Timestamp;     // When edit started
  expiresAt: Timestamp;     // Auto-cleanup time (startedAt + 30s)
}
```

**Indexes Required:**
- Single-field index on `expiresAt` (for TTL cleanup)

**Security Rules:**
```javascript
match /active-edits/{canvasId}/shapes/{shapeId} {
  allow read: if userHasCanvasAccess(canvasId);
  allow write: if userHasCanvasAccess(canvasId);
  allow delete: if userHasCanvasAccess(canvasId);
}
```

---

### Updated Service Layer

#### `canvasObjects.service.ts` Changes

**Current:**
```typescript
export async function updateShape(
  canvasId: string,
  shapeId: string,
  updates: Partial<CanvasObject>,
  userId?: string
): Promise<void>
```

**New:**
```typescript
export async function updateShape(
  canvasId: string,
  shapeId: string,
  updates: Partial<CanvasObject>,
  userId?: string,
  localVersion?: number  // NEW: for optimistic locking
): Promise<void>
```

**Behavior:**
1. If `localVersion` provided, check against server version
2. If mismatch, throw `ConflictError`
3. If match or no version, proceed with update
4. Increment version on successful update

---

### Performance Considerations

**Active-Edits Write Frequency:**
- Write on drag start: ~1 write per edit session
- Delete on drag end: ~1 delete per edit session
- Typical edit: 2 Firestore operations
- 10 concurrent editors = 20 operations
- Within Firestore free tier limits ✅

**Version Check Overhead:**
- Additional read before each update
- ~10-30ms latency added
- Negligible impact on perceived performance
- Can be optimized with client-side caching

**Real-time Subscription:**
- 1 active-edits subscription per canvas
- Low data transfer (only active shapes)
- Auto-cleanup reduces stale data

---

### Edge Cases & Handling

#### Case 1: Race Condition (Both Start Editing Simultaneously)

**Scenario:**
```
T+0ms:  Alice clicks shape (no indicator yet)
T+10ms: Bob clicks shape (no indicator yet)
T+50ms: Alice's active-edit writes
T+60ms: Bob's active-edit writes (overwrites)
T+80ms: Both see indicator (Bob's color)
T+100ms: Alice releases, saves (version 6)
T+110ms: Bob releases, tries to save
```

**Handling:**
- Bob's save detects version mismatch (automatic version checking)
- Toast: "Shape was modified by Alice Smith. Reloading..."
- Bob's shape reverts to version 6
- Bob can retry immediately

---

#### Case 2: Network Interruption During Edit

**Scenario:**
```
T+0s:   Alice starts editing → active-edit saved
T+5s:   Alice's network drops
T+10s:  Alice continues editing locally
T+35s:  Active-edit expires (30s TTL)
T+40s:  Bob starts editing (no indicator shown)
T+45s:  Alice's network reconnects
T+46s:  Alice tries to save
```

**Handling:**
- Alice's save detects version mismatch (automatic version checking)
- Toast: "Shape was modified by Bob Smith. Reloading..."
- Alice's shape reverts to Bob's version
- Alice can retry

---

#### Case 3: Browser Tab Close Without Cleanup

**Scenario:**
```
T+0s:   Alice starts editing → active-edit saved
T+5s:   Alice force-closes browser tab
T+6s:   Active-edit remains in Firestore
T+10s:  Bob sees "Alice is editing" (stale)
T+36s:  Active-edit expires (30s TTL)
T+37s:  Indicator clears automatically
```

**Handling:**
- Firestore TTL cleans up stale active-edits
- 30-second timeout acceptable
- Bob can edit after timeout expires
- If Bob edits sooner, version checking catches any conflicts

---

#### Case 4: Multiple Rapid Edits

**Scenario:**
```
T+0s:   Alice drags shape from (0,0) to (100,100)
T+1s:   Alice immediately drags again to (200,200)
T+2s:   Alice drags again to (300,300)
```

**Handling:**
- Each drag creates new active-edit (overwrite)
- Only one active-edit exists per shape
- Rapid updates handled by existing optimistic UI
- Version increments with each update

---

## UI/UX Specifications

### Edit Indicator Visual Design

**Normal Shape (Not Being Edited):**
```
┌─────────────┐
│             │
│   [Shape]   │
│             │
└─────────────┘
```

**Shape Being Edited (by Alice, blue cursor):**
```
┏━━━━━━━━━━━━━┓  ← Pulsing blue border (2px)
┃             ┃
┃   [Shape]   ┃  ← Tooltip: "Alice Smith is editing"
┃             ┃
┗━━━━━━━━━━━━━┛
```

**CSS Animation:**
```css
@keyframes editing-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.shape-being-edited {
  border: 2px solid var(--editor-color);
  animation: editing-pulse 1.5s ease-in-out infinite;
}
```

---

### Conflict Toast Notification

**Design:**
```
┌────────────────────────────────────────────┐
│  ⚠️  Shape Modified                        │
│                                            │
│  Alice Smith made changes while you were  │
│  editing. The shape has been reloaded.    │
│                                            │
│  You can retry your edit now.             │
│                                      [×]   │
└────────────────────────────────────────────┘
```

**Properties:**
- Type: Warning toast (orange/yellow)
- Position: Bottom-right
- Duration: 5 seconds (auto-dismiss)
- Dismissible: Yes (X button)

---

## Implementation Phases

### Phase 1: Version-Based Conflict Detection (2-3 hours)

**Goal:** Implement automatic conflict detection through version checking

**Tasks:**
1. Create ConflictError type
2. Update updateShape to accept localVersion parameter
3. Add version checking logic
4. Add conflict detection and error throwing
5. Update Canvas.tsx to catch ConflictError
6. Add toast notification on conflict
7. Implement automatic shape reload
8. Write unit tests for version checking
9. Write integration tests for conflict scenarios

**Deliverable:** Version-based conflict detection working end-to-end

---

### Phase 2: Real-Time Edit Indicators (4-5 hours)

**Goal:** Implement visual awareness of who's editing what

**Tasks:**
1. Create active-edits Firestore collection
2. Create activeEdits.service.ts (CRUD operations)
3. Create useActiveEdits hook (subscription + management)
4. Update Shape.tsx to show edit indicators
5. Update Canvas.tsx to track edit state
6. Add edit indicator CSS animations
7. Handle cleanup (unmount, beforeunload, visibility)
8. Implement 30s TTL cleanup
9. Write tests for active-edits tracking
10. Write tests for visual indicators

**Deliverable:** Real-time edit indicators showing who's editing what

---

### Phase 3: Documentation & Testing (1-2 hours)

**Tasks:**
1. Document conflict resolution strategy in README
2. Add conflict management section to architecture docs
3. Manual testing with 2+ concurrent users
4. Performance testing (10+ concurrent editors)
5. Edge case testing (network drops, crashes)

**Deliverable:** Complete documentation and validated system

---

## Success Metrics

### Functional Metrics

- ✅ 0% data loss (all conflicts caught by version checking)
- ✅ 80-90% conflict prevention (via real-time edit indicators)
- ✅ 100% of active edits visible within 200ms
- ✅ 100% of conflicts show user-friendly notification

### Performance Metrics

- ✅ Active-edit write latency: < 100ms
- ✅ Indicator display latency: < 200ms
- ✅ Version check overhead: < 50ms per update
- ✅ Total update latency: < 150ms (maintained from current)

### User Experience Metrics

- ✅ Users understand conflict notifications (manual testing)
- ✅ Edit indicators clearly show active editors
- ✅ No confusion about who's editing what
- ✅ Conflicts feel expected, not surprising

---

## Testing Strategy

### Unit Tests

**Version-Based Conflict Detection:**
- Version checking logic (match, mismatch)
- ConflictError creation and details
- Error handling and propagation

**Real-Time Edit Indicators:**
- Active-edit CRUD operations
- TTL expiration logic
- Cleanup handlers

### Integration Tests

**Version-Based Conflict Detection:**
- Conflict detection flow (two users, same shape)
- Toast notification display
- Automatic shape reload

**Real-Time Edit Indicators:**
- Edit indicator appears/disappears
- Multiple concurrent editors
- Cleanup on navigation/unmount

### Manual Testing Scenarios

1. **Two users edit same shape simultaneously**
   - Expected: Edit indicators for both, last saver wins, conflict toast for other

2. **User starts edit, loses network, reconnects**
   - Expected: Conflict detected on save, shape reloaded

3. **User closes tab while editing**
   - Expected: Active-edit expires after 30s, other users can edit

4. **5+ users on same canvas**
   - Expected: All edit indicators visible, performance maintained

---

## Risks & Mitigations

### Risk 1: Firestore Rate Limits

**Risk:** High-frequency active-edit writes could hit Firestore limits

**Mitigation:**
- Throttle active-edit writes (max 1 per second per shape)
- Use client-side debouncing
- Monitor usage via Firebase console

---

### Risk 2: Stale Edit Indicators

**Risk:** Network issues prevent active-edit cleanup, showing stale indicators

**Mitigation:**
- 30-second TTL auto-expires stale edits
- Client-side validation (check lastSeen timestamp)
- Manual cleanup button (future enhancement)

---

### Risk 3: Race Condition Window

**Risk:** ~100ms window where both users can start editing before seeing indicators

**Mitigation:**
- Version-based conflict detection catches all race condition conflicts
- Acceptable trade-off for simplicity
- Future: Add manual conflict resolution UI for better UX

---

### Risk 4: Version Tracking Bugs

**Risk:** Version field missing or not incrementing correctly

**Mitigation:**
- Backward compatibility (default version: 1)
- Extensive unit tests for version logic
- Monitoring/logging for version mismatches

---

## Future Enhancements (Out of Scope)

### Manual Conflict Resolution

**Description:** UI for choosing between conflicting changes when they occur

**Details:** Add a modal that shows both versions side-by-side, allowing users to choose "Keep Mine", "Keep Theirs", or "Merge" when conflicts are detected. Include smart auto-merge for non-overlapping property changes (e.g., one user changed position, other changed color).

**Timeline:** Phase 5 (based on user feedback)

**Trigger:** If users complain about losing edits despite automatic recovery

---

### Shape Locking

**Description:** Hard locks preventing simultaneous edits

**Timeline:** Phase 6+ (if needed)

**Trigger:** If conflicts remain frequent despite real-time edit indicators

---

### Edit History & Undo

**Description:** Cross-user undo/redo functionality

**Timeline:** Major feature (separate PRD)

**Trigger:** User demand for advanced collaboration features

---

## Appendix

### Related Documents

- `tasks/prd-infrastructure-improvements.md` - Version tracking foundation
- `tasks/tasks-conflict-resolution.md` - Implementation task list
- `architecture.md` - System architecture
- `README.md` - User-facing documentation

### References

- Firestore Security Rules: https://firebase.google.com/docs/firestore/security/get-started
- Real-time Updates: https://firebase.google.com/docs/firestore/query-data/listen
- Optimistic Locking Pattern: https://en.wikipedia.org/wiki/Optimistic_concurrency_control

---

**Document Version:** 1.0  
**Last Updated:** October 17, 2025  
**Author:** AI Assistant  
**Status:** Ready for Implementation

