import { useCallback, useEffect, useRef } from "react"
import { Excalidraw } from "@excalidraw/excalidraw"
import "@excalidraw/excalidraw/index.css"

interface ExcalidrawCanvasProps {
  elements?: any[]
  slideFrameElements?: any[]
  onElementsChange?: (elements: any[]) => void
  onViewportChange?: (scrollX: number, scrollY: number, zoom: number) => void
  onSlideFrameClick?: (index: number) => void
  scrollToIndex?: number | null
  focusMode?: boolean
}

export function ExcalidrawCanvas({
  elements = [],
  slideFrameElements = [],
  onElementsChange,
  onViewportChange,
  onSlideFrameClick,
  scrollToIndex,
  focusMode = false,
}: ExcalidrawCanvasProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const excalidrawApiRef = useRef<any | null>(null)
  // Track last scrolled index to avoid duplicate scrolls
  const lastScrolledIndexRef = useRef<number | null>(null)
  const onViewportChangeRef = useRef(onViewportChange)
  onViewportChangeRef.current = onViewportChange

  // Use onScrollChange callback for viewport tracking (much cleaner than polling)
  useEffect(() => {
    const api = excalidrawApiRef.current
    if (!api || !onViewportChange) return

    const unsubscribe = api.onScrollChange((scrollX: number, scrollY: number, zoom: { scale: number }) => {
      onViewportChange?.(scrollX, scrollY, zoom.scale)
    })

    return unsubscribe
  }, [onViewportChange])

  // Scroll to frame when scrollToIndex changes
  // We need to wait for Excalidraw to load elements into scene first
  const pendingScrollRef = useRef<number | null>(null)
  const scrollRetryCountRef = useRef(0)
  const pendingFillViewportRef = useRef(false)
  const MAX_SCROLL_RETRIES = 60 // 60 × 100ms = 6s max wait

  const attemptScroll = useCallback((fillViewport?: boolean) => {
    if (fillViewport !== undefined) pendingFillViewportRef.current = fillViewport
    const useFill = pendingFillViewportRef.current

    const api = excalidrawApiRef.current
    const scrollTo = pendingScrollRef.current
    if (scrollTo === null || scrollTo === undefined) return

    if (!api) {
      if (scrollRetryCountRef.current < MAX_SCROLL_RETRIES) {
        scrollRetryCountRef.current++
        setTimeout(() => attemptScroll(), 100)
      }
      return
    }

    const frameId = `slide-frame-${scrollTo}`
    const sceneElements = api.getSceneElements()
    const frameElement = sceneElements.find((el: any) => el.id === frameId)
    if (frameElement) {
      if (useFill) {
        const appState = api.getAppState()
        const vw = appState.width || window.innerWidth
        const vh = appState.height || window.innerHeight
        const zoomX = (vw * 0.85) / frameElement.width
        const zoomY = (vh * 0.85) / frameElement.height
        const zoom = Math.min(zoomX, zoomY)
        const scrollX = -frameElement.x + (vw / zoom - frameElement.width) / 2
        const scrollY = -frameElement.y + (vh / zoom - frameElement.height) / 2
        api.updateScene({ appState: { scrollX, scrollY, zoom: { value: zoom } } })
        onViewportChangeRef.current?.(scrollX, scrollY, zoom)
      } else {
        api.scrollToContent(frameElement, { fitToContent: true, animate: true })
      }
      lastScrolledIndexRef.current = scrollTo
      pendingScrollRef.current = null
      scrollRetryCountRef.current = 0
      pendingFillViewportRef.current = false
    } else if (scrollRetryCountRef.current < MAX_SCROLL_RETRIES) {
      scrollRetryCountRef.current++
      setTimeout(() => attemptScroll(), 100)
    } else {
      console.warn(`[ExcalidrawCanvas] Frame ${frameId} not found after ${MAX_SCROLL_RETRIES} retries`)
      pendingScrollRef.current = null
      scrollRetryCountRef.current = 0
      pendingFillViewportRef.current = false
    }
  }, [])

  useEffect(() => {
    if (scrollToIndex === null || scrollToIndex === undefined) return

    pendingScrollRef.current = scrollToIndex
    scrollRetryCountRef.current = 0
    lastScrolledIndexRef.current = scrollToIndex

    attemptScroll()
  }, [scrollToIndex, attemptScroll])

  // Handle element changes - detect slide frame clicks
  const handleChange = useCallback((allElements: any[]) => {
    // Check if any slide frame was clicked (simple detection via ID pattern)
    const frameClick = allElements.find(
      (el: any) => el.id.startsWith("slide-frame-") && el.backgroundColor === "#2563eb"
    )
    if (frameClick) {
      const frameIndex = parseInt(frameClick.id.replace("slide-frame-", ""), 10)
      if (!isNaN(frameIndex)) {
        onSlideFrameClick?.(frameIndex)
      }
    }
    onElementsChange?.([...allElements])
  }, [onElementsChange, onSlideFrameClick])

  // Focus mode: when entering recording/preview, zoom to fill viewport
  const prevFocusModeRef = useRef(false)
  useEffect(() => {
    if (focusMode && !prevFocusModeRef.current) {
      const idx = scrollToIndex ?? 0
      pendingScrollRef.current = idx
      scrollRetryCountRef.current = 0
      attemptScroll(true)
    }
    prevFocusModeRef.current = focusMode
  }, [focusMode, scrollToIndex, attemptScroll])

  // Sync frame elements into Excalidraw scene when they change (e.g. aspect ratio update)
  const prevFrameElementsRef = useRef<string>("")
  useEffect(() => {
    const api = excalidrawApiRef.current
    if (!api) return
    const key = JSON.stringify(slideFrameElements.map(f => ({ id: f.id, w: f.width, h: f.height, sc: f.strokeColor, sw: f.strokeWidth })))
    if (key === prevFrameElementsRef.current) return
    prevFrameElementsRef.current = key

    const sceneElements = api.getSceneElements()
    const sceneIds = new Set(sceneElements.map((el: any) => el.id))

    // Update existing elements
    const updatedElements = sceneElements.map((el: any) => {
      const match = slideFrameElements.find((f: any) => f.id === el.id)
      if (match && (el.width !== match.width || el.height !== match.height || el.strokeColor !== match.strokeColor || el.strokeWidth !== match.strokeWidth)) {
        return { ...el, width: match.width, height: match.height, strokeColor: match.strokeColor, strokeWidth: match.strokeWidth, version: (el.version || 1) + 1 }
      }
      return el
    })

    // Add new elements (e.g. recording border) not yet in scene
    const newElements = slideFrameElements.filter((f: any) => !sceneIds.has(f.id))

    // Remove elements no longer in slideFrameElements (e.g. recording border after cancel)
    const frameIds = new Set(slideFrameElements.map((f: any) => f.id))
    const finalElements = updatedElements
      .filter((el: any) => !el.id.startsWith('recording-border-') || frameIds.has(el.id))
      .concat(newElements)

    api.updateScene({ elements: finalElements })
    api.refresh()
  }, [slideFrameElements])

  // Combine regular elements with slide frame elements
  const allElements = [...slideFrameElements, ...elements]

  return (
    <div className={`excalidraw-canvas w-full h-full overflow-hidden bg-[#FAFAFA]${focusMode ? " excalidraw-focus-mode" : ""}`}>
      <Excalidraw
        langCode="zh-CN"
        initialData={{ elements: allElements }}
        onChange={handleChange as any}
        excalidrawAPI={(api: any) => {
          excalidrawApiRef.current = api
          // Zoom to fit current frame on mount; use fitToViewport if in focus mode
          const idx = scrollToIndex ?? 0
          pendingScrollRef.current = idx
          lastScrolledIndexRef.current = null
          setTimeout(() => attemptScroll(focusMode), 100)
        }}
      />
    </div>
  )
}
