/**
 * Scrape slide rail, help panel, and context menu styles from original site.
 */
import { test } from "@playwright/test"

test("scrape original slide rail styles", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: "zh-CN",
  })
  const page = await context.newPage()

  await page.goto("https://www.excalicord.com/", { waitUntil: "networkidle", timeout: 30000 })
  await page.waitForTimeout(3000)

  // Dismiss overlays
  await page.evaluate(() => {
    document.querySelectorAll('.welcome-overlay, [class*="welcome"]').forEach(el => {
      ;(el as HTMLElement).style.display = 'none'
    })
  })
  await page.waitForTimeout(500)

  // Close settings if open
  const doneBtn = page.locator('button:has-text("Done"), button:has-text("完成")').first()
  if (await doneBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await doneBtn.click()
    await page.waitForTimeout(500)
  }

  // Dismiss remaining overlays
  await page.evaluate(() => {
    document.querySelectorAll('[class*="overlay"], [class*="modal-backdrop"]').forEach(el => {
      const cs = getComputedStyle(el)
      if (cs.position === 'fixed' && (el as HTMLElement).offsetWidth > 500) {
        ;(el as HTMLElement).style.display = 'none'
      }
    })
  })
  await page.waitForTimeout(500)

  // Take screenshot of idle state
  await page.screenshot({ path: "test-results/phase6-idle.png" })

  // Find the slide rail / slide panel on the right side
  const slideRail = await page.evaluate(() => {
    const results: any[] = []
    document.querySelectorAll('*').forEach((el) => {
      const cs = getComputedStyle(el)
      const rect = el.getBoundingClientRect()
      const text = (el.textContent || '').substring(0, 60).replace(/\s+/g, ' ')

      // Slide panel: right side, vertically centered, small width
      if (rect.right > 1350 && rect.width < 200 && rect.height > 50 && rect.height < 300) {
        if (text.includes('幻灯片') || text.includes('Slide') || text.includes('+')) {
          results.push({
            tag: el.tagName,
            class: el.className.toString().substring(0, 100),
            text: text,
            rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
            styles: {
              position: cs.position,
              top: cs.top, right: cs.right,
              backgroundColor: cs.backgroundColor,
              borderRadius: cs.borderRadius,
              boxShadow: cs.boxShadow.substring(0, 100),
              border: cs.border,
              padding: cs.padding,
              gap: cs.gap,
            },
          })
        }
      }
    })
    return results
  })
  console.log("Slide rail elements:", JSON.stringify(slideRail, null, 2))

  // Scrape the slide tooltip (dark background info about slide mode)
  const slideTooltip = await page.evaluate(() => {
    const results: any[] = []
    document.querySelectorAll('*').forEach((el) => {
      const cs = getComputedStyle(el)
      const rect = el.getBoundingClientRect()
      const text = (el.textContent || '').substring(0, 80).replace(/\s+/g, ' ')

      if (text.includes('幻灯片模式') && rect.width > 100) {
        results.push({
          tag: el.tagName,
          class: el.className.toString().substring(0, 100),
          text: text,
          rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
          styles: {
            backgroundColor: cs.backgroundColor,
            color: cs.color,
            borderRadius: cs.borderRadius,
            padding: cs.padding,
            fontSize: cs.fontSize,
            fontWeight: cs.fontWeight,
            maxWidth: cs.maxWidth,
          },
        })
      }
    })
    return results
  })
  console.log("Slide tooltip:", JSON.stringify(slideTooltip, null, 2))

  // Find the "+" add slide button
  const addSlideBtn = await page.evaluate(() => {
    const btns = document.querySelectorAll('button')
    for (const btn of btns) {
      const rect = btn.getBoundingClientRect()
      if (rect.right > 1350 && (btn.textContent?.includes('+') || btn.getAttribute('title')?.includes('幻灯片'))) {
        const cs = getComputedStyle(btn)
        return {
          text: btn.textContent?.trim(),
          title: btn.getAttribute('title'),
          rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
          styles: {
            width: cs.width, height: cs.height,
            borderRadius: cs.borderRadius,
            border: cs.border,
            backgroundColor: cs.backgroundColor,
            color: cs.color,
            fontSize: cs.fontSize,
          },
        }
      }
    }
    return null
  })
  console.log("Add slide button:", JSON.stringify(addSlideBtn, null, 2))

  await context.close()
})

test("scrape help panel and context menu", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: "zh-CN",
  })
  const page = await context.newPage()

  await page.goto("https://www.excalicord.com/", { waitUntil: "networkidle", timeout: 30000 })
  await page.waitForTimeout(3000)

  // Dismiss overlays
  await page.evaluate(() => {
    document.querySelectorAll('.welcome-overlay, [class*="welcome"]').forEach(el => {
      ;(el as HTMLElement).style.display = 'none'
    })
    document.querySelectorAll('[class*="overlay"], [class*="modal-backdrop"]').forEach(el => {
      const cs = getComputedStyle(el)
      if (cs.position === 'fixed' && (el as HTMLElement).offsetWidth > 500) {
        ;(el as HTMLElement).style.display = 'none'
      }
    })
  })
  await page.waitForTimeout(500)

  // Click the help button (bottom-right ? icon) — this is Excalidraw's native help
  const helpBtn = page.locator('button[class*="help"], button[aria-label*="Help"], button[aria-label*="帮助"]').first()
  if (await helpBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log("Found help button, clicking")
    await helpBtn.click()
    await page.waitForTimeout(1000)
    await page.screenshot({ path: "test-results/phase6-help.png" })
  } else {
    // Try the ? button at bottom-right
    const bottomRightBtns = await page.evaluate(() => {
      const results: any[] = []
      document.querySelectorAll('button').forEach((btn, i) => {
        const rect = btn.getBoundingClientRect()
        if (rect.bottom > 800 && rect.right > 1300) {
          results.push({
            index: i,
            text: btn.textContent?.trim().substring(0, 20),
            title: btn.getAttribute('title'),
            ariaLabel: btn.getAttribute('aria-label'),
            class: btn.className.toString().substring(0, 60),
            rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
          })
        }
      })
      return results
    })
    console.log("Bottom-right buttons:", JSON.stringify(bottomRightBtns, null, 2))

    // Click the help button if found
    for (const btn of bottomRightBtns) {
      if (btn.text === '?' || btn.title?.includes('帮助') || btn.title?.includes('Help') || btn.ariaLabel?.includes('help')) {
        await page.locator('button').nth(btn.index).click()
        await page.waitForTimeout(1000)
        await page.screenshot({ path: "test-results/phase6-help.png" })
        console.log("Help panel opened")
        break
      }
    }
  }

  // Now test context menu
  await page.keyboard.press("Escape")
  await page.waitForTimeout(500)

  // Right-click on the canvas area
  await page.mouse.click(700, 400, { button: "right" })
  await page.waitForTimeout(500)
  await page.screenshot({ path: "test-results/phase6-context-menu.png" })

  // Check if context menu appeared
  const contextMenu = await page.evaluate(() => {
    const menus = document.querySelectorAll('[class*="context-menu"], [role="menu"], [class*="ContextMenu"]')
    const results: any[] = []
    menus.forEach(menu => {
      const rect = menu.getBoundingClientRect()
      if (rect.width > 0) {
        results.push({
          tag: menu.tagName,
          class: menu.className.toString().substring(0, 80),
          text: (menu.textContent || '').substring(0, 200).replace(/\s+/g, ' '),
          rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
        })
      }
    })
    return results
  })
  console.log("Context menus found:", JSON.stringify(contextMenu, null, 2))

  await context.close()
})
