/* one-shot DOM inspector for the caregiver screen (labels + disabled states) */
import { chromium } from 'playwright';
const WEB = 'http://127.0.0.1:5173', API = 'http://127.0.0.1:5000/api';
const J = async (m, u, b, t) => {
  const res = await fetch(u, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) }, body: b ? JSON.stringify(b) : undefined });
  let d = null; try { d = await res.json(); } catch { }
  return d;
};
const email = `insp${Math.random().toString(36).slice(2, 7)}@qa.test`;
const reg = await J('POST', `${API}/register`, { email, password: 'Passw0rd1', name: 'Insp Kid', age: 5, condition: 'other', consent_mvp_use: true });
if (reg.verification?.devCode) await J('POST', `${API}/verify/confirm`, { code: reg.verification.devCode }, reg.token);

const b = await chromium.launch({ executablePath: '/usr/bin/chromium' });
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
await page.goto(`${WEB}/`, { waitUntil: 'domcontentloaded' });
await page.evaluate(({ t, e }) => { localStorage.clear(); localStorage.setItem('iris_auth_token', t); localStorage.setItem('iris_auth_email', e); }, { t: reg.token, e: email });
await page.goto(`${WEB}/parent`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);

const dump = async (tag) => console.log(tag, JSON.stringify(await page.evaluate(() => ({
  path: location.pathname,
  pct: (document.body.innerText.match(/\d+%/) || [''])[0],
  starts: Array.from(document.querySelectorAll('button'))
    .filter((x) => /يبدأ|ابدأ|نبدأ|Start|يلا/.test(x.innerText || ''))
    .map((x) => ({ t: x.innerText.trim().slice(0, 22), dis: x.disabled, cls: (x.className || '').slice(0, 60) })),
  opts: Array.from(document.querySelectorAll('button, [role="radio"], [role="button"]'))
    .filter((x) => (x.innerText || '').trim().length > 0 && (x.className || '').match(/cp-/))
    .slice(0, 8)
    .map((x) => ({ tag: x.tagName, t: x.innerText.trim().slice(0, 30), cls: (x.className || '').slice(0, 70) })),
}))));
await dump('BEFORE-START:');
const clicked = await page.evaluate(() => {
  const btns = Array.from(document.querySelectorAll('button')).filter((x) => /يبدأ|يلا|Start/.test(x.innerText || '') && !x.disabled);
  const el = btns[0]; if (el) { el.click(); return el.className; } return null;
});
console.log('clicked start:', clicked);
await page.waitForTimeout(900);
await dump('AFTER-START:');
await page.screenshot({ path: '/home/ubuntu/iris-delivery/family-flow/inspect-after-start.png' });
await b.close();
