// P56 PROD E2E part 2b — Y happy path with patient mailbox polling.
// Reuses /tmp/e2e_state.json (Y was registered by e2e_prod_1; its mount
// resend at ~17:07:31 is the CURRENTLY valid code — the registration one
// was destroyed by that resend). Proves: forced /verify screen, wrong code
// error UI, real emailed code entry, and entry into the app after verifying.
import { chromium } from 'playwright';
import { execFileSync } from 'child_process';
import fs from 'fs';

const U = 'https://iris-kohl-seven.vercel.app';
const state = JSON.parse(fs.readFileSync('/tmp/e2e_state.json', 'utf8'));
let pass = 0, fail = 0;
const ok = (n, c, e = '') => { if (c) { pass++; console.log('  PASS ' + n); } else { fail++; console.log('  FAIL ' + n + (e ? ' :: ' + e : '')); } };

const PY = String.raw`
import imaplib, email, re, sys
to, excl = sys.argv[1], [x for x in sys.argv[2].split(',') if x]
min_date = float(sys.argv[3]) if len(sys.argv) > 3 else 0.0
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
    if dt < min_date: continue
    cands.append((dt, mm.group(1)))
M.logout()
cands.sort()
print(cands[-1][1] if cands else '')
`;

function latestCode(toAddr, exclude, minDate = 0) {
  return execFileSync('python3', ['-c', PY, toAddr, (exclude || []).join(','), String(minDate)], { encoding: 'utf8' }).trim() || null;
}

async function pollCode(toAddr, exclude, tries = 10, minDate = 0) {
  for (let i = 0; i < tries; i++) {
    const c = latestCode(toAddr, exclude, minDate);
    if (c) return c;
    await new Promise((r) => setTimeout(r, 9000));
  }
  return null;
}

const t0 = Date.now() / 1000 - 30; // email clocks skew a bit; 30s grace
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 960 } });
const page = await ctx.newPage();

await page.goto(U + '/login', { waitUntil: 'networkidle', timeout: 90000 });
await page.fill('input[type="email"]', state.Y.email);
await page.fill('input[type="password"]', state.Y.password);
await page.getByRole('button', { name: /دخول الآن|Login Now|Sign in/i }).first().click();
const onVerify = await page.waitForURL(/\/verify/, { timeout: 30000 }).then(() => true).catch(() => false);
ok('unverified login forced to /verify (deployed)', onVerify, await page.evaluate(() => location.pathname));
await page.waitForSelector('.ir-verify-box', { timeout: 25000 });

// The registration-era code has long expired and the 17:07 resend is close
// to its own 5-minute death, so press RESEND on the screen NOW: that gives
// a brand-new code with a full TTL for the wrong→correct walkthrough.
// Deterministic: fire the resend through the API ourselves (the mount
// effect may skip it while a pending code is still alive, and the UI
// button's cooldown state is not something we should race against).
// Cooldown is 30s/email, so retry politely until it accepts.
let sent = null;
for (let i = 0; i < 8 && !sent; i++) {
  const rr = await fetch(U + '/api/verify/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + state.Y.token },
    body: JSON.stringify({ email: state.Y.email, lang: 'en' }),
  });
  if (rr.ok) { sent = await rr.json(); break; }
  await new Promise((r) => setTimeout(r, 8000));
}
ok('API resend accepted', !!sent && sent.sent === true, JSON.stringify(sent));
const tSend = Date.now() / 1000 - 40; // the code we must read was stamped after this
const code = await pollCode(state.Y.email, [], 10, tSend);
ok('a live OTP email is in the mailbox', !!code, String(code));
if (!code) { console.log('RESULT part2b: blocked'); process.exit(2); }

const wrong = code === '999999' ? '111111' : '999999';
await page.locator('.ir-verify-box').nth(0).click();
await page.keyboard.type(wrong, { delay: 35 });
await page.getByRole('button', { name: /تأكيد الكود|Confirm code/i }).click();
await page.waitForTimeout(2500);
const err = await page.evaluate(() => /غير صحيح|not correct|خطأ|expired|انته/i.test((document.querySelector('.ir-verify-error') || {}).innerText || ''));
ok('wrong code shows error on deployed UI', err);

for (let i = 0; i < 6; i++) { await page.locator('.ir-verify-box').nth(i).click(); await page.keyboard.press('Backspace'); }
for (let i = 0; i < 6; i++) { await page.locator('.ir-verify-box').nth(i).click(); await page.keyboard.type(code[i], { delay: 40 }); }
await page.getByRole('button', { name: /تأكيد الكود|Confirm code/i }).click();
const entered = await page.waitForURL((u) => /\/(parent|app)/.test(u.pathname), { timeout: 40000 }).then(() => true).catch(() => false);
ok('real emailed code entered → enters app', entered, await page.evaluate(() => location.pathname));
await page.waitForTimeout(2500);
await page.screenshot({ path: '/home/ubuntu/iris-delivery/auth/prod-Y-verified.png' });
state.Y.verified = entered;
fs.writeFileSync('/tmp/e2e_state.json', JSON.stringify(state));
await browser.close();
console.log(`RESULT part2b: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
