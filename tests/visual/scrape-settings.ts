// @ts-nocheck
import { chromium } from "playwright"

const ORIGINAL_URL = "https://www.excalicord.com/"

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    locale: "zh-CN",
  })

  const page = await context.newPage()
  await page.goto(ORIGINAL_URL, { waitUntil: "domcontentloaded", timeout: 60000 })
  await page.waitForTimeout(5000)

  // Dismiss any welcome overlays
  const welcomeBtn = page.locator('button:has-text("了解了"), button:has-text("Got it"), button:has-text("开始")')
  if (await welcomeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await welcomeBtn.click()
    await page.waitForTimeout(1000)
  }

  // If settings panel is already visible, great. Otherwise click settings button.
  const settingsAlready = await page.locator(".settings-overlay").isVisible({ timeout: 2000 }).catch(() => false)
  if (!settingsAlready) {
    const settingsBtn = page.locator('.recording-controls button').first()
    await settingsBtn.click()
    await page.waitForTimeout(1000)
  }

  await page.waitForSelector(".settings-overlay", { timeout: 15000 })
  await page.waitForTimeout(1000)

  // Use addScriptTag to inject the scraping code to avoid tsx __name transform issue
  const styles = await page.evaluate(`
    (() => {
      const gs = (el) => {
        const cs = getComputedStyle(el);
        return {
          width: cs.width, height: cs.height, padding: cs.padding, margin: cs.margin,
          backgroundColor: cs.backgroundColor, color: cs.color, fontSize: cs.fontSize,
          fontWeight: cs.fontWeight, fontFamily: cs.fontFamily, borderRadius: cs.borderRadius,
          border: cs.border, boxShadow: cs.boxShadow, gap: cs.gap, display: cs.display,
          flexDirection: cs.flexDirection, alignItems: cs.alignItems, justifyContent: cs.justifyContent,
          overflow: cs.overflow, maxWidth: cs.maxWidth, maxHeight: cs.maxHeight,
          lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing, textTransform: cs.textTransform,
        };
      };
      const r = {};
      const q = (sel) => document.querySelector(sel);
      const qa = (sel) => document.querySelectorAll(sel);

      if (q(".settings-overlay")) r.overlay = gs(q(".settings-overlay"));
      if (q(".settings-panel")) r.panel = gs(q(".settings-panel"));
      if (q(".settings-preview-column")) r.previewColumn = gs(q(".settings-preview-column"));
      if (q(".settings-preview-label")) r.previewLabel = gs(q(".settings-preview-label"));
      if (q(".settings-preview-frame")) r.previewFrame = gs(q(".settings-preview-frame"));
      if (q(".settings-content")) r.content = gs(q(".settings-content"));
      if (q(".settings-header")) r.header = gs(q(".settings-header"));
      if (q(".settings-header h2")) r.headerTitle = gs(q(".settings-header h2"));
      if (q(".close-btn")) r.closeBtn = gs(q(".close-btn"));

      const shs = qa(".settings-section h3");
      r.sectionHeaders = Array.from(shs).map(s => ({ text: s.textContent, ...gs(s) }));

      const ab = qa(".aspect-btn");
      if (ab.length > 0) {
        r.aspectBtnActive = gs(ab[0]);
        r.aspectBtnInactive = gs(ab[1]);
        r.aspectGrid = gs(ab[0].parentElement);
      }

      const ct = qa(".bg-category-tab");
      if (ct.length > 0) {
        r.categoryTabActive = gs(ct[0]);
        r.categoryTabInactive = gs(ct[1]);
        r.categoryTabs = gs(ct[0].parentElement);
      }

      if (q(".random-bg-btn")) r.randomBtn = gs(q(".random-bg-btn"));

      const gb = qa(".gradient-btn");
      if (gb.length > 0) {
        r.gradientBtn = gs(gb[0]);
        r.gradientGrid = gs(gb[0].parentElement);
      }

      const tl = qa(".toggle-label");
      if (tl.length > 0) {
        r.toggleLabel = gs(tl[0]);
        const ts = tl[0].querySelector(".toggle-switch");
        if (ts) r.toggleSwitch = gs(ts);
      }

      const sl = qa("input.slider, .slider");
      if (sl.length > 0) r.slider = gs(sl[0]);

      const slb = qa(".slider-labels");
      if (slb.length > 0) r.sliderLabels = gs(slb[0]);

      const so = qa(".shape-option");
      if (so.length > 0) {
        r.shapeActive = gs(so[0]);
        r.shapeInactive = gs(so[1]);
        r.shapePicker = gs(so[0].parentElement);
      }

      const cb = qa(".color-btn");
      if (cb.length > 0) {
        r.colorBtn = gs(cb[0]);
        r.colorBtnContainer = gs(cb[0].parentElement);
      }

      if (q(".done-btn")) r.doneBtn = gs(q(".done-btn"));
      if (q(".account-section")) r.accountSection = gs(q(".account-section"));
      if (q(".upgrade-subtle-btn")) r.upgradeBtn = gs(q(".upgrade-subtle-btn"));

      return r;
    })()
  `)

  console.log(JSON.stringify(styles, null, 2))
  await browser.close()
})().catch(console.error)
