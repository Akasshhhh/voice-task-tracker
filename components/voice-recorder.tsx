"use client"

import { useState, useEffect } from "react"
import { Mic, MicOff, Square, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { useSpeechRecognition } from "@/hooks/use-speech-recognition"

interface VoiceRecorderProps {
  onTranscriptComplete: (transcript: string) => void
  className?: string
}

export function VoiceRecorder({ onTranscriptComplete, className }: VoiceRecorderProps) {
  const { isListening, isSupported, transcript, interimTranscript, error, start, stop, reset } = useSpeechRecognition()

  const [manualInput, setManualInput] = useState("")
  const [showFallback, setShowFallback] = useState(false)

  // Show fallback input if STT is not supported
  useEffect(() => {
    if (!isSupported) {
      setShowFallback(true)
    }
  }, [isSupported])

  const handleToggleRecording = () => {
    if (isListening) {
      stop()
    } else {
      reset()
      start()
    }
  }

  const handleStopAndSubmit = () => {
    stop()
    const finalTranscript = transcript.trim()
    if (finalTranscript) {
      onTranscriptComplete(finalTranscript)
      reset()
    }
  }

  const handleManualSubmit = () => {
    const trimmed = manualInput.trim()
    if (trimmed) {
      onTranscriptComplete(trimmed)
      setManualInput("")
    }
  }

  const displayTranscript = transcript + (interimTranscript ? ` ${interimTranscript}` : "")

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Voice Recording Controls */}
      <div className="flex items-center gap-4">
        <Button
          variant={isListening ? "destructive" : "default"}
          size="lg"
          onClick={handleToggleRecording}
          disabled={!isSupported && !showFallback}
          aria-label={isListening ? "Stop recording" : "Start voice recording"}
          className={cn("relative h-16 w-16 rounded-full transition-all", isListening && "animate-pulse")}
        >
          {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          {isListening && <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 animate-ping" />}
        </Button>

        {isListening && (
          <Button
            variant="outline"
            size="lg"
            onClick={handleStopAndSubmit}
            aria-label="Stop and save recording"
            className="h-12 bg-transparent"
          >
            <Square className="h-4 w-4 mr-2" />
            Done
          </Button>
        )}

        <div className="flex-1">
          <p className="text-sm text-muted-foreground">
            {isListening
              ? "Listening... Speak your task"
              : isSupported
                ? "Click to start voice recording"
                : "Voice not supported - use text input"}
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Live Transcript Display */}
      {(transcript || interimTranscript) && (
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-1">Transcript:</p>
          <p className="text-sm">
            {transcript}
            {interimTranscript && <span className="text-muted-foreground italic"> {interimTranscript}</span>}
          </p>
        </div>
      )}

      {/* Fallback Text Input */}
      {(showFallback || !isSupported) && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Or type your task:</p>
          <div className="flex gap-2">
            <Textarea
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Type your task here... e.g., 'Remind me to call John tomorrow at 2pm, high priority'"
              className="min-h-[80px]"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleManualSubmit()
                }
              }}
            />
            <Button onClick={handleManualSubmit} disabled={!manualInput.trim()} className="self-end">
              Add Task
            </Button>
          </div>
        </div>
      )}

      {/* Toggle for manual input */}
      {isSupported && !showFallback && (
        <Button variant="ghost" size="sm" onClick={() => setShowFallback(true)} className="text-muted-foreground">
          Prefer typing? Click here
        </Button>
      )}
    </div>
  )
}
