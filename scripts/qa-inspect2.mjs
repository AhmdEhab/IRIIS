/* inspect forced-caregiver DOM to build a reliable auto-player */
import { chromium } from 'playwright';
const WEB = 'http://127.0.0.1:5173', API = 'http://127.0.0.1:5000/api';
const J = async (m, u, b, t) => {
  const res = await fetch(u, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) }, body: b ? JSON.stringify(b) : undefined });
  let d = null; try { d = await res.json(); } catch { /* */ }
  return { status: res.status, data: d };
};
const rnd = () => Math.random().toString(36).slice(2, 7);

const email = `insp${rnd()}@qa.test`;
const r = await J('POST', `${API}/register`, { email, password: 'Passw0rd1', name: 'Insp Kid', age: 5, condition: 'other', consent_mvp_use: true });
const token = r.data.token;
const dev = r.data.verification?.devCode;
if (dev) await J('POST', `${API}/verify/confirm`, { code: dev }, token);

const browser = await chromium.launch({ executablePath: '/usr/bin/chromium' });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
await page.goto(`${WEB}/`, { waitUntil: 'domcontentloaded' });
await page.evaluate(({ t, e }) => {
  localStorage.clear();
  localStorage.setItem('iris_auth_token', t);
  localStorage.setItem('iris_auth_email', e);
}, { t: token, e: email });
await page.goto(`${WEB}/parent`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2200);

const dump = async (label) => {
  const info = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'))
      .filter((b) => { const r = b.getBoundingClientRect(); return r.width > 10 && r.height > 10; })
      .map((b) => ({
        t: (b.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 32),
        cls: (b.className || '').slice(0, 60),
        disabled: b.disabled,
      }));
    const heads = Array.from(document.querySelectorAll('h1,h2,h3')).map((h) => h.innerText.trim().slice(0, 50)).slice(0, 4);
    return { url: location.pathname, heads, btns: btns.slice(0, 18) };
  });
  console.log(`--- ${label} ---`);
  console.log(JSON.stringify(info, null, 1).slice(0, 1400));
};
await dump('intro');

await page.evaluate(() => {
  const b = Array.from(document.querySelectorAll('button')).find((x) => /يبدأ/.test(x.innerText || ''));
  if (b) b.click();
});
await page.waitForTimeout(1000);
await dump('after-start');

await page.evaluate(() => {
  const b = Array.from(document.querySelectorAll('button')).find((x) => (x.innerText || '').trim() === 'التالي');
  if (b) b.click();
});
await page.waitForTimeout(1000);
await dump('after-next');

// try selecting an option by various common selectors to see which exist
const probe = await page.evaluate(() => {
  const sels = ['.cp-opt', '.cp-choice', '.cp-card button', '[role="radio"]', 'main button', '[class*="option"]'];
  const out = {};
  for (const s of sels) out[s] = document.querySelectorAll(s).length;
  const all = Array.from(document.querySelectorAll('button')).map((b) => ({ t: (b.innerText || '').trim().slice(0, 24), cls: (b.className || '').slice(0, 40) }));
  return { out, all: all.slice(0, 20) };
});
console.log('SELECTOR PROBE:', JSON.stringify(probe, null, 1));

await page.screenshot({ path: '/home/ubuntu/iris-delivery/family-flow/inspect-flow.png' });
await browser.close();
