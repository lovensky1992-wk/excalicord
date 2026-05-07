import { chromium } from 'playwright';

const URL = 'https://www.excalicord.com/';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'zh-CN',
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(10000);

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

  // Close welcome modal
  try {
    const btn = page.locator('button:has-text("了解了")');
    if (await btn.count() > 0) await btn.click();
  } catch { await page.keyboard.press('Escape'); }
  await new Promise(r => setTimeout(r, 1500));

  // Dump top-right control area
  const dump = await page.evaluate(() => {
    const results = [];

    // Find all buttons on page and their text/aria/class
    document.querySelectorAll('button').forEach((btn, i) => {
      const rect = btn.getBoundingClientRect();
      // Only top area or right area
      if (rect.x > 900 || rect.y < 100) {
        results.push({
          index: i,
          tag: btn.tagName,
          class: btn.className.slice(0, 100),
          'aria-label': btn.getAttribute('aria-label') || '',
          title: btn.getAttribute('title') || '',
          'data-testid': btn.getAttribute('data-testid') || '',
          textContent: btn.textContent?.trim().slice(0, 50) || '',
          rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
          innerHTML_preview: btn.innerHTML.slice(0, 80),
        });
      }
    });
    return results;
  });

  console.log(JSON.stringify(dump, null, 2));
  await browser.close();
})();
