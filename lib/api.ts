import type { Task, CreateTaskPayload, UpdateTaskPayload, ParseResponse } from "./types"
import { parseTranscript } from "./parse"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""
const USE_REMOTE_PARSE = process.env.NEXT_PUBLIC_USE_REMOTE_PARSE === "true"

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  // Handle 204 No Content and non-JSON responses gracefully
  if (response.status === 204) {
    return undefined as unknown as T
  }
  const contentType = response.headers.get("content-type") || ""
  if (!contentType.includes("application/json")) {
    return undefined as unknown as T
  }

  return (await response.json()) as T
}

// API Functions

export async function getTasks(): Promise<Task[]> {
  return apiFetch<Task[]>("/api/tasks")
}

export async function getTask(id: string): Promise<Task> {
  return apiFetch<Task>(`/api/tasks/${id}`)
}

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  return apiFetch<Task>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateTask(id: string, payload: UpdateTaskPayload): Promise<Task> {
  return apiFetch<Task>(`/api/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function deleteTask(id: string): Promise<void> {
  await apiFetch(`/api/tasks/${id}`, { method: "DELETE" })
}

export async function parseTranscriptRemote(transcript: string): Promise<ParseResponse> {
  if (!USE_REMOTE_PARSE) {
    return { parsed: parseTranscript(transcript) }
  }

  // Minutes offset from UTC, positive for timezones ahead of UTC (e.g. IST = 330)
  const timezoneOffset = -new Date().getTimezoneOffset()

  return apiFetch<ParseResponse>("/api/parse", {
    method: "POST",
    body: JSON.stringify({ transcript, timezoneOffset }),
  })
}
