/**
 * Companion QA — the IRIS buddy inside real Child Mode.
 *
 * Checks the character actually renders where it should, that it reacts to the
 * child's answers, that it never shows a negative face, and that its motion
 * stops under prefers-reduced-motion.
 */
import { chromium } from 'playwright';
const results = [];
const pass = (n, ok, x = '') => { results.push({n, ok: !!ok, x});
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${n}${x ? ' — ' + x : ''}`); };
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

async function childHome(page, lang = 'en') {
  await page.goto('http://localhost:5175/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);
  if (lang === 'en') { await page.getByRole('button', { name: 'English' }).click().catch(()=>{}); await page.waitForTimeout(500); }
  await page.getByRole('button', { name: /Child Mode|وضع الطفل/ }).first().click();
  await page.waitForTimeout(1500);
  const inp = page.locator('input').first();
  if (await inp.count()) {
    await inp.fill(lang === 'en' ? 'Salma' : 'سلمى');
    await page.getByRole('button', { name: /Start the journey|ابدأ/ }).first().click().catch(()=>{});
    await page.waitForTimeout(1600);
  }
}

/** Count the companion's own SVG petals — its identifying mark. */
const petalColours = (page) => page.evaluate(() => {
  const out = new Set();
  document.querySelectorAll('svg ellipse').forEach((e) => {
    const f = (e.getAttribute('fill') || '').toUpperCase();
    if (['#FECA34','#1F67B1','#F45B63','#49B87A','#8060B4'].includes(f)) out.add(f);
  });
  return [...out];
});

// ── 1. the companion is on the child's home screen ──────────────────────────
console.log('\n[1] Companion in Child Mode');
{
  const page = await (await b.newContext({ viewport:{width:1280,height:900} })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await childHome(page, 'en');
  const petals = await petalColours(page);
  pass('companion renders with the brand petal crown', petals.length === 5, petals.join(' '));
  const body = await page.locator('body').innerText();
  pass('greeting line is on screen', /champion|Hi there|أهلا/i.test(body),
    (body.match(/Hi there[^\n]*/i) || [''])[0]);
  pass('no page errors', errs.length === 0, errs.slice(0,1).join(''));
  await page.close();
}

// ── 2. Arabic greeting uses the specified line ──────────────────────────────
console.log('\n[2] Arabic');
{
  const page = await (await b.newContext({ viewport:{width:1280,height:900} })).newPage();
  await childHome(page, 'ar');
  const body = await page.locator('body').innerText();
  pass('Arabic greeting is the specified line', /أهلاً يا بطل|أهلاً بيك/.test(body),
    (body.match(/أهلاً[^\n]*/) || [''])[0]);
  await page.close();
}

// ── 3. the companion reacts to answers ──────────────────────────────────────
console.log('\n[3] Reaction to the child');
{
  const page = await (await b.newContext({ viewport:{width:1280,height:900} })).newPage();
  await childHome(page, 'en');
  await page.getByRole('button', { name: /Start Adventure/ }).first().click();
  await page.waitForTimeout(1600);
  await page.getByRole('button', { name: /Let's start/i }).first().click().catch(()=>{});
  await page.waitForTimeout(2200);

  const faceBefore = await page.evaluate(() => document.querySelector('svg[viewBox="0 0 120 120"]')?.innerHTML || '');
  const before = await page.locator('body').innerText();
  const choices = page.locator('button[aria-label^="Choice"]:visible');
  pass('activity presents choices', await choices.count() > 0);

  await choices.first().click();
  await page.waitForTimeout(500);
  const faceAfter = await page.evaluate(() => document.querySelector('svg[viewBox="0 0 120 120"]')?.innerHTML || '');
  const after = await page.locator('body').innerText();

  pass('the companion is on the answering screen', faceBefore.length > 200, `${faceBefore.length} chars of SVG`);
  pass('the companion CHANGES FACE after an answer', faceBefore !== faceAfter);
  pass('warm feedback text appears', /keep going|Well done|That's it|Brilliant|nice|great/i.test(after),
    (after.match(/(That's ok[^\n]*|Well done|That's it|Brilliant)/i) || [''])[0]);
  pass('feedback never blames the child',
    !/wrong|incorrect|bad|failed|no!/i.test(after));

  await page.close();
}

// ── 4. never a negative face ────────────────────────────────────────────────
console.log('\n[4] No negative expression exists');
{
  const page = await (await b.newContext({ viewport:{width:1280,height:900} })).newPage();
  await childHome(page, 'en');
  const src = await page.evaluate(async () => {
    const r = await fetch('/src/App/components/iris/ui/IrisBuddy.tsx');
    return r.ok ? await r.text() : '';
  });
  pass('IrisBuddy source is readable', src.length > 500, `${src.length} chars`);
  pass('no sad / angry / cry state in the character',
    !/\b(sad|angry|upset|disappointed|cry|frown)\b/i.test(src.replace(/\/\*[\s\S]*?\*\//g, '')),
    'checked outside comments');
  await page.close();
}

// ── 5. reduced motion ───────────────────────────────────────────────────────
console.log('\n[5] Reduced motion');
{
  const page = await (await b.newContext({ viewport:{width:1280,height:900}, reducedMotion:'reduce' })).newPage();
  await childHome(page, 'en');
  await page.waitForTimeout(1200);
  const moving = await page.evaluate(async () => {
    const els = Array.from(document.querySelectorAll('div, svg, g'));
    const snap = () => els.map((e) => getComputedStyle(e).transform);
    const a = snap();
    await new Promise((r) => setTimeout(r, 900));
    const c = snap();
    let n = 0;
    for (let i = 0; i < els.length; i++) if (a[i] !== c[i]) n++;
    return n;
  });
  pass('companion holds still under reduced motion', moving === 0, `${moving} moving`);
  await page.close();
}

await b.close();
const f = results.filter(r => !r.ok);
console.log(`\n=== ${results.length - f.length}/${results.length} checks passed ===`);
if (f.length) { console.log('FAILED:'); f.forEach(x => console.log('  - ' + x.n + (x.x ? ' — ' + x.x : ''))); process.exitCode = 1; }
