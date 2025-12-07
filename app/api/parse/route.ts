import { NextResponse } from "next/server"
import { z } from "zod"
import * as chrono from "chrono-node"
import { parseTranscript as fallbackParse } from "@/lib/parse"

const OutputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional().default(""),
  due_date: z.union([z.string().datetime(), z.null()]).optional().default(null),
  priority: z.enum(["Low", "Medium", "High", "Critical"]).optional().default("Medium"),
  status: z.enum(["todo", "in-progress", "done"]).optional().default("todo"),
})

type Parsed = z.infer<typeof OutputSchema>

const SYSTEM = `You extract task details from a user's natural language note.
Return ONLY a compact JSON object with keys: title, description, due_date, priority, status.
- title: a short actionable summary (<= 100 chars). Do not include dates, priority, or meta words like "priority".
- description: any extra details, context, steps, notes that don't fit in title. If none, use empty string.
- due_date: ISO 8601 (UTC) if present, else null.
- priority: one of Low, Medium, High, Critical.
- status: one of todo, in-progress, done.
No code blocks, no comments, no extra fields.`

export async function POST(req: Request) {
  try {
    const { transcript } = (await req.json()) as { transcript?: string }
    if (!transcript || typeof transcript !== "string" || transcript.trim().length === 0) {
      return NextResponse.json({ message: "Missing transcript" }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      // Fallback to local parser if API key not present
      const parsed = fallbackParse(transcript)
      return NextResponse.json({ parsed })
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini"

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          // Few-shot example 1 (explicit date to avoid ambiguity)
          {
            role: "user",
            content:
              "Extract fields from this: Create a high priority task: Finish the quarterly report by December 15, 2025 at 5 pm. Add a note to include the sales numbers.",
          },
          {
            role: "assistant",
            content:
              '{"title":"Finish the quarterly report","description":"Include the sales numbers.","due_date":"2025-12-15T17:00:00.000Z","priority":"High","status":"todo"}',
          },
          // Few-shot example 2 (no date but clear description)
          {
            role: "user",
            content:
              "Extract fields from this: Plan team offsite; discuss venue options and budget. Low priority.",
          },
          {
            role: "assistant",
            content:
              '{"title":"Plan team offsite","description":"Discuss venue options and budget.","due_date":null,"priority":"Low","status":"todo"}',
          },
          // Actual request
          {
            role: "user",
            content: `Extract fields from this: ${transcript}`,
          },
        ],
        temperature: 0.1,
      }),
    })

    if (!response.ok) {
      const parsed = fallbackParse(transcript)
      return NextResponse.json({ parsed, note: "fallback_used" })
    }

    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content
    console.log("openai.parse.raw", { content, usage: data?.usage, model: data?.model })
    if (!content || typeof content !== "string") {
      const parsed = fallbackParse(transcript)
      return NextResponse.json({ parsed, note: "fallback_used" })
    }

    let candidate: unknown
    try {
      candidate = JSON.parse(content)
      console.log("openai.parse.parsedCandidate", candidate)
    } catch {
      const parsed = fallbackParse(transcript)
      return NextResponse.json({ parsed, note: "fallback_used" })
    }

    const safe = OutputSchema.safeParse(candidate)
    if (!safe.success) {
      console.log("openai.parse.validationError", safe.error?.format?.())
      const parsed = fallbackParse(transcript)
      return NextResponse.json({ parsed, note: "fallback_used" })
    }

    const parsedOut: Parsed = safe.data
    // Enrich description if model left it empty but transcript has extra info
    if (!parsedOut.description || parsedOut.description.trim() === "") {
      const fb = fallbackParse(transcript)
      if (fb.description && fb.description.trim().length > 0) {
        parsedOut.description = fb.description
      }
    }

    // Prefer chrono-node for date resolution (handles "tomorrow", etc.)
    const chronoDate = chrono.parseDate(transcript, new Date(), { forwardDate: true })
    if (chronoDate) {
      parsedOut.due_date = chronoDate.toISOString()
    }

    // If model omitted due_date/priority/status, defaulting above covers it.
    return NextResponse.json({ parsed: parsedOut })
  } catch (e) {
    const parsed = fallbackParse("")
    return NextResponse.json({ parsed, note: "fallback_used" }, { status: 200 })
  }
}
