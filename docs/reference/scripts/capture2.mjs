import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = __dirname;
const SITE = 'https://www.excalicord.com';

async function snap(page, name, desc) {
  await page.screenshot({ path: join(OUT, name), fullPage: false });
  console.log(`  ✓ ${name} — ${desc}`);
}
async function wait(page, ms = 1500) { await page.waitForTimeout(ms); }

async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
    permissions: ['camera', 'microphone'],
  });
  const page = await context.newPage();

  await page.goto(SITE, { waitUntil: 'networkidle', timeout: 20000 });
  await wait(page, 2000);

  // Close welcome
  const gotIt = await page.$('button:has-text("Got it")');
  if (gotIt) { await gotIt.click(); await wait(page); }

  // ── Settings: scroll to bottom to capture camera shape section ──
  console.log('[A] Settings panel - scrolled sections');

  // Find scrollable settings container
  const settingsOverlay = await page.$('.settings-overlay');
  if (settingsOverlay) {
    // Find inner scrollable area
    const scrollable = await page.$('.settings-right, .settings-content, .settings-overlay .settings-panel');
    if (scrollable) {
      const scrollHeight = await scrollable.evaluate(el => el.scrollHeight);
      console.log(`  Settings scrollHeight: ${scrollHeight}px`);
      // Scroll to bottom
      await scrollable.evaluate(el => el.scrollTo(0, el.scrollHeight));
      await wait(page, 800);
      await snap(page, '10-settings-bottom.png', 'Settings scrolled to bottom');
    } else {
      // Try scrolling the overlay itself
      await settingsOverlay.evaluate(el => el.scrollTo(0, el.scrollHeight));
      await wait(page, 800);
      await snap(page, '10-settings-bottom.png', 'Settings overlay scrolled');
    }
  }

  // Close settings
  const doneBtn = await page.$('button.done-btn, button:has-text("Done")');
  if (doneBtn) { await doneBtn.click(); await wait(page); }

  // ── Click Record to get preview frame ──
  console.log('\n[B] Recording preview frame');
  const recBtn = await page.$('button.record-button, button:has-text("Record")');
  if (recBtn) {
    await recBtn.click();
    await wait(page, 2000);
    await snap(page, '11-recording-preview.png', 'Recording preview (green frame)');

    // ── Click "Start Recording" to begin actual recording ──
    console.log('\n[C] Start actual recording');
    const startBtn = await page.$('button:has-text("Start Recording")');
    if (startBtn) {
      console.log('  Found "Start Recording" button');
      await startBtn.click();
      // Wait for countdown or recording to start
      await wait(page, 1000);
      await snap(page, '12-countdown-or-starting.png', 'Countdown or starting');
      await wait(page, 3000);
      await snap(page, '13-recording-active.png', 'Recording active');

      // ── Discover recording controls ──
      const visibleBtns = await page.$$('button:visible');
      console.log(`\n  Visible buttons during recording:`);
      for (const btn of visibleBtns) {
        const text = (await btn.textContent() || '').trim();
        const cls = (await btn.getAttribute('class') || '').slice(0, 50);
        if (text) console.log(`    "${text}" | ${cls}`);
      }

      // ── Try Pause ──
      console.log('\n[D] Pause recording');
      const pauseBtn = await page.$('button:has-text("Pause"), button[class*="pause"], [class*="pause"] button');
      if (pauseBtn) {
        await pauseBtn.click();
        await wait(page, 1500);
        await snap(page, '14-recording-paused.png', 'Recording paused');

        // Discover pause-state buttons
        const pauseBtns = await page.$$('button:visible');
        console.log('  Buttons while paused:');
        for (const b of pauseBtns) {
          const t = (await b.textContent() || '').trim();
          if (t) console.log(`    "${t}"`);
        }
      } else {
        console.log('  ⚠ No Pause button found');
        // Maybe it's an icon-only button
        const allBtns = await page.$$('button:visible');
        for (const b of allBtns) {
          const aria = await b.getAttribute('aria-label');
          if (aria) console.log(`    aria-label: "${aria}"`);
        }
      }

      // ── Try Stop ──
      console.log('\n[E] Stop recording');
      const stopBtn = await page.$('button:has-text("Stop"), button:has-text("Finish"), button:has-text("Done"), button[class*="stop"]');
      if (stopBtn) {
        const text = await stopBtn.textContent();
        console.log(`  Clicking: "${text?.trim()}"`);
        await stopBtn.click();
        await wait(page, 3000);
        await snap(page, '15-after-stop.png', 'After stopping recording');

        // Check for export dialog
        const exportArea = await page.$('[class*="export"], [class*="Export"], [class*="preview"], [class*="Preview"]');
        if (exportArea) {
          console.log('  Export/preview area found');
          await wait(page, 2000);
          await snap(page, '16-export-dialog.png', 'Export/preview dialog');
        }
      } else {
        console.log('  ⚠ No Stop button found');
        // Cancel instead
        const cancelBtn = await page.$('button:has-text("Cancel"), button:has-text("Discard")');
        if (cancelBtn) {
          await cancelBtn.click();
          await wait(page);
        }
      }
    } else {
      console.log('  ⚠ "Start Recording" button not found');
    }
  }

  // ── Hamburger menu ──
  console.log('\n[F] Hamburger menu');
  const hamburger = await page.$('.hamburger-menu, button[aria-label="Menu"], .excalidraw button:first-child');
  // Click the hamburger (☰) in top-left
  const menuBtn = await page.$('[class*="HamburgerMenu"], .layer-ui__wrapper button:first-of-type');
  if (menuBtn) {
    await menuBtn.click();
    await wait(page, 1000);
    await snap(page, '17-hamburger-menu.png', 'Hamburger menu open');
  }

  await browser.close();
  console.log(`\n✅ Done`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
