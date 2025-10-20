# Task List: Text Boxes Implementation

Generated from: `prd-text-boxes.md`

---

## Relevant Files

- `src/types/index.ts` - Shape type definitions (text type already exists)
- `src/components/canvas/TextBox.tsx` - **NEW** Text box component with edit mode
- `src/components/canvas/TextBox.test.tsx` - **NEW** Unit tests for TextBox component
- `src/components/canvas/Shape.tsx` - Update to handle 'text' type in switch statement
- `src/components/canvas/Canvas.tsx` - Add text creation mode, edit mode state management
- `src/context/CanvasContext.tsx` - Add editingTextId state for managing edit mode
- `src/context/canvasContextDefinition.ts` - Update context type definitions
- `src/services/canvasObjects.service.ts` - Text CRUD operations (should work with existing code)
- `src/services/canvasObjects.service.test.ts` - Add tests for text operations
- `src/services/aiCommands.ts` - Ensure createShape supports text type
- `src/services/aiCommands.test.ts` - Add tests for AI text creation
- `src/hooks/useKeyboardShortcuts.ts` - Add "T" key handler for text creation mode
- `src/utils/canvasHelpers.ts` - Add text-specific helper functions (height calculation, etc.)
- `src/utils/canvasHelpers.test.ts` - Tests for text helper functions
- `tests/integration/text-box-operations.test.tsx` - **NEW** Integration tests for text box feature
- `tests/integration/ai-text-commands.test.tsx` - **NEW** AI agent text creation tests

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `TextBox.tsx` and `TextBox.test.tsx` in the same directory).
- Use `npm run test` to run tests.

---

## Tasks

### 1.0 Foundation: Data Model & Type Definitions

- [x] 1.1 Update `CanvasObject` interface in `src/types/index.ts` to ensure text-specific fields are properly defined (text, fontSize, fontFamily, wrap behavior)
- [x] 1.2 Add text box default constants to `src/utils/constants.ts` (DEFAULT_TEXT_WIDTH = 200, DEFAULT_FONT_SIZE = 16, DEFAULT_FONT_FAMILY = 'Arial', MIN_TEXT_WIDTH = 50, MAX_TEXT_LENGTH = 5000)
- [x] 1.3 Update `src/context/canvasContextDefinition.ts` to add `editingTextId: string | null` to context type
- [x] 1.4 Add text box helper functions to `src/utils/canvasHelpers.ts` (calculateTextHeight, wrapText, getTextMetrics)
- [x] 1.5 Write unit tests for text helper functions in `src/utils/canvasHelpers.test.ts`

### 2.0 Text Display: Konva Text Rendering

- [x] 2.1 Create `src/components/canvas/TextBox.tsx` component with basic structure (props interface, memoization)
- [x] 2.2 Implement read-only Konva Text rendering (import Text from 'react-konva', render with text, position, fontSize, fontFamily, color, width, wrap='word')
- [x] 2.3 Add text box case to `src/components/canvas/Shape.tsx` switch statement to render TextBox component for type='text'
- [x] 2.4 Update `src/components/canvas/Canvas.tsx` to render text shapes in the shapes map
- [x] 2.5 Test text box rendering manually (create text object in Firebase, verify it displays correctly)
- [x] 2.6 Write unit tests for TextBox component in `src/components/canvas/TextBox.test.tsx` (renders with correct props, displays text content, handles empty text)

### 3.0 Text Editing: Inline Edit Mode with Textarea Overlay

- [x] 3.1 Add `editingTextId` state to `src/context/CanvasContext.tsx` with setEditingTextId function
- [x] 3.2 Implement double-click handler in TextBox component to trigger edit mode (calls setEditingTextId)
- [x] 3.3 Create HTML textarea overlay in TextBox component that appears when in edit mode (position absolutely, style to match Konva Text, use canvas coordinates converted to screen coordinates)
- [x] 3.4 Implement textarea styling to match Konva Text appearance (font size, family, color, padding, border: none, background: rgba(255,255,255,0.9))
- [x] 3.5 Handle textarea blur and Escape key to exit edit mode (update text content, call setEditingTextId(null))
- [x] 3.6 Update text content in local state on textarea change (optimistic update)
- [x] 3.7 Save text to Firebase when exiting edit mode (call updateShape in canvasObjects.service)
- [ ] 3.8 Add integration tests in `tests/integration/text-box-operations.test.tsx` (double-click enters edit mode, typing updates text, blur saves changes, Escape cancels)

### 4.0 Text Box Interactions: Selection, Movement & Resizing

- [x] 4.1 Implement single-click selection in TextBox component (call onSelect handler, consistent with other shapes)
- [x] 4.2 Add selection visual feedback to TextBox (stroke color changes when isSelected=true, use existing pattern from Shape.tsx)
- [x] 4.3 Implement drag-to-move for text boxes (onDragStart, onDragMove, onDragEnd handlers, reuse existing Canvas handlers)
- [x] 4.4 Ensure TransformHandles component works with text boxes (verify resize handles appear, handle resize events)
- [x] 4.5 Implement width resize logic (update text box width, text re-wraps automatically via Konva wrap property)
- [x] 4.6 Implement height auto-calculation (use Konva Text.getHeight() to measure wrapped text, update shape height dynamically)
- [x] 4.7 Enforce minimum size constraints (MIN_TEXT_WIDTH = 50px, minimum height = 1 line of text)
- [x] 4.8 Add unit tests for text box interactions in `TextBox.test.tsx` (selection, drag, resize calculations)
- [ ] 4.9 Add integration tests for movement and resizing in `tests/integration/text-box-operations.test.tsx`

### 5.0 Real-Time Collaboration: Sync & Conflict Resolution

- [x] 5.1 Verify text box creation syncs via existing `useRealtimeSync` hook (should work automatically with Firestore listeners)
- [x] 5.2 Integrate edit indicators: write to active-edits when entering edit mode (call activeEdits.service.startEditingShape on edit mode entry)
- [x] 5.3 Clear edit indicator when exiting edit mode (call activeEdits.service.stopEditingShape on blur/escape)
- [x] 5.4 Add visual edit indicator to TextBox component (dashed border with editor's color when isBeingEdited=true, reuse existing pattern)
- [x] 5.5 Add hover tooltip showing editor's name when text box is being edited by another user
- [x] 5.6 Verify version-based conflict detection works with text updates (updateShape should check version, throw ConflictError on mismatch)
- [x] 5.7 Handle ConflictError in edit mode exit (show toast notification, reload latest text from Firebase)
- [ ] 5.8 Add integration tests for collaboration scenarios in `tests/integration/text-box-operations.test.tsx` (two users creating text, edit indicators, conflict detection)

### 6.0 AI Agent Integration

- [x] 6.1 Verify `createShape` function in `src/services/aiCommands.ts` supports type='text' (should work with existing code, verify text field is passed through)
- [x] 6.2 Update AI function schema in `api/lib/schemas.ts` to document text-specific parameters (text content, fontSize, fontFamily, color) if needed
- [x] 6.3 Update system prompts in `api/lib/prompts.ts` to include text box examples (e.g., "Create a text box that says 'Title' at x=100, y=50")
- [ ] 6.4 Test AI text creation manually (use AI command: "Create a text box that says 'Hello World'", verify text box appears)
- [ ] 6.5 Test AI multi-text creation (use AI command: "Create a login form with labels", verify text labels are created alongside input rectangles)
- [x] 6.6 Add unit tests in `src/services/aiCommands.test.ts` for text creation via AI (createShape with type='text', validate parameters)
- [ ] 6.7 Add integration tests in `tests/integration/ai-text-commands.test.tsx` (AI creates text boxes, text syncs to all users, complex layouts with text)

### 7.0 Keyboard Shortcuts & User Experience Polish

- [x] 7.1 Add "T" key handler to `src/hooks/useKeyboardShortcuts.ts` to activate text creation mode (when not in edit mode)
- [x] 7.2 Add text creation mode to Canvas component (creatingShapeType='text', show ghost preview at cursor)
- [x] 7.3 Create ghost/preview text box in `src/components/canvas/PreviewShape.tsx` (add case for 'text' type, render semi-transparent Text component)
- [x] 7.4 Implement click-to-place for text boxes (on stage click during text creation mode, create text at click position, immediately enter edit mode)
- [x] 7.5 Update existing "Add Text" button in `src/components/canvas/CanvasToolbar.tsx` to trigger text creation mode (setCreatingShapeType('text'))
- [x] 7.6 Add cursor style changes during text creation mode (cursor: crosshair)
- [x] 7.7 Implement automatic edit mode entry after text box placement (new text boxes immediately show textarea for user to type)
- [x] 7.8 Add empty text box handling (allow empty text boxes to exist, show placeholder cursor in textarea)
- [ ] 7.9 Add integration tests for text creation flow in `tests/integration/text-box-operations.test.tsx` (T key activates mode, ghost preview appears, click places text, edit mode activates, typing works)
- [ ] 7.10 Manual testing: Test complete user flow (click button, place text, edit, move, resize, collaborate with another user)

