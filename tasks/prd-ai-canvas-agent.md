# Product Requirements Document: AI Canvas Agent

**Feature:** Natural Language Canvas Manipulation via AI Agent  
**Implementation Strategy:** Function Calling with Real-time Collaboration  
**Phase:** Phase 5 - AI Integration  
**Status:** Planning  
**Date:** October 19, 2025

---

## Executive Summary

CollabCanvas is introducing an **AI Canvas Agent** that enables users to manipulate the canvas through natural language commands using function calling. This feature transforms canvas creation from manual tool-based interaction to conversational design, dramatically accelerating workflows for both novice and power users.

When a user types "Create a blue rectangle in the center," the AI agent interprets the intent, calls the appropriate canvas API functions, and the rectangle appears on everyone's canvas via real-time sync. This AI-powered interaction works seamlessly with the existing collaborative infrastructure, ensuring all users see the same AI-generated results instantly.

**Core Value Proposition:**
- **Speed:** Create complex layouts in seconds instead of minutes
- **Accessibility:** No learning curve for new users—just describe what you want
- **Collaboration:** AI commands executed by one user appear for all collaborators in real-time
- **Flexibility:** Handles simple commands ("add a circle") to complex multi-step operations ("create a login form")

**Evaluation Criteria:**
- **Command Breadth:** Support 8+ distinct command types across 4 categories
- **Complex Execution:** Multi-step commands like "create a login form" produce properly arranged, styled elements
- **Performance:** Sub-2 second responses for single-step commands
- **Reliability:** 90%+ accuracy in command interpretation and execution
- **Multi-user Support:** Multiple users can use AI simultaneously without conflicts

---

## Problem Statement

### Current Issues

1. **Time-Consuming Manual Creation:** Creating complex layouts requires dozens of individual actions (select tool → click → drag → style → position → repeat)
2. **Learning Curve:** New users must learn toolbar controls, shortcuts, and design patterns
3. **Tedious Repetition:** Creating similar elements (e.g., 3x3 grid of squares) requires repetitive manual work
4. **Layout Complexity:** Arranging multiple elements with proper spacing and alignment is time-intensive
5. **Natural Language Gap:** Users think in descriptions ("I need a login form") but must translate to tool actions

### User Impact

**Scenario 1: New User Creating Dashboard**
- **Current:** User must learn rectangle tool, text tool, color picker, alignment, etc.
- **Result:** 20+ minutes for basic 3-card layout, frequent mistakes, frustration

**With AI Agent:**
- User types: "Create a dashboard with 3 cards showing title and description"
- **Result:** Complete layout in 5 seconds, properly arranged and styled

**Scenario 2: Power User Creating Wireframe**
- **Current:** Create 50+ shapes manually for complex UI mockup, tedious positioning
- **Result:** 30-60 minutes of repetitive work

**With AI Agent:**
- User types: "Create a navigation bar with logo, 4 menu items, and search bar"
- **Result:** Complete navigation in 3 seconds, all elements properly spaced

---

## Goals

### Primary Goals

1. **Command Breadth:** Support 8+ distinct command types covering Creation, Manipulation, Layout, and Complex categories
2. **Performance:** Sub-2 second responses for single-step commands
3. **Accuracy:** 90%+ success rate in interpreting and executing user intent
4. **Multi-user Support:** Handle simultaneous AI usage by multiple users without conflicts
5. **Shared State:** Ensure all users see identical AI-generated results in real-time

### Secondary Goals

1. **Natural UX:** Provide visible feedback during AI processing and execution
2. **Error Handling:** Clear, actionable error messages when commands fail or are ambiguous
3. **Extensibility:** Architected for easy addition of new command types
4. **Integration:** Seamless integration with existing canvas infrastructure (real-time sync, conflict resolution, presence)

### Success Metrics

**Scoring Criteria (25 points total):**
- **Command Breadth (10 points):** 8+ distinct, meaningful commands across all categories
- **Complex Execution (8 points):** Multi-step commands produce properly arranged, styled elements
- **Performance & Reliability (7 points):** Sub-2s responses, 90%+ accuracy, flawless shared state

### Non-Goals (Out of Scope)

- ❌ AI-powered design suggestions or auto-layout optimization
- ❌ Natural language querying of canvas state ("how many rectangles are there?")
- ❌ AI-assisted text generation for text shapes
- ❌ Voice input for commands (text-only for MVP)
- ❌ Undo/redo for AI-generated content (uses existing canvas undo when available)
- ❌ AI learning from user preferences or history
- ❌ Advanced image generation or asset creation

---

## User Stories

### Creation Commands (Category 1)

**Story 1: Create Shape by Type and Color**
```
As a canvas user,
When I type "Create a red circle at position 100, 200",
I want the AI to generate a red circle at those coordinates,
So that I can quickly add specific shapes without using tools.
```

**Acceptance Criteria:**
- AI creates circle with correct color (red)
- Circle positioned at x:100, y:200
- Default size applied (e.g., 100x100)
- Shape appears within 2 seconds
- All collaborators see the shape in real-time

---

**Story 2: Create Text Element**
```
As a canvas user,
When I type "Add a text layer that says 'Hello World'",
I want the AI to create a text shape with that content,
So that I can add labels and descriptions quickly.
```

**Acceptance Criteria:**
- Text shape created with content "Hello World"
- Default font size and color applied
- Positioned at canvas center or last AI action location
- Text is editable after creation
- Response time < 2 seconds

---

**Story 3: Create Shape with Dimensions**
```
As a canvas user,
When I type "Make a 200x300 rectangle",
I want the AI to create a rectangle with those exact dimensions,
So that I can specify precise sizes for my design.
```

**Acceptance Criteria:**
- Rectangle created with width: 200, height: 300
- Default color and position applied
- Shape appears within 2 seconds
- Dimensions are exact as specified

---

### Manipulation Commands (Category 2)

**Story 4: Move Shape to Location**
```
As a canvas user,
When I type "Move the blue rectangle to the center",
I want the AI to identify the blue rectangle and center it on the canvas,
So that I can reposition elements without manual dragging.
```

**Acceptance Criteria:**
- AI identifies the correct shape (blue rectangle)
- Shape moved to canvas center (accounting for current viewport)
- If multiple blue rectangles, AI handles ambiguity (asks for clarification or picks most recently created)
- Movement syncs to all users in real-time
- Response time < 2 seconds

---

**Story 5: Resize Shape**
```
As a canvas user,
When I type "Resize the circle to be twice as big",
I want the AI to double the circle's dimensions,
So that I can scale elements proportionally without manual adjustment.
```

**Acceptance Criteria:**
- AI identifies the circle (handles ambiguity if multiple)
- Dimensions doubled (width and height)
- Shape remains centered at original position
- Change syncs to all users
- Response time < 2 seconds

---

**Story 6: Rotate Shape**
```
As a canvas user,
When I type "Rotate the text 45 degrees",
I want the AI to apply a 45-degree rotation to the text shape,
So that I can create angled layouts quickly.
```

**Acceptance Criteria:**
- AI identifies text shape
- Applies 45-degree rotation
- Rotation center is shape's center point
- Change syncs immediately
- Response time < 2 seconds

---

### Layout Commands (Category 3)

**Story 7: Arrange Shapes in Row**
```
As a canvas user,
When I type "Arrange these shapes in a horizontal row",
I want the AI to distribute selected or recent shapes horizontally with even spacing,
So that I can create organized layouts without manual positioning.
```

**Acceptance Criteria:**
- AI identifies "these shapes" (selected shapes, or last N created shapes)
- Shapes arranged horizontally with equal spacing (20-30px gaps)
- Vertical alignment (centered on Y-axis)
- Maintains original shape sizes
- Response time < 3 seconds (multi-step operation)

---

**Story 8: Create Grid Layout**
```
As a canvas user,
When I type "Create a grid of 3x3 squares",
I want the AI to generate 9 squares arranged in a 3x3 grid pattern,
So that I can quickly create structured layouts.
```

**Acceptance Criteria:**
- 9 squares created (50x50 default size)
- Arranged in 3 rows × 3 columns
- Even spacing between squares (20px gaps)
- Grid positioned at canvas center
- All squares same size and color (default)
- Response time < 3 seconds

---

**Story 9: Space Elements Evenly**
```
As a canvas user,
When I type "Space these elements evenly",
I want the AI to distribute selected shapes with equal gaps,
So that I can achieve professional spacing without manual measurement.
```

**Acceptance Criteria:**
- AI identifies shapes to space (selected or recent)
- Calculates total span and available space
- Redistributes shapes with equal gaps
- Maintains original shape order
- Response time < 2 seconds

---

### Complex Commands (Category 4)

**Story 10: Create Login Form**
```
As a canvas user,
When I type "Create a login form with username and password fields",
I want the AI to generate a complete form layout with labeled inputs and a submit button,
So that I can rapidly prototype UI components.
```

**Acceptance Criteria:**
- At least 3 elements created:
  1. Username label + input field (rectangle)
  2. Password label + input field (rectangle)
  3. Submit button (rectangle with text)
- Elements vertically stacked with consistent spacing
- Labels aligned left
- Input fields same width (200-250px)
- Professional layout (not just scattered shapes)
- Response time < 4 seconds

---

**Story 11: Build Navigation Bar**
```
As a canvas user,
When I type "Build a navigation bar with 4 menu items",
I want the AI to create a horizontal navigation with properly arranged menu items,
So that I can mockup website layouts quickly.
```

**Acceptance Criteria:**
- 5 elements created:
  1. Navigation container (rectangle, full width)
  2-5. Four menu items (text or rectangles with text)
- Menu items horizontally arranged
- Even spacing between items
- Contained within navigation bar
- Response time < 4 seconds

---

**Story 12: Create Card Layout**
```
As a canvas user,
When I type "Make a card layout with title, image, and description",
I want the AI to generate a structured card component,
So that I can create content layouts rapidly.
```

**Acceptance Criteria:**
- At least 3 elements created:
  1. Card container (rectangle with subtle border/fill)
  2. Title text at top
  3. Image placeholder (rectangle, different color)
  4. Description text below image
- Elements properly arranged inside card
- Consistent padding/margins
- Professional card appearance
- Response time < 4 seconds

---

### Multi-User AI Collaboration

**Story 13: Shared AI Results**
```
As a canvas collaborator,
When another user executes an AI command,
I want to see the generated shapes appear on my canvas in real-time,
So that all collaborators maintain the same canvas state.
```

**Acceptance Criteria:**
- AI-generated shapes sync to all users within 100ms
- No conflicts between AI-generated content and manual edits
- Presence indicators show who triggered the AI command
- Multiple users can use AI simultaneously without race conditions

---

**Story 14: AI Command Feedback**
```
As a canvas user,
When I submit an AI command,
I want to see visual feedback that the AI is processing,
So that I know my request is being handled.
```

**Acceptance Criteria:**
- Loading indicator appears immediately on command submission
- Progress indicator shows AI is working (spinner, status message)
- Success/error notification after completion
- Clear error messages if command fails or is ambiguous
- Timeout after 10 seconds with helpful error message

---

## Functional Requirements

### R1: Natural Language Command Input

**R1.1:** Provide a text input interface for AI commands
- Input positioned prominently (e.g., top-right corner, keyboard shortcut to focus)
- Placeholder text hints at capabilities ("Ask AI to create shapes, arrange layouts...")
- Submit on Enter key or button click
- Command history accessible (up/down arrow keys)

**R1.2:** Pre-process user input before sending to AI
- Trim whitespace
- Validate non-empty input
- Log commands for debugging/analytics
- Support multi-line commands (Shift+Enter)

---

### R2: AI Function Calling Integration

**R2.1:** Integrate OpenAI GPT-4 Turbo with function calling
- Use OpenAI SDK v4.x for TypeScript
- Configure model: `gpt-4-turbo-preview` (best accuracy/speed balance)
- Define function schemas for all canvas operations
- Handle function call responses and execute locally
- Manage API keys securely (Vercel environment variables: `OPENAI_API_KEY`)

**R2.2:** Define comprehensive function call schema
Minimum required functions:

```typescript
// Creation functions
createShape(type: 'rectangle' | 'circle' | 'text', x: number, y: number, width: number, height: number, color: string, text?: string): string

// Manipulation functions
moveShape(shapeId: string, x: number, y: number): void
resizeShape(shapeId: string, width: number, height: number): void
rotateShape(shapeId: string, degrees: number): void
updateShapeColor(shapeId: string, color: string): void

// Layout functions
arrangeHorizontally(shapeIds: string[], spacing: number): void
arrangeVertically(shapeIds: string[], spacing: number): void
createGrid(rows: number, cols: number, shapeType: string, size: number, spacing: number): string[]
distributeEvenly(shapeIds: string[], direction: 'horizontal' | 'vertical'): void

// Query functions (provide context to AI)
getCanvasState(): CanvasState
getShapesByColor(color: string): Shape[]
getShapesByType(type: string): Shape[]
getSelectedShapes(): Shape[]
getRecentShapes(count: number): Shape[]

// Complex/Composite functions
createLoginForm(x: number, y: number): string[]
createNavigationBar(x: number, y: number, itemCount: number): string[]
createCardLayout(x: number, y: number): string[]
```

**R2.3:** Function execution must integrate with existing canvas services
- Use `canvasObjects.service.ts` for all shape CRUD
- Respect existing conflict resolution system
- All AI-generated shapes sync via real-time listeners
- Generate proper shape IDs and metadata

---

### R3: Command Categories & Capabilities

**R3.1: Creation Commands (Minimum 3 distinct commands)**
1. Create shape by type, position, color
2. Create text layer with content
3. Create shape with specific dimensions
4. Create multiple shapes at once

**R3.2: Manipulation Commands (Minimum 3 distinct commands)**
1. Move shape to position or named location (center, top-left, etc.)
2. Resize shape (absolute or relative scaling)
3. Rotate shape by degrees
4. Change shape color
5. Update text content
6. Delete shape(s)

**R3.3: Layout Commands (Minimum 2 distinct commands)**
1. Arrange shapes in horizontal row
2. Arrange shapes in vertical column
3. Create grid layout (NxM)
4. Distribute shapes evenly with spacing
5. Align shapes (left, center, right, top, middle, bottom)
6. Stack shapes with consistent padding

**R3.4: Complex Commands (Minimum 2 distinct commands)**
1. Create login form (username, password, button)
2. Create navigation bar (logo + menu items)
3. Create card layout (title, image, description)
4. Create button group (multiple buttons horizontally arranged)
5. Create form with multiple fields (label + input pairs)
6. Create dashboard layout (header + grid of cards)

**Total Command Types:** 8+ categories → 16+ specific command variations

---

### R4: AI Command Processing & Execution

**R4.1:** Sequential execution for multi-step commands
- Complex commands (e.g., "create login form") broken into atomic operations
- Execute operations in logical order (container first, then contents)
- Wait for each operation to complete before starting next
- Rollback all changes if any step fails

**R4.2:** Smart context resolution
- AI must infer missing parameters intelligently:
  - "Create a circle" → default size, color, center position
  - "Move the rectangle" → identify which rectangle (last created, selected, only one, etc.)
  - "These shapes" → reference selected shapes or last N created shapes
- Request clarification when truly ambiguous
- Use viewport center as default position when not specified

**R4.3:** Error handling and recovery
- Validate function parameters before execution
- Catch errors during shape creation/manipulation
- Provide user-friendly error messages
- Log errors for debugging without exposing to user
- Partial execution: if 3/5 shapes created successfully, keep the 3 and report error

---

### R5: Real-Time Collaboration for AI Commands

**R5.1:** Shared AI state across all users
- AI-generated shapes use standard real-time sync (Firebase onSnapshot)
- No separate AI sync mechanism needed
- All users see AI results within 100ms

**R5.2:** Multi-user AI access
- Multiple users can submit AI commands simultaneously
- Use existing conflict resolution system for race conditions
- AI-generated shapes include metadata: `createdBy`, `createdVia: 'ai'`
- AI commands don't block other users' manual edits

**R5.3:** AI activity indicators
- Show which user is currently using AI ("Alice is using AI...")
- Display brief summary of AI action ("AI creating login form...")
- Toast notifications for completed AI actions
- Presence indicator distinguishes AI activity from manual editing

---

### R6: Performance & Responsiveness

**R6.1:** Response time targets
- **Single-step commands:** < 2 seconds (creation, manipulation, simple layout)
- **Multi-step commands:** < 4 seconds (complex layouts with 3-5 elements)
- **Query commands:** < 1 second (get canvas state, search shapes)

**R6.2:** Latency breakdown
- AI processing (OpenAI API call): 500-1500ms
- Function execution (local): 50-200ms
- Real-time sync (Firebase): < 100ms
- Total: 1-2 seconds for simple commands

**R6.3:** Timeout handling
- 10-second timeout for AI responses
- Show "AI is taking longer than usual" after 5 seconds
- Cancel button to abort long-running commands
- Graceful degradation if AI service unavailable

**R6.4:** Optimistic UI
- Show loading state immediately on command submission
- Pre-create shape placeholders with loading animation
- Replace placeholders with actual shapes when AI responds
- Rollback placeholders if AI fails

---

### R7: User Interface & Feedback

**R7.1:** AI command input panel
- **Location:** Top-right corner or bottom of canvas (floating panel)
- **Appearance:** Rounded input with AI icon, modern styling
- **Shortcuts:** `Cmd/Ctrl + K` to focus input
- **States:** Default, focused, processing, success, error

**R7.2:** Processing feedback
- Spinner animation in input field during AI processing
- Status text: "AI is thinking...", "Creating shapes...", "Done!"
- Progress indicator for multi-step operations
- Estimated time remaining for complex commands

**R7.3:** Success feedback
- Green checkmark animation on success
- Toast notification: "✓ Created login form (3 shapes)"
- Highlight newly created shapes briefly (pulsing border)
- Clear input field for next command

**R7.4:** Error feedback
- Red error icon in input field
- Error message below input: "Could not find a blue rectangle. Try selecting a shape first."
- Suggestions for fixing error
- Don't clear input field (allow user to edit and retry)

**R7.5:** Command history
- Dropdown showing last 10 AI commands
- Click to re-run previous command
- Up/down arrow keys to navigate history
- Clear history button

---

### R8: AI Prompt Engineering & Context

**R8.1:** System prompt defines AI behavior
```
You are an AI assistant for a collaborative canvas application. Your job is to interpret user commands and call the appropriate canvas manipulation functions.

Rules:
1. Always prefer creating shapes over just describing what you would do
2. Infer reasonable defaults for missing parameters (size, color, position)
3. When a command is ambiguous, make your best guess or ask for clarification
4. For complex commands, break them into multiple function calls
5. Use standard colors (red, blue, green) and readable sizes (100x100 for shapes)
6. Position shapes at canvas center (0, 0) unless specified
7. When user says "these shapes", reference selected shapes or last 3 created shapes

Available functions: [function schemas]
```

**R8.2:** Provide canvas context to AI
- Current canvas state (all shapes)
- Selected shapes (if any)
- Last N created shapes (for "these shapes" references)
- Canvas dimensions and viewport
- User's display name (for logging/debugging)

**R8.3:** Example few-shot prompts
Include examples in system prompt:
```
Example 1:
User: "Create a red circle"
Response: createShape('circle', 0, 0, 100, 100, '#FF0000')

Example 2:
User: "Make a login form"
Response: 
1. createShape('text', 0, -80, 100, 30, '#000000', 'Username')
2. createShape('rectangle', 0, -50, 200, 40, '#F0F0F0')
3. createShape('text', 0, 20, 100, 30, '#000000', 'Password')
4. createShape('rectangle', 0, 50, 200, 40, '#F0F0F0')
5. createShape('rectangle', 0, 120, 200, 50, '#0066FF', 'Login')

Example 3:
User: "Move the blue rectangle to the center"
Response:
1. getShapesByColor('blue') // returns [shape1, shape2]
2. moveShape(shape1.id, 0, 0) // assuming shape1 is most recent
```

---

### R9: Security & Rate Limiting

**R9.1:** API key security
- Store OpenAI API key in environment variables (never in client code)
- Use serverless function or backend endpoint to proxy AI requests
- Validate user authentication before processing AI commands
- Log all AI requests with user ID for audit trail

**R9.2:** Rate limiting
- Limit AI commands to 10 per minute per user
- Show "Rate limit exceeded" error with retry time
- Implement exponential backoff for retries
- Admin users have higher limits (30 per minute)

**R9.3:** Content validation
- Validate AI function call responses before execution
- Sanitize text content (prevent XSS in text shapes)
- Limit shape creation to 50 shapes per command (prevent abuse)
- Validate coordinate ranges (don't create off-canvas shapes)

---

### R10: Testing & Quality Assurance

**R10.1:** Unit tests for AI integration
- Mock OpenAI API responses
- Test function schema definitions
- Test parameter validation
- Test error handling

**R10.2:** Integration tests for command execution
- Test each command category (creation, manipulation, layout, complex)
- Test multi-step command execution
- Test real-time sync of AI-generated shapes
- Test multi-user AI usage

**R10.3:** End-to-end tests
- Test full user flow: input command → AI processing → shapes appear
- Test collaboration: User A uses AI, User B sees results
- Test error scenarios: invalid commands, timeouts, API failures

**R10.4:** Manual testing checklist
- [ ] All 16+ command variations execute successfully
- [ ] Complex commands produce properly arranged layouts
- [ ] Response times meet targets (<2s simple, <4s complex)
- [ ] Multi-user AI works without conflicts
- [ ] Error messages are clear and helpful
- [ ] AI works on canvases with existing shapes
- [ ] Command history functions correctly

---

## Technical Considerations

### AI Service Architecture

**Option A: Client-Side Direct Integration (Simple, Not Recommended)**
```
React Component → OpenAI API (client) → Execute Functions Locally
```
**Pros:** Simple, no backend needed
**Cons:** Exposes API keys, no rate limiting, no logging

**Option B: Backend Proxy (Recommended)**
```
React Component → Backend API → OpenAI API → Return Function Calls → Execute Locally
```
**Pros:** Secure API keys, rate limiting, logging, user authentication
**Cons:** Requires backend service

**Option C: Serverless Function (Best for MVP)**
```
React Component → Vercel Function → OpenAI API → Return Function Calls → Execute Locally
```
**Pros:** No server management, scales automatically, secure
**Cons:** Cold start latency (mitigated by keeping functions warm)

**Recommendation:** Option C (Vercel Serverless Function) for MVP

---

### Implementation Technology Stack

**AI Integration:**
- **OpenAI GPT-4 Turbo (Selected):** Best balance of speed, accuracy, and cost
  - Model: `gpt-4-turbo-preview` or `gpt-4-1106-preview`
  - Native function calling for structured outputs
  - Expected accuracy: 90%+ on canvas commands
  - Response time: 1-2s for simple commands
- **Function Calling:** Native OpenAI function calling (no LangChain needed for MVP)
- **API Version:** OpenAI SDK v4.x for TypeScript

**Backend:**
- **Vercel Serverless Functions:** TypeScript functions in `/api` directory
- **Environment Variables:** `OPENAI_API_KEY` stored in Vercel dashboard
- **Authentication:** Firebase Auth token verification before processing

**Frontend:**
- **New Hook:** `useAIAgent` for command submission and state management
- **New Component:** `AICommandInput` for UI
- **New Service:** `ai.service.ts` for API communication

---

### Data Model Extensions

**New Firestore Collection: `ai-commands` (Optional, for logging/history)**
```typescript
/ai-commands/{commandId}
{
  canvasId: string;
  userId: string;
  userName: string;
  command: string;
  timestamp: Timestamp;
  status: 'pending' | 'success' | 'error';
  resultShapeIds: string[];  // IDs of shapes created
  errorMessage?: string;
  executionTime: number;  // milliseconds
}
```

**Purpose:** 
- Command history per canvas
- Analytics on AI usage patterns
- Debugging failed commands
- Potential undo functionality ("undo last AI command")

**Shape Metadata Extension:**
```typescript
interface CanvasObject {
  // ... existing fields
  createdVia?: 'manual' | 'ai';  // NEW: track AI-generated shapes
  aiCommandId?: string;  // NEW: link to original command
}
```

---

### Performance Optimization Strategies

**1. Function Call Batching:**
For complex commands creating multiple shapes, batch Firebase writes:
```typescript
// Instead of 5 separate writes (slow)
await createShape(...)
await createShape(...)
await createShape(...)
await createShape(...)
await createShape(...)

// Use Firestore batch write (fast)
const batch = firestore.batch()
batch.set(ref1, shape1)
batch.set(ref2, shape2)
// ...
await batch.commit()
```

**2. Optimistic Shape Rendering:**
Create placeholder shapes locally before AI responds, replace with actual shapes after:
```typescript
// On command submit
const placeholders = createPlaceholders(estimatedCount)
renderPlaceholders(placeholders)

// On AI response
replacePlaceholders(actualShapes)
```

**3. AI Response Caching:**
Cache AI responses for identical commands (same canvas state):
```typescript
const cacheKey = `${command}:${canvasStateHash}`
if (cache.has(cacheKey)) {
  return cache.get(cacheKey)  // Instant response
}
```

**4. Stream AI Responses:**
Use OpenAI streaming to show partial results as AI generates them:
```typescript
const stream = await openai.chat.completions.create({
  model: 'gpt-4-turbo',
  messages: [...],
  functions: [...],
  stream: true
})

for await (const chunk of stream) {
  // Execute function calls as they arrive
  if (chunk.choices[0].delta.function_call) {
    executeFunctionCall(chunk.choices[0].delta.function_call)
  }
}
```

---

### OpenAI Function Schema Definition

Full schema for all required functions:

```typescript
const functions = [
  {
    name: 'createShape',
    description: 'Create a new shape on the canvas',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['rectangle', 'circle', 'text'],
          description: 'Type of shape to create'
        },
        x: {
          type: 'number',
          description: 'X coordinate (0 is canvas center)'
        },
        y: {
          type: 'number',
          description: 'Y coordinate (0 is canvas center)'
        },
        width: {
          type: 'number',
          description: 'Width in pixels'
        },
        height: {
          type: 'number',
          description: 'Height in pixels'
        },
        color: {
          type: 'string',
          description: 'Color as hex code or name (e.g., #FF0000 or red)'
        },
        text: {
          type: 'string',
          description: 'Text content (required if type is text)'
        }
      },
      required: ['type', 'x', 'y', 'width', 'height', 'color']
    }
  },
  {
    name: 'moveShape',
    description: 'Move an existing shape to a new position',
    parameters: {
      type: 'object',
      properties: {
        shapeId: {
          type: 'string',
          description: 'ID of the shape to move'
        },
        x: {
          type: 'number',
          description: 'New X coordinate'
        },
        y: {
          type: 'number',
          description: 'New Y coordinate'
        }
      },
      required: ['shapeId', 'x', 'y']
    }
  },
  {
    name: 'resizeShape',
    description: 'Resize an existing shape',
    parameters: {
      type: 'object',
      properties: {
        shapeId: {
          type: 'string',
          description: 'ID of the shape to resize'
        },
        width: {
          type: 'number',
          description: 'New width in pixels'
        },
        height: {
          type: 'number',
          description: 'New height in pixels'
        }
      },
      required: ['shapeId', 'width', 'height']
    }
  },
  {
    name: 'rotateShape',
    description: 'Rotate an existing shape',
    parameters: {
      type: 'object',
      properties: {
        shapeId: {
          type: 'string',
          description: 'ID of the shape to rotate'
        },
        degrees: {
          type: 'number',
          description: 'Rotation angle in degrees (0-360)'
        }
      },
      required: ['shapeId', 'degrees']
    }
  },
  {
    name: 'getCanvasState',
    description: 'Get all shapes currently on the canvas',
    parameters: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'getShapesByColor',
    description: 'Find all shapes with a specific color',
    parameters: {
      type: 'object',
      properties: {
        color: {
          type: 'string',
          description: 'Color to search for (hex or name)'
        }
      },
      required: ['color']
    }
  },
  {
    name: 'arrangeHorizontally',
    description: 'Arrange shapes in a horizontal row with even spacing',
    parameters: {
      type: 'object',
      properties: {
        shapeIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of shape IDs to arrange'
        },
        spacing: {
          type: 'number',
          description: 'Space between shapes in pixels',
          default: 20
        }
      },
      required: ['shapeIds']
    }
  },
  {
    name: 'createGrid',
    description: 'Create a grid of shapes',
    parameters: {
      type: 'object',
      properties: {
        rows: {
          type: 'number',
          description: 'Number of rows'
        },
        cols: {
          type: 'number',
          description: 'Number of columns'
        },
        shapeType: {
          type: 'string',
          enum: ['rectangle', 'circle'],
          description: 'Type of shape to create'
        },
        size: {
          type: 'number',
          description: 'Size of each shape in pixels',
          default: 50
        },
        spacing: {
          type: 'number',
          description: 'Gap between shapes in pixels',
          default: 20
        }
      },
      required: ['rows', 'cols', 'shapeType']
    }
  }
  // ... add more functions as needed
]
```

---

### Edge Cases & Handling

#### Case 1: Ambiguous Shape Reference

**Scenario:**
User: "Move the rectangle to the center"
Canvas has 5 rectangles

**Handling Options:**
1. **Most Recent:** Move the most recently created rectangle
2. **Selected:** If a rectangle is selected, move that one
3. **Clarify:** Ask user "Which rectangle? (1) Red at top-left (2) Blue at bottom-right..."

**Recommendation:** Use selected shape if available, otherwise most recent, with feedback message: "Moved most recent rectangle (red) to center. Select a specific shape first to target it."

---

#### Case 2: Complex Command Partial Failure

**Scenario:**
User: "Create a login form"
AI successfully creates username label and input, but fails on password field

**Handling:**
1. Keep successfully created shapes (don't rollback)
2. Show error: "Created username field, but failed to create password field. Error: [reason]"
3. Return IDs of created shapes for potential retry
4. Log error for debugging

---

#### Case 3: Simultaneous AI Commands from Multiple Users

**Scenario:**
User A: "Create a red circle"
User B: "Create a blue circle" (submitted at same time)

**Handling:**
- Both AI requests processed independently (no locking)
- Both execute their function calls
- Firebase handles write ordering (existing conflict resolution)
- Both circles appear for all users
- No special handling needed (existing infrastructure handles it)

---

#### Case 4: AI Timeout or Service Unavailable

**Scenario:**
OpenAI API is slow or down, request times out after 10 seconds

**Handling:**
1. Show error: "AI service is temporarily unavailable. Please try again."
2. Don't leave shapes in loading state
3. Clear processing indicator
4. Log error for monitoring
5. Offer retry button
6. Fall back to manual tools if AI is down for extended period

---

#### Case 5: Invalid or Dangerous Command

**Scenario:**
User: "Delete all shapes" or "Create 10000 circles"

**Handling:**
- Validate function parameters before execution
- Limit bulk operations (max 50 shapes per command)
- Confirm destructive operations with user
- Rate limit prevents spam
- Log suspicious commands for review

---

## UI/UX Specifications

### AI Command Input Panel Design

**Appearance:**
```
┌─────────────────────────────────────────────────┐
│  🤖 Ask AI                              [✕]     │
│  ┌───────────────────────────────────────────┐  │
│  │ Create a blue circle in the center        │  │
│  │                                    [Send] │  │
│  └───────────────────────────────────────────┘  │
│  💡 Try: "Make a login form" or "3x3 grid"     │
└─────────────────────────────────────────────────┘
```

**Positioning:**
- Floating panel in top-right corner
- Can be dragged to reposition
- Minimize button (collapses to small icon)
- Keyboard shortcut: `Cmd/Ctrl + K` to toggle

**States:**

**1. Default (Idle):**
- White background
- Gray border
- Placeholder text visible
- Example commands shown

**2. Focused:**
- Blue border highlight
- Placeholder disappears
- Command history dropdown appears (if available)

**3. Processing:**
- Input disabled
- Spinner animation
- Status text: "AI is thinking..."
- Progress bar for estimated time

**4. Success:**
- Green border flash
- Checkmark animation
- Brief toast: "✓ Created 3 shapes"
- Input clears after 1 second

**5. Error:**
- Red border
- Error icon
- Error message below input
- Input remains for editing
- Retry button

---

### AI Activity Indicators

**1. User AI Status (in Presence Panel):**
```
┌───────────────────┐
│ Online (3)        │
│ ─────────────────│
│ 👤 Alice Smith    │  ← Owner
│ 👤 Bob Jones  🤖  │  ← Using AI
│ 👤 Carol White    │
└───────────────────┘
```

**2. Canvas Activity Toast:**
When AI completes command:
```
┌────────────────────────────────────┐
│  🤖 Alice used AI                  │
│  Created login form (3 shapes)    │
│                            [View] │
└────────────────────────────────────┘
```
- Auto-dismiss after 3 seconds
- "View" button zooms to AI-generated shapes

**3. Shape Highlight (Newly Created by AI):**
Newly AI-generated shapes pulse with green border for 2 seconds:
```css
@keyframes ai-created-pulse {
  0% { border: 2px solid #00FF00; opacity: 1; }
  100% { border: 2px solid #00FF00; opacity: 0; }
}
```

---

### Command History Dropdown

**Appearance:**
```
┌─────────────────────────────────────┐
│ Recent Commands                     │
│ ─────────────────────────────────  │
│ Create a login form          [▶]   │
│ 3x3 grid of squares          [▶]   │
│ Move blue rectangle center   [▶]   │
│ Arrange shapes horizontally  [▶]   │
│ Create red circle            [▶]   │
│                              [Clear]│
└─────────────────────────────────────┘
```

- Click command to re-run
- [▶] button to insert into input (without running)
- Clear button removes history
- Persisted in localStorage per canvas

---

## Implementation Phases

### Phase 1: Core AI Integration (6-8 hours)

**Goal:** Basic AI command processing with 3-4 simple commands working

**Tasks:**
1. Create Vercel serverless function `/api/ai-command`
2. Integrate OpenAI SDK with function calling
3. Define initial function schemas (createShape, moveShape, getCanvasState)
4. Implement AI service (`src/services/ai.service.ts`)
5. Create `useAIAgent` hook for state management
6. Build basic AI input component (no styling yet)
7. Test end-to-end: input → AI → function call → shape appears
8. Handle errors and timeouts
9. Write unit tests for AI service

**Deliverable:** User can type "Create a red circle" and it appears

---

### Phase 2: Command Expansion (6-8 hours)

**Goal:** Implement all command categories (8+ command types)

**Tasks:**
1. Add manipulation functions (move, resize, rotate)
2. Add layout functions (arrangeHorizontally, createGrid, distributeEvenly)
3. Add query functions (getShapesByColor, getRecentShapes)
4. Add complex composite functions (createLoginForm, createNavigationBar, createCardLayout)
5. Update function schemas and system prompt
6. Test each command category thoroughly
7. Handle ambiguous references (which shape to move?)
8. Write integration tests for all command types

**Deliverable:** All 8+ command types working reliably

---

### Phase 3: Real-Time Collaboration (3-4 hours)

**Goal:** Ensure AI commands work seamlessly in multi-user environment

**Tasks:**
1. Verify AI-generated shapes sync to all users (should work automatically via existing infrastructure)
2. Add AI activity indicators to presence panel
3. Add toast notifications for AI actions by other users
4. Test with 2+ concurrent users using AI simultaneously
5. Verify no conflicts between AI and manual edits
6. Test race conditions (both users AI at same time)
7. Write integration tests for multi-user AI scenarios

**Deliverable:** Multiple users can use AI simultaneously without issues

---

### Phase 4: UI/UX Polish (4-5 hours)

**Goal:** Professional, intuitive AI command interface

**Tasks:**
1. Design and implement styled AI command input panel
2. Add loading animations and state transitions
3. Implement command history dropdown
4. Add keyboard shortcuts (Cmd+K, up/down arrows)
5. Create success/error feedback animations
6. Add example commands and hints
7. Implement panel dragging and minimization
8. Test UX with real user scenarios
9. Add accessibility (ARIA labels, keyboard navigation)

**Deliverable:** Polished, intuitive AI interface

---

### Phase 5: Performance & Optimization (2-3 hours)

**Goal:** Meet performance targets (<2s simple, <4s complex)

**Tasks:**
1. Implement Firebase batch writes for complex commands
2. Add AI response caching (optional)
3. Optimize function execution order
4. Add optimistic placeholder rendering
5. Monitor and log performance metrics
6. Test with slow network conditions
7. Implement progressive loading for complex commands

**Deliverable:** All performance targets met

---

### Phase 6: Testing & Documentation (3-4 hours)

**Goal:** Comprehensive testing and user-facing documentation

**Tasks:**
1. Write unit tests for all AI service functions (15+ tests)
2. Write integration tests for command execution (20+ tests)
3. Write end-to-end tests for user flows (10+ tests)
4. Manual testing checklist (all 16+ command variations)
5. Update README with AI features section
6. Add AI command documentation (examples, tips)
7. Create video demo showing AI capabilities
8. Update architecture docs

**Deliverable:** Fully tested and documented AI agent feature

---

**Total Estimated Time:** 24-32 hours  
**Recommended Timeline:** 1 week (with buffer)

---

## Success Metrics

### Command Breadth & Capability (10 points)

**Excellent (9-10 points):**
- 8+ distinct command types across all categories
- Commands are diverse and meaningful
- Handles creation, manipulation, layout, and complex commands
- Natural language interpretation is flexible and robust

**Measurement:**
- [ ] Creation commands: 4+ working variations
- [ ] Manipulation commands: 4+ working variations
- [ ] Layout commands: 2+ working variations
- [ ] Complex commands: 2+ working variations
- [ ] Total: 12+ distinct working commands

---

### Complex Command Execution (8 points)

**Excellent (7-8 points):**
- "Create login form" produces 3+ properly arranged elements
- Complex layouts execute multi-step plans correctly
- Smart positioning and styling applied
- Handles ambiguity intelligently

**Measurement:**
- [ ] Login form: Creates username label, input, password label, input, button (5 elements), vertically stacked
- [ ] Navigation bar: Creates container + 4 menu items, horizontally arranged
- [ ] Card layout: Creates container, title, image placeholder, description (4 elements), properly nested
- [ ] Elements have professional spacing (20-30px gaps)
- [ ] Layouts are centered and visually balanced

---

### AI Performance & Reliability (7 points)

**Excellent (6-7 points):**
- Sub-2 second responses for simple commands
- 90%+ accuracy in command interpretation
- Natural UX with visible feedback
- Shared state works flawlessly
- Multiple users can use AI simultaneously without conflicts

**Measurement:**
- [ ] Simple command response time: average < 2s (test with 20 commands)
- [ ] Complex command response time: average < 4s (test with 10 commands)
- [ ] Accuracy: 90%+ success rate on test command set (50 varied commands)
- [ ] Multi-user test: 3 users simultaneously using AI, all see same results < 100ms latency
- [ ] Error handling: Clear, actionable error messages for failed commands
- [ ] Feedback: Loading states, success/error animations all present and smooth

---

## Risks & Mitigations

### Risk 1: AI Accuracy Below 90%

**Risk:** AI misinterprets commands, creates wrong shapes or positions

**Mitigation:**
- Extensive prompt engineering with few-shot examples
- Use GPT-4 Turbo (best accuracy)
- Test with 100+ varied commands, iterate on failures
- Implement clarification system ("Did you mean...?")
- Allow users to provide feedback to improve prompts

**Fallback:** 
- Provide manual tools as backup
- "Edit last AI action" button to correct mistakes quickly

---

### Risk 2: Performance Below Targets

**Risk:** Response times exceed 2-4 second targets, poor UX

**Mitigation:**
- Use GPT-4 Turbo (fastest GPT-4 variant)
- Implement batch writes for complex commands
- Cache frequently used AI responses
- Optimize function execution (parallel where possible)
- Use streaming responses for progressive rendering

**Fallback:**
- Set timeout at 10 seconds, show clear error
- Offer "AI is slow, use manual tools" option

---

### Risk 3: OpenAI API Costs

**Risk:** High usage leads to expensive API bills

**Mitigation:**
- Implement strict rate limiting (10 commands/min per user)
- Monitor usage via OpenAI dashboard
- Set monthly budget alerts
- Optimize prompts to reduce token usage
- Consider caching for repeated commands

**Fallback:**
- Upgrade to team plan with volume discounts
- Implement pay-per-command for power users
- Temporarily disable AI if budget exceeded

---

### Risk 4: Multi-User Conflicts

**Risk:** Simultaneous AI usage by multiple users causes race conditions or conflicts

**Mitigation:**
- Leverage existing conflict resolution system (version checking)
- Each AI command uses standard canvas services (no special handling)
- Firebase handles concurrent writes automatically
- Test thoroughly with 5+ concurrent AI users

**Fallback:**
- Add queue system for AI commands if conflicts persist
- Stagger AI execution (slight delay between users)

---

### Risk 5: Security & Abuse

**Risk:** Users spam AI commands, abuse system, attempt injection attacks

**Mitigation:**
- Server-side rate limiting (10/min per user)
- Validate all function parameters before execution
- Limit bulk operations (max 50 shapes per command)
- Sanitize text content
- Log all AI commands with user ID
- Implement temporary ban for abuse

**Fallback:**
- Admin dashboard to monitor AI usage
- Manual review of suspicious commands
- Temporary AI disable for individual users

---

## Future Enhancements (Out of Scope)

### AI Design Suggestions

**Description:** AI analyzes canvas and suggests improvements (color harmony, alignment, spacing)

**Timeline:** Phase 6 (after core AI agent is proven)

**Trigger:** User requests design help features

---

### Voice Input for Commands

**Description:** Speak commands instead of typing

**Timeline:** Phase 7+

**Requirements:** Web Speech API, noise handling, mobile support

---

### AI Learning from User Preferences

**Description:** AI adapts to user's style (preferred colors, sizes, layouts)

**Timeline:** Phase 8+ (requires ML infrastructure)

---

### Collaborative AI Chat

**Description:** Team discusses designs with AI in shared chat

**Timeline:** Major feature (separate PRD)

---

### Advanced Query Commands

**Description:** "How many rectangles are there?", "Find all red shapes", "What's the largest shape?"

**Timeline:** Phase 6

---

## Appendix

### Related Documents

- `memory-bank/projectbrief.md` - Project overview and status
- `memory-bank/systemPatterns.md` - Architecture patterns
- `memory-bank/techContext.md` - Technology stack
- `architecture.md` - System architecture diagrams
- `README.md` - User-facing documentation

### External References

- OpenAI Function Calling: https://platform.openai.com/docs/guides/function-calling
- GPT-4 Turbo: https://platform.openai.com/docs/models/gpt-4-turbo-and-gpt-4
- Vercel Serverless Functions: https://vercel.com/docs/functions
- LangChain Tools: https://js.langchain.com/docs/modules/agents/tools/

### Example AI Prompts

**System Prompt:**
```
You are an AI assistant for CollabCanvas, a collaborative design tool. Your job is to interpret user commands and call canvas manipulation functions to create, modify, and arrange shapes.

Canvas Coordinate System:
- (0, 0) is the canvas center
- Positive X is right, positive Y is down
- Typical canvas viewport: -1000 to +1000 in both directions

Default Values:
- Shape size: 100x100 for circles/squares, 200x40 for rectangles
- Colors: Use standard names (red, blue, green) or hex codes
- Spacing: 20-30px between elements
- Text size: 16-20px font size

Guidelines:
1. Always call functions to create/modify shapes (don't just describe)
2. For ambiguous references ("the rectangle"), use most recent or selected shape
3. For complex commands, break into multiple function calls
4. Infer reasonable defaults for missing parameters
5. Position shapes at canvas center unless specified
6. Use professional spacing and alignment for layouts

Available Functions:
[function schemas here]

Example Commands:
- "Create a red circle" → createShape('circle', 0, 0, 100, 100, '#FF0000')
- "Make a 3x3 grid" → createGrid(3, 3, 'rectangle', 50, 20)
- "Move the blue rectangle to top-left" → getShapesByColor('blue'), moveShape(id, -400, -300)
- "Create a login form" → [5 function calls for labels, inputs, button]
```

---

**Document Version:** 1.0  
**Last Updated:** October 19, 2025  
**Author:** AI Assistant  
**Status:** Ready for Implementation  
**Estimated Implementation Time:** 24-32 hours (1 week)

