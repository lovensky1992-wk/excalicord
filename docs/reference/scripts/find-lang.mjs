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
  await wait(page, 2000);

  // ── Step 1: Look for language switcher on welcome modal ──
  console.log('[1] Looking for language switch...');

  // Check all visible text for language clues
  const bodyText = await page.innerText('body');
  const isChinese = bodyText.includes('欢迎') || bodyText.includes('中文') || bodyText.includes('录制');
  console.log(`  Body contains Chinese: ${isChinese}`);
  console.log(`  First 200 chars: ${bodyText.slice(0, 200)}`);

  // Close welcome first
  const gotIt = await page.$('button:has-text("Got it"), button:has-text("开始")');
  if (gotIt) {
    const gotItText = await gotIt.textContent();
    console.log(`  Welcome button text: "${gotItText}"`);
    await gotIt.click();
    await wait(page);
  }

  // ── Step 2: Look for language settings in hamburger menu ──
  console.log('\n[2] Checking hamburger menu...');
  const hamburger = await page.$('button:first-child');
  // Find the menu button (☰) - it's typically the first button or has specific class
  const allBtns = await page.$$('button:visible');
  for (const btn of allBtns) {
    const text = (await btn.textContent() || '').trim();
    const ariaLabel = await btn.getAttribute('aria-label');
    const cls = (await btn.getAttribute('class') || '');
    if (text === '' || text === '☰' || ariaLabel?.includes('menu') || cls.includes('menu') || cls.includes('hamburger')) {
      console.log(`  Potential menu button: text="${text}" aria="${ariaLabel}" class="${cls.slice(0,40)}"`);
    }
  }

  // ── Step 3: Check if site responds to locale ──
  console.log('\n[3] Checking locale detection...');
  // The browser locale is already set to zh-CN, check if site auto-detected
  const pageTitle = await page.title();
  console.log(`  Page title: "${pageTitle}"`);

  // ── Step 4: Look for language toggle in settings overlay ──
  console.log('\n[4] Looking in settings...');
  // Settings might auto-open, or we need to click gear icon
  const settingsOverlay = await page.$('.settings-overlay');
  if (settingsOverlay) {
    console.log('  Settings overlay is visible');
    // Look for language-related elements
    const langEl = await page.$('[class*="lang"], [class*="Lang"], [class*="language"], select[class*="lang"], [class*="i18n"]');
    if (langEl) {
      console.log('  Found language element!');
      const text = await langEl.textContent();
      console.log(`  Text: "${text}"`);
    }

    // Scan all text in settings for language hints
    const settingsText = await settingsOverlay.innerText();
    console.log(`  Settings text:\n${settingsText.slice(0, 500)}`);
  }

  // ── Step 5: Try hamburger menu ──
  console.log('\n[5] Opening hamburger menu...');
  // The hamburger is the ☰ icon at top-left
  const menuArea = await page.$('.App-menu, [class*="menu-button"], [class*="HamburgerMenu"]');
  if (menuArea) {
    await menuArea.click();
    await wait(page);
    await snap(page, 'debug-hamburger.png', 'Hamburger menu');

    const menuText = await page.innerText('body');
    const langMatch = menuText.match(/(language|语言|lang|中文|english|简体|繁體)/i);
    if (langMatch) {
      console.log(`  Found language mention: "${langMatch[0]}"`);
    }
  }

  // ── Step 6: Check Excalidraw's own language handling ──
  console.log('\n[6] Checking Excalidraw lang...');
  // Excalidraw might have its own i18n - check localStorage
  const langSettings = await page.evaluate(() => {
    const keys = Object.keys(localStorage);
    const langKeys = keys.filter(k => k.includes('lang') || k.includes('i18n') || k.includes('locale'));
    const result = {};
    langKeys.forEach(k => result[k] = localStorage.getItem(k));
    // Also check all keys
    return { langKeys: result, allKeys: keys.slice(0, 30) };
  });
  console.log(`  localStorage lang keys: ${JSON.stringify(langSettings.langKeys)}`);
  console.log(`  All localStorage keys: ${JSON.stringify(langSettings.allKeys)}`);

  // ── Step 7: Try setting Excalidraw lang via localStorage ──
  console.log('\n[7] Trying to set lang to zh-CN...');
  await page.evaluate(() => {
    localStorage.setItem('excalidraw-lang', 'zh-CN');
    localStorage.setItem('lang', 'zh-CN');
  });
  await page.reload({ waitUntil: 'networkidle' });
  await wait(page, 2000);

  const newBodyText = await page.innerText('body');
  const nowChinese = newBodyText.includes('欢迎') || newBodyText.includes('录制') || newBodyText.includes('开始');
  console.log(`  After reload - Chinese: ${nowChinese}`);
  console.log(`  First 300 chars: ${newBodyText.slice(0, 300)}`);

  await snap(page, 'debug-after-lang-switch.png', 'After lang switch attempt');

  await browser.close();
  console.log('\n✅ Done');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
