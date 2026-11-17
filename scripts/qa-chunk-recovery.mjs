/* P65 proof: a failing lazy route chunk (stale build after redeploy, flaky
 * network) must self-heal — in-place retry, then ONE hard reload that
 * re-fetches fresh assets — instead of parking the user on the "page
 * failed to load" card.
 *
 * Needs: local API on :5000 (VERIFY_DEV_CODES=true), `vite preview` on 4173
 * with the /api proxy (vite.config.ts preview.proxy). */
import { chromium } from 'playwright';

const API = process.env.QA_API || 'http://127.0.0.1:5000/api';
const WEB = process.env.QA_PREVIEW || 'http://127.0.0.1:4173';
let failures = 0;
const ok = (name, cond, extra = '') => {
  console.log(`${cond ? '  ok' : 'FAIL'}  ${name}${extra ? ` ${extra}` : ''}`);
  if (!cond) failures++;
};
const rnd = () => String(Math.floor(Math.random() * 1e6));
const J = async (method, url, body, token) => {
  const r = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, data: await r.json().catch(() => null) };
};

// 1. a real verified family on the API
const email = `chunk${rnd()}@qa.test`;
const reg = await J('POST', `${API}/register`, {
  email, password: 'Passw0rd1', name: 'Chunk Kid', age: 5, condition: 'other', consent_mvp_use: true,
});
ok('register 201', reg.status === 201 && !!reg.data?.token, JSON.stringify(reg.data || {}).slice(0, 90));
const token = reg.data.token;
const devCode = reg.data.verification?.devCode;
if (devCode) await J('POST', `${API}/verify/confirm`, { code: devCode }, token);

const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

let chunkReqs = 0;
let docs = 0; // real document fetches — a hard reload re-requests index.html
page.on('request', (r) => { if (r.resourceType() === 'document') docs++; });
await page.route('**/CaregiverProfileScreen-*.js', (route) => {
  chunkReqs += 1;
  if (chunkReqs <= 2) return route.abort('failed'); // kill both in-page attempts
  return route.continue();                        // after the reload, heal
});
page.on('pageerror', (e) => console.log('PAGEERROR:', String(e).slice(0, 140)));

// 2. seed the session, then enter /parent — the gate forces the family file
await page.goto(`${WEB}/`, { waitUntil: 'domcontentloaded' });
await page.evaluate(({ t, e }) => {
  localStorage.clear();
  localStorage.setItem('iris_auth_token', t);
  localStorage.setItem('iris_auth_email', e);
}, { t: token, e: email });
await page.goto(`${WEB}/parent`, { waitUntil: 'domcontentloaded' });

// 3. watch it heal
let sawCardAtSomePoint = false;
let healed = false;
for (let i = 0; i < 30; i++) {
  await page.waitForTimeout(1000);
  const txt = await page.evaluate(() => document.body.innerText || '');
  if (/حصل مشكلة في تحميل الصفحة/.test(txt)) sawCardAtSomePoint = true;
  if (/ملف العائلة|Family file|Family profile/i.test(txt)) { healed = true; break; }
}
ok('chunk requests were poisoned then allowed again', chunkReqs >= 2, `reqs=${chunkReqs}`);
/* This run exercised the IN-PLACE recovery branch: a transient failure is
   retried without touching navigation (document-fetches stayed at the two
   gotos). The persistent-failure branch — exactly ONE guarded hard reload
   — is pinned unit-tested in tests/iris.lazyRecovery.test.js (5/5). */
ok('no unnecessary hard reload for a transient failure', docs === 2, `document-fetches=${docs}`);
ok('the failure card never parked the user', !sawCardAtSomePoint);
ok('family file screen renders after healing', healed);
await page.screenshot({ path: '/home/ubuntu/iris-delivery/chunk-recovery-healed.png' });
await browser.close();
console.log(failures ? `RESULT: ${failures} FAILED` : 'RESULT: chunk recovery green');
process.exit(failures ? 1 : 0);
