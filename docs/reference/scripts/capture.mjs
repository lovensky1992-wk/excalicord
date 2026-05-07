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

async function wait(page, ms = 1500) {
  await page.waitForTimeout(ms);
}

async function main() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'en-US',
    permissions: ['camera', 'microphone'],
  });
  const page = await context.newPage();

  // ── Load site ──
  await page.goto(SITE, { waitUntil: 'networkidle', timeout: 20000 });
  await wait(page, 2000);

  // ── 01: Welcome modal ──
  console.log('[01] Welcome modal');
  await snap(page, '01-welcome-modal.png', 'Welcome modal');

  // Close welcome
  const gotIt = await page.$('button:has-text("Got it")');
  if (gotIt) { await gotIt.click(); await wait(page); }

  // ── 02: Settings overlay (auto-opens) ──
  console.log('[02] Settings overlay');
  await snap(page, '02-settings-overlay-top.png', 'Settings overlay top');

  // Scroll settings panel to see more options
  const settingsPanel = await page.$('.settings-content, .settings-panel, [class*="settings"]');
  if (settingsPanel) {
    await settingsPanel.evaluate(el => el.scrollTop = el.scrollHeight);
    await wait(page, 800);
    await snap(page, '02b-settings-overlay-bottom.png', 'Settings overlay bottom (scrolled)');
    // Scroll back up
    await settingsPanel.evaluate(el => el.scrollTop = 0);
  }

  // ── 03: Close settings, show canvas idle ──
  console.log('[03] Canvas idle (no overlay)');
  const doneBtn = await page.$('button:has-text("Done"), button.done-btn');
  const closeBtn = await page.$('button.close-btn, button:has-text("×")');
  if (doneBtn) {
    await doneBtn.click();
    await wait(page, 1000);
  } else if (closeBtn) {
    await closeBtn.click();
    await wait(page, 1000);
  }
  await snap(page, '03-canvas-idle.png', 'Canvas idle (settings closed)');

  // ── 04: Top toolbar close-up ──
  console.log('[04] Top toolbar');
  await page.screenshot({
    path: join(OUT, '04-top-toolbar.png'),
    clip: { x: 0, y: 0, width: 1440, height: 80 }
  });
  console.log('  ✓ 04-top-toolbar.png');

  // ── 05: Bottom bar close-up ──
  console.log('[05] Bottom bar');
  await page.screenshot({
    path: join(OUT, '05-bottom-bar.png'),
    clip: { x: 0, y: 780, width: 1440, height: 120 }
  });
  console.log('  ✓ 05-bottom-bar.png');

  // ── 06: Click Record ──
  console.log('[06] Record click');
  const recBtn = await page.$('button.record-button, button:has-text("Record")');
  if (recBtn) {
    await recBtn.click();
    await wait(page, 3000);
    await snap(page, '06-after-record-click.png', 'After clicking Record');

    // ── 07: Recording state ──
    console.log('[07] Recording state details');
    await wait(page, 2000);
    await snap(page, '07-recording-active.png', 'Recording active');

    // Look for pause button
    const pauseBtn = await page.$('button:has-text("Pause"), button.pause-button, button[class*="pause"]');
    if (pauseBtn) {
      console.log('  Found Pause button');
      await pauseBtn.click();
      await wait(page, 1500);
      await snap(page, '08-recording-paused.png', 'Recording paused');

      // Resume or stop
      const resumeBtn = await page.$('button:has-text("Resume")');
      if (resumeBtn) {
        console.log('  Found Resume button');
      }
    }

    // Look for stop/discard
    const stopBtn = await page.$('button:has-text("Stop"), button:has-text("Discard"), button:has-text("Cancel"), button.stop-button, button.discard-button');
    if (stopBtn) {
      const text = await stopBtn.textContent();
      console.log(`  Found stop: "${text?.trim()}"`);
      await stopBtn.click();
      await wait(page, 2000);
      await snap(page, '09-after-stop.png', 'After stopping recording');
    }
  } else {
    console.log('  ⚠ Record button not found');
  }

  // ── 10: Re-open settings to capture sections ──
  console.log('[10] Re-opening settings...');
  await page.goto(SITE, { waitUntil: 'networkidle', timeout: 15000 });
  await wait(page, 2000);
  // Close welcome if shown
  const gotIt2 = await page.$('button:has-text("Got it")');
  if (gotIt2) { await gotIt2.click(); await wait(page); }

  // Settings should be open again
  // Scroll to camera section
  const settingsContent = await page.$('.settings-content, [class*="settings-panel"], [class*="settings-overlay"] > div');
  if (settingsContent) {
    // Scroll slowly and capture different sections
    const scrollPositions = [0, 300, 600, 900, 1200];
    for (let i = 0; i < scrollPositions.length; i++) {
      await settingsContent.evaluate((el, pos) => el.scrollTop = pos, scrollPositions[i]);
      await wait(page, 500);
      await snap(page, `10-settings-scroll-${i}.png`, `Settings at scroll ${scrollPositions[i]}px`);
    }
  }

  // ── 11: Full page DOM summary ──
  console.log('\n[11] DOM summary');
  const allClasses = await page.evaluate(() => {
    const els = document.querySelectorAll('[class]');
    const classes = new Set();
    els.forEach(el => {
      el.className.split(/\s+/).forEach(c => {
        if (c && !c.startsWith('_') && c.length > 2) classes.add(c);
      });
    });
    return Array.from(classes).sort().join('\n');
  });
  console.log('  Unique classes:\n' + allClasses.split('\n').map(c => `    ${c}`).join('\n'));

  await browser.close();
  console.log(`\n✅ Done. Screenshots saved to ${OUT}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
