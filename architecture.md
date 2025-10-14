graph TB
    subgraph "Client - Browser"
        subgraph "React App (Vite)"
            UI[User Interface Layer]
            
            subgraph "Components"
                Auth[Auth Components<br/>LoginForm, RegisterForm]
                Canvas[Canvas Component<br/>Konva Stage & Layer]
                Shapes[Shape Components<br/>Rectangle, Circle, Text]
                Toolbar[Canvas Toolbar]
                Cursors[Cursor Components]
                Presence[Presence UI<br/>OnlineUsers]
            end
            
            subgraph "State Management"
                AuthCtx[Auth Context]
                CanvasCtx[Canvas Context]
            end
            
            subgraph "Custom Hooks"
                useAuth[useAuth Hook]
                useCanvas[useCanvas Hook]
                useSync[useRealtimeSync Hook]
                usePresence[usePresence Hook]
            end
            
            subgraph "Services Layer"
                AuthSvc[Auth Service]
                CanvasSvc[Canvas Service]
                PresenceSvc[Presence Service]
                FirebaseInit[Firebase Config]
            end
            
            subgraph "Utilities"
                Helpers[Canvas Helpers<br/>zoom, coordinates, ID gen]
                Constants[Constants<br/>canvas dimensions, limits]
            end
        end
        
        subgraph "Rendering Engine"
            Konva[Konva.js<br/>HTML5 Canvas]
        end
    end
    
    subgraph "Firebase Backend (Google Cloud)"
        subgraph "Firebase Authentication"
            AuthAPI[Auth API<br/>Email/Password]
            UserStore[User Store]
        end
        
        subgraph "Cloud Firestore"
            CanvasDB[(canvases collection<br/>shapes array, metadata)]
            PresenceDB[(presence collection<br/>users, cursors, status)]
        end
        
        subgraph "Firebase SDK"
            RealtimeSync[Real-time Sync Engine<br/>WebSocket Connections]
        end
    end
    
    subgraph "Deployment & Hosting"
        Vercel[Vercel CDN<br/>Static Assets & SPA]
        GitHub[GitHub Repository<br/>Source Control]
    end
    
    subgraph "Testing Infrastructure"
        Vitest[Vitest Test Runner]
        RTL[React Testing Library]
        Mocks[Firebase Mocks]
    end

    %% User Interactions
    UI --> Auth
    UI --> Canvas
    UI --> Toolbar
    UI --> Presence
    
    %% Component to Context
    Auth --> AuthCtx
    Canvas --> CanvasCtx
    Shapes --> CanvasCtx
    Cursors --> CanvasCtx
    
    %% Context to Hooks
    AuthCtx --> useAuth
    CanvasCtx --> useCanvas
    CanvasCtx --> useSync
    CanvasCtx --> usePresence
    
    %% Hooks to Services
    useAuth --> AuthSvc
    useCanvas --> CanvasSvc
    useSync --> CanvasSvc
    usePresence --> PresenceSvc
    
    %% Services to Firebase
    AuthSvc --> FirebaseInit
    CanvasSvc --> FirebaseInit
    PresenceSvc --> FirebaseInit
    FirebaseInit --> AuthAPI
    FirebaseInit --> RealtimeSync
    
    %% Firebase Connections
    AuthAPI --> UserStore
    RealtimeSync --> CanvasDB
    RealtimeSync --> PresenceDB
    
    %% Rendering
    Canvas --> Konva
    Shapes --> Konva
    Cursors --> Konva
    
    %% Utilities
    useCanvas --> Helpers
    Canvas --> Helpers
    Helpers --> Constants
    
    %% Real-time Data Flow (Bidirectional)
    CanvasDB -.->|onSnapshot listener| RealtimeSync
    RealtimeSync -.->|shape updates| useSync
    useSync -.->|local state update| CanvasCtx
    
    PresenceDB -.->|onSnapshot listener| RealtimeSync
    RealtimeSync -.->|cursor updates| usePresence
    usePresence -.->|render cursors| Cursors
    
    %% Deployment Flow
    GitHub -->|push to main| Vercel
    Vercel -->|serves| UI
    
    %% Testing Flow
    Vitest -.-> AuthSvc
    Vitest -.-> CanvasSvc
    Vitest -.-> Helpers
    RTL -.-> Auth
    RTL -.-> Canvas
    Mocks -.-> FirebaseInit
    
    %% Styling
    classDef firebase fill:#FFA611,stroke:#333,stroke-width:2px,color:#000
    classDef react fill:#61DAFB,stroke:#333,stroke-width:2px,color:#000
    classDef deploy fill:#000000,stroke:#333,stroke-width:2px,color:#fff
    classDef test fill:#729B1B,stroke:#333,stroke-width:2px,color:#fff
    
    class AuthAPI,UserStore,CanvasDB,PresenceDB,RealtimeSync,FirebaseInit firebase
    class UI,Auth,Canvas,Shapes,Toolbar,Cursors,Presence,AuthCtx,CanvasCtx,useAuth,useCanvas,useSync,usePresence react
    class Vercel,GitHub deploy
    class Vitest,RTL,Mocks test
    