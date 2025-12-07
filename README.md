# Voice Task Tracker

Voice‑enabled task tracker with Kanban/List UI, AI-powered parsing, and user authentication.

This repository is a single Next.js app (full‑stack). There is no separate `/frontend` or `/backend` folder; API routes live under `app/api/*` and Prisma connects to Postgres.

## Repo Structure

```
app/                # Next.js App Router pages + API route handlers
components/         # UI components (shadcn/ui)
hooks/              # Client hooks
lib/                # Prisma client, types, utils, validation, parsing helpers
prisma/             # Prisma schema and migrations
public/             # Static assets
styles/             # Global styles
```

## .env.example

All required environment variables (no secrets) are listed in `.env.example`. Copy to `.env` and/or `.env.local` and fill in values:

```
cp .env.example .env
cp .env.example .env.local
```

---

## 1) Project Setup

### a. Prerequisites

- Node.js 18+
- PostgreSQL database (e.g., Supabase/Postgres)
- Clerk account (for authentication)
- Optional: OpenAI API key (for AI parsing; falls back to local parser if absent)

### b. Install steps

```
npm install
```

### c. How to run everything locally

1. Create and fill env files
   - `.env` (server-side secrets):
     - `DATABASE_URL`
     - `CLERK_SECRET_KEY`
     - Optional: `OPENAI_API_KEY`, `OPENAI_MODEL` (default `gpt-4o-mini`)
   - `.env.local` (client-visible):
     - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

2. Database migrate and generate Prisma client

```
npx prisma migrate dev
npx prisma generate
```

3. Start the app

```
npm run dev
```

4. Open http://localhost:3000

### d. Seed data or initial scripts

- No seed script is bundled. Create tasks via the UI or POST `/api/tasks`.

---

## 2) Tech Stack

- Frontend: Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui
- Backend: Next.js Route Handlers (`app/api/*`)
- DB: PostgreSQL via Prisma
- Auth: Clerk (`@clerk/nextjs`)
- AI provider: OpenAI Chat Completions (optional)
- Utilities: `chrono-node` (date parsing), `zod` (validation), `@dnd-kit` (drag & drop)

---

## 3) API Documentation

Base URL (local): `http://localhost:3000`

- Auth: All task endpoints require a signed-in user (Clerk). The server scopes by `userId`.

### GET /api/tasks

Returns the current user’s tasks (newest first).

Response 200

```json
[
  {
    "id": "...",
    "title": "...",
    "description": "...",
    "due_date": "2025-01-01T10:00:00.000Z",
    "priority": "Medium",
    "status": "todo",
    "transcript": "raw spoken text",
    "stt_provider": "web-speech-api",
    "created_at": "2025-01-01T09:00:00.000Z",
    "updated_at": "2025-01-01T09:00:00.000Z"
  }
]
```

### POST /api/tasks

Create a task for the signed-in user. Server assigns `userId`.

Request body

```json
{
  "title": "Finish report",
  "description": "Add sales numbers",
  "due_date": null,
  "priority": "High",
  "status": "todo",
  "transcript": "Finish the report by Friday",
  "stt_provider": "web-speech-api"
}
```

Response 201

```json
{
  "id": "...",
  "title": "Finish report",
  "description": "Add sales numbers",
  "due_date": null,
  "priority": "High",
  "status": "todo",
  "transcript": "Finish the report by Friday",
  "stt_provider": "web-speech-api",
  "created_at": "...",
  "updated_at": "..."
}
```

### GET /api/tasks/:id

Returns the user’s task with the specified id, or 404 if not found/owned.

### PUT /api/tasks/:id

Updates fields on a task owned by the current user.

Request body (partial allowed)

```json
{
  "title": "Updated title",
  "description": "Updated details",
  "due_date": "2025-01-02T10:00:00.000Z",
  "priority": "Low",
  "status": "in-progress"
}
```

### DELETE /api/tasks/:id

Deletes a task owned by the current user.

### POST /api/parse

Parses natural language into a structured task. Uses OpenAI if `OPENAI_API_KEY` is set; otherwise falls back to the local parser.

Request body

```json
{ "transcript": "Buy milk tomorrow morning, low priority" }
```

Response 200

```json
{
  "parsed": {
    "title": "Buy milk",
    "description": "",
    "due_date": "2025-01-02T08:00:00.000Z",
    "priority": "Low",
    "status": "todo"
  }
}
```

Error responses use JSON with a `message` field and appropriate HTTP status codes (400/401/404/422/500).

---

## 4) Decisions & Assumptions

- Data model: Single `Task` table with `user_id` (nullable during migration), indexed by `user_id`.
- Isolation: Enforced in the application layer using Clerk `userId` in all queries (`where: { userId }`).
- Auth: Clerk middleware protects routes; UI is gated with `SignedIn`/`SignedOut`.
- Parsing: OpenAI Chat Completions preferred; falls back to deterministic parser + `chrono-node` for natural date expressions.
- Voice: Browser Web Speech API; if unsupported (e.g., Firefox), the UI provides a text input fallback.
- Email: Not implemented; documented an approach for future work.
- Lockfile: Use one package manager; commit either `package-lock.json` (npm) or `pnpm-lock.yaml` (pnpm), not both.

---

## 5) AI Tools Usage

- Tools used: Cascade (AI coding assistant) to scaffold auth integration, API scoping, and documentation.
- Helped with: Clerk integration plan, Prisma migration strategy, endpoint hardening, README authoring.
- Approach: Iterative, tool-assisted edits with cautious migrations and type‑safe scoping.
- Outcome: Faster implementation while keeping a clear separation of client/server concerns and security checks.

---

## Running locally (quick start)

```
cp .env.example .env
cp .env.example .env.local
npm install
npx prisma migrate dev
npm run dev
```

If you see `Clerk: auth() was called but Clerk can't detect usage of clerkMiddleware()`:

- Ensure `middleware.ts` exists at the repo root and exports `clerkMiddleware()` with a proper `matcher`.
- Restart `npm run dev` after adding middleware.

---

## Features

- **Voice Input**: Use your microphone to dictate tasks naturally
- **Smart Parsing**: Automatically extracts title, due date, and priority from your speech
- **Kanban Board**: Drag-and-drop task management across To Do, In Progress, and Done columns
- **List View**: Alternative table view for task management
- **Responsive Design**: Works on desktop and mobile devices
- **Accessibility**: Full keyboard navigation and screen reader support


 

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:

\`\`\`bash
cp .env.example .env.local
\`\`\`

4. Run the development server:

\`\`\`bash
npm run dev
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

Create a `.env.local` file with the following variables:

\`\`\`env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001

# Enable mock API for offline development
NEXT_PUBLIC_MOCK_API=true

# Use remote parsing endpoint (optional)
NEXT_PUBLIC_USE_REMOTE_PARSE=false
\`\`\`

## API Contract

The frontend expects the following API endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tasks | Get all tasks |
| POST | /api/tasks | Create a new task |
| GET | /api/tasks/:id | Get a single task |
| PUT | /api/tasks/:id | Update a task |
| DELETE | /api/tasks/:id | Delete a task |
| POST | /api/parse | Parse a transcript (optional) |

### Task Schema

\`\`\`typescript
interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string | null; // ISO 8601
  priority: "Low" | "Medium" | "High" | "Critical";
  status: "todo" | "in-progress" | "done";
  transcript: string;
  stt_provider: string;
  created_at: string;
  updated_at: string;
}
\`\`\`

## Voice Commands

The parser understands natural language. Examples:

- "Remind me to send the project proposal by next Wednesday, high priority"
- "Buy milk tomorrow morning"
- "Create a critical task: fix production bug by Friday 9pm"
- "Set a low priority reminder to water the plants every Monday"

### Parsing Logic

- **Priority Detection**: Keywords like "critical", "urgent", "high", "low"
- **Date Extraction**: Uses chrono-node to parse dates like "tomorrow", "next Wednesday", "Friday 9pm"
- **Title Cleaning**: Removes prefixes like "remind me to", "create task", etc.

## Running Tests

\`\`\`bash
# Run parser unit tests
npm run test

# Run E2E tests (requires Playwright)
npm run e2e
\`\`\`

## Project Structure

\`\`\`
├── app/
│   ├── layout.tsx        # Root layout with metadata
│   ├── page.tsx          # Main page component
│   ├── globals.css       # Global styles
│   └── task/[id]/        # Task detail page
├── components/
│   ├── ui/               # shadcn/ui components
│   ├── header.tsx        # App header with view toggle
│   ├── voice-recorder.tsx # Voice input component
│   ├── parsed-preview-modal.tsx # Task preview/edit modal
│   ├── kanban-board.tsx  # Drag-and-drop board
│   ├── task-card.tsx     # Individual task card
│   ├── task-list.tsx     # Table view of tasks
│   └── filters.tsx       # Search and filter controls
├── hooks/
│   ├── use-speech-recognition.ts # Web Speech API hook
│   └── use-tasks.ts      # Task state management
├── lib/
│   ├── types.ts          # TypeScript interfaces
│   ├── parse.ts          # Transcript parsing logic
│   ├── api.ts            # API client with mock mode
│   └── utils.ts          # Utility functions
└── scripts/
    └── parse.test.ts     # Parser unit tests
\`\`\`

## Browser Support

Voice input requires a browser that supports the Web Speech API:

- Chrome (recommended)
- Edge
- Safari (partial support)

Firefox does not support the Web Speech API. A text fallback is provided for unsupported browsers.

## Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation support
- Focus management in modals
- Color contrast compliance
- Screen reader friendly

## License

MIT
