// P56 PROD E2E part 2 — deployed-app flows (alias accounts from part 1).
import { chromium } from 'playwright';
import { execFileSync } from 'child_process';
import fs from 'fs';

const U = 'https://iris-kohl-seven.vercel.app';
const EXEC = '/usr/bin/chromium';
const state = JSON.parse(fs.readFileSync('/tmp/e2e_state.json', 'utf8'));
let pass = 0, fail = 0;
const ok = (n, c, e = '') => { if (c) { pass++; console.log('  PASS ' + n); } else { fail++; console.log('  FAIL ' + n + (e ? ' :: ' + e : '')); } };

const PY = String.raw`
import imaplib, email, re, sys, time
to, excl = sys.argv[1], [x for x in sys.argv[2].split(',') if x]
min_age = float(sys.argv[3])
M = imaplib.IMAP4_SSL('imap.gmail.com'); M.login("tabibigoo@gmail.com", "cxerzvphuprfaggy"); M.select('INBOX')
_, d = M.search(None, 'SUBJECT', '"verification code"')
cands = []
for i in d[0].split():
    _, msg = M.fetch(i, '(RFC822)')
    m = email.message_from_bytes(msg[0][1])
    if to.lower() not in m.get('To','').lower(): continue
    part = m.get_payload(decode=True)
    if isinstance(m.get_payload(), list):
        for pp in m.get_payload():
            if pp.get_content_type()=='text/plain': part = pp.get_payload(decode=True); break
    t = (part or b'').decode('utf-8','replace')
    mm = re.search(r':\s*(\d{6})\b', t) or re.search(r'\b(\d{6})\b', t)
    if not mm or mm.group(1) in excl: continue
    dt = email.utils.parsedate_to_datetime(m['Date']).timestamp()
    cands.append((dt, mm.group(1)))
M.logout()
cands.sort()
now = time.time()
for dt, c in reversed(cands):
    if now - dt >= min_age: print(c); sys.exit(0)
print('')
`;

function newestCode(toAddr, exclude, minAgeS = 0) {
  const out = execFileSync('python3', ['-c', PY, toAddr, (exclude || []).join(','), String(minAgeS)], { encoding: 'utf8' }).trim();
  return out || null;
}

const api2 = async (path, body, token) => {
  const r = await fetch(U + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: JSON.stringify(body || {}),
  });
  return { status: r.status, data: await r.json().catch(() => ({})) };
};

const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });

// ─── Y: forced verification on the deployed UI ─────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await ctx.newPage();
  await page.goto(U + '/login', { waitUntil: 'networkidle', timeout: 90000 });
  await page.fill('input[type="email"]', state.Y.email);
  await page.fill('input[type="password"]', state.Y.password);
  await page.getByRole('button', { name: /دخول الآن|Login Now|Sign in/i }).first().click();
  const onVerify = await page.waitForURL(/\/verify/, { timeout: 30000 }).then(() => true).catch(() => false);
  ok('unverified login on DEPLOYED app forced to /verify', onVerify, await page.evaluate(() => location.pathname));
  await page.waitForSelector('.ir-verify-box', { timeout: 25000 });
  await page.screenshot({ path: '/home/ubuntu/iris-delivery/auth/prod-verify-Y.png' });

  await page.waitForTimeout(8000); // mount resend fired; wait for that email
  let codeY = newestCode(state.Y.email, [state.Y.code], 3);
  ok('verify-screen resend delivered a fresh email', !!codeY, String(codeY));
  if (!codeY) { console.log('  note: falling back to original code (resend may have failed)'); codeY = state.Y.code; }

  const wrong = codeY === '999999' ? '111111' : '999999';
  await page.locator('.ir-verify-box').nth(0).click();
  await page.keyboard.type(wrong, { delay: 35 });
  await page.getByRole('button', { name: /تأكيد الكود|Confirm code/i }).click();
  await page.waitForTimeout(2500);
  const errShown = await page.evaluate(() => /غير صحيح|not correct|خطأ|expired|انته/i.test((document.querySelector('.ir-verify-error') || {}).innerText || ''));
  ok('wrong code shows on-screen error (deployed)', errShown, await page.evaluate(() => (document.querySelector('.ir-verify-error') || {}).innerText || 'none'));

  for (let i = 0; i < 6; i++) { await page.locator('.ir-verify-box').nth(i).click(); await page.keyboard.press('Backspace'); }
  for (let i = 0; i < 6; i++) { await page.locator('.ir-verify-box').nth(i).click(); await page.keyboard.type(codeY[i], { delay: 40 }); }
  await page.getByRole('button', { name: /تأكيد الكود|Confirm code/i }).click();
  const entered = await page.waitForURL((u) => /\/(parent|app)/.test(u.pathname), { timeout: 40000 }).then(() => true).catch(() => false);
  ok('real emailed code entered on UI → enters the app', entered, await page.evaluate(() => location.pathname));
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/home/ubuntu/iris-delivery/auth/prod-Y-after-verify.png' });
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 300));
  ok('post-verify inside app (onboarding/hub), never login form', !/كلمة المرور|Password/i.test(bodyText), bodyText.slice(0, 90));
  await ctx.close();
}

// ─── X: expiry + resend recovery on the deployed API ───────────────────────
{
  const age = Date.now() / 1000 - state.t0;
  const wait = Math.max(0, 5 * 60 + 40 - age);
  console.log('  X code is ' + Math.round(age) + 's old; waiting ' + Math.round(wait) + 's past the 5-minute expiry...');
  await new Promise((r) => setTimeout(r, wait * 1000));
  const st = await api2('/api/verify/confirm', { code: state.X.code }, state.X.token);
  ok('expired OTP rejected on DEPLOYED app', st.status >= 400 && /CODE_EXPIRED/.test(JSON.stringify(st.data)), st.status + ' ' + JSON.stringify(st.data).slice(0, 110));
  const sned = await api2('/api/verify/send', { lang: 'en' }, state.X.token);
  ok('resend after expiry: honest 200 sent (deployed, no devCode)', sned.status === 200 && sned.data.sent === true && !('devCode' in sned.data), sned.status + ' ' + JSON.stringify(sned.data).slice(0, 110));
  await new Promise((r) => setTimeout(r, 10000));
  let codeX = null;
  for (let i = 0; i < 6 && !codeX; i++) { codeX = newestCode(state.X.email, [state.X.code], 5); if (!codeX) await new Promise((r) => setTimeout(r, 8000)); }
  ok('resend delivered a NEW real code to the inbox', !!codeX, String(codeX));
  if (codeX) {
    state.X.newCode = codeX;
    const cf = await api2('/api/verify/confirm', { code: codeX }, state.X.token);
    ok('expired → resend → new code verifies (deployed)', cf.status === 200 && cf.data.emailVerified === true, JSON.stringify(cf.data).slice(0, 110));
  }
  fs.writeFileSync('/tmp/e2e_state.json', JSON.stringify(state));
}

await browser.close();
console.log('RESULT part2: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
