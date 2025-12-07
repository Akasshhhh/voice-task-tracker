"use client"

import { format, formatDistanceToNow, isPast, isToday } from "date-fns"
import { Calendar, Flag, MessageSquare, Trash2, Edit2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { Task, Priority } from "@/lib/types"

interface TaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
  onDelete?: (id: string) => void
  isDragging?: boolean
}

const PRIORITY_COLORS: Record<Priority, string> = {
  Low: "bg-green-500",
  Medium: "bg-gray-400",
  High: "bg-orange-500",
  Critical: "bg-red-500",
}

const PRIORITY_TEXT_COLORS: Record<Priority, string> = {
  Low: "text-green-700 dark:text-green-400",
  Medium: "text-gray-600 dark:text-gray-400",
  High: "text-orange-700 dark:text-orange-400",
  Critical: "text-red-700 dark:text-red-400",
}

export function TaskCard({ task, onEdit, onDelete, isDragging = false }: TaskCardProps) {
  const dueDate = task.due_date ? new Date(task.due_date) : null
  const isOverdue = dueDate && isPast(dueDate) && task.status !== "done"
  const isDueToday = dueDate && isToday(dueDate)

  return (
    <Card
      className={cn(
        "cursor-grab active:cursor-grabbing transition-all",
        isDragging && "opacity-50 rotate-2 scale-105",
        isOverdue && "border-red-300 dark:border-red-800",
      )}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header with Priority Badge */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-sm leading-tight flex-1 line-clamp-2">{task.title}</h3>
          <div className="flex items-center gap-1 shrink-0">
            <span
              className={cn("h-2 w-2 rounded-full", PRIORITY_COLORS[task.priority])}
              aria-label={`${task.priority} priority`}
            />
          </div>
        </div>

        {/* Due Date Badge */}
        {dueDate && (
          <div
            className={cn(
              "flex items-center gap-1.5 text-xs",
              isOverdue
                ? "text-red-600 dark:text-red-400"
                : isDueToday
                  ? "text-orange-600 dark:text-orange-400"
                  : "text-muted-foreground",
            )}
          >
            <Calendar className="h-3 w-3" />
            <span>
              {isOverdue
                ? `Overdue by ${formatDistanceToNow(dueDate)}`
                : isDueToday
                  ? `Today at ${format(dueDate, "h:mm a")}`
                  : format(dueDate, "MMM d, h:mm a")}
            </span>
          </div>
        )}

        {/* Priority Label */}
        <div className={cn("flex items-center gap-1.5 text-xs", PRIORITY_TEXT_COLORS[task.priority])}>
          <Flag className="h-3 w-3" />
          <span>{task.priority} Priority</span>
        </div>

        {/* Description Preview if exists */}
        {task.description && <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>}

        {/* Footer with Actions and Transcript Tooltip */}
        <div className="flex items-center justify-between pt-2 border-t">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="View original transcript"
                >
                  <MessageSquare className="h-3 w-3" />
                  <span>Transcript</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[300px] text-xs">
                <p className="italic">&quot;{task.transcript}&quot;</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="flex items-center gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(task)
                }}
                aria-label="Edit task"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(task.id)
                }}
                aria-label="Delete task"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
