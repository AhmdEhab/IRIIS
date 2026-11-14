// qa-auth-flow.mjs — auth spec §8 test battery: registration, login, sessions,
// logout, ownership, verification codes, assessment gating, and the browser
// behaviours (refresh persistence, no back into the app after logout, no
// repeat onboarding). Run against the dev server + API in the sandbox.
import { chromium } from 'playwright';

const EXEC = '/usr/bin/chromium';
const origin = process.env.QA_ORIGIN || 'http://127.0.0.1:5173';
const api = process.env.QA_API || 'http://localhost:5000';
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`  PASS ${name}`); }
  else { fail++; console.log(`  FAIL ${name}${extra ? ' :: ' + extra : ''}`); }
};
const rnd = () => Math.floor(Math.random() * 1e6);
const J = (method, url, body, token) => fetch(url, {
  method,
  headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  ...(body ? { body: JSON.stringify(body) } : {}),
}).then(async r => ({ status: r.status, data: await r.json().catch(() => ({})) }));

const regPayload = (name) => ({
  email: `${name}${rnd()}@qa.test`, password: 'Passw0rd1', name: `${name} Kid`,
  age: 5, condition: 'other', consent_mvp_use: true,
});

// ─── API scenarios ───────────────────────────────────────────────────────
console.log('API scenarios');
// 1. registration stores user + child, unverified
const A = regPayload('alpha');
const r1 = await J('POST', `${api}/api/register`, A);
ok('1 register 201 + token + child', r1.status === 201 && !!r1.data.token && !!r1.data.child, JSON.stringify(r1.data).slice(0, 120));
ok('1 new account NOT verified', r1.data.user?.emailVerified === false);
const tokA = r1.data.token, kidA = r1.data.child?.id;

// 2. duplicate email rejected
const r2 = await J('POST', `${api}/api/register`, { ...A, name: 'other' });
ok('2 duplicate email 409', r2.status === 409 || (r2.status >= 400 && r2.data.error === 'EMAIL_EXISTS'), `${r2.status} ${JSON.stringify(r2.data).slice(0, 90)}`);

// 3. weak password rejected
const r3 = await J('POST', `${api}/api/register`, { ...regPayload('weak'), password: 'abc' });
ok('3 weak password 400', r3.status === 400, `${r3.status}`);

// 4. login returns token + verification state
const r4 = await J('POST', `${api}/api/login`, { email: A.email, password: 'Passw0rd1' });
ok('4 login ok + emailVerified=false', r4.status === 200 && !!r4.data.token && r4.data.user.emailVerified === false);

// 5. wrong password rejected uniformly
const r5 = await J('POST', `${api}/api/login`, { email: A.email, password: 'Nope1234' });
ok('5 wrong password 401', r5.status === 401 && r5.data.error === 'INVALID_CREDENTIALS');

// 5b. unknown email — same shape (no enumeration)
const r5b = await J('POST', `${api}/api/login`, { email: 'ghost@nope.test', password: 'Nope1234' });
ok('5b unknown email same 401', r5b.status === 401 && r5b.data.error === 'INVALID_CREDENTIALS');

// 6. email normalisation
const cap = await J('POST', `${api}/api/register`, { ...regPayload('cap'), email: ` Cap${rnd()}@QA.TEST ` });
const capEmail = cap.data.user?.email;
ok('6 email normalised (trim+lower)', typeof capEmail === 'string' && capEmail === capEmail.trim().toLowerCase(), String(capEmail));

// 7. expired session rejected
const { createRequire } = await import('node:module');
const req = createRequire('/home/ubuntu/iriss/server/noop.js');
await new Promise((resolve) => {
  const s3 = req('sqlite3');
  const db = new s3.Database('/home/ubuntu/iriss/server/database.sqlite');
  db.run(`UPDATE Sessions SET expires_at = 1 WHERE email = ?`, [A.email], () => { db.close(); resolve(); });
});
const r7 = await J('GET', `${api}/api/verify/status`, null, tokA);
ok('7 expired session 401', r7.status === 401, JSON.stringify(r7.data).slice(0, 80));
// re-login for a fresh session
const l2 = await J('POST', `${api}/api/login`, { email: A.email, password: 'Passw0rd1' });
const tokA2 = l2.data.token;
ok('7 re-login yields working token', (await J('GET', `${api}/api/verify/status`, null, tokA2)).status === 200);

// 8. verification: send (test mode) → wrong → expired → right
const send = await J('POST', `${api}/api/verify/send`, {}, tokA2);
const honestEither = send.data.sent === true || send.data.reason === 'EMAIL_NOT_CONFIGURED';
ok('8 send 200 + honest result + devCode', send.status === 200 && honestEither && !!send.data.devCode, JSON.stringify(send.data).slice(0, 100));
const dev = send.data.devCode;
const cooldown = await J('POST', `${api}/api/verify/send`, {}, tokA2);
ok('8 resend within 30s 429', cooldown.status === 429, `${cooldown.status}`);
const wrong = await J('POST', `${api}/api/verify/confirm`, { code: '000000' === dev ? '111111' : '000000' }, tokA2);
ok('8 wrong code rejected', wrong.status >= 400 && wrong.data.error === 'CODE_WRONG', JSON.stringify(wrong.data).slice(0, 80));
// expiry: force the row old, then confirm must fail with CODE_EXPIRED, resend works
await new Promise((resolve) => {
  const s3 = req('sqlite3');
  const db = new s3.Database('/home/ubuntu/iriss/server/database.sqlite');
  db.run(`UPDATE VerificationCodes SET expires_at = 1 WHERE used_at IS NULL`, () => { db.close(); resolve(); });
});
const expired = await J('POST', `${api}/api/verify/confirm`, { code: dev }, tokA2);
ok('8 expired code rejected', expired.status >= 400 && expired.data.error === 'CODE_EXPIRED', JSON.stringify(expired.data).slice(0, 80));
const resend = await J('POST', `${api}/api/verify/send`, {}, tokA2);
const dev2 = resend.data.devCode;
ok('8 resend after expiry works', resend.status === 200 && !!dev2, `${resend.status}`);
const good = await J('POST', `${api}/api/verify/confirm`, { code: dev2 }, tokA2);
ok('8 correct code verifies', good.status === 200 && good.data.emailVerified === true, JSON.stringify(good.data).slice(0, 80));
ok('8 status now verified', (await J('GET', `${api}/api/verify/status`, null, tokA2)).data.emailVerified === true);

// 9. logout revokes the server session
const out = await J('POST', `${api}/api/logout`, {}, tokA2);
ok('9 logout 200', out.status === 200);
ok('9 old token dead after logout', (await J('GET', `${api}/api/verify/status`, null, tokA2)).status === 401);

// 10. ownership across users
const BB = regPayload('bravo');
const rb = await J('POST', `${api}/api/register`, BB);
const tokB = rb.data.token, kidB = rb.data.child?.id;
ok('10 other user cannot read child', (await J('GET', `${api}/api/assessments/${kidA}`, null, tokB)).status === 404);
ok('10 other user cannot read decisions', (await J('GET', `${api}/api/decisions/${kidA}`, null, tokB)).status === 404);
ok('10 other user cannot write assessment for foreign child', (await J('POST', `${api}/api/assessments`, { childId: kidA, domain_scores: {}, item_results: {} }, tokB)).status === 404);
const l3 = await J('POST', `${api}/api/login`, { email: A.email, password: 'Passw0rd1' });
const tokA3 = l3.data.token;
ok('10 owner can read own child', (await J('GET', `${api}/api/assessments/${kidA}`, null, tokA3)).status === 200);

// 11. assessment saved for child belongs to child (record persisted)
const saveA = await J('POST', `${api}/api/assessments`, { childId: kidA, domain_scores: { letter: 0.5 }, item_results: {}, accommodations_used: [], data_quality_flags: [], interruption_count: 0 }, tokA3);
ok('11 assessment saved 201/200', saveA.status === 200 || saveA.status === 201, `${saveA.status}`);
const listA = await J('GET', `${api}/api/assessments/${kidA}`, null, tokA3);
ok('11 assessment listed for child', listA.status === 200 && Array.isArray(listA.data) && listA.data.length >= 1);

// 12. unverified activity logging blocked, verified allowed
const CC = regPayload('charlie');
const rc = await J('POST', `${api}/api/register`, CC);
const tokC = rc.data.token, kidC = rc.data.child?.id;
const denied = await J('POST', `${api}/api/sessions`, { childId: kidC, goal_id: 'letters-a1', level: 1, accuracy: 0.8 }, tokC);
ok('12 unverified /api/sessions 403', denied.status === 403 && denied.data.error === 'EMAIL_NOT_VERIFIED', JSON.stringify(denied.data).slice(0, 80));
const s2 = await J('POST', `${api}/api/verify/send`, {}, tokC);
const c2 = await J('POST', `${api}/api/verify/confirm`, { code: s2.data.devCode }, tokC);
ok('12 charlie verified', c2.status === 200);
const allowed = await J('POST', `${api}/api/sessions`, { childId: kidC, goal_id: 'letters-a1', level: 1, accuracy: 0.8 }, tokC);
ok('12 verified /api/sessions allowed', allowed.status === 200 || allowed.status === 201, `${allowed.status}`);

// ─── Browser scenarios ───────────────────────────────────────────────────
console.log('Browser scenarios');
const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });

const DD = regPayload('delta');
const rd = await J('POST', `${api}/api/register`, DD);
ok('13 delta registered unverified', rd.status === 201 && rd.data.user.emailVerified === false);
// 13. first-time parent (no assessment): login → forced assessment, refresh keeps it
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await page.goto(origin + '/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', DD.email);
  await page.fill('input[type="password"]', 'Passw0rd1');
  await page.getByRole('button', { name: /دخول الآن|Login Now|Sign in/i }).first().click();
  await page.waitForTimeout(2500);
  const intro = await page.evaluate(() => /نتعرّف|getting to know|تجهيز|journey ready/i.test(document.body.innerText));
  ok('13 first login shows assessment (not hub/verify)', intro, await page.evaluate(() => location.pathname + ' | ' + document.body.innerText.slice(0, 80)));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const intro2 = await page.evaluate(() => /نتعرّف|getting to know|تجهيز|journey ready/i.test(document.body.innerText));
  ok('13 refresh during assessment keeps flow', intro2);
  await context.close();
}

await J('POST', `${api}/api/assessments`, { childId: kidB, assessment_kind: 'LADDER', status: 'COMPLETE', domain_scores: { letter: 0.4 }, skill_estimates: { letter: 0.4 }, item_results: {}, accommodations_used: [], data_quality_flags: [], interruption_count: 0 }, tokB);
// 14. assessment done + unverified → login lands on /verify; wrong code errors;
//     dev code verifies → /parent; refresh persists; back never re-enters auth.
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await page.goto(origin + '/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', BB.email);
  await page.fill('input[type="password"]', 'Passw0rd1');
  await page.getByRole('button', { name: /دخول الآن|Login Now|Sign in/i }).first().click();
  const onVerify = await page.waitForURL(/\/verify/, { timeout: 8000 }).then(() => true).catch(() => false);
  ok('14 unverified w/ assessment → /verify', onVerify, await page.evaluate(() => location.pathname));
  // code boxes present; then wait for the SEND response to land — with a
  // real SMTP provider the request now takes seconds, not milliseconds,
  // so the dev chip must be awaited by content, not existence.
  await page.waitForSelector('.ir-verify-box', { timeout: 8000 });
  await page.waitForFunction(() => /\d{6}/.test(document.querySelector('.ir-verify-devcode')?.innerText || ''), null, { timeout: 15000 });
  const note = await page.evaluate(() => document.querySelector('.ir-verify-note')?.innerText || '');
  ok('14 honest provider note shown', /غير مفعّلة|not configured|أرسلنا|we sent/i.test(note), note.slice(0, 70));
  // wrong code path: type six digits that are not the chip's code
  const chip0 = page.locator('.ir-verify-devcode');
  const realCode = (await chip0.count())
    ? (await chip0.first().innerText()).replace(/\D/g, '').slice(-6)
    : '';
  const wrongCode = realCode === '999999' ? '111111' : '999999';
  await page.locator('.ir-verify-box').nth(0).click();
  await page.keyboard.type(wrongCode, { delay: 40 });
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: /تأكيد الكود|Confirm code/i }).click();
  await page.waitForTimeout(1500);
  const errShown = await page.evaluate(() =>
    /غير صحيح|not correct|خطأ/i.test(document.querySelector('.ir-verify-error')?.innerText || ''));
  ok('14 wrong code shows error', errShown, await page.evaluate(() => document.querySelector('.ir-verify-error')?.innerText || 'none'));
  // fill dev code via chip then confirm
  // click the test-mode chip — it fills the boxes with the real code
  const chips = page.locator('.ir-verify-devcode');
  if (await chips.count()) await chips.first().click();
  await page.waitForTimeout(400);
  const filled = await page.evaluate(() => [...document.querySelectorAll('.ir-verify-box')].map(b => b.value).join(''));
  ok('14 chip fills real code', filled === realCode, filled);
  await page.getByRole('button', { name: /تأكيد الكود|Confirm code/i }).click();
  const onParent = await page.waitForURL(/\/parent/, { timeout: 8000 }).then(() => true).catch(() => false);
  ok('14 verify → /parent (never /login)', onParent, await page.evaluate(() => location.pathname));
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const stillParent = await page.evaluate(() => location.pathname === '/parent');
  ok('14 refresh on /parent stays authenticated', stillParent);
  await page.goBack();
  await page.waitForTimeout(1200);
  const backState = await page.evaluate(() => ({ path: location.pathname, text: document.body.innerText.slice(0, 120) }));
  const noAuthForms = await page.evaluate(() => !document.querySelector('input[type="password"]'));
  ok('14 back after verify never shows login form again', noAuthForms, JSON.stringify(backState).slice(0, 120));
  await context.close();
}

// 15. verified returning user → hub directly; /login self-redirects
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  await page.goto(origin + '/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', BB.email);
  await page.fill('input[type="password"]', 'Passw0rd1');
  await page.getByRole('button', { name: /دخول الآن|Login Now|Sign in/i }).first().click();
  const hub = await page.waitForURL(/\/parent/, { timeout: 8000 }).then(() => true).catch(() => false);
  ok('15 verified login → hub straight', hub, await page.evaluate(() => location.pathname));
  await page.goto(origin + '/login');
  await page.waitForTimeout(1500);
  const selfRedirect = await page.evaluate(() => location.pathname === '/parent');
  ok('15 no repeat onboarding: /login self-redirects', selfRedirect);
  // logout via UI
  const exitBtn = page.getByRole('button', { name: /خروج|Log ?out|Sign ?out/i }).first();
  if (await exitBtn.count()) {
    await exitBtn.click();
    await page.waitForTimeout(1500);
  } else {
    await page.evaluate(() => window.localStorage.clear());
  }
  const afterOut = await page.evaluate(() => ({ path: location.pathname, token: localStorage.getItem('iris_auth_token') }));
  ok('15 logout leaves app', afterOut.path === '/' || afterOut.path === '', JSON.stringify(afterOut));
  ok('15 token cleared', !afterOut.token);
  await page.goBack();
  await page.waitForTimeout(1200);
  const backAfterOut = await page.evaluate(() => ({ path: location.pathname, pw: !!document.querySelector('input[type="password"]'), hub: /وضع الوالدين|لمحة عن التعلّم/.test(document.body.innerText) }));
  ok('15 back after logout cannot re-enter app', !backAfterOut.hub, JSON.stringify(backAfterOut));
  await context.close();
}

await browser.close();
console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
