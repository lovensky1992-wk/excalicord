/**
 * Scrape teleprompter panel computed styles from original site.
 */
import { test } from "@playwright/test"

test("scrape original teleprompter styles", async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: "zh-CN",
  })
  const page = await context.newPage()

  await page.goto("https://www.excalicord.com/", { waitUntil: "networkidle", timeout: 30000 })
  await page.waitForTimeout(3000)

  // Dismiss welcome overlay by hiding it
  await page.evaluate(() => {
    document.querySelectorAll('.welcome-overlay, [class*="welcome"]').forEach(el => {
      ;(el as HTMLElement).style.display = 'none'
    })
  })
  await page.waitForTimeout(500)

  // Dismiss any settings/modal overlays
  const closeBtn = page.locator('button:has-text("Done"), button:has-text("完成")').first()
  if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await closeBtn.click()
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

  // Screenshot to see current state
  await page.screenshot({ path: "test-results/teleprompter-step1.png" })

  // List top-right buttons
  const topRightBtns = await page.evaluate(() => {
    const results: any[] = []
    document.querySelectorAll('button').forEach((btn, i) => {
      const rect = btn.getBoundingClientRect()
      if (rect.right > 1100 && rect.top < 80) {
        results.push({
          index: i,
          title: btn.getAttribute('title') || '',
          ariaLabel: btn.getAttribute('aria-label') || '',
          text: btn.textContent?.trim().substring(0, 30) || '',
          className: btn.className.toString().substring(0, 60),
          rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
        })
      }
    })
    return results
  })
  console.log("Top-right buttons:", JSON.stringify(topRightBtns, null, 2))

  // Click the teleprompter button by class
  const teleprompterBtn = page.locator('.teleprompter-btn')
  if (await teleprompterBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log("Clicking teleprompter button by class")
    await teleprompterBtn.click()
    await page.waitForTimeout(1000)
  } else {
    console.log("teleprompter-btn not found, trying alternatives")
    for (const btn of topRightBtns) {
      if (btn.className.includes('teleprompter')) {
        await page.locator('button').nth(btn.index).click()
        await page.waitForTimeout(1000)
        break
      }
    }
  }

  // Screenshot after click
  await page.screenshot({ path: "test-results/teleprompter-step2.png" })

  // Find teleprompter panel (look for any new panels that appeared)
  const panels = await page.evaluate(() => {
    const results: any[] = []
    document.querySelectorAll('*').forEach((el) => {
      const cs = getComputedStyle(el)
      const rect = el.getBoundingClientRect()
      const text = (el.textContent || '').substring(0, 60).replace(/\s+/g, ' ')

      if (rect.width > 200 && rect.height > 200 && rect.right > 900 && rect.top > 50) {
        if ((cs.position === 'fixed' || cs.position === 'absolute') && cs.display !== 'none') {
          if (text.includes('提词') || text.includes('Script') || text.includes('滚动') || text.includes('粘贴')) {
            results.push({
              tag: el.tagName,
              class: el.className.toString().substring(0, 100),
              text: text,
              rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
              styles: {
                position: cs.position,
                top: cs.top,
                right: cs.right,
                left: cs.left,
                width: cs.width,
                height: cs.height,
                backgroundColor: cs.backgroundColor,
                borderRadius: cs.borderRadius,
                boxShadow: cs.boxShadow.substring(0, 120),
                border: cs.border,
                padding: cs.padding,
                opacity: cs.opacity,
                zIndex: cs.zIndex,
              },
            })
          }
        }
      }
    })
    return results
  })
  console.log("Teleprompter panels found:", JSON.stringify(panels, null, 2))

  // Scrape internal structure of the teleprompter panel
  if (panels.length > 0) {
    const innerStyles = await page.evaluate(() => {
      const panel = document.querySelector('.teleprompter') as HTMLElement
      if (!panel) return null

      const results: any = {}

      // Header area
      const headerEl = panel.querySelector('.teleprompter-header, :scope > div:first-child') as HTMLElement
      if (headerEl) {
        const cs = getComputedStyle(headerEl)
        results.header = {
          padding: cs.padding,
          borderBottom: cs.borderBottom,
          backgroundColor: cs.backgroundColor,
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          color: cs.color,
          height: cs.height,
          rect: JSON.parse(JSON.stringify(headerEl.getBoundingClientRect())),
        }
      }

      // All child divs
      const children = panel.children
      results.childCount = children.length
      results.children = []
      for (let i = 0; i < children.length; i++) {
        const child = children[i] as HTMLElement
        const cs = getComputedStyle(child)
        results.children.push({
          tag: child.tagName,
          class: child.className.toString().substring(0, 80),
          text: (child.textContent || '').substring(0, 40).replace(/\s+/g, ' '),
          rect: JSON.parse(JSON.stringify(child.getBoundingClientRect())),
          styles: {
            padding: cs.padding,
            borderBottom: cs.borderBottom,
            backgroundColor: cs.backgroundColor,
            fontSize: cs.fontSize,
            fontWeight: cs.fontWeight,
            color: cs.color,
          },
        })
      }

      // Controls (sliders, buttons)
      const sliders = panel.querySelectorAll('input[type="range"]')
      results.sliderCount = sliders.length
      results.sliders = []
      sliders.forEach((slider, i) => {
        const s = slider as HTMLInputElement
        const label = s.closest('div')?.querySelector('span, label')
        results.sliders.push({
          index: i,
          min: s.min, max: s.max, value: s.value, step: s.step,
          label: label?.textContent?.trim() || '',
          rect: JSON.parse(JSON.stringify(s.getBoundingClientRect())),
        })
      })

      // Textarea
      const textarea = panel.querySelector('textarea') as HTMLTextAreaElement
      if (textarea) {
        const cs = getComputedStyle(textarea)
        results.textarea = {
          placeholder: textarea.placeholder.substring(0, 80),
          fontSize: cs.fontSize,
          color: cs.color,
          lineHeight: cs.lineHeight,
          padding: cs.padding,
          rect: JSON.parse(JSON.stringify(textarea.getBoundingClientRect())),
        }
      }

      // Close button
      const closeBtn = panel.querySelector('button[class*="close"], button:last-of-type') as HTMLElement
      if (closeBtn) {
        const cs = getComputedStyle(closeBtn)
        results.closeBtn = {
          rect: JSON.parse(JSON.stringify(closeBtn.getBoundingClientRect())),
          fontSize: cs.fontSize,
          color: cs.color,
        }
      }

      // Play button
      const playBtn = panel.querySelector('button:first-of-type') as HTMLElement
      if (playBtn) {
        const cs = getComputedStyle(playBtn)
        results.playBtn = {
          rect: JSON.parse(JSON.stringify(playBtn.getBoundingClientRect())),
          width: cs.width,
          height: cs.height,
          borderRadius: cs.borderRadius,
          backgroundColor: cs.backgroundColor,
        }
      }

      return results
    })
    console.log("Teleprompter internal styles:", JSON.stringify(innerStyles, null, 2))
  }

  await context.close()
})
