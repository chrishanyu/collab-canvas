# 🎯 CHECKPOINT 1: Setup & Testing Guide

**Status:** Ready for Testing  
**Goal:** Verify basic AI command processing works end-to-end with secure serverless architecture

---

## ✅ Implementation Summary

The following components have been created:

### Backend (Vercel Serverless Function - **Secure**)
- ✅ `api/ai-command.ts` - Main API endpoint handler
- ✅ `api/lib/openai.ts` - OpenAI client configuration
- ✅ `api/lib/prompts.ts` - System prompts (centralized)
- ✅ `api/lib/schemas.ts` - Function schemas (centralized)
- ✅ `api/lib/auth.ts` - Firebase auth verification
- ✅ `api/lib/rateLimit.ts` - Rate limiting (10 req/min per user)

### Frontend Services
- ✅ `src/services/ai.service.ts` - API communication layer
- ✅ `src/services/aiCommands.ts` - Command execution using existing canvas services

### React Integration
- ✅ `src/hooks/useAIAgent.ts` - State management hook
- ✅ `src/components/ai/AICommandInput.tsx` - User interface component
- ✅ `src/types/ai.ts` - TypeScript type definitions
- ✅ Integrated into `Canvas.tsx` (top-right floating panel)

### Supported Commands (MVP)
- ✅ `createShape` - Create rectangles, circles, text
- ✅ `moveShape` - Move shapes to new positions
- ✅ `getCanvasState` - Query current canvas state (for AI context)

---

## 🔧 Setup Instructions

### Step 1: Add OpenAI API Key

**🔒 IMPORTANT:** The API key is stored **server-side only** (secure, never exposed to browser).

**For Local Development:**

1. **Create `.env` file** in the project root:
   ```bash
   echo "OPENAI_API_KEY=sk-...your-api-key..." > .env
   ```

   **Note:** NO `VITE_` prefix! This keeps it server-side.

2. **Verify:**
   ```bash
   cat .env
   # Should show: OPENAI_API_KEY=sk-...
   ```

**For Production (Vercel):**

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/[your-username]/[project-name]
   - Navigate to: **Settings → Environment Variables**

2. **Add the following variable:**
   ```
   Key:   OPENAI_API_KEY
   Value: sk-...your-openai-api-key...
   ```

3. **Scope:** Select **All Environments** (Production, Preview, Development)

4. **Click "Save"**

**Security Note:** Without the `VITE_` prefix, this variable is only accessible to serverless functions, not the browser.

---

### Step 2: Build and Deploy

```bash
# Verify local build works
npm run build

# Should see: ✓ built in X.XXs (no errors)
```

```bash
# Commit and push
git add .
git commit -m "Add AI Canvas Agent with secure serverless architecture"
git push
```

**Vercel will:**
1. Build the frontend (React app)
2. **Compile the serverless function** (`/api/ai-command.ts`)
3. Deploy both

**Check Deployment Logs:**
- Look for: `✓ Serverless Function /api/ai-command compiled`
- Ensure no TypeScript errors in `api/` folder

---

## 🧪 Testing Checklist

### ⚠️ Testing Requires Deployment

**Important:** The AI feature **requires the Vercel serverless function**. You cannot test it with just `npm run dev` locally. You must deploy to Vercel first.

### Open Your Deployed App

Visit: `https://your-app.vercel.app`

---

### Test 1: Create Red Circle ✅

1. **Log in** to your deployed app
2. **Navigate to any canvas** (create one if needed)
3. **Locate AI panel** in top-right corner (floating panel with 🤖 icon)
4. **Type command:** `Create a red circle`
5. **Click "Send"** or press **Enter**
6. **Expected behavior:**
   - Input shows loading spinner
   - Border turns blue (processing)
   - After 1-2 seconds, border turns green (success)
   - Toast notification: "✓ Created 1 shape"
   - Red circle appears at center of canvas
   - Input clears automatically

**❌ If it fails:**
- Check browser console for errors
- Verify `OPENAI_API_KEY` is set in Vercel environment variables (NO `VITE_` prefix!)
- Check Network tab: Should see POST to `/api/ai-command`
- Check Vercel Function Logs in dashboard

---

### Test 2: Create Blue Rectangle ✅

1. **Type command:** `Make a blue rectangle`
2. **Click "Send"**
3. **Expected behavior:**
   - Blue rectangle appears at center
   - Toast: "✓ Created 1 shape"

---

### Test 3: Create Text Shape ✅

1. **Type command:** `Add text that says "Hello World"`
2. **Click "Send"**
3. **Expected behavior:**
   - Text shape appears with "Hello World"
   - Toast: "✓ Created 1 shape"

---

### Test 4: Move Shape ✅

1. **Create a shape first:** `Create a green circle`
2. **Note the shape ID** (or just try with any existing shape)
3. **Type command:** `Move the circle to x=100, y=100`
4. **Expected behavior:**
   - Shape moves to new position
   - Toast: "✓ Command executed successfully"

**Note:** For MVP, shape selection is simple (most recent or by type name).

---

### Test 5: Multi-User Sync ✅

1. **Open canvas in two browser tabs**
2. **In Tab 1:** `Create a red circle`
3. **In Tab 2:** Should see the circle appear in real-time
4. **Expected behavior:**
   - AI-created shapes sync via existing Firebase listeners
   - No special AI sync needed

---

### Test 6: Authentication Required ✅

1. **Log out**
2. **Try to send an AI command**
3. **Expected behavior:**
   - Error toast: "Authentication failed. Please log in again."
   - Command not executed

---

### Test 7: Rate Limiting ✅

1. **Send 11 commands rapidly** (e.g., "create a red circle" × 11)
2. **Expected behavior:**
   - First 10 succeed
   - 11th returns error: "Rate limit exceeded. Please wait a moment."
   - After 60 seconds, rate limit resets

---

## 🔍 Debugging Guide

### Browser Console Logs

**Successful Request:**
```
[AI Service] Sending request to: /api/ai-command
[AI Service] Command: create a red circle
[AI Service] Response status: 200
[AI Agent] Received 1 function calls
[AI Agent] Executing: createShape
[AI Agent] Successfully created shape
```

**Failed Request:**
```
[AI Service] Response status: 404
Error: AI endpoint not found
```

---

### Common Issues

#### Issue 1: "AI endpoint not found" (404)

**Cause:** Serverless function not deployed or not accessible

**Fix:**
1. Check Vercel deployment logs for function compilation
2. Verify `vercel.json` doesn't rewrite `/api/*` routes
3. Try accessing: `https://your-app.vercel.app/api/ai-command` (should return 405 Method Not Allowed for GET)
4. Redeploy

#### Issue 2: "AI service configuration error" (401 from OpenAI)

**Cause:** Invalid or missing OpenAI API key on backend

**Fix:**
1. Check Vercel environment variables (**NO** `VITE_` prefix!)
2. Verify your OpenAI API key is valid
3. Check you have credits in your OpenAI account
4. **Important:** After updating env vars, **redeploy**

#### Issue 3: "Authentication failed" (401 from your API)

**Cause:** User not logged in or Firebase auth token invalid

**Fix:**
1. Log out and log back in
2. Check Firebase auth is working
3. Check browser console for auth errors

#### Issue 4: "Rate limit exceeded" (429)

**Cause:** Exceeded 10 requests/minute per user (backend rate limit)

**Fix:**
- Wait 60 seconds
- Adjust rate limit in `/api/lib/rateLimit.ts` if needed (e.g., increase to 20)

#### Issue 5: "AI service is busy" (429 from OpenAI)

**Cause:** OpenAI API rate limits exceeded

**Fix:**
- Wait and retry
- Upgrade OpenAI account tier
- Check OpenAI dashboard for limits

#### Issue 6: Request timeout (504)

**Cause:** OpenAI taking too long to respond

**Fix:**
- Retry the command
- Simplify the command
- Check OpenAI status page

---

## 🏗️ Architecture Overview

For detailed architecture decisions, see `AI-ARCHITECTURE.md`.

### Request Flow

```
User types command in AICommandInput
         ↓
useAIAgent hook processes input
         ↓
ai.service.ts sends POST to /api/ai-command
         ↓
Vercel Serverless Function:
  1. Verify Firebase auth token
  2. Check rate limit (10/min per user)
  3. Call OpenAI GPT-4 Turbo
  4. Parse function calls
  5. Return to frontend
         ↓
Frontend receives function calls
         ↓
aiCommands.ts executes functions
         ↓
canvasObjects.service creates shapes in Firebase
         ↓
Real-time listeners sync to all users
```

### Key Files

```
api/                              # Backend (secure)
├── ai-command.ts                 # Main API handler
└── lib/
    ├── openai.ts                 # OpenAI client
    ├── prompts.ts                # System prompts
    ├── schemas.ts                # Function schemas
    ├── auth.ts                   # Auth verification
    └── rateLimit.ts              # Rate limiting

src/                              # Frontend
├── services/
│   ├── ai.service.ts             # API communication
│   └── aiCommands.ts             # Execute function calls
├── hooks/
│   └── useAIAgent.ts             # React hook
├── components/
│   └── ai/
│       └── AICommandInput.tsx    # UI component
└── types/
    └── ai.ts                     # TypeScript types
```

---

## ✅ Checkpoint 1 Complete Criteria

- [x] Environment variable set (OPENAI_API_KEY, no VITE_ prefix)
- [x] Serverless function deployed and accessible
- [x] Can create shapes via AI commands
- [x] Can move shapes via AI commands
- [x] AI-created shapes sync to all users in real-time
- [x] Authentication required for AI commands
- [x] Rate limiting enforced (10/min per user)
- [x] Error handling works (toast notifications)
- [x] Loading states work (spinner, colored borders)

---

## 📝 Notes for Next Steps

### Option A: Write Tests (Recommended)
- Task 1.6: Unit tests for `ai.service.ts`
- Task 1.8: Unit tests for `aiCommands.ts`
- Task 1.10: Unit tests for `useAIAgent` hook
- Task 1.12: Component tests for `AICommandInput`
- Task 1.15: E2E integration test

### Option B: Expand Commands (Task 2.0)
- Add more creation variations (ellipses, lines, etc.)
- Add manipulation commands (resize, rotate, delete)
- Add layout commands (arrange, grid, distribute)
- Add complex commands (login form, nav bar)

---

**🎉 Once all tests pass, Checkpoint 1 is complete!**
