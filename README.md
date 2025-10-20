# CollabCanvas

A real-time collaborative canvas application built with React, TypeScript, Firebase, and AI.

## 🚀 Features

- **Real-time Collaboration**: Multiple users can edit the same canvas simultaneously
- **Shape Creation**: Create rectangles, circles, and text shapes
- **AI Canvas Agent** 🤖: Natural language commands to create and manipulate shapes
- **User Presence**: See who's online and their cursor positions
- **Authentication**: Secure user authentication with Firebase
- **Canvas Management**: Create, share, and delete canvases

## 🤖 AI Canvas Agent

The AI Canvas Agent allows you to manipulate the canvas using natural language commands powered by OpenAI GPT-4 Turbo with function calling. Transform your ideas into canvas layouts instantly—no manual tool clicking required.

### ✨ Key Features

- **Natural Language Interface**: Describe what you want, AI creates it
- **15 Distinct Commands**: Creation, manipulation, layout, and query operations
- **Complex Layouts**: Generate multi-element UI components (login forms, nav bars, dashboards)
- **Real-Time Collaboration**: AI-generated shapes appear instantly for all collaborators
- **Smart Defaults**: AI infers sizes, colors, and positions when not specified
- **Command History**: Access your last 10 commands per canvas
- **Expandable Input**: Auto-growing textarea for long, detailed commands

### 🎯 Supported Commands

#### **Creation Commands**
Create shapes with natural language descriptions:
- `"Create a red circle"`
- `"Make a blue rectangle at x=100, y=200"`
- `"Add text that says 'Hello World'"`
- `"Create a 200x300 green rectangle"`

#### **Manipulation Commands**
Modify existing shapes:
- `"Move the red circle to x=150, y=150"`
- `"Resize the rectangle to 300x400"`
- `"Rotate the shape 45 degrees"`
- `"Change the circle's color to blue"`
- `"Delete the red rectangle"`

#### **Layout Commands**
Organize multiple shapes:
- `"Arrange these shapes horizontally with 30px spacing"`
- `"Create a 3x3 grid of squares"`
- `"Distribute the rectangles evenly"`
- `"Arrange shapes vertically"`

#### **Complex Multi-Step Commands**
Generate complete UI layouts:
- `"Create a login form"` → Username label + input, Password label + input, Login button (5 shapes)
- `"Build a navigation bar with 4 menu items"` → Nav container + 4 menu buttons
- `"Make a product card with title, image, and description"` → Card container + 3 elements
- `"Create a dashboard with 3 cards"` → Grid layout with multiple components

### ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl+K` | Toggle AI panel open/close |
| `Enter` | Submit command |
| `Shift+Enter` | New line (for multi-line commands) |
| `ESC` | Close AI panel |

### 🏗️ Architecture

**Secure Serverless Function**:
- OpenAI API key protected on backend (never exposed to browser)
- Vercel serverless function handles all OpenAI communication
- Firebase authentication required for all AI commands
- Rate limiting: 10 requests/minute per user
- Modular organization: auth verification, prompts, schemas, rate limiting

**Frontend Integration**:
- Simple API communication layer (similar to Firebase services)
- AI returns structured function calls, frontend executes them
- AI-created shapes sync via existing Firebase listeners
- Real-time collaboration works seamlessly with AI-generated content

**Performance**:
- Simple commands: <2 seconds response time
- Complex commands: <4 seconds response time
- Firebase batch writes for multi-shape operations (50-100x faster)
- 10-second timeout with clear error messages

### 🚀 Setup

1. **Get OpenAI API Key**: https://platform.openai.com/api-keys

2. **Set Environment Variable**:
   ```bash
   # Local: Create .env file
   OPENAI_API_KEY=sk-...your-api-key...
   
   # Vercel: Add in Dashboard > Settings > Environment Variables
   OPENAI_API_KEY=sk-...your-api-key...
   ```

3. **Deploy** (AI requires serverless function):
   ```bash
   vercel deploy
   ```

**Note**: AI features require deployment to Vercel or similar serverless platform. Local development won't have AI functionality without running `vercel dev`.

### 📖 Usage Examples

**Quick Start:**
1. Open a canvas
2. Press `Cmd/Ctrl+K` to open AI panel (or click sparkle ✨ icon in toolbar)
3. Type your command (e.g., "Create a red circle")
4. Press `Enter`
5. Watch AI create shapes in real-time!

**Example Session:**
```
User: "Create 3 blue rectangles"
AI: ✓ Created 3 shapes

User: "Arrange them horizontally with 50px spacing"
AI: ✓ Arranged 3 shapes

User: "Change the middle one to red"
AI: ✓ Updated 1 shape

User: "Create a login form above them"
AI: ✓ Created 5 shapes (username label, input, password label, input, button)
```

### 🎨 AI Understands Context

The AI agent has access to your current canvas state:
- Existing shapes (type, color, position, size)
- Selected shapes
- Recently created shapes
- Canvas dimensions and viewport

This allows contextual commands like:
- "Move the blue rectangle to the center"
- "Make these shapes bigger"
- "Arrange selected shapes in a grid"

### 📚 Learn More

- **Full Architecture**: [`AI-ARCHITECTURE.md`](./AI-ARCHITECTURE.md)
- **Manual Testing Guide**: [`MANUAL-TESTING-CHECKLIST.md`](./MANUAL-TESTING-CHECKLIST.md)
- **Product Requirements**: [`tasks/prd-ai-canvas-agent.md`](./tasks/prd-ai-canvas-agent.md)

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore, Auth)
- **AI**: OpenAI GPT-4 Turbo (via Vercel serverless function)
- **Deployment**: Vercel
- **Testing**: Vitest, React Testing Library

## 📦 Installation

```bash
npm install
```

## 🔧 Configuration

### Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Firestore and Authentication (Email/Password)
3. Create a `.env` file:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### OpenAI Setup (Optional)

To enable AI features:

```env
OPENAI_API_KEY=sk-...your-openai-api-key...
```

**Note**: No `VITE_` prefix! This keeps the key server-side only.

## 🚀 Development

```bash
npm run dev
```

Open http://localhost:5173

**Note**: AI features require deployment to Vercel (serverless function).

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📝 Project Structure

```
src/
├── components/       # React components
│   ├── auth/        # Authentication components
│   ├── canvas/      # Canvas and shape components
│   ├── ai/          # AI command input
│   ├── dashboard/   # Dashboard components
│   └── common/      # Shared components
├── hooks/           # Custom React hooks
├── services/        # Firebase and AI services
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── context/         # React context providers

api/                 # Vercel serverless functions
├── ai-command.ts    # AI command handler
└── lib/             # Backend utilities
    ├── openai.ts    # OpenAI client
    ├── prompts.ts   # System prompts
    ├── schemas.ts   # Function schemas
    ├── auth.ts      # Auth verification
    └── rateLimit.ts # Rate limiting
```

## 📚 Key Features Breakdown

### Real-time Collaboration
- Uses Firebase Firestore onSnapshot listeners
- Optimistic updates with conflict detection
- Active edit tracking to prevent simultaneous edits

### User Presence
- Real-time cursor tracking
- Online user list
- User colors and names

### Canvas Operations
- Create, read, update, delete shapes
- Shape selection and manipulation
- Z-index controls
- Grid and zoom controls

### AI Integration (NEW!)
- 15 command types: creation, manipulation, layout, query
- Natural language command processing with GPT-4 Turbo
- Secure API key management (serverless function)
- Rate limiting (10 req/min) and authentication
- Real-time sync of AI-generated shapes across all collaborators
- Command history with localStorage persistence
- Expandable input with keyboard shortcuts
- Firebase batch writes for performance

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Set environment variables in Vercel Dashboard:
- All `VITE_*` variables for frontend
- `OPENAI_API_KEY` for serverless function (no VITE_ prefix)

### Other Platforms

Build the static site:
```bash
npm run build
```

Deploy the `dist/` folder to any static hosting service.

**Note**: AI features require a serverless function runtime (Vercel, Netlify, etc.)

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

**Built with ❤️ using React, TypeScript, Firebase, and OpenAI**
