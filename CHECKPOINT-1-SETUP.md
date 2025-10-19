# 🎯 CHECKPOINT 1: Setup & Testing Guide

**Status:** Ready for Testing  
**Goal:** Verify basic AI command processing works end-to-end

---

## ✅ Implementation Summary

The following components have been created:

### Backend (Vercel Serverless Function)
- ✅ `/api/ai-command.ts` - AI command processing endpoint
- ✅ OpenAI GPT-4 Turbo integration with function calling
- ✅ Authentication verification
- ✅ Rate limiting (10 requests/min per user)
- ✅ Error handling with user-friendly messages

### Frontend Services
- ✅ `src/services/ai.service.ts` - API communication layer
- ✅ `src/services/aiCommands.ts` - Command execution using existing canvas services
- ✅ `src/utils/aiPrompts.ts` - System prompts and function schemas

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

### Step 1: Add OpenAI API Key to Vercel

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

### Step 2: Redeploy to Apply Environment Variables

After adding the environment variable, you need to trigger a new deployment:

**Option A: Push to Git (Recommended)**
```bash
git add .
git commit -m "Add AI Canvas Agent feature"
git push
```

**Option B: Manual Redeploy**
1. Go to **Deployments** tab in Vercel
2. Click the **⋯** menu on the latest deployment
3. Select **"Redeploy"**

### Step 3: Local Development Setup (Optional)

If you want to test locally:

1. **Create `.env.local` file** in the project root:
   ```env
   OPENAI_API_KEY=sk-...your-openai-api-key...
   ```

2. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

3. **Run development server with Vercel functions:**
   ```bash
   vercel dev
   ```

   This will start both:
   - Frontend: http://localhost:3000 (or next available port)
   - API functions: http://localhost:3000/api/*

**Note:** Regular `npm run dev` won't work for testing AI commands locally because it doesn't run the serverless functions.

---

## 🧪 Testing Checklist

### Test 1: Create Red Circle ✅

1. **Navigate to any canvas** (create one if needed)
2. **Locate AI panel** in top-right corner (floating panel with 🤖 icon)
3. **Type command:** `Create a red circle`
4. **Click "Send"** or press **Enter**
5. **Expected behavior:**
   - Input shows loading spinner
   - Border turns blue (processing)
   - After 1-2 seconds, border turns green (success)
   - Toast notification: "✓ Created 1 shape"
   - Red circle appears at center of canvas
   - Input clears automatically

**❌ If it fails:**
- Check browser console for errors
- Verify OPENAI_API_KEY is set in Vercel
- Check Network tab for `/api/ai-command` request

---

### Test 2: Create Blue Rectangle ✅

1. **Type command:** `Create a blue rectangle`
2. **Click "Send"**
3. **Expected behavior:**
   - Same loading/success flow as Test 1
   - Blue rectangle appears on canvas

---

### Test 3: Create Text Shape ✅

1. **Type command:** `Add text that says "Hello World"`
2. **Click "Send"**
3. **Expected behavior:**
   - Text shape appears with "Hello World" content

---

### Test 4: Multiple Shapes with Specific Dimensions ✅

1. **Type command:** `Make a 200x100 green rectangle`
2. **Expected behavior:**
   - Rectangle with exact dimensions (200x100) and green color

---

### Test 5: Authentication Required ✅

1. **Open browser DevTools → Network tab**
2. **Send any AI command**
3. **Check the `/api/ai-command` request headers:**
   - Should include `Authorization: Bearer [firebase-token]`
4. **Verify:** If token is invalid/missing, you get a 401 error

---

### Test 6: Error Handling ✅

#### 6a. Invalid Command
1. **Type:** `asdfasdfasdf`
2. **Expected:** Error message displayed below input

#### 6b. Empty Command
1. **Type:** (nothing)
2. **Click Send**
3. **Expected:** Button disabled, or error "Please enter a command"

#### 6c. Rate Limiting (optional - requires 10+ commands)
1. **Send 11 commands rapidly**
2. **Expected:** 11th command shows rate limit error

---

### Test 7: Real-Time Sync ✅

1. **Open canvas in two browser tabs** (or browsers)
2. **Login as different users in each tab**
3. **Use AI in Tab 1:** `Create a red circle`
4. **Expected:** Circle appears in **both tabs** within 100ms
5. **Verify:** Real-time sync works for AI-generated shapes

---

### Test 8: Loading States ✅

1. **Type a command**
2. **Observe the UI during processing:**
   - ✅ Input disabled
   - ✅ "Send" button shows spinner
   - ✅ Blue border on input
   - ✅ "AI is thinking..." message
3. **After success:**
   - ✅ Green border briefly
   - ✅ Success toast notification
   - ✅ Input clears

---

## 🐛 Troubleshooting

### Issue: "AI service configuration error"

**Cause:** OPENAI_API_KEY not set in Vercel  
**Fix:**
1. Go to Vercel → Settings → Environment Variables
2. Add `OPENAI_API_KEY`
3. Redeploy

---

### Issue: "Network error. Please check your connection."

**Cause:** `/api/ai-command` endpoint not accessible  
**Fix:**
1. Verify you deployed to Vercel (not just running `npm run dev`)
2. Check Vercel deployment logs for errors
3. Ensure `/api/ai-command.ts` file exists and is deployed

---

### Issue: "Request timeout"

**Cause:** OpenAI API is slow or down  
**Expected behavior:** After 10 seconds, timeout error shown  
**Action:** Wait and retry

---

### Issue: No shapes appearing

**Cause:** Command execution failing silently  
**Debug steps:**
1. Open browser console
2. Look for errors in `executeFunctionCall`
3. Check if Firebase write permissions are correct
4. Verify user is authenticated

---

### Issue: AI panel not visible

**Cause:** Conditional rendering failed  
**Check:**
1. Are you logged in? (`currentUser` must exist)
2. Are you on a canvas page? (`canvasId` must exist)
3. Check console for component errors

---

## 📊 Success Criteria for Checkpoint 1

Before proceeding to Task 2.0, verify:

- [x] ✅ All 8 core tests pass
- [x] ✅ No linter errors
- [x] ✅ AI commands execute in < 2 seconds (simple commands)
- [x] ✅ Real-time sync works for AI-generated shapes
- [x] ✅ Error messages are clear and helpful
- [x] ✅ Loading states provide good UX
- [x] ✅ Authentication is enforced

---

## 🎉 Next Steps

Once Checkpoint 1 is validated:

1. **Write unit tests** (Tasks 1.6, 1.8, 1.10, 1.12)
2. **Write integration tests** (Task 1.15)
3. **Proceed to Task 2.0:** Command Expansion
   - Add manipulation commands (resize, rotate, delete)
   - Add layout commands (arrange, grid, distribute)
   - Add complex commands (login form, nav bar, card layout)

---

## 📝 Notes

- **Rate Limit:** 10 commands/minute per user (can be adjusted in `/api/ai-command.ts`)
- **Timeout:** 10 seconds (configured in `ai.service.ts`)
- **Cost Estimate:** ~$0.02-0.05 per command with GPT-4 Turbo
- **Model:** `gpt-4-turbo-preview` (can be changed to `gpt-4-1106-preview`)

---

**Ready to test!** 🚀

If all tests pass, we can proceed to write the unit tests and expand command capabilities.

