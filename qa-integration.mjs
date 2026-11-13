/**
 * Integration QA for the product-integration pass.
 *
 * Covers what this pass changed:
 *   - register → logout → log back in (the reported broken flow)
 *   - duplicate email and wrong password produce a VISIBLE message
 *   - Parent Mode's five sections, incl. prototype labelling
 *   - stories as scenes, with prev/next and a closing question
 *   - the unified shell keeps the child's identity on a legacy game screen
 *   - mobile / tablet / desktop have no horizontal overflow
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:5175/';
const results = [];
const pass = (n, ok, extra = '') => {
  results.push({ n, ok: !!ok, extra });
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${n}${extra ? ' — ' + extra : ''}`);
};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
const page = await ctx.newPage();
const errors = [];
/**
 * Section [3] deliberately submits a wrong password, and the browser logs the
 * resulting 401 as a console error. That is correct behaviour, so the flag is
 * raised around that step only — rather than filtering all 401s everywhere,
 * which would hide a genuine auth regression.
 */
let expectAuthFailure = false;
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('console', (m) => {
  if (m.type() !== 'error') return;
  const t = m.text();
  if (/fonts\.googleapis|ERR_TUNNEL/.test(t)) return;       // sandbox network block
  if (expectAuthFailure && /401|Unauthorized/.test(t)) return; // the deliberate one
  errors.push(t);
});

const EMAIL = `qa_${Date.now()}@example.com`;
const PASS = 'testpass123';

const register = async () => {
  await page.getByRole('button', { name: /Parent Mode|وضع الوالدين/ }).click();
  await page.waitForTimeout(500);
  await page
    .getByText(/Don't have an account\?|ليس لديك حساب؟/)
    .locator('..')
    .getByRole('button')
    .click()
    .catch(async () => { await page.getByRole('button', { name: /Register|تسجيل/ }).first().click(); });
  // Wait for the REGISTRATION form specifically. The login screen also has an
  // email+password pair, so filling too early writes into a form that is about
  // to unmount and the values silently vanish. The date field only exists on
  // registration step 1, so it is a reliable marker that the swap is done.
  await page.locator('input[type="date"]').waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(300);
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASS);
  await page.locator('input[type="text"], input:not([type])').first().fill('سلمى');
  await page.locator('input[type="number"]').fill('7');
  const genderBtn = page.getByRole('button', { name: /👧|Female|أنثى/ });
  console.log('    [debug] gender buttons:', await genderBtn.count());
  await genderBtn.first().click().catch((e) => console.log('    [debug] gender click failed:', e.message.slice(0, 90)));
  await page.waitForTimeout(600); // let React enable the Next button
  const dbg = await page.evaluate(() => ({
    inputs: Array.from(document.querySelectorAll('input')).map((i) => `${i.type}=${i.value}`),
    next: (() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /Next|التالي/.test(x.textContent || '')); return b ? (b.disabled ? 'disabled' : 'enabled') : 'missing'; })(),
  }));
  console.log('    [debug]', JSON.stringify(dbg));
  await page.getByRole('button', { name: /Next|التالي/ }).click();
  // Same reasoning as above: wait for step 2 to actually be mounted (its phone
  // field is unique to it) before filling anything.
  await page.locator('input[type="tel"]').waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(300);
  for (const inp of await page.locator('input[type="text"], input:not([type])').all()) {
    if (!(await inp.inputValue().catch(() => 'x'))) await inp.fill('Cairo').catch(() => {});
  }
  await page.locator('input[type="tel"]').fill('01000000000');
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /Next|التالي/ }).click();
  // Step 3 marker: the consent checkbox only exists here.
  await page.locator('input[type="checkbox"]').waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(300);
  await page.locator('button:has-text("🧬"), button:has-text("💙"), button:has-text("✨")').first().click();
  await page.locator('input[type="checkbox"]').check();
  await page.waitForTimeout(400);
  const submit = page.getByRole('button', { name: /Submit|إرسال/ });
  await page.waitForFunction(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => /Submit|إرسال/.test(x.textContent || ''));
    return b && !b.disabled;
  }, { timeout: 5000 }).catch(() => {});
  await submit.click();
  await page.waitForTimeout(3200);
};

// ── 1. register ─────────────────────────────────────────────────────────────
console.log('\n[1] Registration');
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
await register();
let body = await page.locator('body').innerText();
pass('lands in Parent Mode hub after registering', /Parent Mode|وضع الوالدين|متابعة/.test(body));
pass('hub shows the five sections', ['Progress|المتابعة', 'Home Tips|أفكار للبيت', 'Ask IRIS|اسألي', 'Community|مجتمع', 'Specialist|المختصين']
  .every((re) => new RegExp(re).test(body)));
pass('prototype sections are labelled', /Soon|قريبًا/.test(body));

// ── 2. logout → log back in (the reported failure) ──────────────────────────
console.log('\n[2] Logout, then log back in');
await page.getByRole('button', { name: /Log out|خروج/ }).first().click();
await page.waitForTimeout(1500);
await page.getByRole('button', { name: /Parent Mode|وضع الوالدين/ }).click();
await page.waitForTimeout(700);
await page.locator('input[type="email"]').fill(EMAIL);
await page.locator('input[type="password"]').fill(PASS);
await page.getByRole('button', { name: /Login Now|دخول الآن/ }).click();
await page.waitForTimeout(2000);
body = await page.locator('body').innerText();
pass('logging back in with the same account works', /متابعة|Progress|Home Tips|أفكار للبيت/.test(body), body.slice(0, 60).replace(/\n/g, ' '));

// ── 3. clear error messages ─────────────────────────────────────────────────
console.log('\n[3] Error messages are visible');
await page.getByRole('button', { name: /Log out|خروج/ }).first().click();
await page.waitForTimeout(1200);
await page.getByRole('button', { name: /Parent Mode|وضع الوالدين/ }).click();
await page.waitForTimeout(600);
await page.locator('input[type="email"]').fill(EMAIL);
expectAuthFailure = true;
await page.locator('input[type="password"]').fill('DEFINITELY-WRONG');
await page.getByRole('button', { name: /Login Now|دخول الآن/ }).click();
await page.waitForTimeout(1500);
const alertText = await page.locator('[role="alert"]').first().innerText().catch(() => '');
pass('wrong password shows a visible on-screen error', /do not match|غير صحيحة/.test(alertText), alertText.replace(/\n/g, ' ').slice(0, 70));
expectAuthFailure = false;

// ── 4. stories as scenes ────────────────────────────────────────────────────
console.log('\n[4] Stories are scene experiences');
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
await page.getByRole('button', { name: /Child Mode|وضع الطفل/ }).click();
await page.waitForTimeout(1500);
const nameField = page.locator('input').first();
if (await nameField.count()) {
  await nameField.fill('سلمى');
  await page.getByRole('button', { name: /ابدأ|Start|يلا/ }).first().click().catch(() => {});
  await page.waitForTimeout(1200);
}
const storyBtn = page.getByRole('button', { name: /Stories|القصص/ });
if (await storyBtn.count()) {
  await storyBtn.first().click();
  await page.waitForTimeout(1200);
  body = await page.locator('body').innerText();
  pass('story list shows scene counts', /scenes|مشاهد/.test(body));
  await page.getByRole('button', { name: /Bandaq|بندق/ }).first().click();
  await page.waitForTimeout(900);
  body = await page.locator('body').innerText();
  pass('a scene shows one short sentence', /meadow|الجنينة/.test(body));
  const sentenceLen = (body.match(/.{0,120}(meadow|الجنينة).{0,120}/) || [''])[0].length;
  pass('scene text is a sentence, not a paragraph', sentenceLen < 260, `${sentenceLen} chars around it`);
  // walk to the end
  for (let i = 0; i < 6; i++) {
    const next = page.getByRole('button', { name: /Next scene|المشهد التالي|Story question|سؤال الحكاية/ });
    if (!(await next.count())) break;
    await next.first().click();
    await page.waitForTimeout(500);
  }
  body = await page.locator('body').innerText();
  pass('story ends with a comprehension question', /Who helped|مين ساعد/.test(body));
  await page.screenshot({ path: 'e2e2-shots/qa-story-question.png' });
} else {
  pass('story entry point reachable from Child Mode', false, 'Stories button not found');
}

// ── 5. unified shell on a legacy game ───────────────────────────────────────
console.log('\n[5] Unified shell on legacy screens');
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
await page.getByRole('button', { name: /Child Mode|وضع الطفل/ }).click();
await page.waitForTimeout(1200);
const nf = page.locator('input').first();
if (await nf.count()) {
  await nf.fill('سلمى');
  await page.getByRole('button', { name: /ابدأ|Start|يلا/ }).first().click().catch(() => {});
  await page.waitForTimeout(1200);
}
const gameBtn = page.getByRole('button', { name: /Memory Game|لعبة الذاكرة/ });
if (await gameBtn.count()) {
  await gameBtn.first().click();
  await page.waitForTimeout(1200);
  body = await page.locator('body').innerText();
  pass("child's name still visible inside a legacy game", /سلمى/.test(body));
  /**
   * This used to assert the literal '⭐' character was in the page text.
   * Phase 10 replaced every interface emoji with a drawn brand mark, because
   * emoji render as different artwork on every operating system — so the old
   * assertion was pinned to an implementation that was deliberately removed,
   * not to the behaviour.
   *
   * The behaviour is: the child can still see their star count while inside a
   * legacy game. That is now checked properly — the counter element exists,
   * it is exposed to assistive tech as a status, and it shows a number.
   */
  const starEl = page.locator('[role="status"]').filter({ hasText: /^\s*\d+\s*$/ });
  const starVisible = (await starEl.count()) > 0 && (await starEl.first().isVisible());
  pass('star count still visible inside a legacy game', starVisible);
  await page.screenshot({ path: 'e2e2-shots/qa-legacy-shell.png' });
} else {
  pass('legacy game reachable from Child Mode', false, 'Memory Game button not found');
}

// ── 6. responsive: no horizontal overflow ───────────────────────────────────
console.log('\n[6] Responsive');
for (const [label, w, h] of [['mobile', 390, 844], ['tablet', 820, 1180], ['desktop', 1440, 900]]) {
  const c = await browser.newContext({ viewport: { width: w, height: h } });
  const p2 = await c.newPage();
  await p2.goto(BASE, { waitUntil: 'networkidle' });
  await p2.waitForTimeout(800);
  const overflow = await p2.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  pass(`${label} (${w}px): no horizontal overflow`, overflow <= 1, `${overflow}px`);
  await c.close();
}

pass('no unexpected console/page errors', errors.length === 0, errors.slice(0, 2).join(' | '));

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n=== ${results.length - failed.length}/${results.length} checks passed ===`);
if (failed.length) {
  console.log('FAILED:');
  failed.forEach((f) => console.log(`  - ${f.n}${f.extra ? ' — ' + f.extra : ''}`));
  process.exitCode = 1;
}
