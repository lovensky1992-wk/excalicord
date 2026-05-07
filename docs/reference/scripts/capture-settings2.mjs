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

  // Close welcome
  const gotIt = await page.$('button:has-text("了解了")');
  if (gotIt) { await gotIt.click(); await wait(page); }

  const sc = await page.$('.settings-content');
  if (!sc) { console.log('⚠ .settings-content not found'); await browser.close(); return; }

  // Top section (aspect ratio + backgrounds)
  console.log('[1] Settings top');
  await sc.evaluate(el => el.scrollTo(0, 0));
  await wait(page, 500);
  await snap(page, '02-settings-top.png', 'Settings top - aspect ratio & backgrounds');

  // Middle section (corner radius, camera, mic)
  console.log('[2] Settings middle');
  await sc.evaluate(el => el.scrollTo(0, 500));
  await wait(page, 500);
  await snap(page, '03-settings-middle.png', 'Settings middle - camera & mic');

  // Bottom section (canvas margin, cursor effect, account)
  console.log('[3] Settings bottom');
  await sc.evaluate(el => el.scrollTo(0, el.scrollHeight));
  await wait(page, 500);
  await snap(page, '04-settings-bottom.png', 'Settings bottom - cursor & account');

  await browser.close();
  console.log('\n✅ Done');
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
