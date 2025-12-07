"use client"

import { useState, useMemo, useCallback } from "react"
import { Header } from "@/components/header"
import { VoiceRecorder } from "@/components/voice-recorder"
import { ParsedPreviewModal } from "@/components/parsed-preview-modal"
import { EditTaskModal } from "@/components/edit-task-modal"
import { KanbanBoard } from "@/components/kanban-board"
import { TaskList } from "@/components/task-list"
import { Filters } from "@/components/filters"
import { Toaster } from "@/components/ui/toaster"
import { parseTranscriptRemote } from "@/lib/api"
import { useTasks } from "@/hooks/use-tasks"
import type { ParsedTask, Task, Priority, TaskStatus, UpdateTaskPayload } from "@/lib/types"

export default function Home() {
  const { tasks, isLoading, createTask, updateTask, deleteTask, updateTaskStatus } = useTasks()

  // View mode state
  const [viewMode, setViewMode] = useState<"board" | "list">("board")

  // Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all")
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all")

  // Modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState("")
  const [currentParsedTask, setCurrentParsedTask] = useState<ParsedTask | null>(null)

  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  // Handle transcript completion from voice recorder
  const handleTranscriptComplete = useCallback(async (transcript: string) => {
    const { parsed } = await parseTranscriptRemote(transcript)
    setCurrentTranscript(transcript)
    setCurrentParsedTask(parsed)
    setShowPreviewModal(true)
  }, [])

  // Handle saving a new task from the preview modal
  const handleSaveNewTask = useCallback(
    async (parsedTask: ParsedTask, transcript: string) => {
      await createTask({
        ...parsedTask,
        transcript,
        stt_provider: "Web Speech API",
      })
    },
    [createTask],
  )

  // Handle editing an existing task
  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task)
    setShowEditModal(true)
  }, [])

  // Handle saving edits to a task
  const handleSaveEditedTask = useCallback(
    async (id: string, payload: UpdateTaskPayload) => {
      await updateTask(id, payload)
    },
    [updateTask],
  )

  // Handle status change from Kanban drag & drop
  const handleStatusChange = useCallback(
    async (taskId: string, newStatus: TaskStatus) => {
      await updateTaskStatus(taskId, newStatus)
    },
    [updateTaskStatus],
  )

  // Handle task deletion
  const handleDeleteTask = useCallback(
    async (id: string) => {
      await deleteTask(id)
    },
    [deleteTask],
  )

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearchQuery("")
    setPriorityFilter("all")
    setStatusFilter("all")
  }, [])

  // Filter tasks based on current filters
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesSearch =
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query) ||
          task.transcript.toLowerCase().includes(query)
        if (!matchesSearch) return false
      }

      // Priority filter
      if (priorityFilter !== "all" && task.priority !== priorityFilter) {
        return false
      }

      // Status filter
      if (statusFilter !== "all" && task.status !== statusFilter) {
        return false
      }

      return true
    })
  }, [tasks, searchQuery, priorityFilter, statusFilter])

  return (
    <div className="min-h-screen bg-background">
      <Header viewMode={viewMode} onViewModeChange={setViewMode} />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Voice Recorder Section */}
        <section className="p-6 bg-card rounded-xl border shadow-sm" aria-label="Voice input section">
          <h2 className="text-lg font-semibold mb-4">Add New Task</h2>
          <VoiceRecorder onTranscriptComplete={handleTranscriptComplete} />
        </section>

        {/* Filters Section */}
        <section aria-label="Task filters">
          <Filters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            priorityFilter={priorityFilter}
            onPriorityChange={setPriorityFilter}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            onClearFilters={handleClearFilters}
          />
        </section>

        {/* Tasks Display Section */}
        <section aria-label="Tasks">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : viewMode === "board" ? (
            <KanbanBoard
              tasks={filteredTasks}
              onStatusChange={handleStatusChange}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
            />
          ) : (
            <TaskList tasks={filteredTasks} onEditTask={handleEditTask} onDeleteTask={handleDeleteTask} />
          )}
        </section>
      </main>

      {/* Preview Modal for New Tasks */}
      {currentParsedTask && (
        <ParsedPreviewModal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          onSave={handleSaveNewTask}
          transcript={currentTranscript}
          parsedTask={currentParsedTask}
        />
      )}

      {/* Edit Modal for Existing Tasks */}
      <EditTaskModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSaveEditedTask}
        task={editingTask}
      />

      <Toaster />
    </div>
  )
}
