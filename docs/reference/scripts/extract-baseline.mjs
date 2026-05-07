import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
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

  // Close welcome
  try { await page.locator('button:has-text("了解了")').click(); } catch { await page.keyboard.press('Escape'); }
  await sleep(2000);

  const result = {};

  // ============================================================
  // A. CONTROL INVENTORY
  // ============================================================
  console.log('=== A. Control Inventory ===');

  // A1. Settings panel (already open after welcome)
  console.log('  A1. Settings panel...');
  result.settingsPanel = await page.evaluate(() => {
    const data = { sections: [] };
    const panel = document.querySelector('.settings-overlay, .settings-panel, [class*="settings"]');
    if (!panel) return { error: 'settings panel not found' };

    // Get all labeled sections
    const labels = panel.querySelectorAll('label, h3, h4, .section-title, .setting-label, [class*="label"]');
    const sections = [];
    labels.forEach(l => {
      const text = l.textContent?.trim();
      if (text && text.length < 50) sections.push(text);
    });
    data.sectionLabels = sections;

    // Get all buttons with text
    const buttons = panel.querySelectorAll('button');
    data.buttons = [];
    buttons.forEach(btn => {
      const text = btn.textContent?.trim();
      const cls = btn.className;
      const title = btn.getAttribute('title') || '';
      if (text || title) {
        data.buttons.push({ text: text?.slice(0, 60), class: cls?.slice(0, 80), title });
      }
    });

    // Get all input controls
    const inputs = panel.querySelectorAll('input, select, [role="slider"]');
    data.inputs = [];
    inputs.forEach(inp => {
      const type = inp.type || inp.tagName;
      const name = inp.name || inp.getAttribute('aria-label') || '';
      const value = inp.value || '';
      const min = inp.min || '';
      const max = inp.max || '';
      data.inputs.push({ type, name, value, min, max });
    });

    // Get all toggle switches
    const toggles = panel.querySelectorAll('[class*="toggle"], [class*="switch"], [role="switch"]');
    data.toggles = [];
    toggles.forEach(t => {
      const label = t.closest('label, [class*="setting"]')?.textContent?.trim() || '';
      const checked = t.classList.contains('active') || t.getAttribute('aria-checked') === 'true';
      data.toggles.push({ label: label.slice(0, 60), checked });
    });

    // Get all sliders
    const sliders = panel.querySelectorAll('input[type="range"]');
    data.sliders = [];
    sliders.forEach(s => {
      const label = s.closest('[class*="setting"], [class*="control"]')?.querySelector('label, [class*="label"]')?.textContent?.trim() || '';
      data.sliders.push({
        label: label || s.getAttribute('aria-label') || '',
        min: s.min, max: s.max, value: s.value, step: s.step
      });
    });

    return data;
  });
  console.log(`    found ${result.settingsPanel.buttons?.length || 0} buttons, ${result.settingsPanel.sliders?.length || 0} sliders`);

  // A1b. Settings panel - full DOM structure
  result.settingsDOM = await page.evaluate(() => {
    const panel = document.querySelector('.settings-overlay, .settings-panel');
    if (!panel) return 'not found';

    function extractTree(el, depth = 0) {
      if (depth > 4) return null;
      const tag = el.tagName?.toLowerCase();
      const cls = el.className && typeof el.className === 'string' ? el.className.split(' ').filter(c => c).slice(0, 3).join('.') : '';
      const text = el.childNodes.length === 1 && el.childNodes[0].nodeType === 3 ? el.textContent?.trim().slice(0, 40) : '';
      const children = [];
      for (const child of el.children) {
        const r = extractTree(child, depth + 1);
        if (r) children.push(r);
      }
      const node = { tag };
      if (cls) node.cls = cls;
      if (text) node.text = text;
      if (children.length) node.children = children;
      return node;
    }

    return extractTree(panel);
  });

  // Close settings
  try { await page.locator('button.close-btn').click(); } catch { await page.keyboard.press('Escape'); }
  await sleep(500);

  // Dismiss toast
  try {
    const toast = page.locator('.Toastify__close-button').first();
    if (await toast.count() > 0) await toast.click();
  } catch {}
  await sleep(300);

  // A2. Top toolbar
  console.log('  A2. Top toolbar...');
  result.topToolbar = await page.evaluate(() => {
    const tools = [];
    document.querySelectorAll('.App-toolbar button, [class*="toolbar"] button').forEach(btn => {
      const testid = btn.getAttribute('data-testid') || '';
      const label = btn.getAttribute('aria-label') || '';
      const title = btn.getAttribute('title') || '';
      const text = btn.textContent?.trim().slice(0, 30) || '';
      const shortcut = btn.querySelector('[class*="shortcut"]')?.textContent || '';
      const rect = btn.getBoundingClientRect();
      if (rect.y < 80) {
        tools.push({ testid, label, title, text, shortcut, x: Math.round(rect.x), y: Math.round(rect.y) });
      }
    });
    return tools;
  });
  console.log(`    found ${result.topToolbar.length} toolbar buttons`);

  // A3. Hamburger menu
  console.log('  A3. Hamburger menu...');
  try {
    await page.locator('[data-testid="main-menu-trigger"]').click({ force: true });
    await sleep(800);
    result.hamburgerMenu = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('[class*="dropdown-menu-container"] button, [class*="dropdown-menu-container"] a, .dropdown-menu-item').forEach(item => {
        const text = item.textContent?.trim().slice(0, 50) || '';
        const shortcut = item.querySelector('[class*="shortcut"]')?.textContent || '';
        const testid = item.getAttribute('data-testid') || '';
        if (text) items.push({ text, shortcut, testid });
      });
      // Also get section headers
      document.querySelectorAll('[class*="dropdown-menu-container"] [class*="group-title"]').forEach(h => {
        items.push({ text: `[SECTION] ${h.textContent?.trim()}`, shortcut: '', testid: '' });
      });
      return items;
    });
    console.log(`    found ${result.hamburgerMenu.length} menu items`);
    await page.keyboard.press('Escape');
    await sleep(400);
  } catch(e) { console.log('    ⚠️', e.message.slice(0, 60)); }

  // A4. More tools dropdown
  console.log('  A4. More tools...');
  try {
    await page.locator('[data-testid="dropdown-menu-button"]').click({ force: true });
    await sleep(600);
    result.moreTools = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('.dropdown-menu-container button, [data-testid*="toolbar"]').forEach(item => {
        const text = item.textContent?.trim().slice(0, 50) || '';
        const testid = item.getAttribute('data-testid') || '';
        const label = item.getAttribute('aria-label') || '';
        const title = item.getAttribute('title') || '';
        const rect = item.getBoundingClientRect();
        if (rect.y > 50 && rect.y < 200 && text) {
          items.push({ text, testid, label, title });
        }
      });
      return items;
    });
    console.log(`    found ${result.moreTools.length} items`);
    await page.keyboard.press('Escape');
    await sleep(400);
  } catch(e) { console.log('    ⚠️', e.message.slice(0, 60)); }

  // A5. Right-click context menu
  console.log('  A5. Context menu...');
  try {
    await page.mouse.click(700, 450, { button: 'right' });
    await sleep(600);
    result.contextMenu = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('[class*="context-menu"] button, [class*="context-menu"] [class*="item"]').forEach(item => {
        const text = item.textContent?.trim().slice(0, 50) || '';
        const shortcut = item.querySelector('[class*="shortcut"]')?.textContent || '';
        if (text) items.push({ text, shortcut });
      });
      return items;
    });
    console.log(`    found ${result.contextMenu.length} items`);
    await page.keyboard.press('Escape');
    await sleep(300);
  } catch(e) { console.log('    ⚠️', e.message.slice(0, 60)); }

  // A6. Help panel / keyboard shortcuts
  console.log('  A6. Help panel...');
  try {
    await page.locator('button.help-icon').click({ force: true });
    await sleep(600);
    result.helpPanel = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('[class*="HelpDialog"] [class*="shortcut"], [class*="help"] tr, [class*="help"] li').forEach(item => {
        items.push(item.textContent?.trim().slice(0, 80) || '');
      });
      // Also try dialog content
      const dialog = document.querySelector('[class*="HelpDialog"], [class*="help-dialog"], dialog');
      if (dialog) {
        return { items, fullText: dialog.textContent?.slice(0, 3000) };
      }
      return { items };
    });
    console.log(`    found ${result.helpPanel.items?.length || 0} entries`);
    await page.keyboard.press('Escape');
    await sleep(400);
  } catch(e) { console.log('    ⚠️', e.message.slice(0, 60)); }

  // A7. Bottom bar controls
  console.log('  A7. Bottom bar...');
  result.bottomBar = await page.evaluate(() => {
    const items = [];
    document.querySelectorAll('footer button, .App-bottom-bar button, .layer-ui__wrapper__footer button').forEach(btn => {
      const label = btn.getAttribute('aria-label') || '';
      const title = btn.getAttribute('title') || '';
      const text = btn.textContent?.trim().slice(0, 30) || '';
      items.push({ label, title, text });
    });
    return items;
  });
  console.log(`    found ${result.bottomBar.length} buttons`);

  // A8. Teleprompter panel structure
  console.log('  A8. Teleprompter...');
  try {
    await page.locator('button.teleprompter-btn').click({ force: true });
    await sleep(800);
    result.teleprompter = await page.evaluate(() => {
      const panel = document.querySelector('[class*="teleprompter"], [class*="Teleprompter"]');
      if (!panel) return { error: 'not found' };
      const controls = [];
      panel.querySelectorAll('button, input, [role="slider"], label, [class*="label"]').forEach(el => {
        const tag = el.tagName;
        const text = el.textContent?.trim().slice(0, 40) || '';
        const type = el.type || '';
        const cls = el.className?.slice(0, 60) || '';
        controls.push({ tag, text, type, cls });
      });
      return { controls, fullText: panel.textContent?.slice(0, 500) };
    });
    console.log(`    found ${result.teleprompter.controls?.length || 0} controls`);
    await page.locator('button.teleprompter-btn').click({ force: true });
    await sleep(400);
  } catch(e) { console.log('    ⚠️', e.message.slice(0, 60)); }

  // A9. Properties panel (need a shape selected)
  console.log('  A9. Properties panel...');
  try {
    await page.keyboard.press('r');
    await sleep(200);
    await page.mouse.move(500, 400);
    await page.mouse.down();
    await page.mouse.move(700, 550, { steps: 5 });
    await page.mouse.up();
    await sleep(500);

    result.propertiesPanel = await page.evaluate(() => {
      const sections = [];
      // Left-side properties panel
      document.querySelectorAll('.App-menu_left [class*="section"], [class*="properties"] [class*="section"], .selected-shape-actions [class*="buttonList"]').forEach(sec => {
        const label = sec.querySelector('label, [class*="label"], legend')?.textContent?.trim() || '';
        const buttons = [];
        sec.querySelectorAll('button').forEach(btn => {
          buttons.push({
            label: btn.getAttribute('aria-label') || btn.getAttribute('title') || '',
            active: btn.classList.contains('active') || btn.getAttribute('aria-checked') === 'true',
          });
        });
        if (label || buttons.length) sections.push({ label, buttons });
      });

      // Alternative: get all labeled groups
      const allLabels = [];
      document.querySelectorAll('.Island label, .Island legend, .Island [class*="section-title"]').forEach(l => {
        const rect = l.getBoundingClientRect();
        if (rect.x < 250) { // left panel
          allLabels.push(l.textContent?.trim().slice(0, 40));
        }
      });

      return { sections, allLabels };
    });
    console.log(`    found ${result.propertiesPanel.sections?.length || 0} sections, ${result.propertiesPanel.allLabels?.length || 0} labels`);
  } catch(e) { console.log('    ⚠️', e.message.slice(0, 60)); }

  // A10. Slide panel
  console.log('  A10. Slide panel...');
  result.slidePanel = await page.evaluate(() => {
    const panel = document.querySelector('[class*="slide"], [class*="Slide"]');
    if (!panel) return { error: 'not found at top level' };
    const btns = [];
    panel.querySelectorAll('button').forEach(btn => {
      btns.push({
        text: btn.textContent?.trim().slice(0, 30),
        title: btn.getAttribute('title') || '',
        cls: btn.className?.slice(0, 60),
      });
    });
    return { buttons: btns, fullText: panel.textContent?.slice(0, 200) };
  });

  // ============================================================
  // B. INTERACTION STATES
  // ============================================================
  console.log('\n=== B. Interaction States ===');

  // B1. Button hover/active states
  console.log('  B1. Button states...');
  result.buttonStates = await page.evaluate(() => {
    const states = [];
    const buttons = [
      { selector: 'button.record-button', name: 'Record' },
      { selector: 'button.settings-btn', name: 'Settings' },
      { selector: 'button.teleprompter-btn', name: 'Teleprompter' },
      { selector: '[data-testid="main-menu-trigger"]', name: 'Hamburger' },
      { selector: 'button.help-icon', name: 'Help' },
      { selector: 'button.slide-add-btn', name: 'AddSlide' },
    ];

    buttons.forEach(({ selector, name }) => {
      const el = document.querySelector(selector);
      if (!el) { states.push({ name, error: 'not found' }); return; }
      const cs = getComputedStyle(el);
      states.push({
        name,
        normal: {
          bg: cs.backgroundColor,
          color: cs.color,
          border: cs.border,
          borderRadius: cs.borderRadius,
          boxShadow: cs.boxShadow,
          padding: cs.padding,
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          transition: cs.transition,
          cursor: cs.cursor,
          opacity: cs.opacity,
          width: cs.width,
          height: cs.height,
        }
      });
    });
    return states;
  });

  // B2. Toolbar button states
  result.toolbarButtonStates = await page.evaluate(() => {
    const states = [];
    document.querySelectorAll('.App-toolbar button').forEach((btn, i) => {
      if (i > 12) return;
      const cs = getComputedStyle(btn);
      const testid = btn.getAttribute('data-testid') || `btn-${i}`;
      const isActive = btn.classList.contains('active') || btn.getAttribute('aria-checked') === 'true';
      states.push({
        testid,
        isActive,
        bg: cs.backgroundColor,
        color: cs.color,
        border: cs.border,
        borderRadius: cs.borderRadius,
      });
    });
    return states;
  });

  // B3. Transition/animation CSS rules
  console.log('  B3. Transitions & animations...');
  result.animations = await page.evaluate(() => {
    const transitions = new Set();
    const animations = new Set();

    document.querySelectorAll('*').forEach(el => {
      const cs = getComputedStyle(el);
      if (cs.transition && cs.transition !== 'all 0s ease 0s' && cs.transition !== 'none') {
        transitions.add(cs.transition);
      }
      if (cs.animationName && cs.animationName !== 'none') {
        animations.add(`${cs.animationName}: ${cs.animationDuration} ${cs.animationTimingFunction} ${cs.animationIterationCount}`);
      }
    });

    // Get @keyframes from stylesheets
    const keyframes = [];
    try {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.type === CSSRule.KEYFRAMES_RULE) {
              keyframes.push({ name: rule.name, cssText: rule.cssText.slice(0, 200) });
            }
          }
        } catch {}
      }
    } catch {}

    return {
      transitions: [...transitions].slice(0, 30),
      animations: [...animations],
      keyframes: keyframes.slice(0, 20),
    };
  });
  console.log(`    ${result.animations.transitions?.length} transitions, ${result.animations.animations?.length} animations`);

  // ============================================================
  // C. CSS DESIGN TOKENS
  // ============================================================
  console.log('\n=== C. CSS Design Tokens ===');

  // C1. CSS custom properties (variables)
  console.log('  C1. CSS variables...');
  result.cssVariables = await page.evaluate(() => {
    const vars = {};
    const root = getComputedStyle(document.documentElement);

    // Try to extract from stylesheets
    try {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.selectorText === ':root' || rule.selectorText === ':root, :host') {
              for (const prop of rule.style) {
                if (prop.startsWith('--')) {
                  vars[prop] = rule.style.getPropertyValue(prop).trim();
                }
              }
            }
          }
        } catch {}
      }
    } catch {}

    // Also get computed values for common Excalidraw vars
    const excalidrawVars = [
      '--color-primary', '--color-primary-darker', '--color-primary-darkest',
      '--color-primary-light', '--color-surface-low', '--color-surface-mid',
      '--color-surface-high', '--color-on-primary-container',
      '--color-primary-container-bg', '--color-surface-primary-container',
      '--text-primary-color', '--text-secondary-color',
      '--island-bg-color', '--default-bg-color', '--color-brand',
      '--border-radius-lg', '--border-radius-md',
      '--space-factor', '--font-family',
    ];
    excalidrawVars.forEach(v => {
      const val = root.getPropertyValue(v).trim();
      if (val) vars[v] = val;
    });

    return vars;
  });
  console.log(`    found ${Object.keys(result.cssVariables).length} variables`);

  // C2. Key element computed styles
  console.log('  C2. Element styles...');
  result.elementStyles = await page.evaluate(() => {
    const extract = (selector, name) => {
      const el = document.querySelector(selector);
      if (!el) return { name, error: 'not found' };
      const cs = getComputedStyle(el);
      return {
        name,
        fontFamily: cs.fontFamily?.slice(0, 80),
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        color: cs.color,
        backgroundColor: cs.backgroundColor,
        borderRadius: cs.borderRadius,
        boxShadow: cs.boxShadow?.slice(0, 100),
        padding: cs.padding,
        margin: cs.margin,
        border: cs.border,
        gap: cs.gap,
        width: cs.width,
        height: cs.height,
      };
    };

    return [
      extract('body', 'body'),
      extract('.excalidraw', 'excalidraw-root'),
      extract('.App-toolbar', 'toolbar'),
      extract('.Island', 'island-panel'),
      extract('button.record-button', 'record-button'),
      extract('button.settings-btn', 'settings-icon'),
      extract('button.teleprompter-btn', 'teleprompter-icon'),
      extract('[data-testid="main-menu-trigger"]', 'hamburger'),
      extract('button.help-icon', 'help-icon'),
      extract('button.slide-add-btn', 'add-slide'),
      extract('footer, .layer-ui__wrapper__footer', 'footer'),
      extract('.control-group', 'control-group'),
    ];
  });

  // C3. Z-index layers
  console.log('  C3. Z-index layers...');
  result.zIndexes = await page.evaluate(() => {
    const layers = [];
    document.querySelectorAll('*').forEach(el => {
      const cs = getComputedStyle(el);
      const z = parseInt(cs.zIndex);
      if (!isNaN(z) && z !== 0) {
        const cls = el.className && typeof el.className === 'string' ? el.className.split(' ').slice(0, 2).join('.') : '';
        const tag = el.tagName.toLowerCase();
        layers.push({ zIndex: z, element: `${tag}.${cls}`, rect: {
          x: Math.round(el.getBoundingClientRect().x),
          y: Math.round(el.getBoundingClientRect().y),
        }});
      }
    });
    // Deduplicate by z-index + class
    const seen = new Set();
    return layers.filter(l => {
      const key = `${l.zIndex}-${l.element}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).sort((a, b) => b.zIndex - a.zIndex).slice(0, 30);
  });
  console.log(`    found ${result.zIndexes.length} z-index layers`);

  // C4. Color palette extraction (all unique colors on page)
  console.log('  C4. Color palette...');
  result.colorPalette = await page.evaluate(() => {
    const colors = new Map();
    document.querySelectorAll('*').forEach(el => {
      const cs = getComputedStyle(el);
      [cs.color, cs.backgroundColor, cs.borderColor].forEach(c => {
        if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') {
          colors.set(c, (colors.get(c) || 0) + 1);
        }
      });
    });
    return [...colors.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 40)
      .map(([color, count]) => ({ color, count }));
  });
  console.log(`    found ${result.colorPalette.length} unique colors`);

  // ============================================================
  // Recording flow controls (need to enter preview)
  // ============================================================
  console.log('\n=== Recording Flow Controls ===');
  try {
    // Delete the shape first
    await page.keyboard.press('Escape');
    await sleep(200);

    await page.locator('button.record-button').click({ force: true });
    await sleep(2000);

    result.recordingPreviewControls = await page.evaluate(() => {
      const controls = [];
      // Get all visible buttons
      document.querySelectorAll('button').forEach(btn => {
        const rect = btn.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && rect.y < 80) {
          const cs = getComputedStyle(btn);
          controls.push({
            text: btn.textContent?.trim().slice(0, 40),
            class: btn.className?.slice(0, 80),
            bg: cs.backgroundColor,
            color: cs.color,
            borderRadius: cs.borderRadius,
            fontSize: cs.fontSize,
            fontWeight: cs.fontWeight,
            padding: cs.padding,
            width: cs.width,
            height: cs.height,
          });
        }
      });

      // Green preview border
      const frame = document.querySelector('[class*="recording-frame"], [class*="preview-frame"], [class*="frame-border"]');
      if (frame) {
        const fcs = getComputedStyle(frame);
        controls.push({
          text: '[FRAME BORDER]',
          borderColor: fcs.borderColor,
          borderWidth: fcs.borderWidth,
          borderStyle: fcs.borderStyle,
        });
      }

      // Hint text in center
      const hint = document.querySelector('[class*="hint"], [class*="drag-hint"]');
      if (hint) {
        const hcs = getComputedStyle(hint);
        controls.push({
          text: `[HINT] ${hint.textContent?.trim().slice(0, 60)}`,
          bg: hcs.backgroundColor,
          color: hcs.color,
          borderRadius: hcs.borderRadius,
          fontSize: hcs.fontSize,
        });
      }

      return controls;
    });
    console.log(`    found ${result.recordingPreviewControls.length} preview controls`);

    // Cancel preview
    const cancelBtn = page.locator('button:has-text("取消"), button:has-text("Cancel")').first();
    if (await cancelBtn.count() > 0) await cancelBtn.click();
    await sleep(500);
  } catch(e) { console.log('    ⚠️', e.message.slice(0, 80)); }

  // ============================================================
  // SAVE RESULTS
  // ============================================================
  const jsonPath = join(OUT, 'baseline-data.json');
  writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`\n💾 Saved to ${jsonPath}`);
  console.log(`   Total keys: ${Object.keys(result).length}`);

  await browser.close();
  console.log('🎉 Done!');
})();
