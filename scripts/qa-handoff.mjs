/* P62c qa-handoff: parent-file→child-assessment handoff, persistence without
   the CTA, no zombie drafts, clientRef idempotency. Local stack required. */
import { chromium } from 'playwright';
const WEB = process.env.QA_ORIGIN || 'http://127.0.0.1:5173';
const API = process.env.QA_API || 'http://127.0.0.1:5000/api';
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`  ok  ${name}`); }
  else { fail++; console.log(`FAIL  ${name} ${extra}`); }
};
const J = async (method, url, body, token) => {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null; try { data = await res.json(); } catch { /* non-json */ }
  return { status: res.status, data };
};
const rnd = () => Math.random().toString(36).slice(2, 8);
async function playLadder(page, { max = 480 } = {}) {
  let lastQ = '', attempt = 0, clicks = 0, sawChip = false, hubBounces = 0;
  const skipRe = /^(السابق|التالي|Next|Previous|EN|عربي|English|🔊)$/;
  for (let i = 0; i < max; i++) {
    const st = await page.evaluate(() => {
      const body = document.body.innerText || '';
      return {
        done: /برافو عليك|Well done|يلا نشوف الخطة|See the first plan/i.test(body),
        results: /يلا نشوف الخطة|See the first plan/.test(body),
        chip: !!document.querySelector('.ps-skill-chip'),
        q: (body.match(/\d+\s*\/\s*\d+|سؤال \d+|item \d+/i) || [''])[0],
      };
    });
    if (st.chip) sawChip = true;
    if (st.done) return { clicks, done: true, sawChip, onResults: st.results };
    const same = st.q && st.q === lastQ;
    if (same) attempt++; else attempt = 0;
    if (!st.q) attempt++;
    if (st.q) lastQ = st.q;
    /* P62 guard: the random-click walker may still land on a parent chrome
       screen (settings/hub). Detect and bounce back to the ladder route
       instead of burning the whole iteration budget there. */
    const drifted = await page.evaluate(() => {
      const body = document.body.innerText || '';
      return /الراحة والحساسية|اختيارك هنا بيلغي/.test(body) ? 'settings'
        : /وضع الوالدين|لوحة الوالدين|خطة الأسبوع/.test(body) ? 'hub' : null;
    });
    if (drifted === 'settings') {
      await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button, a')).find((x) => /^(رجوع|Back)/.test((x.innerText || '').trim()));
        if (b) b.click();
      });
      await page.waitForTimeout(800);
      await page.goto(`${WEB}/assessment`, { waitUntil: 'domcontentloaded' }).catch(() => {});
      await page.waitForTimeout(900);
      continue;
    }
    if (drifted === 'hub') {
      /* Hub mid-run is a DRIFT, not an end (its plan tile says خطة الأسبوع and
         used to fool the done detector). Bounce back to the assessment route
         once; a second hub appearance is a genuine early exit. */
      hubBounces = (hubBounces || 0) + 1;
      if (hubBounces > 1) return { clicks, done: false, sawChip, driftedHub: true };
      await page.goto(`${WEB}/assessment`, { waitUntil: 'domcontentloaded' }).catch(() => {});
      await page.waitForTimeout(1200);
      continue;
    }
    const overlayHit = await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find((x) =>
        /يلا نكمّل|Keep going|نرجع للعبة|أكمّل|Resume|Continue|يلا نرجع|نرجع نلعب|Back to the game|نكمل بحاجة تانية/.test((x.innerText || '').trim()));
      if (b && !b.disabled) { b.click(); return (b.innerText || '').trim().slice(0, 22); }
      return null;
    });
    if (overlayHit) { await page.waitForTimeout(900); continue; }
    if (i % 60 === 0) console.log('   ladder@' + i, await page.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 120)));
    const tapHandled = await page.evaluate(() => {
      const grid = document.querySelector('[data-response="tap-each"]');
      if (!grid) return false;
      const txt = (document.querySelector('h2')?.innerText || '') + ' ' + (document.body.innerText || '');
      const arD = { '٠': 0, '١': 1, '٢': 2, '٣': 3, '٤': 4, '٥': 5, '٦': 6, '٧': 7, '٨': 8, '٩': 9 };
      const m = txt.match(/هاتلي\s*([٠-٩0-9])|give me\s*(\d)/i);
      let need = 1;
      if (m) { const d = m[1] || m[2]; need = (arD[d] != null ? arD[d] : parseInt(d, 10)) || 1; }
      const tiles = Array.from(grid.querySelectorAll('button'));
      tiles.forEach((b, i2) => {
        const on = b.getAttribute('aria-pressed') === 'true';
        const want = i2 < need;
        if (on !== want && !b.disabled) b.click();
      });
      const done = Array.from(document.querySelectorAll('button')).find((x) => /خلصت|I'm done/.test(x.innerText || ''));
      if (done && !done.disabled) setTimeout(() => done.click(), 200);
      return true;
    });
    if (tapHandled) { clicks++; attempt = 0; lastQ = ''; await page.waitForTimeout(1350); continue; }
    if (attempt > 12) {
      // count-tap style item: confirm with its accept button
      await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button')).find((x) => /تمام|خلصت|أؤيد|Confirm|أكد/.test((x.innerText || '').trim()));
        if (b) b.click();
      });
      await page.waitForTimeout(260);
      if (attempt > 24) return { clicks, done: false, stuckAt: st.q };
      attempt = 13;
    }
    await page.evaluate(({ skipSrc, pick }) => {
      const skip = new RegExp(skipSrc);
      const scope = document.querySelector('.ps-plate');
      if (!scope) {
        /* No assessment plate on screen (a plate we do not know, a transition,
           or an unhandled overlay). Spraying clicks here is exactly what used
           to walk the robot out of the session into the hub — confirm the
           done-plate if it is present, otherwise do nothing this round. */
        const b2 = Array.from(document.querySelectorAll('button')).find((x) => /^(تمام|Done|يلا نبدأ)/.test((x.innerText || '').trim()));
        if (b2) b2.click();
        return;
      }
      const btns = Array.from(scope.querySelectorAll('button, [role="radio"], [role="button"]'))
        .filter((b) => {
          const t = (b.innerText || '').trim().replace(/\s+/g, ' ');
          if (!t || skip.test(t)) return false;
          if (/حفظ|Save|خروج|رجوع|بريك|Break|🔊|✋|☕|⚙|English|عربي/.test(t)) return false;
          const al = (b.getAttribute('aria-label') || '') + ' ' + (b.title || '');
          if (/إعدادات|Settings|خروج|break|مساعد|helper/i.test(al)) return false;
          if (b.closest('header')) return false;
          const r = b.getBoundingClientRect();
          return r.width > 30 && r.height > 30;
        });
      if (btns.length) btns[pick % btns.length].click();
    }, { skipSrc: skipRe.source, pick: 11 + i });
    clicks++;
    await page.waitForTimeout(320); // ladder feedback sounds/animations
  }
  return { clicks, done: false, stuckAt: 'cap' };
}
async function playQuestionnaire(page, { max = 420 } = {}) {
  let lastQ = '', attempt = 0, clicks = 0, sawChip = false, hubBounces = 0;
  for (let i = 0; i < max; i++) {
    const st = await page.evaluate(() => {
      const body = document.body.innerText || '';
      const q = (body.match(/سؤال \d+ من \d+|Question \d+ of \d+/i) || [''])[0];
      const review = /مراجعة سريعة|Quick review/.test(body);
      const opts = Array.from(document.querySelectorAll('button.cp-opt, button.cp-topt, .cp-chips button[role="radio"], button.cp-met'))
        .filter((b) => { const r = b.getBoundingClientRect(); return r.height > 12 && !b.closest('header'); });
      return { q, review, optCount: opts.length, pct: (body.match(/(\d+)%/) || [])[1] || '0' };
    });
    if (st.review) {
      const submitted = await page.evaluate(() => {
        const b = document.querySelector('button.cp-cta--finish')
          || Array.from(document.querySelectorAll('button')).find((x) => /أرسل الملف|Submit the profile/.test((x.innerText || '').trim()));
        if (b) { b.click(); return true; } return false;
      });
      if (submitted) return { clicks, submitted: true };
    }
    if (st.q && st.q === lastQ) attempt++; else { attempt = 0; if (st.q) lastQ = st.q; }
    if (attempt > 10) return { clicks, submitted: false, stuckAt: st.q, pct: st.pct };
    if (st.optCount > 0) {
      await page.evaluate((pick) => {
        const opts = Array.from(document.querySelectorAll('button.cp-opt, button.cp-topt, .cp-chips button[role="radio"], button.cp-met'))
          .filter((b) => { const r = b.getBoundingClientRect(); return r.height > 12 && !b.closest('header'); });
        if (opts.length) opts[pick % opts.length].click();
      }, attempt);
      clicks++;
      await page.waitForTimeout(170);
    }
    // optional triplet/met rows already covered by selector; advance nav
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find((x) =>
        /^(التالي|Next|خلصت|Done)$/.test((x.innerText || '').trim()) && !x.disabled);
      if (b) b.click();
    });
    await page.waitForTimeout(150);
    // single-choice cards often auto-advance; nothing else to do
  }
  return { clicks, submitted: false, stuckAt: 'cap' };
}

/* ── API: clientRef idempotency for CAREGIVER ── */
{
  const email = `handoff-idem-${Date.now()}@qa.test`;
  const reg = await J('POST', `${API}/register`, { email, password: 'Passw0rd1', name: 'Idem', age: 5, condition: 'other', consent_mvp_use: true });
  const token = reg.data.token, kid = reg.data.child?.id;
  const dev = reg.data.verification?.devCode;
  if (dev) await J('POST', `${API}/verify/confirm`, { code: dev }, token);
  const rec = { responses: { VQ1: { v: 'both' } }, scored: { bankVersion: 'cv2', domains: {}, accessSettings: {}, interests: [], careFlags: [], completeness: {} } };
  const p1 = await J('POST', `${API}/assessments`, { childId: kid, assessment_kind: 'CAREGIVER', clientRef: `cg-${kid}`, item_results: rec }, token);
  const p2 = await J('POST', `${API}/assessments`, { childId: kid, assessment_kind: 'CAREGIVER', clientRef: `cg-${kid}`, item_results: rec }, token);
  const rows = await J('GET', `${API}/assessments/${kid}?kind=CAREGIVER`, null, token);
  const n = Array.isArray(rows.data) ? rows.data.length : -1;
  ok('clientRef dedups double CAREGIVER record', p1.status === 201 && p2.status === 200 && n === 1, `p1=${p1.status} p2=${p2.status} rows=${n}`);
}

/* ── UI: the full user complaint, end to end ── */
{
  const email = `handoff-${Date.now()}@qa.test`;
  const reg = await J('POST', `${API}/register`, { email, password: 'Passw0rd1', name: 'Handoff Kid', age: 5, condition: 'other', consent_mvp_use: true });
  const token = reg.data.token, kid = reg.data.child?.id;
  const dev = reg.data.verification?.devCode;
  if (dev) await J('POST', `${API}/verify/confirm`, { code: dev }, token);

  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium' });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('PAGEERROR:', String(e).slice(0, 160)));
  await page.goto(`${WEB}/`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ t, e }) => {
    localStorage.clear();
    localStorage.setItem('iris_auth_token', t);
    localStorage.setItem('iris_auth_email', e);
  }, { t: token, e: email });
  await page.goto(`${WEB}/parent`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  ok('H1 fresh family lands on the FORCED family file', await page.evaluate(() => /ملف العائلة|Family profile/.test(document.body.innerText)));
  /* play the whole file exactly like qa-family-flow does */
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => /^(يبدأ|ابدأ|Start|نبدأ)/.test((x.innerText || '').trim()));
    if (b) b.click();
  });
  await page.waitForTimeout(800);
  const qres = await playQuestionnaire(page);
  const submitted = qres.submitted;
  await page.waitForTimeout(2000);
  ok('H2 family file submitted (summary plate reached)', submitted);
  await page.waitForTimeout(2200);

  /* THE CRITICAL PART: refresh WITHOUT the CTA. */
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3800);
  const afterReload = await page.evaluate(() => document.body.innerText.replace(/\n+/g, ' / ').slice(0, 200));
  ok('H3 after refresh WITHOUT CTA: no questionnaire loop', await page.evaluate(() => !/سؤال \d+ من/.test(document.body.innerText)), afterReload.slice(0, 120));
  ok('H3b child assessment (or its intro) is what shows now', await page.evaluate(() => /نتعرّف على بعض|التسلّم|يلا نبدأ|🎯/.test(document.body.innerText)), afterReload.slice(0, 120));

  /* server truth: draft COMPLETE with scored AND the backfilled record */
  const dr = await J('GET', `${API}/caregiver/draft?childId=${kid}`, null, token);
  const draft = dr.data?.draft;
  ok('H4 caregiver draft marked COMPLETE server-side', draft?.status === 'COMPLETE', JSON.stringify(draft?.status));
  ok('H4b COMPLETE draft carries the scored envelope', !!(draft?.responses?.scored), JSON.stringify(Object.keys(draft?.responses || {})).slice(0, 80));
  await page.waitForTimeout(1500);
  const recs = await J('GET', `${API}/assessments/${kid}?kind=CAREGIVER`, null, token);
  const cgRows = Array.isArray(recs.data) ? recs.data.filter((r) => r.status === 'COMPLETE') : [];
  ok('H5 CAREGIVER record backfilled after boot hydration', cgRows.length === 1, `rows=${cgRows.length}`);

  /* finish the ladder quickly (API-level is fine for draft hygiene):
     start a probe, answer the whole session through the UI once. */
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => /يلا نبدأ|هيا|Start|ابدأ/.test((x.innerText || '').trim()));
    if (b) b.click();
  });
  await page.waitForTimeout(1200);
  const lres = await playLadder(page);
  ok('H5b ladder run completed live', lres.done, `clicks=${lres.clicks} stuck=${lres.stuckAt || ''}`);
  await page.waitForTimeout(2500);
  const ladderRec = await J('GET', `${API}/assessments/${kid}`, null, token);
  const allRows = Array.isArray(ladderRec.data) ? ladderRec.data : (ladderRec.data?.records || []);
  const lad = allRows.filter((r) => (r.assessment_kind ?? 'LADDER') === 'LADDER');
  const completeLadder = lad.filter((r) => r.status === 'COMPLETE');
  ok('H6 LADDER record exists after the run', completeLadder.length >= 1, `rows=${lad.length}`);
  const ld = await J('GET', `${API}/ladder/draft?childId=${kid}`, null, token);
  const ldraft = ld.data?.draft || ld.data;
  ok('H7 ladder draft is NOT left IN_PROGRESS after completion', !ldraft || ldraft.status !== 'IN_PROGRESS', `status=${ldraft?.status}`);
  await page.screenshot({ path: '/home/ubuntu/iris-delivery/handoff/final.png' });
  await browser.close();
}
console.log(`RESULT handoff: ${pass} pass / ${fail} fail`);
process.exit(fail ? 1 : 0);
