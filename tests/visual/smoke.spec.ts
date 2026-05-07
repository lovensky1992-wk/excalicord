import { test, expect } from "./fixtures"

test.describe("Visual Smoke Test", () => {
  test("app loads and reaches idle state", async ({ authedPage: page }) => {
    await expect(page.locator(".excalidraw")).toBeVisible()

    await page.screenshot({
      path: "test-results/visual-diff/smoke-idle.png",
      fullPage: false,
    })
  })
})
