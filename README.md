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

The AI Canvas Agent allows you to manipulate the canvas using natural language commands powered by OpenAI GPT-4 Turbo.

### Architecture

**Secure Serverless Function**:
- OpenAI API key protected on backend (never exposed to browser)
- Vercel serverless function handles all OpenAI communication
- Firebase authentication required for all AI commands
- Rate limiting: 10 requests/minute per user

**Frontend Integration**:
- Simple API communication layer (similar to Firebase services)
- AI-created shapes sync via existing Firebase listeners
- Real-time collaboration works seamlessly with AI-generated content

### Supported Commands

- **Create shapes**: "Create a red circle", "Make a blue rectangle", "Add text that says Hello"
- **Move shapes**: "Move the circle to x=100, y=100"
- **Query canvas**: "What shapes are on the canvas?" (provides context to AI)

### Setup

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
   git push
   ```

For detailed setup and testing, see [`CHECKPOINT-1-SETUP.md`](./CHECKPOINT-1-SETUP.md).  
For architecture details, see [`AI-ARCHITECTURE.md`](./AI-ARCHITECTURE.md).

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

### AI Integration
- Natural language command processing
- Secure API key management
- Rate limiting and authentication
- Real-time sync of AI-generated shapes

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
