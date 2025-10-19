# Product Requirements Document: Figma-Inspired Features (12-Point Target)

## Introduction/Overview

This PRD outlines five essential Figma-inspired features to enhance CollabCanvas, targeting 12 points in Section 3 evaluation. These features will transform the canvas from a basic shape editor into a professional design tool with keyboard-driven workflows, visual styling controls, and advanced shape manipulation.

The features are strategically chosen to:
- Leverage existing multi-selection system (already implemented)
- Build upon current shape manipulation capabilities
- Provide maximum UX value for development effort
- Align with industry-standard design tool patterns (Figma, Sketch, Canva)

## Goals

1. **Enable keyboard-driven workflows** to match professional design tool standards
2. **Add visual styling controls** for shape customization
3. **Implement object layering** for complex compositions
4. **Provide alignment tools** for precise layouts
5. **Achieve 12 points** in Section 3 evaluation (6 Tier 1 + 6 Tier 2)

## User Stories

### Keyboard Shortcuts
- As a designer, I want to press Delete/Backspace to quickly remove selected shapes without clicking a button
- As a designer, I want to press Cmd+D to duplicate a shape so I can rapidly create multiple instances
- As a designer, I want to use arrow keys to nudge shapes pixel-by-pixel for precise positioning
- As a designer, I want to hold Shift+Arrow to move shapes faster (10px jumps)

### Copy/Paste
- As a designer, I want to press Cmd+C to copy selected shapes to my clipboard
- As a designer, I want to press Cmd+V to paste shapes with a slight offset so I can see both original and copy
- As a designer, I want copy/paste to work with multiple selected shapes simultaneously

### Color Picker (Shape Edit Bar)
- As a designer, I want to see a floating toolbar above each selected shape for contextual editing
- As a designer, I want to change the fill color of a shape using a color picker in the edit bar
- As a designer, I want to see my recently used colors for quick access
- As a designer, I want the edit bar to follow the shape as I pan and zoom
- As a designer, I want the edit bar to be extensible so more controls can be added in the future

### Z-index Management
- As a designer, I want to bring shapes to the front when they're hidden behind others
- As a designer, I want to send shapes to the back to create layered compositions
- As a designer, I want keyboard shortcuts (Cmd+] / Cmd+[) for quick layer adjustments
- As a designer, I want these operations to work on multiple selected shapes

### Alignment Tools
- As a designer, I want to align multiple selected shapes to their collective left edge
- As a designer, I want to center shapes horizontally or vertically within their bounding box
- As a designer, I want to distribute shapes evenly when I have 3+ selected
- As a designer, I want alignment tools to appear automatically when I select 2+ shapes

## Functional Requirements

### 1. Keyboard Shortcuts

**FR-1.1:** The system must support Delete key to remove all currently selected shapes
- Pressing Delete or Backspace removes shapes immediately (no confirmation for undo compatibility)
- Works with single or multiple selected shapes
- Syncs deletion to Firebase and other users in real-time

**FR-1.2:** The system must support Cmd+D (Mac) / Ctrl+D (Windows) to duplicate selected shapes
- Creates copies with 10px offset (down and right) from originals
- Duplicated shapes are auto-selected (originals deselected)
- Works with single or multiple selected shapes
- Generates new unique IDs for duplicates

**FR-1.3:** The system must support arrow key navigation to move selected shapes
- Arrow keys move shapes 1px in the pressed direction
- Shift+Arrow moves shapes 10px in the pressed direction
- Works with single or multiple selected shapes (group movement)
- Updates positions optimistically, syncs to Firebase on key release (debounced)

**FR-1.4:** The system must support Escape key to clear selection
- ESC deselects all shapes
- ESC cancels any active shape creation mode
- ESC closes the shapes panel if open

**FR-1.5:** The system must prevent default browser behavior for these shortcuts
- Cmd+D should not bookmark the page
- Arrow keys should not scroll the page when canvas is focused
- Event.preventDefault() must be called appropriately

### 2. Copy/Paste Functionality

**FR-2.1:** The system must support Cmd+C (Mac) / Ctrl+C (Windows) to copy selected shapes
- Copies all selected shapes to internal application state (not system clipboard)
- Shows brief toast notification "Copied X shape(s)"
- No-op if no shapes selected

**FR-2.2:** The system must support Cmd+V (Mac) / Ctrl+V (Windows) to paste shapes
- Pastes previously copied shapes with 20px offset (down and right)
- Pasted shapes are auto-selected
- Generates new unique IDs for pasted shapes
- Shows brief toast notification "Pasted X shape(s)"
- No-op if nothing copied

**FR-2.3:** The system must support Cmd+X (Mac) / Ctrl+X (Windows) to cut shapes
- Cuts = Copy + Delete
- Removes original shapes after copying to clipboard
- Shows brief toast notification "Cut X shape(s)"

**FR-2.4:** Copy/paste must preserve all shape properties
- Position (with offset applied)
- Size (width, height)
- Rotation
- Colors (fill, stroke)
- Text content and formatting
- All other shape properties

### 3. Color Picker (Shape Edit Bar)

**FR-3.1:** The system must display a floating edit bar above the selected shape
- Only appears when **exactly 1 shape** is selected (hidden for multi-selection)
- Edit bar appears as HTML overlay (not Konva, similar to cursor positioning)
- Positioned 10px above the top edge of the shape's bounding box
- Follows pan/zoom (recalculates position when viewport changes)
- White background with subtle shadow and rounded corners
- Animates in/out smoothly when selection changes

**FR-3.2:** The system must include a color picker button in the edit bar
- Paint bucket icon with current fill color shown as button background
- Clicking opens color picker popover below the button
- Popover includes:
  - HTML5 color input for full color selection
  - 8 most recently used colors as swatches (32x32px each)
  - Optional: 16-color default palette grid
- Popover closes when color selected or clicking outside

**FR-3.3:** The system must apply selected color to the shape
- Color applies to individual shape (not all selected shapes)
- Updates local state optimistically
- Syncs to Firebase for real-time collaboration
- Shows visual feedback (shape changes color immediately)

**FR-3.4:** The system must persist recent colors in localStorage
- Stores last 8 unique colors used
- Persists across sessions
- Newest colors added to front, oldest removed if > 8
- Shared across all shapes (not per-shape)

**FR-3.5:** The ShapeEditBar component must be extensible
- Designed as a reusable component accepting `shape` and `onUpdate` props
- Uses slot/children pattern for adding future controls
- Future features can add: stroke color, opacity slider, border width, etc.
- Clean separation: ShapeEditBar (container) + individual control components

### 4. Z-index Management

**FR-4.1:** The system must add a `zIndex` property to CanvasObject type
- Integer value (default: 0)
- Higher values render on top
- Stored in Firebase with other shape properties

**FR-4.2:** The system must render shapes in z-index order
- Shapes sorted by zIndex before rendering
- Shapes with equal zIndex maintain creation order
- Updates immediately when zIndex changes

**FR-4.3:** The system must support "Bring to Front" operation
- Button in Shape Edit Bar (ChevronsUp icon)
- Sets zIndex to max(all shapes) + 1
- Keyboard shortcut: Cmd+Shift+] (Mac) / Ctrl+Shift+] (Windows)
- **Single shape only:** Only works when exactly 1 shape is selected

**FR-4.4:** The system must support "Send to Back" operation
- Button in Shape Edit Bar (ChevronsDown icon)
- Sets zIndex to min(all shapes) - 1
- Keyboard shortcut: Cmd+Shift+[ (Mac) / Ctrl+Shift+[ (Windows)
- **Single shape only:** Only works when exactly 1 shape is selected

**FR-4.5:** The system must support "Bring Forward" operation
- Button in Shape Edit Bar (ChevronUp icon)
- Increments zIndex by 1
- Keyboard shortcut: Cmd+] (Mac) / Ctrl+] (Windows)
- **Single shape only:** Only works when exactly 1 shape is selected

**FR-4.6:** The system must support "Send Backward" operation
- Button in Shape Edit Bar (ChevronDown icon)
- Decrements zIndex by 1
- Keyboard shortcut: Cmd+[ (Mac) / Ctrl+[ (Windows)
- **Single shape only:** Only works when exactly 1 shape is selected

**FR-4.7:** The system must integrate z-index controls into the Shape Edit Bar
- 4 buttons displayed after a vertical divider from Color Picker
- Button layout: [To Front] [Forward] [Backward] [To Back]
- 32x32px buttons matching Color Picker size
- Tooltips show operation name and keyboard shortcut
- Only visible when exactly 1 shape is selected

### 5. Alignment Tools

**FR-5.1:** The system must show an alignment toolbar when 2+ shapes selected
- Floating toolbar appears above selection
- Position: centered horizontally, above topmost selected shape
- Toolbar disappears when selection < 2 shapes

**FR-5.2:** The system must support "Align Left" operation
- Aligns all selected shapes to leftmost edge of selection bounding box
- Moves shapes horizontally only (y positions unchanged)
- Keyboard shortcut: Cmd+Shift+L (Mac) / Ctrl+Shift+L (Windows)

**FR-5.3:** The system must support "Align Horizontal Center" operation
- Aligns centers of all selected shapes to horizontal center of bounding box
- Moves shapes horizontally only (y positions unchanged)
- Keyboard shortcut: Cmd+Shift+H (Mac) / Ctrl+Shift+H (Windows)

**FR-5.4:** The system must support "Align Right" operation
- Aligns all selected shapes to rightmost edge of selection bounding box
- Moves shapes horizontally only (y positions unchanged)
- Keyboard shortcut: Cmd+Shift+R (Mac) / Ctrl+Shift+R (Windows)

**FR-5.5:** The system must support "Align Top" operation
- Aligns all selected shapes to topmost edge of selection bounding box
- Moves shapes vertically only (x positions unchanged)
- Keyboard shortcut: Cmd+Shift+T (Mac) / Ctrl+Shift+T (Windows)

**FR-5.6:** The system must support "Align Vertical Center" operation
- Aligns centers of all selected shapes to vertical center of bounding box
- Moves shapes vertically only (x positions unchanged)
- Keyboard shortcut: Cmd+Shift+M (Mac) / Ctrl+Shift+M (Windows)

**FR-5.7:** The system must support "Align Bottom" operation
- Aligns all selected shapes to bottommost edge of selection bounding box
- Moves shapes vertically only (x positions unchanged)
- Keyboard shortcut: Cmd+Shift+B (Mac) / Ctrl+Shift+B (Windows)

**FR-5.8:** The system must support "Distribute Horizontally" operation
- Requires 3+ selected shapes
- Distributes shapes evenly between leftmost and rightmost shapes
- Maintains shape order (left to right)
- Moves shapes horizontally only

**FR-5.9:** The system must support "Distribute Vertically" operation
- Requires 3+ selected shapes
- Distributes shapes evenly between topmost and bottommost shapes
- Maintains shape order (top to bottom)
- Moves shapes vertically only

**FR-5.10:** All alignment operations must batch update Firebase
- Single transaction for all shape position changes
- Optimistic local updates with background sync
- Syncs to other users in real-time

## Non-Goals (Out of Scope)

1. **System clipboard integration** - Copy/paste uses internal state only (not OS clipboard)
2. **Stroke color picker** - Only fill color supported in this phase
3. **Gradient/pattern fills** - Solid colors only
4. **Smart guides/snapping** - Pure alignment tools only
5. **Alignment to canvas bounds** - Only align to selection bounding box
6. **Undo/redo** - Deferred to future phase (would add 2 points but higher complexity)
7. **Object grouping** - Deferred (would require data model changes)
8. **Layers panel UI** - Z-index only, no visual layers list
9. **Right-click context menus** - Toolbar and keyboard only
10. **Custom keyboard shortcut configuration** - Fixed shortcuts only

## Design Considerations

### Shape Edit Bar (Per-Shape Floating Toolbar)
- **Position:** HTML overlay positioned 10px above shape's top edge
- **Style:** White background, shadow (0 4px 12px rgba(0,0,0,0.15)), rounded (8px), padding (8px)
- **Layout:** Horizontal flex container for extensibility
- **Animation:** Fade in/out (200ms) when selection changes
- **Responsiveness:** Recalculates position on pan/zoom/window resize
- **Single selection only:** Only appears when exactly 1 shape is selected
- **Z-index (CSS):** High value (9999) to appear above all canvas elements
- **Controls:** Color Picker and Z-Index controls (4 buttons)

### Color Picker Component (Inside Edit Bar)
- **Button:** 32x32px square, current fill color as background, white border
- **Icon:** Paint bucket icon overlaid on color background (white/black for contrast)
- **Popover:** Positioned below button, arrow pointing up, 240px wide
- **Recent colors:** 8 swatches in single row (28x28px each, 4px gap)
- **Default palette:** 4 rows x 4 columns (28x28px, 4px gap)
- **Native picker:** HTML5 `<input type="color">` with label "Custom Color"
- **Accessibility:** All swatches keyboard navigable, ARIA labels

### Extensibility Pattern
- **ShapeEditBar.tsx:** Container component
  - Props: `shape: CanvasObject`, `onUpdate: (updates: Partial<CanvasObject>) => void`, `stageScale: number`
  - Children: Renders control components (ColorPicker, future controls)
- **Future controls** (examples for extensibility):
  - `<StrokeColorPicker />` - Border color control
  - `<OpacitySlider />` - Transparency slider (0-100%)
  - `<BorderWidthInput />` - Stroke width input
  - `<CornerRadiusSlider />` - Rounded corners for rectangles
- **Control component interface:**
  ```typescript
  interface EditControl {
    value: any;
    onChange: (newValue: any) => void;
  }
  ```

### Z-Index Controls (Inside Shape Edit Bar)
- **Position:** Inside Shape Edit Bar, right of Color Picker
- **Layout:** 4 icon buttons in horizontal row with divider
- **Icons:** ChevronsUp (⬆⬆), ChevronUp (⬆), ChevronDown (⬇), ChevronsDown (⬇⬇) from lucide-react
- **Size:** 32x32px buttons to match Color Picker
- **Tooltips:** Show operation name + keyboard shortcut on hover
- **Single shape only:** Only visible when exactly 1 shape is selected

### Alignment Toolbar
- **Appearance:** Floating toolbar with white background, subtle shadow
- **Layout:** Horizontal button group, icons for each alignment type
- **Icons:** Standard alignment icons (left lines, center lines, etc.)
- **Position:** Dynamically positioned above selection, follows pan/zoom
- **Visibility:** Fade in/out animation when selection changes

### Keyboard Shortcut Indicators
- **Tooltips:** Show keyboard shortcut on hover over all buttons
- **Format:** "Bring to Front (⌘⇧])" on Mac, "Bring to Front (Ctrl+Shift+])" on Windows
- **Help panel:** Optional floating help panel showing all shortcuts (ESC to close)

## Component Architecture

### ShapeEditBar Component Structure

```typescript
// Container component - rendered once per selected shape
<ShapeEditBar
  shape={shape}
  stageScale={stageScale}
  stageX={stageX}
  stageY={stageY}
  onUpdate={(updates) => handleShapeUpdate(shape.id, updates)}
>
  {/* Control components plugged in */}
  <ColorPickerControl
    value={shape.fill}
    onChange={(color) => onUpdate({ fill: color })}
  />
  
  {/* Future controls can be added here */}
  {/* <StrokeColorControl ... /> */}
  {/* <OpacityControl ... /> */}
  {/* <BorderWidthControl ... /> */}
</ShapeEditBar>
```

### Extensibility Examples

**Adding Stroke Color Picker (Future):**
```typescript
<ColorPickerControl
  label="Stroke"
  value={shape.stroke}
  onChange={(color) => onUpdate({ stroke: color })}
/>
```

**Adding Opacity Slider (Future):**
```typescript
<OpacityControl
  value={shape.opacity ?? 1}
  onChange={(opacity) => onUpdate({ opacity })}
/>
```

**Adding Border Width Input (Future):**
```typescript
<BorderWidthControl
  value={shape.strokeWidth ?? 0}
  onChange={(width) => onUpdate({ strokeWidth: width })}
/>
```

### Control Component Interface

All control components follow this pattern:
```typescript
interface ControlProps<T> {
  value: T;
  onChange: (newValue: T) => void;
  disabled?: boolean;
}
```

This allows easy addition of new controls without modifying ShapeEditBar logic.

## Technical Considerations

### 1. Keyboard Event Handling
- Use `useEffect` with `keydown` event listener on window
- Check for meta key (Mac) vs ctrl key (Windows) via `e.metaKey` and `e.ctrlKey`
- Prevent default browser actions for design tool shortcuts
- Cleanup listener on unmount
- Only active when canvas in focus (not when modals open)

### 2. Z-index Implementation
- **Data model:** Add `zIndex?: number` to CanvasObject interface
- **Default value:** 0 for new shapes
- **Sorting:** Sort shapes array by zIndex before mapping to Shape components
- **Firebase:** Store zIndex with other shape properties in `canvas-objects` collection
- **Migration:** Existing shapes without zIndex default to 0 (backward compatible)

### 3. Alignment Math
- **Bounding box:** Calculate min/max x/y across all selected shapes
- **Algorithms:**
  - Left align: `newX = boundingBox.minX`
  - Center align: `newX = boundingBox.centerX - (shape.width / 2)`
  - Distribute: Sort by position, calculate spacing, apply offsets
- **Batch updates:** Use `Promise.all()` for parallel Firebase writes

### 4. Shape Edit Bar Implementation
- **Component:** New `ShapeEditBar.tsx` component
- **Rendering:** HTML overlay (not Konva), rendered by Canvas component
- **Position calculation:**
  - Get shape bounding box: `{ x, y, width, height }`
  - Apply stage transformation: `screenX = (x * stageScale) + stageX`
  - Position edit bar: `top = screenY - 50px`, `left = screenX + (width * stageScale / 2) - (barWidth / 2)`
- **Multiple shapes:** Map over `selectedShapeIds`, render one bar per shape
- **Update handler:** Pass callback from Canvas to update shape in Firebase
- **Lifecycle:** Recalculate positions on:
  - Selection change
  - Pan/zoom (stage position/scale change)
  - Window resize
  - Shape property updates (position/size)

### 5. Color Picker State
- **Recent colors:** Store in localStorage as JSON array
- **Key:** `collabcanvas_recent_colors`
- **Format:** `["#FF5733", "#33FF57", ...]`
- **Max size:** 8 colors, FIFO queue
- **Component state:** Popover open/closed state per edit bar

### 6. Copy/Paste State
- **Clipboard state:** React state in Canvas component (not global)
- **Data structure:** `clipboardShapes: CanvasObject[]`
- **ID generation:** Use existing `generateUniqueId()` utility
- **Offset logic:** Add 20px to both x and y coordinates

### 7. Performance
- **Debouncing:** Debounce arrow key movements (100ms) before Firebase sync
- **Batch updates:** Group alignment/z-index changes into single Firebase transaction
- **Optimistic UI:** Update local state immediately, sync in background
- **Event throttling:** Throttle keydown events to prevent rapid-fire (50ms)

## Success Metrics

### Functional Success
- ✅ Delete key removes selected shapes
- ✅ Cmd+D duplicates shapes with proper offset
- ✅ Arrow keys move shapes 1px (10px with Shift)
- ✅ Cmd+C/V copies and pastes shapes
- ✅ ShapeEditBar appears above each selected shape
- ✅ Color picker in edit bar changes fill color
- ✅ Recent colors persist across sessions
- ✅ Edit bar follows shape during pan/zoom
- ✅ Z-index keyboard shortcuts reorder shapes correctly
- ✅ Alignment buttons align 2+ shapes precisely
- ✅ Distribute evenly spaces 3+ shapes

### Performance Success
- ShapeEditBar appears in < 100ms after selection
- Edit bar position updates at 60 FPS during pan/zoom
- Keyboard actions execute in < 50ms
- Alignment operations complete in < 200ms (even with 10+ shapes)
- No frame drops during keyboard-driven movement
- Firebase sync completes in < 300ms

### User Experience Success
- Tooltips clearly show keyboard shortcuts
- Visual feedback for all operations (toasts, immediate updates)
- Alignment toolbar appears/disappears smoothly
- ShapeEditBar is clearly associated with its shape
- Edit bar doesn't obscure important canvas areas
- Color picker shows current shape's color
- Operations work consistently with multi-selection

### Evaluation Success
- **Keyboard shortcuts:** 2 points (Tier 1)
- **Copy/paste:** 2 points (Tier 1)
- **Color picker:** 2 points (Tier 1)
- **Z-index management:** 3 points (Tier 2)
- **Alignment tools:** 3 points (Tier 2)
- **Total:** 12 points (Good tier)

## Open Questions

1. **Color picker position:** Should it be in the main toolbar or float near selection?
   - *Recommendation:* Main toolbar for consistency with mode buttons
   
2. **Keyboard shortcut conflicts:** Some shortcuts may conflict with browser/OS
   - *Recommendation:* Document known conflicts, use preventDefault judiciously
   
3. **Alignment toolbar styling:** Match main toolbar or create distinct floating style?
   - *Recommendation:* Distinct floating style (Figma-like) for visual hierarchy
   
4. **Z-index range:** Should we normalize z-index values or allow unbounded integers?
   - *Recommendation:* Allow unbounded (simpler), normalize only if performance issues
   
5. **Copy/paste across canvases:** Should clipboard persist when switching canvases?
   - *Recommendation:* No - clear clipboard on canvas switch for simpler state management

## Implementation Phases

### Phase 1: Foundation (Keyboard Infrastructure)
- Set up keyboard event handler system
- Implement ESC key (clear selection)
- Implement Delete key
- Add keyboard shortcut detection utilities

### Phase 2: Object Manipulation
- Implement Cmd+D duplicate
- Implement arrow key movement with Shift modifier
- Implement Cmd+C/V/X copy/paste/cut
- Add clipboard state management

### Phase 3: Visual Styling
- Add zIndex to data model
- Implement z-index rendering order
- Add z-index toolbar buttons
- Implement z-index keyboard shortcuts

### Phase 4: Shape Edit Bar & Color Controls
- Create ShapeEditBar.tsx component (extensible container)
- Implement position calculation logic (follows pan/zoom)
- Create ColorPicker control component
- Implement color picker popover with recent colors
- Add recent colors persistence to localStorage
- Wire up to Canvas component (render per selected shape)

### Phase 5: Alignment System
- Calculate selection bounding box utility
- Implement alignment algorithms
- Create alignment toolbar UI
- Wire up keyboard shortcuts
- Add distribute functionality

### Phase 6: Polish & Testing
- Add tooltips with keyboard shortcuts
- Implement toast notifications
- Write unit tests for alignment math
- Write integration tests for keyboard workflows
- Performance testing with many shapes
- Cross-browser testing (Chrome, Firefox, Safari)

## Acceptance Criteria

### Overall
- [ ] All 5 feature sets fully functional
- [ ] All keyboard shortcuts work on Mac and Windows
- [ ] All features work with multi-selection
- [ ] All operations sync in real-time to other users
- [ ] No regressions in existing features
- [ ] All existing tests still pass (266 tests)

### Keyboard Shortcuts
- [ ] Delete removes shapes immediately
- [ ] Cmd+D duplicates with 10px offset
- [ ] Arrow keys move 1px (10px with Shift)
- [ ] ESC clears selection and cancels modes
- [ ] No browser default behaviors triggered

### Copy/Paste
- [ ] Cmd+C copies selected shapes
- [ ] Cmd+V pastes with 20px offset
- [ ] Cmd+X cuts shapes
- [ ] Toast notifications appear for each action
- [ ] All shape properties preserved

### Shape Edit Bar & Color Picker
- [ ] Edit bar appears above each selected shape
- [ ] Edit bar follows shapes during pan/zoom
- [ ] Edit bar repositions on window resize
- [ ] Color picker button shows current shape color
- [ ] Color picker popover opens/closes correctly
- [ ] Recent colors display and work
- [ ] Color persists in localStorage
- [ ] Component is extensible for future controls

### Z-index
- [ ] Shapes render in correct order
- [ ] All 4 operations work (front/forward/backward/back)
- [ ] Keyboard shortcuts functional
- [ ] Toolbar buttons enabled/disabled correctly
- [ ] Works with multi-selection

### Alignment
- [ ] Toolbar appears with 2+ shapes selected
- [ ] All 6 alignment operations work correctly
- [ ] Both distribute operations work (3+ shapes)
- [ ] Keyboard shortcuts functional
- [ ] Batch Firebase updates complete

## Dependencies

- Existing multi-selection system (✅ already implemented)
- Existing shape manipulation system (✅ already implemented)
- Existing Firebase sync system (✅ already implemented)
- Existing HTML overlay pattern (✅ used for cursors, same for edit bar)
- React-konva for rendering (✅ already installed)
- Lodash for debounce utility (needs installation)
- Lucide-react for additional icons (✅ already installed - need PaintBucket, ChevronUp, ChevronDown icons)

## Risks & Mitigations

### Risk 1: Keyboard shortcuts conflict with browser
**Mitigation:** Use preventDefault() selectively, document known conflicts, test across browsers

### Risk 2: Alignment math errors with rotated shapes
**Mitigation:** Comprehensive unit tests, handle rotation in bounding box calculations

### Risk 3: Z-index values become very large/small over time
**Mitigation:** Add normalization function to compact z-index values (run occasionally)

### Risk 4: Color picker performance with many shapes
**Mitigation:** Batch color updates, use optimistic rendering

### Risk 5: Clipboard state management complexity
**Mitigation:** Keep clipboard local to Canvas component, clear on unmount

### Risk 6: Edit bar obscuring shapes or going off-screen
**Mitigation:** Smart positioning logic - position below shape if near top edge, adjust horizontal position if near canvas edge

## Timeline Estimate

- **Phase 1 (Keyboard Infrastructure):** 3-4 hours
- **Phase 2 (Object Manipulation):** 4-5 hours
- **Phase 3 (Z-index System):** 3-4 hours
- **Phase 4 (Shape Edit Bar & Color Controls):** 5-7 hours
  - Edit bar positioning logic: 2-3 hours
  - Color picker component: 2-3 hours
  - Integration and testing: 1 hour
- **Phase 5 (Alignment System):** 5-6 hours
- **Phase 6 (Polish & Testing):** 4-5 hours

**Total Estimate:** 24-31 hours of development time

## References

- Figma keyboard shortcuts: https://help.figma.com/hc/en-us/articles/360040328653
- Konva z-index documentation: https://konvajs.org/docs/groups_and_layers/zIndex.html
- React keyboard event handling: https://react.dev/learn/responding-to-events
- Alignment algorithms reference: Standard design tool patterns (Figma, Sketch)

