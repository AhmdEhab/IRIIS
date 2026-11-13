/**
 * Accessibility + bilingual QA for the child-experience pass.
 *
 * Complements e2e2.mjs (which walks the whole product flow). This one checks
 * the things this pass specifically changed:
 *   - reduced-motion is honoured (no infinite animations running)
 *   - audio controls exist, are reachable, and are labelled
 *   - narration captions render (the visual equivalent of speech)
 *   - Arabic renders RTL with a real Arabic-capable font
 *   - keyboard focus is visible
 *   - touch targets meet the 44px floor
 *   - no console errors in either language
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:5175/';
const results = [];
const pass = (n, ok, extra = '') =>
  results.push({ check: n, ok: !!ok, extra }) && console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${n}${extra ? ' — ' + extra : ''}`);

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

/**
 * Count elements whose transform actually CHANGES over a sampling window.
 *
 * document.getAnimations() only sees CSS/WAAPI animations. Framer Motion
 * ("motion/react") drives transforms from requestAnimationFrame and writes
 * inline styles, so getAnimations() reports zero even while the whole page is
 * moving — an earlier version of this check passed for that reason and proved
 * nothing. Sampling the computed transform twice is engine-agnostic.
 */
const countMoving = (page, ms = 900) =>
  page.evaluate(async (window_ms) => {
    const els = Array.from(document.querySelectorAll('div, span, img, button'));
    const snap = () => els.map((el) => getComputedStyle(el).transform);
    const before = snap();
    await new Promise((r) => setTimeout(r, window_ms));
    const after = snap();
    let moved = 0;
    for (let i = 0; i < els.length; i++) if (before[i] !== after[i]) moved++;
    return moved;
  }, ms);

// ── 1. Reduced motion ───────────────────────────────────────────────────────
console.log('\n[1] prefers-reduced-motion: reduce');
let reducedMoving = null;
{
  const ctx = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500); // let entry animations settle either way
  reducedMoving = await countMoving(page);
  pass('nothing is still moving under reduced-motion', reducedMoving === 0, `${reducedMoving} element(s) moving`);
  pass('no page errors under reduced-motion', errors.length === 0, errors.join('; '));
  await ctx.close();
}

// ── 2. Motion allowed (control) ─────────────────────────────────────────────
console.log('\n[2] motion allowed (control case)');
{
  const ctx = await browser.newContext({ reducedMotion: 'no-preference', viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const moving = await countMoving(page);
  // Without this control, check [1] would pass even if the page never animated.
  pass('motion DOES run when allowed (proves check 1 is meaningful)', moving > 0, `${moving} element(s) moving`);
  await ctx.close();
}

// ── 3. Arabic RTL + font ────────────────────────────────────────────────────
console.log('\n[3] Arabic layout');
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const info = await page.evaluate(() => ({
    dir: document.documentElement.dir,
    lang: document.documentElement.lang,
    font: getComputedStyle(document.body).fontFamily,
    letterSpacing: getComputedStyle(document.body).letterSpacing,
  }));
  pass('html dir=rtl in Arabic', info.dir === 'rtl', info.dir);
  pass('html lang=ar in Arabic', info.lang === 'ar', info.lang);
  pass('Arabic-capable font in stack', /Cairo|Tajawal|Tahoma|Segoe|Noto|Geeza/i.test(info.font), info.font.slice(0, 70));

  // Switch to English and re-check direction flips.
  await page.getByRole('button', { name: 'English' }).click();
  await page.waitForTimeout(500);
  const en = await page.evaluate(() => ({ dir: document.documentElement.dir, lang: document.documentElement.lang }));
  pass('html dir=ltr after switching to English', en.dir === 'ltr', en.dir);
  pass('html lang=en after switching to English', en.lang === 'en', en.lang);
  await ctx.close();
}

// ── 4. Touch targets + focus visibility on the landing page ─────────────────
console.log('\n[4] Touch targets & keyboard focus');
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  const small = await page.evaluate(() => {
    const bad = [];
    document.querySelectorAll('button, [role="button"], a[href]').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return; // hidden
      if (r.height < 44 || r.width < 44) {
        bad.push(`${el.tagName}.${(el.className || '').toString().slice(0, 25)} ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
    });
    return bad;
  });
  pass('all visible controls >= 44x44', small.length === 0, small.slice(0, 4).join(' | '));

  // Tab to the first control and confirm a visible focus indicator appears.
  await page.waitForTimeout(400);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(400);
  const focus = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const s = getComputedStyle(el);
    let fv = false;
    try { fv = el.matches(':focus-visible'); } catch {}
    return {
      tag: el.tagName,
      cls: (el.className || '').toString().slice(0, 40),
      focusVisible: fv,
      outlineWidth: s.outlineWidth,
      outlineStyle: s.outlineStyle,
      boxShadow: s.boxShadow.slice(0, 40),
    };
  });
  // Only a real outline counts. An earlier version also accepted any
  // box-shadow, which let Tailwind's decorative `shadow-lg` masquerade as a
  // focus ring and hid the fact that the ring CSS was being overridden.
  const hasRing = !!focus && focus.outlineStyle !== 'none' && parseFloat(focus.outlineWidth) >= 2;
  pass(
    'keyboard focus produces a real outline ring',
    hasRing,
    focus ? JSON.stringify(focus) : 'nothing focused'
  );
  await ctx.close();
}

// ── 5. Audio controls + caption inside Child Mode ───────────────────────────
console.log('\n[5] Audio controls & narration captions (Child Mode)');
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.googleapis|ERR_TUNNEL/.test(m.text())) errors.push(m.text()); });

  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /Child Mode|وضع الطفل/ }).click();
  await page.waitForTimeout(1200);

  // Child Mode with no registered profile lands on the intake step.
  const nameInput = page.locator('input').first();
  if (await nameInput.count()) {
    await nameInput.fill('سلمى');
    const go = page.getByRole('button', { name: /ابدأ|Start|يلا/ }).first();
    if (await go.count()) { await go.click(); await page.waitForTimeout(1200); }
  }

  const muteBtn = page.getByRole('button', { name: /Sound is (on|off)|الصوت (مفتوح|مكتوم)/ });
  pass('mute control present and labelled with its state', (await muteBtn.count()) > 0);

  const repeatBtn = page.getByRole('button', { name: /Hear the instruction again|إعادة سماع/ });
  pass('repeat-instruction control present', (await repeatBtn.count()) > 0);

  const musicBtn = page.getByRole('button', { name: /music is (on|off)|الموسيقى الهادئة/i });
  pass('optional music control present', (await musicBtn.count()) > 0);

  // Music must be OFF by default — nothing may autoplay.
  if (await musicBtn.count()) {
    const pressed = await musicBtn.first().getAttribute('aria-pressed');
    pass('background music is OFF by default (no autoplay)', pressed === 'false', `aria-pressed=${pressed}`);
  }

  // Caption region is the visual equivalent of speech.
  const cap = page.locator('[aria-live="polite"]');
  pass('narration caption region exists', (await cap.count()) > 0, `${await cap.count()} live region(s)`);

  await page.screenshot({ path: 'e2e2-shots/qa-child-home.png' });
  pass('no unexpected console/page errors in Child Mode', errors.length === 0, errors.slice(0, 2).join(' | '));
  await ctx.close();
}

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n=== ${results.length - failed.length}/${results.length} checks passed ===`);
if (failed.length) {
  console.log('FAILED:');
  failed.forEach((f) => console.log(`  - ${f.check}${f.extra ? ' — ' + f.extra : ''}`));
  process.exitCode = 1;
}
