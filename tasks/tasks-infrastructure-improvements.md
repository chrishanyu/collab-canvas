# Tasks: Infrastructure Improvements & Canvas Deletion

**Based on:** `prd-infrastructure-improvements.md`  
**Phase:** Phase 2 - Post-MVP  
**Status:** Parent tasks defined, awaiting confirmation for sub-tasks

---

## Relevant Files

### Infrastructure - Connection Status
- `src/components/canvas/Canvas.tsx` - Add connection status indicator to header
- `src/hooks/useConnectionStatus.ts` - New hook to track Firestore connection state using network detection
- `src/components/common/ConnectionIndicator.tsx` - New component for connection status UI
- `tests/unit/useConnectionStatus.test.ts` - Unit tests for connection status hook
- `tests/unit/ConnectionIndicator.test.tsx` - Tests for connection indicator component

### Infrastructure - Viewport Persistence  
- `src/hooks/usePersistedViewport.ts` - New hook for saving/restoring viewport state
- `src/components/canvas/Canvas.tsx` - Integrate persisted viewport hook
- `tests/unit/usePersistedViewport.test.ts` - Tests for viewport persistence

### Infrastructure - Error Handling
- `src/components/common/Toast.tsx` - New toast notification component
- `src/components/common/Toast.test.tsx` - Tests for toast component
- `src/hooks/useToast.ts` - Hook for showing toast notifications
- `src/components/canvas/Canvas.tsx` - Update error handling to use toasts
- `src/services/canvasObjects.service.ts` - Improve error throwing and messages

### Infrastructure - Version Tracking
- `src/types/index.ts` - Add version field to CanvasObject interface
- `src/services/canvasObjects.service.ts` - Update create/update to handle versioning
- `tests/unit/canvasObjects.service.test.ts` - Add version tracking tests

### Canvas Deletion - Backend
- `src/services/canvas.service.ts` - Add deleteCanvas method (permanent deletion)
- `tests/unit/canvas.service.test.ts` - Add tests for deletion method

### Canvas Deletion - UI
- `src/components/dashboard/CanvasCard.tsx` - Add delete button and confirmation dialog
- `src/components/dashboard/DeleteCanvasModal.tsx` - New confirmation modal component
- `tests/integration/canvas-deletion.test.tsx` - Integration tests for deletion flow

### Notes
- Unit tests should be placed alongside the code files they test
- Use `npm run test` to run all tests
- Use `npm run test [path/to/test]` to run specific test files
- Follow existing project patterns for component structure and naming

---

## Tasks

### Phase 1: Canvas Deletion (First Priority)

- [x] 1.0 **Implement Canvas Deletion Backend**
  - [x] 1.1 Open `src/services/canvas.service.ts` and add `deleteCanvas()` function
  - [x] 1.2 In `deleteCanvas()`, verify ownership: check if `canvas.ownerId === userId`, throw error if not owner
  - [x] 1.3 Delete canvas metadata: use `deleteDoc(doc(db, 'canvases', canvasId))`
  - [x] 1.4 Get all canvas objects: `getDocs(collection(db, 'canvas-objects', canvasId, 'objects'))`
  - [x] 1.5 Create Firestore batch: `writeBatch(db)` for deleting all objects
  - [x] 1.6 Loop through objects and add to batch: `batch.delete(objectDoc.ref)`
  - [x] 1.7 Commit batch deletion: `await batch.commit()`
  - [x] 1.8 Delete user access records (optional cleanup - can skip if complex)
  - [x] 1.9 Wrap everything in try-catch with helpful error messages
  - [x] 1.10 Add JSDoc comments explaining the function, params, and what it deletes

- [x] 2.0 **Create Canvas Deletion UI**
  - [x] 2.1 Open `src/components/dashboard/CanvasCard.tsx`
  - [x] 2.2 Add state: `const [showDeleteModal, setShowDeleteModal] = useState(false)`
  - [x] 2.3 Check if current user is owner: `const isOwner = canvas.ownerId === currentUser?.id`
  - [x] 2.4 Add delete button (only if isOwner): Button with trash icon, positioned top-right, visible on hover
  - [x] 2.5 Button onClick: `e.stopPropagation()` (prevent card click) and `setShowDeleteModal(true)`
  - [x] 2.6 Create new file: `src/components/dashboard/DeleteCanvasModal.tsx`
  - [x] 2.7 DeleteCanvasModal props: `{ isOpen, onClose, canvasName, onConfirm, isDeleting }`
  - [x] 2.8 Modal UI: Backdrop overlay, centered modal, show canvas name, warning text "This cannot be undone"
  - [x] 2.9 Modal buttons: "Cancel" (gray) and "Delete" (red), disable both when isDeleting
  - [x] 2.10 Back in CanvasCard: Add `handleDelete` function that calls `deleteCanvas()` service
  - [x] 2.11 In handleDelete: Set loading state, try-catch, call `onDelete()` prop on success to refresh dashboard
  - [x] 2.12 Show success message after deletion (can use alert or console.log for now, toast in Phase 2)
  - [x] 2.13 Handle errors: show error message to user (alert or console.error for now)

- [x] 3.0 **Comprehensive Testing for Canvas Deletion (CRITICAL)**
  - [x] 3.1 Create/extend test file: `tests/unit/canvas.service.test.ts`
  - [x] 3.2 Mock Firestore functions: `deleteDoc`, `getDocs`, `writeBatch`, `collection`, `doc`
  - [x] 3.3 Write test: "deleteCanvas successfully deletes canvas document"
  - [x] 3.4 Write test: "deleteCanvas deletes all canvas objects using batch"
  - [x] 3.5 Write test: "deleteCanvas deletes user access records for all users"
  - [x] 3.6 Write test: "deleteCanvas throws error if user is not owner"
  - [x] 3.7 Write test: "deleteCanvas throws error if canvasId is invalid"
  - [x] 3.8 Write test: "deleteCanvas handles Firestore errors gracefully (network failure)"
  - [x] 3.9 Write test: "deleteCanvas rollback: if batch delete fails, appropriate error is thrown"
  - [x] 3.10 Write test: "deleteCanvas handles case with zero objects gracefully"
  - [x] 3.11 Write test: "deleteCanvas handles case with 100+ objects (batch limits)"
  - [x] 3.12 Run unit tests: `npm run test tests/unit/canvas.service.test.ts`
  
- [x] 4.0 **Integration Testing for Canvas Deletion Flow**
  - [x] 4.1 Create test file: `tests/integration/canvas-deletion.test.tsx`
  - [x] 4.2 Write test: "Owner sees delete button on canvas card they own"
  - [x] 4.3 Write test: "Collaborator does NOT see delete button on canvas they don't own"
  - [x] 4.4 Write test: "Clicking delete button opens confirmation modal"
  - [x] 4.5 Write test: "Confirmation modal shows canvas name and warning text"
  - [x] 4.6 Write test: "Clicking 'Cancel' closes modal without deleting"
  - [x] 4.7 Write test: "Clicking 'Delete' calls deleteCanvas service"
  - [x] 4.8 Write test: "Canvas removed from dashboard after successful deletion"
  - [x] 4.9 Write test: "Success message shown after deletion"
  - [x] 4.10 Write test: "Error message shown if deletion fails"
  - [x] 4.11 Write test: "Delete button disabled during deletion (loading state)"
  - [x] 4.12 Write test: "Modal cannot be closed during deletion operation"
  - [x] 4.13 Run integration tests: `npm run test tests/integration/canvas-deletion.test.tsx`

### Phase 2: Infrastructure Wins

- [ ] 5.0 **Implement Connection Status Indicator**
  - [ ] 5.1 Create new file: `src/hooks/useConnectionStatus.ts`
  - [ ] 5.2 In hook, create state: `const [isConnected, setIsConnected] = useState(true)`
  - [ ] 5.3 Use browser online/offline events: `window.addEventListener('online', ...)` and `window.addEventListener('offline', ...)`
  - [ ] 5.4 Optionally, ping Firestore to verify connection: Try a small read operation
  - [ ] 5.5 Update state based on connection: `setIsConnected(true/false)`
  - [ ] 5.6 Clean up event listeners in useEffect cleanup
  - [ ] 5.7 Return connection status from hook
  - [ ] 5.8 Create new file: `src/components/common/ConnectionIndicator.tsx`
  - [ ] 5.9 Component uses `useConnectionStatus()` hook
  - [ ] 5.10 Show green "Connected" (auto-dismiss after 3s), yellow "Reconnecting...", or red "Offline" banner
  - [ ] 5.11 Position fixed at top of canvas header
  - [ ] 5.12 Add CSS transitions for smooth show/hide
  - [ ] 5.13 Open `src/components/canvas/Canvas.tsx` and import ConnectionIndicator
  - [ ] 5.14 Add `<ConnectionIndicator />` to canvas header

- [ ] 6.0 **Implement Viewport Persistence**
  - [ ] 6.1 Create new file: `src/hooks/usePersistedViewport.ts`
  - [ ] 6.2 Hook params: `(canvasId: string)`
  - [ ] 6.3 Define storage key: `const STORAGE_KEY = \`canvas-viewport-\${canvasId}\``
  - [ ] 6.4 Create state with initial value from localStorage: `useState(() => { const saved = localStorage.getItem(STORAGE_KEY); return saved ? JSON.parse(saved).scale : DEFAULT_ZOOM })`
  - [ ] 6.5 Do same for stageX and stageY (x, y positions)
  - [ ] 6.6 Create useEffect to save to localStorage with debouncing
  - [ ] 6.7 Use setTimeout to debounce (500ms): `const timer = setTimeout(() => { localStorage.setItem(...) }, 500)`
  - [ ] 6.8 Return cleanup function: `return () => clearTimeout(timer)`
  - [ ] 6.9 Return state and setters: `{ stageScale, setStageScale, stageX, setStageX, stageY, setStageY }`
  - [ ] 6.10 Open `src/components/canvas/Canvas.tsx`
  - [ ] 6.11 Replace existing viewport state with `usePersistedViewport(canvasId)`
  - [ ] 6.12 Test: Zoom/pan, refresh page, verify viewport is restored

- [ ] 7.0 **Improve Error Handling**
  - [ ] 7.1 Install react-toastify: `npm install react-toastify`
  - [ ] 7.2 Create new file: `src/components/common/Toast.tsx` (wrapper for react-toastify)
  - [ ] 7.3 Export helper functions: `showSuccessToast()`, `showErrorToast()`, `showInfoToast()`
  - [ ] 7.4 Configure toast position (bottom-right), auto-dismiss (5s), close button
  - [ ] 7.5 Create new file: `src/hooks/useToast.ts` that returns toast helper functions
  - [ ] 7.6 Open `src/components/canvas/Canvas.tsx`
  - [ ] 7.7 Import useToast: `const { showError, showSuccess } = useToast()`
  - [ ] 7.8 Update `handleStageMouseUp` (shape creation): wrap Firebase call in try-catch
  - [ ] 7.9 On error in shape creation: `showError('Failed to create shape. Please try again.')` and revert optimistic update
  - [ ] 7.10 Update `handleShapeDragEnd`: wrap Firebase call in try-catch  
  - [ ] 7.11 On error in shape update: `showError('Failed to save changes. Please try again.')` and revert to original position
  - [ ] 7.12 Add "Retry" button to error toasts (optional - can save for later)
  - [ ] 7.13 Update DeleteCanvasModal to use toast instead of alert
  - [ ] 7.14 Open `src/main.tsx` and add toast container: `<ToastContainer />`

### Phase 3: Conflict Detection Foundation

- [ ] 8.0 **Add Version Tracking to Data Model**
  - [ ] 8.1 Open `src/types/index.ts`
  - [ ] 8.2 Update `CanvasObject` interface: add `version: number` field
  - [ ] 8.3 Add `lastEditedBy?: string` field (optional, tracks which user last edited)
  - [ ] 8.4 Open `src/services/canvasObjects.service.ts`
  - [ ] 8.5 Update `createShape()`: Set initial version to 1 in shapeData
  - [ ] 8.6 Update `updateShape()`: Increment version with `{ version: increment(1) }`
  - [ ] 8.7 Update `updateShape()`: Add `lastEditedBy: userId` to update payload
  - [ ] 8.8 Import `increment` from firebase: `import { increment } from 'firebase/firestore'`
  - [ ] 8.9 Open `src/components/canvas/Canvas.tsx`
  - [ ] 8.10 Update optimistic shape creation to include `version: 1`
  - [ ] 8.11 Update optimistic shape updates to increment version locally (for UI consistency)
  - [ ] 8.12 Note: Conflict detection UI will come later - this is just the foundation
  - [ ] 8.13 Verify version is being saved: Check Firestore console after creating/updating shapes

### Phase 4: Additional Testing & Documentation

- [ ] 9.0 **Testing for Infrastructure Features**
  - [ ] 9.1 Create test file: `tests/unit/usePersistedViewport.test.ts`
  - [ ] 9.2 Write test: "usePersistedViewport saves viewport state to localStorage"
  - [ ] 9.3 Write test: "usePersistedViewport restores viewport state on mount"
  - [ ] 9.4 Write test: "usePersistedViewport uses correct storage key per canvas"
  - [ ] 9.5 Write test: "usePersistedViewport debounces localStorage writes"
  - [ ] 9.6 Create test file: `tests/unit/useConnectionStatus.test.ts`
  - [ ] 9.7 Write test: "useConnectionStatus detects online/offline events"
  - [ ] 9.8 Write test: "useConnectionStatus returns correct initial state"
  - [ ] 9.9 Write test: "useConnectionStatus cleans up event listeners"
  - [ ] 9.10 Create test file: `tests/unit/Toast.test.tsx`
  - [ ] 9.11 Write test: "Toast displays error messages correctly"
  - [ ] 9.12 Write test: "Toast auto-dismisses after timeout"
  - [ ] 9.13 Write test: "Toast retry button calls callback"
  - [ ] 9.14 Run all infrastructure tests: `npm run test tests/unit/`

- [ ] 10.0 **Version Tracking Tests**
  - [ ] 10.1 Extend test file: `tests/unit/canvasObjects.service.test.ts`
  - [ ] 10.2 Write test: "createShape sets initial version to 1"
  - [ ] 10.3 Write test: "updateShape increments version using Firestore increment()"
  - [ ] 10.4 Write test: "updateShape sets lastEditedBy to current user"
  - [ ] 10.5 Write test: "version field is present in all created shapes"
  - [ ] 10.6 Run tests: `npm run test tests/unit/canvasObjects.service.test.ts`

- [ ] 11.0 **Manual Testing & Validation**
  - [ ] 11.1 Manual test: Create canvas as owner, verify delete button appears
  - [ ] 11.2 Manual test: Share canvas with collaborator, verify they DON'T see delete button
  - [ ] 11.3 Manual test: Delete canvas with 0 objects, verify clean deletion
  - [ ] 11.4 Manual test: Create canvas with 50+ objects, delete, verify all objects removed
  - [ ] 11.5 Manual test: Delete canvas, check Firestore console for complete cleanup
  - [ ] 11.6 Manual test: Verify user access records deleted for all users
  - [ ] 11.7 Manual test: Try to access deleted canvas via URL (should show error/not found)
  - [ ] 11.8 Manual test: Viewport persistence - zoom/pan, refresh, verify state restored
  - [ ] 11.9 Manual test: Connection status - disconnect network, verify offline indicator
  - [ ] 11.10 Manual test: Error handling - simulate Firestore error, verify toast shown
  - [ ] 11.11 Run all tests: `npm run test` (verify 100% passing)
  - [ ] 11.12 Check for console errors/warnings during manual testing

- [ ] 12.0 **Documentation Updates**
  - [ ] 12.1 Open `README.md` and add section: "Canvas Deletion"
  - [ ] 12.2 Document: How to permanently delete a canvas (owner-only feature)
  - [ ] 12.3 Document: Warning that deletion is permanent and cannot be undone
  - [ ] 12.4 Document: What gets deleted (canvas document + all objects + all access records)
  - [ ] 12.5 Document localStorage keys: `canvas-viewport-{canvasId}` for viewport persistence
  - [ ] 12.6 Add section: "Infrastructure Features"
  - [ ] 12.7 Document: Connection status indicator and what it means
  - [ ] 12.8 Document: Viewport persistence behavior
  - [ ] 12.9 Document: Error handling with toast notifications
  - [ ] 12.10 Document: Version tracking for conflict detection (foundation)

---

## Task Breakdown Complete! ✅

I've generated **12 parent tasks** with **130+ detailed sub-tasks** ready for implementation:

**Phase 1: Canvas Deletion + Testing** (Tasks 1-4) ⭐ **START HERE** 🧪
- Task 1.0: Backend deletion (10 sub-tasks) ✅ COMPLETE
- Task 2.0: UI with confirmation modal (13 sub-tasks) ✅ COMPLETE
- Task 3.0: Canvas deletion unit tests (12 sub-tasks) 🔴 CRITICAL for data safety
- Task 4.0: Canvas deletion integration tests (13 sub-tasks) 🔴 Verify full flow

**Phase 2: Infrastructure Wins** (Tasks 5-7)
- Task 5.0: Connection status indicator (14 sub-tasks)
- Task 6.0: Viewport persistence (12 sub-tasks)
- Task 7.0: Error handling with toasts (14 sub-tasks)

**Phase 3: Conflict Detection Foundation** (Task 8)
- Task 8.0: Version tracking (13 sub-tasks)

**Phase 4: Additional Testing & Documentation** (Tasks 9-12)
- Task 9.0: Infrastructure feature tests (14 sub-tasks) - Viewport, connection, toasts
- Task 10.0: Version tracking tests (6 sub-tasks) - Conflict detection foundation
- Task 11.0: Manual testing & validation (12 sub-tasks) - End-to-end verification
- Task 12.0: Documentation updates (10 sub-tasks) - User-facing documentation

---

## 🚀 Ready to Start!

All sub-tasks are:
- ✅ Detailed and actionable for junior developers
- ✅ Specific to your codebase (exact file paths, function names)
- ✅ Ordered logically (can be done sequentially)
- ✅ Include comprehensive testing for high-risk features

**Testing Strategy:**
- 🔴 **Canvas Deletion**: CRITICAL - Extensive unit and integration tests due to permanent data loss risk (Tasks 3-4)
- 🟡 **Infrastructure Features**: Standard testing for viewport, connection, error handling (Task 9)
- 🟢 **Version Tracking**: Foundation tests for future conflict detection (Task 10)

**Next steps:**
1. ✅ Task 1.0 COMPLETE - Canvas deletion backend implemented
2. ✅ Task 2.0 COMPLETE - Canvas deletion UI implemented
3. **→ Task 3.0 NEXT** - Write comprehensive unit tests for deletion service
4. **→ Task 4.0 NEXT** - Write integration tests for deletion flow
5. After testing, proceed to Phase 2 (Infrastructure Wins)

---

**Phase 1 Status: Implementation Complete, Testing Pending! ✅**

Canvas deletion feature is fully implemented and ready for comprehensive testing.

**Next:** Task 3.0 - Write unit tests to ensure data safety before moving on.

**Note:** All documentation has been updated to reflect **permanent deletion only** (no trash/restore).

