# CollabCanvas MVP

A real-time collaborative canvas application (Figma-like) where multiple users can simultaneously create, move, and manipulate shapes while seeing each other's cursors and changes in real-time.

## Features

- 🔐 **Authentication** - User registration and login with Firebase Auth
- 📊 **Dashboard** - Create and manage multiple canvases
- 🎨 **Canvas Editor** - Real-time collaborative drawing workspace
- 🖱️ **Multiplayer Cursors** - See other users' cursors with names
- ⚡ **Real-time Sync** - Changes sync instantly across all users
- 🔗 **Shareable Links** - Share canvases via URL
- 🎯 **Isolated Workspaces** - Each canvas operates independently
- 🚀 **High Performance** - 60 FPS with 500+ shapes, optimized grid rendering

## Tech Stack

- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS
- **Canvas:** Konva.js, React-Konva
- **Backend:** Firebase (Firestore, Authentication)
- **Routing:** React Router v7
- **Testing:** Vitest, React Testing Library

## Project Structure

```
collab-canvas/
├── src/
│   ├── components/
│   │   ├── auth/          # Login, Register components
│   │   ├── dashboard/     # Dashboard, Canvas cards
│   │   ├── canvas/        # Canvas, Shapes, Toolbar
│   │   ├── presence/      # Multiplayer cursors, Online users
│   │   └── layout/        # Header, Layout components
│   ├── hooks/             # Custom React hooks
│   ├── services/          # Firebase, API services
│   ├── context/           # React Context providers
│   ├── utils/             # Helper functions
│   └── main.tsx           # Application entry point
├── tests/
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── mocks/             # Test mocks
└── public/                # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Firebase project (https://console.firebase.google.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd collab-canvas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project (or use existing one)
   - Enable **Authentication** (Email/Password provider)
   - Create a **Firestore Database** (Start in test mode for development)
   - Go to Project Settings > General > Your apps > Web app
   - Copy the Firebase configuration

4. **Configure environment variables**
   - Create a `.env` file in the root directory
     ```bash
     touch .env
     ```
   - Fill in your Firebase configuration values in `.env`:
     ```
     VITE_FIREBASE_API_KEY=your_api_key
     VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
     VITE_FIREBASE_PROJECT_ID=your_project_id
     VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     VITE_FIREBASE_APP_ID=your_app_id
     ```
   - **Note:** The `.env` file is gitignored to keep your credentials secure

5. **Start the development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:5173](http://localhost:5173) in your browser.

## Available Scripts

- `npm run dev` - Start development server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run test` - Run tests with Vitest
- `npm run test -- --watch` - Run tests in watch mode

## Testing

Run the test suite:
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run specific test file
npm run test tests/unit/canvasHelpers.test.js

# Run tests with coverage
npm run test -- --coverage
```

## Performance Optimizations

CollabCanvas is designed for high performance, targeting **60 FPS** even with 500+ shapes on the canvas.

### Optimized Grid Rendering

The background grid uses a **single canvas draw call** instead of thousands of React components:

| Approach | Components | Performance |
|----------|-----------|-------------|
| Old (Individual Circles) | ~5,000 | 🔴 15-30 FPS |
| **New (Single Shape)** | **1** | **🟢 60 FPS** |

**Key Features:**
- Single `Shape` component with custom `sceneFunc`
- Viewport culling - only draws visible dots
- Zoom-based fading (Figma-like behavior)
- Memoized rendering to prevent unnecessary updates

### Viewport Virtualization

Only shapes visible in the current viewport are rendered, dramatically improving performance with large canvases.

### Other Optimizations

- **Optimistic updates** - Changes appear instantly, sync in background
- **Shape memoization** - Prevents unnecessary re-renders
- **Stable real-time sync** - Prevents unnecessary Firebase re-subscriptions

For technical details, see [docs/GRID_OPTIMIZATION.md](./docs/GRID_OPTIMIZATION.md).

## Architecture

### Multi-Canvas System
- Users can create unlimited canvases
- Each canvas has a unique ID and shareable URL (`/canvas/:canvasId`)
- Real-time sync and presence are isolated per canvas

### Firebase Collections

#### 1. `canvases` Collection
Stores metadata for each canvas.

**Document Path:** `/canvases/{canvasId}`

**Fields:**
- `id` (string) - Unique canvas identifier (same as document ID)
- `name` (string) - Canvas title/name
- `ownerId` (string) - User ID of canvas creator
- `ownerName` (string) - Display name of owner
- `createdAt` (timestamp) - Canvas creation time
- `updatedAt` (timestamp) - Last modification time

**Usage:** Displayed in dashboard, used for canvas metadata loading

---

#### 2. `canvas-objects` Collection (Nested Structure)
Stores all shapes and objects for each canvas. Uses a nested subcollection structure to isolate objects per canvas.

**Document Path:** `/canvas-objects/{canvasId}/objects/{objectId}`

**Fields:**
- `id` (string) - Unique object identifier (same as document ID)
- `type` (string) - Shape type: `'rectangle'`, `'circle'`, `'text'`
- `x` (number) - X coordinate position on canvas
- `y` (number) - Y coordinate position on canvas
- `width` (number) - Object width in pixels
- `height` (number) - Object height in pixels
- `fill` (string) - Fill color (hex or rgba string)
- `createdBy` (string) - User ID who created the object
- `createdAt` (timestamp) - Object creation time
- `updatedAt` (timestamp) - Last update time (for position changes, etc.)

**Structure Notes:**
- Objects are scoped per `canvasId` for complete isolation
- Each canvas has its own `objects` subcollection
- Changes to canvas A never affect canvas B
- Firestore automatically creates collections on first write

**Example Document:**
```javascript
// Path: /canvas-objects/abc123/objects/obj-xyz789
{
  id: "obj-xyz789",
  type: "rectangle",
  x: 150,
  y: 200,
  width: 100,
  height: 80,
  fill: "#3B82F6",
  createdBy: "user-123",
  createdAt: Timestamp(2025, 10, 14, 10, 30, 0),
  updatedAt: Timestamp(2025, 10, 14, 10, 35, 0)
}
```

**Querying:**
```javascript
// Get all objects for a specific canvas
const objectsRef = collection(db, 'canvas-objects', canvasId, 'objects');
const objectsSnapshot = await getDocs(objectsRef);

// Real-time listener for canvas objects
onSnapshot(objectsRef, (snapshot) => {
  const objects = snapshot.docs.map(doc => doc.data());
  // Update local state with synced objects
});
```

---

#### 3. `user-canvases` Collection (Nested Structure)
Tracks which canvases each user has accessed for dashboard display.

**Document Path:** `/user-canvases/{userId}/canvases/{canvasId}`

**Fields:**
- `canvasId` (string) - Reference to canvas document
- `accessedAt` (timestamp) - When user first accessed
- `role` (string) - `'owner'` or `'collaborator'`

**Usage:** Dashboard queries this to show all canvases a user can access

---

#### 4. `presence` Collection (Nested Structure)
Stores currently active users and their cursor positions per canvas.

**Document Path:** `/presence/{canvasId}/users/{userId}`

**Fields:**
- `userId` (string) - User ID
- `displayName` (string) - User's display name
- `cursorX` (number) - Cursor X position
- `cursorY` (number) - Cursor Y position
- `color` (string) - Assigned cursor color
- `lastSeen` (timestamp) - Last activity timestamp

**Cleanup:** Automatically removed on disconnect using Firebase `onDisconnect()`

**Isolation:** Each canvas has its own presence subcollection

### Real-Time Sync
- Uses Firestore real-time listeners
- Last-write-wins conflict resolution
- Sub-100ms latency for object updates
- Sub-50ms latency for cursor updates

## Development Roadmap

See [tasks.md](./tasks.md) for the detailed development plan broken down into PRs.

### Current Status: PR #1 ✅
- [x] Project setup and dependencies
- [x] Testing configuration
- [x] Tailwind CSS setup
- [x] Firebase configuration
- [x] Folder structure

### Next Steps
- [ ] PR #2: Authentication System
- [ ] PR #3: Dashboard & Canvas Management
- [ ] PR #4: Canvas Core (Pan/Zoom)
- [ ] PR #5: Shape Creation & Manipulation
- [ ] PR #6: Real-time Sync
- [ ] PR #7: Multiplayer Presence
- [ ] PR #8: State Persistence
- [ ] PR #9: Performance Optimization
- [ ] PR #10: Deployment
- [ ] PR #11: Final Testing

## Contributing

This is an MVP project. For contributing guidelines, see [PRD.md](./PRD.md) for product requirements.

## License

MIT
