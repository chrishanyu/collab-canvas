# AI Canvas Agent - Manual Testing Checklist

**Version:** 1.0  
**Date:** October 19, 2025  
**Tester:** _______________  
**Test Date:** _______________

## Setup Prerequisites

- [ ] OpenAI API key configured in environment variables
- [ ] Firebase authentication working
- [ ] Canvas creation/access working
- [ ] AI Command Input panel visible on canvas

## Test Environment

- [ ] Browser: _______________
- [ ] Canvas ID: _______________
- [ ] User ID: _______________

---

## Category 1: Creation Commands (3 tests)

### 1.1 Simple Shape Creation
- [ ] Command: `Create a red circle`
- [ ] Expected: Red circle appears at canvas center (0, 0)
- [ ] Actual: _______________
- [ ] Pass/Fail: _______________

### 1.2 Custom Sized Shape
- [ ] Command: `Make a 300x150 blue rectangle`
- [ ] Expected: Blue rectangle with specified dimensions
- [ ] Actual: _______________
- [ ] Pass/Fail: _______________

### 1.3 Text Shape
- [ ] Command: `Add text that says Welcome to CollabCanvas`
- [ ] Expected: Text shape with "Welcome to CollabCanvas"
- [ ] Actual: _______________
- [ ] Pass/Fail: _______________

---

## Category 2: Manipulation Commands (5 tests)

### 2.1 Move Shape
- [ ] Setup: Create a shape first
- [ ] Command: `Move that shape to 200, 300`
- [ ] Expected: Shape repositioned to (200, 300)
- [ ] Actual: _______________
- [ ] Pass/Fail: _______________

### 2.2 Resize Shape
- [ ] Setup: Create a shape first
- [ ] Command: `Make it 250x200`
- [ ] Expected: Shape resized to 250x200
- [ ] Actual: _______________
- [ ] Pass/Fail: _______________

### 2.3 Rotate Shape
- [ ] Setup: Create a rectangle
- [ ] Command: `Rotate the rectangle 45 degrees`
- [ ] Expected: Rectangle rotated 45°
- [ ] Actual: _______________
- [ ] Pass/Fail: _______________

### 2.4 Change Color
- [ ] Setup: Create a red circle
- [ ] Command: `Change the circle to purple`
- [ ] Expected: Circle color changes to purple
- [ ] Actual: _______________
- [ ] Pass/Fail: _______________

### 2.5 Delete Shape
- [ ] Setup: Create a shape
- [ ] Command: `Delete that shape`
- [ ] Expected: Shape disappears from canvas
- [ ] Actual: _______________
- [ ] Pass/Fail: _______________

---

## Category 3: Layout Commands (4 tests)

### 3.1 Horizontal Arrangement
- [ ] Setup: Create 3 shapes
- [ ] Command: `Arrange these shapes in a row`
- [ ] Expected: Shapes arranged horizontally with even spacing
- [ ] Actual: _______________
- [ ] Pass/Fail: _______________

### 3.2 Vertical Arrangement
- [ ] Setup: Create 3 shapes
- [ ] Command: `Stack them vertically`
- [ ] Expected: Shapes arranged vertically with even spacing
- [ ] Actual: _______________
- [ ] Pass/Fail: _______________

### 3.3 Grid Creation
- [ ] Command: `Create a 3x4 grid of blue squares`
- [ ] Expected: 12 blue squares in 3 rows, 4 columns
- [ ] Actual: _______________
- [ ] Pass/Fail: _______________

### 3.4 Even Distribution
- [ ] Setup: Create 3 shapes at different positions
- [ ] Command: `Distribute these shapes evenly horizontally`
- [ ] Expected: Shapes spaced evenly, first and last stay in place
- [ ] Actual: _______________
- [ ] Pass/Fail: _______________

---

## Category 4: Query Commands (4 tests)

### 4.1 Find by Color
- [ ] Setup: Create 2 red shapes and 1 blue shape
- [ ] Command: `Make all red shapes green`
- [ ] Expected: Both red shapes turn green, blue unchanged
- [ ] Actual: _______________
- [ ] Pass/Fail: _______________

### 4.2 Find by Type
- [ ] Setup: Create 2 rectangles and 1 circle
- [ ] Command: `Delete all rectangles`
- [ ] Expected: Only rectangles deleted, circle remains
- [ ] Actual: _______________
- [ ] Pass/Fail: _______________

### 4.3 Recent Shapes
- [ ] Setup: Create 5 shapes sequentially
- [ ] Command: `Delete the last 2 shapes`
- [ ] Expected: Most recent 2 shapes deleted
- [ ] Actual: _______________
- [ ] Pass/Fail: _______________

### 4.4 Selected Shapes
- [ ] Setup: Create 3 shapes, select 2 of them
- [ ] Command: `Arrange the selected shapes in a row`
- [ ] Expected: Only selected shapes arranged
- [ ] Actual: _______________
- [ ] Pass/Fail: _______________

---

## Category 5: Complex Multi-Step Commands (5 tests)

### 5.1 Login Form
- [ ] Command: `Create a login form`
- [ ] Expected: Form with header, email field, password field, submit button
- [ ] Components present: 
  - [ ] Header text "Login"
  - [ ] Email input field
  - [ ] Password input field
  - [ ] Sign In button
- [ ] Actual: _______________
- [ ] Pass/Fail: _______________

### 5.2 Navigation Bar
- [ ] Command: `Design a navigation bar with 4 menu items`
- [ ] Expected: Full-width nav bar with 4 text items
- [ ] Components present:
  - [ ] Nav background
  - [ ] Menu items (Home, About, Services, Contact)
- [ ] Actual: _______________
- [ ] Pass/Fail: _______________

### 5.3 Product Card
- [ ] Command: `Make a product card layout`
- [ ] Expected: Card with image placeholder, title, price, button
- [ ] Components present:
  - [ ] Card container
  - [ ] Image placeholder
  - [ ] Product name text
  - [ ] Price text
  - [ ] Add to Cart button
- [ ] Actual: _______________
- [ ] Pass/Fail: _______________

### 5.4 Dashboard Grid
- [ ] Command: `Create a dashboard with 6 stat cards`
- [ ] Expected: 2x3 grid of cards
- [ ] Actual: _______________
- [ ] Card count: _______________
- [ ] Pass/Fail: _______________

### 5.5 Flowchart
- [ ] Command: `Create a simple flowchart with 3 steps`
- [ ] Expected: 3 vertically arranged boxes (Start, Process, End)
- [ ] Actual: _______________
- [ ] Pass/Fail: _______________

---

## Category 6: Ambiguity Handling (5 tests)

### 6.1 "That" Reference
- [ ] Setup: Create a red circle
- [ ] Command: `Make that bigger` (without specifying which shape)
- [ ] Expected: AI operates on most recent shape (the circle)
- [ ] Actual: _______________
- [ ] Pass/Fail: _______________

### 6.2 "These" Reference
- [ ] Setup: Create 3 shapes
- [ ] Command: `Color these blue`
- [ ] Expected: AI operates on recent shapes or selected shapes
- [ ] Actual: _______________
- [ ] Pass/Fail: _______________

### 6.3 Vague Quantity
- [ ] Command: `Create a few red squares`
- [ ] Expected: 3-4 red squares created
- [ ] Actual: _______________
- [ ] Pass/Fail: _______________

### 6.4 Size Descriptor
- [ ] Command: `Make a large circle`
- [ ] Expected: Circle approximately 200x200
- [ ] Actual: _______________
- [ ] Pass/Fail: _______________

### 6.5 Spatial Reference
- [ ] Command: `Create a rectangle at the top`
- [ ] Expected: Rectangle positioned in upper area (y < 0)
- [ ] Actual: _______________
- [ ] Pass/Fail: _______________

---

## Category 7: Error Handling (5 tests)

### 7.1 Invalid Shape Type
- [ ] Command: `Create a triangle`
- [ ] Expected: Error message or AI creates closest alternative (rectangle)
- [ ] Actual: _______________
- [ ] Pass/Fail: _______________

### 7.2 Grid Too Large
- [ ] Command: `Create a 20x20 grid of shapes`
- [ ] Expected: Error message about grid size limit (max 100 shapes)
- [ ] Actual: _______________
- [ ] Pass/Fail: _______________

### 7.3 Delete Non-Existent
- [ ] Setup: Empty canvas
- [ ] Command: `Delete the red circle`
- [ ] Expected: Graceful error or "no shapes found" message
- [ ] Actual: _______________
- [ ] Pass/Fail: _______________

### 7.4 Empty Canvas Operation
- [ ] Setup: Empty canvas
- [ ] Command: `Arrange all shapes in a row`
- [ ] Expected: Graceful handling, no error crash
- [ ] Actual: _______________
- [ ] Pass/Fail: _______________

### 7.5 Network Error
- [ ] Setup: Disconnect from internet or block API
- [ ] Command: `Create a circle`
- [ ] Expected: Clear error message about connection/AI service
- [ ] Actual: _______________
- [ ] Pass/Fail: _______________

---

## Category 8: User Experience (5 tests)

### 8.1 Loading State
- [ ] Command: `Create a complex login form`
- [ ] Expected: Loading spinner/message appears during processing
- [ ] Observed loading indicator: Yes / No
- [ ] Pass/Fail: _______________

### 8.2 Success Feedback
- [ ] Command: `Create a circle`
- [ ] Expected: Success indication (toast, message, or immediate visual result)
- [ ] Observed feedback: _______________
- [ ] Pass/Fail: _______________

### 8.3 Error Display
- [ ] Command: Intentionally cause an error
- [ ] Expected: Error message clearly displayed
- [ ] Error message clear: Yes / No
- [ ] Pass/Fail: _______________

### 8.4 Input Clearing
- [ ] Command: `Create a circle`
- [ ] Expected: Input clears after successful execution
- [ ] Actual: _______________
- [ ] Pass/Fail: _______________

### 8.5 Keyboard Shortcuts
- [ ] Action: Press Enter to submit command
- [ ] Expected: Command executes
- [ ] Pass/Fail: _______________

---

## Category 9: Multi-User Collaboration (3 tests)

### 9.1 Real-Time Sync
- [ ] Setup: Open 2 browser windows with same canvas
- [ ] Command in Window 1: `Create a red circle`
- [ ] Expected: Circle appears in both windows
- [ ] Actual: _______________
- [ ] Pass/Fail: _______________

### 9.2 Simultaneous Commands
- [ ] Setup: 2 users on same canvas
- [ ] Both users submit AI commands simultaneously
- [ ] Expected: Both commands execute, no conflicts
- [ ] Actual: _______________
- [ ] Pass/Fail: _______________

### 9.3 Canvas State Awareness
- [ ] Setup: User A creates shapes, User B uses AI
- [ ] User B Command: `Make all shapes blue`
- [ ] Expected: All shapes (including User A's) turn blue
- [ ] Actual: _______________
- [ ] Pass/Fail: _______________

---

## Summary

### Test Results

- **Total Tests:** 44
- **Passed:** _______________
- **Failed:** _______________
- **Success Rate:** __________ %

### Categories Performance

| Category | Tests | Passed | Failed |
|----------|-------|--------|--------|
| Creation | 3 | ___ | ___ |
| Manipulation | 5 | ___ | ___ |
| Layout | 4 | ___ | ___ |
| Query | 4 | ___ | ___ |
| Complex Multi-Step | 5 | ___ | ___ |
| Ambiguity Handling | 5 | ___ | ___ |
| Error Handling | 5 | ___ | ___ |
| User Experience | 5 | ___ | ___ |
| Multi-User | 3 | ___ | ___ |
| **Total** | **44** | **___** | **___** |

### Critical Issues Found

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Non-Critical Issues

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Notes & Observations

_______________________________________________
_______________________________________________
_______________________________________________
_______________________________________________

### Recommendations

_______________________________________________
_______________________________________________
_______________________________________________

---

## Sign-Off

- **Tester Name:** _______________
- **Date:** _______________
- **Status:** ☐ Ready for Production  ☐ Needs Fixes  ☐ Blocked

**Next Steps:** _______________________________________________

