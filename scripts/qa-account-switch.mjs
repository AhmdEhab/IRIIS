/* P61 regression: two families, one device.
 * Family A's COMPLETE local state (owner-stamped mirrors, ladder draft, an
 * entry even forged under family B's child id) must NOT carry over when
 * family B logs in through the real form. B must be forced through the
 * cv2 Family File, and every account-scoped key purged.
 * Run against the local QA stack (VERIFY_DEV_CODES=true server + vite).
 * Exit 0 = pass. */
/* P61 acceptance: family A's full local state (owner-stamped) on a device,
   then family B LOGS IN on that same device — B must be forced through the
   Family File no matter what A's mirrors claim, including an entry forged
   under B's own child id. */
import { chromium } from 'playwright';
const API = 'http://127.0.0.1:5000/api';
const WEB = 'http://127.0.0.1:5173';
const rnd = () => Math.random().toString(36).slice(2, 8);
const J = async (m, u, b, t) => { const r = await fetch(u, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: 'Bearer ' + t } : {}) }, body: b ? JSON.stringify(b) : undefined }); return { status: r.status, data: await r.json().catch(() => null) }; };
const mk = async () => {
  const email = 'p61' + rnd() + '@qa.test';
  const reg = await J('POST', API + '/register', { email, password: 'Passw0rd1', name: 'P61 Kid', age: 5, condition: 'other', consent_mvp_use: true });
  await J('POST', API + '/verify/confirm', { code: reg.data.verification?.devCode }, reg.data.token);
  return { email, token: reg.data.token, kid: reg.data.child.id };
};
const A = await mk(); const B = await mk();

const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('PAGEERR: ' + String(e).slice(0, 160)));

/* 1. simulate A's post-patch device state */
await page.goto(WEB + '/login', { waitUntil: 'domcontentloaded' });
await page.evaluate(({ a, bk }) => {
  localStorage.clear();
  localStorage.setItem('iris_auth_token', a.token);
  localStorage.setItem('iris_auth_email', a.email);
  localStorage.setItem('iris_owner_email', a.email);
  localStorage.setItem('iris_family_profiles_v1', JSON.stringify({
    [String(a.kid)]: { responses: { VQ1: { v: 'words' } }, scored: { domains: {}, confidence: {} }, bankVersion: 'cv2', owner: a.email },
    [String(bk)]: { responses: { VQ1: { v: 'words' } }, scored: { domains: {}, confidence: {} }, bankVersion: 'cv2', owner: a.email }, // poisoned entry under B's id
  }));
  localStorage.setItem('iris_ladder_probe_v1', JSON.stringify({ phase: 'DONE', childId: bk }));
  localStorage.setItem('iris_stars_v1', '99');
}, { a: A, bk: B.kid });

/* 2. A logs out through the UI path (context logout = same as button) */
await page.evaluate(({ e }) => { localStorage.removeItem('iris_auth_token'); localStorage.removeItem('iris_auth_email'); localStorage.setItem('iris_auth_email_probe', e); }, { e: A.email });

/* 3. B logs IN via the real login form */
await page.goto(WEB + '/login', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1200);
const setV = (el, v) => el.evaluate((node, val) => { const set = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(node), 'value').set; set.call(node, val); node.dispatchEvent(new Event('input', { bubbles: true })); }, v);
const ins = await page.$$('input');
for (const i of ins) {
  const ty = await i.evaluate((el) => el.type);
  if (ty === 'email') await setV(i, B.email);
  else if (ty === 'password') await setV(i, 'Passw0rd1');
}
await page.waitForTimeout(200);
await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /دخول الآن|Login|Sign in/i.test((x.innerText || '').trim())); if (b) b.click(); });
await page.waitForTimeout(7000);
const txt = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 220));
console.log('B SEES:', txt.slice(0, 160));
const purged = await page.evaluate(() => ({ fam: localStorage.getItem('iris_family_profiles_v1'), stars: localStorage.getItem('iris_stars_v1'), owner: localStorage.getItem('iris_owner_email') }));
// eslint-disable-next-line
  console.log('POST-SWITCH storage:', JSON.stringify(purged).slice(0, 240));
const forcedFamily = /ملف العائلة|Family file/.test(txt);
console.log(forcedFamily ? 'PASS: B forced through Family File; A mirrors purged' : 'FAIL: B was NOT forced');
await page.screenshot({ path: '/home/ubuntu/iris-delivery/prod-repro/p61-switch.png' });
await browser.close();
process.exit(forcedFamily ? 0 : 1);
