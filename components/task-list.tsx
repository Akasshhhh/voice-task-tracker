"use client"

import { format } from "date-fns"
import { Calendar, Flag, Trash2, Edit2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Task, Priority } from "@/lib/types"

interface TaskListProps {
  tasks: Task[]
  onEditTask: (task: Task) => void
  onDeleteTask: (id: string) => void
}

const PRIORITY_VARIANTS: Record<Priority, "default" | "secondary" | "destructive" | "outline"> = {
  Low: "secondary",
  Medium: "outline",
  High: "default",
  Critical: "destructive",
}

const STATUS_LABELS: Record<string, string> = {
  todo: "To Do",
  "in-progress": "In Progress",
  done: "Done",
}

export function TaskList({ tasks, onEditTask, onDeleteTask }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground border rounded-lg">
        No tasks yet. Use voice or text to add your first task.
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow key={task.id} className={cn(task.status === "done" && "opacity-60")}>
              <TableCell>
                <div className="space-y-1">
                  <p className={cn("font-medium", task.status === "done" && "line-through")}>{task.title}</p>
                  {task.description && <p className="text-xs text-muted-foreground line-clamp-1">{task.description}</p>}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{STATUS_LABELS[task.status]}</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={PRIORITY_VARIANTS[task.priority]}>
                  <Flag className="h-3 w-3 mr-1" />
                  {task.priority}
                </Badge>
              </TableCell>
              <TableCell>
                {task.due_date ? (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(task.due_date), "MMM d, h:mm a")}
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => onEditTask(task)}
                    aria-label="Edit task"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => onDeleteTask(task.id)}
                    aria-label="Delete task"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
