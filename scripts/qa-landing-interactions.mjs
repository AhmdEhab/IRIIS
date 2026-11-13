import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const origin = process.env.QA_ORIGIN || 'http://127.0.0.1:5173';
const out = '/home/ubuntu/iris-delivery/verification';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader', '--ignore-certificate-errors'] });
const results = [];

async function openLanding(page, lang, width) {
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.waitForSelector('.iris-landing');
  await page.evaluate(() => document.fonts.ready);
  if (lang === 'en') {
    await page.locator('button.lp-lang-round[data-language="en"]').click();
    await page.waitForFunction(() => document.documentElement.lang === 'en');
  }
}

try {
  for (const width of [375, 1440]) {
    for (const lang of ['ar', 'en']) {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, reducedMotion: 'reduce', ignoreHTTPSErrors: true });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await openLanding(page, lang, width);
      assert.equal(await page.locator('canvas').count(), 0, 'No WebGL contexts before interaction');
      const structure = await page.evaluate(() => {
        const overlap = (a, b) => { const x = a.getBoundingClientRect(), y = b.getBoundingClientRect(); return Math.min(x.right, y.right) - Math.max(x.left, y.left) > 1 && Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top) > 1; };
        const header = [...document.querySelectorAll('.lp-brand, .lp-desktop-nav, .lp-header-actions')].filter(el => el.getBoundingClientRect().width > 0);
        return {
          headerOverlap: header.some((el, i) => header.slice(i + 1).some(next => overlap(el, next))),
          heroOverlap: overlap(document.querySelector('.lp-hero-copy'), document.querySelector('.lp-hero-visual')),
          smallTargets: [...document.querySelectorAll('.lp-header button, .lp-cta-row button')].filter(el => el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height < 44).length,
        };
      });
      assert.deepEqual(structure, { headerOverlap: false, heroOverlap: false, smallTargets: 0 });
      if (width < 1200) {
        await page.getByTestId('menu-toggle').click();
        assert.equal(await page.getByTestId('menu-toggle').getAttribute('aria-expanded'), 'true');
        await page.screenshot({ path: `${out}/${lang}-${width}-menu.png` });
        await page.keyboard.press('Escape');
        assert.equal(await page.getByTestId('menu-toggle').getAttribute('aria-expanded'), 'false');
        assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('data-testid')), 'menu-toggle');
        await page.getByTestId('menu-toggle').click();
        await page.locator('h1').click();
        assert.equal(await page.getByTestId('menu-toggle').getAttribute('aria-expanded'), 'false');
      }
      for (const id of ['about', 'how', 'features', 'parents']) {
        if (width < 1200) {
          await page.getByTestId('menu-toggle').click();
          await page.locator(`#landing-mobile-menu a[href="#${id}"]`).click();
          assert.equal(await page.getByTestId('menu-toggle').getAttribute('aria-expanded'), 'false');
        } else {
          await page.locator(`.lp-desktop-nav a[href="#${id}"]`).click();
        }
        await page.waitForFunction(id => location.hash === `#${id}`, id);
        const bounds = await page.evaluate(id => ({ section: document.getElementById(id).getBoundingClientRect().top, headerBottom: document.querySelector('.lp-header').getBoundingClientRect().bottom }), id);
        assert(bounds.section >= bounds.headerBottom - 2, `Anchor ${id} not covered by the header`);
      }
      await page.locator('.lp-footer a[href="#experience"]').click();
      await page.waitForFunction(() => location.hash === '#experience');
      await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'instant' }));
      assert.equal(await page.locator('.lp-header').evaluate(el => Math.round(el.getBoundingClientRect().top)), 0);
      await page.addScriptTag({ path: '/home/ubuntu/iris-qa-tools/node_modules/axe-core/axe.min.js' });
      const accessibility = await page.evaluate(async () => {
        const audit = await window.axe.run('.iris-landing', { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } });
        return { violations: audit.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) })), incomplete: audit.incomplete.map(v => v.id) };
      });
      assert.equal(accessibility.violations.length, 0, JSON.stringify(accessibility.violations));
      const routeCases = [
        ['header-start', '/register'], ['hero-start', '/register'],
        ['hero-login', '/login'], ['activities-start', '/register'],
        ['parents-start', '/register'], ['final-start', '/register'],
        ['final-login', '/login'],
      ];
      if (width >= 600) routeCases.push(['header-login', '/login']);
      for (const [testId, route] of routeCases) {
        await openLanding(page, lang, width);
        await page.getByTestId(testId).click();
        await page.waitForFunction(route => location.pathname === route, route);
        await page.waitForSelector('input[type="email"]');
      }
      if (width < 600) {
        await openLanding(page, lang, width);
        await page.getByTestId('menu-toggle').click();
        await page.getByTestId('mobile-login').click();
        await page.waitForFunction(() => location.pathname === '/login');
        await page.waitForSelector('input[type="email"]');
      }
      await openLanding(page, lang, width);
      for (const id of ['features', 'experience', 'parents', 'start']) {
        await page.locator(`#${id}`).screenshot({ path: `${out}/${lang}-${width}-${id}.png`, animations: 'disabled' });
      }
      await page.locator('.lp-footer').screenshot({ path: `${out}/${lang}-${width}-footer.png` });
      assert.equal(errors.length, 0, JSON.stringify(errors));
      results.push({ width, lang, structure, accessibility, routes: routeCases, menu: width < 1200 ? 'open / Escape / focus-return / outside-close / anchor-close passed' : 'desktop', stickyHeader: 'passed', pageErrors: errors });
      console.log(`Actions + keyboard + WCAG checks passed: ${lang} ${width}`);
      await context.close();
    }
  }
  const context = await browser.newContext({ viewport: { width: 768, height: 1000 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await openLanding(page, 'en', 768);
  await page.getByTestId('activate-3d').click();
  await page.waitForSelector('.lp-live-model canvas', { timeout: 30000 });
  await page.getByText('Drag to turn it', { exact: true }).waitFor();
  assert.equal(await page.locator('canvas').count(), 1);
  for (const id of ['orange', 'fox', 'sphere', 'cube', 'star', 'heart', 'apple']) {
    await page.locator(`[data-model="${id}"]`).click();
    await page.getByText('Drag to turn it', { exact: true }).waitFor();
    assert.equal(await page.locator('canvas').count(), 1, 'Only one canvas after model switch');
  }
  const canvas = page.locator('.lp-live-model canvas');
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2, { steps: 10 });
  await page.mouse.up();
  await page.locator('.lp-demo').screenshot({ path: `${out}/live-3d-768.png` });
  results.push({ live3D: 'activation / all 7 models / one canvas / drag passed' });
  await context.close();

  const fallbackContext = await browser.newContext({ viewport: { width: 375, height: 900 }, reducedMotion: 'reduce' });
  const fallbackPage = await fallbackContext.newPage();
  await fallbackPage.addInitScript(() => {
    const native = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) { return String(type).includes('webgl') ? null : native.call(this, type, ...args); };
  });
  await openLanding(fallbackPage, 'ar', 375);
  await fallbackPage.getByTestId('activate-3d').click();
  await fallbackPage.locator('.lp-live-model').waitFor();
  await fallbackPage.getByText('المجسّم غير متاح على هذا الجهاز', { exact: true }).waitFor();
  assert.equal(await fallbackPage.locator('canvas').count(), 0);
  await fallbackPage.locator('.lp-demo').screenshot({ path: `${out}/static-fallback-375.png` });
  results.push({ staticFallback: 'no-WebGL alternative visible; no canvas; passed' });
  await fallbackContext.close();
  await writeFile(`${out}/interaction-results.json`, JSON.stringify(results, null, 2) + '\n');
  console.log('All interaction tests passed. No registration or login forms were submitted.');
} catch (error) {
  await writeFile(`${out}/interaction-results.json`, JSON.stringify({ completed: results, failure: String(error) }, null, 2) + '\n');
  throw error;
} finally {
  await browser.close();
}
