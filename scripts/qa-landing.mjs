import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const phase = process.argv[2] || 'after';
const origin = process.env.QA_ORIGIN || 'http://127.0.0.1:5173';
const out = process.env.QA_OUTPUT || `/home/ubuntu/iris-delivery/${phase}`;
const widths = [320, 360, 375, 390, 414, 430, 600, 768, 820, 1024, 1280, 1366, 1440, 1600, 1920];
const captureWidths = [375, 768, 1024, 1440, 1920];
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--ignore-certificate-errors'],
});
const records = [];
const languages = phase === 'before' ? ['ar'] : ['ar', 'en'];

for (const lang of languages) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce', ignoreHTTPSErrors: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(origin, { waitUntil: 'networkidle', timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  if (lang === 'en') {
    const en = page.locator('button.lp-lang-round[data-language="en"]');
    await en.click();
    await page.waitForFunction(() => document.documentElement.lang === 'en');
    await page.evaluate(() => document.fonts.ready);
  }
  for (const width of widths) {
    const height = width < 600 ? 900 : 1000;
    await page.setViewportSize({ width, height });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(180);
    if (captureWidths.includes(width)) {
      await page.evaluate(async () => {
        for (const image of document.images) { image.loading = 'eager'; }
        await Promise.all([...document.images].map(img => img.decode().catch(() => {})));
      });
      // Trigger old intersection transitions before photographing the entire page.
      if (phase === 'before') {
        await page.evaluate(async () => {
          for (let y = 0; y < document.documentElement.scrollHeight; y += 700) {
            window.scrollTo({ top: y, behavior: 'instant' });
            await new Promise(r => setTimeout(r, 65));
          }
          window.scrollTo({ top: 0, behavior: 'instant' });
        });
      }
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${out}/${lang}-${width}-viewport.png`, animations: 'disabled' });
      await page.screenshot({ path: `${out}/${lang}-${width}-full.png`, fullPage: true, animations: 'disabled' });
    }
    const metrics = await page.evaluate(() => {
      const visible = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.display !== 'none' && s.visibility !== 'hidden'; };
      const rect = el => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) }; };
      const overflow = [...document.querySelectorAll('header a, header button, main h1, main h2, main p, main img, .iris-landing button')].filter(visible).filter(el => { const r = el.getBoundingClientRect(); return r.left < -1 || r.right > innerWidth + 1; }).map(el => ({ tag: el.tagName, text: el.textContent?.trim().slice(0, 60), ...rect(el) }));
      return {
        innerWidth,
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        pageHeight: document.documentElement.scrollHeight,
        h1Count: document.querySelectorAll('h1').length,
        font: getComputedStyle(document.querySelector('h1')).fontFamily,
        titleSize: getComputedStyle(document.querySelector('h1')).fontSize,
        direction: document.documentElement.dir,
        header: rect(document.querySelector('header')),
        primaryCTA: rect(document.querySelector('[data-testid="hero-start"]')),
        logo: rect(document.querySelector('header img')),
        overflow,
        canvases: document.querySelectorAll('canvas').length,
      };
    });
    const rec = { lang, width, ...metrics };
    records.push(rec);
    console.log(`${phase} ${lang} ${width}: viewport=${metrics.innerWidth}, scroll=${metrics.scrollWidth}, h1=${metrics.h1Count}, overflow=${metrics.overflow.length}`);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.evaluate(() => window.scrollTo({ top: 800, behavior: 'instant' }));
  await page.waitForTimeout(100);
  const sticky = await page.locator('header').evaluate(el => ({ top: Math.round(el.getBoundingClientRect().top), position: getComputedStyle(el).position }));
  records.push({ lang, stickyHeader: sticky, pageErrors: errors });
  await context.close();
}
await writeFile(`${out}/layout-results.json`, JSON.stringify(records, null, 2) + '\n');
await browser.close();
console.log(`Saved real-viewport evidence to ${out}`);
