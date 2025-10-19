# Product Requirements Document: Shape Editing Enhancements

## Introduction/Overview

This PRD outlines a comprehensive set of editing and interaction enhancements for the CollabCanvas editor to bring it closer to professional design tools like Figma. The features include: text boxes as first-class objects, text labels on shapes, multi-selection capabilities, transform controls (resize/rotate), and refined interaction modes. These enhancements will transform the canvas from a simple shape placement tool into a full-featured editing workspace.

**Problem**: Currently, users can only create and move basic shapes. There's no way to add text content, resize or rotate shapes after creation, or manipulate multiple shapes at once. The default shape styling uses bright colors that may not be suitable for all use cases.

**Solution**: Implement a complete editing toolkit including text creation, shape labeling, selection management (single and multi), transform controls (resize handles and rotation), and updated default styling to provide a professional, intuitive editing experience.

---

## Goals

1. **Rich Text Support**: Enable users to create standalone text boxes with formatting capabilities (bold, italic, font size)
2. **Shape Labeling**: Allow users to add text labels to existing shapes for annotations and descriptions
3. **Multi-Selection**: Support selecting and manipulating multiple shapes simultaneously
4. **Transform Controls**: Provide visual handles for resizing and rotating shapes after creation
5. **Refined Defaults**: Update default shape styling to professional white-fill with subtle borders
6. **Interaction Clarity**: Establish clear interaction modes (select vs pan) and visual feedback
7. **Collaborative Compatibility**: Ensure all new features work seamlessly with real-time collaboration

---

## User Stories

### US-1: Standalone Text Creation
**As a** canvas user  
**I want** to create text boxes with rich formatting  
**So that** I can add labels, notes, and descriptions directly on the canvas

**Acceptance Criteria**:
- Text button (T) appears in bottom toolbar next to Shapes button
- Clicking T button enters text creation mode
- Ghost text box preview follows cursor
- Clicking canvas places text box and opens inline editor
- Editor supports bold, italic, underline, and font size selection
- Text boxes can be moved and selected like other shapes
- Text boxes sync in real-time across users

---

### US-2: Default Shape Styling
**As a** canvas user  
**I want** shapes to have clean, professional default styling  
**So that** my designs look polished without manual styling

**Acceptance Criteria**:
- All newly created shapes have white fill (`#FFFFFF`)
- All newly created shapes have 2px gray-800 border (`#1F2937`)
- Existing shapes on canvas are unaffected
- New default applies to all shape types (rectangle, circle, ellipse, star, etc.)
- Users can still customize colors later (future feature)

---

### US-3: Text Labels on Shapes
**As a** canvas user  
**I want** to add text labels to my shapes  
**So that** I can annotate and describe what each shape represents

**Acceptance Criteria**:
- Single-clicking a shape enters "selected state"
- Selected shape without text shows "Add text" placeholder centered in shape
- Clicking selected shape again opens inline text editor
- Text is centered horizontally and vertically in shape
- Text wraps to multiple lines if needed
- Text truncates with "..." if it overflows the shape boundaries
- Only one text label allowed per shape
- Text content syncs in real-time across users

---

### US-4: Multi-Selection via Shift+Click
**As a** canvas user  
**I want** to select multiple shapes by holding Shift and clicking  
**So that** I can perform batch operations efficiently

**Acceptance Criteria**:
- Shift+Click on unselected shape adds it to selection
- Shift+Click on already-selected shape removes it from selection
- All selected shapes show blue borders (`#3B82F6`) instead of green
- Selected shapes can be moved together as a group
- Delete key removes all selected shapes
- Clicking background or pressing ESC clears multi-selection

---

### US-5: Multi-Selection via Drag Rectangle
**As a** canvas user  
**I want** to drag a selection rectangle to select multiple shapes  
**So that** I can quickly select shapes in a region

**Acceptance Criteria**:
- Click and drag on empty canvas draws a semi-transparent blue selection rectangle
- All shapes whose bounding boxes intersect the rectangle are selected
- Selection rectangle disappears when mouse is released
- Selected shapes show blue borders
- Works in combination with Shift+Click (additive selection)

---

### US-6: Resize Handles
**As a** canvas user  
**I want** to resize shapes using corner handles  
**So that** I can adjust shape dimensions visually

**Acceptance Criteria**:
- When a single shape is selected, 4 corner resize handles appear
- Handles are positioned at top-left, top-right, bottom-left, bottom-right
- Dragging a handle resizes the shape from that corner
- Resize does NOT maintain aspect ratio (allows stretching)
- Shape content (text labels) remains centered during resize
- Resize handles do NOT appear when multiple shapes are selected
- Resized dimensions sync in real-time across users

---

### US-7: Rotation Handle
**As a** canvas user  
**I want** to rotate shapes using a rotation handle  
**So that** I can angle shapes for better composition

**Acceptance Criteria**:
- When a single shape is selected, a rotation handle appears above the shape
- Rotation handle is connected to the shape by a line
- Dragging the rotation handle rotates the shape around its center
- Rotation is smooth (no snapping to angles for MVP)
- Shape text label rotates with the shape
- Rotation handle does NOT appear when multiple shapes are selected
- Rotation angle syncs in real-time across users

---

### US-8: Interaction Mode Toggle
**As a** canvas user  
**I want** explicit mode buttons to switch between select and pan modes  
**So that** I have clear control over canvas interactions

**Acceptance Criteria**:
- Mode toggle buttons appear in toolbar: [👆 Select] [✋ Pan] positioned left of separator and Shapes button
- **Pan Mode** is the default interaction mode
- Only one mode can be active at a time (segmented control appearance)
- Active mode button is highlighted (blue background)
- Mode persists until user explicitly switches
- Visual cursor changes based on mode (default cursor in pan, pointer on shapes in both)

---

### US-9: Pan Mode Behavior
**As a** canvas user  
**I want** pan mode to allow easy navigation while still being able to select shapes  
**So that** I can quickly navigate and interact without constantly switching modes

**Acceptance Criteria**:
- In Pan Mode: click-drag background pans the canvas
- In Pan Mode: mouse wheel zooms toward cursor position
- In Pan Mode: clicking a shape selects it (mode stays Pan)
- In Pan Mode: dragging a selected shape moves it
- In Pan Mode: selection rectangle is NOT available
- Pan Mode is the default when canvas loads

---

### US-10: Select Mode Behavior
**As a** canvas user  
**I want** select mode to provide advanced selection tools  
**So that** I can efficiently select single or multiple shapes

**Acceptance Criteria**:
- In Select Mode: clicking a shape selects it
- In Select Mode: Shift+click adds/removes shapes from selection
- In Select Mode: click-drag on background draws selection rectangle
- In Select Mode: mouse wheel still zooms toward cursor
- In Select Mode: cannot pan (must switch to Pan mode)
- In Select Mode: dragging a selected shape moves it

---

### US-11: Selection Priority
**As a** canvas user  
**I want** group selection to take priority over individual shape interactions  
**So that** I don't accidentally trigger single-shape actions when manipulating groups

**Acceptance Criteria**:
- When multiple shapes are selected, no transform handles appear
- When multiple shapes are selected, clicking a selected shape does NOT deselect others
- When multiple shapes are selected, dragging any selected shape moves the entire group
- To edit a single shape from a group: deselect all (ESC), then select individual shape

---

## Functional Requirements

### FR-1: Text Box Creation
1. Add "Text" button (icon: T) to bottom toolbar (`CanvasToolbar.tsx`)
2. Position: immediately to the right of "Shapes" button
3. Clicking button enters text creation mode (`creatingShapeType = 'text'`)
4. In creation mode:
   - Cursor changes to text cursor (I-beam)
   - Ghost text box (100x40px default) follows cursor position
   - Ghost is semi-transparent with dashed border
5. Clicking canvas places text box at cursor position
6. Immediately opens inline rich text editor
7. Text box saved to Firebase with type: `'text'`

### FR-2: Rich Text Editor
1. Create component: `RichTextEditor.tsx`
2. Editor appears as floating toolbar above selected text box
3. Toolbar includes:
   - **Bold** button (Cmd/Ctrl+B)
   - **Italic** button (Cmd/Ctrl+I)
   - **Underline** button (Cmd/Ctrl+U)
   - Font size dropdown (8pt, 10pt, 12pt, 14pt, 16pt, 18pt, 24pt, 36pt)
   - Default font size: 14pt
4. Editor uses `contentEditable` div or lightweight rich text library
5. Text content stored in shape object as HTML string or structured format
6. Editor closes on: click outside, press ESC, press Enter (if single-line)
7. Text changes sync to Firebase immediately (debounced 300ms)

### FR-3: Default Shape Styling
1. Update shape creation functions in `Canvas.tsx`
2. Set default `fill` property to `'#FFFFFF'` (white)
3. Add default `stroke` property to `'#1F2937'` (gray-800)
4. Add default `strokeWidth` property to `2`
5. Update `CanvasObject` type in `types/index.ts` to include:
   ```typescript
   stroke?: string;
   strokeWidth?: number;
   ```
6. Update `Shape.tsx` to render stroke properties
7. Only apply to shapes created after this feature deploys

### FR-4: Shape Text Labels
1. Add `text` property to `CanvasObject` type:
   ```typescript
   text?: string;
   textFormat?: {
     bold?: boolean;
     italic?: boolean;
     fontSize?: number;
   };
   ```
2. Update `Shape.tsx` to render text inside shapes:
   - Use Konva `Text` component
   - Center align horizontally and vertically
   - Word wrap enabled
   - Ellipsis for overflow (CSS: `text-overflow: ellipsis`)
3. When shape selected without text:
   - Render "Add text" placeholder in light gray
4. When selected shape is clicked again:
   - If click is within shape bounds: open text editor
   - Text editor appears inline over the shape
5. Text editor is simple for MVP (plain text, no rich formatting on shape labels)
6. Text updates saved to Firebase on blur or ESC

### FR-5: Updated Canvas Toolbar (Bottom-Center)
1. Update `CanvasToolbar.tsx`:
   - Add props:
     - `interactionMode: 'select' | 'pan'`
     - `onSetMode: (mode: 'select' | 'pan') => void`
     - `onToggleShapes: () => void`
     - `onCreateText: () => void`
2. Position: `absolute bottom-4 left-1/2 -translate-x-1/2 z-10`
3. Layout (left to right):
   - **Select button** (👆 icon) - Active in select mode
   - **Pan button** (✋ icon) - Active in pan mode (default)
   - **Vertical separator** (thin gray line)
   - **Shapes button** (🔲 icon)
   - **Text button** (T icon)
4. Styling:
   - Active mode button: blue background `bg-blue-500 text-white`
   - Inactive mode button: white background `bg-white text-gray-700`
   - Segmented control appearance for mode buttons (rounded left/right edges)
   - All buttons same height for visual consistency
5. Button arrangement: `[Select][Pan] | [Shapes][Text]`

### FR-6: Single Selection Visual Feedback
1. Update `Shape.tsx` selection indicator:
   - Change from green (`#10B981`) to blue (`#3B82F6`)
   - Keep 3px stroke width
2. Add transform handles when single shape selected:
   - Render as small squares (8x8px) at each corner
   - Handles are white fill with blue border
   - Handles appear ONLY when one shape is selected

### FR-7: Multi-Selection State Management
1. Update Canvas.tsx state:
   ```typescript
   // Before: const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
   // After:
   const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);
   ```
2. Add helper functions:
   - `addToSelection(shapeId: string)`
   - `removeFromSelection(shapeId: string)`
   - `clearSelection()`
   - `isSelected(shapeId: string): boolean`
3. Update Shape.tsx to accept `isSelected` based on ID being in array

### FR-8: Shift+Click Multi-Selection
1. Update `handleShapeClick` in Canvas.tsx:
   ```typescript
   const handleShapeClick = (shapeId: string, event: MouseEvent) => {
     if (event.shiftKey) {
       if (isSelected(shapeId)) {
         removeFromSelection(shapeId);
       } else {
         addToSelection(shapeId);
       }
     } else {
       setSelectedShapeIds([shapeId]); // Replace selection
     }
   };
   ```

### FR-9: Drag Rectangle Selection
1. Add state:
   ```typescript
   const [selectionRect, setSelectionRect] = useState<{
     x: number;
     y: number;
     width: number;
     height: number;
   } | null>(null);
   ```
2. On Stage mousedown (background only):
   - Record start position
   - Begin drawing selection rectangle
3. On Stage mousemove (while dragging):
   - Update selection rectangle dimensions
   - Render semi-transparent blue rectangle (Konva Rect)
4. On Stage mouseup:
   - Check which shapes intersect rectangle (bounding box collision)
   - Add intersecting shapes to selection
   - Clear selection rectangle
5. If Shift held during drag, add to existing selection (otherwise replace)

### FR-10: Resize Handles Implementation
1. Create component: `TransformHandles.tsx`
2. Component accepts:
   - `shape: CanvasObject` - the selected shape
   - `onResize: (shapeId, newWidth, newHeight) => void`
   - `onRotate: (shapeId, newRotation) => void`
3. Render 4 corner handles as Konva Circles or Rects
4. Position handles at shape corners (account for shape type):
   - Rectangle: use x, y, width, height directly
   - Circle/Ellipse: calculate bounding box corners
5. Handle drag logic:
   - Top-left: anchor bottom-right, adjust x, y, width, height
   - Top-right: anchor bottom-left, adjust y, width, height
   - Bottom-left: anchor top-right, adjust x, width, height
   - Bottom-right: anchor top-left, adjust width, height
6. Do NOT maintain aspect ratio
7. Only render when `selectedShapeIds.length === 1`

### FR-11: Rotation Handle Implementation
1. Add to `TransformHandles.tsx`
2. Rotation handle positioned above shape center:
   - Position: `y = shape.y - 40px`
   - Connected to shape by thin line
3. Handle is small circle (10px radius)
4. On drag:
   - Calculate angle between handle position and shape center
   - Update shape rotation property
5. Add `rotation` property to `CanvasObject` type:
   ```typescript
   rotation?: number; // Degrees
   ```
6. Update `Shape.tsx` to apply rotation transform
7. Only render when `selectedShapeIds.length === 1`

### FR-12: Interaction Mode Management
1. Add state:
   ```typescript
   const [interactionMode, setInteractionMode] = useState<'select' | 'pan'>('pan'); // Default: pan
   ```
2. Mode switching via toolbar buttons only (no keyboard shortcuts for mode switching)
3. Pan Mode behavior:
   - Click-drag on background: pan canvas
   - Click on shape: select shape (mode stays pan)
   - Mouse wheel: zoom toward cursor
   - Drag selected shape: move shape
   - Selection rectangle disabled
4. Select Mode behavior:
   - Click shape: select shape
   - Shift+click: add/remove from selection
   - Click-drag on background: draw selection rectangle
   - Mouse wheel: zoom toward cursor
   - Drag selected shape: move shape
   - Panning disabled (user must switch to Pan mode)
5. Update cursor styling based on mode and context:
   - Pan mode + not dragging: `cursor: grab`
   - Pan mode + dragging background: `cursor: grabbing`
   - Pan mode + hovering shape: `cursor: pointer`
   - Select mode: `cursor: default`
   - Select mode + hovering shape: `cursor: pointer`
   - Creating shape: `cursor: crosshair`
6. Mouse wheel zoom enabled in both modes

### FR-13: Group Drag Implementation
1. Update `handleDragStart` in Canvas.tsx:
   - If dragged shape is in `selectedShapeIds`, drag all selected shapes
   - Record initial positions of all selected shapes
2. Update `handleDragMove`:
   - Calculate delta from drag start
   - Apply same delta to all selected shapes' positions
3. Update `handleDragEnd`:
   - Save all shapes' new positions to Firebase in batch

### FR-14: Group Selection Priority
1. When multiple shapes selected:
   - Do NOT render transform handles
   - Clicking a selected shape does NOT deselect others (only drags group)
   - Clicking background clears selection
   - ESC key clears selection
2. To edit single shape from group:
   - User must clear selection first
   - Then click individual shape

---

## Non-Goals (Out of Scope)

1. **Color Picker UI** - Shape styling controls deferred to future feature
2. **Undo/Redo** - Would require command pattern, not in scope
3. **Shape Grouping** - Explicit group objects (beyond multi-select) not included
4. **Alignment Tools** - Snap-to-grid, align-to-shape features deferred
5. **Copy/Paste** - Duplication features not in scope
6. **Layer Management** - Z-index controls and layer panel deferred
7. **Advanced Text Formatting** - Font family, text color, alignment beyond basic MVP
8. **Transform Constraints** - Lock aspect ratio, constrain rotation angles not included
9. **Selection Indicator Customization** - Blue border is fixed for MVP
10. **Context Menu** - Right-click menus not in scope
11. **Transform History** - Version history of shape transformations not tracked
12. **Collaborative Transform Conflicts** - Advanced conflict resolution for simultaneous transforms deferred

---

## Design Considerations

### Visual Design

**Text Creation Mode:**
```
┌─ ─ ─ ─ ─ ┐
│ Text Box │  ← Ghost preview follows cursor
└─ ─ ─ ─ ─ ┘
```

**Text Label Placeholder:**
```
┌─────────────┐
│             │
│  Add text   │  ← Centered gray placeholder
│             │
└─────────────┘
```

**Single Selection with Transform Handles:**
```
    ○ ← Rotation handle
    |
    |
□ ┌─────────┐ □
  │         │    
  │  Shape  │    
  │         │    
□ └─────────┘ □

□ = Resize handles (4 corners)
○ = Rotation handle (top center)
```

**Multi-Selection (No Handles):**
```
┌─────────┐     ┌────┐
│ Shape 1 │     │ S2 │
└─────────┘     └────┘
     ↑               ↑
Blue borders only, no handles
```

### Component Architecture

```
Canvas.tsx
├── CanvasToolbar (bottom-center)
│   ├── Select mode button (NEW)
│   ├── Pan mode button (NEW)
│   ├── Shapes button
│   └── Text button (NEW)
├── ZoomControls (bottom-right)
│   ├── Zoom out [-]
│   └── Zoom in [+]
├── Stage (Konva)
│   ├── Background Layer
│   ├── Shapes Layer
│   │   ├── Shape (with optional text label)
│   │   └── Shape
│   ├── Selection Rectangle (NEW - only in select mode)
│   └── Transform Layer (NEW)
│       └── TransformHandles (only for single selection)
├── RichTextEditor (NEW - floating toolbar)
└── UserPresence (unchanged)
```

### Data Model Updates

**Updated CanvasObject Type:**
```typescript
export interface CanvasObject {
  id: string;
  type: ShapeType | 'text'; // Add 'text' type
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke?: string; // NEW - border color
  strokeWidth?: number; // NEW - border width
  rotation?: number; // NEW - rotation in degrees
  text?: string; // NEW - text label content
  textFormat?: { // NEW - text formatting
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    fontSize?: number;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  lastEditedBy?: string;
}
```

### Styling Guidelines

**Default Shape Styling:**
- Fill: `#FFFFFF` (white)
- Stroke: `#1F2937` (gray-800)
- Stroke Width: `2px`

**Selection Indicators:**
- Single selection: Blue border `#3B82F6`, 3px width
- Multi-selection: Blue border `#3B82F6`, 3px width
- Old green color `#10B981` replaced entirely

**Transform Handles:**
- Size: 8x8px squares for resize, 10px circle for rotation
- Fill: White `#FFFFFF`
- Stroke: Blue `#3B82F6`, 2px width
- Hover: Blue fill `#3B82F6`, white stroke (inverted)

**Selection Rectangle:**
- Fill: Blue `#3B82F6` at 20% opacity
- Stroke: Blue `#3B82F6`, 1px dashed

**Text Defaults:**
- Font: System default (Arial, Helvetica, sans-serif)
- Size: 14pt
- Color: Black `#000000`
- Align: Center (horizontal and vertical)

---

## Technical Considerations

### Implementation Phases

**Phase 1: Interaction Modes & Toolbar (Low-Medium Risk)**
1. Add interaction mode state (pan vs select)
2. Update CanvasToolbar with mode toggle buttons
3. Implement pan mode behavior (click-drag to pan, click shape to select)
4. Implement select mode behavior (selection rectangle)
5. Keep mouse wheel zoom enabled
6. Update cursor styling based on mode

**Phase 2: Foundation & Default Styling (Low Risk)**
1. Update default shape colors (white + gray-800 border)
2. Add stroke properties to data model
3. Update Shape.tsx to render strokes
4. Test with real-time sync

**Phase 3: Selection System Refactor (Medium Risk)**
1. Change `selectedShapeId` to `selectedShapeIds` array
2. Update all selection logic
3. Change selection color to blue
4. Test single selection still works

**Phase 4: Multi-Selection (Medium Risk)**
1. Implement Shift+Click logic
2. Implement drag rectangle selection
3. Implement group drag
4. Add visual feedback for multi-selection
5. Test with edge cases (empty selection, all shapes selected)

**Phase 5: Transform Handles (High Risk)**
1. Create TransformHandles component
2. Implement 4 corner resize handles
3. Implement rotation handle
4. Add collision detection for handle dragging
5. Test with different shape types
6. Ensure handles don't appear for multi-selection

**Phase 6: Text Boxes (Medium Risk)**
1. Add Text button to toolbar
2. Implement text creation mode with ghost preview
3. Create text box shape type
4. Integrate rich text editor component
5. Test text rendering and editing

**Phase 7: Shape Text Labels (Medium Risk)**
1. Add text properties to shapes
2. Update Shape.tsx to render text
3. Implement "Add text" placeholder
4. Add click-to-edit behavior for selected shapes
5. Test text wrapping and truncation

**Phase 8: Polish & Testing (Low Risk)**
1. Add keyboard shortcuts (ESC, Delete)
2. Test all features with real-time collaboration
3. Verify no performance regressions
4. Edge case testing

### Konva Integration Notes

**Konva Transformer vs Custom Handles:**
- Konva provides `Konva.Transformer` with built-in handles
- However, we need custom behavior (no aspect ratio lock, specific styling)
- Recommendation: Use custom handles with Konva shapes for more control

**Text Rendering Options:**
1. **Konva.Text** - Native Konva text rendering (simple, no rich text)
2. **HTML Overlay** - Position HTML contentEditable over shape (complex but flexible)
3. **Hybrid** - Konva.Text for display, HTML for editing

Recommend: Hybrid approach for best performance and flexibility

**Rotation Implementation:**
- Konva shapes support `rotation` property natively
- Apply rotation at shape level (not transform layer)
- Rotation is in degrees (0-360)

### Performance Considerations

1. **Transform Handle Rendering** - Only render when single shape selected
2. **Selection Rectangle** - Use single Konva Rect, update properties on drag
3. **Multi-Selection Drag** - Batch Firebase updates (write all shapes in one transaction)
4. **Text Rendering** - Use Konva.Text for static display (fast), HTML editor only when editing
5. **Event Handlers** - Debounce text input changes (300ms) before syncing to Firebase

### Real-Time Collaboration Implications

1. **Transform Conflicts:**
   - If two users resize same shape simultaneously, last write wins
   - Future: Add edit indicators for shapes being transformed (like current edit indicators)

2. **Multi-Selection Sync:**
   - Selection state is local (not synced across users)
   - Each user has independent selection
   - Group drag updates all shapes, syncs individually

3. **Text Editing Conflicts:**
   - Use existing conflict resolution (version-based)
   - Only one user can edit text at a time (edit indicator)

4. **Handle Visibility:**
   - Transform handles are local UI (not synced)
   - Each user sees handles only for their own selection

### State Management Complexity

**Current:**
```typescript
const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);
const [creatingShapeType, setCreatingShapeType] = useState<string | null>(null);
```

**After:**
```typescript
// Selection
const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);

// Creation
const [creatingShapeType, setCreatingShapeType] = useState<ShapeType | 'text' | null>(null);

// Interaction
const [interactionMode, setInteractionMode] = useState<'select' | 'pan'>('select');

// Selection Rectangle
const [selectionRect, setSelectionRect] = useState<SelectionRect | null>(null);

// Transform
const [transformingShapeId, setTransformingShapeId] = useState<string | null>(null);

// Text Editing
const [editingTextShapeId, setEditingTextShapeId] = useState<string | null>(null);
```

---

## Success Metrics

### Functional Success Criteria

- ✅ Text boxes can be created with T button
- ✅ Text boxes support bold, italic, underline, and font size
- ✅ All new shapes have white fill + gray-800 border
- ✅ Shapes can have one text label added via click
- ✅ Text labels wrap and truncate correctly
- ✅ Multiple shapes can be selected via Shift+Click
- ✅ Multiple shapes can be selected via drag rectangle
- ✅ Selected shapes show blue borders
- ✅ Single selected shape shows 4 resize handles
- ✅ Single selected shape shows rotation handle
- ✅ Shapes can be resized without aspect ratio lock
- ✅ Shapes can be rotated smoothly
- ✅ Multi-selection shows NO transform handles
- ✅ Multi-selection can be moved together
- ✅ Select mode is default, pan mode via spacebar/middle-mouse
- ✅ Mouse wheel zoom is disabled
- ✅ All features work in real-time collaboration

### User Experience Success

- Users can create professional-looking designs with labeled shapes
- Transform controls feel intuitive and responsive
- Multi-selection workflow is efficient for batch operations
- Text editing is seamless (inline, rich formatting)
- Interaction modes are clear (no accidental panning)
- No performance degradation with 100+ shapes + transform handles

### Code Quality Success

- All new components follow TypeScript best practices
- State management is clean and maintainable
- Transform math is accurate (no drift or jitter)
- Real-time sync remains <100ms for all operations
- No breaking changes to existing tests
- New features have comprehensive test coverage

---

## Open Questions

1. **Text Box Minimum Size**: Should text boxes have a minimum width/height? Recommend 50x30px minimum.

2. **Transform Precision**: Should there be keyboard shortcuts for precise transforms (arrow keys = 1px nudge, Shift+arrow = 10px)? Out of scope for MVP?

3. **Selection Rectangle Visibility**: Should drag rectangle show real-time which shapes are being selected (highlight as rectangle passes over)? Or only highlight at the end?

4. **Rotation Snap**: Should holding Shift snap rotation to 15° increments? Explicitly out of scope for MVP.

5. **Text Editor Library**: Should we use a library (e.g., TipTap, Quill, Draft.js) or build custom? Recommend lightweight library for MVP.

6. **Pan Mode Indicator**: Should there be a visual indicator (toolbar button) for current interaction mode? Or just cursor change?

7. **Transform During Collaboration**: Should we show edit indicators for shapes being transformed by other users? Yes for consistency, but deferred to Phase 2?

8. **Delete Confirmation**: Should deleting multiple shapes show confirmation dialog? Recommend no for MVP (trust user), add undo/redo later.

---

## Dependencies

### External Libraries (Potential)

**Rich Text Editor:**
- **TipTap** (Recommended) - Modern, lightweight, framework-agnostic
- **Quill** - Popular but heavier
- **Draft.js** - React-specific but complex
- **Custom** - Use contentEditable with execCommand (deprecated but works)

**Math/Geometry:**
- **Lodash** (already in project?) - For utility functions
- **Native Math** - Rotation angle calculations, bounding box intersections

### Internal Dependencies

- `Shape.tsx` - Major updates for text labels, rotation, stroke
- `Canvas.tsx` - Core state management changes
- `CanvasToolbar.tsx` - Add Text button
- `types/index.ts` - Update CanvasObject interface
- `canvasObjects.service.ts` - Support new properties in Firebase writes
- Test files - Update for new selection behavior

---

## Risks & Mitigations

### Risk 1: Complex State Management
**Risk**: Managing selection, transform, and editing states together is complex
**Mitigation**: Use TypeScript strictly, write unit tests for state transitions, document state machine

### Risk 2: Transform Math Errors
**Risk**: Resize/rotation calculations may have edge cases (negative dimensions, rotation drift)
**Mitigation**: Test extensively with all shape types, add bounds checking, use Konva's built-in transform utilities where possible

### Risk 3: Collaboration Conflicts
**Risk**: Simultaneous transforms by multiple users may cause conflicts
**Mitigation**: Use existing version-based conflict resolution, document known limitations

### Risk 4: Performance with Transform Handles
**Risk**: Rendering handles for many shapes may slow down canvas
**Mitigation**: Only render handles for single selection, use Konva performance best practices (fastDrawEnabled)

### Risk 5: Text Editor Integration
**Risk**: Integrating rich text editor with Konva canvas may be complex
**Mitigation**: Use HTML overlay approach, keep editor simple for MVP, consider Konva.Text for display only

### Risk 6: Mouse Event Conflicts
**Risk**: Click events for selection, drag for move, drag for resize may conflict
**Mitigation**: Clear event priority order, use event.stopPropagation() strategically, test all interaction combos

---

## Appendix: File Changes Summary

### New Files

- `src/components/canvas/TransformHandles.tsx` - Resize and rotation handles
- `src/components/canvas/RichTextEditor.tsx` - Floating text formatting toolbar
- `src/components/canvas/SelectionRectangle.tsx` - Drag-to-select rectangle (optional, can be inline)

### Modified Files

**Major Changes:**
- `src/components/canvas/Canvas.tsx` - Core state management, selection logic, transform handling, interaction modes
- `src/components/canvas/Shape.tsx` - Add text label rendering, rotation support, stroke properties
- `src/types/index.ts` - Update CanvasObject interface with new properties

**Minor Changes:**
- `src/components/canvas/CanvasToolbar.tsx` - Add Text button
- `src/services/canvasObjects.service.ts` - Support new shape properties
- `src/utils/constants.ts` - Add default styling constants

### Test Files (New/Updated)

- `tests/unit/transform.test.ts` - Test resize and rotation math
- `tests/unit/selection.test.ts` - Test multi-selection logic
- `tests/integration/text-editing.test.tsx` - Test text creation and editing
- `tests/integration/shape-transforms.test.tsx` - Test resize and rotation
- Update existing Canvas.tsx tests for new selection behavior

---

## Estimated Complexity

**Overall Effort**: High (2-3 weeks for experienced developer)

**Breakdown by Phase:**
1. Interaction Modes & Toolbar: 12 hours
2. Foundation & Default Styling: 4 hours
3. Selection System Refactor: 8 hours
4. Multi-Selection: 16 hours (includes drag rectangle, group operations)
5. Transform Handles: 24 hours (resize + rotation, most complex)
6. Text Boxes: 16 hours (includes rich text editor integration)
7. Shape Text Labels: 12 hours
8. Polish & Testing: 16 hours

**Total**: ~108 hours (~2.5-3 weeks)

**High-Risk Areas:**
- Transform handle drag logic (resize from different corners, rotation angle calculation)
- Drag rectangle selection collision detection
- Rich text editor integration with Konva
- Group drag with real-time sync (batch updates)
- Interaction mode switching (avoiding conflicts)
- Text wrapping and truncation in shapes

**Testing Requirements:**
- Unit tests for all transform math functions
- Integration tests for multi-selection workflows
- E2E tests for text editing
- Collaboration tests (2+ users transforming shapes)
- Performance tests (100+ shapes with selection)

---

## Acceptance Checklist

Before marking this feature complete, verify:

- [ ] Text button appears in toolbar and creates text boxes
- [ ] Text boxes support bold, italic, underline, font size
- [ ] All new shapes have white fill + 2px gray-800 border
- [ ] Shapes display "Add text" placeholder when selected
- [ ] Clicking selected shape opens text editor
- [ ] Text labels wrap and truncate correctly
- [ ] Shift+Click adds/removes shapes from selection
- [ ] Drag rectangle selects multiple shapes
- [ ] Selected shapes show blue borders (not green)
- [ ] Single selection shows 4 resize handles + rotation handle
- [ ] Multi-selection shows NO handles
- [ ] Resize handles work correctly from all 4 corners
- [ ] Rotation handle rotates smoothly
- [ ] Group drag moves all selected shapes together
- [ ] Pan mode button works and is default
- [ ] Select mode button works
- [ ] Mouse wheel zoom works in both modes
- [ ] Zoom +/- buttons work
- [ ] ESC clears selection and cancels creation modes
- [ ] Delete key removes all selected shapes
- [ ] All features sync in real-time across users
- [ ] No performance regression (60 FPS maintained)
- [ ] All existing tests still pass
- [ ] New tests written and passing

---

**End of PRD**

