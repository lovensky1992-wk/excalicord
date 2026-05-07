import { useState, useEffect, useCallback } from "react"

const WALLPAPERS = [
  { id: "cotton-candy", name: "Cotton Candy", category: "柔和", value: "url(/backdrops/cotton-candy.jpg)", thumb: "url(/backdrops/thumbs/cotton-candy.jpg)" },
  { id: "morning-mist", name: "Morning Mist", category: "柔和", value: "url(/backdrops/morning-mist.jpg)", thumb: "url(/backdrops/thumbs/morning-mist.jpg)" },
  { id: "ocean-lime", name: "Ocean Lime", category: "鲜艳", value: "url(/backdrops/ocean-lime.jpg)", thumb: "url(/backdrops/thumbs/ocean-lime.jpg)" },
  { id: "sunset-rainbow", name: "Sunset Rainbow", category: "鲜艳", value: "url(/backdrops/sunset-rainbow.jpg)", thumb: "url(/backdrops/thumbs/sunset-rainbow.jpg)" },
  { id: "tropical-burst", name: "Tropical Burst", category: "鲜艳", value: "url(/backdrops/tropical-burst.jpg)", thumb: "url(/backdrops/thumbs/tropical-burst.jpg)" },
  { id: "paper-petals", name: "Paper Petals", category: "鲜艳", value: "url(/backdrops/paper-petals.jpg)", thumb: "url(/backdrops/thumbs/paper-petals.jpg)" },
  { id: "soft-prism", name: "Soft Prism", category: "柔和", value: "url(/backdrops/soft-prism.jpg)", thumb: "url(/backdrops/thumbs/soft-prism.jpg)" },
  { id: "lemon-lavender", name: "Lemon Lavender", category: "柔和", value: "url(/backdrops/lemon-lavender.jpg)", thumb: "url(/backdrops/thumbs/lemon-lavender.jpg)" },
  { id: "rose-garden", name: "Rose Garden", category: "柔和", value: "url(/backdrops/rose-garden.jpg)", thumb: "url(/backdrops/thumbs/rose-garden.jpg)" },
  { id: "neon-wave", name: "Neon Wave", category: "深色", value: "url(/backdrops/neon-wave.jpg)", thumb: "url(/backdrops/thumbs/neon-wave.jpg)" },
  { id: "midnight-glow", name: "Midnight Glow", category: "深色", value: "url(/backdrops/midnight-glow.jpg)", thumb: "url(/backdrops/thumbs/midnight-glow.jpg)" },
  { id: "northern-lights", name: "Northern Lights", category: "深色", value: "url(/backdrops/northern-lights.jpg)", thumb: "url(/backdrops/thumbs/northern-lights.jpg)" },
  { id: "alpine-moonrise", name: "Alpine Moonrise", category: "自然", value: "url(/backdrops/alpine-moonrise.jpg)", thumb: "url(/backdrops/thumbs/alpine-moonrise.jpg)" },
  { id: "golden-hour", name: "Golden Hour", category: "自然", value: "url(/backdrops/golden-hour.jpg)", thumb: "url(/backdrops/thumbs/golden-hour.jpg)" },
  { id: "tropical-leaves", name: "Tropical Leaves", category: "自然", value: "url(/backdrops/tropical-leaves.jpg)", thumb: "url(/backdrops/thumbs/tropical-leaves.jpg)" },
  { id: "fresh-leaves", name: "Fresh Leaves", category: "自然", value: "url(/backdrops/fresh-leaves.jpg)", thumb: "url(/backdrops/thumbs/fresh-leaves.jpg)" },
  { id: "eucalyptus", name: "Eucalyptus", category: "自然", value: "url(/backdrops/eucalyptus.jpg)", thumb: "url(/backdrops/thumbs/eucalyptus.jpg)" },
  { id: "blue-florals", name: "Blue Florals", category: "自然", value: "url(/backdrops/blue-florals.jpg)", thumb: "url(/backdrops/thumbs/blue-florals.jpg)" },
  { id: "nature-mountain-lake", name: "Mountain Lake", category: "自然", value: "url(/backdrops/nature-mountain-lake.jpg)", thumb: "url(/backdrops/thumbs/nature-mountain-lake.jpg)" },
  { id: "flowers-blue-orange", name: "Blue Orange Flowers", category: "自然", value: "url(/backdrops/flowers-blue-orange.jpg)", thumb: "url(/backdrops/thumbs/flowers-blue-orange.jpg)" },
  { id: "flowers-scattered-white", name: "Scattered Flowers", category: "自然", value: "url(/backdrops/flowers-scattered-white.jpg)", thumb: "url(/backdrops/thumbs/flowers-scattered-white.jpg)" },
  { id: "flowers-pink-dark", name: "Pink Flowers Dark", category: "自然", value: "url(/backdrops/flowers-pink-dark.jpg)", thumb: "url(/backdrops/thumbs/flowers-pink-dark.jpg)" },
  { id: "velvet-green", name: "Green Velvet", category: "鲜艳", value: "url(/backdrops/velvet-green.jpg)", thumb: "url(/backdrops/thumbs/velvet-green.jpg)" },
  { id: "fabric-teal", name: "Teal Fabric", category: "鲜艳", value: "url(/backdrops/fabric-teal.jpg)", thumb: "url(/backdrops/thumbs/fabric-teal.jpg)" },
  { id: "brick-red-wall", name: "Red Brick", category: "鲜艳", value: "url(/backdrops/brick-red-wall.jpg)", thumb: "url(/backdrops/thumbs/brick-red-wall.jpg)" },
  { id: "paper-crumpled-white", name: "Crumpled Paper", category: "柔和", value: "url(/backdrops/paper-crumpled-white.jpg)", thumb: "url(/backdrops/thumbs/paper-crumpled-white.jpg)" },
  { id: "texture-orange-diagonal", name: "Orange Texture", category: "鲜艳", value: "url(/backdrops/texture-orange-diagonal.jpg)", thumb: "url(/backdrops/thumbs/texture-orange-diagonal.jpg)" },
  { id: "geometric-teal-kaleidoscope", name: "Teal Kaleidoscope", category: "鲜艳", value: "url(/backdrops/geometric-teal-kaleidoscope.jpg)", thumb: "url(/backdrops/thumbs/geometric-teal-kaleidoscope.jpg)" },
  { id: "geometric-blue-hexagons", name: "Blue Hexagons", category: "柔和", value: "url(/backdrops/geometric-blue-hexagons.jpg)", thumb: "url(/backdrops/thumbs/geometric-blue-hexagons.jpg)" },
  { id: "geometric-pink-blue-triangles", name: "Pink Blue Triangles", category: "柔和", value: "url(/backdrops/geometric-pink-blue-triangles.jpg)", thumb: "url(/backdrops/thumbs/geometric-pink-blue-triangles.jpg)" },
]

const CURSOR_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899"]

const ASPECT_RATIOS = [
  { ratio: "16:9", label: "16:9", sublabel: "YouTube", width: 1920, height: 1080 },
  { ratio: "4:3", label: "4:3", sublabel: "经典", width: 1440, height: 1080 },
  { ratio: "3:4", label: "3:4", sublabel: "小红书", width: 1080, height: 1440 },
  { ratio: "9:16", label: "9:16", sublabel: "抖音", width: 1080, height: 1920 },
  { ratio: "1:1", label: "1:1", sublabel: "正方形", width: 1080, height: 1080 },
  { ratio: "custom", label: "Custom", sublabel: "自定义", width: 0, height: 0 },
]

const CATEGORIES = ["全部", "鲜艳", "柔和", "深色", "自然"]

const sectionHeaderStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "rgb(168, 162, 158)",
  letterSpacing: "0.88px",
  textTransform: "uppercase",
  marginBottom: 14,
  lineHeight: "16.5px",
}

const sliderLabelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "rgb(168, 162, 158)",
  marginTop: 8,
  display: "flex",
  justifyContent: "space-between",
}

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  aspectRatio: string
  onAspectRatioChange: (ratio: string, width: number, height: number) => void
  cameraEnabled: boolean
  onCameraToggle: () => void
  cameraSize: number
  onCameraSizeChange: (size: number) => void
  cameraShape: "circle" | "square"
  onCameraShapeChange: (shape: "circle" | "square") => void
  canvasMargin: number
  onCanvasMarginChange: (margin: number) => void
  borderRadius: number
  onBorderRadiusChange: (radius: number) => void
  cursorHighlight: boolean
  onCursorHighlightToggle: () => void
  cursorColor: string
  onCursorColorChange: (color: string) => void
  background: string | null
  onBackgroundChange: (bg: string | null) => void
}

export function SettingsModal({
  open,
  onClose,
  aspectRatio,
  onAspectRatioChange,
  cameraEnabled,
  onCameraToggle,
  cameraSize,
  onCameraSizeChange,
  cameraShape,
  onCameraShapeChange,
  canvasMargin,
  onCanvasMarginChange,
  borderRadius,
  onBorderRadiusChange,
  cursorHighlight,
  onCursorHighlightToggle,
  cursorColor,
  onCursorColorChange,
  background,
  onBackgroundChange,
}: SettingsModalProps) {
  const [category, setCategory] = useState("全部")
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([])
  const [selectedMic, setSelectedMic] = useState("")

  useEffect(() => {
    if (!open) return
    navigator.mediaDevices?.enumerateDevices().then(devices => {
      const mics = devices.filter(d => d.kind === "audioinput")
      setMicrophones(mics)
      if (mics.length > 0 && !selectedMic) setSelectedMic(mics[0].deviceId)
    }).catch(() => {})
  }, [open, selectedMic])

  const filteredWallpapers = category === "全部"
    ? WALLPAPERS
    : WALLPAPERS.filter(w => w.category === category)

  const randomWallpaper = useCallback(() => {
    const wp = WALLPAPERS[Math.floor(Math.random() * WALLPAPERS.length)]
    onBackgroundChange(wp.value)
  }, [onBackgroundChange])

  const getPreviewDims = () => {
    const found = ASPECT_RATIOS.find(a => a.ratio === aspectRatio)
    if (!found || found.width === 0) return { w: 255, h: 143 }
    const maxW = 255, maxH = 320
    const scale = Math.min(maxW / found.width, maxH / found.height)
    return { w: Math.round(found.width * scale), h: Math.round(found.height * scale) }
  }

  if (!open) return null

  const previewDims = getPreviewDims()

  return (
    <div
      className="settings-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(28, 25, 23, 0.75)",
      }}
    >
      {/* Backdrop click handler */}
      <div style={{ position: "absolute", inset: 0 }} onClick={onClose} />

      {/* Panel */}
      <div
        className="settings-panel"
        style={{
          position: "relative",
          display: "flex",
          backgroundColor: "rgb(254, 252, 249)",
          borderRadius: 20,
          maxWidth: 820,
          maxHeight: 765,
          width: "100%",
          overflow: "hidden",
          boxShadow: "rgba(0, 0, 0, 0.04) 0px 0px 0px 1px, rgba(28, 25, 23, 0.35) 0px 24px 80px 0px, rgba(28, 25, 23, 0.15) 0px 8px 24px 0px",
          color: "rgb(28, 25, 23)",
        }}
      >
        {/* Left: Preview Column */}
        <div
          className="settings-preview-column"
          style={{
            width: 320,
            flexShrink: 0,
            backgroundColor: "rgb(245, 245, 244)",
            borderRadius: "20px 0 0 20px",
            padding: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span
              className="settings-preview-label"
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: "rgb(168, 162, 158)",
                letterSpacing: "0.55px",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              预览
            </span>
            <div
              className="settings-preview-frame"
              style={{
                width: previewDims.w,
                height: previewDims.h,
                borderRadius: Math.min(borderRadius, 6),
                boxShadow: "rgba(0, 0, 0, 0.08) 0px 0px 0px 1px inset",
                overflow: "hidden",
                position: "relative",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "flex-end",
                padding: 8,
                backgroundImage: background || undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundColor: background ? undefined : "#ffffff",
              }}
            >
              {cameraEnabled && (
                <div
                  style={{
                    width: Math.round(cameraSize * 0.15),
                    height: Math.round(cameraSize * 0.15),
                    borderRadius: cameraShape === "circle" ? "50%" : "4px",
                    backgroundColor: "rgb(214, 211, 209)",
                    border: "2px solid white",
                  }}
                />
              )}
              {cursorHighlight && (
                <div
                  style={{
                    position: "absolute",
                    left: "40%",
                    top: "35%",
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    backgroundColor: cursorColor,
                    opacity: 0.4,
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right: Settings Content */}
        <div
          className="settings-content"
          style={{
            flex: 1,
            padding: 32,
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {/* Header */}
          <div
            className="settings-header"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: 20,
              marginBottom: 28,
              borderBottom: "1px solid rgb(231, 229, 228)",
            }}
          >
            <h2 style={{
              fontSize: 24,
              fontWeight: 600,
              fontFamily: "Fraunces, Georgia, serif",
              letterSpacing: "-0.48px",
              lineHeight: "36px",
              margin: 0,
              color: "rgb(28, 25, 23)",
            }}>
              录制设置
            </h2>
            <button
              onClick={onClose}
              className="close-btn"
              style={{
                width: 36,
                height: 36,
                padding: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 10,
                backgroundColor: "rgb(245, 245, 244)",
                color: "rgb(120, 113, 108)",
                border: "none",
                cursor: "pointer",
                fontSize: 20,
              }}
            >
              ×
            </button>
          </div>

          {/* Aspect Ratio */}
          <div className="settings-section" style={{ marginBottom: 28 }}>
            <h3 style={sectionHeaderStyle}>画面比例</h3>
            <div className="aspect-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {ASPECT_RATIOS.map(ar => {
                const isActive = aspectRatio === ar.ratio
                return (
                  <button
                    key={ar.ratio}
                    onClick={() => onAspectRatioChange(ar.ratio, ar.width, ar.height)}
                    className={`aspect-btn${isActive ? " active" : ""}`}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 2,
                      padding: "14px 8px",
                      borderRadius: 12,
                      border: isActive ? "1px solid rgb(41, 37, 36)" : "1px solid rgb(231, 229, 228)",
                      backgroundColor: isActive ? "rgb(41, 37, 36)" : "rgb(255, 255, 255)",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    <span style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: isActive ? "rgb(255, 255, 255)" : "rgb(28, 25, 23)",
                    }}>
                      {ar.label}
                    </span>
                    <span style={{
                      fontSize: 11,
                      color: isActive ? "rgb(168, 162, 158)" : "rgb(168, 162, 158)",
                    }}>
                      {ar.sublabel}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Background */}
          <div className="settings-section" style={{ marginBottom: 28 }}>
            <h3 style={sectionHeaderStyle}>背景</h3>
            <div className="bg-category-tabs" style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {CATEGORIES.map(cat => {
                const isActive = category === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`bg-category-tab${isActive ? " active" : ""}`}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: 500,
                      border: isActive ? "1px solid rgb(41, 37, 36)" : "1px solid rgb(231, 229, 228)",
                      backgroundColor: isActive ? "rgb(41, 37, 36)" : "rgb(255, 255, 255)",
                      color: isActive ? "rgb(255, 255, 255)" : "rgb(120, 113, 108)",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {cat}
                  </button>
                )
              })}
            </div>
            <button
              onClick={randomWallpaper}
              className="random-bg-btn"
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 10,
                border: "1px solid rgb(231, 229, 228)",
                backgroundColor: "rgb(250, 250, 249)",
                color: "rgb(68, 64, 60)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                marginBottom: 14,
                textAlign: "center",
              }}
            >
              ✨ 随机选择壁纸
            </button>
            <div className="gradient-grid" style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 14,
              maxHeight: 280,
              overflow: "auto",
              padding: 8,
            }}>
              {filteredWallpapers.map(wp => {
                const isSelected = background === wp.value
                return (
                  <button
                    key={wp.id}
                    onClick={() => onBackgroundChange(wp.value)}
                    className={`gradient-btn${isSelected ? " active" : ""}`}
                    style={{
                      width: "100%",
                      paddingBottom: "100%",
                      borderRadius: 12,
                      border: "none",
                      backgroundImage: wp.thumb,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden",
                      boxShadow: isSelected
                        ? "rgba(255, 255, 255, 0.95) 0px 0px 0px 3px inset, rgba(0, 0, 0, 0.12) 0px 2px 8px 0px inset, rgba(0, 0, 0, 0.08) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 4px 12px 0px"
                        : "rgba(0, 0, 0, 0.08) 0px 0px 0px 1px",
                    }}
                    title={wp.name}
                  >
                    {isSelected && (
                      <span style={{
                        position: "absolute",
                        bottom: 6,
                        right: 6,
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        backgroundColor: "rgb(34, 197, 94)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Border Radius */}
          <div className="settings-section" style={{ marginBottom: 28 }}>
            <h3 style={sectionHeaderStyle}>圆角半径: {borderRadius}PX</h3>
            <input
              type="range"
              min="0"
              max="40"
              value={borderRadius}
              onChange={e => onBorderRadiusChange(parseInt(e.target.value))}
              className="slider"
              style={{ width: "100%", accentColor: "rgb(41, 37, 36)" }}
            />
            <div style={sliderLabelStyle}>
              <span>直角</span>
              <span>圆角</span>
            </div>
          </div>

          {/* Camera */}
          <div className="settings-section" style={{ marginBottom: 28 }}>
            <h3 style={sectionHeaderStyle}>摄像头</h3>
            <label
              className="toggle-label"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                cursor: "pointer",
                fontSize: 14,
                color: "rgb(68, 64, 60)",
              }}
            >
              <button
                onClick={onCameraToggle}
                className="toggle-switch"
                style={{
                  position: "relative",
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: cameraEnabled ? "rgb(41, 37, 36)" : "rgb(214, 211, 209)",
                  border: "none",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                  flexShrink: 0,
                }}
              >
                <span style={{
                  position: "absolute",
                  top: 2,
                  left: cameraEnabled ? 22 : 2,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  backgroundColor: "white",
                  transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                }} />
              </button>
              录制时显示摄像头画面
            </label>

            {cameraEnabled && (
              <div style={{ marginTop: 16 }}>
                <div style={{ ...sectionHeaderStyle, marginBottom: 10 }}>大小: {cameraSize}px</div>
                <input
                  type="range"
                  min="100"
                  max="300"
                  value={cameraSize}
                  onChange={e => onCameraSizeChange(parseInt(e.target.value))}
                  className="slider"
                  style={{ width: "100%", accentColor: "rgb(41, 37, 36)" }}
                />
                <div style={sliderLabelStyle}>
                  <span>小</span>
                  <span>大</span>
                </div>

                <div style={{ ...sectionHeaderStyle, marginTop: 16, marginBottom: 10 }}>形状</div>
                <div className="webcam-shape-picker" style={{ display: "flex", gap: 8 }}>
                  {(["circle", "square"] as const).map(shape => {
                    const isActive = cameraShape === shape
                    return (
                      <button
                        key={shape}
                        onClick={() => onCameraShapeChange(shape)}
                        className={`shape-option${isActive ? " active" : ""}`}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          padding: "8px 12px",
                          borderRadius: 10,
                          fontSize: 12,
                          fontWeight: 500,
                          border: isActive ? "1px solid rgb(41, 37, 36)" : "1px solid rgb(231, 229, 228)",
                          backgroundColor: isActive ? "rgb(41, 37, 36)" : "rgb(250, 250, 249)",
                          color: isActive ? "rgb(254, 252, 249)" : "rgb(120, 113, 108)",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        <div style={{
                          width: 16,
                          height: 16,
                          borderRadius: shape === "circle" ? "50%" : 3,
                          border: `2px solid ${isActive ? "rgb(254, 252, 249)" : "rgb(120, 113, 108)"}`,
                        }} />
                        {shape === "circle" ? "圆形" : "方形"}
                      </button>
                    )
                  })}
                </div>

                <div style={{ ...sectionHeaderStyle, marginTop: 16, marginBottom: 10 }}>麦克风</div>
                <select
                  value={selectedMic}
                  onChange={e => setSelectedMic(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1px solid rgb(231, 229, 228)",
                    fontSize: 13,
                    color: "rgb(68, 64, 60)",
                    backgroundColor: "rgb(255, 255, 255)",
                  }}
                >
                  {microphones.map(mic => (
                    <option key={mic.deviceId} value={mic.deviceId}>
                      {mic.label || `Microphone ${mic.deviceId.slice(0, 8)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Canvas Margin */}
          <div className="settings-section" style={{ marginBottom: 28 }}>
            <h3 style={sectionHeaderStyle}>画布边距: {canvasMargin}PX</h3>
            <input
              type="range"
              min="0"
              max="120"
              value={canvasMargin}
              onChange={e => onCanvasMarginChange(parseInt(e.target.value))}
              className="slider"
              style={{ width: "100%", accentColor: "rgb(41, 37, 36)" }}
            />
            <div style={sliderLabelStyle}>
              <span>无</span>
              <span>大</span>
            </div>
          </div>

          {/* Cursor Effect */}
          <div className="settings-section" style={{ marginBottom: 28 }}>
            <h3 style={sectionHeaderStyle}>鼠标光标效果</h3>
            <label
              className="toggle-label"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                cursor: "pointer",
                fontSize: 14,
                color: "rgb(68, 64, 60)",
              }}
            >
              <button
                onClick={onCursorHighlightToggle}
                className="toggle-switch"
                style={{
                  position: "relative",
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: cursorHighlight ? "rgb(41, 37, 36)" : "rgb(214, 211, 209)",
                  border: "none",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                  flexShrink: 0,
                }}
              >
                <span style={{
                  position: "absolute",
                  top: 2,
                  left: cursorHighlight ? 22 : 2,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  backgroundColor: "white",
                  transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                }} />
              </button>
              录制时显示光标高亮
            </label>

            {cursorHighlight && (
              <div className="cursor-colors" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
                <span style={{ fontSize: 11, color: "rgb(168, 162, 158)" }}>光标颜色:</span>
                {CURSOR_COLORS.map(color => {
                  const isActive = cursorColor === color
                  return (
                    <button
                      key={color}
                      onClick={() => onCursorColorChange(color)}
                      className={`color-btn${isActive ? " active" : ""}`}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        backgroundColor: color,
                        border: isActive ? "2px solid rgb(41, 37, 36)" : "2px solid transparent",
                        boxShadow: isActive
                          ? "rgb(254, 252, 249) 0px 0px 0px 2px, rgb(41, 37, 36) 0px 0px 0px 4px"
                          : "none",
                        cursor: "pointer",
                        transition: "all 0.15s",
                        padding: 0,
                      }}
                    />
                  )
                })}
              </div>
            )}
          </div>

          {/* Account section placeholder — intentionally simplified for local version */}
          <div className="account-section" style={{
            paddingTop: 24,
            marginTop: 8,
            borderTop: "1px solid rgb(231, 229, 228)",
          }}>
            <h3 style={sectionHeaderStyle}>账户</h3>
            <button style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid rgb(231, 229, 228)",
              backgroundColor: "rgb(255, 255, 255)",
              color: "rgb(68, 64, 60)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginBottom: 8,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              使用 Google 登录
            </button>
            <button style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid rgb(231, 229, 228)",
              backgroundColor: "rgb(255, 255, 255)",
              color: "rgb(68, 64, 60)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginBottom: 8,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              使用邮箱登录
            </button>
            <button
              className="upgrade-subtle-btn"
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid rgb(253, 230, 138)",
                backgroundColor: "rgb(255, 251, 235)",
                color: "rgb(180, 83, 9)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                marginTop: 12,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              去除水印 — $20 一次性付款
            </button>
          </div>

          {/* Done button */}
          <button
            onClick={onClose}
            className="done-btn"
            style={{
              width: "100%",
              padding: 16,
              borderRadius: 12,
              backgroundColor: "rgb(41, 37, 36)",
              color: "rgb(255, 255, 255)",
              fontSize: 15,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              marginTop: 8,
              textAlign: "center",
            }}
          >
            完成
          </button>
        </div>
      </div>
    </div>
  )
}
