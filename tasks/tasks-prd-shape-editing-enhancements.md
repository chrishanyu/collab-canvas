# Task List: Shape Editing Enhancements

## Relevant Files

- `src/components/canvas/Canvas.tsx` - Main canvas component requiring major state management updates for modes, selection, transforms
- `src/components/canvas/CanvasToolbar.tsx` - Toolbar component needing mode toggle buttons and text button
- `src/components/canvas/Shape.tsx` - Shape rendering component for text labels, strokes, rotation
- `src/components/canvas/TransformHandles.tsx` - NEW - Component for resize and rotation handles
- `src/components/canvas/RichTextEditor.tsx` - NEW - Floating rich text editor for text boxes
- `src/components/canvas/ZoomControls.tsx` - Existing zoom controls (minimal changes)
- `src/types/index.ts` - Type definitions for CanvasObject with new properties
- `src/services/canvasObjects.service.ts` - Firebase service for saving shapes with new properties
- `src/utils/constants.ts` - Constants for default styling values
- `tests/unit/transform.test.ts` - NEW - Unit tests for transform math
- `tests/unit/selection.test.ts` - NEW - Unit tests for multi-selection logic
- `tests/integration/text-editing.test.tsx` - NEW - Integration tests for text features
- `tests/integration/shape-transforms.test.tsx` - NEW - Integration tests for transforms

### Notes

- This is a large feature set spanning multiple phases
- Test each phase thoroughly before moving to the next
- Pay special attention to real-time collaboration during transforms
- Use `npm run test` to run all tests
- Use `npm run dev` to test features in development

---

## Tasks

- [x] 1.0 Setup: Interaction Modes & Toolbar UI
  - [x] 1.1 Add `interactionMode` state to Canvas.tsx ('select' | 'pan', default 'pan')
  - [x] 1.2 Update CanvasToolbar.tsx props to accept `interactionMode`, `onSetMode`, `onToggleShapes`, `onCreateText`
  - [x] 1.3 Add Select button (👆 icon) and Pan button (✋ icon) to toolbar layout
  - [x] 1.4 Add vertical separator and Text button (T icon) to toolbar
  - [x] 1.5 Style active/inactive mode buttons (blue bg when active, white when inactive)
  - [x] 1.6 Implement mode toggle handlers in Canvas.tsx
  - [x] 1.7 Update cursor styling based on interaction mode (grab/grabbing for pan, default/pointer for select)
  - [x] 1.8 Test mode switching between pan and select modes

- [x] 2.0 Update Data Model & Default Styling
  - [x] 2.1 Update `CanvasObject` type in types/index.ts to add `stroke?`, `strokeWidth?`, `rotation?`, `text?`, `textFormat?`
  - [x] 2.2 Add default styling constants to utils/constants.ts (WHITE_FILL, GRAY_BORDER, BORDER_WIDTH)
  - [x] 2.3 Update shape creation functions in Canvas.tsx to use new default colors (white fill, gray-800 stroke, 2px width)
  - [x] 2.4 Update Shape.tsx to render stroke and strokeWidth properties
  - [x] 2.5 Test that new shapes have correct default styling
  - [x] 2.6 Verify existing shapes are unaffected
  - [x] 2.7 Update canvasObjects.service.ts to handle new shape properties in Firebase writes

- [x] 3.0 Implement Multi-Selection System
  - [x] 3.1 Refactor Canvas.tsx: Change `selectedShapeId` (string | null) to `selectedShapeIds` (string[])
  - [x] 3.2 Update all selection-related logic to work with array instead of single ID
  - [x] 3.3 Add helper functions: `addToSelection()`, `removeFromSelection()`, `clearSelection()`, `isSelected()`
  - [x] 3.4 Change selection border color from green to blue (#3B82F6) in Shape.tsx
  - [x] 3.5 Implement Shift+click logic: add/remove individual shapes from selection
  - [x] 3.6 Add `selectionRect` state for drag rectangle (x, y, width, height)
  - [x] 3.7 Implement drag rectangle in Select mode: mousedown → mousemove → mouseup on background
  - [x] 3.8 Render semi-transparent blue selection rectangle during drag
  - [x] 3.9 Implement bounding box collision detection to find shapes intersecting selection rectangle
  - [x] 3.10 Add selected shapes to selection array on mouseup
  - [x] 3.11 Implement group drag: when dragging a selected shape, move all selected shapes together
  - [x] 3.12 Batch Firebase updates for group drag (save all shapes in one operation)
  - [x] 3.13 Test: single selection, multi-selection via Shift+click, multi-selection via drag rectangle
  - [x] 3.14 Test: group drag with 2+ shapes selected
  - [x] 3.15 Verify selection rectangle only appears in Select mode, not Pan mode

- [x] 4.0 Implement Transform Handles (Resize Only)
  - [x] 4.1 Create new component: TransformHandles.tsx
  - [x] 4.2 Add props: `shape`, `onResize`, `onResizeEnd`, `stageScale` (for handle sizing)
  - [x] 4.3 Render 4 corner resize handles (8x8px squares, white fill, blue border)
  - [x] 4.4 Position handles at shape corners (handle different shape types: rect vs circle/ellipse)
  - [x] 4.5 Implement drag logic for top-left resize handle (anchor bottom-right)
  - [x] 4.6 Implement drag logic for top-right resize handle (anchor bottom-left)
  - [x] 4.7 Implement drag logic for bottom-left resize handle (anchor top-right)
  - [x] 4.8 Implement drag logic for bottom-right resize handle (anchor top-left)
  - [x] 4.9 Ensure resize does NOT maintain aspect ratio
  - [x] 4.10 Integrate TransformHandles into Canvas.tsx (render only when `selectedShapeIds.length === 1`)
  - [x] 4.11 Ensure NO handles appear when multiple shapes selected
  - [x] 4.12 Wire up onResize handler to update shape dimensions in Canvas state and Firebase
  - [x] 4.13 Test resize from all 4 corners with different shape types
  - [x] 4.14 Verify handles disappear when multi-selecting
  - [x] 4.15 Test real-time sync of resized shapes across multiple users

- [x] 5.0 Text Feature - SCRAPPED (Rethinking Requirements)
  - [x] 5.1 Add Text button (T icon) to CanvasToolbar.tsx (kept as placeholder)
  - [x] 5.2 Show "coming soon" message when clicked
  - [x] 5.3 All text implementation removed (will be redesigned)

- [ ] 6.0 Implement Shape Text Labels - DEFERRED (Text feature being redesigned)
  - All subtasks deferred pending text feature redesign

- [ ] 7.0 Polish, Testing & Edge Cases
  - [ ] 7.1 Add ESC key handler: cancel creation mode, close shapes panel, clear selection
  - [ ] 7.2 Add Delete/Backspace key handler: delete all selected shapes
  - [ ] 7.3 Ensure Pan mode works correctly: drag background pans, click shape selects
  - [ ] 7.4 Ensure Select mode works correctly: drag background draws selection rect, cannot pan
  - [ ] 7.5 Verify mouse wheel zoom works in both Pan and Select modes
  - [ ] 7.6 Test zoom +/- buttons still work
  - [ ] 7.7 Write unit tests for transform math (resize calculations, rotation angles)
  - [ ] 7.8 Write unit tests for multi-selection logic (add, remove, clear)
  - [ ] 7.9 Write integration tests for text editing workflow
  - [ ] 7.10 Write integration tests for shape transform workflow
  - [ ] 7.11 Test edge case: transforming shape while another user also transforms it
  - [ ] 7.12 Test edge case: selecting shapes that are being edited by another user
  - [ ] 7.13 Test edge case: very small shapes with text labels
  - [ ] 7.14 Test edge case: rotating shapes with large text labels
  - [ ] 7.15 Test performance: canvas with 100+ shapes, multi-select all, transform
  - [ ] 7.16 Verify no regression in existing features (cursor presence, online users, etc.)
  - [ ] 7.17 Verify all 266 existing tests still pass
  - [ ] 7.18 Fix any linter errors or warnings
  - [ ] 7.19 Update documentation if needed
  - [ ] 7.20 Final end-to-end testing with 2+ users collaborating

