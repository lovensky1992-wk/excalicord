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

  // Close welcome → settings panel auto-opens
  try { await page.locator('button:has-text("了解了")').click(); } catch { await page.keyboard.press('Escape'); }
  await sleep(2000);

  // Load existing data
  const dataPath = join(OUT, 'baseline-data.json');
  const data = JSON.parse(readFileSync(dataPath, 'utf-8'));

  // ============================================
  // FIX A1: Settings panel - deep extraction
  // ============================================
  console.log('=== Settings Panel Deep Extraction ===');
  data.settingsPanelDeep = await page.evaluate(() => {
    const sections = [];
    document.querySelectorAll('.settings-section').forEach((sec, i) => {
      const section = { index: i, title: '', controls: [] };

      // Section title
      const titleEl = sec.querySelector('.section-title, h3, h4, label:first-child');
      section.title = titleEl?.textContent?.trim() || `Section ${i}`;

      // All sub-elements
      sec.querySelectorAll('*').forEach(el => {
        const tag = el.tagName.toLowerCase();
        const cls = typeof el.className === 'string' ? el.className : '';
        const text = el.childNodes.length <= 2 && el.textContent?.trim().length < 80
          ? el.textContent.trim() : '';

        if (tag === 'button') {
          const cs = getComputedStyle(el);
          section.controls.push({
            type: 'button',
            text: text.slice(0, 50),
            class: cls.slice(0, 60),
            title: el.getAttribute('title') || '',
            active: el.classList.contains('active') || el.classList.contains('selected'),
            bg: cs.backgroundColor,
            color: cs.color,
            width: cs.width,
            height: cs.height,
          });
        } else if (tag === 'input') {
          section.controls.push({
            type: `input-${el.type}`,
            name: el.name || el.getAttribute('aria-label') || '',
            value: el.value,
            min: el.min, max: el.max, step: el.step,
            placeholder: el.placeholder || '',
            checked: el.checked,
          });
        } else if (tag === 'label' && text && !text.includes('\n')) {
          section.controls.push({ type: 'label', text: text.slice(0, 50) });
        } else if (tag === 'select') {
          const options = [];
          el.querySelectorAll('option').forEach(o => options.push(o.textContent.trim()));
          section.controls.push({ type: 'select', options });
        } else if (cls.includes('toggle') || cls.includes('switch')) {
          section.controls.push({
            type: 'toggle',
            class: cls.slice(0, 40),
            checked: el.classList.contains('active') || el.getAttribute('aria-checked') === 'true',
            label: el.closest('[class*="setting"]')?.querySelector('span, label')?.textContent?.trim() || '',
          });
        }
      });

      // Deduplicate labels inside buttons
      const seen = new Set();
      section.controls = section.controls.filter(c => {
        const key = `${c.type}-${c.text || c.name || c.class}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      sections.push(section);
    });

    // Account section
    const acct = document.querySelector('.account-section');
    if (acct) {
      sections.push({
        index: sections.length,
        title: 'Account',
        controls: [{ type: 'text', text: acct.textContent?.trim().slice(0, 100) }]
      });
    }

    // Done button
    const doneBtn = document.querySelector('button.done-btn');
    if (doneBtn) {
      sections.push({
        index: sections.length,
        title: 'Footer',
        controls: [{ type: 'button', text: doneBtn.textContent?.trim() }]
      });
    }

    return sections;
  });
  console.log(`  found ${data.settingsPanelDeep.length} sections`);
  data.settingsPanelDeep.forEach(s => {
    console.log(`    [${s.index}] ${s.title}: ${s.controls.length} controls`);
  });

  // Close settings
  try { await page.locator('button.close-btn').click(); } catch { await page.keyboard.press('Escape'); }
  await sleep(500);
  try { const t = page.locator('.Toastify__close-button').first(); if (await t.count() > 0) await t.click(); } catch {}
  await sleep(300);

  // ============================================
  // FIX A2: Top toolbar - wider selector
  // ============================================
  console.log('\n=== Top Toolbar Fix ===');
  data.topToolbarFix = await page.evaluate(() => {
    const tools = [];
    // Excalidraw toolbar buttons have data-testid
    document.querySelectorAll('[data-testid^="toolbar-"]').forEach(btn => {
      tools.push({
        testid: btn.getAttribute('data-testid'),
        label: btn.getAttribute('aria-label') || '',
        title: btn.getAttribute('title') || '',
        shortcutKey: btn.querySelector('[class*="shortcut"]')?.textContent || '',
      });
    });
    // Also the main toolbar container buttons
    document.querySelectorAll('.App-toolbar-container button').forEach(btn => {
      const testid = btn.getAttribute('data-testid') || '';
      if (!testid.startsWith('toolbar-')) {
        tools.push({
          testid: testid || 'unknown',
          label: btn.getAttribute('aria-label') || '',
          title: btn.getAttribute('title') || '',
          text: btn.textContent?.trim().slice(0, 30),
        });
      }
    });
    return tools;
  });
  console.log(`  found ${data.topToolbarFix.length} toolbar items`);

  // ============================================
  // FIX A8: Teleprompter - deeper extraction
  // ============================================
  console.log('\n=== Teleprompter Fix ===');
  try {
    await page.locator('button.teleprompter-btn').click({ force: true });
    await sleep(1000);
    data.teleprompterDeep = await page.evaluate(() => {
      // Find any panel that appeared
      const panels = [];
      document.querySelectorAll('[class*="teleprompter"], [class*="Teleprompter"], .teleprompter-panel').forEach(p => {
        const cs = getComputedStyle(p);
        panels.push({
          class: p.className?.slice(0, 80),
          visible: cs.display !== 'none' && cs.visibility !== 'hidden',
          rect: {
            x: Math.round(p.getBoundingClientRect().x),
            y: Math.round(p.getBoundingClientRect().y),
            w: Math.round(p.getBoundingClientRect().width),
            h: Math.round(p.getBoundingClientRect().height),
          },
          text: p.textContent?.trim().slice(0, 300),
          html: p.innerHTML?.slice(0, 500),
        });
      });

      // Also look for any new panels/overlays
      const newPanels = [];
      document.querySelectorAll('[class*="panel"], [class*="Panel"]').forEach(p => {
        const rect = p.getBoundingClientRect();
        if (rect.x > 900 && rect.width > 100 && rect.height > 100) {
          newPanels.push({
            class: p.className?.slice(0, 80),
            text: p.textContent?.trim().slice(0, 200),
          });
        }
      });

      return { panels, newPanels };
    });
    console.log(`  found ${data.teleprompterDeep.panels?.length} panels, ${data.teleprompterDeep.newPanels?.length} side panels`);

    await page.locator('button.teleprompter-btn').click({ force: true });
    await sleep(400);
  } catch(e) { console.log('  ⚠️', e.message.slice(0, 60)); }

  // ============================================
  // FIX A9: Properties panel
  // ============================================
  console.log('\n=== Properties Panel Fix ===');
  try {
    await page.keyboard.press('r');
    await sleep(200);
    await page.mouse.move(500, 400);
    await page.mouse.down();
    await page.mouse.move(700, 550, { steps: 5 });
    await page.mouse.up();
    await sleep(800);

    data.propertiesPanelDeep = await page.evaluate(() => {
      const result = { sections: [], raw: '' };

      // Get all Islands (Excalidraw's panel components)
      document.querySelectorAll('.Island').forEach(island => {
        const rect = island.getBoundingClientRect();
        if (rect.x > 300) return; // only left panel

        const section = {
          labels: [],
          buttons: [],
          sliders: [],
          colorButtons: [],
        };

        island.querySelectorAll('legend, label, [class*="label"]').forEach(l => {
          const text = l.textContent?.trim();
          if (text && text.length < 40) section.labels.push(text);
        });

        island.querySelectorAll('button').forEach(btn => {
          const label = btn.getAttribute('aria-label') || btn.getAttribute('title') || '';
          const checked = btn.getAttribute('aria-checked');
          if (label) section.buttons.push({ label, checked });
        });

        island.querySelectorAll('input[type="range"]').forEach(s => {
          section.sliders.push({ min: s.min, max: s.max, value: s.value, step: s.step });
        });

        if (section.labels.length || section.buttons.length) {
          result.sections.push(section);
        }
      });

      // Capture all text on left side
      const leftPanel = document.querySelector('.App-menu_left, [class*="selected"]');
      if (leftPanel) {
        result.raw = leftPanel.textContent?.trim().slice(0, 500);
      }

      return result;
    });
    console.log(`  found ${data.propertiesPanelDeep.sections?.length} sections`);
  } catch(e) { console.log('  ⚠️', e.message.slice(0, 60)); }

  // ============================================
  // Recording state controls (preview + active)
  // ============================================
  console.log('\n=== Recording States Controls ===');
  try {
    await page.keyboard.press('Escape');
    await sleep(300);
    await page.locator('button.record-button').click({ force: true });
    await sleep(2000);

    // Preview state - detailed
    data.recordingStates = {};
    data.recordingStates.preview = await page.evaluate(() => {
      const controls = [];
      // Top-right control area
      document.querySelectorAll('button').forEach(btn => {
        const rect = btn.getBoundingClientRect();
        if (rect.y < 80 && rect.x > 900) {
          const cs = getComputedStyle(btn);
          controls.push({
            text: btn.textContent?.trim().slice(0, 40),
            class: btn.className?.slice(0, 60),
            bg: cs.backgroundColor,
            color: cs.color,
            border: cs.border,
            borderRadius: cs.borderRadius,
            padding: cs.padding,
            fontSize: cs.fontSize,
            fontWeight: cs.fontWeight,
          });
        }
      });

      // Frame/canvas border
      const canvas = document.querySelector('canvas, [class*="excalidraw"]');
      const frame = document.querySelector('[class*="frame"], [class*="recording-area"]');

      // Green border info
      const allElements = document.querySelectorAll('*');
      let greenBorder = null;
      allElements.forEach(el => {
        const cs = getComputedStyle(el);
        if (cs.borderColor.includes('76, 175') || cs.borderColor.includes('green') || cs.outlineColor.includes('76, 175')) {
          greenBorder = {
            element: el.className?.slice(0, 60),
            borderColor: cs.borderColor,
            borderWidth: cs.borderWidth,
            borderStyle: cs.borderStyle,
          };
        }
      });

      // Center hint
      let hint = null;
      document.querySelectorAll('[class*="hint"], [class*="Hint"], [class*="tooltip"]').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.x > 300 && rect.x < 900) {
          hint = {
            text: el.textContent?.trim(),
            class: el.className?.slice(0, 60),
            bg: getComputedStyle(el).backgroundColor,
            color: getComputedStyle(el).color,
            borderRadius: getComputedStyle(el).borderRadius,
          };
        }
      });

      return { controls, greenBorder, hint };
    });
    console.log('  preview:', data.recordingStates.preview.controls.length, 'controls');

    // Start recording to get active state
    const startBtn = page.locator('button:has-text("开始录制"), button:has-text("Start Recording")').first();
    if (await startBtn.count() > 0) {
      await startBtn.click();
      await sleep(4500);

      data.recordingStates.active = await page.evaluate(() => {
        const controls = [];
        document.querySelectorAll('button').forEach(btn => {
          const rect = btn.getBoundingClientRect();
          if (rect.y < 80 && rect.x > 900) {
            const cs = getComputedStyle(btn);
            controls.push({
              text: btn.textContent?.trim().slice(0, 40),
              class: btn.className?.slice(0, 60),
              bg: cs.backgroundColor,
              color: cs.color,
              borderRadius: cs.borderRadius,
            });
          }
        });

        // REC indicator
        let recIndicator = null;
        document.querySelectorAll('[class*="rec"], [class*="Rec"], [class*="indicator"]').forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.x < 200 && rect.y < 100) {
            const cs = getComputedStyle(el);
            recIndicator = {
              text: el.textContent?.trim(),
              class: el.className?.slice(0, 60),
              bg: cs.backgroundColor,
              color: cs.color,
              borderRadius: cs.borderRadius,
              animation: cs.animation,
            };
          }
        });

        // Red border
        let redBorder = null;
        document.querySelectorAll('*').forEach(el => {
          const cs = getComputedStyle(el);
          if (cs.borderColor.includes('239, 68') || cs.borderColor.includes('255, 0') || cs.borderColor.includes('red')) {
            if (!redBorder) {
              redBorder = {
                element: el.className?.slice(0, 60),
                borderColor: cs.borderColor,
                borderWidth: cs.borderWidth,
              };
            }
          }
        });

        // Timer
        let timer = null;
        document.querySelectorAll('*').forEach(el => {
          if (el.textContent?.match(/^\d{2}:\d{2}$/) && el.children.length === 0) {
            timer = {
              text: el.textContent.trim(),
              class: el.className?.slice(0, 40),
              fontSize: getComputedStyle(el).fontSize,
            };
          }
        });

        return { controls, recIndicator, redBorder, timer };
      });
      console.log('  active:', data.recordingStates.active.controls.length, 'controls');

      // Pause
      const pauseBtn = page.locator('button:has-text("暂停"), button:has-text("Pause")').first();
      if (await pauseBtn.count() > 0) {
        await pauseBtn.click();
        await sleep(1000);
        data.recordingStates.paused = await page.evaluate(() => {
          const controls = [];
          document.querySelectorAll('button').forEach(btn => {
            const rect = btn.getBoundingClientRect();
            if (rect.y < 80 && rect.x > 900) {
              controls.push({
                text: btn.textContent?.trim().slice(0, 40),
                class: btn.className?.slice(0, 60),
                bg: getComputedStyle(btn).backgroundColor,
              });
            }
          });
          return { controls };
        });
        console.log('  paused:', data.recordingStates.paused.controls.length, 'controls');
      }

      // Stop
      const stopBtn = page.locator('button:has-text("停止"), button:has-text("Stop")').first();
      if (await stopBtn.count() > 0) {
        await stopBtn.click();
        await sleep(2000);
      }
    }
  } catch(e) { console.log('  ⚠️', e.message.slice(0, 80)); }

  // Save updated data
  writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\n💾 Updated ${dataPath}`);

  await browser.close();
  console.log('🎉 Done!');
})();
