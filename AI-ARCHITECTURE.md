# AI Canvas Agent Architecture

## Overview

The AI Canvas Agent uses a **secure serverless function** architecture where the OpenAI API key is protected on the backend. The frontend communicates with a Vercel Function that handles all OpenAI interactions.

## Architecture Diagram

```
┌─────────────────────────────────────────────┐
│ Frontend (React)                            │
│  ├─ AICommandInput component                │
│  ├─ useAIAgent hook                         │
│  ├─ ai.service.ts (calls API endpoint)      │
│  └─ aiCommands.ts (executes functions)      │
└──────────────────┬──────────────────────────┘
                   │
                   ↓ HTTPS POST + Firebase Auth Token
┌─────────────────────────────────────────────┐
│ Vercel Serverless Function                  │
│  /api/ai-command.ts                         │
│  ├─ lib/auth.ts - Verify Firebase token     │
│  ├─ lib/rateLimit.ts - Rate limiting        │
│  ├─ lib/openai.ts - OpenAI client           │
│  ├─ lib/prompts.ts - System prompts         │
│  └─ lib/schemas.ts - Function schemas       │
└──────────────────┬──────────────────────────┘
                   │
                   ↓ HTTPS (API key secure here)
┌─────────────────────────────────────────────┐
│ OpenAI API                                  │
│  ├─ GPT-5 Nano model                        │
│  ├─ Modern Tools API                        │
│  └─ Returns structured tool calls           │
└──────────────────┬──────────────────────────┘
                   │
                   ↓ Response
┌─────────────────────────────────────────────┐
│ Frontend Executes Functions                 │
│  ├─ Parse function calls from AI            │
│  ├─ Execute via canvasObjects.service       │
│  └─ Shapes sync via Firebase listeners      │
└─────────────────────────────────────────────┘
```

## Key Design Decisions

### ✅ Serverless Function with Modular Structure

**Why:** Secure and maintainable
- API key protected on backend (`OPENAI_API_KEY` - server-only)
- Well-organized into modules (auth, rate limiting, prompts, schemas)
- Rate limiting enforced server-side
- Authentication verified before processing

### ✅ Modern Tools API

**Why:** Latest OpenAI API (not deprecated functions API)
- Uses `tools` parameter with `tool_choice: 'auto'`
- Supports multiple tool calls in single response
- Better structured and more reliable than old `functions` API

### ✅ Client-Side Function Execution

**Why:** Canvas operations need direct access to Firebase
- AI returns tool calls (e.g., `createShape`)
- Frontend executes using existing `canvasObjects.service.ts`
- Real-time sync happens automatically via Firebase listeners
- No duplicate logic between frontend and backend

### ✅ No Rate Limiting (MVP)

**Why:** Simplicity for MVP, can add later if needed
- OpenAI has its own rate limits
- Can implement client-side throttling if needed
- Production could add Firebase Functions for rate limiting

## Files Structure

```
api/                              # Vercel Serverless Functions
├── ai-command.ts                 # Main API endpoint
└── lib/                          # Organized modules
    ├── openai.ts                 # OpenAI client setup
    ├── prompts.ts                # System prompts
    ├── schemas.ts                # Function schemas
    ├── auth.ts                   # Auth verification
    └── rateLimit.ts              # Rate limiting

src/                              # Frontend
├── services/
│   ├── ai.service.ts             # API communication
│   └── aiCommands.ts             # Execute function calls
├── hooks/
│   └── useAIAgent.ts             # React hook for AI state
├── components/
│   └── ai/
│       └── AICommandInput.tsx    # UI component
└── types/
    └── ai.ts                     # TypeScript types
```

## Environment Variables

### Local Development (`.env`)
```env
OPENAI_API_KEY=sk-...
```

### Production (Vercel)
```
OPENAI_API_KEY=sk-...
```

**Note:** NO `VITE_` prefix - this keeps the key server-side only (secure)!

## Security Features

### ✅ API Key Protection

**Secure:** API key never exposed to browser
- Stored only in Vercel environment variables
- Accessed only by serverless function
- Cannot be extracted from frontend code

### ✅ Authentication

- Firebase Auth token verified on every request
- Unauthorized requests rejected with 401

### ✅ Rate Limiting

- 10 requests per minute per user
- Prevents abuse and cost overruns
- Returns 429 status when exceeded

### ✅ Input Validation

- Command, canvasId, userId validated
- Malformed requests rejected with 400

### Production Enhancements (Future)

1. **Firebase Admin SDK** - Verify auth tokens properly
2. **Redis** - Distributed rate limiting
3. **Usage tracking** - Per-user cost monitoring
4. **Request logging** - Audit trail for debugging

## Comparison with Firebase

| Aspect | Firebase | OpenAI |
|--------|----------|--------|
| **Connection** | Direct from frontend | Direct from frontend |
| **SDK** | Firebase SDK | OpenAI SDK |
| **Auth** | Firebase Auth | VITE_OPENAI_API_KEY |
| **Real-time** | onSnapshot listeners | N/A (stateless) |
| **Data Flow** | Bidirectional | Request/Response |

Both follow the same pattern: direct service communication from the frontend.

## Advantages of This Architecture

1. **Security** - API key protected on backend
2. **Modular** - Clean separation of concerns
3. **Maintainable** - Easy to add new functions or prompts
4. **Scalable** - Can add Redis, monitoring, etc.
5. **Cost Control** - Rate limiting prevents abuse

## Module Benefits

### `/api/lib/prompts.ts`
- **Single source of truth** for AI instructions
- Easy to update prompt without touching main handler
- Can version prompts for A/B testing

### `/api/lib/schemas.ts`
- **Centralized function definitions**
- Easy to add new canvas operations
- Type-safe schema management

### `/api/lib/auth.ts`
- **Isolated authentication logic**
- Easy to upgrade to Firebase Admin SDK
- Can swap auth providers

### `/api/lib/rateLimit.ts`
- **Configurable rate limiting**
- Easy to swap to Redis
- Can add per-tier limits

### `/api/lib/openai.ts`
- **Configuration management**
- Easy to switch models or adjust settings
- Can add retry logic or fallbacks

---

**Current Status:** Secure serverless architecture with modular organization ✅

