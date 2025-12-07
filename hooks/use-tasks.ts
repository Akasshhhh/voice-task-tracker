"use client"

import { useState, useCallback, useEffect } from "react"
import type { Task, CreateTaskPayload, UpdateTaskPayload, TaskStatus } from "@/lib/types"
import * as api from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch all tasks
  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await api.getTasks()
      setTasks(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch tasks"
      setError(message)
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // Create a new task with optimistic update
  const createTask = useCallback(
    async (payload: CreateTaskPayload): Promise<Task | null> => {
      const optimisticTask: Task = {
        id: `temp-${Date.now()}`,
        ...payload,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Optimistic update
      setTasks((prev) => [...prev, optimisticTask])

      try {
        const newTask = await api.createTask(payload)
        // Replace optimistic task with real task
        setTasks((prev) => prev.map((t) => (t.id === optimisticTask.id ? newTask : t)))
        toast({
          title: "Task created",
          description: "Your task has been added successfully.",
        })
        return newTask
      } catch (err) {
        // Rollback on error
        setTasks((prev) => prev.filter((t) => t.id !== optimisticTask.id))
        const message = err instanceof Error ? err.message : "Failed to create task"
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        })
        return null
      }
    },
    [toast],
  )

  // Update a task with optimistic update
  const updateTask = useCallback(
    async (id: string, payload: UpdateTaskPayload): Promise<Task | null> => {
      const originalTask = tasks.find((t) => t.id === id)
      if (!originalTask) return null

      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...payload, updated_at: new Date().toISOString() } : t)),
      )

      try {
        const updatedTask = await api.updateTask(id, payload)
        setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)))
        return updatedTask
      } catch (err) {
        // Rollback on error
        setTasks((prev) => prev.map((t) => (t.id === id ? originalTask : t)))
        const message = err instanceof Error ? err.message : "Failed to update task"
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        })
        return null
      }
    },
    [tasks, toast],
  )

  // Delete a task with optimistic update
  const deleteTask = useCallback(
    async (id: string): Promise<boolean> => {
      const originalTask = tasks.find((t) => t.id === id)
      if (!originalTask) return false

      // Optimistic update
      setTasks((prev) => prev.filter((t) => t.id !== id))

      try {
        await api.deleteTask(id)
        toast({
          title: "Task deleted",
          description: "The task has been removed.",
        })
        return true
      } catch (err) {
        // Rollback on error
        setTasks((prev) => [...prev, originalTask])
        const message = err instanceof Error ? err.message : "Failed to delete task"
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        })
        return false
      }
    },
    [tasks, toast],
  )

  // Update task status (for drag & drop)
  const updateTaskStatus = useCallback(
    async (id: string, status: TaskStatus): Promise<boolean> => {
      const result = await updateTask(id, { status })
      return result !== null
    },
    [updateTask],
  )

  // Load tasks on mount
  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  return {
    tasks,
    isLoading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
  }
}
