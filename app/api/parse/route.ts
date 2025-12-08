import { NextResponse } from "next/server";
import { z } from "zod";
import * as chrono from "chrono-node";
import { parseTranscript as fallbackParse } from "@/lib/parse";

const OutputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional().default(""),
  due_date: z.union([z.string().datetime(), z.null()]).optional().default(null),
  priority: z
    .enum(["Low", "Medium", "High", "Critical"])
    .optional()
    .default("Medium"),
  status: z.enum(["todo", "in-progress", "done"]).optional().default("todo"),
});

type Parsed = z.infer<typeof OutputSchema>;

const SYSTEM = `You extract task details from a user's natural language note.
Return ONLY a compact JSON object with keys: title, description, due_date, priority, status.
- title: a short actionable summary (<= 100 chars). Do not include dates, priority, or meta words like "priority".
- description: any extra details, context, steps, notes that don't fit in title. If none, use empty string.
- due_date: ISO 8601 (UTC) if present, else null.
- priority: one of Low, Medium, High, Critical.
  - If the user uses words like "important", "urgent", "asap", "right away", "critical", or is explicitly scheduling a time for a call/meeting about important or time-sensitive matters, lean towards High.
  - If the user explicitly says "high priority" or "critical", use that level directly.
  - If no priority is implied, default to Medium.
- status: one of todo, in-progress, done.
No code blocks, no comments, no extra fields.`;

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { transcript, timezoneOffset } = (await req.json()) as {
      transcript?: string;
      timezoneOffset?: number; // minutes offset from UTC (e.g. IST = +330)
    };

    if (
      !transcript ||
      typeof transcript !== "string" ||
      transcript.trim().length === 0
    ) {
      return NextResponse.json(
        { message: "Missing transcript" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Fallback to local parser if API key not present
      const parsed = fallbackParse(transcript);
      return NextResponse.json({ parsed });
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        temperature: 0,
        messages: [
          { role: "system", content: SYSTEM },

          // === Few-shot examples ===

          // 1. Important marketing call -> High
          {
            role: "user",
            content:
              "Extract fields from this: create me a task to call her tomorrow morning at 8:00 a.m. to discuss some important things related to marketing",
          },
          {
            role: "assistant",
            content:
              '{"title":"Call her to discuss marketing","description":"Discuss important things related to marketing.","due_date":"2025-12-09T08:00:00.000Z","priority":"High","status":"todo"}',
          },

          // 2. Low effort, low priority
          {
            role: "user",
            content:
              "Extract fields from this: remind me sometime this week, whenever I get time, to clean up my downloads folder and delete old files, low priority",
          },
          {
            role: "assistant",
            content:
              '{"title":"Clean up downloads folder","description":"Delete old and unnecessary files from the downloads folder sometime this week.","due_date":null,"priority":"Low","status":"todo"}',
          },

          // 3. Critical production bug
          {
            role: "user",
            content:
              "Extract fields from this: super urgent, create a task to fix the production checkout bug right away, customers cannot pay and this is critical",
          },
          {
            role: "assistant",
            content:
              '{"title":"Fix production checkout bug","description":"Resolve the production issue where customers are unable to complete payments.","due_date":null,"priority":"Critical","status":"todo"}',
          },

          // 4. Time-boxed, normal work -> Medium
          {
            role: "user",
            content:
              "Extract fields from this: schedule a task to review yesterday\'s pull requests today at 4 p.m.",
          },
          {
            role: "assistant",
            content:
              '{"title":"Review yesterday\'s pull requests","description":"Go through and review all pull requests created yesterday.","due_date":"2025-12-08T16:00:00.000Z","priority":"Medium","status":"todo"}',
          },

          // 5. Already done -> status done
          {
            role: "user",
            content:
              "Extract fields from this: log a task that I already finished the onboarding documentation yesterday, it is done just for tracking",
          },
          {
            role: "assistant",
            content:
              '{"title":"Finished onboarding documentation","description":"Onboarding documentation was completed yesterday and is logged for tracking purposes.","due_date":null,"priority":"Medium","status":"done"}',
          },

          // 6. In progress
          {
            role: "user",
            content:
              "Extract fields from this: I am currently working on updating the website landing page copy, make a task for it and mark it as in progress",
          },
          {
            role: "assistant",
            content:
              '{"title":"Update website landing page copy","description":"Current work in progress: updating the text on the website landing page.","due_date":null,"priority":"Medium","status":"in-progress"}',
          },

          // 7. Important client meeting -> High
          {
            role: "user",
            content:
              "Extract fields from this: create a task for tomorrow at 3 p.m. to meet with the client to finalize the contract, this is very important",
          },
          {
            role: "assistant",
            content:
              '{"title":"Meet with client to finalize contract","description":"Client meeting to finalize and review the contract details.","due_date":"2025-12-09T15:00:00.000Z","priority":"High","status":"todo"}',
          },

          // 8. Casual personal errand -> Low
          {
            role: "user",
            content:
              "Extract fields from this: at some point this weekend remind me to check out that new coffee place my friend mentioned, not urgent at all",
          },
          {
            role: "assistant",
            content:
              '{"title":"Check out new coffee place","description":"Visit the new coffee place recommended by a friend sometime this weekend.","due_date":null,"priority":"Low","status":"todo"}',
          },

          // 9. Urgent bill -> Critical
          {
            role: "user",
            content:
              "Extract fields from this: create a task to pay the electricity bill by tonight, if I miss it they might cut the power, this is really urgent",
          },
          {
            role: "assistant",
            content:
              '{"title":"Pay electricity bill","description":"Pay the electricity bill before the deadline tonight to avoid power being cut.","due_date":"2025-12-08T21:00:00.000Z","priority":"Critical","status":"todo"}',
          },

          // 10. Important strategy work -> High
          {
            role: "user",
            content:
              "Extract fields from this: make a task to work on the Q1 marketing strategy deck, it is an important priority for this week",
          },
          {
            role: "assistant",
            content:
              '{"title":"Work on Q1 marketing strategy deck","description":"Prepare and refine the Q1 marketing strategy presentation deck.","due_date":null,"priority":"High","status":"todo"}',
          },

          // === Actual user request ===
          {
            role: "user",
            content: `Extract fields from this: ${transcript}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const parsed = fallbackParse(transcript);
      return NextResponse.json({ parsed, note: "fallback_used" });
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    console.log("openai.parse.raw", {
      content,
      usage: data?.usage,
      model: data?.model,
    });

    if (!content || typeof content !== "string") {
      const parsed = fallbackParse(transcript);
      return NextResponse.json({ parsed, note: "fallback_used" });
    }

    let candidate: unknown;
    try {
      candidate = JSON.parse(content);
      console.log("openai.parse.parsedCandidate", candidate);
    } catch {
      const parsed = fallbackParse(transcript);
      return NextResponse.json({ parsed, note: "fallback_used" });
    }

    const safe = OutputSchema.safeParse(candidate);
    if (!safe.success) {
      console.log("openai.parse.validationError", safe.error?.format?.());
      const parsed = fallbackParse(transcript);
      return NextResponse.json({ parsed, note: "fallback_used" });
    }

    const parsedOut: Parsed = safe.data;

    // Enrich description if model left it empty but transcript has extra info
    if (!parsedOut.description || parsedOut.description.trim() === "") {
      const fb = fallbackParse(transcript);
      if (fb.description && fb.description.trim().length > 0) {
        parsedOut.description = fb.description;
      }
    }

    // Prefer chrono-node for date resolution (handles "tomorrow", etc.)
    const rawDate = chrono.parseDate(transcript, new Date(), {
      forwardDate: true,
    });

    if (rawDate) {
      if (typeof timezoneOffset === "number") {
        // timezoneOffset is minutes ahead of UTC (e.g. IST = 330)
        const corrected = new Date(
          rawDate.getTime() - timezoneOffset * 60 * 1000
        );
        parsedOut.due_date = corrected.toISOString();
      } else {
        // fallback: just use what chrono gave us
        parsedOut.due_date = rawDate.toISOString();
      }
    }

    return NextResponse.json({ parsed: parsedOut });
  } catch (e) {
    console.error("openai.parse.error", e);
    const parsed = fallbackParse("");
    return NextResponse.json(
      { parsed, note: "fallback_used" },
      { status: 200 }
    );
  }
}
