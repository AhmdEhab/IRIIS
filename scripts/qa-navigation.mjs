/* ── qa-navigation.mjs ── P59 navigation-overhaul walk (history, deep links,
   guards, forced-gate chrome, calm exits). Local stack: 5173 vite + 5000 API
   with VERIFY_DEV_CODES=true. Mirrors qa-cv2-flow.mjs helpers. */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
const WEB = process.env.QA_ORIGIN || 'http://127.0.0.1:5173';
const API = process.env.QA_API || 'http://127.0.0.1:5000/api';
const OUT = '/home/ubuntu/iris-delivery/navigation';
mkdirSync(OUT, { recursive: true });
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`  ok  ${name}`); }
  else { fail++; console.log(`FAIL  ${name} ${extra}`); }
};
const J = async (method, url, body, token) => {
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let data = null; try { data = await res.json(); } catch { /* */ }
  return { status: res.status, data };
};
const rnd = () => Math.random().toString(36).slice(2, 8);
const path = (page) => new URL(page.url()).pathname;
const settle = async (page) => { await page.waitForTimeout(700); };

const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

/* ══ A. signed-out routing ═══════════════════════════════════════════════ */
console.log('— A. signed-out');
await page.goto(`${WEB}/`, { waitUntil: 'networkidle' });
ok('landing at /', path(page) === '/');
await page.getByRole('button', { name: /دخول|Log in|Login/i }).first().click();
await settle(page);
ok('login CTA → /login', path(page) === '/login', path(page));
await page.goBack();
await settle(page);
ok('back → / (real history now)', path(page) === '/', path(page));
ok('back landed on landing (no login form)', !(await page.locator('input[type=password]').count()));
await page.goForward();
await settle(page);
ok('forward → /login again', path(page) === '/login' && (await page.locator('input[type=password]').count()) > 0, path(page));
await page.goto(`${WEB}/register`, { waitUntil: 'networkidle' });
ok('deep link /register stays (public)', path(page) === '/register', path(page));
await page.goto(`${WEB}/play/letters`, { waitUntil: 'networkidle' });
await settle(page);
ok('deep link /play/letters signed-out → /login', path(page) === '/login', path(page));
await page.goto(`${WEB}/caregiver`, { waitUntil: 'networkidle' });
await settle(page);
ok('deep link /caregiver signed-out → /login', path(page) === '/login', path(page));
await page.goto(`${WEB}/totally-unknown-route`, { waitUntil: 'networkidle' });
await settle(page);
ok('unknown path rewrites to /', path(page) === '/', path(page));
await page.screenshot({ path: `${OUT}/01-signedout.png` });

/* ══ B. onboarded family (API shortcut, same stub style as cv2 QA) ═══════ */
console.log('— B. family setup');
const email = `nav-${rnd()}@example.com`;
const r = await J('POST', `${API}/register`, { email, password: 'Passw0rd1', name: 'Nav QA Kid', age: 5, condition: 'other', consent_mvp_use: true });
ok('register 201', r.status === 201 && !!r.data.token, JSON.stringify(r.data || {}).slice(0, 120));
const token = r.data.token; const kid = r.data.child?.id;
const devCode = r.data.verification?.devCode || r.data.devCode || r.data.code;
if (devCode) await J('POST', `${API}/verify/confirm`, { code: devCode }, token);
const scoredStub = { bankVersion: 'cv2', completeness: { coreAnswered: 13, coreTotal: 13, followUpsAnswered: 2 }, domainStates: { C: { state: 'emerging', confidence: 'MEDIUM' }, L: { state: 'developing', confidence: 'MEDIUM' }, S: { state: 'emerging', confidence: 'MEDIUM' }, M: { state: 'independent', confidence: 'LOW' }, P: { state: 'developing', confidence: 'MEDIUM' }, H: { state: 'steady', confidence: 'MEDIUM' } }, accessSettings: [], interests: ['عجلات'], plans: [], careFlags: [], guidanceNotes: [] };
const stubCg = await J('POST', `${API}/assessments`, { childId: kid, assessment_kind: 'CAREGIVER', clientRef: `nav-cg-${rnd()}`, item_results: { responses: { VQ1: 'a', VQ2: 'b' }, scored: scoredStub } }, token);
const stubLd = await J('POST', `${API}/assessments`, { childId: kid, assessment_kind: 'LADDER', clientRef: `nav-ld-${rnd()}`, item_results: { stub: true, items: [] } }, token);
ok('caregiver stub accepted', stubCg.status === 200 || stubCg.status === 201, JSON.stringify(stubCg.data || {}).slice(0, 90));
ok('ladder stub accepted', stubLd.status === 200 || stubLd.status === 201, JSON.stringify(stubLd.data || {}).slice(0, 90));

await page.goto(`${WEB}/login`, { waitUntil: 'networkidle' });
await page.evaluate(({ t, e }) => { localStorage.clear(); localStorage.setItem('iris_auth_token', t); localStorage.setItem('iris_auth_email', e); }, { t: token, e: email });
await page.goto(`${WEB}/parent`, { waitUntil: 'networkidle' });
await settle(page); await settle(page);
ok('hub reachable after onboarding', path(page) === '/parent' && (await page.locator('text=/وضع الطفل|Child Mode/i').count()) > 0, path(page));

/* ══ C. in-app deep links + history ═════════════════════════════════════ */
console.log('— C. child mode history');
await page.getByRole('button', { name: /وضع الطفل|Child Mode/i }).first().click();
await settle(page);
ok('enter child mode → /play', path(page) === '/play', path(page));
await page.locator('button:has-text("حروف"), button:has-text("Letters")').first().click();
await settle(page);
ok('letters tile → /play/letters', path(page) === '/play/letters', path(page));
await page.goBack();
await settle(page);
ok('back → /play', path(page) === '/play', path(page));
await page.goto(`${WEB}/play/colors`, { waitUntil: 'networkidle' });
await settle(page);
ok('deep link /play/colors while signed in', path(page) === '/play/colors', path(page));
await page.reload({ waitUntil: 'networkidle' });
await settle(page);
ok('F5 keeps /play/colors', path(page) === '/play/colors', path(page));
await page.screenshot({ path: `${OUT}/02-colors-deep.png` });
await page.goBack();
await settle(page);
ok('back from colors → /play (pre-reload entry)', path(page) === '/play' || path(page) === '/parent', path(page));

/* ══ D. grown-up exit gate on child-mode leave ══════════════════════════ */
console.log('— D. parent gate');
await page.goto(`${WEB}/play`, { waitUntil: 'networkidle' });
await settle(page);
const exitBtn = page.locator('.lc-header button:has-text("العودة"), .lc-header button:has-text("Back")').first();
if (await exitBtn.count()) {
  await exitBtn.click();
} else {
  await page.locator('button:has-text("العودة"), button:has-text("Back")').first().click();
}
await settle(page);
const gate = page.locator('[role=dialog]', { hasText: /للكبار|grown-ups/i });
ok('gate dialog opens', await gate.count() > 0);
await gate.getByRole('button', { name: /دخول ولي الأمر|Parent sign-in/i }).click();
await settle(page);
const numText = await gate.innerText();
const m = numText.match(/(\d{3})/);
ok('confirmation number shown', !!m, numText.slice(0, 120).replace(/\n/g, ' '));
if (m) {
  await page.locator('input[inputmode=numeric], input[type=text][aria-label*="رقم"], input[aria-label*="confirmation"]').first().fill(m[1]);
  await gate.getByRole('button', { name: /تأكيد|Confirm/i }).last().click();
  await settle(page);
  ok('gate pass → /parent', path(page) === '/parent', path(page));
}
await page.screenshot({ path: `${OUT}/03-hub.png` });

/* ══ E. retired legacy route + settings save feedback ═══════════════════ */
console.log('— E. legacy + settings');
await page.goto(`${WEB}/settings`, { waitUntil: 'networkidle' });
await settle(page);
ok('deep link /settings works', path(page) === '/settings', path(page));
await page.getByRole('button', { name: /حفظ|Save/i }).first().click();
await settle(page);
ok('save chip appears', (await page.locator('text=/تم الحفظ|Saved/i').count()) > 0);
await page.screenshot({ path: `${OUT}/04-settings.png` });

/* ══ F. logout replays guards, not stale screens ════════════════════════ */
console.log('— F. logout');
await page.goto(`${WEB}/parent`, { waitUntil: 'domcontentloaded' });
await settle(page); await settle(page);
const lo = page.getByRole('button', { name: /^(خروج|Log out)$/i }).first();
ok('logout control on hub', await lo.count() > 0);
if (await lo.count()) { await lo.click(); await settle(page); }
ok('signed out after logout', !await page.evaluate(() => localStorage.getItem('iris_auth_token')));
await page.goBack();
await settle(page);
ok('back after logout cannot replay app', ['/login', '/'].includes(path(page)), path(page));

console.log(`RESULT ${pass} pass / ${fail} fail`);
await browser.close();
process.exit(fail ? 1 : 0);
