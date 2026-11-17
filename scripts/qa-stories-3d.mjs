/* qa-stories-3d.mjs — P72 regression guard.
 *
 * The bug this suite exists for: `.lc-root svg { width:22px }` (the lucide icon
 * normaliser) collapsed EVERY svg inside child mode — story scenes became a
 * 26px sliver and the story-picker covers shrank to stamps, because utility
 * classes like w-28 lose the specificity battle. A second P72 bug lived in
 * Object3DViewer: fitted GLB models floated mid-frame above a huge grey disc.
 *
 * This suite asserts, on a real fresh family:
 *   1. the story picker renders cover art svgs >= 80px wide;
 *   2. the story stage renders its scene svg >= 500px wide (the stage itself);
 *   3. a fruit detail 3D canvas renders >= 300px on both axes.
 * Run against vite dev (QA_WEB) or any deployed alias. */
import { chromium } from 'playwright';
const WEB = process.env.QA_WEB || 'http://127.0.0.1:5173';
const API = process.env.QA_API || 'http://127.0.0.1:5000/api';
const OUT = process.env.QA_OUT || '/home/ubuntu/iris-delivery/p72-reg';
let pass = 0, fail = 0;
const ok = (name, cond, extra) => { if (cond) { pass++; console.log(`ok - ${name}`); } else { fail++; console.log(`FAIL - ${name} :: ${String(extra).slice(0, 160)}`); } };
const J = async (m, u, b, t) => {
  const res = await fetch(u, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) }, body: b ? JSON.stringify(b) : undefined });
  let d = null; try { d = await res.json(); } catch {}
  return { status: res.status, data: d };
};
const rnd = () => Math.random().toString(36).slice(2, 8);

/* fresh family with both assessments on record */
const email = `p72reg_${rnd()}@example.test`;
const r = await J('POST', `${API}/register`, { email, password: 'Passw0rd1', name: 'p72reg', age: 5, condition: 'other', consent_mvp_use: true });
const token = r.data.token, kid = r.data.child?.id;
const dc = r.data.verification?.devCode;
if (dc) await J('POST', `${API}/verify/confirm`, { code: dc }, token);
const scoredStub = { bankVersion: 'cv2', completeness: { coreAnswered: 13, coreTotal: 13, followUpsAnswered: 0 }, domainStates: {}, accessSettings: [], interests: [], plans: [], careFlags: [], guidanceNotes: [] };
await J('POST', `${API}/assessments`, { childId: kid, assessment_kind: 'CAREGIVER', clientRef: `p72reg-cg-${rnd()}`, item_results: { responses: { VQ1: 'a' }, scored: scoredStub } }, token);
await J('POST', `${API}/assessments`, { childId: kid, assessment_kind: 'LADDER', clientRef: `p72reg-ld-${rnd()}`, item_results: { stub: true, items: [] } }, token);

const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(String(e).slice(0, 120)));
await page.goto(`${WEB}/`, { waitUntil: 'domcontentloaded' });
await page.evaluate(({ t, e }) => { localStorage.clear(); localStorage.setItem('iris_auth_token', t); localStorage.setItem('iris_auth_email', e); }, { t: token, e: email });

/* 1. story picker covers */
await page.goto(`${WEB}/play/stories`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1800);
const covers = await page.evaluate(() => Array.from(document.querySelectorAll('button svg')).map((s) => Math.round(s.getBoundingClientRect().width)).filter((w) => w > 0));
ok('story picker cover art renders full size (>=80px)', Math.max(...covers, 0) >= 80, `widths: ${covers.slice(0, 8)}`);
await page.screenshot({ path: `${OUT}/picker.png` });

/* 2. story stage */
await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /بندق|Bandaq|أرنب/.test(x.innerText || '')); b?.click(); });
await page.waitForTimeout(2400);
const stage = await page.evaluate(() => { const svg = document.querySelector('.iris-child [role="img"] svg'); const b = svg?.getBoundingClientRect(); return b ? { w: Math.round(b.width), h: Math.round(b.height) } : null; });
ok('story scene stage is a real stage (>=500px wide, >=300 tall)', !!stage && stage.w >= 500 && stage.h >= 300, JSON.stringify(stage));
await page.screenshot({ path: `${OUT}/scene.png` });

/* 3. 3D detail canvas */
await page.goto(`${WEB}/play/fruits`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /تفاحة|Apple/.test(x.innerText || '')); b?.click(); });
await page.waitForTimeout(9000);
const canvas = await page.evaluate(() => { const c = document.querySelector('.os-3d canvas, canvas'); const b = c?.getBoundingClientRect(); return b ? { w: Math.round(b.width), h: Math.round(b.height) } : null; });
ok('3D study canvas renders at a usable size (>=300px both axes)', !!canvas && canvas.w >= 300 && canvas.h >= 300, JSON.stringify(canvas));
await page.screenshot({ path: `${OUT}/3d.png` });
ok('no page errors during story/3D walk', errs.length === 0, errs.join(' | '));
await browser.close();
console.log(`RESULT p72-reg: ${pass} pass / ${fail} fail`);
process.exit(fail ? 1 : 0);
