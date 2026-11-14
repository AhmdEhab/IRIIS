/* ── qa-family-flow.mjs ── Research-framework end-to-end chain:
   register → verify(dev) → FORCED Family Profile → FORCED ladder →
   First Plan → hub → Family Profile view → reload hydration → API proofs.
   Local stack: 5173 vite + 5000 API, VERIFY_DEV_CODES=true.   */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const WEB = process.env.QA_ORIGIN || 'http://127.0.0.1:5173';
const API = process.env.QA_API || 'http://127.0.0.1:5000/api';
const OUT = '/home/ubuntu/iris-delivery/family-flow';
mkdirSync(OUT, { recursive: true });

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

/* ── questionnaire player ─────────────────────────────────────────────────
   One evaluate per interaction (option re-renders make same-tick nav clicks
   land on stale nodes), and option rotation when a question repeats, which
   also breaks multi-select toggling. */
async function playQuestionnaire(page, { max = 420 } = {}) {
  let lastQ = '', attempt = 0, clicks = 0;
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

/* generic rotator for the ladder (unknown option classes) */
async function playLadder(page, { max = 480 } = {}) {
  let lastQ = '', attempt = 0, clicks = 0;
  const skipRe = /^(السابق|التالي|Next|Previous|EN|عربي|English|🔊)$/;
  for (let i = 0; i < max; i++) {
    const st = await page.evaluate(() => {
      const body = document.body.innerText || '';
      return {
        done: /برافو عليك|Well done|خطة الأسبوع/i.test(body),
        q: (body.match(/\d+\s*\/\s*\d+|سؤال \d+|item \d+/i) || [''])[0],
      };
    });
    if (st.done) return { clicks, done: true };
    const same = st.q && st.q === lastQ;
    if (same) attempt++; else attempt = 0;
    if (!st.q) attempt++;
    if (st.q) lastQ = st.q;
    const overlayHit = await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find((x) =>
        /يلا نكمّل|Keep going|نرجع للعبة|أكمّل|Resume|Continue/.test((x.innerText || '').trim()));
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
      const btns = Array.from(document.querySelectorAll('main button, section button, [role="radio"], [role="button"]'))
        .filter((b) => {
          const t = (b.innerText || '').trim().replace(/\s+/g, ' ');
          if (!t || skip.test(t)) return false;
          if (/حفظ|Save|خروج|رجوع|بريك|Break|🔊|✋|English|عربي/.test(t)) return false;
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

// ── 1. fresh, verified family via API ──────────────────────────────────────
const email = `fam${rnd()}@qa.test`;
const r = await J('POST', `${API}/register`, {
  email, password: 'Passw0rd1', name: 'Family QA Kid', age: 5, condition: 'other', consent_mvp_use: true,
});
ok('register 201 + token + child', r.status === 201 && !!r.data.token && !!r.data.child, JSON.stringify(r.data).slice(0, 140));
const token = r.data.token, kid = r.data.child?.id;
const devCode = r.data.verification?.devCode;
ok('register auto-OTP devCode', /^\d{6}$/.test(devCode || ''), JSON.stringify(r.data.verification || {}).slice(0, 120));
if (devCode) {
  const v = await J('POST', `${API}/verify/confirm`, { code: devCode }, token);
  ok('verify confirm → emailVerified', v.status === 200 && v.data?.emailVerified === true, JSON.stringify(v.data).slice(0, 120));
}

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

// ── 2. FORCED Family Profile stage ─────────────────────────────────────────
const onProfile = await page.evaluate(() => /ملف العائلة|Family profile/.test(document.body.innerText)
  && !/ابدأ التقييم|متابعة|Follow/.test(document.body.innerText));
ok('login lands on FORCED family profile (not hub)', onProfile,
  (await page.evaluate(() => document.body.innerText.slice(0, 120))));
await page.screenshot({ path: `${OUT}/01-forced-profile-intro.png` });

await page.evaluate(() => {
  const b = Array.from(document.querySelectorAll('button')).find((x) => /^(يبدأ|ابدأ|Start|نبدأ)/.test((x.innerText || '').trim()));
  if (b) b.click();
});
await page.waitForTimeout(800);

const qres = await playQuestionnaire(page);
ok('questionnaire completed + submitted', qres.submitted, `clicks=${qres.clicks} stuck=${qres.stuckAt || ''} pct=${qres.pct || ''}`);
await page.waitForTimeout(2500);
await page.screenshot({ path: `${OUT}/02-after-submit.png` });

// ── 3. FORCED ladder right after the profile ───────────────────────────────
const ladderShown = await page.evaluate(() => /نتعرّف على بعض|تسلّم|ابدأ|يلا/.test(document.body.innerText));
ok('ladder stage appears right after profile', ladderShown,
  (await page.evaluate(() => document.body.innerText.slice(0, 120))));
const startHit = await page.evaluate(() => {
  const b = Array.from(document.querySelectorAll('button')).find((x) => /يلا|ابدأ|Start|هيا/.test((x.innerText || '').trim()));
  if (b) { b.click(); return (b.innerText || '').trim().slice(0, 30); }
  return null;
});
console.log('   ladder intro click:', startHit);
await page.waitForTimeout(1200);
const lres = await playLadder(page);
ok('ladder run reached its end', lres.done, `clicks=${lres.clicks} stuck=${lres.stuckAt || ''}`);
await page.screenshot({ path: `${OUT}/03-ladder-done.png` });

// ── 4. First Plan screen ────────────────────────────────────────────────────
for (let i = 0; i < 10; i++) {
  if (await page.evaluate(() => /خطة الأسبوع|This week/.test(document.body.innerText))) break;
  await page.evaluate(() => {
    // ONLY the done-plate confirm — the plan's own CTA ('يلا نبدأ ✨') would
    // jump into child mode and we would miss asserting the plan itself.
    const b = Array.from(document.querySelectorAll('button')).find((x) => /^(تمام|Done)$/.test((x.innerText || '').trim()));
    if (b) b.click();
  });
  await page.waitForTimeout(700);
}
let planShown = await page.evaluate(() => /خطة الأسبوع/.test(document.body.innerText));
if (!planShown) {
  // the route may still have been mid-transition (ladder POST → gate splash)
  await page.waitForTimeout(1500);
  planShown = await page.evaluate(() => /خطة الأسبوع/.test(document.body.innerText));
  if (!planShown) { await page.goto(`${WEB}/plan`, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(2000); }
  planShown = await page.evaluate(() => /خطة الأسبوع/.test(document.body.innerText));
}
ok('FIRST PLAN renders after the ladder', planShown,
  (await page.evaluate(() => document.body.innerText.slice(0, 120))));
await page.screenshot({ path: `${OUT}/04-first-plan.png`, fullPage: true });

// back to the parent hub the honest way (the plan CTA enters child mode)
await page.goto(`${WEB}/parent`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2200);
ok('hub reachable after the chain', await page.evaluate(() => /وضع الوالدين/.test(document.body.innerText)));
await page.screenshot({ path: `${OUT}/05-hub.png` });

// ── 5. Family Profile view from the hub ─────────────────────────────────────
await page.evaluate(() => {
  const el = Array.from(document.querySelectorAll('button, a, [role="button"]')).find((x) => /ملف العائلة/.test(x.innerText || ''));
  if (el) el.click();
});
await page.waitForTimeout(1500);
ok('family profile view opens', await page.evaluate(() => /ملف العائلة/.test(document.body.innerText)));
await page.screenshot({ path: `${OUT}/06-family-view.png`, fullPage: true });

// ── 6. hydration: reload → straight past the gates ──────────────────────────
await page.goto(`${WEB}/parent`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2800);
const body2 = await page.evaluate(() => document.body.innerText.slice(0, 260));
ok('reload lands past the gates (hydrated, not re-forced)',
  /متابعة|لمحة/.test(body2) && !/بنعمله مرة واحدة|ابدأ التقييم/.test(body2), body2.slice(0, 140));

// ── 7. API persistence proofs ───────────────────────────────────────────────
const cg = await J('GET', `${API}/assessments/${kid}?kind=CAREGIVER`, null, token);
const cgRows = Array.isArray(cg.data) ? cg.data : [];
ok('CAREGIVER record stored + kind-filtered', cgRows.length >= 1 && cgRows.every((x) => x.assessment_kind === 'CAREGIVER'),
  JSON.stringify(cg.data).slice(0, 120));
const sc = cgRows[0]?.item_results?.scored;
ok('record carries responses + scored', !!sc && !!cgRows[0]?.item_results?.responses);
ok('scored has NO score/composite/total keys', !!sc && !/score|composite|total/i.test(Object.keys(sc).join(',')),
  Object.keys(sc || {}).join(','));
const ld = await J('GET', `${API}/assessments/${kid}?kind=LADDER`, null, token);
const ldRows = Array.isArray(ld.data) ? ld.data : [];
ok('LADDER record stored, CAREGIVER excluded', ldRows.length >= 1 && ldRows.every((x) => x.assessment_kind !== 'CAREGIVER'),
  JSON.stringify(ldRows.map((x) => x.assessment_kind)));
const dr = await J('GET', `${API}/caregiver/draft?childId=${kid}`, null, token);
ok('draft flipped to COMPLETE', dr.status === 200 && dr.data?.draft?.status === 'COMPLETE', JSON.stringify(dr.data || {}).slice(0, 110));

await browser.close();
console.log(`\nRESULT: ${pass} pass / ${fail} fail`);
process.exit(fail ? 1 : 0);
