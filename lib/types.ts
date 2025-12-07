// Task and parsing types for the Voice Task Tracker

export type Priority = "Low" | "Medium" | "High" | "Critical"
export type TaskStatus = "todo" | "in-progress" | "done"

export interface Task {
  id: string
  title: string
  description: string
  due_date: string | null // ISO string
  priority: Priority
  status: TaskStatus
  transcript: string
  stt_provider: string
  created_at: string
  updated_at: string
}

export interface ParsedTask {
  title: string
  description: string
  due_date: string | null // ISO string
  priority: Priority
  status: TaskStatus
}

export interface CreateTaskPayload {
  title: string
  description: string
  due_date: string | null
  priority: Priority
  status: TaskStatus
  transcript: string
  stt_provider: string
}

export interface UpdateTaskPayload {
  title?: string
  description?: string
  due_date?: string | null
  priority?: Priority
  status?: TaskStatus
}

export interface ParseResponse {
  parsed: ParsedTask
}

// Column configuration for Kanban board
export interface KanbanColumn {
  id: TaskStatus
  title: string
  tasks: Task[]
}
