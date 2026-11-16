/* P64 UX audit: walk BOTH assessments in the real UI across viewports,
 * screenshot every key state, and auto-report the four failure classes the
 * user named: overlapping text, notifications covering content, broken
 * progress bars, and horizontal clipping. Read-only — fixes come after. */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
const WEB = process.env.QA_ORIGIN || 'http://127.0.0.1:5173';
const API = process.env.QA_API || 'http://127.0.0.1:5000/api';
const OUT = '/home/ubuntu/iris-delivery/ux-audit';
mkdirSync(OUT, { recursive: true });
const J = async (m, u, b, t) => {
  const r = await fetch(u, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) }, body: b ? JSON.stringify(b) : undefined });
  let d = null; try { d = await r.json(); } catch { /* */ }
  return d;
};
const rnd = () => Math.random().toString(36).slice(2, 8);

/* one evaluate, four detectors — returns a list of terse issue strings */
const DIAG = () => {
  const issues = [];
  const vw = innerWidth, vh = innerHeight;
  /* 1. horizontal overflow */
  const de = document.documentElement;
  if (de.scrollWidth > vw + 2) issues.push(`HSCROLL page ${de.scrollWidth}>${vw}`);
  /* 2. clipped text (overflow hidden cutting its own content) */
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    if (el.closest('[data-allow-scroll]')) continue;
    const txt = (el.innerText || '').trim();
    if (!txt || el.children.length > 3) continue;
    const ox = el.scrollWidth - el.clientWidth, oy = el.scrollHeight - el.clientHeight;
    if ((ox > 3 && cs.overflowX === 'hidden') || (oy > 3 && cs.overflowY === 'hidden' && cs.height !== 'auto')) {
      issues.push(`CLIP .${(el.className.baseVal ?? el.className ?? el.tagName).toString().split(' ')[0]} "${txt.slice(0, 26)}" +${Math.max(ox, oy)}px`);
    }
  }
  /* 3. occluded interactive/heading centers (something painted on top) */
  const targets = document.querySelectorAll('button, h1, h2, h3, p, label, [role="radio"]');
  const seenZone = [];
  for (const el of targets) {
    const r = el.getBoundingClientRect();
    if (r.width < 24 || r.height < 16 || r.bottom < 0 || r.top > vh) continue;
    const cx = Math.round(r.left + r.width / 2), cy = Math.round(r.top + Math.min(r.height / 2, 22));
    const top = document.elementFromPoint(cx, cy);
    if (!top) continue;
    if (!(el.contains(top) || top.contains(el))) {
      const tc = (top.className.baseVal ?? top.className ?? top.tagName).toString().split(' ')[0];
      const ec = (el.className.baseVal ?? el.className ?? el.tagName).toString().split(' ')[0];
      const zone = `${cx},${cy}`;
      if (seenZone.some(([z, e2]) => e2 === ec && Math.hypot(...zone.split(',').map(Number).map((v, i) => v - z.split(',')[i])) < 60)) continue;
      seenZone.push([zone, ec]);
      issues.push(`OVERLAP <${ec}> covered by <${tc}> @${cx},${cy}`);
    }
    if (issues.length > 10) break;
  }
  /* 4. progress integrity */
  const fill = document.querySelector('.cp-track-fill');
  if (fill) {
    const w = fill.getBoundingClientRect().width, p = fill.parentElement.getBoundingClientRect().width;
    const label = document.querySelector('.cp-progress-meta')?.innerText || '';
    if (w > p + 2) issues.push(`PROGRESS fill ${Math.round(w)} > track ${Math.round(p)} (${label.replace(/\n/g, ' ')})`);
  }
  const fixed = [...document.querySelectorAll('body *')].filter((el) => {
    const cs = getComputedStyle(el);
    return (cs.position === 'fixed') && el.getBoundingClientRect().width > 0 && getComputedStyle(el).zIndex !== 'auto';
  }).map((el) => (el.className.baseVal ?? el.className ?? el.tagName).toString().split(' ')[0]);
  return { issues, fixed: [...new Set(fixed)].slice(0, 6) };
};

const run = async (vp, lang) => {
  const tag = `${vp}-${lang}`;
  const email = `uxa_${rnd()}@example.test`;
  const d = await J('POST', `${API}/register`, { email, password: 'Passw0rd1', name: 'UX Kid', age: 5, condition: 'other', consent_mvp_use: true });
  if (!d?.token) { console.log(`UX ${tag} REGISTER-FAIL`); return; }
  if (d.verification?.devCode) await J('POST', `${API}/verify/confirm`, { code: d.verification.devCode }, d.token);
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium' });
  const page = await (await browser.newContext({ viewport: { width: WIDTHS[vp][0], height: WIDTHS[vp][1], deviceScaleFactor: 1.5 } })).newPage();
  page.on('pageerror', (e) => console.log(`PAGEERROR ${tag}: ${String(e).slice(0, 160)}`));
  const report = async (step) => {
    const r = await page.evaluate(DIAG).catch((e) => ({ issues: ['DIAG-FAIL ' + String(e).slice(0, 80)], fixed: [] }));
    if (r.issues.length) console.log(`UX ${tag} [${step}]`);
    for (const i of r.issues) console.log(`   ! ${i}`);
    await page.screenshot({ path: `${OUT}/${tag}-${step}.png` }).catch(() => {});
  };
  const clickIf = async (re) => page.evaluate((s) => {
    const b = Array.from(document.querySelectorAll('button, a')).find((x) => new RegExp(s).test((x.innerText || '').trim()));
    if (b) { b.click(); return true; } return false;
  }, re.source);

  await page.goto(`${WEB}/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ t, e, l }) => { localStorage.clear(); localStorage.setItem('iris_auth_token', t); localStorage.setItem('iris_auth_email', e); localStorage.setItem('iris_lang', l); }, { t: d.token, e: email, l: lang === 'ar' ? 'ar' : 'en' });
  await page.goto(`${WEB}/parent`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2800);
  await report('c1-intro');
  await clickIf(/^(يبدأ|ابدأ|نبدأ|Start)/);
  await page.waitForTimeout(900);

  /* caregiver walk: capture a plain question, the chips (multi) question,
     the open-text question, block intro, care card, review, summary. */
  const captured = new Set();
  const progressTrack = [];
  for (let i = 0; i < 220; i++) {
    const st = await page.evaluate(() => ({
      opt: !!document.querySelector('button.cp-opt'), topt: !!document.querySelector('button.cp-topt'),
      chips: !!document.querySelector('.cp-chips button'), open: !!document.querySelector('textarea, .cp-textarea'),
      care: /خدنا بالك|We took this part/.test(document.body.innerText),
      review: /مراجعة سريعة|Quick review/.test(document.body.innerText),
      summary: /شكرًا|profile saved|تم حفظ|Strengths|نقاط قوة/i.test(document.body.innerText),
      block: !!document.querySelector('.cp-block-title') && !document.querySelector('.cp-opt, .cp-topt, .cp-chips button, textarea'),
      prog: document.querySelector('.cp-progress-meta')?.innerText?.replace(/\n/g, ' ') || '',
      fill: document.querySelector('.cp-track-fill')?.getBoundingClientRect?.().width ?? -1,
    }));
    progressTrack.push(`${st.prog}|${Math.round(st.fill)}`);
    let kind = null;
    if (st.care) kind = 'c6-care';
    else if (st.review) kind = 'c7-review';
    else if (st.summary) kind = 'c8-summary';
    else if (st.chips) kind = 'c4-chips';
    else if (st.open) kind = 'c5-open';
    else if (st.block) kind = 'c2-block';
    else if (st.opt) kind = 'c3-question';
    if (kind && !captured.has(kind)) { captured.add(kind); await report(kind); }
    if (st.review) { await clickIf(/أرسل الملف|Submit the profile/); await page.waitForTimeout(2200); await report('c9-saved'); break; }
    if (st.care) { await clickIf(/تمام، نكمّل|Okay, continue/); await page.waitForTimeout(500); continue; }
    /* answer: prefer a self-harm chip on VQ8 to force the care card; else first option */
    await page.evaluate(() => {
      const chips = Array.from(document.querySelectorAll('.cp-chips button'));
      const want = chips.find((c) => /يؤذي|تؤذي|hurt/.test(c.innerText));
      if (want && !want.getAttribute('aria-checked')?.includes('true') && !want.className.includes('on')) { want.click(); return; }
      if (chips.length) { chips[0].click(); return; }
      const b = document.querySelector('button.cp-opt, button.cp-topt');
      if (b) b.click();
      const ta = document.querySelector('textarea');
      if (ta) { ta.value = 'حيوانات'; ta.dispatchEvent(new Event('input', { bubbles: true })); }
    });
    await page.waitForTimeout(260);
    if (!(await clickIf(/^(التالي|Next|خلصت|Done)$/))) await page.evaluate(() => { const b = document.querySelector('button.cp-opt, button.cp-topt, .cp-chips button'); if (b) b.click(); });
    await page.waitForTimeout(420);
    const fin = await page.evaluate(() => /يلا نبدأ|برافو|Let's start/.test(document.body.innerText) && !document.querySelector('.cp-progress'));
    if (fin) break;
  }
  console.log(`UX ${tag} progress-trace: ${[...new Set(progressTrack)].join(' → ').slice(0, 400)}`);

  /* ── ladder (child) side ── */
  await clickIf(/يلا نبدأ|Let's start|نبدأ اللعب/);
  await page.waitForTimeout(1600);
  await page.goto(`${WEB}/assessment`, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await page.waitForTimeout(1800);
  await report('a1-intro');
  await clickIf(/يلا نبدأ|ابدأ|Start|هنلعب/);
  await page.waitForTimeout(1500);
  const seenA = new Set();
  for (let i = 0; i < 160; i++) {
    const st = await page.evaluate(() => ({
      done: /برافو عليك|Well done/.test(document.body.innerText),
      results: /الخطة|first plan|See the first plan/i.test(document.body.innerText),
      intro: /هنلعب شوية ألعاب|short games/.test(document.body.innerText) && !document.querySelector('.ps-progress'),
      chip: !!document.querySelector('.ps-skill-chip'),
      prog: document.querySelector('.ps-progress')?.innerText?.replace(/\n/g, ' ') || '',
    }));
    if (st.intro && !seenA.has('a1-intro')) { seenA.add('a1-intro'); await clickIf(/يلا نبدأ|ابدأ|Start/); await page.waitForTimeout(1400); continue; }
    let kind = null;
    if (st.done && st.results) kind = 'a6-results';
    else if (st.done) kind = 'a5-done';
    else if (st.chip) kind = 'a4-newgame';
    else if (st.prog) kind = 'a2-item';
    if (kind && !seenA.has(kind)) { seenA.add(kind); await report(kind); }
    if (kind === 'a6-results') break;
    await page.evaluate(() => {
      const plate = document.querySelector('.ps-scope, .lc-root, main');
      const scope = plate || document.body;
      const bs = Array.from(scope.querySelectorAll('button')).filter((b) => {
        const r = b.getBoundingClientRect(); const t = (b.innerText || '').trim();
        return r.width > 40 && r.height > 30 && !/رجوع|Reg|إكمال لاحقًا|خروج|EN|عربي|Break|استراحة|Settings|🔊/.test(t);
      });
      if (bs.length) bs[Math.floor(Math.random() * bs.length)].click();
    });
    await page.waitForTimeout(760);
  }
  await browser.close();
};

const WIDTHS = { mobile: [390, 844], tablet: [820, 1180], desktop: [1440, 900] };
for (const vp of Object.keys(WIDTHS)) {
  await run(vp, 'ar');
  await run(vp, 'en');
}
console.log('UXAUDITDONE');
