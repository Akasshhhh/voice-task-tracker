// Client-side transcript parsing using chrono-node and regex
// Deterministic parsing logic for extracting task details from voice transcripts

import * as chrono from "chrono-node"
import type { ParsedTask, Priority } from "./types"

// Priority keyword patterns (case-insensitive)
const PRIORITY_PATTERNS: { pattern: RegExp; priority: Priority }[] = [
  { pattern: /\b(critical|urgent)\b/i, priority: "Critical" },
  { pattern: /\bhigh\s*priority\b/i, priority: "High" },
  { pattern: /\bhigh\b/i, priority: "High" },
  { pattern: /\blow\s*priority\b/i, priority: "Low" },
  { pattern: /\blow\b/i, priority: "Low" },
]

// Prefixes to strip from the beginning of transcripts
const PREFIX_PATTERNS = [
  /^remind\s+me\s+to\s+/i,
  /^create\s+(a\s+)?(critical\s+|urgent\s+|high\s+|low\s+)?task\s*:\s*/i,
  /^add\s+(a\s+)?task\s*:\s*/i,
  /^set\s+(a\s+)?(low\s+|high\s+|critical\s+|urgent\s+)?priority\s+reminder\s+to\s+/i,
  /^make\s+(a\s+)?note\s+to\s+/i,
  /^after\s+/i,
]

// Phrases to strip from end that indicate priority
const PRIORITY_SUFFIX_PATTERNS = [
  /[,\s]+it'?s?\s+(high|low|critical|urgent)\s*priority$/i,
  /[,\s]+(high|low|critical|urgent)\s*priority$/i,
  /[,\s]+(high|low|critical|urgent)$/i,
]

// Recurrence patterns to extract
const RECURRENCE_PATTERNS = [
  /\bevery\s+(day|week|month|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  /\bdaily\b/i,
  /\bweekly\b/i,
  /\bmonthly\b/i,
]

/**
 * Parse a voice transcript into structured task data
 * Uses chrono-node for date parsing and regex for priority/title extraction
 */
export function parseTranscript(transcript: string): ParsedTask {
  if (!transcript || typeof transcript !== "string") {
    return {
      title: "",
      description: "",
      due_date: null,
      priority: "Medium",
      status: "todo",
    }
  }

  const workingText = transcript.trim()
  let description = ""

  // Extract recurrence patterns for description
  for (const pattern of RECURRENCE_PATTERNS) {
    const match = workingText.match(pattern)
    if (match) {
      description = `Recurrence: ${match[0]}`
      break
    }
  }

  // Parse date using chrono-node with forward date preference
  const parsedDate = chrono.parseDate(workingText, new Date(), {
    forwardDate: true,
  })

  // Get the date text that chrono found to remove it from title
  const chronoResults = chrono.parse(workingText, new Date(), {
    forwardDate: true,
  })
  let dateTextToRemove = ""
  if (chronoResults.length > 0) {
    dateTextToRemove = chronoResults[0].text
  }

  // Detect priority from transcript
  let priority: Priority = "Medium"
  for (const { pattern, priority: p } of PRIORITY_PATTERNS) {
    if (pattern.test(workingText)) {
      priority = p
      break
    }
  }

  // Strip prefixes
  let title = workingText
  for (const pattern of PREFIX_PATTERNS) {
    title = title.replace(pattern, "")
  }

  // Remove date text from title
  if (dateTextToRemove) {
    // Escape special regex chars in date text
    const escapedDate = dateTextToRemove.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    title = title.replace(new RegExp(`\\b${escapedDate}\\b`, "gi"), "")
    // Also try removing with surrounding punctuation
    title = title.replace(new RegExp(`[,\\s]*by\\s+${escapedDate}[,\\s]*`, "gi"), " ")
    title = title.replace(new RegExp(`[,\\s]*before\\s+(the\\s+)?${escapedDate}[,\\s]*`, "gi"), " ")
    title = title.replace(new RegExp(`[,\\s]*on\\s+${escapedDate}[,\\s]*`, "gi"), " ")
    title = title.replace(new RegExp(`[,\\s]*at\\s+${escapedDate}[,\\s]*`, "gi"), " ")
  }

  // Remove priority phrases from title
  for (const pattern of PRIORITY_SUFFIX_PATTERNS) {
    title = title.replace(pattern, "")
  }

  // Remove standalone priority words that aren't part of the task
  title = title.replace(/\b(high|low|critical|urgent)\s+priority\b/gi, "")

  // Clean up the title
  title = title
    .replace(/[,\s]+remind\s+me\s+to\b/gi, "") // Remove "remind me to" in middle
    .replace(/\b(by|before|on|at)\s*$/gi, "") // Remove trailing prepositions
    .replace(/^\s*[,\s]+/, "") // Remove leading commas/spaces
    .replace(/[,\s]+$/, "") // Remove trailing commas/spaces
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim()

  // Capitalize first letter
  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1)
  }

  return {
    title,
    description,
    due_date: parsedDate ? parsedDate.toISOString() : null,
    priority,
    status: "todo",
  }
}
