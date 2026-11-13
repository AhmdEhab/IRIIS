/**
 * Story QA — the requirements specific to the visual story experience.
 *
 * Checks that the story is followable with sound OFF, that motion stops under
 * prefers-reduced-motion, that scenes are drawn (not emoji), that navigation
 * and the progress indicator work in both directions, and that the tap
 * interaction is an invitation rather than a gate.
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:5175/';
const results = [];
const pass = (n, ok, extra = '') => {
  results.push({ n, ok: !!ok, extra });
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${n}${extra ? ' — ' + extra : ''}`);
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

/** Get into the story list, in the given language. */
async function openStories(page, lang) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  if (lang === 'en') {
    await page.getByRole('button', { name: 'English' }).click();
    await page.waitForTimeout(500);
  }
  await page.getByRole('button', { name: /Child Mode|وضع الطفل/ }).click();
  await page.waitForTimeout(1500);
  const nf = page.locator('input').first();
  if (await nf.count()) {
    await nf.fill(lang === 'en' ? 'Salma' : 'سلمى');
    await page.getByRole('button', { name: /ابدأ|Start|يلا/ }).first().click().catch(() => {});
    await page.waitForTimeout(1300);
  }
  await page.getByRole('button', { name: /Stories|القصص/ }).first().click();
  await page.waitForTimeout(1100);
}

// ── 1. scenes are drawn, not emoji ──────────────────────────────────────────
console.log('\n[1] Scenes are drawn illustrations');
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await openStories(page, 'en');
  await page.getByRole('button', { name: /Bandaq/ }).first().click();
  await page.waitForTimeout(900);

  const art = await page.evaluate(() => {
    const svg = document.querySelector('svg[role="presentation"]');
    if (!svg) return null;
    return {
      shapes: svg.querySelectorAll('circle, ellipse, path, polygon, rect').length,
      hasEmojiText: /[\u{1F300}-\u{1FAFF}]/u.test(svg.textContent || ''),
    };
  });
  pass('scene renders a drawn SVG stage', !!art, art ? `${art.shapes} shapes` : 'no stage found');
  pass('scene contains real vector shapes (not a glyph)', !!art && art.shapes > 20, art ? `${art.shapes}` : '');
  pass('scene contains no emoji glyphs', !!art && !art.hasEmojiText);

  // ── 2. navigation + progress ──────────────────────────────────────────────
  console.log('\n[2] Navigation and progress');
  const dotsLabel = async () =>
    (await page.locator('[role="progressbar"]').first().getAttribute('aria-label')) || '';
  const first = await dotsLabel();
  await page.getByRole('button', { name: /Next scene|Story question/ }).first().click();
  await page.waitForTimeout(700);
  const second = await dotsLabel();
  pass('Next advances the scene indicator', first !== second, `${first} → ${second}`);
  await page.getByRole('button', { name: /Previous scene/ }).first().click();
  await page.waitForTimeout(700);
  const back = await dotsLabel();
  pass('Previous goes back', back === first, `${second} → ${back}`);
  pass('Previous is disabled on the first scene',
    await page.getByRole('button', { name: /Previous scene/ }).first().isDisabled());

  // ── 3. the tap interaction invites, never blocks ──────────────────────────
  console.log('\n[3] Tap interaction');
  await page.getByRole('button', { name: /Next scene/ }).first().click();
  await page.waitForTimeout(700);
  let body = await page.locator('body').innerText();
  pass('tap scene shows an invitation prompt', /find the giant carrot/i.test(body));
  pass('Next stays enabled before tapping (not a gate)',
    await page.getByRole('button', { name: /Next scene/ }).first().isEnabled());
  const stage = page.locator('svg[role="presentation"]').first();
  const box = await stage.boundingBox();
  await page.mouse.click(box.x + box.width * 0.66, box.y + box.height * 0.6);
  await page.waitForTimeout(700);
  body = await page.locator('body').innerText();
  pass('tapping the target confirms warmly', /You found it/i.test(body));

  // ── 4. ending ─────────────────────────────────────────────────────────────
  console.log('\n[4] Ending');
  for (let i = 0; i < 6; i++) {
    const n = page.getByRole('button', { name: /Next scene|Story question/ });
    if (!(await n.count())) break;
    await n.first().click();
    await page.waitForTimeout(550);
  }
  body = await page.locator('body').innerText();
  pass('story ends on a recall question', /Who helped Bandaq/i.test(body));
  const optionArt = await page.locator('button svg').count();
  pass('answer options use the drawn art', optionArt >= 2, `${optionArt} svg options`);

  pass('no page errors during the story', errs.length === 0, errs.join('; '));
  await ctx.close();
}

// ── 5. understandable with sound OFF ────────────────────────────────────────
console.log('\n[5] Works with audio off');
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const page = await ctx.newPage();
  await openStories(page, 'en');
  // Mute via the story screen's own control before opening a story.
  const mute = page.getByRole('button', { name: /Sound is on/ });
  if (await mute.count()) await mute.first().click();
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: /Bandaq/ }).first().click();
  await page.waitForTimeout(900);
  const body = await page.locator('body').innerText();
  pass('scene sentence is on screen with sound muted', /little bunny who loves the meadow/i.test(body));
  const label = await page.locator('[role="img"]').first().getAttribute('aria-label');
  pass('illustration carries a text alternative', !!label && label.length > 10, (label || '').slice(0, 48));
  await ctx.close();
}

// ── 6. reduced motion ───────────────────────────────────────────────────────
console.log('\n[6] Reduced motion');
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await openStories(page, 'en');
  await page.getByRole('button', { name: /Bandaq/ }).first().click();
  await page.waitForTimeout(1500);
  const moving = await page.evaluate(async () => {
    const els = Array.from(document.querySelectorAll('div, span, svg, g'));
    const snap = () => els.map((e) => getComputedStyle(e).transform);
    const before = snap();
    await new Promise((r) => setTimeout(r, 900));
    const after = snap();
    let n = 0;
    for (let i = 0; i < els.length; i++) if (before[i] !== after[i]) n++;
    return n;
  });
  pass('nothing animates in a story under reduced motion', moving === 0, `${moving} moving`);
  await ctx.close();
}

// ── 7. Arabic ───────────────────────────────────────────────────────────────
console.log('\n[7] Arabic');
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const page = await ctx.newPage();
  await openStories(page, 'ar');
  await page.getByRole('button', { name: /بندق/ }).first().click();
  await page.waitForTimeout(900);
  const info = await page.evaluate(() => ({
    dir: document.documentElement.dir,
    text: document.body.innerText,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  pass('Arabic story renders RTL', info.dir === 'rtl');
  pass('Arabic scene sentence present', /بندق أرنب صغير/.test(info.text));
  pass('no horizontal overflow in Arabic', info.overflow <= 1, `${info.overflow}px`);
  await ctx.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n=== ${results.length - failed.length}/${results.length} checks passed ===`);
if (failed.length) {
  console.log('FAILED:');
  failed.forEach((f) => console.log(`  - ${f.n}${f.extra ? ' — ' + f.extra : ''}`));
  process.exitCode = 1;
}
