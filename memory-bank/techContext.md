# Technical Context: CollabCanvas Stack

## Technology Stack

### Frontend

#### React 19.1.1
**Why:** Industry-standard UI library with excellent ecosystem
- Fast prototyping with hooks
- Strong TypeScript support
- Large community and resources
- React Testing Library for testing

#### TypeScript 5.9.3
**Why:** Type safety prevents runtime errors, improves DX
- Catch bugs at compile time
- Better IDE autocomplete
- Self-documenting code
- Required for large codebases

#### Vite 7.1.7
**Why:** Lightning-fast dev server and build tool
- Instant HMR (Hot Module Replacement)
- Optimized production builds
- Native ESM support
- Simple configuration

#### Tailwind CSS 4.1.14
**Why:** Utility-first CSS for rapid UI development
- Fast prototyping
- Consistent design system
- Small bundle with purging
- PostCSS integration

#### Konva.js 10.0.2 + React-Konva 19.0.10
**Why:** High-performance HTML5 canvas library
- Built for 60 FPS interactions
- Handles pan/zoom/transformations
- Built-in event system (click, drag, hover)
- Layer caching for performance
- Perfect for collaborative design tools

#### React Router v7.9.4
**Why:** Industry-standard routing for React
- Dynamic routing with URL parameters (`/canvas/:canvasId`)
- Protected routes with redirects
- History API support
- TypeScript support

### Backend & Database

#### Firebase (Google Cloud)
**Why:** Fastest path to real-time functionality
- **Firebase Authentication:** Email/password provider, session management
- **Cloud Firestore:** NoSQL real-time database with WebSocket sync
- **Firebase Hosting:** CDN for static assets (optional, using Vercel instead)
- **Firestore Security Rules:** Built-in access control

**Advantages:**
- No backend server code needed
- Automatic scaling for concurrent users
- Real-time `onSnapshot()` listeners
- Generous free tier for MVP
- Built-in offline support

**Trade-offs:**
- Vendor lock-in (acceptable for MVP)
- Limited query capabilities (not an issue yet)
- Costs scale with usage (optimize later)

### Testing

#### Vitest 3.2.4
**Why:** Fast, Vite-native test runner
- Uses same config as Vite
- Fast execution with ESM
- Compatible with Jest API
- Great TypeScript support

#### React Testing Library 16.3.0
**Why:** User-centric component testing
- Tests behavior, not implementation
- Encourages accessible components
- Works seamlessly with Vitest
- Industry best practice

#### jsdom 27.0.0
**Why:** Headless DOM for testing
- Simulates browser environment
- Lightweight and fast
- No need for Puppeteer/Playwright for unit tests

### Deployment

#### Vercel
**Why:** Zero-config deployment for React apps
- Automatic deployments from GitHub
- Preview URLs for PRs
- Edge network (CDN)
- HTTPS by default
- Free tier sufficient for MVP
- Environment variable management

## Development Setup

### Prerequisites
- Node.js 18+ and npm
- Firebase project (console.firebase.google.com)
- Git for version control
- Modern browser (Chrome/Firefox/Safari)

### Environment Variables
Located in `.env` file (gitignored):
```
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
```

### NPM Scripts
```json
{
  "dev": "vite",                    // Start dev server (localhost:5173)
  "build": "tsc -b && vite build",  // Production build → dist/
  "preview": "vite preview",        // Preview production build locally
  "lint": "eslint .",               // Run ESLint
  "test": "vitest"                  // Run tests with Vitest
}
```

### Development Workflow
1. `npm install` - Install dependencies
2. Configure `.env` with Firebase credentials
3. `npm run dev` - Start dev server
4. `npm run test -- --watch` - Run tests in watch mode
5. Make changes, see instant HMR updates
6. Run tests to verify functionality
7. `npm run build` - Build for production
8. `npm run preview` - Test production build locally
9. Push to GitHub → Auto-deploy to Vercel

## Firebase Configuration

### Firestore Collections

#### 1. `canvases` Collection
**Purpose:** Store canvas metadata
**Document Path:** `/canvases/{canvasId}`
**Fields:**
- `id` (string) - Canvas identifier
- `name` (string) - Canvas title
- `ownerId` (string) - Creator's user ID
- `ownerName` (string) - Creator's display name
- `createdAt` (timestamp) - Creation time
- `updatedAt` (timestamp) - Last modification time

#### 2. `canvas-objects` Collection (Nested)
**Purpose:** Store shapes and objects per canvas
**Document Path:** `/canvas-objects/{canvasId}/objects/{objectId}`
**Fields:**
- `id` (string) - Object identifier
- `type` (string) - 'rectangle', 'circle', 'text'
- `x` (number) - X position
- `y` (number) - Y position
- `width` (number) - Object width
- `height` (number) - Object height
- `fill` (string) - Color (hex/rgba)
- `createdBy` (string) - User ID
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

**Why nested:** Complete isolation between canvases, scales independently

#### 3. `user-canvases` Collection (Nested)
**Purpose:** Track which canvases each user has access to
**Document Path:** `/user-canvases/{userId}/canvases/{canvasId}`
**Fields:**
- `canvasId` (string) - Reference to canvas
- `accessedAt` (timestamp) - When user first accessed
- `role` (string) - 'owner' or 'collaborator'

**Why:** Dashboard queries this for user's canvas list

#### 4. `presence` Collection (Nested)
**Purpose:** Track online users and cursor positions per canvas
**Document Path:** `/presence/{canvasId}/users/{userId}`
**Fields:**
- `userId` (string)
- `displayName` (string)
- `cursorX` (number)
- `cursorY` (number)
- `color` (string) - Assigned cursor color
- `lastSeen` (timestamp)

**Cleanup:** Automatically removed on disconnect via `onDisconnect()`
**Why nested:** Presence is isolated per canvas

#### 5. `users` Collection
**Purpose:** User profile data
**Document Path:** `/users/{userId}`
**Fields:**
- `displayName` (string)
- `email` (string)
- `createdAt` (timestamp)

**Note:** User authentication managed by Firebase Auth, this stores profile data

### Firebase Security Rules (Production)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Authenticated users can read/write any canvas metadata
    match /canvases/{canvasId} {
      allow read, write: if request.auth != null;
    }
    
    // Authenticated users can read/write canvas objects
    match /canvas-objects/{canvasId}/objects/{objectId} {
      allow read, write: if request.auth != null;
    }
    
    // Users can read/write their own canvas access list
    match /user-canvases/{userId}/canvases/{canvasId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Authenticated users can read/write presence on any canvas
    match /presence/{canvasId}/users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Technical Constraints

### Performance Requirements
- **60 FPS** during pan/zoom/drag operations
- **Sub-100ms** latency for object sync
- **Sub-50ms** latency for cursor sync
- **500+ shapes** per canvas without FPS drops
- **5+ concurrent users** per canvas

### Browser Support
- Chrome 90+ (primary)
- Firefox 88+ (tested)
- Safari 14+ (tested)
- Desktop only (mobile out of scope for MVP)

### Firebase Limits (Free Tier)
- 50,000 reads/day
- 20,000 writes/day
- 1 GB storage
- 10 GB/month network egress
- 100 simultaneous connections

**MVP Impact:** Sufficient for development and small-scale testing

### Konva Performance Considerations
- Layer caching for static elements
- Viewport culling for off-screen objects
- `listening={false}` for non-interactive shapes
- `perfectDrawEnabled={false}` for grid dots
- Memoization to prevent unnecessary re-renders

## Dependencies (package.json)

### Production Dependencies
```json
{
  "firebase": "^12.4.0",          // Backend, auth, database
  "konva": "^10.0.2",             // Canvas rendering
  "react": "^19.1.1",             // UI framework
  "react-dom": "^19.1.1",         // React DOM bindings
  "react-konva": "^19.0.10",      // Konva + React integration
  "react-router-dom": "^7.9.4"    // Routing
}
```

### Dev Dependencies
```json
{
  "@tailwindcss/postcss": "^4.1.14",      // Tailwind v4 PostCSS
  "@testing-library/react": "^16.3.0",    // Component testing
  "@testing-library/jest-dom": "^6.9.1",  // DOM matchers
  "@testing-library/user-event": "^14.6.1", // User interactions
  "@vitejs/plugin-react": "^5.0.4",       // Vite React plugin
  "@types/react": "^19.1.16",             // React types
  "@types/react-dom": "^19.1.9",          // React DOM types
  "@types/node": "^24.6.0",               // Node types
  "autoprefixer": "^10.4.21",             // CSS vendor prefixes
  "eslint": "^9.36.0",                    // Linting
  "jsdom": "^27.0.0",                     // Headless DOM for tests
  "postcss": "^8.5.6",                    // CSS processing
  "tailwindcss": "^4.1.14",               // Utility CSS
  "typescript": "~5.9.3",                 // TypeScript compiler
  "vite": "^7.1.7",                       // Build tool
  "vitest": "^3.2.4"                      // Test runner
}
```

## Build & Deployment

### Production Build Process
```bash
npm run build
# 1. TypeScript compilation (tsc -b)
# 2. Vite build (bundle, minify, optimize)
# 3. Output to dist/ directory
```

### Deployment to Vercel
1. Connect GitHub repo to Vercel
2. Configure build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
3. Add environment variables in Vercel dashboard
4. Push to main branch → Auto-deploy
5. Preview deployments for PRs

### Production Checklist
- ✅ Environment variables configured in Vercel
- ✅ Firebase authorized domains updated
- ✅ Firestore security rules deployed
- ✅ Production build tested locally (`npm run preview`)
- ✅ All tests passing (`npm run test`)
- ✅ No console errors in production

## Code Organization

### File Structure Conventions
```
src/
├── components/          # React components (grouped by feature)
│   ├── auth/           # Authentication UI
│   ├── canvas/         # Canvas and shapes
│   ├── dashboard/      # Project management
│   ├── presence/       # Multiplayer features
│   ├── layout/         # App shell, header
│   └── common/         # Reusable UI components
├── hooks/              # Custom React hooks
├── services/           # Firebase and API logic
├── context/            # React Context providers
├── utils/              # Pure utility functions
├── types/              # TypeScript type definitions
└── main.tsx            # Entry point

tests/
├── unit/               # Unit tests (services, utils)
├── integration/        # Integration tests (user flows)
├── mocks/              # Test mocks (Firebase, etc.)
└── setup.ts            # Test configuration
```

### Naming Conventions
- **Components:** PascalCase (`Canvas.tsx`, `Shape.tsx`)
- **Hooks:** camelCase with `use` prefix (`useAuth.ts`, `usePresence.ts`)
- **Services:** camelCase with `.service.ts` suffix (`auth.service.ts`)
- **Utils:** camelCase (`canvasHelpers.ts`, `constants.ts`)
- **Types:** PascalCase for interfaces/types (`User`, `CanvasObject`)
- **Tests:** Match source file name with `.test.ts(x)` suffix

## Key Technical Decisions

### Why Firebase over Custom Backend?
- Fastest path to real-time sync (no WebSocket server code)
- Built-in authentication (no need for JWT, sessions)
- Automatic scaling (no DevOps for MVP)
- Free tier sufficient for development

### Why Konva over SVG/CSS?
- Canvas API is faster for many objects (500+)
- Built-in event system for drag/drop
- Layer caching for performance optimization
- Industry standard for design tools (Figma-like use case)

### Why Last-Write-Wins over Operational Transforms?
- Much simpler to implement
- Sufficient for MVP (users rarely edit same object simultaneously)
- Can upgrade to OT later if needed
- Firebase server timestamps provide ordering

### Why Tailwind over CSS Modules/Styled-Components?
- Faster prototyping with utility classes
- Consistent design system out of the box
- Smaller bundle size with purging
- Less context switching (no separate CSS files)

### Why React Context over Redux/Zustand?
- Built into React (no extra dependency)
- Sufficient for MVP scope (limited state complexity)
- Easy to migrate to Zustand/Redux later if needed
- Simpler learning curve

## Known Technical Limitations

### MVP Acceptable Trade-offs
1. **No undo/redo** - Would require operational transforms or complex state history
2. **Last-write-wins** - Simple conflict resolution, can cause overwrites
3. **No offline mode** - Requires network connection (Firebase has built-in offline support, but not prioritized for MVP)
4. **No optimistic rollback** - Failed writes just log errors (acceptable for MVP)
5. **Basic error handling** - User must refresh to recover from errors
6. **No data compression** - Firebase handles this, but could optimize large canvases
7. **No rate limiting** - Firebase has built-in limits, but not custom-tuned

### Performance Bottlenecks (Future Optimization)
- Firestore write limits (1 write/sec per document) - mitigated by separate documents per object
- Cursor update frequency (60fps = many writes) - throttled to 16.6ms
- Large canvas with 1000+ objects - viewport culling helps, but could add virtualization
- Many concurrent users (10+) on same canvas - not tested yet, may need optimization

## Development Best Practices

### Component Development
- Keep components small and focused
- Use TypeScript for all props
- Memoize expensive computations
- Use `React.memo()` for presentational components
- Clean up subscriptions in `useEffect` cleanup functions

### State Management
- Prefer local state when possible
- Lift state up only when needed
- Use Context for truly global state (auth, canvas data)
- Avoid unnecessary re-renders with proper dependencies

### Testing Guidelines
- Write unit tests for services and utils (pure functions)
- Write integration tests for critical user flows
- Mock Firebase for all tests (no real database calls)
- Test user behavior, not implementation details
- Maintain 80%+ coverage for services/utils

### Firebase Best Practices
- Use server timestamps (`serverTimestamp()`) for ordering
- Unsubscribe from listeners when component unmounts
- Batch writes when creating multiple documents
- Use subcollections for nested data (canvas-objects, presence)
- Handle offline state gracefully (Firebase does this automatically)

