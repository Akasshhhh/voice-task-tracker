import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { auth } from "@clerk/nextjs/server"

import { prisma } from "@/lib/prisma"
import { createTaskSchema } from "@/lib/validation"
import type { Task } from "@/lib/types"

function toResponseTask(task: Prisma.TaskGetPayload<{}>): Task {
  return {
    id: task.id,
    title: task.title,
    description: task.description ?? "",
    due_date: task.dueDate ? task.dueDate.toISOString() : null,
    priority: task.priority as Task["priority"],
    status: task.status as Task["status"],
    transcript: task.transcript,
    stt_provider: task.sttProvider,
    created_at: task.createdAt.toISOString(),
    updated_at: task.updatedAt.toISOString(),
  }
}

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

    const tasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(tasks.map(toResponseTask))
  } catch (error) {
    console.error("Failed to fetch tasks", error)
    return NextResponse.json({ message: "Failed to fetch tasks" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const parsed = createTaskSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid task payload", issues: parsed.error.format() }, { status: 422 })
    }

    const data = parsed.data

    const task = await prisma.task.create({
      data: {
        userId,
        title: data.title,
        description: data.description ?? "",
        dueDate: data.due_date ? new Date(data.due_date) : null,
        priority: data.priority,
        status: data.status,
        transcript: data.transcript,
        sttProvider: data.stt_provider,
      },
    })

    return NextResponse.json(toResponseTask(task), { status: 201 })
  } catch (error) {
    console.error("Failed to create task", error)
    return NextResponse.json({ message: "Failed to create task" }, { status: 500 })
  }
}
