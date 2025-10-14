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
   - Copy `.env.example` to `.env.local`
     ```bash
     cp .env.example .env.local
     ```
   - Fill in your Firebase configuration values in `.env.local`:
     ```
     VITE_FIREBASE_API_KEY=your_api_key
     VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
     VITE_FIREBASE_PROJECT_ID=your_project_id
     VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     VITE_FIREBASE_APP_ID=your_app_id
     ```

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

## Architecture

### Multi-Canvas System
- Users can create unlimited canvases
- Each canvas has a unique ID and shareable URL (`/canvas/:canvasId`)
- Real-time sync and presence are isolated per canvas

### Firebase Collections
- `canvases` - Canvas metadata (name, owner, timestamps)
- `canvas-objects/{canvasId}/objects` - Canvas objects per canvas
- `user-canvases/{userId}/canvases` - User's accessible canvases
- `presence/{canvasId}/users` - Per-canvas user presence

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
