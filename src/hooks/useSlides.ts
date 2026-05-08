/**
 * useSlides Hook
 *
 * 负责幻灯片状态管理、帧元素生成、帧位置/尺寸持久化
 *
 * @description
 * - 幻灯片导航 (currentSlideIndex, goToSlide)
 * - 幻灯片索引 localStorage 持久化
 * - 帧位置管理 (framePositionsRef, framePositionsState)
 * - 帧尺寸管理 (frameDimensionsRef, localStorage 持久化)
 * - 帧元素生成 (createSlideFrameElement, createSlideFrameElements)
 * - 新建幻灯片时设置默认尺寸
 *
 * @see
 * - 技术架构文档: docs/technical-architecture.md
 * - hooks 职责划分: 2.3 逻辑层架构
 */

import { useCallback, useEffect, useRef, useState } from "react"
import type { Slide } from "@/types"
import { useProject } from "@/contexts"

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_FRAME_X = 100
const DEFAULT_FRAME_Y = 100
const DEFAULT_FRAME_GAP = 100
const DEFAULT_FRAME_WIDTH = 1920
const DEFAULT_FRAME_HEIGHT = 1080

// ============================================================================
// Types
// ============================================================================

export interface SlideFrameElement {
  id: string
  type: "frame"
  x: number
  y: number
  width: number
  height: number
  strokeColor: string
  backgroundColor: string
  fillStyle: string
  strokeWidth: number
  borderRadius: number
  roughness: number
  groupIds: string[]
  frameId: null
  roundness: null
  seed: number
  version: number
  versionNonce: number
  isDeleted: boolean
  boundElements: unknown[]
  updated: number
  link: null
  locked: boolean
  name: string
}

export interface UseSlidesReturn {
  // State
  currentSlideIndex: number
  currentSlide: Slide | null
  slides: Slide[]
  framePositions: Record<number, { x: number; y: number }>
  frameDimensions: Record<number, { width: number; height: number }>
  frameElements: SlideFrameElement[]
  aspectRatio: string
  customWidth: number
  customHeight: number

  // Actions
  goToSlide: (index: number) => void
  addSlide: () => Promise<number>
  deleteSlide: (id: string) => Promise<void>
  setAspectRatio: (ratio: string) => void
  setCustomSize: (width: number, height: number) => void
  updateFramePosition: (index: number, position: { x: number; y: number }) => void
  updateFrameDimensions: (index: number, dimensions: { width: number; height: number }) => void
}

// ============================================================================
// Helper Functions
// ============================================================================

function createSlideFrameElement(
  index: number,
  isActive: boolean,
  x: number,
  y: number,
  width: number,
  height: number,
  name?: string
): SlideFrameElement {
  return {
    id: `slide-frame-${index}`,
    type: "frame",
    x,
    y,
    width,
    height,
    strokeColor: isActive ? "#2563eb" : "#e5e7eb",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: isActive ? 4 : 2,
    borderRadius: 8,
    roughness: 0,
    groupIds: [],
    frameId: null,
    roundness: null,
    seed: index,
    version: 1,
    versionNonce: 0,
    isDeleted: false,
    boundElements: [],
    updated: 0,
    link: null,
    locked: false,
    name: name || `第${index + 1}页`,
  }
}

function createSlideFrameElements(
  slides: { id: string; name?: string }[],
  currentIndex: number,
  framePositions: Record<number, { x: number; y: number }>,
  frameDimensions: Record<number, { width: number; height: number }>
): SlideFrameElement[] {
  let nextX = DEFAULT_FRAME_X
  return slides.map((slide, index) => {
    const isActive = index === currentIndex
    const dims = frameDimensions[index] || { width: DEFAULT_FRAME_WIDTH, height: DEFAULT_FRAME_HEIGHT }
    const stored = framePositions[index]
    const x = stored ? stored.x : nextX
    const y = stored ? stored.y : DEFAULT_FRAME_Y
    nextX = x + dims.width + DEFAULT_FRAME_GAP
    return createSlideFrameElement(index, isActive, x, y, dims.width, dims.height, slide.name || `第${index + 1}页`)
  })
}

// ============================================================================
// Hook
// ============================================================================

export function useSlides(): UseSlidesReturn {
  const { project, slides, addSlide: addSlideToProject, deleteSlide: deleteSlideFromProject } = useProject()

  // Current slide index
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)

  // Frame positions (keyed by index)
  const framePositionsRef = useRef<Record<number, { x: number; y: number }>>({})
  const [framePositions, setFramePositions] = useState<Record<number, { x: number; y: number }>>({})

  // Frame dimensions (keyed by index)
  const frameDimensionsRef = useRef<Record<number, { width: number; height: number }>>({})

  // Default frame size settings — persisted to localStorage
  const [aspectRatio, setAspectRatioState] = useState(() => {
    return localStorage.getItem("excalicord_aspectRatio") || "16:9"
  })
  const [customWidth, setCustomWidth] = useState(() => {
    const v = localStorage.getItem("excalicord_customWidth")
    return v ? parseInt(v) : DEFAULT_FRAME_WIDTH
  })
  const [customHeight, setCustomHeight] = useState(() => {
    const v = localStorage.getItem("excalicord_customHeight")
    return v ? parseInt(v) : DEFAULT_FRAME_HEIGHT
  })

  const setAspectRatio = useCallback((ratio: string) => {
    setAspectRatioState(ratio)
    localStorage.setItem("excalicord_aspectRatio", ratio)
  }, [])

  useEffect(() => { localStorage.setItem("excalicord_customWidth", String(customWidth)) }, [customWidth])
  useEffect(() => { localStorage.setItem("excalicord_customHeight", String(customHeight)) }, [customHeight])

  // Current slide reference
  const currentSlide = slides[currentSlideIndex] || null

  // ============================================================================
  // Initialize frame positions when slides change
  // ============================================================================
  useEffect(() => {
    if (slides.length === 0) return

    let nextX = DEFAULT_FRAME_X
    slides.forEach((_, index) => {
      const dims = frameDimensionsRef.current[index] || { width: DEFAULT_FRAME_WIDTH, height: DEFAULT_FRAME_HEIGHT }
      if (!framePositionsRef.current[index]) {
        framePositionsRef.current[index] = {
          x: nextX,
          y: DEFAULT_FRAME_Y,
        }
      }
      nextX = framePositionsRef.current[index].x + dims.width + DEFAULT_FRAME_GAP
    })
    setFramePositions({ ...framePositionsRef.current })
  }, [slides])

  // ============================================================================
  // Load frame dimensions from localStorage when project loads
  // ============================================================================
  useEffect(() => {
    if (!project?.id) return

    const savedDims = localStorage.getItem(`frameDims_${project.id}`)
    if (savedDims) {
      try {
        const parsed = JSON.parse(savedDims)
        Object.keys(parsed).forEach((key) => {
          frameDimensionsRef.current[parseInt(key)] = parsed[key]
        })
      } catch (e) {
        console.error("Failed to parse saved frame dimensions:", e)
      }
    }
  }, [project?.id])

  // ============================================================================
  // Save frame dimensions to localStorage when they change
  // ============================================================================
  useEffect(() => {
    if (!project?.id) return
    localStorage.setItem(`frameDims_${project.id}`, JSON.stringify(frameDimensionsRef.current))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id])

  // ============================================================================
  // Sync currentSlideIndex when project changes - restore from localStorage
  // ============================================================================
  useEffect(() => {
    if (!project?.id) return
    const savedIndex = localStorage.getItem(`slideIndex_${project.id}`)
    if (savedIndex !== null) {
      const index = parseInt(savedIndex, 10)
      if (!isNaN(index) && index >= 0) {
        setCurrentSlideIndex(index)
        return
      }
    }
    setCurrentSlideIndex(0)
  }, [project?.id])

  // ============================================================================
  // Save currentSlideIndex to localStorage when it changes
  // ============================================================================
  useEffect(() => {
    if (!project?.id) return
    localStorage.setItem(`slideIndex_${project.id}`, String(currentSlideIndex))
  }, [currentSlideIndex, project?.id])

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * Navigate to a specific slide by index
   */
  const goToSlide = useCallback((index: number) => {
    setCurrentSlideIndex(index)
  }, [])

  /**
   * Add a new slide and set its dimensions based on current aspect ratio
   */
  const addSlide = useCallback(async (): Promise<number> => {
    const newIndex = await addSlideToProject()
    if (newIndex >= 0) {
      frameDimensionsRef.current[newIndex] = {
        width: customWidth,
        height: customHeight,
      }
      if (project?.id) {
        localStorage.setItem(`frameDims_${project.id}`, JSON.stringify(frameDimensionsRef.current))
      }
      setCurrentSlideIndex(newIndex)
    }
    return newIndex
  }, [addSlideToProject, customWidth, customHeight, project?.id])

  /**
   * Delete a slide by id and adjust current index
   */
  const deleteSlide = useCallback(async (id: string) => {
    const deletedIndex = slides.findIndex(s => s.id === id)
    await deleteSlideFromProject(id)

    // Clean up frame positions/dimensions for deleted index and shift higher indices down
    const newPositions: Record<number, { x: number; y: number }> = {}
    const newDimensions: Record<number, { width: number; height: number }> = {}
    for (const [key, val] of Object.entries(framePositionsRef.current)) {
      const i = parseInt(key)
      if (i < deletedIndex) newPositions[i] = val
      else if (i > deletedIndex) newPositions[i - 1] = val
    }
    for (const [key, val] of Object.entries(frameDimensionsRef.current)) {
      const i = parseInt(key)
      if (i < deletedIndex) newDimensions[i] = val
      else if (i > deletedIndex) newDimensions[i - 1] = val
    }
    framePositionsRef.current = newPositions
    frameDimensionsRef.current = newDimensions
    setFramePositions({ ...newPositions })

    if (currentSlideIndex >= slides.length - 1) {
      setCurrentSlideIndex(Math.max(0, slides.length - 2))
    } else if (currentSlideIndex > deletedIndex) {
      setCurrentSlideIndex(currentSlideIndex - 1)
    }
  }, [slides, currentSlideIndex, deleteSlideFromProject])

  /**
   * Update aspect ratio and recalculate dimensions
   */
  const updateAspectRatio = useCallback((ratio: string) => {
    setAspectRatio(ratio)
    let newW = 0, newH = 0
    switch (ratio) {
      case "16:9": newW = 1920; newH = 1080; break
      case "4:3": newW = 1440; newH = 1080; break
      case "3:4": newW = 1080; newH = 1440; break
      case "1:1": newW = 1080; newH = 1080; break
      case "9:16": newW = 1080; newH = 1920; break
      default: break
    }
    if (newW > 0 && newH > 0) {
      setCustomWidth(newW)
      setCustomHeight(newH)
      slides.forEach((_, index) => {
        frameDimensionsRef.current[index] = { width: newW, height: newH }
      })
      if (project?.id) {
        localStorage.setItem(`frameDims_${project.id}`, JSON.stringify(frameDimensionsRef.current))
      }
      setFramePositions({ ...framePositionsRef.current })
    }
  }, [slides, project?.id])

  /**
   * Set custom width and height
   */
  const setCustomSize = useCallback((width: number, height: number) => {
    setCustomWidth(width)
    setCustomHeight(height)
  }, [])

  /**
   * Update frame position (for drag operations)
   */
  const updateFramePosition = useCallback((index: number, position: { x: number; y: number }) => {
    framePositionsRef.current[index] = position
    setFramePositions({ ...framePositionsRef.current })
  }, [])

  /**
   * Update frame dimensions (for resize operations)
   */
  const updateFrameDimensions = useCallback((index: number, dimensions: { width: number; height: number }) => {
    frameDimensionsRef.current[index] = dimensions
    // Trigger re-render by updating state
    setFramePositions({ ...framePositionsRef.current })
  }, [])

  // ============================================================================
  // Derived State
  // ============================================================================

  const frameElements = createSlideFrameElements(
    slides,
    currentSlideIndex,
    framePositions,
    frameDimensionsRef.current
  )

  return {
    // State
    currentSlideIndex,
    currentSlide,
    slides,
    framePositions,
    frameDimensions: frameDimensionsRef.current,
    frameElements,
    aspectRatio,
    customWidth,
    customHeight,

    // Actions
    goToSlide,
    addSlide,
    deleteSlide,
    setAspectRatio: updateAspectRatio,
    setCustomSize,
    updateFramePosition,
    updateFrameDimensions,
  }
}
