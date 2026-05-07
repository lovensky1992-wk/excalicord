import { test, expect } from "./fixtures"

test.describe("Dark theme verification", () => {
  test("idle state in dark mode", async ({ authedPage: page }) => {
    // Switch to dark mode
    await page.evaluate(() => localStorage.setItem("theme", "dark"))
    await page.reload()
    await page.waitForSelector('.excalidraw', { timeout: 15000 })
    await page.waitForTimeout(2000)

    // Verify dark class is applied
    const hasDark = await page.evaluate(() => document.documentElement.classList.contains("dark"))
    expect(hasDark).toBe(true)

    await expect(page).toHaveScreenshot("dark-idle-full.png", {
      maxDiffPixelRatio: 0.03,
      mask: [page.locator(".webcam-bubble")],
    })
  })

  test("settings panel in dark mode", async ({ authedPage: page }) => {
    await page.evaluate(() => localStorage.setItem("theme", "dark"))
    await page.reload()
    await page.waitForSelector('.excalidraw', { timeout: 15000 })
    await page.waitForTimeout(2000)

    const settingsBtn = page.locator('button[title*="设置"], button[title*="Settings"], .settings-btn').first()
    if (await settingsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await settingsBtn.click()
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot("dark-settings.png", {
        maxDiffPixelRatio: 0.03,
        mask: [page.locator(".webcam-bubble"), page.locator(".settings-preview-frame")],
      })
    }
  })

  test("recording flow in dark mode", async ({ authedPage: page }) => {
    await page.evaluate(() => localStorage.setItem("theme", "dark"))
    await page.reload()
    await page.waitForSelector('.excalidraw', { timeout: 15000 })
    await page.waitForTimeout(2000)

    // Add slide + enter preview
    const addBtn = page.locator('button[title="添加幻灯片"]')
    if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addBtn.click()
      await page.waitForTimeout(500)
    }

    const recBtn = page.locator('button:has-text("录制")')
    await recBtn.click()
    await page.waitForTimeout(2000)

    await expect(page).toHaveScreenshot("dark-preview.png", {
      maxDiffPixelRatio: 0.03,
      mask: [page.locator(".webcam-bubble")],
    })
  })
})

test.describe("Aspect ratio verification", () => {
  async function openSettingsAndSelectRatio(page: import("@playwright/test").Page, ratioLabel: string) {
    const settingsBtn = page.locator('button[title*="设置"], button[title*="Settings"], .settings-btn').first()
    await settingsBtn.click()
    await page.waitForTimeout(500)

    // Click the ratio button
    const ratioBtn = page.locator(`button:has-text("${ratioLabel}")`).first()
    if (await ratioBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await ratioBtn.click()
      await page.waitForTimeout(300)
    }

    // Click Done to close settings
    const doneBtn = page.locator('button:has-text("Done"), button:has-text("完成")').first()
    if (await doneBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await doneBtn.click()
      await page.waitForTimeout(500)
    }
  }

  const ratios = [
    { label: "16:9", name: "16x9" },
    { label: "4:3", name: "4x3" },
    { label: "3:4", name: "3x4" },
    { label: "9:16", name: "9x16" },
    { label: "1:1", name: "1x1" },
  ]

  for (const ratio of ratios) {
    test(`aspect ratio ${ratio.label}`, async ({ authedPage: page }) => {
      // Add a slide first
      const addBtn = page.locator('button[title="添加幻灯片"]')
      if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await addBtn.click()
        await page.waitForTimeout(500)
      }

      await openSettingsAndSelectRatio(page, ratio.label)

      // Take screenshot of canvas with the new ratio applied
      await expect(page).toHaveScreenshot(`ratio-${ratio.name}.png`, {
        maxDiffPixelRatio: 0.03,
        mask: [page.locator(".webcam-bubble")],
      })
    })
  }
})
