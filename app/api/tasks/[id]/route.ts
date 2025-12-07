import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { auth } from "@clerk/nextjs/server"

import { prisma } from "@/lib/prisma"
import { updateTaskSchema } from "@/lib/validation"
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

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    const { id } = await params
    const task = await prisma.task.findFirst({ where: { id, userId } })
    if (!task) return NextResponse.json({ message: "Not found" }, { status: 404 })
    return NextResponse.json(toResponseTask(task))
  } catch (error) {
    console.error("Failed to fetch task", error)
    return NextResponse.json({ message: "Failed to fetch task" }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    const body = await req.json()
    const parsed = updateTaskSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid task payload", issues: parsed.error.format() }, { status: 422 })
    }

    const data = parsed.data
    const { id } = await params

    const existing = await prisma.task.findFirst({ where: { id, userId } })
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 })

    const updated = await prisma.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        dueDate: data.due_date ? new Date(data.due_date) : undefined,
        priority: data.priority,
        status: data.status,
      },
    })

    return NextResponse.json(toResponseTask(updated))
  } catch (error) {
    console.error("Failed to update task", error)
    return NextResponse.json({ message: "Failed to update task" }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    const { id } = await params
    const existing = await prisma.task.findFirst({ where: { id, userId } })
    if (!existing) return NextResponse.json({ message: "Not found" }, { status: 404 })
    await prisma.task.delete({ where: { id } })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Failed to delete task", error)
    return NextResponse.json({ message: "Failed to delete task" }, { status: 500 })
  }
}
