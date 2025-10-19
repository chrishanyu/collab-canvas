# How to Validate Serverless Function Deployment

## Method 1: Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Select your `collab-canvas` project

2. **Check Latest Deployment:**
   - Click on the **Deployments** tab
   - Click on the **most recent deployment** (top of list)
   
3. **Verify Functions Tab:**
   - Look for a **"Functions"** tab or section
   - You should see: `/api/ai-command` listed
   - Status should be "Ready" or show execution stats

4. **Check Build Logs:**
   - Click **"View Function Logs"** or **"Building"** section
   - Search for: `api/ai-command`
   - You should see: "✓ api/ai-command.ts" (built successfully)

## Method 2: Direct API Test

Test the endpoint directly in your browser:

1. **Go to your deployed URL:**
   ```
   https://your-app.vercel.app/api/ai-command
   ```

2. **Expected Result:**
   - ❌ If 404: Function not deployed
   - ✅ If 405 "Method not allowed": Function exists! (POST required)
   - ✅ If 401 "Unauthorized": Function exists and working!

## Method 3: Use curl Command

```bash
# Replace YOUR_APP_URL with your actual Vercel URL
curl -X POST https://your-app.vercel.app/api/ai-command \
  -H "Content-Type: application/json" \
  -d '{"command":"test"}'
```

**Expected responses:**
- ✅ 401 Unauthorized = Function is deployed and running (needs auth token)
- ✅ 400 Bad Request = Function is deployed and validating input
- ❌ 404 Not Found = Function not deployed
- ❌ 502/504 = Function deployed but crashing

## Method 4: Check Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Pull deployment info
vercel pull

# List functions
vercel ls
```

## Method 5: Test Locally with Vercel Dev

```bash
# Run Vercel development server (includes serverless functions)
vercel dev

# Then test in another terminal:
curl -X POST http://localhost:3000/api/ai-command \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fake-token" \
  -d '{"command":"test","canvasId":"test","userId":"test"}'
```

---

## Common Issues & Solutions

### Issue 1: Function File Not Detected

**Symptom:** 404 error, no `/api/ai-command` in Functions list

**Check:**
```bash
# Verify file exists
ls -la api/ai-command.ts

# Check if it's in git
git ls-files | grep api/ai-command
```

**Solution:**
```bash
# If not in git, add it
git add api/ai-command.ts
git commit -m "Add AI serverless function"
git push
```

### Issue 2: TypeScript Compilation Error

**Symptom:** Build logs show errors for `api/ai-command.ts`

**Check Vercel build logs for:**
- TypeScript errors
- Missing dependencies
- Import errors

**Solution:**
```bash
# Test build locally
npm run build

# Check for TypeScript errors in API file
npx tsc --noEmit api/ai-command.ts
```

### Issue 3: Wrong Export Format

**Symptom:** Function deploys but returns 500 error

**Check `api/ai-command.ts`:**
- Must have `export default` function
- Function signature must match Vercel's handler type

### Issue 4: vercel.json Misconfiguration

**Symptom:** API routes redirected to index.html

**Check `vercel.json`:**
```json
{
  "rewrites": [
    {
      "source": "/((?!api).*)",  // ✅ Must exclude /api/*
      "destination": "/index.html"
    }
  ]
}
```

### Issue 5: Missing OpenAI Dependency in Production

**Symptom:** Function crashes when calling OpenAI

**Check:**
```bash
# Verify openai is in dependencies (not devDependencies)
cat package.json | grep -A 5 "dependencies"
```

**Solution:**
```bash
# If in wrong section
npm install --save openai
git add package.json package-lock.json
git commit -m "Fix openai dependency"
git push
```

---

## Quick Diagnostic Script

Run this in your terminal to check everything:

```bash
echo "=== Checking AI Serverless Function Setup ==="
echo ""
echo "1. Checking if api/ai-command.ts exists..."
ls -la api/ai-command.ts && echo "✅ File exists" || echo "❌ File missing"
echo ""
echo "2. Checking if file is tracked in git..."
git ls-files | grep api/ai-command.ts && echo "✅ Tracked in git" || echo "❌ Not in git"
echo ""
echo "3. Checking vercel.json configuration..."
cat vercel.json
echo ""
echo "4. Checking openai dependency..."
grep -A 20 '"dependencies"' package.json | grep openai && echo "✅ OpenAI dependency found" || echo "❌ OpenAI dependency missing"
echo ""
echo "=== Done ==="
```

---

## What to Look For in Browser Console

When you test the AI command, check the console logs:

```javascript
[AI Service] Sending request to: /api/ai-command  // ✅ Correct endpoint
[AI Service] Command: Create a red circle          // ✅ Command sent
[AI Service] Response status: 404                  // ❌ Function not found
```

If you see 404, the function definitely isn't deployed.

---

## Next Steps Based on Results

### If Function Is NOT in Vercel Dashboard:

1. **Ensure file is committed:**
   ```bash
   git add api/
   git commit -m "Add AI serverless function"
   git push
   ```

2. **Wait for deployment** (1-2 minutes)

3. **Check build logs** for errors

### If Function IS in Dashboard but Still 404:

1. **Check vercel.json** - ensure API routes aren't rewritten
2. **Redeploy** - Sometimes Vercel needs a fresh deployment
3. **Check function logs** in Vercel for runtime errors

### If Getting 401/500 Instead of 404:

🎉 **Function is deployed!** Now:
1. Add `OPENAI_API_KEY` environment variable in Vercel
2. Redeploy (or wait for auto-redeploy)
3. Test again

---

## Still Having Issues?

Share the following info:
1. Output of the diagnostic script above
2. Screenshot of Vercel Functions tab
3. Browser console logs when testing AI command
4. Latest deployment URL from Vercel

