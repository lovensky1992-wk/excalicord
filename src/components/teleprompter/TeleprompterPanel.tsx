import { useState, useRef, useEffect, useCallback } from "react"

interface TeleprompterPanelProps {
  open: boolean
  onClose: () => void
}

export function TeleprompterPanel({ open, onClose }: TeleprompterPanelProps) {
  const [script, setScript] = useState("")
  const [scrollSpeed, setScrollSpeed] = useState(50)
  const [opacity, setOpacity] = useState(0.7)
  const [isScrolling, setIsScrolling] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [panelSize, setPanelSize] = useState({ width: 340, height: 400 })
  const [isResizing, setIsResizing] = useState(false)
  const resizeStartRef = useRef({ x: 0, y: 0, w: 0, h: 0 })

  // Auto-scroll logic
  useEffect(() => {
    if (isScrolling && textareaRef.current) {
      const speed = scrollSpeed / 50 // normalize: 50 = 1px/tick
      scrollIntervalRef.current = setInterval(() => {
        if (textareaRef.current) {
          textareaRef.current.scrollTop += speed
          // Stop at bottom
          if (textareaRef.current.scrollTop >= textareaRef.current.scrollHeight - textareaRef.current.clientHeight) {
            setIsScrolling(false)
          }
        }
      }, 50)
    } else {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current)
        scrollIntervalRef.current = null
      }
    }
    return () => {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current)
    }
  }, [isScrolling, scrollSpeed])

  const toggleScroll = useCallback(() => {
    if (isScrolling) {
      setIsScrolling(false)
    } else {
      // Reset to top if at bottom
      if (textareaRef.current) {
        const atBottom = textareaRef.current.scrollTop >= textareaRef.current.scrollHeight - textareaRef.current.clientHeight - 5
        if (atBottom) textareaRef.current.scrollTop = 0
      }
      setIsScrolling(true)
    }
  }, [isScrolling])

  // Resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    resizeStartRef.current = { x: e.clientX, y: e.clientY, w: panelSize.width, h: panelSize.height }
  }, [panelSize])

  useEffect(() => {
    if (!isResizing) return
    const handleMouseMove = (e: MouseEvent) => {
      const dw = resizeStartRef.current.x - e.clientX // reversed: dragging left = wider
      const dh = e.clientY - resizeStartRef.current.y
      setPanelSize({
        width: Math.max(260, Math.min(600, resizeStartRef.current.w + dw)),
        height: Math.max(200, Math.min(800, resizeStartRef.current.h + dh)),
      })
    }
    const handleMouseUp = () => setIsResizing(false)
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing])

  if (!open) return null

  return (
    <div
      className="flex flex-col"
      style={{
        position: "fixed",
        top: 80,
        right: 20,
        zIndex: 2500,
        width: panelSize.width,
        height: panelSize.height,
        opacity,
        backgroundColor: "rgba(254, 252, 249, 0.7)",
        borderRadius: 16,
        boxShadow: "rgba(0, 0, 0, 0.027) 0px 1px 2px 0px, rgba(0, 0, 0, 0.07) 0px 8px 24px 0px, rgba(0, 0, 0, 0.055) 0px 16px 48px 0px",
        border: "1px solid rgba(0, 0, 0, 0.043)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between" style={{
        padding: "14px 16px 12px",
        borderBottom: "1px solid rgba(231, 229, 228, 0.7)",
        backgroundColor: "rgba(250, 250, 249, 0.35)",
      }}>
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: "rgb(68, 64, 60)" }}>提词器</span>
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
          style={{ width: 24, height: 24, fontSize: 18, color: "rgb(168, 162, 158)" }}
        >
          &times;
        </button>
      </div>

      {/* Controls — inside header area */}
      <div style={{ padding: "0 16px 12px", backgroundColor: "rgba(250, 250, 249, 0.35)" }}>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleScroll}
            className="flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors shrink-0"
            style={{ width: 32, height: 32, backgroundColor: "rgb(245, 245, 244)", color: "rgb(120, 113, 108)" }}
            title={isScrolling ? "暂停滚动" : "开始滚动"}
          >
            {isScrolling ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
          </button>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 11, color: "rgb(168, 162, 158)" }}>滚动速度</span>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={scrollSpeed}
                onChange={e => setScrollSpeed(parseInt(e.target.value))}
                className="w-[140px] h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-600"
              />
            </div>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: 11, color: "rgb(168, 162, 158)" }}>透明度</span>
              <input
                type="range"
                min="0.3"
                max="1"
                step="0.05"
                value={opacity}
                onChange={e => setOpacity(parseFloat(e.target.value))}
                className="w-[140px] h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Textarea */}
      <div className="flex-1 min-h-0">
        <textarea
          ref={textareaRef}
          value={script}
          onChange={e => setScript(e.target.value)}
          placeholder={"在此粘贴你的脚本...\n\n此文本仅对你可见，不会出现在录制中。"}
          className="w-full h-full resize-none border-0 outline-none bg-transparent"
          style={{ fontSize: 18, color: "rgb(28, 25, 23)", lineHeight: "31.5px", padding: 20 }}
        />
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center"
      >
        <svg width="8" height="8" viewBox="0 0 8 8" className="text-gray-300">
          <path d="M7 1L1 7M7 4L4 7M7 7L7 7" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
    </div>
  )
}
