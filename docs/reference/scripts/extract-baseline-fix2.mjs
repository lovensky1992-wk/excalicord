import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const OUT = '/Users/wangkai/Projects/excalicord/docs/reference';
const URL = 'https://www.excalicord.com/';
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ headless: false });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'zh-CN',
    permissions: ['camera', 'microphone'],
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(10000);

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(3000);
  try { await page.locator('button:has-text("了解了")').click(); } catch { await page.keyboard.press('Escape'); }
  await sleep(2000);

  const dataPath = join(OUT, 'baseline-data.json');
  const data = JSON.parse(readFileSync(dataPath, 'utf-8'));

  // Close settings first
  try { await page.locator('button.close-btn').click(); } catch { await page.keyboard.press('Escape'); }
  await sleep(500);
  try { const t = page.locator('.Toastify__close-button').first(); if (await t.count() > 0) await t.click(); } catch {}
  await sleep(300);

  // Fix teleprompter
  console.log('=== Teleprompter ===');
  try {
    await page.locator('button.teleprompter-btn').click({ force: true });
    await sleep(1000);

    data.teleprompterFixed = await page.evaluate(() => {
      const result = { controls: [], text: '' };
      // Find right-side panels
      const allEls = document.querySelectorAll('div');
      for (const el of allEls) {
        const cls = el.getAttribute('class') || '';
        const rect = el.getBoundingClientRect();
        if (rect.x > 900 && rect.width > 150 && rect.height > 200 && rect.y > 60) {
          result.text = el.textContent?.trim().slice(0, 500);
          result.className = cls.slice(0, 100);
          result.rect = { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) };

          // Get all interactive elements
          el.querySelectorAll('button, input, textarea, [role="slider"]').forEach(ctrl => {
            result.controls.push({
              tag: ctrl.tagName.toLowerCase(),
              type: ctrl.type || '',
              text: ctrl.textContent?.trim().slice(0, 40),
              placeholder: ctrl.placeholder || '',
              class: (ctrl.getAttribute('class') || '').slice(0, 60),
              min: ctrl.min || '', max: ctrl.max || '', value: ctrl.value || '',
            });
          });
          break;
        }
      }
      return result;
    });
    console.log(`  text: ${data.teleprompterFixed.text?.slice(0, 80)}`);
    console.log(`  controls: ${data.teleprompterFixed.controls?.length}`);

    await page.locator('button.teleprompter-btn').click({ force: true });
    await sleep(400);
  } catch(e) { console.log('  ⚠️', e.message.slice(0, 60)); }

  // Fix properties panel - draw shape and use different approach
  console.log('\n=== Properties Panel ===');
  try {
    await page.keyboard.press('r');
    await sleep(200);
    await page.mouse.move(500, 400);
    await page.mouse.down();
    await page.mouse.move(700, 550, { steps: 5 });
    await page.mouse.up();
    await sleep(800);

    data.propertiesFixed = await page.evaluate(() => {
      const result = { labels: [], buttons: [], raw: '' };

      // Get everything on the left side (x < 250)
      const leftEls = [];
      document.querySelectorAll('*').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.x < 250 && rect.y > 60 && rect.y < 800 && rect.width > 10) {
          const tag = el.tagName.toLowerCase();
          const text = el.textContent?.trim();

          if (tag === 'legend' || tag === 'label') {
            if (text && text.length < 30) result.labels.push(text);
          } else if (tag === 'button') {
            const label = el.getAttribute('aria-label') || el.getAttribute('title') || text?.slice(0, 20) || '';
            const checked = el.getAttribute('aria-checked');
            if (label && !result.buttons.find(b => b.label === label)) {
              result.buttons.push({ label, checked, y: Math.round(rect.y) });
            }
          } else if (tag === 'input' && el.type === 'range') {
            result.buttons.push({
              label: `slider: ${el.min}-${el.max} (${el.value})`,
              y: Math.round(rect.y),
            });
          }
        }
      });

      // Sort by y position
      result.labels = [...new Set(result.labels)];
      result.buttons.sort((a, b) => a.y - b.y);

      return result;
    });
    console.log(`  labels: ${data.propertiesFixed.labels?.join(', ')}`);
    console.log(`  buttons: ${data.propertiesFixed.buttons?.length}`);
  } catch(e) { console.log('  ⚠️', e.message.slice(0, 60)); }

  // Extra: Camera bubble styles
  console.log('\n=== Camera Bubble ===');
  data.cameraBubble = await page.evaluate(() => {
    const cam = document.querySelector('[class*="camera"], [class*="Camera"], [class*="webcam"], video');
    if (!cam) return { error: 'not found' };
    const cs = getComputedStyle(cam);
    const parent = cam.closest('[class*="bubble"], [class*="camera-container"], [class*="Camera"]');
    const pcs = parent ? getComputedStyle(parent) : null;
    return {
      element: cam.tagName + '.' + (cam.getAttribute('class') || '').slice(0, 60),
      styles: {
        width: cs.width, height: cs.height,
        borderRadius: cs.borderRadius,
        border: cs.border,
        boxShadow: cs.boxShadow?.slice(0, 100),
        position: cs.position,
        overflow: cs.overflow,
      },
      parent: parent ? {
        class: (parent.getAttribute('class') || '').slice(0, 60),
        width: pcs.width, height: pcs.height,
        borderRadius: pcs.borderRadius,
        cursor: pcs.cursor,
        position: pcs.position,
      } : null,
    };
  });
  console.log(`  camera: ${data.cameraBubble.element || data.cameraBubble.error}`);

  writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\n💾 Updated ${dataPath}`);
  await browser.close();
  console.log('🎉 Done!');
})();
