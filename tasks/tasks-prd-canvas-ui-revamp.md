# Task List: Canvas UI Revamp

Based on: `prd-canvas-ui-revamp.md`

---

## Relevant Files

- `src/components/canvas/CanvasHeader.tsx` - New floating navigation card (top-left) with back button and canvas title
- `src/components/canvas/ShapesPanel.tsx` - New floating shapes panel (left side) with 6 shape options
- `src/components/canvas/ZoomControls.tsx` - New zoom controls component (bottom-right) with [-][+] buttons
- `src/components/canvas/Canvas.tsx` - Major updates: full-screen layout, state management, keyboard shortcuts
- `src/components/canvas/CanvasToolbar.tsx` - Simplified toolbar with only "Shapes" toggle button
- `src/components/canvas/Shape.tsx` - Add rendering logic for 4 new shape types (ellipse, star, pentagon, octagon)
- `src/services/canvasObjects.service.ts` - Support new shape types in Firebase operations
- `src/types/index.ts` - Update type definitions for new shape types
- `src/utils/constants.ts` - May need shape-specific constants

### Notes

- Focus on maintaining existing functionality (real-time sync, presence, conflict resolution)
- Ensure performance remains at 60 FPS with new shapes
- All new components should follow existing styling patterns (floating cards, shadows)
- Mouse wheel zoom behavior should remain unchanged

---

## Tasks

- [x] 1.0 Phase 1: Full-Screen Layout & Navigation
  - [x] 1.1 Create `CanvasHeader.tsx` component with back button and canvas title
  - [x] 1.2 Update Canvas.tsx to remove fixed header (lines 536-555)
  - [x] 1.3 Update Canvas.tsx to use full viewport height (remove HEADER_HEIGHT constant usage)
  - [x] 1.4 Add useEffect to update document.title with canvas name
  - [x] 1.5 Remove canvas info debug card (lines 626-640)
  - [x] 1.6 Update UserPresence component call to remove headerHeight offset if needed
  - [x] 1.7 Test full-screen layout and navigation

- [x] 2.0 Phase 2: Zoom Controls Component
  - [x] 2.1 Create `ZoomControls.tsx` component with [-][+] buttons
  - [x] 2.2 Update handleZoomIn to increment by 0.25 (instead of ZOOM_SPEED)
  - [x] 2.3 Update handleZoomOut to decrement by 0.25 (instead of ZOOM_SPEED)
  - [x] 2.4 Remove zoom-related props from CanvasToolbar
  - [x] 2.5 Add ZoomControls component to Canvas.tsx (bottom-right position)
  - [x] 2.6 Test zoom buttons work correctly (25% increments, respects min/max)
  - [x] 2.7 Verify mouse wheel zoom still works as before

- [x] 3.0 Phase 3: Shapes Panel UI & Integration
  - [x] 3.1 Create `ShapesPanel.tsx` component with shapes config array
  - [x] 3.2 Add 6 shape buttons to ShapesPanel (rectangle, circle, ellipse, star, pentagon, octagon)
  - [x] 3.3 Style ShapesPanel as floating card (left side, below nav)
  - [x] 3.4 Update Canvas.tsx state: change isCreatingShape to creatingShapeType (string | null)
  - [x] 3.5 Add isShapesPanelOpen state to Canvas.tsx
  - [x] 3.6 Update CanvasToolbar to remove zoom controls, add "Shapes" toggle button
  - [x] 3.7 Wire up ShapesPanel to toggle open/close from toolbar
  - [x] 3.8 Wire up shape selection in panel to update creatingShapeType
  - [x] 3.9 Test panel open/close and shape selection

- [x] 4.0 Phase 4: Shape Creation Logic for New Shapes
  - [x] 4.1 Update types/index.ts to support new shape types in CanvasObject type
  - [x] 4.2 Update handleStageMouseDown in Canvas.tsx to use creatingShapeType for creation
  - [x] 4.3 Add Ellipse shape creation logic (radiusX, radiusY)
  - [x] 4.4 Add Star shape creation logic (numPoints=5, innerRadius, outerRadius)
  - [x] 4.5 Add Pentagon shape creation logic (RegularPolygon with sides=5)
  - [x] 4.6 Add Octagon shape creation logic (RegularPolygon with sides=8)
  - [x] 4.7 Update Shape.tsx to render Ellipse shapes
  - [x] 4.8 Update Shape.tsx to render Star shapes
  - [x] 4.9 Update Shape.tsx to render Pentagon shapes (RegularPolygon)
  - [x] 4.10 Update Shape.tsx to render Octagon shapes (RegularPolygon)
  - [x] 4.11 Test creating each new shape type on canvas
  - [x] 4.12 Test dragging and moving new shape types
  - [x] 4.13 Verify new shapes sync in real-time across users

- [x] 5.0 Phase 5: Keyboard Shortcuts
  - [x] 5.1 Add useEffect in Canvas.tsx for keyboard event listener
  - [x] 5.2 Implement ESC key handler (cancel shape creation, close panel, deselect)
  - [x] 5.3 Implement Delete/Backspace key handler (delete selected shape)
  - [x] 5.4 Add deleteShape function to call Firebase delete service
  - [x] 5.5 Test ESC key cancels shape creation mode
  - [x] 5.6 Test ESC key closes shapes panel when open
  - [x] 5.7 Test ESC key deselects shape when shape is selected
  - [x] 5.8 Test Delete key removes selected shape
  - [x] 5.9 Verify keyboard shortcuts don't conflict with browser defaults

- [x] 6.0 Phase 6: Visual Feedback & Polish
  - [x] 6.1 Update cursor to crosshair when creatingShapeType !== null
  - [x] 6.2 Add highlight styling to selected shape in ShapesPanel
  - [x] 6.3 Add active state to "Shapes" button when panel is open
  - [x] 6.4 Add hover states to all floating card buttons
  - [x] 6.5 Ensure consistent shadow and border-radius across all floating components
  - [x] 6.6 Add smooth transitions for panel open/close
  - [x] 6.7 Test visual feedback for all interactions
  - [x] 6.8 Add ghost/preview shape that follows cursor during creation mode

- [x] 7.0 Phase 7: Testing & Cleanup
  - [x] 7.1 Test creating all 6 shape types and verify they render correctly
  - [x] 7.2 Test real-time sync with multiple users creating different shapes
  - [x] 7.3 Verify conflict resolution still works with new shapes
  - [x] 7.4 Test keyboard shortcuts in various scenarios
  - [x] 7.5 Check performance with 50+ mixed shape types (maintain 60 FPS)
  - [x] 7.6 Test zoom controls with canvas containing all shape types
  - [x] 7.7 Verify viewport virtualization still works with new shapes
  - [x] 7.8 Remove any console.log or debug code added during development
  - [x] 7.9 Update tests if needed to cover new components
  - [x] 7.10 Final visual QA pass on all UI elements

