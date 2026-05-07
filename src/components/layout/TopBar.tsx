import { useCallback, useEffect, useRef, useState } from "react"
import type { RecordingState } from "@/types"

interface TopBarProps {
  recordingState: RecordingState
  duration: number
  isPreviewing: boolean
  onSettingsOpen: () => void
  onTeleprompterToggle: () => void
  teleprompterOpen: boolean
  onRecord: () => void
  onStartRecording: () => void
  onCancel: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  showMediaLibrary?: boolean
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

export function TopBar({
  recordingState,
  duration,
  isPreviewing,
  onSettingsOpen,
  onTeleprompterToggle,
  teleprompterOpen,
  onRecord,
  onStartRecording,
  onCancel,
  onPause,
  onResume,
  onStop,
  showMediaLibrary,
}: TopBarProps) {
  const isRecording = recordingState === "recording"
  const isPaused = recordingState === "paused"
  const isIdle = recordingState === "idle" && !isPreviewing
  const isActive = isRecording || isPaused

  const containerRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest("button")) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setIsDragging(true)
    const currentX = pos?.x ?? rect.left
    const currentY = pos?.y ?? rect.top
    dragOffset.current = { x: e.clientX - currentX, y: e.clientY - currentY }
  }, [pos])

  useEffect(() => {
    if (!isDragging) return
    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y })
    }
    const handleMouseUp = () => setIsDragging(false)
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging])

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      className="z-40 flex items-center"
      style={{
        backgroundColor: "rgb(254, 252, 249)",
        borderRadius: 14,
        boxShadow: "rgba(0, 0, 0, 0.04) 0px 1px 2px 0px, rgba(0, 0, 0, 0.08) 0px 4px 16px 0px, rgba(0, 0, 0, 0.06) 0px 12px 32px 0px",
        border: "1px solid rgba(0, 0, 0, 0.06)",
        padding: "8px 12px",
        gap: 8,
        ...(pos ? {
          position: "fixed" as const,
          left: pos.x,
          top: pos.y,
          cursor: isDragging ? "grabbing" : "grab",
        } : {
          position: "fixed" as const,
          top: 20,
          right: showMediaLibrary ? 80 : 15,
          cursor: "grab",
        }),
      }}
    >
      {/* Settings button — 34×34, borderRadius 8px, color #78716C */}
      <button
        onClick={onSettingsOpen}
        disabled={isActive}
        className={`flex items-center justify-center transition-colors ${
          isActive
            ? "cursor-not-allowed opacity-30"
            : "hover:bg-gray-100"
        }`}
        style={{ width: 34, height: 34, borderRadius: 8, padding: 8, color: "rgb(120, 113, 108)" }}
        title="录制设置"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {/* Teleprompter button — 34×34, borderRadius 8px, color #78716C */}
      <button
        onClick={onTeleprompterToggle}
        className={`flex items-center justify-center transition-colors ${
          teleprompterOpen
            ? "bg-gray-200 text-gray-800"
            : "hover:bg-gray-100"
        }`}
        style={{ width: 34, height: 34, borderRadius: 8, padding: 8, color: teleprompterOpen ? undefined : "rgb(120, 113, 108)" }}
        title="提词器"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" x2="8" y1="13" y2="13" />
          <line x1="16" x2="8" y1="17" y2="17" />
          <line x1="10" x2="8" y1="9" y2="9" />
        </svg>
      </button>

      {/* Show cursor button - only during recording */}
      {isActive && (
        <button
          className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          title="显示光标"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="4" />
            <line x1="21.17" x2="12" y1="8" y2="8" />
            <line x1="3.95" x2="8.54" y1="6.06" y2="14" />
            <line x1="10.88" x2="15.46" y1="21.94" y2="14" />
          </svg>
        </button>
      )}

      {/* Cancel button - previewing state */}
      {isPreviewing && (
        <button
          onClick={onCancel}
          className="h-9 px-4 flex items-center gap-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
          取消
        </button>
      )}

      {/* Pause button - recording state: orange #F59E0B matching original */}
      {isRecording && (
        <button
          onClick={onPause}
          className="h-9 px-4 flex items-center gap-1.5 text-sm font-medium text-white transition-colors hover:brightness-110"
          style={{
            backgroundColor: "#F59E0B",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: '"DM Sans", sans-serif',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
          暂停
        </button>
      )}

      {/* Resume button - paused state: orange #D97706 matching original */}
      {isPaused && (
        <button
          onClick={onResume}
          className="h-9 px-4 flex items-center gap-1.5 text-sm font-medium text-white transition-colors hover:brightness-110"
          style={{
            backgroundColor: "#D97706",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: '"DM Sans", sans-serif',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21" />
          </svg>
          继续
        </button>
      )}

      {/* Stop button - recording or paused: dark #44403C matching original */}
      {isActive && (
        <button
          onClick={onStop}
          className="h-9 px-4 flex items-center gap-1.5 text-sm font-medium text-white transition-colors hover:brightness-110"
          style={{
            backgroundColor: "#44403C",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: '"DM Sans", sans-serif',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <rect x="4" y="4" width="16" height="16" rx="2" />
          </svg>
          停止
        </button>
      )}

      {/* Start recording button - previewing state: dark green #15803D matching original */}
      {isPreviewing && (
        <button
          onClick={onStartRecording}
          className="h-9 px-5 flex items-center gap-1.5 text-sm font-medium text-white transition-colors hover:brightness-110"
          style={{
            backgroundColor: "#15803D",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: '"DM Sans", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", -apple-system, sans-serif',
          }}
        >
          <span className="w-2 h-2 rounded-full bg-white" />
          开始录制
        </button>
      )}

      {/* Record button — matches original: 38px height, borderRadius 10px, bg #DC2626, font 13px/600, boxShadow */}
      {isIdle && (
        <button
          onClick={onRecord}
          className="flex items-center text-white transition-colors hover:brightness-110"
          style={{
            height: 38,
            padding: "10px 16px",
            borderRadius: 10,
            backgroundColor: "rgb(220, 38, 38)",
            boxShadow: "rgba(220, 38, 38, 0.3) 0px 2px 8px 0px",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: '"DM Sans", "PingFang SC", "Microsoft YaHei", "Noto Sans SC", -apple-system, sans-serif',
            gap: 6,
            lineHeight: "normal",
          }}
        >
          ● 录制
        </button>
      )}

      {/* Timer - recording or paused state: red dot + time */}
      {isActive && (
        <div className="flex items-center gap-1.5 px-2" style={{ fontSize: 13, fontWeight: 500, fontFamily: '"DM Sans", sans-serif' }}>
          <span style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: "#ef4444",
            display: "inline-block",
          }} className={isRecording ? "animate-pulse" : ""} />
          {formatDuration(duration)}
        </div>
      )}
    </div>
  )
}
