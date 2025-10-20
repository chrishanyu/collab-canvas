# Product Requirements Document: Text Boxes

## Introduction/Overview

Add fully-functional text boxes to the CollabCanvas application, enabling users to create, edit, and manipulate text content on the canvas. Text boxes will behave similarly to existing shapes (rectangles, circles) with selection, movement, and resizing capabilities, but with an additional "edit mode" for inline text editing. This feature is essential for creating labels, annotations, notes, and textual content in collaborative design work.

**Problem Solved:** Currently, users can only create visual shapes but cannot add textual content to annotate, label, or describe their designs. Text boxes enable communication and documentation within the canvas itself.

**Goal:** Implement a simple, intuitive text box feature that integrates seamlessly with existing canvas behaviors (selection, real-time sync, AI agent, conflict resolution) while maintaining the foundation for future text formatting enhancements.

---

## Goals

1. Enable users to create text boxes with a click-to-place interaction (consistent with existing shape creation)
2. Support inline text editing with multi-line content and automatic text wrapping
3. Allow text boxes to be moved and resized like other shapes
4. Integrate text boxes with real-time collaboration (sync across users)
5. Ensure text boxes work with the AI Canvas Agent (AI can create and manipulate text)
6. Maintain consistency with existing conflict resolution system (two-tiered defense)
7. Design with future extensibility in mind (text alignment, formatting, styling to be added later)

---

## User Stories

### Story 1: Create Text Box
**As a** canvas user  
**I want to** click a "Text" button and place a text box on the canvas  
**So that** I can add labels and annotations to my design

**Acceptance Criteria:**
- Clicking "Add Text" button activates text creation mode
- Cursor shows a ghost/preview text box that follows the mouse
- Clicking on the canvas places the text box at the click position
- Text box immediately enters edit mode after placement
- User can start typing without additional clicks

### Story 2: Edit Text Inline
**As a** canvas user  
**I want to** double-click a text box to edit its content inline  
**So that** I can modify text directly on the canvas without a separate input field

**Acceptance Criteria:**
- Single click on a text box selects it (shows selection handles)
- Double-click on a selected text box enters edit mode
- In edit mode, text cursor appears and user can type/edit
- Clicking outside the text box or pressing Escape exits edit mode
- Text changes are saved automatically

### Story 3: Multi-Line Text with Wrapping
**As a** canvas user  
**I want to** write multiple lines of text that wrap within the text box boundaries  
**So that** I can create paragraphs and longer annotations

**Acceptance Criteria:**
- Pressing Enter creates a new line
- Text automatically wraps at the right edge of the text box
- Text box height increases automatically to fit all content
- Vertical scrolling is not needed (box grows to fit)
- Wrapped text remains readable at different zoom levels

### Story 4: Move and Resize Text Boxes
**As a** canvas user  
**I want to** drag text boxes to reposition them and resize them with handles  
**So that** I can organize text in my layout

**Acceptance Criteria:**
- When selected (not in edit mode), text box can be dragged to move
- Text box shows resize handles (corners and edges) when selected
- Dragging resize handles changes text box width and height
- Text re-wraps when width changes
- Box maintains minimum size to show at least one character

### Story 5: Real-Time Text Collaboration
**As a** collaborator on a shared canvas  
**I want to** see text boxes created by others appear in real-time  
**So that** we can work together on annotated designs

**Acceptance Criteria:**
- Text boxes created by one user appear on all users' canvases within 100ms
- Text edits sync when edit mode is exited (not character-by-character)
- Edit indicators show when another user is editing a text box
- Conflict resolution prevents data loss when two users edit the same text box

### Story 6: AI Agent Text Creation
**As a** canvas user using the AI agent  
**I want to** ask the AI to create text boxes with specific content  
**So that** I can quickly generate annotated layouts

**Acceptance Criteria:**
- AI agent supports creating text boxes via natural language commands
- AI can specify text content, position, and size
- AI-generated text boxes sync to all users like manually created ones
- Example command: "Create a text box that says 'User Dashboard' at the top"

---

## Functional Requirements

### FR-1: Text Box Creation
1.1. User clicks "Add Text" button in the canvas toolbar (button already exists)  
1.2. System enters text creation mode  
1.3. System displays ghost/preview text box at cursor position  
1.4. User clicks on canvas to place text box  
1.5. System creates text box at click position with default properties  
1.6. System immediately enters edit mode with text cursor visible  
1.7. User can type text content immediately  

**Default Properties:**
- Width: 200px
- Height: Auto (fits content)
- Font: "Arial" (or system default)
- Font Size: 16px
- Color: Black (#000000)
- Text: Empty string (placeholder cursor)
- Position: Click location on canvas

### FR-2: Text Editing (Inline)
2.1. User single-clicks text box → Enters **select mode**  
2.2. User double-clicks selected text box → Enters **edit mode**  
2.3. In edit mode:
  - Text cursor appears in the text box
  - User can type to add text
  - User can use arrow keys to navigate
  - User can use Backspace/Delete to remove characters
  - User can press Enter to create new lines
  - User can click and drag to select text
  - User can use Cmd/Ctrl+A to select all text  
2.4. Exit edit mode via:
  - Clicking outside the text box
  - Pressing Escape key
  - Clicking another shape  
2.5. On exit, text changes are saved and synced to Firebase

### FR-3: Multi-Line Text and Wrapping
3.1. Text box must support multiple lines (no line limit)  
3.2. Text must automatically wrap at the right edge of the text box  
3.3. Text box height must automatically increase to fit all content  
3.4. Text box height must decrease if content is removed  
3.5. Minimum height: One line of text (based on font size)  
3.6. Text box must maintain readability at all zoom levels (0.1x to 3x)

### FR-4: Text Box Selection
4.1. Single click on text box (not in edit mode) selects it  
4.2. Selected text box shows:
  - Green border (consistent with other shapes)
  - Resize handles at corners and edges
  - Transform handles layer (like rectangles/circles)  
4.3. Selected text box can be deselected by:
  - Clicking on canvas background
  - Clicking another shape
  - Pressing Escape key

### FR-5: Text Box Movement
5.1. User can drag selected text box (not in edit mode) to move it  
5.2. Drag behavior matches existing shape drag behavior  
5.3. During drag:
  - Text box position updates in real-time (optimistic update)
  - Other users see position update within 100ms  
5.4. On drag end:
  - Position saved to Firebase
  - Edit indicator cleared (if active)

### FR-6: Text Box Resizing
6.1. User can drag resize handles to change text box dimensions  
6.2. Resizing width causes text to re-wrap  
6.3. Resizing height is constrained by content (cannot be smaller than wrapped text height)  
6.4. Minimum width: 50px  
6.5. Minimum height: 1 line of text (~20px depending on font size)  
6.6. Resize behavior uses existing TransformHandles component

### FR-7: Real-Time Sync
7.1. Text box creation syncs to all users on same canvas  
7.2. Text content updates sync when edit mode is exited (not character-by-character)  
7.3. Position updates sync during drag (throttled at 60fps)  
7.4. Resize updates sync during resize (throttled at 60fps)  
7.5. Deletion syncs immediately to all users

### FR-8: Conflict Resolution Integration
8.1. **Tier 1 (Edit Indicators):**
  - When user enters edit mode, write to `/active-edits/{canvasId}/shapes/{textBoxId}`
  - Other users see dashed border with editor's color
  - Hover tooltip shows "{User Name} is editing"
  - Indicator cleared when edit mode exits
  - 30-second TTL for automatic cleanup  
8.2. **Tier 2 (Version Checking):**
  - Text box has `version` field (incremented on each update)
  - Updates check `expectedVersion` against server version
  - On conflict, show toast: "Text was modified by {User Name}. Reloading..."
  - Automatically reload latest version from Firebase

### FR-9: AI Agent Integration
9.1. AI agent can create text boxes via `createShape` function with `type: 'text'`  
9.2. AI can specify:
  - `text`: The text content
  - `x`, `y`: Position on canvas
  - `width`: Text box width (optional, defaults to 200px)
  - `fontSize`: Font size (optional, defaults to 16px)
  - `color`: Text color (optional, defaults to black)  
9.3. AI can update text boxes via `updateShape` function to change:
  - Text content
  - Position
  - Size
  - Color  
9.4. AI-generated text boxes sync via existing Firebase real-time listeners

### FR-10: Data Model
10.1. Text box stored in Firestore: `/canvas-objects/{canvasId}/objects/{textBoxId}`  
10.2. Text box document structure:
```typescript
{
  id: string;                  // Unique identifier
  type: 'text';                // Shape type
  x: number;                   // X position
  y: number;                   // Y position
  width: number;               // Box width (user-controlled)
  height: number;              // Box height (auto-calculated from content)
  text: string;                // Text content (supports \n for newlines)
  fontSize: number;            // Font size in pixels (default: 16)
  fontFamily: string;          // Font family (default: 'Arial')
  color: string;               // Text color (default: '#000000')
  version: number;             // For conflict detection
  createdAt: Timestamp;        // Creation timestamp
  lastEditedBy: string;        // User ID of last editor
  lastEditedByName: string;    // Display name of last editor
}
```

### FR-11: Keyboard Shortcuts
11.1. **T key** - Activates text creation mode (when not in edit mode)  
11.2. **Escape** - Exits edit mode or deselects text box  
11.3. **Enter** - Creates new line (when in edit mode)  
11.4. **Delete/Backspace** - Removes selected text box (when selected, not in edit mode)  
11.5. **Cmd/Ctrl+A** - Selects all text (when in edit mode)

---

## Non-Goals (Out of Scope for V1)

1. **Text Alignment** - Left/center/right/justify alignment (future enhancement)
2. **Text Formatting** - Bold, italic, underline (future enhancement)
3. **Font Selection** - Multiple font families (future enhancement)
4. **Text Color Picker** - Custom color selection UI (uses default black; future enhancement)
5. **Rich Text** - Markdown, HTML, or formatted text (plain text only)
6. **Text Effects** - Shadows, outlines, gradients (future enhancement)
7. **Rotation** - Text box rotation not supported (consistent with current project scope)
8. **Background Fill** - Text boxes have no fill color (transparent background)
9. **Borders** - Text boxes have no stroke/border (except selection indicator)
10. **Spell Check** - No built-in spell checking
11. **Text Search** - No find/replace functionality
12. **Hyperlinks** - No clickable links in text
13. **Character-by-Character Sync** - Text syncs on edit complete, not per keystroke
14. **Vertical Text** - Horizontal text only

---

## Design Considerations

### UI/UX Consistency
- Text box creation flow matches existing shape creation (click button → ghost preview → click to place)
- Selection and movement behavior identical to rectangles and circles
- Resize handles use existing `TransformHandles` component
- Edit indicators use existing `useActiveEdits` system

### Component Architecture
- `TextBox.tsx` - New component rendering Konva Text with editing capabilities
- Extends existing shape patterns (`Shape.tsx` as reference)
- Integrates with `Canvas.tsx` for mode management (select vs edit)
- Reuses `TransformHandles.tsx` for resize functionality

### State Management
- Text edit mode managed in `CanvasContext` (new state: `editingTextId: string | null`)
- Text content stored in canvas objects state (existing pattern)
- Edit mode triggered by double-click event handler

### Konva Integration
- Use Konva `Text` component for rendering
- Use Konva `Transformer` for resize handles (existing pattern)
- Text wrapping: Konva `Text` has built-in `wrap` property
- Edit mode: Overlay HTML `<textarea>` on top of Konva Text for editing (Konva's recommended approach)

### Future-Proofing for Formatting
- Store `fontSize`, `fontFamily`, `color` even if not user-editable yet
- Text box data model includes optional fields for future properties:
  - `textAlign?: 'left' | 'center' | 'right' | 'justify'`
  - `fontWeight?: number | 'normal' | 'bold'`
  - `fontStyle?: 'normal' | 'italic'`
  - `textDecoration?: 'none' | 'underline' | 'line-through'`
- Component design allows adding text formatting toolbar in future

### Accessibility
- Text boxes should be keyboard navigable
- Selected text box can be deleted with Delete key
- Text content can be selected and copied with standard keyboard shortcuts

---

## Technical Considerations

### Konva Text Editing Pattern
**Recommended Approach:**
1. Render text using Konva `Text` component (read-only display)
2. On double-click, overlay an HTML `<textarea>` at the same position
3. Style textarea to match Konva Text appearance
4. On blur/escape, hide textarea and update Konva Text with new content
5. This is the [official Konva recommendation](https://konvajs.org/docs/sandbox/Editable_Text.html)

**Why:** Konva doesn't support native text editing. HTML overlay provides full browser text editing capabilities (cursor, selection, copy/paste, IME support).

### Auto-Resizing Logic
- Calculate text height based on content, width, and font size
- Use Konva `Text.getHeight()` to measure wrapped text height
- Update text box height when:
  - Text content changes
  - Width changes (causing re-wrap)
- Minimum height: 1 line of text

### Real-Time Sync Strategy
- **Easy approach (recommended for V1):** Sync text content on edit complete
  - User enters edit mode → Write to active-edits
  - User types (local only, no sync)
  - User exits edit mode → Update Firestore with final text
  - Other users receive update via real-time listener
  - **Benefit:** Simple implementation, reduces Firebase write costs
  - **Tradeoff:** Other users don't see typing in real-time (acceptable for V1)

### Integration Points
1. **Canvas.tsx** - Add text creation mode, handle edit mode transitions
2. **canvasObjects.service.ts** - Add text-specific CRUD operations
3. **aiCommands.ts** - Ensure `createShape` supports `type: 'text'`
4. **useKeyboardShortcuts.ts** - Add "T" key for text creation
5. **CanvasToolbar.tsx** - Wire up existing "Add Text" button

### Performance Considerations
- Text rendering is lightweight (simpler than complex shapes)
- Limit maximum text length to prevent performance issues (e.g., 5000 characters)
- Use memoization for text box components (like existing shapes)

### Dependencies
- No new dependencies required
- Uses existing Konva library (already installed)
- HTML textarea for editing (native browser feature)

---

## Success Metrics

### Functional Success
- Users can create text boxes within 2 clicks (button + placement)
- Users can edit text inline without confusion
- Text boxes sync across users within 100ms of edit complete
- AI agent can create text boxes via natural language commands
- Conflict resolution prevents data loss (100% detection rate maintained)

### Performance Success
- Text box creation adds <5ms to canvas render time
- 60 FPS maintained with 100+ text boxes on canvas
- Text editing feels responsive (no input lag)

### User Experience Success
- Text box behavior feels consistent with existing shapes
- Double-click to edit is discoverable and intuitive
- Text wrapping and auto-resizing work seamlessly
- No crashes or errors during text operations

---

## Open Questions

1. **Maximum text length:** Should we enforce a character limit? Suggestion: 5000 characters (prevents abuse)
2. **Default text box position:** If AI creates text without position, where should it appear? Suggestion: Center of current viewport
3. **Empty text boxes:** Should empty text boxes be allowed to persist, or auto-delete? Suggestion: Allow empty (users may want placeholder boxes)
4. **Copy/paste behavior:** Should Cmd/Ctrl+C/V copy text content or duplicate the text box? Suggestion: When in edit mode = copy text, when selected = duplicate box (future feature)
5. **Tab key behavior:** Should Tab indent text or navigate to next shape? Suggestion: Tab exits edit mode (standard behavior), indent not supported in V1

---

## Implementation Notes for Developers

### Recommended Implementation Order
1. **Data Model** - Add text type to shape types, update TypeScript interfaces
2. **Basic Rendering** - Create TextBox component with Konva Text
3. **Selection** - Integrate with existing selection system
4. **Edit Mode** - Implement double-click → HTML textarea overlay
5. **Text Wrapping** - Configure Konva Text wrap property
6. **Auto-Resize** - Calculate and update height based on content
7. **Movement** - Reuse existing drag handlers
8. **Resize** - Integrate with TransformHandles component
9. **Real-Time Sync** - Connect to Firebase via canvasObjects service
10. **Conflict Resolution** - Integrate with active-edits and version checking
11. **AI Integration** - Update aiCommands to handle text type
12. **Keyboard Shortcuts** - Add "T" key handler
13. **Testing** - Unit tests for text operations, integration tests for collaboration

### Key Files to Modify
- `src/components/canvas/TextBox.tsx` - **NEW** component
- `src/components/canvas/Canvas.tsx` - Add text creation mode, edit mode handling
- `src/services/canvasObjects.service.ts` - Ensure text CRUD works (should work with existing code)
- `src/services/aiCommands.ts` - Add text support to `createShape` if needed
- `src/hooks/useKeyboardShortcuts.ts` - Add "T" key shortcut
- `src/types/index.ts` - Update shape types to include 'text'
- `src/context/CanvasContext.tsx` - Add `editingTextId` state

### Testing Strategy
- **Unit Tests:**
  - Text box creation with default properties
  - Text content update and wrapping logic
  - Auto-resize calculations
  - Selection and edit mode transitions
- **Integration Tests:**
  - Complete text creation flow (button → place → edit → save)
  - Real-time sync across multiple users
  - Conflict detection when two users edit same text box
  - AI agent text creation command
  - Keyboard shortcuts for text operations
- **Manual Testing:**
  - Multi-line text with wrapping
  - Resize behavior at different zoom levels
  - Edit mode with long text content
  - Performance with 50+ text boxes

---

## Appendix: Example User Flows

### Flow 1: Create and Edit Text Box
1. User clicks "Add Text" button (or presses "T" key)
2. Cursor changes to crosshair with ghost text box
3. User clicks at position (100, 200)
4. Text box created at (100, 200) with default 200px width
5. Text box immediately enters edit mode (textarea appears)
6. User types "User Login Form"
7. User presses Escape (or clicks outside)
8. Text box exits edit mode, text syncs to Firebase
9. Other users see text box appear with content "User Login Form"

### Flow 2: Move and Resize Text Box
1. User single-clicks existing text box
2. Text box enters select mode (green border, resize handles visible)
3. User drags text box from (100, 200) to (300, 150)
4. Position updates optimistically and syncs to Firebase
5. User drags right-middle resize handle to increase width from 200px to 300px
6. Text re-wraps to fit new width
7. Text box height auto-adjusts to fit wrapped content
8. Size updates sync to Firebase

### Flow 3: AI Creates Text Boxes
1. User opens AI command panel (Cmd+K)
2. User types: "Create a login form with username and password fields"
3. AI agent returns function calls:
   - `createShape({type: 'text', text: 'Username:', x: 100, y: 100, fontSize: 16})`
   - `createShape({type: 'rectangle', x: 200, y: 95, width: 200, height: 30})`
   - `createShape({type: 'text', text: 'Password:', x: 100, y: 150, fontSize: 16})`
   - `createShape({type: 'rectangle', x: 200, y: 145, width: 200, height: 30})`
   - `createShape({type: 'rectangle', text: 'Login', x: 250, y: 200, width: 100, height: 40})`
4. Frontend executes function calls via canvasObjects.service
5. All shapes (including text boxes) written to Firebase
6. Real-time listeners broadcast to all users
7. All users see complete login form with labels

### Flow 4: Conflict Resolution
1. User A selects text box with content "Title"
2. User A double-clicks to enter edit mode
3. Active-edit indicator broadcasts to User B
4. User B sees dashed border on text box with tooltip "Alice Smith is editing"
5. User A changes text to "Main Title" and presses Escape
6. Edit indicator cleared, text syncs to Firebase (version 5 → 6)
7. User B sees updated text "Main Title"
8. (Edge case): If User B also edited simultaneously:
   - User B's update checks version (expects 5, sees 6)
   - Conflict detected, toast shown: "Text was modified by Alice Smith. Reloading..."
   - User B's optimistic update reverted
   - Latest version (6) loaded from Firebase
   - User B can retry edit

---

## Summary

This PRD defines a text box feature that integrates seamlessly with CollabCanvas's existing architecture. The implementation maintains consistency with current shape behaviors while adding inline editing capabilities. The design prioritizes simplicity for V1 while establishing a foundation for future text formatting enhancements.

**Key Principles:**
- Consistency with existing shape patterns
- Simple, intuitive user interactions
- Robust real-time collaboration
- AI agent integration
- Future-proof data model

**Next Steps:**
1. Review and approve this PRD
2. Generate detailed task list using `generate-tasks` rule
3. Implement features in recommended order
4. Test thoroughly with unit, integration, and manual tests
5. Update documentation and memory bank

