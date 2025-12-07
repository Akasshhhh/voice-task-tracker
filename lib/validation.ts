import { z } from "zod"

const priorityValues = ["Low", "Medium", "High", "Critical"] as const
const statusValues = ["todo", "in-progress", "done"] as const

const dueDateInputSchema = z.union([z.string(), z.null(), z.undefined()])

function normalizeDueDate(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null
  const trimmed = value.trim()
  if (trimmed === "") return null
  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid due_date value")
  }
  return date.toISOString()
}

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional(),
  due_date: dueDateInputSchema.optional().transform(normalizeDueDate),
  priority: z.enum(priorityValues),
  status: z.enum(statusValues),
  transcript: z.string().trim().min(1).max(2000),
  stt_provider: z.string().trim().min(1).max(100),
})

export const updateTaskSchema = createTaskSchema.partial().refine(
  (data) => Object.values(data).some((value) => value !== undefined),
  {
    message: "At least one field must be provided for update",
  },
)

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>

export function parseDueDate(value: string | null | undefined): Date | null {
  if (value === null || value === undefined) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date format")
  }
  return date
}
