import { useCallback, useEffect, useRef, useState } from "react"
import { MainLayout } from "@/components/layout"
import { TopBar } from "@/components/layout/TopBar"
import { SettingsModal } from "@/components/settings/SettingsModal"
import { TeleprompterPanel } from "@/components/teleprompter/TeleprompterPanel"
import { ExcalidrawCanvas, CameraBubble } from "@/components/canvas"
import { useMediaDevices, useAvatar, useSlides, useRecordingFlow } from "@/hooks"
import { useAuth } from "@/contexts"
import { useProject } from "@/contexts"
import { LoginPage, SignUpPage, DashboardPage, AuthCallbackPage } from "@/pages"
import { analytics } from "@/services/api/analytics"
import { defaultBeautySettings, type BeautySettings } from "@/services/beauty/BeautyFilter"

/**
 * App - 应用根组件，协调整合层
 *
 * @description
 * App.tsx 是 Excalicord 的核心协调组件，负责：
 * - 页面路由（login/signup/dashboard/editor）
 * - 协调各 hook 和服务之间的交互
 * - 管理跨组件共享的 UI 状态
 * - 整合各个功能模块的输出
 *
 * @architecture
 * App 不直接实现业务逻辑，而是通过以下 hook 委托：
 * - {@link useSlides} - 幻灯片/帧状态管理
 * - {@link useRecordingFlow} - 录制状态机管理
 * - {@link useMediaDevices} - 摄像头/麦克风设备管理
 * - {@link useAvatar} - AI 虚拟形象管理
 * - {@link useProject} - 项目数据管理
 *
 * @example
 * 数据流：
 * 用户点击录制 → App.handleRecord → useRecordingFlow.startPreview
 *                                    → RecordingPreview 显示预览
 * 用户确认录制 → App.handleStartRecording → useRecordingFlow.startRecording
 *                                     → CanvasRecorder 开始捕获
 *
 * @see
 * - 技术架构文档: docs/technical-architecture.md
 * - 2.3 逻辑层架构
 */

type Page = "login" | "signup" | "dashboard" | "editor"

function App() {
  // =========================================================================
  // Section 1: Contexts & Hooks (数据层)
  // =========================================================================
  const { user, isLoading: authLoading } = useAuth()

  // Project context - 数据持久化
  const { project, slides, updateSlide, createProject, loadProject } = useProject()

  // Slide management hook - 幻灯片/帧状态
  const {
    currentSlideIndex,
    frameElements,
    frameDimensions,
    goToSlide,
    addSlide,
    deleteSlide,
    aspectRatio,
    customWidth,
    customHeight,
    setAspectRatio,
    setCustomSize,
  } = useSlides()

  // =========================================================================
  // Section 2: Page & Project State (页面状态)
  // =========================================================================
  const isLocalMode = !import.meta.env.VITE_SUPABASE_URL
  const [currentPage, setCurrentPage] = useState<Page>(isLocalMode ? "editor" : (user ? "editor" : "login"))
  const [, setProjectName] = useState("Untitled Project")

  // =========================================================================
  // Section 3: Auth & Navigation Effects (认证 & 导航)
  // =========================================================================
  // Auto-load last project on mount
  useEffect(() => {
    if (authLoading) return
    if (!user && !isLocalMode) {
      setCurrentPage("login")
      return
    }
    setCurrentPage("editor")
    const lastProjectId = localStorage.getItem("lastProjectId")
    const isValidUUID = lastProjectId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lastProjectId)
    if (!isValidUUID && lastProjectId) {
      console.warn("[App] Clearing stale lastProjectId:", lastProjectId)
      localStorage.removeItem("lastProjectId")
      // Clear other legacy localStorage mock keys
      ;["excalicord_projects", "excalicord_slides", "excalicord_exports", "excalicord_profile", "frameDims_migrated_v2"].forEach(k => localStorage.removeItem(k))
    }
    if (isValidUUID) {
      loadProject(lastProjectId).then(() => {
        console.log("[App] Project loaded:", lastProjectId)
      }).catch((err) => {
        console.error("[App] Failed to load project:", lastProjectId, err)
        localStorage.removeItem("lastProjectId")
      })
    }
  }, [user, authLoading, loadProject, isLocalMode])

  // Default project/slides are pre-populated in main.tsx (before React renders)
  // No useEffect needed here — avoids race conditions and infinite loops

  // Auto-save debounce for slide content
  const slideContentSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingSlideContentRef = useRef<{ slideId: string; content: Record<string, unknown> } | null>(null)

  const debouncedSaveSlideContent = useCallback((slideId: string, content: Record<string, unknown>) => {
    pendingSlideContentRef.current = { slideId, content }
    if (slideContentSaveTimeoutRef.current) clearTimeout(slideContentSaveTimeoutRef.current)
    slideContentSaveTimeoutRef.current = setTimeout(() => {
      const pending = pendingSlideContentRef.current
      if (pending) {
        updateSlide(pending.slideId, { content: pending.content })
        pendingSlideContentRef.current = null
      }
    }, 500) // 500ms debounce — save at most 2x/second
  }, [updateSlide])

  // Stable callback for Excalidraw onChange - avoids inline function recreating every render
  const handleElementsChange = useCallback((elements: any[]) => {
    const slide = slides[currentSlideIndex]
    if (!slide) return
    const contentElements = elements
      .filter((el: any) => !el.id.startsWith("slide-frame-"))
      .map((el: any) => ({ ...el, slideId: slide.id }))
    debouncedSaveSlideContent(slide.id, { elements: contentElements })
  }, [slides, currentSlideIndex, debouncedSaveSlideContent])

  // Sync projectName when project loads
  useEffect(() => {
    if (project?.title) {
      setProjectName(project.title)
    }
  }, [project?.title])

  // Note: currentSlideIndex, goToSlide, addSlide, aspectRatio, customWidth, customHeight
  // are now managed by useSlides hook with localStorage persistence

  // =========================================================================
  // Section 4: Device & Recording Hooks (设备 & 录制)
  // =========================================================================
  const {
    cameraStream,
    micStream,
    isCameraEnabled,
    isMicEnabled,
    toggleCamera,
    startCamera,
    startMic,
  } = useMediaDevices()

  // Recording flow state machine - 委托给 useRecordingFlow 管理
  const {
    state: recordingState,
    isPreviewing,
    duration,
    startPreviewWithFrameDims,
    cancelPreview,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    setCameraBubbleState,
  } = useRecordingFlow()

  // Export agent - 委托给 useExport 管理（不再使用 mp4 转换）

  // =========================================================================
  // Section 5: Beauty & Avatar Settings (美颜 & 虚拟形象)
  // =========================================================================
  // Beauty settings (kept for recording pipeline, not exposed in new UI yet)
  const [beautyEnabled] = useState(false)
  const [beautySettings] = useState<BeautySettings>(defaultBeautySettings)

  // AI Avatar state (kept for recording pipeline, not exposed in new UI yet)
  const {
    isEnabled: avatarEnabled,
    outputStream: avatarStream,
    stop: stopAvatar,
    start: startAvatar,
  } = useAvatar()

  // =========================================================================
  // Section 6: UI State (UI 状态)
  // =========================================================================

  // Settings modal
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Teleprompter panel
  const [teleprompterOpen, setTeleprompterOpen] = useState(false)

  // Countdown state (3-2-1 before recording)
  const [countdownValue, setCountdownValue] = useState<number | null>(null)


  // Settings state — persisted to localStorage
  const [cameraSize, setCameraSize] = useState(() => {
    const v = localStorage.getItem("excalicord_cameraSize")
    return v ? parseInt(v) : 180
  })
  const [cameraShape, setCameraShape] = useState<"circle" | "square">(() => {
    const v = localStorage.getItem("excalicord_cameraShape")
    return v === "square" ? "square" : "circle"
  })
  const [canvasMargin, setCanvasMargin] = useState(() => {
    const v = localStorage.getItem("excalicord_canvasMargin")
    return v ? parseInt(v) : 80
  })
  const [borderRadius, setBorderRadius] = useState(() => {
    const v = localStorage.getItem("excalicord_borderRadius")
    return v ? parseInt(v) : 16
  })
  const [cursorHighlight, setCursorHighlight] = useState(() => {
    return localStorage.getItem("excalicord_cursorHighlight") === "true"
  })
  const [cursorColor, setCursorColor] = useState(() => {
    return localStorage.getItem("excalicord_cursorColor") || "#ef4444"
  })
  const [background, setBackground] = useState<string | null>(() => {
    return localStorage.getItem("excalicord_background") || null
  })

  // Persist settings to localStorage
  useEffect(() => { localStorage.setItem("excalicord_cameraSize", String(cameraSize)) }, [cameraSize])
  useEffect(() => { localStorage.setItem("excalicord_cameraShape", cameraShape) }, [cameraShape])
  useEffect(() => { localStorage.setItem("excalicord_canvasMargin", String(canvasMargin)) }, [canvasMargin])
  useEffect(() => { localStorage.setItem("excalicord_borderRadius", String(borderRadius)) }, [borderRadius])
  useEffect(() => { localStorage.setItem("excalicord_cursorHighlight", String(cursorHighlight)) }, [cursorHighlight])
  useEffect(() => { localStorage.setItem("excalicord_cursorColor", cursorColor) }, [cursorColor])
  useEffect(() => {
    if (background) localStorage.setItem("excalicord_background", background)
    else localStorage.removeItem("excalicord_background")
  }, [background])

  // Toast notification for post-recording
  const [showSaveToast, setShowSaveToast] = useState(false)

  // Track whether a recording has been completed (for "素材库" button)
  const [hasRecordedVideo, setHasRecordedVideo] = useState(false)

  // =========================================================================
  // Section 7: Camera Bubble Refs (摄像头气泡)
  // =========================================================================
  const cameraVideoRef = useRef<HTMLVideoElement>(null)
  const cameraStreamRef = useRef<MediaStream | null>(null)
  const [cameraBubblePos, setCameraBubblePos] = useState({ x: 50, y: 50 })
  const cameraBubbleSize = useRef({ width: 120, height: 90 })

  // Keep cameraStreamRef in sync with cameraStream
  useEffect(() => {
    cameraStreamRef.current = cameraStream
  }, [cameraStream])

  // Initialize analytics
  useEffect(() => {
    const posthogKey = import.meta.env.VITE_POSTHOG_API_KEY
    if (posthogKey) {
      analytics.init(posthogKey)
    }
  }, [])

  // Track analytics when user changes
  useEffect(() => {
    if (!authLoading && user) {
      analytics.identify(user.id, { email: user.email })
    }
  }, [authLoading, user])

  // Keyboard navigation for slides
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not in an input/textarea
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return
      }

      // Only handle if on editor page
      if (currentPage !== "editor") return

      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault()
        goToSlide(Math.max(0, currentSlideIndex - 1))
      } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault()
        goToSlide(Math.min(slides.length - 1, currentSlideIndex + 1))
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentPage, currentSlideIndex, slides.length, goToSlide])

  // =========================================================================
  // Section 8: Recording Event Handlers (录制事件处理)
  // =========================================================================
  // 数据流: handleRecord → startPreview → RecordingPreview 显示
  //          handleStartRecording → startRecording → CanvasRecorder 开始捕获
  //          handleStop → stopRecording → 返回 Blob

  // Handle cancel from preview state
  const handleCancelRecording = useCallback(() => {
    cancelPreview()
  }, [cancelPreview])

  // Handle start recording from preview state — 3-2-1 countdown then record
  const handleStartRecording = useCallback(async () => {
    try {
      for (let i = 3; i >= 1; i--) {
        setCountdownValue(i)
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
      setCountdownValue(null)
      await startRecording()
    } catch (err) {
      setCountdownValue(null)
      console.error("Failed to start recording:", err)
    }
  }, [startRecording])

  // Handle record button click - enter preview state
  const handleRecord = useCallback(async () => {
    // Focus on the first slide
    goToSlide(0)

    // Start camera and mic if not already running
    let cameraStreamToUse = cameraStream
    let micStreamToUse = micStream

    try {
      if (!cameraStreamToUse) {
        cameraStreamToUse = await startCamera()
      }
    } catch (err) {
      console.error("Failed to start camera:", err)
    }

    try {
      if (!micStreamToUse) {
        micStreamToUse = await startMic()
      }
    } catch (err) {
      console.error("Failed to start mic:", err)
    }

    // Get current slide dimensions
    const currentSlideDims = frameDimensions[currentSlideIndex] || { width: customWidth, height: customHeight }

    // Set up Excalidraw canvas reference
    const excalidrawCanvas = document.querySelector(".excalidraw-canvas canvas") as HTMLCanvasElement

    // Use avatar stream if avatar is enabled, otherwise use camera stream
    const streamForRecording = avatarEnabled && avatarStream ? avatarStream : cameraStreamToUse

    // Set up camera bubble state - default to bottom-right of preview area
    // Position camera bubble at bottom-right of the viewport (inside slide area)
    const viewportW = window.innerWidth
    const viewportH = window.innerHeight
    const bubbleW = cameraBubbleSize.current.width
    const bubbleH = cameraBubbleSize.current.height
    const defaultPos = {
      x: viewportW - bubbleW - 80,
      y: viewportH - bubbleH - 80,
    }
    setCameraBubblePos(defaultPos)

    const cameraBubbleConfig = {
      stream: streamForRecording,
      position: defaultPos,
      size: cameraBubbleSize.current,
      shape: cameraShape === "circle" ? "circle" as const : "rounded-rect" as const,
      borderRadius: borderRadius,
      borderColor: "#ffffff",
      borderWidth: 3,
    }

    // Agent能力：使用 startPreviewWithFrameDims，内部自动计算 1.1x 尺寸
    await startPreviewWithFrameDims({
      frameWidth: currentSlideDims.width,
      frameHeight: currentSlideDims.height,
      cameraBubble: cameraBubbleConfig,
      canvas: excalidrawCanvas,
      cameraVideo: cameraVideoRef.current,
      audioStream: micStreamToUse,
      beautyEnabled,
      beautySettings,
      avatarEnabled,
      avatarStream,
      projectId: project?.id,
    })
  }, [cameraStream, micStream, startCamera, startMic, startPreviewWithFrameDims, frameDimensions, currentSlideIndex, customWidth, customHeight, avatarEnabled, avatarStream, beautyEnabled, beautySettings, cameraShape, borderRadius, cameraBubbleSize, project, goToSlide])

  const handleStop = useCallback(async () => {
    await stopRecording()
    setHasRecordedVideo(true)
    setShowSaveToast(true)
  }, [stopRecording])

  // Handle pause recording
  const handlePauseRecording = useCallback(() => {
    pauseRecording()
  }, [pauseRecording])

  // Handle resume recording
  const handleResumeRecording = useCallback(() => {
    resumeRecording()
  }, [resumeRecording])

  // =========================================================================
  // Section 10: Device Toggle Handlers (设备开关处理)
  // =========================================================================
  // 摄像头和麦克风的开关控制，委托给 MediaAgent 和 AvatarAgent

  // Toggle camera on/off (for control bar icon)
  // Agent能力：摄像头开关，同时处理 avatar 联动
  const handleToggleCamera = useCallback(async () => {
    // 获取当前摄像头流（同步）
    const currentStream = cameraStream

    // 调用 MediaAgent 切换摄像头状态
    await toggleCamera()

    // 如果 avatar 启用，需要同步处理 avatar 的启动/停止
    if (avatarEnabled) {
      if (currentStream) {
        // 摄像头之前是开的，说明现在要关掉，停止 avatar
        stopAvatar()
      } else {
        // 摄像头之前是关的，说明现在要开启，启动 avatar
        const newStream = await startCamera()
        if (avatarEnabled) {
          startAvatar(newStream)
        }
      }
    }

    // 更新 camera bubble state
    const newStream = cameraStreamRef.current
    setCameraBubbleState({
      stream: newStream,
      position: cameraBubblePos,
      size: cameraBubbleSize.current,
      shape: cameraShape === "circle" ? "circle" : "rounded-rect",
      borderRadius: borderRadius,
      borderColor: "#ffffff",
      borderWidth: 3,
    })
  }, [cameraStream, toggleCamera, avatarEnabled, stopAvatar, startCamera, startAvatar, setCameraBubbleState, cameraShape, borderRadius])

  // Initialize camera and mic on mount (default enabled)
  useEffect(() => {
    const initMedia = async () => {
      if (isCameraEnabled && !cameraStream) {
        try {
          const stream = await startCamera()
          setCameraBubbleState({
            stream: stream,
            position: cameraBubblePos,
            size: cameraBubbleSize.current,
            shape: cameraShape === "circle" ? "circle" : "rounded-rect",
            borderRadius: borderRadius,
            borderColor: "#ffffff",
            borderWidth: 3,
          })
        } catch (err) {
          console.error("Failed to start camera on init:", err)
        }
      }
      if (isMicEnabled) {
        try {
          await startMic()
        } catch (err) {
          console.error("Failed to start mic on init:", err)
        }
      }
    }
    initMedia()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // =========================================================================
  // Section 12: Auth & Project Handlers (认证 & 项目)
  // =========================================================================
  // 登录、登出、项目创建/打开

  // Auth handlers
  const handleAuthSuccess = useCallback(() => {
    setCurrentPage("dashboard")
  }, [])

  const handleSignOut = useCallback(async () => {
    const { signOut } = await import("@/services/api/supabase").then(m => m.auth)
    await signOut()
    setCurrentPage("login")
  }, [])

  // Project handlers
  const handleCreateProject = useCallback(async () => {
    const project = await createProject("Untitled Project")
    if (project) {
      localStorage.setItem("lastProjectId", project.id)
    }
    setCurrentPage("editor")
    analytics.trackProjectCreated(user?.id || "unknown", project?.id || "unknown")
  }, [createProject, user])

  const handleOpenProject = useCallback(async (projectId: string) => {
    await loadProject(projectId)
    localStorage.setItem("lastProjectId", projectId)
    setCurrentPage("editor")
  }, [loadProject])

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4 rounded-full bg-primary animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Auth callback route - check both pathname and hash for OAuth callback
  const hasAuthHash = window.location.hash.includes("access_token") || window.location.hash.includes("error=")
  if (window.location.pathname === "/auth/callback" || hasAuthHash) {
    return <AuthCallbackPage />
  }

  // Render pages
  if (currentPage === "login" || (!user && !isLocalMode && currentPage !== "signup")) {
    return <LoginPage onSignUp={() => setCurrentPage("signup")} onSuccess={handleAuthSuccess} />
  }

  if (currentPage === "signup") {
    return <SignUpPage onSignIn={() => setCurrentPage("login")} onSuccess={handleAuthSuccess} />
  }

  if (currentPage === "dashboard") {
    return (
      <DashboardPage
        onOpenProject={handleOpenProject}
        onCreateProject={handleCreateProject}
        onSignOut={handleSignOut}
      />
    )
  }

  // Editor page
  const isRecordingActive = recordingState === "recording" || recordingState === "paused"

  return (
    <>
      <MainLayout
        header={null}
        canvas={
          <div className="relative w-full h-full bg-[#f5f5f5] overflow-hidden">
            {/* Excalidraw canvas */}
            <ExcalidrawCanvas
              key={slides[currentSlideIndex]?.id}
              elements={(slides[currentSlideIndex]?.content?.elements || []).map((el: any) => ({
                ...el,
                frameId: `slide-frame-${currentSlideIndex}`,
              }))}
              slideFrameElements={frameElements}
              onElementsChange={handleElementsChange}
              onViewportChange={undefined}
              onSlideFrameClick={(frameIndex) => {
                if (frameIndex >= 0 && frameIndex < slides.length) {
                  goToSlide(frameIndex)
                }
              }}
              scrollToIndex={currentSlideIndex}
              focusMode={isPreviewing || isRecordingActive}
            />

            {/* Camera Bubble */}
            <CameraBubble
              stream={isCameraEnabled && !isRecordingActive ? (avatarEnabled && avatarStream ? avatarStream : cameraStream) : null}
              position={cameraBubblePos}
              size={cameraBubbleSize.current}
              shape={cameraShape === "circle" ? "circle" : "rounded-rect"}
              borderColor="#ffffff"
              borderWidth={3}
              borderRadius={borderRadius}
              videoRef={cameraVideoRef}
            />

            {/* Recording overlay border */}
            {(isPreviewing || isRecordingActive) && (
              <div className="absolute inset-0 z-20 pointer-events-none" style={{
                border: isRecordingActive ? "3px dashed #ef4444" : "3px solid #22c55e",
                borderRadius: 4,
              }}>
                {/* Resize handles — only during preview */}
                {isPreviewing && (
                  <>
                    {[
                      { top: -5, left: -5 },
                      { top: -5, right: -5 },
                      { bottom: -5, left: -5 },
                      { bottom: -5, right: -5 },
                    ].map((style, i) => (
                      <div key={`corner-${i}`} className="absolute" style={{ ...style, width: 10, height: 10, borderRadius: "50%", backgroundColor: "#22c55e" }} />
                    ))}
                    {[
                      { top: -5, left: "50%", transform: "translateX(-50%)" },
                      { bottom: -5, left: "50%", transform: "translateX(-50%)" },
                      { top: "50%", left: -5, transform: "translateY(-50%)" },
                      { top: "50%", right: -5, transform: "translateY(-50%)" },
                    ].map((style, i) => (
                      <div key={`mid-${i}`} className="absolute" style={{ ...style, width: 10, height: 10, borderRadius: "50%", backgroundColor: "#22c55e" }} />
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Slide mode hint during preview */}
            {isPreviewing && !countdownValue && slides.length > 0 && (
              <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                <div className="bg-gray-800/80 text-white text-sm px-6 py-3 rounded-xl backdrop-blur-sm text-center whitespace-nowrap">
                  幻灯片模式：录制时按 ←→ 键切换幻灯片
                </div>
              </div>
            )}

            {/* REC badge — top-left, matching original zh-26b */}
            {isRecordingActive && (
              <div className="absolute z-40" style={{ top: 55, left: 80 }}>
                <div className="flex items-center gap-1.5" style={{
                  backgroundColor: "#ef4444",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: '"DM Sans", sans-serif',
                  padding: "6px 14px",
                  borderRadius: 8,
                }}>
                  <span className="animate-pulse" style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "white", display: "inline-block" }} />
                  REC
                </div>
              </div>
            )}

            {/* Countdown overlay: 3-2-1 */}
            {countdownValue !== null && (
              <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                <div style={{
                  fontSize: 120,
                  fontWeight: 700,
                  fontFamily: '"DM Sans", sans-serif',
                  color: "rgba(0,0,0,0.6)",
                  lineHeight: 1,
                  animation: "countdown-pop 1s ease-out",
                }}>
                  {countdownValue}
                </div>
              </div>
            )}

            {/* TopBar - right top controls */}
            <TopBar
              recordingState={recordingState}
              duration={duration}
              isPreviewing={isPreviewing}
              onSettingsOpen={() => setSettingsOpen(true)}
              onTeleprompterToggle={() => setTeleprompterOpen(v => !v)}
              teleprompterOpen={teleprompterOpen}
              onRecord={handleRecord}
              onStartRecording={handleStartRecording}
              onCancel={handleCancelRecording}
              onPause={handlePauseRecording}
              onResume={handleResumeRecording}
              onStop={handleStop}
              showMediaLibrary={hasRecordedVideo && !isRecordingActive && !isPreviewing}
            />

            {/* "素材库" button — appears after recording, top-right outside control group */}
            {hasRecordedVideo && !isRecordingActive && !isPreviewing && (
              <button
                className="fixed z-40 flex items-center gap-1.5 transition-colors hover:text-gray-900"
                style={{
                  top: 28,
                  right: 15,
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: '"DM Sans", sans-serif',
                  color: "rgb(68, 64, 60)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <line x1="3" x2="21" y1="9" y2="9" />
                  <line x1="9" x2="9" y1="21" y2="9" />
                </svg>
                素材库
              </button>
            )}

            {/* Teleprompter Panel */}
            <TeleprompterPanel
              open={teleprompterOpen}
              onClose={() => setTeleprompterOpen(false)}
            />

            {/* Slide Panel - right side */}
            {slides.length > 0 ? (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 z-30">
                <div className="flex flex-col items-center gap-1.5 py-3 px-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200">
                  <div className="text-[10px] font-medium text-gray-400 mb-0.5 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                      <line x1="3" x2="21" y1="9" y2="9" />
                      <line x1="9" x2="9" y1="21" y2="9" />
                    </svg>
                    {isRecordingActive ? `${currentSlideIndex + 1} / ${slides.length}` : "幻灯片"}
                  </div>
                  {slides.map((slide, index) => (
                    <div key={slide.id} className="relative group">
                      <button
                        onClick={() => goToSlide(index)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all text-sm font-medium ${
                          currentSlideIndex === index
                            ? "bg-gray-900 text-white shadow-md"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                        title={slide.name || `Slide ${index + 1}`}
                      >
                        {index + 1}
                      </button>
                      {/* Delete button - hidden during recording */}
                      {!isRecordingActive && !isPreviewing && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteSlide(slide.id)
                          }}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[8px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600 z-10 leading-none shadow-sm"
                          title="删除幻灯片"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                  {/* Add slide button - hidden during recording */}
                  {!isRecordingActive && !isPreviewing && (
                    <button
                      onClick={addSlide}
                      className="w-10 h-10 rounded-lg border border-dashed border-gray-300 hover:border-gray-500 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                      title="添加幻灯片"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* No slides yet - show tooltip + add button matching original */
              <div className="absolute right-2 top-1/2 -translate-y-1/2 z-30 flex items-center gap-2">
                <div style={{
                  backgroundColor: "rgb(41, 37, 36)",
                  color: "white",
                  borderRadius: 12,
                  padding: "16px 20px",
                  maxWidth: 200,
                  fontSize: 13,
                  lineHeight: 1.5,
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>幻灯片模式</div>
                  <div style={{ color: "rgb(168, 162, 158)", fontSize: 12 }}>
                    创建幻灯片进行分页演示。每张幻灯片是一个固定画框，只有画框内的内容会被录制。
                  </div>
                </div>
                <button
                  onClick={addSlide}
                  className="flex items-center justify-center transition-colors hover:border-gray-500 hover:text-gray-600"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    border: "1px dashed rgb(168, 162, 158)",
                    color: "rgb(168, 162, 158)",
                    backgroundColor: "transparent",
                    fontSize: 18,
                  }}
                  title="添加幻灯片"
                >
                  +
                </button>
              </div>
            )}
          </div>
        }
      />

      {/* Settings Modal */}
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        aspectRatio={aspectRatio}
        onAspectRatioChange={(ratio, width, height) => {
          setAspectRatio(ratio)
          if (width > 0 && height > 0) setCustomSize(width, height)
        }}
        cameraEnabled={isCameraEnabled}
        onCameraToggle={handleToggleCamera}
        cameraSize={cameraSize}
        onCameraSizeChange={setCameraSize}
        cameraShape={cameraShape}
        onCameraShapeChange={setCameraShape}
        canvasMargin={canvasMargin}
        onCanvasMarginChange={setCanvasMargin}
        borderRadius={borderRadius}
        onBorderRadiusChange={setBorderRadius}
        cursorHighlight={cursorHighlight}
        onCursorHighlightToggle={() => setCursorHighlight(v => !v)}
        cursorColor={cursorColor}
        onCursorColorChange={setCursorColor}
        background={background}
        onBackgroundChange={setBackground}
      />

      {/* Save toast — matches original zh-29-after-stop */}
      {showSaveToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4" style={{
          backgroundColor: "rgb(28, 25, 23)",
          color: "white",
          borderRadius: 16,
          padding: "16px 20px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          fontFamily: '"DM Sans", sans-serif',
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>视频已保存（带水印）</div>
            <div style={{ fontSize: 12, color: "rgb(168, 162, 158)", marginTop: 2 }}>仅需 $20 即可永久去除水印</div>
          </div>
          <button
            className="transition-colors hover:bg-gray-100"
            style={{
              backgroundColor: "white",
              color: "rgb(28, 25, 23)",
              fontSize: 13,
              fontWeight: 600,
              padding: "8px 16px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            升级
          </button>
          <button
            onClick={() => setShowSaveToast(false)}
            style={{ color: "rgb(168, 162, 158)", fontSize: 18, cursor: "pointer", background: "none", border: "none", padding: "0 4px" }}
          >
            ✕
          </button>
        </div>
      )}
    </>
  )
}

export default App
