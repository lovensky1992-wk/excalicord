import { test as base, expect, Page } from "@playwright/test"
import { createClient } from "@supabase/supabase-js"

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

async function loginViaUI(page: Page) {
  await ensureTestUser()

  await page.fill('input[type="email"], input[placeholder*="email" i]', TEST_EMAIL)
  await page.fill('input[type="password"]', TEST_PASSWORD)
  await page.click('button:has-text("Sign in")')

  await page.waitForSelector('[data-testid="toolbar-selection"], .excalidraw', {
    timeout: 30000,
  })
}

async function mockCamera(page: Page) {
  await page.addInitScript(() => {
    const canvas = document.createElement("canvas")
    canvas.width = 640
    canvas.height = 480
    const ctx = canvas.getContext("2d")!
    ctx.fillStyle = "#333"
    ctx.fillRect(0, 0, 640, 480)
    ctx.fillStyle = "#666"
    ctx.beginPath()
    ctx.arc(320, 240, 100, 0, Math.PI * 2)
    ctx.fill()

    const stream = canvas.captureStream(30)

    const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(
      navigator.mediaDevices,
    )
    navigator.mediaDevices.getUserMedia = async (constraints) => {
      if (constraints?.video) {
        return stream
      }
      return originalGetUserMedia(constraints)
    }

    navigator.mediaDevices.enumerateDevices = async () => [
      {
        deviceId: "mock-camera",
        groupId: "mock-group",
        kind: "videoinput" as MediaDeviceKind,
        label: "Mock Camera",
        toJSON: () => ({}),
      },
      {
        deviceId: "mock-mic",
        groupId: "mock-group",
        kind: "audioinput" as MediaDeviceKind,
        label: "Mock Microphone",
        toJSON: () => ({}),
      },
    ]
  })
}

async function waitForAppReady(page: Page) {
  await page.waitForSelector('[data-testid="toolbar-selection"], .excalidraw', {
    timeout: 30000,
  })
  await page.waitForTimeout(1500)
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

export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, use) => {
    await mockCamera(page)
    await page.goto("http://localhost:5173")
    await loginViaUI(page)
    await waitForAppReady(page)
    await disableAnimations(page)
    await use(page)
  },
})

export { expect }
export { mockCamera, loginViaUI, waitForAppReady, disableAnimations }
