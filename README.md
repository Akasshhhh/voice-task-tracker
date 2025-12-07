# Voice Task Tracker

A voice-enabled task tracker that lets you speak your tasks into existence. Built with Next.js, TypeScript, and the Web Speech API.

## Features

- **Voice Input**: Use your microphone to dictate tasks naturally
- **Smart Parsing**: Automatically extracts title, due date, and priority from your speech
- **Kanban Board**: Drag-and-drop task management across To Do, In Progress, and Done columns
- **List View**: Alternative table view for task management
- **Responsive Design**: Works on desktop and mobile devices
- **Accessibility**: Full keyboard navigation and screen reader support
- **Offline Support**: Mock API mode for development without a backend

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Speech Recognition**: Web Speech API
- **Date Parsing**: chrono-node
- **Drag & Drop**: @dnd-kit
- **State Management**: React hooks with optimistic updates
- **UI Components**: shadcn/ui

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
