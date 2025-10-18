# Product Requirements Document: Canvas UI Revamp

## Introduction/Overview

This PRD outlines a comprehensive UI redesign for the CollabCanvas editor to create a more immersive, Figma-like experience. The revamp focuses on maximizing canvas real estate by making the canvas full-screen, reorganizing controls into floating panels, adding a shapes library for easier shape creation, and improving zoom controls. The goal is to provide a cleaner, more professional interface that scales well as more features are added.

**Problem**: The current canvas UI has a fixed header that takes up vertical space, toolbar controls positioned on the left that feel disconnected, and shape creation is limited to a single "Add Rectangle" button. The zoom controls are embedded in the toolbar, and there's no browser tab context for which canvas you're viewing.

**Solution**: Create a full-screen canvas experience with floating UI elements positioned strategically around the viewport, a dedicated shapes panel for easy shape selection, dedicated zoom controls, and improved visual feedback for user actions.

---

## Goals

1. **Maximize Canvas Space**: Remove fixed headers and make canvas take over entire viewport
2. **Improve Shape Creation UX**: Provide a dedicated, extensible shapes panel with 6+ basic shapes
3. **Better Visual Hierarchy**: Use floating cards to organize navigation (back/title), tools (shapes), and zoom controls
4. **Extensibility**: Design shape panel architecture to easily support adding more shapes in the future
5. **Enhanced User Feedback**: Add keyboard shortcuts and visual indicators for creation mode
6. **Context Awareness**: Show canvas name in browser tab for better multi-tab navigation

---

## User Stories

### US-1: Full-Screen Canvas Experience
**As a** canvas user  
**I want** the canvas to take over the entire screen  
**So that** I have maximum space to design without UI elements blocking my view

**Acceptance Criteria**:
- Canvas fills entire viewport (100vw × 100vh)
- No fixed header at top
- All controls are floating/overlaid on canvas
- Background color matches canvas aesthetic

---

### US-2: Floating Navigation Card
**As a** canvas user  
**I want** a small floating card in the top-left with back button and canvas title  
**So that** I can see what canvas I'm on and easily return to dashboard without UI clutter

**Acceptance Criteria**:
- Floating card positioned at top-left corner (e.g., 16px from top, 16px from left)
- Contains back button (← Dashboard) and canvas name
- Card is compact but readable
- Has subtle shadow for visual separation from canvas
- Card remains fixed during pan/zoom operations

---

### US-3: Browser Tab Title
**As a** canvas user  
**I want** the browser tab to show the canvas name  
**So that** I can identify which canvas I'm viewing when I have multiple tabs open

**Acceptance Criteria**:
- Document title updates to show: "[Canvas Name] - CollabCanvas"
- Title updates when canvas loads
- Falls back to "Canvas - CollabCanvas" if name unavailable

---

### US-4: Shapes Panel
**As a** canvas user  
**I want** a dedicated floating shapes panel  
**So that** I can easily browse and select from multiple shape types

**Acceptance Criteria**:
- Floating panel positioned on left side, below navigation card (e.g., 16px from left, ~80px from top)
- Opens/closes via button in bottom toolbar
- Displays 6 initial shape options: Rectangle, Circle, Ellipse, Line, Star, Polygon
- Each shape has an icon/visual preview
- Selected shape is highlighted
- Clicking a shape enters creation mode (click-to-place on canvas)
- Panel remains open after selecting a shape (doesn't auto-close)
- Panel can be closed by clicking shapes button again or pressing ESC
- Panel has scroll support for when more shapes are added in future

---

### US-5: Redesigned Bottom Toolbar
**As a** canvas user  
**I want** a centered toolbar at the bottom with essential tools  
**So that** tools are easily accessible but don't block canvas content

**Acceptance Criteria**:
- Toolbar positioned at bottom-center of viewport (e.g., 16px from bottom, horizontally centered)
- Floating card style (white bg, rounded corners, shadow)
- Contains only: "Shapes" button to toggle shapes panel
- Remove: Reset View, Zoom In/Out buttons (moved to separate control)
- Toolbar remains fixed during pan/zoom operations
- Visual indicator when shapes panel is open

---

### US-6: Dedicated Zoom Controls
**As a** canvas user  
**I want** dedicated zoom controls in the bottom-right corner  
**So that** I can easily adjust zoom level in 25% increments

**Acceptance Criteria**:
- Positioned at bottom-right corner (e.g., 16px from bottom, 16px from right)
- Button group layout: [-] [100%] [+]
- Clicking [-] decreases zoom by 25% (e.g., 100% → 75%)
- Clicking [+] increases zoom by 25% (e.g., 100% → 125%)
- Current zoom percentage displayed in center (readonly, not editable for MVP)
- Respects min/max zoom limits (10% - 300%)
- Mouse wheel zoom behavior unchanged (smooth, continuous zoom)
- Zoom controls remain fixed during pan operations

---

### US-7: Remove Canvas Info Card
**As a** canvas user  
**I want** the debug info card removed from production UI  
**So that** the interface looks clean and professional

**Acceptance Criteria**:
- Remove the bottom-left dev info card showing viewport stats
- (Optional) Info can be moved to browser console logs for debugging

---

### US-8: Keyboard Shortcuts
**As a** canvas user  
**I want** keyboard shortcuts for common actions  
**So that** I can work more efficiently

**Acceptance Criteria**:
- ESC key: Cancel shape creation mode, close shapes panel, deselect shape
- Delete/Backspace key: Delete currently selected shape (with confirmation for future)
- Shortcuts work regardless of which UI element has focus

---

### US-9: Shape Creation Visual Feedback
**As a** canvas user  
**I want** clear visual feedback when in shape creation mode  
**So that** I know the canvas is ready for me to place a shape

**Acceptance Criteria**:
- Cursor changes to crosshair when in creation mode
- Selected shape in shapes panel is highlighted
- Optional: Instruction text near cursor ("Click to place [shape name]")
- Visual state clears when shape is placed or creation is cancelled

---

## Functional Requirements

### FR-1: Full-Screen Canvas Layout
1. Canvas component must render at 100vw × 100vh (full viewport)
2. Remove existing fixed header (lines 536-555 in Canvas.tsx)
3. Update stage height calculation to use full viewport height (remove HEADER_HEIGHT offset)
4. Background color: `bg-gray-100` or similar neutral tone

### FR-2: Floating Navigation Card (Top-Left)
1. Create new component: `CanvasHeader.tsx` as a floating card
2. Position: `absolute top-4 left-4 z-20`
3. Contents:
   - Back button linking to `/dashboard` with arrow icon
   - Canvas name (h2 or h3, truncate if too long)
4. Styling: White background, rounded corners, shadow, padding
5. Card should be compact (~200px width max)

### FR-3: Browser Tab Title
1. Add `useEffect` hook in Canvas.tsx to update `document.title`
2. Format: `${canvas.name} - CollabCanvas`
3. Update when canvas data loads
4. Reset to default when component unmounts (optional)

### FR-4: Shapes Panel Component
1. Create new component: `ShapesPanel.tsx`
2. Props:
   - `isOpen: boolean` - controls visibility
   - `selectedShape: string | null` - which shape is active
   - `onSelectShape: (shapeType: string) => void` - callback when shape clicked
   - `onClose: () => void` - callback to close panel
3. Initial supported shapes (6):
   - `rectangle` - Rect shape
   - `circle` - Circle shape
   - `ellipse` - Ellipse shape (different from circle, can be oval)
   - `star` - Star shape
   - `pentagon` - Pentagon shape (5 sides)
   - `octagon` - Octagon shape (8 sides)
4. Position: `absolute top-20 left-4 z-10` (below navigation card)
5. Layout:
   - Vertical list or grid of shape buttons
   - Each button shows icon/preview + label
   - Selected shape has blue border or background
   - Max height with scroll if > 8-10 shapes (future-proofing)
6. Conditional rendering: Only visible when `isOpen === true`
7. Architecture: Use a `shapes` array/config for easy addition of new shapes:
   ```typescript
   const AVAILABLE_SHAPES = [
     { type: 'rectangle', icon: '⬛', label: 'Rectangle' },
     { type: 'circle', icon: '⚫', label: 'Circle' },
     { type: 'ellipse', icon: '⬮', label: 'Ellipse' },
     { type: 'star', icon: '⭐', label: 'Star' },
     { type: 'pentagon', icon: '⬠', label: 'Pentagon' },
     { type: 'octagon', icon: '⬣', label: 'Octagon' },
   ];
   ```

### FR-5: Updated Canvas Toolbar (Bottom-Center)
1. Update `CanvasToolbar.tsx`:
   - Remove props: `onResetView`, `onZoomIn`, `onZoomOut`, `currentZoom`
   - Add props: `onToggleShapes: () => void`, `isShapesPanelOpen: boolean`
2. Position: `absolute bottom-4 left-1/2 -translate-x-1/2 z-10`
3. Contents:
   - Single button: "Shapes" (with icon, e.g., square/shapes icon)
   - Button state indicates if panel is open (blue background when open)
4. Remove all zoom controls from this toolbar

### FR-6: Zoom Controls Component (Bottom-Right)
1. Create new component: `ZoomControls.tsx`
2. Props:
   - `onZoomIn: () => void` - increases zoom by 0.25
   - `onZoomOut: () => void` - decreases zoom by 0.25
3. Position: `absolute bottom-4 right-4 z-10`
4. Layout: Horizontal button group `[-] [+]` (no percentage display)
5. Logic in Canvas.tsx:
   - `handleZoomIn`: `setStageScale(Math.min(stageScale + 0.25, 3.0))`
   - `handleZoomOut`: `setStageScale(Math.max(stageScale - 0.25, 0.1))`
6. Styling: Match toolbar floating card style

### FR-7: Remove Canvas Info Card
1. Delete or comment out lines 626-640 in Canvas.tsx (debug info card)
2. Optionally move stats to console.log for development debugging

### FR-8: Shape Creation State Management
1. Update Canvas.tsx state:
   - Change `isCreatingShape` to track shape type: `creatingShapeType: string | null`
   - `null` means not creating, `'rectangle'` means creating rectangle, etc.
2. Update handlers:
   - `handleAddShape(shapeType: string)`: Sets `creatingShapeType` to specified type
   - `handleStageMouseDown`: Use `creatingShapeType` to determine which shape to create
3. Add shape creation logic for new shape types (line, star, polygon, ellipse)

### FR-9: Keyboard Shortcuts
1. Add `useEffect` with keyboard event listener in Canvas.tsx
2. ESC key handler:
   - If `creatingShapeType !== null`: set to null (cancel creation)
   - If shapes panel open: close panel
   - If shape selected: deselect (`setSelectedShapeId(null)`)
3. Delete/Backspace key handler:
   - If `selectedShapeId`: delete that shape from Firebase
   - Future: Add confirmation dialog
4. Prevent default browser behavior where appropriate

### FR-10: Visual Feedback for Creation Mode
1. Cursor: Use `cursor: crosshair` on stage when `creatingShapeType !== null`
2. Shapes panel: Highlight selected shape with border/background color
3. Optional enhancement: Render ghost/preview shape following cursor before placement

---

## Non-Goals (Out of Scope)

1. **Canvas Permissions UI** - Not adding role-based access controls in this revamp
2. **Shape Editing** - Not adding resize handles, rotation, or advanced transform controls
3. **Undo/Redo** - Keyboard shortcuts for these not included (future enhancement)
4. **Multi-select** - Selecting multiple shapes at once not in scope
5. **Shape Styling Panel** - Color picker, stroke width controls deferred to future work
6. **Advanced Shapes** - Custom path drawing, bezier curves, or imported SVGs not included
7. **Mobile Responsiveness** - This revamp focuses on desktop experience
8. **Collaborative Cursors Position** - No changes to UserPresence component behavior
9. **Canvas Rename/Settings** - Not adding canvas management UI to the navigation card

---

## Design Considerations

### Layout Mockup

```
┌────────────────────────────────────────────────────────────┐
│ [← Dashboard | Canvas Name]                                │
│                                                            │
│ [Shapes Panel]                                             │
│ ┌──────────┐                                              │
│ │ ⬛ Rect  │                                              │
│ │ ⚫ Circle│             FULL SCREEN CANVAS                │
│ │ ⬮ Ellipse│                                              │
│ │ ⭐ Star  │                                              │
│ │ ⬠ Penta  │                                              │
│ │ ⬣ Octa   │                                              │
│ └──────────┘                                              │
│                                                            │
│                                                            │
│                                                            │
│                    [🔲 Shapes]                      [-][+]│
└────────────────────────────────────────────────────────────┘
```

### Component Hierarchy Changes

```
Canvas.tsx
├── CanvasHeader (new - top-left floating card)
├── ShapesPanel (new - left side floating panel)
├── CanvasToolbar (updated - bottom-center, simplified)
├── ZoomControls (new - bottom-right floating controls)
├── ConnectionIndicator (unchanged)
├── Stage (Konva canvas - now full viewport)
└── UserPresence (unchanged)
```

### Styling Guidelines

- **Floating Cards**: `bg-white rounded-lg shadow-lg px-4 py-2` (consistent across all)
- **Active State**: `bg-blue-500 text-white` for selected/active buttons
- **Hover State**: `hover:bg-gray-100` for buttons
- **Z-index**: Navigation (20), Shapes Panel (10), Toolbars (10)
- **Spacing**: Use 16px (`left-4`, `right-4`) as standard margin from viewport edges

---

## Technical Considerations

### Implementation Order (Suggested)

1. **Phase 1 - Layout Changes** (low risk):
   - Create CanvasHeader component
   - Update Canvas.tsx to remove fixed header
   - Add browser tab title update
   - Remove canvas info card
   - Update stage height calculation

2. **Phase 2 - Zoom Controls** (low risk):
   - Create ZoomControls component
   - Update zoom increment logic to 25%
   - Update CanvasToolbar to remove zoom buttons

3. **Phase 3 - Shapes Panel** (medium risk):
   - Create ShapesPanel component with 6 shapes
   - Update Canvas.tsx state management (creatingShapeType)
   - Wire up panel to toolbar button
   - Test shape selection flow

4. **Phase 4 - Shape Creation Logic** (medium-high risk):
   - Implement creation logic for new shapes (line, star, polygon, ellipse)
   - Update handleStageMouseDown to support multiple shape types
   - Add shape-specific Firebase write logic

5. **Phase 5 - Keyboard Shortcuts** (low-medium risk):
   - Add keyboard event listeners
   - Implement ESC and Delete handlers
   - Test interactions with existing UI

6. **Phase 6 - Visual Feedback** (low risk):
   - Update cursor styling
   - Add creation mode indicators
   - Polish transitions and hover states

### Shape Implementation Notes

For shapes that don't exist in current codebase:

1. **Star**: Use Konva.Star with configurable points (default 5)
   - Properties: numPoints, innerRadius, outerRadius

2. **Pentagon**: Use Konva.RegularPolygon with 5 sides
   - Properties: sides=5, radius

3. **Octagon**: Use Konva.RegularPolygon with 8 sides
   - Properties: sides=8, radius

4. **Ellipse**: Use Konva.Ellipse (different from Circle)
   - Properties: radiusX, radiusY

Each new shape type needs:
- Firebase schema update (type field supports new types)
- Shape.tsx rendering logic (switch case for each type)
- Default sizing and positioning logic

### State Management Updates

Canvas.tsx state changes:
```typescript
// Before
const [isCreatingShape, setIsCreatingShape] = useState(false);

// After
const [creatingShapeType, setCreatingShapeType] = useState<string | null>(null);
const [isShapesPanelOpen, setIsShapesPanelOpen] = useState(false);
```

### Performance Considerations

- Shapes panel uses list rendering - should be performant even with 50+ shapes
- Keyboard event listeners should be debounced if handling rapid key presses
- No expected performance impact from UI changes (layout-only)

---

## Success Metrics

### Functional Success
- ✅ Canvas renders full-screen (100vw × 100vh)
- ✅ All 6 shapes can be created and placed
- ✅ Zoom controls work with 25% increments
- ✅ Keyboard shortcuts (ESC, Delete) function correctly
- ✅ Browser tab shows canvas name
- ✅ All existing functionality preserved (pan, zoom wheel, drag shapes, real-time sync)

### User Experience Success
- Users can identify canvas name at-a-glance (top-left card)
- Shape selection is intuitive (panel opens, click shape, click canvas)
- Zoom adjustments are precise and predictable
- UI feels more spacious and less cluttered
- No regression in collaboration features (cursors, online users)

### Code Quality Success
- New components follow existing patterns (TypeScript, React hooks)
- Shapes architecture is extensible (easy to add 7th, 8th shape)
- No breaking changes to existing tests
- Code is well-documented with comments

---

## Open Questions

1. **Shapes Panel Persistence**: Should panel state (open/closed) be persisted to localStorage per user? Recommend no for MVP, but easy enhancement later.

2. **Delete Confirmation**: Should deleting a shape show confirmation dialog? Recommend no for MVP (just delete), but add in future with undo/redo.

3. **Mobile Responsiveness**: Should floating panels stack differently on smaller screens? Out of scope for this PRD, but worth considering for future.

4. **Star Shape Configuration**: Should stars always have 5 points, or should we support configuring points (4, 5, 6, etc.)? Recommend fixed 5-point stars for MVP.

5. **Pentagon/Octagon Sizing**: Should these shapes size by radius or by width/height like rectangles? Recommend radius for consistency with Circle.

---

## Appendix: File Changes Summary

### New Files
- `src/components/canvas/CanvasHeader.tsx` - Top-left navigation card
- `src/components/canvas/ShapesPanel.tsx` - Left-side shapes selector
- `src/components/canvas/ZoomControls.tsx` - Bottom-right zoom buttons

### Modified Files
- `src/components/canvas/Canvas.tsx` - Major updates:
  - Remove fixed header
  - Update state management for shapes
  - Add keyboard shortcuts
  - Integrate new components
  - Remove canvas info card
- `src/components/canvas/CanvasToolbar.tsx` - Simplified to single "Shapes" button
- `src/components/canvas/Shape.tsx` - Add rendering logic for 4 new shape types
- `src/services/canvasObjects.service.ts` - Support new shape types in Firebase writes
- `src/types/index.ts` - Update CanvasObject type to support new shape types

### Unchanged Files
- `src/components/presence/UserPresence.tsx` - No changes
- `src/hooks/usePresence.ts` - No changes
- All other hooks and services - No changes

---

## Estimated Complexity

**Overall Effort**: Medium (3-5 days for experienced developer)

**Breakdown**:
- Layout changes (Phase 1): 4 hours
- Zoom controls (Phase 2): 2 hours
- Shapes panel UI (Phase 3): 4 hours
- Shape creation logic (Phase 4): 8 hours (most complex)
- Keyboard shortcuts (Phase 5): 3 hours
- Polish and testing (Phase 6): 4 hours

**Total**: ~25 hours

**Risk Areas**:
- Shape creation logic for line (different interaction pattern)
- Ensuring no regression in real-time sync during shape creation
- Keyboard event handling conflicts with browser defaults

