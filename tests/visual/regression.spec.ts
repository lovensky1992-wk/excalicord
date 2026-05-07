import { test, expect } from "./fixtures"

test.describe("Visual Regression: idle state", () => {
  test("full page", async ({ authedPage: page }) => {
    await expect(page).toHaveScreenshot("idle-full.png", {
      maxDiffPixelRatio: 0.01,
      mask: [page.locator(".webcam-bubble")],
    })
  })

  test("control group", async ({ authedPage: page }) => {
    const controlGroup = page.locator(".control-group, .top-right-controls").first()
    if (await controlGroup.isVisible().catch(() => false)) {
      await expect(controlGroup).toHaveScreenshot("control-group.png", {
        maxDiffPixelRatio: 0.01,
      })
    } else {
      await expect(page).toHaveScreenshot("control-group-fallback.png", {
        maxDiffPixelRatio: 0.01,
        clip: { x: 1100, y: 10, width: 340, height: 70 },
      })
    }
  })

  test("toolbar", async ({ authedPage: page }) => {
    const toolbar = page.locator('[role="toolbar"], .App-toolbar').first()
    if (await toolbar.isVisible().catch(() => false)) {
      await expect(toolbar).toHaveScreenshot("toolbar.png", {
        maxDiffPixelRatio: 0.01,
      })
    }
  })

  test("bottom bar", async ({ authedPage: page }) => {
    await expect(page).toHaveScreenshot("bottom-bar.png", {
      maxDiffPixelRatio: 0.01,
      clip: { x: 0, y: 850, width: 1440, height: 50 },
    })
  })
})

test.describe("Visual Regression: settings panel", () => {
  test("settings overlay", async ({ authedPage: page }) => {
    const settingsBtn = page.locator('.settings-btn, button[title*="设置"], button[title*="Settings"]').first()
    if (await settingsBtn.isVisible().catch(() => false)) {
      await settingsBtn.click()
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot("settings-panel.png", {
        maxDiffPixelRatio: 0.02,
        mask: [page.locator(".webcam-bubble"), page.locator(".settings-preview-frame")],
      })
    }
  })
})

test.describe("Visual Regression: preview state", () => {
  test("preview full page", async ({ authedPage: page }) => {
    const addBtn = page.locator('button[title="添加幻灯片"]')
    if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addBtn.click()
      await page.waitForTimeout(500)
    }

    const recBtn = page.locator('button:has-text("录制")')
    await recBtn.click()
    await page.waitForTimeout(2000)

    await expect(page).toHaveScreenshot("preview-full.png", {
      maxDiffPixelRatio: 0.01,
      mask: [page.locator(".webcam-bubble")],
    })
  })

  test("preview controls", async ({ authedPage: page }) => {
    const addBtn = page.locator('button[title="添加幻灯片"]')
    if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addBtn.click()
      await page.waitForTimeout(500)
    }

    const recBtn = page.locator('button:has-text("录制")')
    await recBtn.click()
    await page.waitForTimeout(2000)

    await expect(page).toHaveScreenshot("preview-controls.png", {
      maxDiffPixelRatio: 0.01,
      clip: { x: 1080, y: 10, width: 360, height: 76 },
    })
  })
})

test.describe("Visual Regression: recording state", () => {
  async function enterRecordingState(page: import("@playwright/test").Page) {
    const addBtn = page.locator('button[title="添加幻灯片"]')
    if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addBtn.click()
      await page.waitForTimeout(500)
    }

    // Click record to enter preview
    const recBtn = page.locator('button:has-text("录制")')
    await recBtn.click()
    await page.waitForTimeout(1500)

    // Click start recording — triggers 3-2-1 countdown
    const startBtn = page.locator('button:has-text("开始录制")')
    await startBtn.click()

    // Wait for countdown (3s) + recording UI to appear
    await page.waitForTimeout(4500)
  }

  test("recording full page", async ({ authedPage: page }) => {
    await enterRecordingState(page)

    await expect(page).toHaveScreenshot("recording-full.png", {
      maxDiffPixelRatio: 0.02,
      mask: [page.locator(".webcam-bubble")],
    })
  })

  test("recording controls", async ({ authedPage: page }) => {
    await enterRecordingState(page)

    await expect(page).toHaveScreenshot("recording-controls.png", {
      maxDiffPixelRatio: 0.01,
      clip: { x: 1000, y: 10, width: 440, height: 70 },
    })
  })

  test("recording REC badge", async ({ authedPage: page }) => {
    await enterRecordingState(page)

    await expect(page).toHaveScreenshot("recording-rec-badge.png", {
      maxDiffPixelRatio: 0.01,
      clip: { x: 65, y: 45, width: 100, height: 40 },
    })
  })
})

test.describe("Visual Regression: paused state", () => {
  async function enterPausedState(page: import("@playwright/test").Page) {
    const addBtn = page.locator('button[title="添加幻灯片"]')
    if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addBtn.click()
      await page.waitForTimeout(500)
    }

    const recBtn = page.locator('button:has-text("录制")')
    await recBtn.click()
    await page.waitForTimeout(1500)

    const startBtn = page.locator('button:has-text("开始录制")')
    await startBtn.click()
    await page.waitForTimeout(4500)

    // Click pause
    const pauseBtn = page.locator('button:has-text("暂停")')
    await pauseBtn.click()
    await page.waitForTimeout(500)
  }

  test("paused full page", async ({ authedPage: page }) => {
    await enterPausedState(page)

    await expect(page).toHaveScreenshot("paused-full.png", {
      maxDiffPixelRatio: 0.02,
      mask: [page.locator(".webcam-bubble")],
    })
  })

  test("paused controls", async ({ authedPage: page }) => {
    await enterPausedState(page)

    await expect(page).toHaveScreenshot("paused-controls.png", {
      maxDiffPixelRatio: 0.01,
      clip: { x: 1000, y: 10, width: 440, height: 70 },
    })
  })
})

test.describe("Visual Regression: stop state", () => {
  async function enterStopState(page: import("@playwright/test").Page) {
    const addBtn = page.locator('button[title="添加幻灯片"]')
    if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addBtn.click()
      await page.waitForTimeout(500)
    }

    const recBtn = page.locator('button:has-text("录制")')
    await recBtn.click()
    await page.waitForTimeout(1500)

    const startBtn = page.locator('button:has-text("开始录制")')
    await startBtn.click()
    await page.waitForTimeout(4500)

    // Click stop
    const stopBtn = page.locator('button:has-text("停止")')
    await stopBtn.click()
    await page.waitForTimeout(1000)
  }

  test("stop toast notification", async ({ authedPage: page }) => {
    await enterStopState(page)

    await expect(page).toHaveScreenshot("stop-toast.png", {
      maxDiffPixelRatio: 0.02,
      clip: { x: 400, y: 60, width: 640, height: 80 },
    })
  })

  test("stop controls with media library", async ({ authedPage: page }) => {
    await enterStopState(page)

    await expect(page).toHaveScreenshot("stop-controls.png", {
      maxDiffPixelRatio: 0.01,
      clip: { x: 1000, y: 10, width: 440, height: 70 },
    })
  })
})

test.describe("Visual Regression: teleprompter panel", () => {
  test("teleprompter open", async ({ authedPage: page }) => {
    // Open teleprompter via button
    const teleprompterBtn = page.locator('button[title="提词器"]')
    if (await teleprompterBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await teleprompterBtn.click()
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot("teleprompter-panel.png", {
        maxDiffPixelRatio: 0.02,
        clip: { x: 1060, y: 70, width: 380, height: 420 },
      })
    }
  })
})

test.describe("Visual Regression: slide panel", () => {
  test("slide panel with slides", async ({ authedPage: page }) => {
    // Add a slide to show the slide rail
    const addBtn = page.locator('button[title="添加幻灯片"]')
    if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addBtn.click()
      await page.waitForTimeout(1000)
    }

    // Screenshot the right side where slide panel appears
    await expect(page).toHaveScreenshot("slide-panel.png", {
      maxDiffPixelRatio: 0.02,
      clip: { x: 1300, y: 350, width: 140, height: 200 },
    })
  })
})
