import { test, expect } from "@playwright/test"
import { chromium, type Page } from "playwright"
import { PNG } from "pngjs"
import pixelmatch from "pixelmatch"
import * as fs from "fs"
import * as path from "path"
import { createClient } from "@supabase/supabase-js"

const ORIGINAL_URL = "https://www.excalicord.com/"
const LOCAL_URL = "http://localhost:5173"
const OUTPUT_DIR = path.join(process.cwd(), "test-results", "visual-diff")
const VIEWPORT = { width: 1440, height: 900 }

const SUPABASE_URL = "http://127.0.0.1:54321"
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
const TEST_EMAIL = "test@excalicord.local"
const TEST_PASSWORD = "test-password-123"

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function ensureTestUser() {
  const { data: existing } = await supabaseAdmin.auth.admin.listUsers()
  const found = existing?.users?.find((u) => u.email === TEST_EMAIL)
  if (found) return
  await supabaseAdmin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Test User" },
  })
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function comparePNGs(
  img1Path: string,
  img2Path: string,
  diffPath: string,
): { diffPixels: number; totalPixels: number; diffPercent: number } {
  const img1 = PNG.sync.read(fs.readFileSync(img1Path))
  const img2 = PNG.sync.read(fs.readFileSync(img2Path))

  const width = Math.min(img1.width, img2.width)
  const height = Math.min(img1.height, img2.height)
  const diff = new PNG({ width, height })

  const diffPixels = pixelmatch(
    img1.data,
    img2.data,
    diff.data,
    width,
    height,
    { threshold: 0.1 },
  )

  fs.writeFileSync(diffPath, PNG.sync.write(diff))

  const totalPixels = width * height
  return {
    diffPixels,
    totalPixels,
    diffPercent: (diffPixels / totalPixels) * 100,
  }
}

async function disableAnimations(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `,
  })
}

async function dismissOverlays(page: Page) {
  // Close welcome modal if present
  const welcomeBtn = page.locator(
    'button:has-text("了解了"), button:has-text("Got it"), button:has-text("开始")',
  )
  if (await welcomeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await welcomeBtn.click()
    await page.waitForTimeout(500)
  }

  // Close settings panel if present
  const settingsClose = page.locator('.settings-overlay .close-btn, .settings-overlay button:has-text("✕"), .settings-panel button:has-text("完成"), .settings-panel .done-btn')
  if (await settingsClose.first().isVisible({ timeout: 3000 }).catch(() => false)) {
    await settingsClose.first().click()
    await page.waitForTimeout(500)
  }

  // Close any modal overlay by pressing Escape
  const overlay = page.locator('.settings-overlay, .modal-overlay')
  if (await overlay.isVisible({ timeout: 1000 }).catch(() => false)) {
    await page.keyboard.press("Escape")
    await page.waitForTimeout(500)
  }
}

async function prepareOriginalPage(page: Page) {
  await page.goto(ORIGINAL_URL, { waitUntil: "networkidle" })
  await dismissOverlays(page)
  await disableAnimations(page)
  await page.waitForSelector(
    '[data-testid="toolbar-selection"], .excalidraw',
    { timeout: 30000 },
  )
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(2000)
}

async function prepareLocalPage(page: Page) {
  await page.goto(LOCAL_URL, { waitUntil: "networkidle" })

  const signInBtn = page.locator('button:has-text("Sign in")')
  if (await signInBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await ensureTestUser()
    await page.fill(
      'input[type="email"], input[placeholder*="email" i]',
      TEST_EMAIL,
    )
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await signInBtn.click()
  }

  await dismissOverlays(page)
  await disableAnimations(page)
  await page.waitForSelector(
    '[data-testid="toolbar-selection"], .excalidraw',
    { timeout: 30000 },
  )
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(2000)
}

interface CaptureSpec {
  name: string
  afterReady?: (page: Page) => Promise<void>
  clip?: { x: number; y: number; width: number; height: number }
}

const CAPTURES: CaptureSpec[] = [
  {
    name: "idle-full",
  },
  {
    name: "control-group",
    clip: { x: 1230, y: 10, width: 210, height: 76 },
  },
  {
    name: "toolbar",
    clip: { x: 400, y: 10, width: 580, height: 60 },
  },
  {
    name: "bottom-bar",
    clip: { x: 0, y: 850, width: 1440, height: 50 },
  },
  {
    name: "settings-top",
    afterReady: async (page: Page) => {
      // Open settings panel — click settings gear button
      // On original site: .recording-controls button:first-child
      // On local site: the same control group first button
      const settingsBtn = page.locator('.recording-controls button, .settings-overlay').first()

      // If settings overlay already visible (original opens it on first visit), skip
      const alreadyOpen = await page.locator('.settings-overlay, .settings-panel').isVisible({ timeout: 1000 }).catch(() => false)
      if (!alreadyOpen) {
        // Click the gear icon (first button in the control group)
        const gearBtn = page.locator('button[title="录制设置"], button[title="Settings"]').first()
        if (await gearBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await gearBtn.click()
        } else {
          // Fallback: click first button in recording controls / top bar
          const firstBtn = page.locator('.recording-controls button, [class*="z-40"] button').first()
          await firstBtn.click()
        }
      }
      await page.waitForTimeout(1500)
    },
    // Capture the settings panel area (roughly centered, covers the modal)
    clip: { x: 280, y: 60, width: 880, height: 780 },
  },
  {
    name: "settings-content",
    afterReady: async (page: Page) => {
      const alreadyOpen = await page.locator('.settings-overlay, .settings-panel').isVisible({ timeout: 1000 }).catch(() => false)
      if (!alreadyOpen) {
        const gearBtn = page.locator('button[title="录制设置"], button[title="Settings"]').first()
        if (await gearBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await gearBtn.click()
        } else {
          const firstBtn = page.locator('.recording-controls button, [class*="z-40"] button').first()
          await firstBtn.click()
        }
      }
      await page.waitForTimeout(1500)
    },
    // Clip only the right-side content (excludes preview column)
    clip: { x: 590, y: 60, width: 530, height: 780 },
  },
  {
    name: "settings-header-controls",
    afterReady: async (page: Page) => {
      const alreadyOpen = await page.locator('.settings-overlay, .settings-panel').isVisible({ timeout: 1000 }).catch(() => false)
      if (!alreadyOpen) {
        const gearBtn = page.locator('button[title="录制设置"], button[title="Settings"]').first()
        if (await gearBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await gearBtn.click()
        } else {
          const firstBtn = page.locator('.recording-controls button, [class*="z-40"] button').first()
          await firstBtn.click()
        }
      }
      await page.waitForTimeout(1500)
    },
    // Clip header + aspect ratio + background tabs + random button (above wallpaper grid)
    clip: { x: 590, y: 60, width: 530, height: 380 },
  },
  {
    name: "settings-bottom",
    afterReady: async (page: Page) => {
      const alreadyOpen = await page.locator('.settings-overlay, .settings-panel').isVisible({ timeout: 1000 }).catch(() => false)
      if (!alreadyOpen) {
        const gearBtn = page.locator('button[title="录制设置"], button[title="Settings"]').first()
        if (await gearBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await gearBtn.click()
        } else {
          const firstBtn = page.locator('.recording-controls button, [class*="z-40"] button').first()
          await firstBtn.click()
        }
      }
      await page.waitForTimeout(1000)
      // Scroll to bottom of settings content
      await page.evaluate(() => {
        const content = document.querySelector('.settings-content')
        if (content) content.scrollTop = content.scrollHeight
      })
      await page.waitForTimeout(1000)
    },
    // Clip the bottom portion of the settings panel (right side)
    clip: { x: 590, y: 300, width: 530, height: 540 },
  },
]

test.describe("Visual Comparison: Local vs Original", () => {
  test.setTimeout(120000)

  for (const capture of CAPTURES) {
    test(`compare ${capture.name}`, async () => {
      ensureDir(OUTPUT_DIR)

      const browser = await chromium.launch()
      const context = await browser.newContext({
        viewport: VIEWPORT,
        deviceScaleFactor: 1,
        locale: "zh-CN",
      })

      try {
        // Capture original
        const originalPage = await context.newPage()
        await prepareOriginalPage(originalPage)
        if (capture.afterReady) await capture.afterReady(originalPage)
        await originalPage.screenshot({
          path: path.join(OUTPUT_DIR, `${capture.name}-original.png`),
          clip: capture.clip,
        })
        await originalPage.close()

        // Capture local
        const localPage = await context.newPage()
        await prepareLocalPage(localPage)
        if (capture.afterReady) await capture.afterReady(localPage)
        await localPage.screenshot({
          path: path.join(OUTPUT_DIR, `${capture.name}-local.png`),
          clip: capture.clip,
        })
        await localPage.close()

        // Compare
        const result = comparePNGs(
          path.join(OUTPUT_DIR, `${capture.name}-original.png`),
          path.join(OUTPUT_DIR, `${capture.name}-local.png`),
          path.join(OUTPUT_DIR, `${capture.name}-diff.png`),
        )

        console.log(
          `[${capture.name}] diff: ${result.diffPercent.toFixed(2)}% (${result.diffPixels}/${result.totalPixels} pixels)`,
        )

        const reportPath = path.join(OUTPUT_DIR, "report.json")
        const report = fs.existsSync(reportPath)
          ? JSON.parse(fs.readFileSync(reportPath, "utf-8"))
          : {}
        report[capture.name] = {
          ...result,
          timestamp: new Date().toISOString(),
        }
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
      } finally {
        await browser.close()
      }
    })
  }
})
