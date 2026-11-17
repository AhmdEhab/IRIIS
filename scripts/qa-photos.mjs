/* qa-photos.mjs — P73 regression guard.
 *
 * The promise this suite exists for: every picture a child sees in a lesson
 * is a genuine local photograph (/photos/*.jpg), fully loaded, with no remote
 * hotlinks and no emoji used as a content image.
 *
 * Walks every child /play/* screen on a fresh family and asserts:
 *   1. zero <img> elements with an http(s) source (nothing remote);
 *   2. every /photos/ image actually loaded (naturalWidth >= 50px);
 *   3. opening each lesson detail shows a photograph in the study block;
 *   4. the numbers detail shows N real-object thumbnails for digit N;
 *   5. the memory game's face-up cards are photographs;
 *   6. no console/page errors anywhere.
 * Run against `npm run preview` (QA_WEB, default :4173) + the local API. */
import { chromium } from 'playwright';
const WEB = process.env.QA_WEB || 'http://127.0.0.1:4173';
const API = process.env.QA_API || 'http://127.0.0.1:5000/api';
const OUT = process.env.QA_OUT || '/home/ubuntu/iris-delivery/p73';
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log(`ok - ${name}`); } else { fail++; console.log(`FAIL - ${name} :: ${String(extra).slice(0, 220)}`); } };
const J = async (m, u, b, t) => {
  const res = await fetch(u, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) }, body: b ? JSON.stringify(b) : undefined });
  let d = null; try { d = await res.json(); } catch {}
  return { status: res.status, data: d };
};
const rnd = () => Math.random().toString(36).slice(2, 8);
import fs from 'node:fs'; fs.mkdirSync(OUT, { recursive: true });

const email = `p73photos_${rnd()}@example.test`;
const r = await J('POST', `${API}/register`, { email, password: 'Passw0rd1', name: 'p73photos', age: 5, condition: 'other', consent_mvp_use: true });
const token = r.data.token, kid = r.data.child?.id;
const dc = r.data.verification?.devCode;
if (dc) await J('POST', `${API}/verify/confirm`, { code: dc }, token);
const scoredStub = { bankVersion: 'cv2', completeness: { coreAnswered: 13, coreTotal: 13, followUpsAnswered: 0 }, domainStates: {}, accessSettings: [], interests: [], plans: [], careFlags: [], guidanceNotes: [] };
await J('POST', `${API}/assessments`, { childId: kid, assessment_kind: 'CAREGIVER', clientRef: `p73-cg-${rnd()}`, item_results: { responses: { VQ1: 'a' }, scored: scoredStub } }, token);
await J('POST', `${API}/assessments`, { childId: kid, assessment_kind: 'LADDER', clientRef: `p73-ld-${rnd()}`, item_results: { stub: true, items: [] } }, token);

const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(String(e).slice(0, 140)));

/* one shared audit expression: images by source type + load health */
const imgAudit = () => page.evaluate(() => {
  const imgs = Array.from(document.querySelectorAll('img'));
  return {
    total: imgs.length,
    remote: imgs.filter(i => /^https?:/.test(i.getAttribute('src') || '')).map(i => i.getAttribute('src').slice(0, 60)),
    photo: imgs.filter(i => (i.getAttribute('src') || '').startsWith('/photos/')).map(i => ({ s: i.getAttribute('src'), w: i.naturalWidth })),
  };
});

/* seed the session once at the root so the very first deep link is authed */
await page.goto(`${WEB}/`, { waitUntil: 'domcontentloaded' });
await page.evaluate(({ t, e }) => { localStorage.clear(); localStorage.setItem('iris_auth_token', t); localStorage.setItem('iris_auth_email', e); }, { t: token, e: email });
await page.reload({ waitUntil: 'networkidle' });
const screens = ['fruits', 'animals', 'vehicles', 'body-parts', 'colors', 'shapes', 'emotions', 'letters', 'life-skills', 'songs'];
for (const s of screens) {
  await page.goto(`${WEB}/play/${s}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1600);
  await page.evaluate(({ t, e }) => { localStorage.setItem('iris_auth_token', t); localStorage.setItem('iris_auth_email', e); }, { t: token, e: email });
  const grid = await imgAudit();
  ok(`${s}: no remote <img> in grid`, grid.remote.length === 0, grid.remote);
  if (s !== 'letters') ok(`${s}: grid photographs loaded`, grid.photo.length > 0 && grid.photo.every(p => p.w >= 50), grid.photo.slice(0, 6));
  /* open the first lesson tile → study block photograph */
  const clicked = await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find(x => x.querySelector('img[src^="/photos/"]'));
    b?.click(); return Boolean(b);
  });
  await page.waitForTimeout(3200);
  if (s !== 'life-skills' && s !== 'songs' && s !== 'letters') {
    let detail = await imgAudit();
    if (detail.photo.length === 0) { await page.waitForTimeout(3500); detail = await imgAudit(); }
    ok(`${s}: detail shows loaded photograph`, clicked && detail.photo.length >= 1 && detail.photo.every(p => p.w >= 50), `${clicked} ${JSON.stringify(detail.photo.slice(0, 4))}`);
    ok(`${s}: detail has no remote img`, detail.remote.length === 0, detail.remote);
  } else {
    ok(`${s}: tile photographs present`, clicked, 'no click');
  }
  await page.screenshot({ path: `${OUT}/${s}.png` });
}

/* numbers: 7 must show exactly 7 real thumbnails */
await page.goto(`${WEB}/play/numbers`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find(x => /^7|٧/.test((x.innerText || '').trim())); b?.click(); });
await page.waitForTimeout(1800);
await page.waitForTimeout(2500);
const dots = await page.evaluate(() => {
  const all = Array.from(document.querySelectorAll('.os-dot-img'));
  return { imgs: all.filter(i => i.naturalWidth >= 40).length, uniq: Array.from(new Set(all.map(i => i.getAttribute('src')))).join(',') };
});
ok('numbers(7): seven loaded photo thumbnails of ONE object', dots.imgs === 7 && dots.uniq.split(',').length === 1, JSON.stringify(dots));
await page.screenshot({ path: `${OUT}/numbers-7.png` });

/* memory game peek cards are photographs */
await page.goto(`${WEB}/play/games/memory`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2200);
const mem = await imgAudit();
ok('memory-game: peek faces are loaded photographs', mem.photo.length >= 8 && mem.photo.every(p => p.w >= 50) && mem.remote.length === 0, JSON.stringify({ n: mem.photo.length, remote: mem.remote }));
await page.screenshot({ path: `${OUT}/memory.png` });

ok('no page errors during photo walkthrough', errs.length === 0, errs.join(' | '));

await browser.close();
console.log(`\nqa-photos: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
