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
    locale: 'zh-CN',
    permissions: ['camera', 'microphone'],
  });
  const page = await context.newPage();

  await page.goto(SITE, { waitUntil: 'networkidle', timeout: 20000 });
  await wait(page, 2500);

  // ── 01: Welcome modal (Chinese) ──
  console.log('[01] 欢迎弹窗');
  await snap(page, '01-welcome-modal.png', 'Welcome modal (zh-CN)');

  // Close welcome
  const gotIt = await page.$('button:has-text("了解了"), button:has-text("Got it")');
  if (gotIt) { await gotIt.click(); await wait(page); }

  // ── 02: Settings overlay - top section ──
  console.log('[02] 录制设置 - 顶部');
  await snap(page, '02-settings-top.png', 'Settings overlay top');

  // ── 03: Settings overlay - scroll to camera section ──
  console.log('[03] 录制设置 - 摄像头/麦克风');
  const settingsRight = await page.$('.settings-right');
  if (settingsRight) {
    await settingsRight.evaluate(el => el.scrollTo(0, 400));
    await wait(page, 500);
    await snap(page, '03-settings-camera.png', 'Settings - camera/mic section');

    // ── 04: Settings - bottom (cursor, account) ──
    console.log('[04] 录制设置 - 光标/账户');
    await settingsRight.evaluate(el => el.scrollTo(0, el.scrollHeight));
    await wait(page, 500);
    await snap(page, '04-settings-bottom.png', 'Settings - cursor/account');

    // Scroll back to top
    await settingsRight.evaluate(el => el.scrollTo(0, 0));
    await wait(page, 300);
  }

  // ── 05: Close settings → canvas idle ──
  console.log('[05] 画布空闲态');
  const doneBtn = await page.$('button:has-text("完成"), button:has-text("Done"), button.done-btn');
  if (doneBtn) { await doneBtn.click(); await wait(page, 1000); }
  await snap(page, '05-canvas-idle.png', 'Canvas idle');

  // ── 06: Click Record → preview frame ──
  console.log('[06] 点击录制 → 预览帧');
  const recBtn = await page.$('button.record-button, button:has-text("录制")');
  if (recBtn) {
    await recBtn.click();
    await wait(page, 2000);
    await snap(page, '06-preview-frame.png', 'Preview frame (green border)');

    // ── 07: Click Start Recording → recording ──
    console.log('[07] 开始录制');
    const startBtn = await page.$('button:has-text("开始录制"), button:has-text("Start Recording")');
    if (startBtn) {
      await startBtn.click();
      await wait(page, 2000);
      await snap(page, '07-recording-active.png', 'Recording active');

      // ── 08: Pause ──
      console.log('[08] 暂停');
      const pauseBtn = await page.$('button.pause-button, button:has-text("暂停"), button:has-text("Pause")');
      if (pauseBtn) {
        await pauseBtn.click();
        await wait(page, 1500);
        await snap(page, '08-recording-paused.png', 'Recording paused');
      }

      // ── 09: Stop ──
      console.log('[09] 停止');
      const stopBtn = await page.$('button.stop-button, button:has-text("停止"), button:has-text("Stop")');
      if (stopBtn) {
        await stopBtn.click();
        await wait(page, 3000);
        await snap(page, '09-after-stop.png', 'After stop (toast)');
      }
    }
  }

  // ── 10: Re-open to capture slides panel & teleprompter ──
  console.log('[10] 幻灯片面板');
  // Click the slides icon (📋) in the control group
  const slidesBtn = await page.$('button.teleprompter-btn, button[class*="teleprompter"], button[class*="slides"]');
  if (slidesBtn) {
    await slidesBtn.click();
    await wait(page, 1000);
    await snap(page, '10-teleprompter.png', 'Teleprompter/slides panel');
  }

  // ── 11: Hamburger menu ──
  console.log('[11] 汉堡菜单');
  // Close any overlay first
  await page.keyboard.press('Escape');
  await wait(page, 500);
  const menuBtn = await page.$('.dropdown-menu-button.main-menu-trigger');
  if (menuBtn) {
    await menuBtn.click();
    await wait(page, 1000);
    await snap(page, '11-hamburger-menu.png', 'Hamburger menu');
  }

  // ── 12: Top-right control group close-up ──
  console.log('[12] 右上角控制组');
  await page.keyboard.press('Escape');
  await wait(page, 500);
  await page.screenshot({
    path: join(OUT, '12-control-group.png'),
    clip: { x: 980, y: 10, width: 460, height: 80 }
  });
  console.log('  ✓ 12-control-group.png');

  // ── Dump all button text for reference ──
  console.log('\n[INFO] All visible buttons:');
  const btns = await page.$$('button:visible');
  for (const b of btns) {
    const t = (await b.textContent() || '').trim();
    const cls = (await b.getAttribute('class') || '').slice(0, 50);
    if (t) console.log(`  "${t}" | ${cls}`);
  }

  await browser.close();
  console.log('\n✅ Chinese screenshots done');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
