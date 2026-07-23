# 🧠 Dominator Intelligence — AI-Powered Query Resolver

> An **AI-powered enterprise support copilot** with RAG (Retrieval-Augmented Generation) and agentic workflows for IT documentation, ticket management, and internal knowledge retrieval.

![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-black?logo=react&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-3_Flash-4285F4?logo=google&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black)
![Express](https://img.shields.io/badge/Express-4.22-green?logo=express&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)

---

## ✨ Features

### 🤖 Agentic AI (ReAct Pattern)
- **Thought → Action → Observation → Response** reasoning loop powered by Google Gemini
- Three built-in function tools the AI can invoke:
  - **`searchDocuments`** — searches the knowledge base via RAG
  - **`lookupTickets`** — queries Firestore for support tickets by customer or keyword
  - **`summarize`** — condenses complex information into clear summaries
- AI automatically decides when to search, look up tickets, or summarize before responding

### 🔍 RAG Knowledge Retrieval
- Vector embeddings via **Gemini Embedding model** stored in Firestore
- **Cosine similarity** search across SOPs, documentation, wikis, and ticket records
- Source citations displayed with match score percentages under every AI response
- Pre-seeded mock knowledge base (Kafka, Kubernetes, Docker, Python, SOPs, Wiki)

### 🎫 Ticket Management Dashboard
- Full CRUD-style UI — create, search, filter, and track support tickets
- Real-time updates via Firestore `onSnapshot`
- Status tracking: Open → In Progress → Resolved → Closed
- Priority levels: Low, Medium, High, Urgent (with animated color-coded badges)
- Role-based views for **Customers** and **Agents**

### 📧 Email Notifications
- Real email delivery via **Resend API** or mock-mode simulation for development
- Automatic email collection for ticket status updates
- Immutable email history stored in Firestore

### 🔐 Authentication & Roles
- **Google Sign-In** via Firebase Auth
- Dual roles: **Customer** and **Agent** with different permissions
- Simulated login for demo (quick testing without Google OAuth setup)

### 🎨 Premium UI/UX
- **Dark glassmorphism** theme with holographic borders and scanline effects
- **3D perspective transforms** on chat input, AI avatar, and message cards
- Animated AI avatar with rotating 3D core and pulsing rings
- Typewriter effect for AI message rendering
- Procedural audio feedback (tap, chime, thinking hum) via Web Audio API
- Markdown rendering for rich AI responses
- Toast notifications via Sonner

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 6.2, Tailwind CSS v4, Motion (Framer Motion 12), Three.js/R3F/Drei |
| **Backend** | Express 4.22, tsx runtime |
| **AI / LLM** | Google Gemini (`gemini-3-flash-preview`), Gemini Embedding (`gemini-embedding-2-preview`) |
| **Database** | Firebase Firestore (documents, tickets, emails, vector embeddings) |
| **Auth** | Firebase Auth (Google Sign-In + simulated login) |
| **Email** | Resend API (with mock mode fallback) |
| **Language** | TypeScript 5.8 (full-stack) |
| **Styling** | Tailwind CSS v4 + custom glassmorphism/3D CSS |
| **Audio** | Web Audio API (procedural UI sounds) |

---

## 📁 Project Structure

```
Query_Resolver/
├── server.ts                   # Express server + Vite middleware (API + dev server)
├── index.html                  # SPA entry point
├── package.json                # Dependencies & scripts
├── vite.config.ts              # Vite config (React + Tailwind + env vars)
├── tsconfig.json               # TypeScript config
├── firebase-applet-config.json # Firebase SDK configuration
├── firebase-blueprint.json     # Firestore data model schema
├── firestore.rules             # Firestore security rules
├── metadata.json               # App metadata
│
└── src/
    ├── main.tsx                # React bootstrap (createRoot → App)
    ├── App.tsx                 # Main orchestrator (chat + tickets + auth + views)
    ├── types.ts                # TypeScript type definitions
    ├── index.css               # Global styles (Tailwind + glassmorphism/3D effects)
    ├── firebase.ts             # Firebase initialization
    │
    ├── lib/
    │   └── utils.ts            # cn() utility (clsx + tailwind-merge)
    │
    ├── services/
    │   ├── gemini.ts           # Gemini AI service (system prompt, ReAct loop, tool calling)
    │   ├── rag.ts              # RAG service (embeddings, cosine similarity, mock seeding)
    │   └── audio.ts            # Web Audio API procedural sounds
    │
    └── components/
        ├── ChatMessage.tsx      # Chat messages (typewriter, markdown, source citations)
        ├── ChatInput.tsx        # Chat input with 3D transform animations
        ├── ThinkingIndicator.tsx # "Reasoning..." spinner with stop button
        ├── AIAvatar.tsx         # Animated 3D AI avatar (rotating core, pulsing rings)
        ├── LoginModal.tsx       # Login modal (Google Auth + simulated login)
        ├── EmailCollector.tsx   # Email collection for ticket updates
        └── TicketDashboard.tsx  # Full ticket management dashboard
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (or Bun runtime)
- **Gemini API Key** — [Get one from Google AI Studio](https://aistudio.google.com/apikey)
- **Firebase project** — with Firestore and Auth enabled

### 1. Clone the Repository

```bash
git clone https://github.com/Dharineesh-17/Query_Resolver.git
cd Query_Resolver
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Required — Gemini AI & Embeddings
GEMINI_API_KEY=your_gemini_api_key

# Optional — Real email sending via Resend
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=onboarding@resend.dev

# Optional — Use mock email mode (no Resend key needed)
MOCK_EMAIL=true

# Optional — App configuration
APP_URL=http://localhost:3000
NODE_ENV=development
```

> 💡 **Tip:** Start with `MOCK_EMAIL=true` to skip Resend setup and use simulated emails.

### 4. Run the Development Server

```bash
npm run dev
```

The app launches at **http://localhost:3000** — Express serves both the API and Vite HMR middleware.

### 5. Login

- **Agent mode:** Use `admin` / `admin` (simulated) or sign in with Google
- **Customer mode:** Use any credentials (simulated) or sign in with Google

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (Express + Vite HMR) on port 3000 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run clean` | Remove build artifacts (`dist/`) |
| `npm run lint` | TypeScript type checking (`tsc --noEmit`) |

---

## 🔌 API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/config-status` | `GET` | Returns email service configuration status |
| `/api/send-email` | `POST` | Sends email via Resend (or mock). Body: `{ to, subject, html }` |

All other routes serve the React SPA for client-side routing.

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    React 19 SPA                     │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Chat UI  │  │ Ticket Dash  │  │  Auth Modal   │  │
│  └──────────┘  └──────────────┘  └───────────────┘  │
│         │             │                  │          │
│  ┌──────┴─────────────┴──────────────────┴───────┐  │
│  │              App.tsx (Orchestrator)           │ │
│  └────────────────────────┬──────────────────────┘  │
└───────────────────────────┼──────────────────────────
                            │
              ┌─────────────┼─────────────┐
              │             │             │
        ┌─────┴─────┐ ┌───┴───┐ ┌──────┴──────┐
        │ Gemini AI │ │  RAG  │ │  Firestore  │
        │ (ReAct)   │ │Service│ │  (Database) │
        └───────────┘ └───────┘ └─────────────┘
              │             │
        ┌─────┴─────┐ ┌───┴──────────┐
        │ 3 Tools:  │ │ Embeddings   │
        │ searchDoc │ │ + Similarity │
        │ lookupTkt │ │   Search     │
        │ summarize │ └──────────────┘
        └───────────┘
```

### How the AI Works

1. **User sends a query** → App.tsx dispatches to Gemini service
2. **Gemini reasons** (Thought) → decides which tool(s) to call (Action)
3. **Tool executes** → RAG search / ticket lookup / summarization (Observation)
4. **Gemini synthesizes** → generates final response with reasoning, intent, and citations
5. **If `ticketRaised` flag** → App auto-creates a Firestore ticket + sends email notification

---

## ⚙️ Firestore Data Model

### Ticket

| Field | Type | Description |
|---|---|---|
| `id` | string | Auto-generated ticket ID |
| `customerId` | string | Customer identifier |
| `email` | string | Customer email |
| `subject` | string | Ticket subject/title |
| `status` | enum | `Open` / `In Progress` / `Resolved` / `Closed` |
| `priority` | enum | `Low` / `Medium` / `High` / `Urgent` |
| `createdAt` | timestamp | Creation date |
| `lastUpdate` | timestamp | Last modification date |

### Knowledge Document

| Field | Type | Description |
|---|---|---|
| `title` | string | Document title |
| `content` | string | Full text content |
| `category` | enum | `SOP` / `Documentation` / `Ticket` / `Wiki` |
| `embedding` | array | Gemini embedding vector for RAG search |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is available under the [MIT License](LICENSE).

---

## 🙏 Acknowledgements

- [Google Gemini](https://ai.google.dev/) — AI & embedding models
- [Firebase](https://firebase.google.com/) — Database, auth, and real-time sync
- [Resend](https://resend.com/) — Email delivery API
- [React](https://react.dev/) — UI framework
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS
- [Motion](https://motion.dev/) — Animation library
- [Lucide](https://lucide.dev/) — Icon library

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/Dharineesh-17">Dharineesh</a>
</p>05:33 PM 22-07-2026
