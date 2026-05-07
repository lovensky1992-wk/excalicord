import { chromium } from 'playwright';
import { join } from 'path';

const OUT = '/Users/wangkai/Projects/excalicord/docs/reference';
const URL = 'https://www.excalicord.com/';
const VP = { width: 1440, height: 900 };

const sleep = ms => new Promise(r => setTimeout(r, ms));
const shot = async (page, name) => {
  await page.screenshot({ path: join(OUT, `${name}.png`) });
  console.log(`✅ ${name}`);
};
const elShot = async (el, name) => {
  await el.screenshot({ path: join(OUT, `${name}.png`) });
  console.log(`✅ ${name}`);
};

(async () => {
  const browser = await chromium.launch({ headless: false });
  const ctx = await browser.newContext({
    viewport: VP,
    locale: 'zh-CN',
    permissions: ['camera', 'microphone'],
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(10000);

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(3000);

  // 1. Welcome modal
  await shot(page, 'zh-01-welcome-modal');

  // Close welcome
  try {
    await page.locator('button:has-text("了解了")').click();
  } catch { await page.keyboard.press('Escape'); }
  await sleep(2000);

  // Settings panel auto-opens after welcome. Capture it.
  // 2. Settings - top (aspect ratios + wallpaper categories)
  await shot(page, 'zh-02-settings-top');

  // 3-6. Scroll settings panel
  const scrollable = page.locator('.settings-right, .settings-content').first();
  if (await scrollable.count() > 0) {
    const sh = await scrollable.evaluate(el => el.scrollHeight);
    console.log(`  settings scrollHeight: ${sh}px`);

    const steps = Math.ceil(sh / 400);
    for (let i = 1; i <= steps && i <= 6; i++) {
      await scrollable.evaluate((el, top) => el.scrollTop = top, i * 400);
      await sleep(400);
      await shot(page, `zh-${String(2 + i).padStart(2, '0')}-settings-scroll-${i}`);
    }
  }

  // Close settings via close-btn
  try {
    await page.locator('button.close-btn').click();
  } catch { await page.keyboard.press('Escape'); }
  await sleep(500);

  // 9. Canvas idle (no overlay)
  // Dismiss any toast/banner
  try {
    const toast = page.locator('.Toastify__close-button, button[aria-label="close"]').first();
    if (await toast.count() > 0) await toast.click();
  } catch {}
  await sleep(500);
  await shot(page, 'zh-09-canvas-idle');

  // 10. Top toolbar close-up
  try {
    const toolbar = page.locator('.App-toolbar-container, .App-toolbar').first();
    if (await toolbar.count() > 0) await elShot(toolbar, 'zh-10-top-toolbar');
  } catch(e) { console.log('⚠️ toolbar:', e.message.slice(0,60)); }

  // 11. Bottom bar (zoom controls)
  try {
    const footer = page.locator('footer, .App-bottom-bar, .layer-ui__wrapper__footer').first();
    if (await footer.count() > 0) await elShot(footer, 'zh-11-bottom-bar');
  } catch(e) { console.log('⚠️ bottom:', e.message.slice(0,60)); }

  // 12. Control group (settings+teleprompter+record) close-up
  try {
    const controlGroup = page.locator('.control-group, .recording-controls-container').first();
    if (await controlGroup.count() > 0) {
      await elShot(controlGroup, 'zh-12-control-group');
    } else {
      // Capture the area manually via clip
      await page.screenshot({
        path: join(OUT, 'zh-12-control-group.png'),
        clip: { x: 1230, y: 20, width: 200, height: 55 }
      });
      console.log('✅ zh-12-control-group (clip)');
    }
  } catch(e) { console.log('⚠️ control:', e.message.slice(0,60)); }

  // 13. Hamburger menu
  try {
    await page.locator('[data-testid="main-menu-trigger"]').click({ force: true });
    await sleep(800);
    await shot(page, 'zh-13-hamburger-menu');
    await page.keyboard.press('Escape');
    await sleep(400);
  } catch(e) { console.log('⚠️ hamburger:', e.message.slice(0,60)); }

  // 14. More tools dropdown
  try {
    await page.locator('[data-testid="dropdown-menu-button"]').click({ force: true });
    await sleep(600);
    await shot(page, 'zh-14-more-tools');
    await page.keyboard.press('Escape');
    await sleep(400);
  } catch(e) { console.log('⚠️ more-tools:', e.message.slice(0,60)); }

  // 15. Add slide button area + click
  try {
    await page.locator('button.slide-add-btn').click();
    await sleep(800);
    await shot(page, 'zh-15-slide-added');
  } catch(e) { console.log('⚠️ slide:', e.message.slice(0,60)); }

  // 16. Teleprompter panel
  try {
    await page.locator('button.teleprompter-btn').click({ force: true });
    await sleep(800);
    await shot(page, 'zh-16-teleprompter');
    // Close teleprompter
    await page.locator('button.teleprompter-btn').click({ force: true });
    await sleep(400);
  } catch(e) { console.log('⚠️ teleprompter:', e.message.slice(0,60)); }

  // 17. Help panel
  try {
    await page.locator('button.help-icon').click({ force: true });
    await sleep(600);
    await shot(page, 'zh-17-help-panel');
    await page.keyboard.press('Escape');
    await sleep(400);
  } catch(e) { console.log('⚠️ help:', e.message.slice(0,60)); }

  // 18. Right-click context menu
  try {
    await page.mouse.click(700, 450, { button: 'right' });
    await sleep(600);
    await shot(page, 'zh-18-context-menu');
    await page.keyboard.press('Escape');
    await sleep(300);
  } catch(e) { console.log('⚠️ context:', e.message.slice(0,60)); }

  // 19. Draw a shape to show properties panel
  try {
    // Press R for rectangle shortcut
    await page.keyboard.press('r');
    await sleep(300);
    await page.mouse.move(400, 300);
    await page.mouse.down();
    await page.mouse.move(650, 500, { steps: 10 });
    await page.mouse.up();
    await sleep(500);
    await shot(page, 'zh-19-shape-properties');
  } catch(e) { console.log('⚠️ shape:', e.message.slice(0,60)); }

  // === RECORDING FLOW ===
  // 20. Open settings to show aspect ratio options
  try {
    await page.locator('button.settings-btn').click({ force: true });
    await sleep(800);

    // Capture each aspect ratio
    for (const ratio of ['4:3', '3:4', '9:16', '1:1']) {
      const ratioBtn = page.locator(`button.aspect-btn:has-text("${ratio}")`).first();
      if (await ratioBtn.count() > 0) {
        await ratioBtn.click();
        await sleep(500);
        await shot(page, `zh-20-ratio-${ratio.replace(':', 'x')}`);
      }
    }
    // Custom
    const customBtn = page.locator('button.aspect-btn:has-text("Custom")').first();
    if (await customBtn.count() > 0) {
      await customBtn.click();
      await sleep(500);
      await shot(page, 'zh-20-ratio-custom');
    }

    // Back to 16:9
    const r169 = page.locator('button.aspect-btn:has-text("16:9")').first();
    if (await r169.count() > 0) await r169.click();
    await sleep(300);

    // Wallpaper categories
    for (const cat of ['鲜艳', '柔和', '深色', '自然']) {
      const catBtn = page.locator(`button:has-text("${cat}")`).first();
      if (await catBtn.count() > 0) {
        await catBtn.click();
        await sleep(500);
        await shot(page, `zh-21-wp-${cat}`);
      }
    }

    // Close settings
    await page.locator('button.close-btn').click();
    await sleep(500);
  } catch(e) { console.log('⚠️ ratio/wp:', e.message.slice(0,80)); }

  // 22. Click Record - preview state
  try {
    await page.locator('button.record-button').click({ force: true });
    await sleep(2000);
    await shot(page, 'zh-22-record-preview');

    // 23. Preview control group close-up
    await page.screenshot({
      path: join(OUT, 'zh-23-preview-controls.png'),
      clip: { x: 1020, y: 20, width: 420, height: 70 }
    });
    console.log('✅ zh-23-preview-controls');

    // 24. Start recording
    const startBtn = page.locator('button:has-text("开始录制"), button:has-text("Start Recording")').first();
    if (await startBtn.count() > 0) {
      await startBtn.click();
      await sleep(500);
      await shot(page, 'zh-24-countdown');
      await sleep(4000);
      await shot(page, 'zh-25-recording-active');

      // 26. Recording controls close-up
      await page.screenshot({
        path: join(OUT, 'zh-26-recording-controls.png'),
        clip: { x: 1000, y: 20, width: 440, height: 70 }
      });
      console.log('✅ zh-26-recording-controls');

      // REC badge close-up
      await page.screenshot({
        path: join(OUT, 'zh-26b-rec-badge.png'),
        clip: { x: 70, y: 50, width: 90, height: 40 }
      });
      console.log('✅ zh-26b-rec-badge');

      // 27. Pause
      const pauseBtn = page.locator('button:has-text("暂停"), button:has-text("Pause")').first();
      if (await pauseBtn.count() > 0) {
        await pauseBtn.click();
        await sleep(1000);
        await shot(page, 'zh-27-recording-paused');

        // 28. Resume
        const resumeBtn = page.locator('button:has-text("继续"), button:has-text("Resume")').first();
        if (await resumeBtn.count() > 0) {
          await resumeBtn.click();
          await sleep(1500);
          await shot(page, 'zh-28-recording-resumed');
        }
      }

      // 29. Stop
      await sleep(500);
      const stopBtn = page.locator('button:has-text("停止"), button:has-text("Stop")').first();
      if (await stopBtn.count() > 0) {
        await stopBtn.click();
        await sleep(2000);
        await shot(page, 'zh-29-after-stop');
        await sleep(2000);
        await shot(page, 'zh-30-export-done');
      }
    } else {
      console.log('⚠️ Start button not found, canceling preview');
      const cancelBtn = page.locator('button:has-text("取消"), button:has-text("Cancel")').first();
      if (await cancelBtn.count() > 0) await cancelBtn.click();
    }
  } catch(e) { console.log('⚠️ recording:', e.message.slice(0,100)); }

  // 31. Final state
  await sleep(1000);
  await shot(page, 'zh-31-final-state');

  console.log('\n🎉 All done!');
  await browser.close();
})();
