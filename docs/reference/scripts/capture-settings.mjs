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
    viewport: { width: 1440, height: 1200 },
    locale: 'zh-CN',
    permissions: ['camera', 'microphone'],
  });
  const page = await context.newPage();

  await page.goto(SITE, { waitUntil: 'networkidle', timeout: 20000 });
  await wait(page, 2500);

  // Close welcome
  const gotIt = await page.$('button:has-text("了解了")');
  if (gotIt) { await gotIt.click(); await wait(page); }

  // ── Find the scrollable container in settings ──
  console.log('[1] Finding scrollable settings container...');

  // Dump settings overlay DOM structure
  const settingsOverlay = await page.$('.settings-overlay');
  if (!settingsOverlay) {
    console.log('  ⚠ No settings overlay found');
    await browser.close();
    return;
  }

  // Get all direct children classes
  const children = await settingsOverlay.$$(':scope > *');
  for (const c of children) {
    const tag = await c.evaluate(el => el.tagName.toLowerCase());
    const cls = await c.getAttribute('class');
    const scrollH = await c.evaluate(el => el.scrollHeight);
    const clientH = await c.evaluate(el => el.clientHeight);
    console.log(`  <${tag} class="${(cls||'').slice(0,60)}"> scrollH=${scrollH} clientH=${clientH}`);

    // Check sub-children for scrollable
    const subChildren = await c.$$(':scope > *');
    for (const sc of subChildren) {
      const stag = await sc.evaluate(el => el.tagName.toLowerCase());
      const scls = await sc.getAttribute('class');
      const sScrollH = await sc.evaluate(el => el.scrollHeight);
      const sClientH = await sc.evaluate(el => el.clientHeight);
      if (sScrollH > sClientH + 10) {
        console.log(`    ✦ SCROLLABLE: <${stag} class="${(scls||'').slice(0,50)}"> scrollH=${sScrollH} clientH=${sClientH}`);
      } else {
        console.log(`    <${stag} class="${(scls||'').slice(0,50)}"> scrollH=${sScrollH} clientH=${sClientH}`);
      }
    }
  }

  // ── Try scrolling the settings overlay itself ──
  console.log('\n[2] Trying to scroll settings-overlay itself...');
  const soScrollH = await settingsOverlay.evaluate(el => el.scrollHeight);
  const soClientH = await settingsOverlay.evaluate(el => el.clientHeight);
  console.log(`  settings-overlay: scrollH=${soScrollH} clientH=${soClientH}`);

  if (soScrollH > soClientH) {
    await settingsOverlay.evaluate(el => el.scrollTo(0, 400));
    await wait(page, 500);
    await snap(page, '03-settings-camera.png', 'Settings scrolled to camera');

    await settingsOverlay.evaluate(el => el.scrollTo(0, el.scrollHeight));
    await wait(page, 500);
    await snap(page, '04-settings-bottom.png', 'Settings scrolled to bottom');
  } else {
    // Maybe we need a taller viewport to see everything, or scroll the panel
    console.log('  Not scrollable. Taking full-height screenshot...');
    await snap(page, '02-settings-full.png', 'Settings full height (1200px viewport)');
  }

  await browser.close();
  console.log('\n✅ Done');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
