/**
 * Pass 4 — end-to-end DemoDay journey, responsive layout, Parent Mode,
 * and a console/network error sweep.
 *
 * This walks the exact path a judge would see, in one continuous session,
 * collecting every console error and failed request along the way. A silent
 * console is part of the pass criteria, not a side observation.
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:5175/';
const results = [];
const pass = (n, ok, extra = '') => {
  results.push({ n, ok: !!ok, extra });
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${n}${extra ? ' — ' + extra : ''}`);
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

/** Console errors, page exceptions and failed requests, for the whole run. */
const errors = [];
const failedRequests = [];

function watch(page, label) {
  const EXTERNAL = /googleapis|gstatic|google\.com|doubleclick|ERR_TUNNEL_CONNECTION_FAILED|ERR_PROXY/;
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    // Google Fonts and telemetry are blocked by this sandbox's egress proxy,
    // not by the app. Noise here; absent on a normal machine.
    const where = (m.location && m.location().url) || '';
    if (EXTERNAL.test(`${m.text()} ${where}`)) return;
    errors.push(`[${label}] ${m.text().slice(0, 160)} ${where.slice(0, 90)}`);
  });
  page.on('pageerror', (e) => errors.push(`[${label}] EXCEPTION ${String(e.message).slice(0, 200)}`));
  page.on('requestfailed', (r) => {
    const u = r.url();
    // Google Fonts and telemetry are blocked by the sandbox proxy, not by the app.
    if (/googleapis|gstatic|google\.com|doubleclick/.test(u)) return;
    failedRequests.push(`[${label}] ${r.failure()?.errorText || 'failed'} ${u.slice(0, 120)}`);
  });
  page.on('response', (r) => {
    if (r.status() >= 400 && !/googleapis|gstatic|google\.com/.test(r.url())) {
      failedRequests.push(`[${label}] HTTP ${r.status()} ${r.url().slice(0, 120)}`);
    }
  });
}

let REGISTERED_EMAIL = '';
const text = (page) => page.locator('body').innerText();
const overflow = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

// ════════════════════════════════════════════════════════════════════════════
// 1. The full journey, in English, at desktop width
// ════════════════════════════════════════════════════════════════════════════
console.log('\n[1] Full user journey');
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await ctx.newPage();
  watch(page, 'journey');

  // ── LANDING ──
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);
  pass('LANDING renders', (await text(page)).length > 30);
  await page.getByRole('button', { name: 'English' }).click();
  await page.waitForTimeout(500);

  // ── REGISTRATION + CONSENT ──
  // Registration lives behind Parent Mode → "Register now", as a 3-step wizard.
  const stamp = Date.now();
  const email = `demo.judge.${stamp}@example.com`;
  REGISTERED_EMAIL = email;
  let registered = false;
  let consentSeen = 0;

  await page.getByRole('button', { name: /Parent Mode/ }).first().click();
  await page.waitForTimeout(1500);
  pass('LOGIN screen reachable from Parent Mode',
    /Login|Welcome back/i.test(await text(page)));

  await page.getByRole('button', { name: /Register now/i }).first().click();
  await page.waitForTimeout(1400);
  pass('REGISTRATION wizard opens', /Registration|Child Information/i.test(await text(page)));

  for (let step = 0; step < 6; step++) {
    // Fill whatever this step exposes.
    const inputs = page.locator('input:visible');
    const n = await inputs.count();
    for (let i = 0; i < n; i++) {
      const el = inputs.nth(i);
      const type = await el.getAttribute('type');
      if (type === 'checkbox' || type === 'radio') continue;
      if (await el.inputValue()) continue;
      const value =
        type === 'email' ? email
        : type === 'password' ? 'DemoPass99!'
        : type === 'number' ? '7'
        : type === 'date' ? '2018-04-12'
        : type === 'tel' ? '01000000000'
        : 'Salma';
      await el.fill(value).catch(() => {});
    }

    const checks = page.locator('input[type="checkbox"]:visible');
    const cn = await checks.count();
    consentSeen += cn;
    for (let i = 0; i < cn; i++) await checks.nth(i).check().catch(() => {});

    // Any single-choice option this step needs (gender, condition).
    for (const label of [/Female|👧/, /Other|Prefer not|None/i]) {
      const opt = page.getByRole('button', { name: label }).first();
      if ((await opt.count()) && (await opt.isVisible().catch(() => false))) {
        await opt.click().catch(() => {});
        break;
      }
    }

    const next = page.getByRole('button', { name: /^Next$|Create|Finish|Register|Submit|Start/i }).first();
    if (!(await next.count())) break;
    if (await next.isDisabled().catch(() => true)) break;
    await next.click();
    await page.waitForTimeout(1200);
    const body = await text(page);
    if (/Child Mode|Parent Dashboard|Progress|Welcome/i.test(body) && !/Registration/i.test(body)) {
      registered = true;
      break;
    }
  }
  // The last step shows "Setting up ..." while the account is created.
  for (let i = 0; i < 40 && !registered; i++) {
    await page.waitForTimeout(500);
    const b = await text(page);
    if (/Setting up|Please wait/i.test(b)) continue;
    if (!/Registration|Child Information/i.test(b)) { registered = true; break; }
  }
  pass('CONSENT is requested during registration', consentSeen > 0, `${consentSeen} consent control(s)`);
  pass('REGISTRATION completes', registered, registered ? '' : (await text(page)).slice(0, 90).replace(/\n/g, ' '));

  // Return to landing for the child journey.
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1600);
  await page.getByRole('button', { name: 'English' }).click().catch(() => {});
  await page.waitForTimeout(500);

  // ── CHILD MODE ──
  const childBtn = page.getByRole('button', { name: /Child Mode|وضع الطفل/ }).first();
  pass('CHILD MODE entry point exists', (await childBtn.count()) > 0);
  await childBtn.click();
  await page.waitForTimeout(1500);
  const nameField = page.locator('input').first();
  if (await nameField.count()) {
    await nameField.fill('Salma');
    await page.getByRole('button', { name: /Start|ابدأ|يلا/ }).first().click().catch(() => {});
    await page.waitForTimeout(1500);
  }
  const childBody = await text(page);
  pass('CHILD MODE home renders', childBody.length > 40);
  pass('child is greeted by name', /Salma/i.test(childBody), childBody.slice(0, 60).replace(/\n/g, ' '));

  // ── ASSESSMENT ──
  const assessBtn = page.getByRole('button', { name: /Start Adventure|ابدأ المغامرة/ }).first();
  let inAssessment = false;
  if (await assessBtn.count()) {
    await assessBtn.click();
    await page.waitForTimeout(1600);

    // An intro screen states plainly what the screening is and is not.
    const intro = await text(page);
    pass('assessment intro states it is NOT an IQ test or a diagnosis',
      /not an intelligence test/i.test(intro) && /does not diagnose/i.test(intro));

    const go = page.getByRole('button', { name: /Let's start|يلا نبدأ|ابدأ/i }).first();
    if (await go.count()) {
      await go.click();
      await page.waitForTimeout(2200);
    }
    inAssessment = /\?|question|سؤال/i.test(await text(page));
  }
  pass('ASSESSMENT loads a question', inAssessment, inAssessment ? '' : 'no question detected');

  if (inAssessment) {
    // Answer buttons are the ones labelled "Choice N" — the emoji-only audio
    // controls are buttons too, and clicking those just toggles mute.
    let answered = 0;
    let sawFeedback = false;
    let sawResult = '';
    let sawActivity = false;
    for (let q = 0; q < 55; q++) {
      const choices = page.locator('button[aria-label^="Choice"]:visible');
      const n = await choices.count();
      if (!n) break;
      await choices.first().click().catch(() => {});
      answered++;
      // Feedback can be brief, so sample rather than checking once.
      for (const wait of [150, 250, 400, 500]) {
        await page.waitForTimeout(wait);
        const b = await text(page);
        if (/correct|well done|great|try again|nearly|brilliant|good|nice|ممتاز|برافو|حاول|شاطر/i.test(b)) {
          sawFeedback = true;
          break;
        }
      }
      const body = await text(page);
      // The profile/result screen sits between the screening and practice, and
      // the run passes straight through it, so record it as it goes by.
      if (!sawResult && /your starting point|starting level|level \d|goal:|we'll start|practice level|نبدأ من|المستوى/i.test(body)) {
        sawResult = body.replace(/\n+/g, ' ').slice(0, 90);
      }
      if (/tap only|which was second|match the/i.test(body)) sawActivity = true;
      // Advance if the screen offers a continue control.
      const next = page.getByRole('button', { name: /Next|Continue|التالي/i }).first();
      if ((await next.count()) && !(await next.isDisabled().catch(() => true))) {
        await next.click().catch(() => {});
        await page.waitForTimeout(900);
      }
    }
    pass('ASSESSMENT accepts answers and advances', answered >= 3, `${answered} questions answered`);
    pass('answer feedback / celebration appears', sawFeedback, sawFeedback ? '' : 'no feedback text seen');

    pass('a RESULT / starting-level profile is shown after the screening',
      !!sawResult, sawResult || 'not observed');
    pass('LEARNING ACTIVITY follows the screening', sawActivity,
      sawActivity ? '' : 'no activity screen reached');
  }

  // ── STORY ──
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1600);
  await page.getByRole('button', { name: 'English' }).click().catch(() => {});
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: /Child Mode|وضع الطفل/ }).first().click();
  await page.waitForTimeout(1400);
  const nf2 = page.locator('input').first();
  if (await nf2.count()) {
    await nf2.fill('Salma');
    await page.getByRole('button', { name: /Start|ابدأ|يلا/ }).first().click().catch(() => {});
    await page.waitForTimeout(1300);
  }
  const storiesBtn = page.getByRole('button', { name: /Stories|القصص/ }).first();
  pass('STORY entry point exists in Child Mode', (await storiesBtn.count()) > 0);
  await storiesBtn.click();
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: /Bandaq|بندق/ }).first().click();
  await page.waitForTimeout(1000);
  pass('STORY scene renders', (await page.locator('svg[role="presentation"]').count()) > 0);

  // Walk to the end.
  for (let i = 0; i < 8; i++) {
    const next = page.getByRole('button', { name: /Next scene|Story question/ });
    if (!(await next.count())) break;
    await next.first().click();
    await page.waitForTimeout(500);
  }
  const storyEnd = await text(page);
  pass('STORY COMPLETION reached', /Who helped|مين ساعد|again|Finish|تمام/i.test(storyEnd),
    storyEnd.slice(0, 60).replace(/\n/g, ' '));

  await ctx.close();
}

// ════════════════════════════════════════════════════════════════════════════
// 2. Parent Mode
// ════════════════════════════════════════════════════════════════════════════
console.log('\n[2] Parent Mode');
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
  const page = await ctx.newPage();
  watch(page, 'parent');
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1600);
  await page.getByRole('button', { name: 'English' }).click().catch(() => {});
  await page.waitForTimeout(400);

  const parentBtn = page.getByRole('button', { name: /Parent Mode/ }).first();
  pass('PARENT MODE entry point exists', (await parentBtn.count()) > 0);
  await parentBtn.click();
  await page.waitForTimeout(1600);

  // Parent Mode sits behind auth, which is correct. Log in with the account the
  // journey created, then inspect the dashboard itself.
  pass('Parent Mode requires authentication', /Login|Welcome back/i.test(await text(page)));
  const emailField = page.locator('input[type="email"]').first();
  if ((await emailField.count()) && REGISTERED_EMAIL) {
    await emailField.fill(REGISTERED_EMAIL);
    await page.locator('input[type="password"]').first().fill('DemoPass99!');
    await page.getByRole('button', { name: /Login Now/i }).first().click();
    await page.waitForTimeout(3000);
  }

  const pbody = await text(page);
  pass('Parent dashboard opens after login', !/Welcome back, hero/i.test(pbody),
    pbody.slice(0, 80).replace(/\n/g, ' '));
  for (const [name, re] of [
    ['Progress', /progress|التقدم/i],
    ['Home tips / guidance', /tip|guidance|home|نصائح|إرشاد/i],
    ['Ask IRIS', /ask iris|اسأل/i],
    ['Community', /community|مجتمع/i],
    ['Specialists', /specialist|أخصائي|اختصاصي/i],
  ]) {
    pass(`Parent Mode section present: ${name}`, re.test(pbody), re.test(pbody) ? '' : 'not found');
  }
  pass('unimplemented areas are labelled honestly',
    /coming soon|prototype|not yet|no data|pilot|قريبا|قريباً|نموذج/i.test(pbody));
  await ctx.close();
}

// ════════════════════════════════════════════════════════════════════════════
// 3. Responsive — 390 / 820 / 1440
// ════════════════════════════════════════════════════════════════════════════
console.log('\n[3] Responsive layout');
for (const [w, h] of [[390, 844], [820, 1180], [1440, 950]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  watch(page, `${w}px`);
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1600);
  pass(`${w}px landing: no horizontal overflow`, (await overflow(page)) <= 1, `${await overflow(page)}px`);

  await page.getByRole('button', { name: /Child Mode|وضع الطفل/ }).first().click();
  await page.waitForTimeout(1400);
  const nf = page.locator('input').first();
  if (await nf.count()) {
    await nf.fill('سلمى');
    await page.getByRole('button', { name: /ابدأ|Start|يلا/ }).first().click().catch(() => {});
    await page.waitForTimeout(1300);
  }
  pass(`${w}px Child Mode: no horizontal overflow`, (await overflow(page)) <= 1, `${await overflow(page)}px`);

  // Touch targets: the child-facing controls must stay comfortably tappable.
  const small = await page.evaluate(() => {
    const bad = [];
    document.querySelectorAll('button').forEach((b) => {
      const r = b.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      if (r.height < 40 || r.width < 40) bad.push(`${b.innerText.slice(0, 18)} ${Math.round(r.width)}x${Math.round(r.height)}`);
    });
    return bad;
  });
  pass(`${w}px Child Mode: buttons are large enough (>=40px)`, small.length === 0,
    small.slice(0, 2).join(' | '));

  // No element the child needs may sit off the left/right edge.
  //
  // Decorative marks are excluded deliberately, and this is a correction to
  // the check rather than a loosening of it. The brand language pools colour
  // in the corners as blobs that BLEED past their card and are cropped by
  // `overflow-hidden` — that crop is the intended look. Such an element still
  // reports a box outside the viewport via getBoundingClientRect even though
  // nothing is visible there and nothing scrolls. Conflating that with a
  // clipped button hides the failure that matters. The guarantee that the page
  // never scrolls sideways is asserted separately above, at 0px, and is what
  // actually proves the bleed is harmless.
  const offscreen = await page.evaluate(() => {
    const bad = [];
    document.querySelectorAll('button, h1, h2, img, svg').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0) return;
      const decorative =
        el.closest('[aria-hidden="true"]') !== null ||
        el.getAttribute('aria-hidden') === 'true' ||
        getComputedStyle(el).pointerEvents === 'none';
      if (decorative) return;
      if (r.left < -2 || r.right > window.innerWidth + 2) bad.push(el.tagName);
    });
    return bad;
  });
  pass(`${w}px Child Mode: no CONTENT clipped off-screen`, offscreen.length === 0,
    offscreen.slice(0, 3).join(','));

  await ctx.close();
}

// ════════════════════════════════════════════════════════════════════════════
// 4. Arabic / RTL
// ════════════════════════════════════════════════════════════════════════════
console.log('\n[4] Arabic and RTL');
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  watch(page, 'rtl');
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1600);
  const dir = await page.evaluate(() => document.documentElement.dir);
  pass('Arabic is the default direction (RTL)', dir === 'rtl', dir);
  await page.getByRole('button', { name: /Child Mode|وضع الطفل/ }).first().click();
  await page.waitForTimeout(1400);
  pass('RTL Child Mode: no horizontal overflow', (await overflow(page)) <= 1, `${await overflow(page)}px`);
  await ctx.close();
}

// ════════════════════════════════════════════════════════════════════════════
// 5. Console and network sweep
// ════════════════════════════════════════════════════════════════════════════
console.log('\n[5] Console and network');
{
  const unique = [...new Set(errors)];
  pass('no console errors or uncaught exceptions', unique.length === 0,
    unique.slice(0, 3).join(' || '));
  const uniqueReq = [...new Set(failedRequests)];
  pass('no failed application requests (404s, 5xx, CORS)', uniqueReq.length === 0,
    uniqueReq.slice(0, 3).join(' || '));
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n=== ${results.length - failed.length}/${results.length} checks passed ===`);
if (failed.length) {
  console.log('FAILED:');
  failed.forEach((f) => console.log(`  - ${f.n}${f.extra ? ' — ' + f.extra : ''}`));
  process.exitCode = 1;
}
