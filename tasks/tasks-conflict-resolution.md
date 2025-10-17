# Tasks: Conflict Detection & Resolution System

**Based on:** `prd-conflict-resolution.md`  
**Implementation:** Two-Tiered Defense (Prevention + Detection)  
**Phase:** Phase 4 - Conflict Management  
**Status:** Ready for Implementation

---

## Overview

This task list implements a two-tiered conflict management system:
- **Tier 1: Real-Time Edit Indicators (Prevention)** - Visual awareness of who's editing what shapes
- **Tier 2: Version-Based Conflict Detection (Safety Net)** - Automatic conflict detection through version checking

**Estimated Total Time:** 7-10 hours

---

## Relevant Files

### New Files to Create

#### Tier 2: Version-Based Conflict Detection
- `src/types/errors.ts` - ConflictError type definition
- `tests/unit/conflictDetection.test.ts` - Unit tests for conflict detection
- `tests/integration/conflict-scenarios.test.tsx` - Integration tests for conflict flows

#### Tier 1: Real-Time Edit Indicators
- `src/services/activeEdits.service.ts` - Active-edits Firestore CRUD operations
- `src/hooks/useActiveEdits.ts` - Hook for tracking and subscribing to active edits
- `tests/unit/activeEdits.service.test.ts` - Unit tests for activeEdits service
- `tests/unit/useActiveEdits.test.ts` - Unit tests for useActiveEdits hook

### Files to Modify

#### Tier 2: Version-Based Conflict Detection
- `src/services/canvasObjects.service.ts` - Add version checking to updateShape
- `src/components/canvas/Canvas.tsx` - Add conflict error handling

#### Tier 1: Real-Time Edit Indicators
- `src/components/canvas/Shape.tsx` - Add edit indicator visual feedback
- `src/components/canvas/Canvas.tsx` - Track edit state and active-edits

#### Documentation
- `README.md` - Add Conflict Resolution Strategy section

### Notes
- Use `npm run test` to run all tests
- Use `npm run test [path]` to run specific test file
- Test with multiple browsers for real-time collaboration scenarios

---

## Tasks

### Phase 1: Version-Based Conflict Detection (Safety Net) ⭐ **START HERE**

- [x] 1.0 **Create ConflictError Type**
  - [x] 1.1 Create file: `src/types/errors.ts`
  - [x] 1.2 Define `ConflictError` class extending Error
  - [x] 1.3 Add fields: `shapeId`, `localVersion`, `serverVersion`, `lastEditedBy`, `lastEditedByName`
  - [x] 1.4 Add constructor to set error name and message
  - [x] 1.5 Export ConflictError from `src/types/index.ts`
  - [x] 1.6 Add JSDoc documentation explaining when this error is thrown

- [x] 2.0 **Implement Version Checking in updateShape**
  - [x] 2.1 Open `src/services/canvasObjects.service.ts`
  - [x] 2.2 Update `updateShape` signature to include optional `localVersion?: number` parameter
  - [x] 2.3 Before updating, fetch current shape: `const currentSnap = await getDoc(shapeRef)`
  - [x] 2.4 Get current version: `const serverVersion = currentSnap.data()?.version || 1`
  - [x] 2.5 If `localVersion` provided, compare: `if (localVersion !== serverVersion)`
  - [x] 2.6 If mismatch, get lastEditedBy: `const lastEditor = currentSnap.data()?.lastEditedBy`
  - [x] 2.7 Throw ConflictError with all details (shapeId, localVersion, serverVersion, lastEditor)
  - [x] 2.8 If match or no localVersion, proceed with update as normal
  - [x] 2.9 Update JSDoc to document the localVersion parameter and ConflictError
  - [x] 2.10 Add try-catch to distinguish ConflictError from other Firestore errors

- [x] 3.0 **Add Conflict Handling in Canvas Component**
  - [x] 3.1 Open `src/components/canvas/Canvas.tsx`
  - [x] 3.2 In `handleShapeDragEnd`, wrap `updateShapeInFirebase` in try-catch
  - [x] 3.3 Import ConflictError: `import { ConflictError } from '../../types/errors'`
  - [x] 3.4 Catch ConflictError specifically: `catch (error) { if (error instanceof ConflictError) {...} }`
  - [x] 3.5 On ConflictError, get conflicting user's name (if available, else show "Another user")
  - [x] 3.6 Show toast: `showWarning(\`Shape was modified by \${userName}. Reloading...\`)`
  - [x] 3.7 Revert shape to server state: realtime sync will provide latest
  - [x] 3.8 Update local shapes state with server version (via revert to original)
  - [x] 3.9 Ensure other (non-conflicted) shapes remain unchanged
  - [x] 3.10 Pass shape's current version as localVersion to updateShapeInFirebase
  - [x] 3.11 Test: Verify conflicted shape reverts and toast appears

- [x] 4.0 **Unit Tests for Version Checking**
  - [x] 4.1 Create file: `tests/unit/conflictDetection.test.ts`
  - [x] 4.2 Mock Firestore functions: `getDoc`, `updateDoc`, `increment`
  - [x] 4.3 Test: "updateShape succeeds when versions match"
  - [x] 4.4 Test: "updateShape throws ConflictError when versions mismatch"
  - [x] 4.5 Test: "ConflictError includes shapeId, versions, and lastEditedBy"
  - [x] 4.6 Test: "updateShape proceeds normally when localVersion not provided"
  - [x] 4.7 Test: "updateShape handles missing version field (backward compatibility)"
  - [x] 4.8 Test: "ConflictError distinguishable from other Firestore errors"
  - [x] 4.9 Run tests: `npm run test tests/unit/conflictDetection.test.ts` - ✅ 13/13 passing

- [x] 5.0 **Integration Tests for Conflict Scenarios**
  - [x] 5.1 Create file: `tests/integration/conflict-scenarios.test.tsx`
  - [x] 5.2 Mock two users: User A and User B
  - [x] 5.3 Test: "Conflict toast appears when versions mismatch"
  - [x] 5.4 Test: "Conflicted shape reverts to server version"
  - [x] 5.5 Test: "Other shapes remain unaffected by conflict"
  - [x] 5.6 Test: "User can retry edit after conflict"
  - [x] 5.7 Test: "Toast shows conflicting user's name"
  - [x] 5.8 Test: "No conflict when versions match"
  - [x] 5.9 Run tests: `npm run test tests/integration/conflict-scenarios.test.tsx` - ✅ 10/10 passing

---

### Phase 2: Real-Time Edit Indicators (Prevention)

- [x] 6.0 **Create Active-Edits Firestore Service**
  - [x] 6.1 Create file: `src/services/activeEdits.service.ts`
  - [x] 6.2 Import Firestore functions: `collection`, `doc`, `setDoc`, `deleteDoc`, `onSnapshot`, `serverTimestamp`
  - [x] 6.3 Define `ActiveEdit` interface: `{ userId, userName, color, startedAt, expiresAt }`
  - [x] 6.4 Create `getActiveEditsCollection(canvasId)` helper function
  - [x] 6.5 Create `getActiveEditDoc(canvasId, shapeId)` helper function
  - [x] 6.6 Implement `setActiveEdit(canvasId, shapeId, userId, userName, color)` function
  - [x] 6.7 In setActiveEdit, set `startedAt: serverTimestamp()` and `expiresAt: startedAt + 30s`
  - [x] 6.8 Implement `clearActiveEdit(canvasId, shapeId)` using `deleteDoc`
  - [x] 6.9 Implement `subscribeToActiveEdits(canvasId, callback)` using `onSnapshot`
  - [x] 6.10 In subscription, map docs to `Map<shapeId, ActiveEdit>`
  - [x] 6.11 Return unsubscribe function from subscription
  - [x] 6.12 Add JSDoc comments for all functions
  - [x] 6.13 Export all functions

- [x] 7.0 **Create useActiveEdits Hook**
  - [x] 7.1 Create file: `src/hooks/useActiveEdits.ts`
  - [x] 7.2 Hook parameters: `(canvasId: string, currentUserId: string)`
  - [x] 7.3 State: `const [activeEdits, setActiveEdits] = useState<Map<string, ActiveEdit>>(new Map())`
  - [x] 7.4 useEffect to subscribe to activeEdits: `subscribeToActiveEdits(canvasId, setActiveEdits)`
  - [x] 7.5 Return unsubscribe on cleanup
  - [x] 7.6 Function: `setShapeEditing(shapeId, userName, color)` - calls `setActiveEdit`
  - [x] 7.7 Function: `clearShapeEditing(shapeId)` - calls `clearActiveEdit`
  - [x] 7.8 Function: `isShapeBeingEdited(shapeId)` - checks if shapeId in activeEdits map
  - [x] 7.9 Function: `getShapeEditor(shapeId)` - returns ActiveEdit for shape or undefined
  - [x] 7.10 Cleanup all active edits on unmount: `activeEdits.forEach(clearShapeEditing)`
  - [x] 7.11 Return: `{ activeEdits, setShapeEditing, clearShapeEditing, isShapeBeingEdited, getShapeEditor }`
  - [x] 7.12 Add JSDoc documentation

- [x] 8.0 **Add Edit Indicators to Shape Component**
  - [x] 8.1 Open `src/components/canvas/Shape.tsx`
  - [x] 8.2 Add props: `isBeingEdited?: boolean`, `editorName?: string`, `editorColor?: string`
  - [x] 8.3 Create visual indicator: dashed border with editor's color
  - [x] 8.4 In Shape component, conditionally apply stroke styling based on state
  - [x] 8.5 Set border color dynamically using editorColor prop
  - [x] 8.6 Add tooltip when hovered: container.title shows editor name
  - [x] 8.7 Use Konva dash property for visual distinction (dashed border)
  - [x] 8.8 Style: strokeWidth: 2px with dash pattern [8, 4]
  - [x] 8.9 Ensure indicator doesn't interfere with selection or dragging (priority: selected > editing > hover)
  - [x] 8.10 Update React.memo comparison to include edit indicator props

- [x] 9.0 **Integrate Active-Edits Tracking in Canvas**
  - [x] 9.1 Open `src/components/canvas/Canvas.tsx`
  - [x] 9.2 Import `useActiveEdits` hook and `getUserCursorColor`
  - [x] 9.3 Initialize hook: `const { setShapeEditing, clearShapeEditing, getShapeEditor } = useActiveEdits(canvasId, currentUser.id)`
  - [x] 9.4 Get user's cursor color: `getUserCursorColor(currentUser.id, currentUser.id)`
  - [x] 9.5 In `handleShapeDragStart`, call `setShapeEditing(shapeId, currentUser.displayName, userColor)`
  - [x] 9.6 In `handleShapeDragEnd`, call `clearShapeEditing(shapeId)`
  - [x] 9.7 When rendering shapes, pass edit indicator props to each Shape component
  - [x] 9.8 For each shape: `const editor = getShapeEditor(shape.id)`
  - [x] 9.9 Pass props: `isBeingEdited={!!editor}`, `editorName={editor?.userName}`, `editorColor={editor?.color}`
  - [x] 9.10 Cleanup handled by useActiveEdits hook (automatic on unmount)
  - [x] 9.11 beforeunload handler not needed (useActiveEdits hook handles cleanup)
  - [x] 9.12 visibilitychange handler not needed (useActiveEdits hook handles cleanup)

- [x] 10.0 **Unit Tests for activeEdits.service**
  - [x] 10.1 Create file: `tests/unit/activeEdits.service.test.ts`
  - [x] 10.2 Mock Firestore functions: `setDoc`, `deleteDoc`, `onSnapshot`, `collection`, `doc`
  - [x] 10.3 Test: "setActiveEdit writes correct data to Firestore"
  - [x] 10.4 Test: "setActiveEdit sets expiresAt to 30 seconds from now"
  - [x] 10.5 Test: "clearActiveEdit deletes document from Firestore"
  - [x] 10.6 Test: "subscribeToActiveEdits calls callback with active edits map"
  - [x] 10.7 Test: "subscribeToActiveEdits returns unsubscribe function"
  - [x] 10.8 Test: "activeEdits scoped per canvas (isolation)"
  - [x] 10.9 Run tests: `npm run test tests/unit/activeEdits.service.test.ts` - ✅ 13/13 passing

- [x] 11.0 **Unit Tests for useActiveEdits Hook**
  - [x] 11.1 Create file: `tests/unit/useActiveEdits.test.ts`
  - [x] 11.2 Mock activeEdits.service functions
  - [x] 11.3 Test: "useActiveEdits subscribes to active edits on mount"
  - [x] 11.4 Test: "setShapeEditing calls service with correct parameters"
  - [x] 11.5 Test: "clearShapeEditing calls service to delete active edit"
  - [x] 11.6 Test: "isShapeBeingEdited returns true when shape in active edits"
  - [x] 11.7 Test: "getShapeEditor returns editor info when shape being edited"
  - [x] 11.8 Test: "useActiveEdits cleans up subscription on unmount"
  - [x] 11.9 Test: "useActiveEdits clears all active edits on unmount"
  - [x] 11.10 Run tests: `npm run test tests/unit/useActiveEdits.test.ts` - ✅ 19/19 passing

- [x] 12.0 **Integration Tests for Edit Indicators**
  - [x] 12.1 Extend file: `tests/integration/conflict-scenarios.test.tsx`
  - [x] 12.2 Test: "Edit indicator appears when user starts editing shape"
  - [x] 12.3 Test: "Edit indicator shows correct user name and color"
  - [x] 12.4 Test: "Edit indicator disappears when user stops editing"
  - [x] 12.5 Test: "Multiple edit indicators show for different shapes"
  - [x] 12.6 Test: "Edit indicator clears on canvas unmount"
  - [x] 12.7 Test: "Stale edit indicators expire after 30 seconds"
  - [x] 12.8 Run tests: `npm run test tests/integration/conflict-scenarios.test.tsx` - ✅ 20/20 passing

---

### Phase 3: Documentation & Testing

- [x] 13.0 **Document Conflict Resolution in README**
  - [x] 13.1 Open `README.md`
  - [x] 13.2 Find or create "## Features" section
  - [x] 13.3 Add feature: "🔒 **Conflict Management** - Real-time edit indicators and automatic conflict detection"
  - [x] 13.4 Find or create "## Architecture" section
  - [x] 13.5 Add new section: "### Conflict Resolution Strategy"
  - [x] 13.6 Document Tier 1: Real-time Edit Indicators (Prevention)
  - [x] 13.7 Explain visual feedback: dashed border, editor name, color-coding
  - [x] 13.8 Document Tier 2: Version-Based Conflict Detection (Safety Net)
  - [x] 13.9 Explain version checking, ConflictError, automatic recovery
  - [x] 13.10 Add subsection: "How It Works" with step-by-step flow
  - [x] 13.11 Add subsection: "Edge Cases" explaining race conditions, network issues, etc.
  - [x] 13.12 Add subsection: "Firestore Collections" documenting active-edits structure (already present)
  - [x] 13.13 Add code example showing the two-tier protection
  - [x] 13.14 Add note about 30-second TTL for active-edits cleanup
  - [x] 13.15 Update Firebase Collections section to include active-edits (already present)

- [ ] 14.0 **Manual Testing & Validation**
  - [ ] 14.1 Manual test: Open canvas in two browser windows
  - [ ] 14.2 Manual test: User A starts dragging shape, verify User B sees edit indicator
  - [ ] 14.3 Manual test: Verify indicator shows correct name and color
  - [ ] 14.4 Manual test: User A releases drag, verify indicator disappears for User B
  - [ ] 14.5 Manual test: Both users start dragging same shape simultaneously
  - [ ] 14.6 Manual test: Verify one user gets conflict toast, shape reloads
  - [ ] 14.7 Manual test: User A starts editing, closes browser tab
  - [ ] 14.8 Manual test: Verify indicator expires after ~30 seconds
  - [ ] 14.9 Manual test: Disconnect network while editing, reconnect and save
  - [ ] 14.10 Manual test: Verify conflict detected, toast shown, shape reloaded
  - [ ] 14.11 Manual test: Test with 5+ concurrent users
  - [ ] 14.12 Manual test: Verify all indicators visible, performance maintained
  - [ ] 14.13 Run all automated tests: `npm run test`
  - [ ] 14.14 Verify 100% passing, no console errors

- [ ] 15.0 **Performance & Edge Case Testing**
  - [ ] 15.1 Performance test: Create canvas with 50+ shapes
  - [ ] 15.2 Performance test: Have 5+ users editing different shapes
  - [ ] 15.3 Performance test: Verify update latency < 150ms
  - [ ] 15.4 Performance test: Verify indicator appears within 200ms
  - [ ] 15.5 Edge case: Force quit browser during edit
  - [ ] 15.6 Edge case: Verify active-edit expires, no orphaned indicators
  - [ ] 15.7 Edge case: Rapidly edit same shape back-and-forth
  - [ ] 15.8 Edge case: Verify version increments correctly
  - [ ] 15.9 Edge case: Edit shape, lose network for 1 minute, reconnect
  - [ ] 15.10 Edge case: Verify conflict caught when reconnecting
  - [ ] 15.11 Check Firestore console: Verify active-edits collection structure
  - [ ] 15.12 Check Firestore console: Verify TTL cleanup working (no stale docs)

---

## Task Breakdown Summary

### Phase 1: Version-Based Conflict Detection (2-3 hours)
- ✅ 5 parent tasks
- ✅ 39 detailed subtasks
- Focus: Version checking, conflict detection, automatic recovery

### Phase 2: Real-Time Edit Indicators (4-5 hours)
- ✅ 7 parent tasks  
- ✅ 72 detailed subtasks
- Focus: Active-edits tracking, visual indicators, real-time subscriptions

### Phase 3: Documentation & Testing (1-2 hours)
- ✅ 3 parent tasks
- ✅ 47 detailed subtasks
- Focus: README documentation, manual testing, performance validation

**Total:** 15 parent tasks, 158 detailed subtasks

---

## Success Criteria

### Functional Requirements
- ✅ All conflicts detected (0% data loss)
- ✅ Edit indicators appear within 200ms
- ✅ Conflict toast shows who made conflicting change
- ✅ Conflicted shapes automatically reload
- ✅ Multiple concurrent editors supported

### Performance Requirements
- ✅ Update latency maintained: < 150ms
- ✅ Active-edit write latency: < 100ms
- ✅ Indicator display latency: < 200ms
- ✅ 60 FPS maintained with indicators

### Testing Requirements
- ✅ All unit tests passing (version checking, active-edits)
- ✅ All integration tests passing (conflict flows, indicators)
- ✅ Manual testing validated with 2+ concurrent users
- ✅ Edge cases tested (network drops, crashes, race conditions)

### Documentation Requirements
- ✅ README updated with Conflict Resolution Strategy section
- ✅ Code documented with JSDoc comments
- ✅ Firestore collection structure documented
- ✅ Edge cases and limitations documented

---

## Next Steps After Completion

### Immediate (If Needed)
1. Monitor production for conflict frequency
2. Gather user feedback on edit indicators
3. Check Firestore usage (ensure within limits)

### Future Enhancements (Phase 5+)
1. **Manual Conflict Resolution UI**
   - Add conflict resolution modal
   - Allow users to choose between versions
   - Implement smart auto-merge for non-overlapping changes

2. **Advanced Features**
   - Shape locking (hard locks for critical edits)
   - Edit history with cross-user undo
   - Conflict analytics dashboard

3. **Optimizations**
   - Client-side caching for version checks
   - Batch active-edit updates
   - Predictive conflict detection

---

## Dependencies

### Technical Dependencies
- Firebase Firestore (existing)
- react-toastify (existing, for conflict notifications)
- Existing version tracking infrastructure (completed in Phase 3)

### Prerequisite Tasks
- ✅ Phase 3 complete (version tracking foundation)
- ✅ Toast notification system in place
- ✅ User presence system (for cursor colors)

---

## Notes

### Implementation Tips
1. **Start with Phase 1** - Version checking is the critical safety net
2. **Test thoroughly** - Conflict detection is critical for data integrity
3. **Manual testing essential** - Need real multi-user scenarios
4. **Monitor performance** - Active-edits adds Firestore operations
5. **Document edge cases** - Help future developers understand limitations

### Common Pitfalls to Avoid
- ❌ Forgetting to pass localVersion when updating shapes
- ❌ Not cleaning up active-edits on unmount/navigation
- ❌ Relying only on edit indicators (need version checking as safety net)
- ❌ Not handling ConflictError specifically (treating as generic error)
- ❌ Forgetting to test race conditions and network issues

---

**Ready to implement!** 🚀

Start with Task 1.0 and work sequentially through each phase.

