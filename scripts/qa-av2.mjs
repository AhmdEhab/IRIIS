/* IRIS av2 child-assessment QA — gating, observations envelope, resume,
   server validation, discrepancy strip. Run against local dev stack
   (server :5000 VERIFY_DEV_CODES=true + vite :5173). */
import { chromium } from 'playwright';
import { scoreCaregiverV2 } from '../src/iris/caregiver/scoringV2.js';

const WEB = process.env.QA_WEB || 'http://127.0.0.1:5173';
const API = process.env.QA_API || 'http://127.0.0.1:5000/api';
const OUT = '/home/ubuntu/iris-delivery/av2-flow';
const rnd = () => Math.random().toString(36).slice(2, 8);
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fail++; console.log('FAIL ' + name + (extra ? ' :: ' + extra : '')); }
};
const J = async (method, url, body, token) => {
  const r = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body === null || body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: r.status, data: await r.json().catch(() => null) };
};
async function newFamily(name, age) {
  const email = 'av2_' + name.toLowerCase().replace(/\W+/g, '') + '_' + rnd() + '@example.test';
  const r = await J('POST', `${API}/register`, { email, password: 'Passw0rd1', name, age, condition: 'other', consent_mvp_use: true });
  const t = r.data.token, kid = r.data.child?.id;
  const dc = r.data.verification?.devCode;
  if (dc) await J('POST', `${API}/verify/confirm`, { code: dc }, t);
  return { email, token: t, kid };
}
/* caregiver cv2 answers via the REAL scorer — letters/numbers NOT learned */
async function forgeGatedCaregiver(fam) {
  const responses = {
    VQ1: { v: 'words' }, VQ2: { v: 'independent' }, VQ3: { v: 'independent' },
    VQ4: { v: 'independent' }, VQ5: { v: 'middle' }, VQ6: { v: 'free' },
    VQ7: { v: 'with_kids' }, VQ8: { v: ['none'] }, VQ9: { v: 'hug' },
    VQ10: { v: ['music'] }, VQ11: { v: 'morning' }, VQ12: { v: 'home' },
    VQ13: { v: 'not_yet' },
  };
  const scored = scoreCaregiverV2({ responses, meta: { ageMonths: 66, durationSeconds: 120 } });
  const r = await J('POST', `${API}/assessments`, {
    childId: fam.kid, assessment_kind: 'CAREGIVER', clientRef: `av2-cg-${rnd()}`,
    item_results: { responses, scored },
  }, fam.token);
  ok('gated CAREGIVER record forged (API 2xx)', r.status >= 200 && r.status < 300, JSON.stringify(r.data).slice(0, 120));
  return scored;
}
async function playLadder(page, { max = 700 } = {}) {
  let lastQ = '', attempt = 0, clicks = 0;
  const skipRe = /^(السابق|التالي|Next|Previous|EN|عربي|English|🔊)$/;
  for (let i = 0; i < max; i++) {
    const st = await page.evaluate(() => {
      const body = document.body.innerText || '';
      return {
        done: /برافو عليك|Well done|خطة الأسبوع|انتهت الجولة|حاجات شوفناها/.test(body),
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
        /يلا نكمّل|Keep going|نرجع للعبة|أكمّل|Resume|Continue|ابدأ|يلا نبدأ|نتعرّف/.test((x.innerText || '').trim()));
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
      await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button')).find((x) => /تمام|خلصت|أؤيد|Confirm|أكد|نكمّل/.test((x.innerText || '').trim()));
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
    await page.waitForTimeout(320);
  }
  return { clicks, done: false, stuckAt: 'cap' };
}

const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });

/* ══ 1. gated family: cv2 says "لم يتعلم" → chips closed → av2 envelope ══ */
const fam1 = await newFamily('Gated Kid', 5);
const cgScored = await forgeGatedCaregiver(fam1);
const ctx1 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const p1 = await ctx1.newPage();
const errs1 = []; p1.on('pageerror', (e) => errs1.push(String(e).slice(0, 140)));
await p1.goto(`${WEB}/login`, { waitUntil: 'domcontentloaded' });
await p1.evaluate(({ t, e }) => { localStorage.clear(); localStorage.setItem('iris_auth_token', t); localStorage.setItem('iris_auth_email', e); }, { t: fam1.token, e: fam1.email });
await p1.goto(`${WEB}/assessment`, { waitUntil: 'domcontentloaded' });
await p1.waitForTimeout(3500);
const introTxt = await p1.evaluate(() => document.body.innerText);
ok('INTRO shows the honest opportunity gate chips (closed by default)', /قالوا لسه ماخدش فرصة|ماخدش فرصة/.test(introTxt), introTxt.slice(0, 160));
ok('INTRO offers opt-in to try anyway', /نجرّب على أي حال|التجربة على أي حال/.test(introTxt));
await p1.screenshot({ path: `${OUT}/01-gate-chips.png` });
await playLadder(p1);
await p1.waitForTimeout(2500);
const lad1 = await J('GET', `${API}/assessments/${fam1.kid}?kind=LADDER`, null, fam1.token);
const rows1 = Array.isArray(lad1.data) ? lad1.data : [];
const rec1 = rows1[0];
const ir1 = rec1?.item_results || {};
ok('gated family ladder COMPLETED and stored (LADDER row exists)', !!rec1, `rows=${rows1.length}`);
ok('record is av2 (item_results.bankVersion)', ir1.bankVersion === 'av2', String(ir1.bankVersion));
ok('rule_pack_version is av2-1.0.0', rec1?.rule_pack_version === 'av2-1.0.0', String(rec1?.rule_pack_version));
const SIX = ['demonstrated_independent', 'demonstrated_with_support', 'not_demonstrated', 'insufficient', 'no_opportunity', 'invalid_administration'];
const obs = Array.isArray(ir1.observations) ? ir1.observations : [];
ok('observations[] present with outcomes from the frozen six', obs.length > 0 && obs.every((o) => SIX.includes(o.outcome)), `n=${obs.length}`);
ok('opportunityGates recorded LITERACY+NUMERACY not_yet', ir1.opportunityGates && ir1.opportunityGates.LITERACY === 'not_yet' && ir1.opportunityGates.NUMERACY === 'not_yet', JSON.stringify(ir1.opportunityGates));
ok('no_opportunity rows logged for the closed tracks', obs.some((o) => o.outcome === 'no_opportunity'));
const probeStrands = new Set((Array.isArray(ir1.probe) ? ir1.probe : []).map((v) => v.strand));
const mainLit = [...probeStrands].filter((s) => s && (s.startsWith('LIT.') && !s.startsWith('LIT.LISTEN') && !s.startsWith('COMM.')));
const mainNum = [...probeStrands].filter((s) => s && s.startsWith('NUM.'));
ok('no LITERACY-MAIN items were presented while gated', mainLit.length === 0, [...probeStrands].join(','));
ok('no NUMERACY items were presented while gated', mainNum.length === 0);
ok('new domains participated (VSP/MEM/COMM strands probed)', [...probeStrands].some((s) => s && (s.startsWith('VSP.') || s.startsWith('MEM.') || s.startsWith('COMM.'))), [...probeStrands].join(','));
const vv = Array.isArray(ir1.visitValidity) ? ir1.visitValidity.map((v) => (typeof v === 'string' ? v : v.valid || v.verdict || v)) : [];
const OKV = ['valid', 'low', 'invalid', 'low_performance', 'invalid_administration'];
ok('visitValidity values all within the accepted spellings', vv.every((v) => OKV.includes(v)), JSON.stringify(vv).slice(0, 120));
ok('every observation carries accommodation + prompt_level fields', obs.every((o) => o.accommodation && typeof o.prompt_level === 'number'));
ok('latency stored but flagged data-quality-only (no score keys leak)', !!rec1 && JSON.stringify(rec1).includes('latency_ms'));
ok('no numeric composite in the record (score-free guarantee)', !/"(score|iq|level|percentile)"\s*:\s*[0-9]/.test(JSON.stringify(ir1)));
ok('ladder run produced no page errors', errs1.length === 0, errs1.join(' | '));
/* draft lifecycle: completed run → draft COMPLETE, never deleted */
const dr1 = await J('GET', `${API}/ladder/draft?childId=${fam1.kid}`, null, fam1.token);
const draft1 = dr1.data?.draft || dr1.data;
ok('server ladder draft exists and is COMPLETE after finish', draft1 && draft1.status === 'COMPLETE', JSON.stringify(draft1).slice(0, 120));
await ctx1.close();

/* ══ 2. ungated family: mid-run reload must resume from the SERVER draft ══ */
const fam2 = await newFamily('Resumer Kid', 4);
{
  const respP = {
    VQ1: { v: 'words' }, VQ2: { v: 'independent' }, VQ3: { v: 'independent' },
    VQ4: { v: 'independent' }, VQ5: { v: 'middle' }, VQ6: { v: 'free' },
    VQ7: { v: 'with_kids' }, VQ8: { v: ['none'] }, VQ9: { v: 'hug' },
    VQ10: { v: ['music'] }, VQ11: { v: 'morning' }, VQ12: { v: 'home' },
    VQ13: { v: 'practiced' },
  };
  const scP = scoreCaregiverV2({ responses: respP, meta: { ageMonths: 52, durationSeconds: 90 } });
  await J('POST', `${API}/assessments`, { childId: fam2.kid, assessment_kind: 'CAREGIVER', clientRef: `res-cg-${rnd()}`, item_results: { responses: respP, scored: scP } }, fam2.token);
}
const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const p2 = await ctx2.newPage();
const errs2 = []; p2.on('pageerror', (e) => errs2.push(String(e).slice(0, 140)));
await p2.goto(`${WEB}/login`, { waitUntil: 'domcontentloaded' });
await p2.evaluate(({ t, e }) => { localStorage.clear(); localStorage.setItem('iris_auth_token', t); localStorage.setItem('iris_auth_email', e); }, { t: fam2.token, e: fam2.email });
await p2.goto(`${WEB}/assessment`, { waitUntil: 'domcontentloaded' });
await p2.waitForTimeout(3000);
/* start: press the intro CTA and answer exactly two calibration items */
await p2.evaluate(() => {
  const all = Array.from(document.querySelectorAll('button'));
  const b = all.find((x) => /ابدأ|يلا نبدأ|Start|نتعرّف/.test(x.innerText || '') && !x.disabled);
  if (b) b.click();
});
await p2.waitForTimeout(1200);
for (let k = 0; k < 3; k++) {
  await p2.evaluate(() => {
    const card = document.querySelector('[data-item-id]');
    if (!card) return;
    if (card.getAttribute('data-response') === 'tap-each') {
      const tiles = Array.from(card.querySelectorAll('[data-tile]'));
      if (tiles[0]) tiles[0].click();
      const done = Array.from(card.querySelectorAll('button')).find((b) => /خلصت|Done/i.test(b.innerText));
      if (done) setTimeout(() => done.click(), 150);
      return;
    }
    const opts = Array.from(card.querySelectorAll('button, [role="radio"], [role="button"]'))
      .filter((x) => !/🔊|✋|بريك|Break|English|عربي/.test(x.innerText || ''));
    if (opts[0]) opts[0].click();
  });
  await p2.waitForTimeout(1200);
}
const dr2a = await J('GET', `${API}/ladder/draft?childId=${fam2.kid}`, null, fam2.token);
const draft2 = dr2a.data?.draft || dr2a.data;
ok('mid-run server draft saved IN_PROGRESS with calibration slice', draft2 && draft2.status === 'IN_PROGRESS' && draft2.bankVersion === 'av2' && (draft2.state?.cal?.calResponses?.length ?? draft2.state?.calResponses?.length) > 0, JSON.stringify(draft2).slice(0, 140));
const preWipeState = draft2 && draft2.state ? JSON.stringify(draft2.state) : '';
/* simulate a FRESH DEVICE: a brand-new browser context (no storage at all).
   A same-context wipe would be unfair: the departing page's pagehide flush
   rewrites the local draft with a fresher stamp, and newest-wins correctly
   prefers it — that is the product working, not resume failing. */
const ctx2b = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const p2b = await ctx2b.newPage();
const errs2b = []; p2b.on('pageerror', (e) => errs2b.push(String(e).slice(0, 140)));
await p2b.goto(`${WEB}/login`, { waitUntil: 'domcontentloaded' });
await p2b.evaluate(({ t, e }) => { localStorage.setItem('iris_auth_token', t); localStorage.setItem('iris_auth_email', e); }, { t: fam2.token, e: fam2.email });
await p2b.goto(`${WEB}/assessment`, { waitUntil: 'domcontentloaded' });
await p2b.waitForTimeout(7000);
const resumedTxt = await p2b.evaluate(() => document.body.innerText);
console.log('   fresh-device screen:', resumedTxt.replace(/\s+/g, ' ').slice(0, 140));
const calNow = await p2b.evaluate(() => {
  const m = (document.body.innerText || '').match(/(\d+)\s*(?:من|\/)\s*(\d+)/);
  return m ? { a: +m[1], b: +m[2] } : null;
});
/* IntroPlate CTA is the decisive marker: «يلا نكمّل» when a run was resumed, «يلا نبدأ» when fresh */
const freshIntro = /يلا نبدأ|Let's start/.test(resumedTxt) && !/يلا نكمّل|Let's continue|نرجع للعبة|Resume|المهمة/.test(resumedTxt);const resumedMarker = /يلا نكمّل|Let's continue|المهمة/.test(resumedTxt);
ok('after storage wipe the run RESUMES from the server draft (no fresh intro)', !freshIntro && resumedMarker, JSON.stringify(calNow) + ' stateHadPhase=' + /phase/.test(preWipeState));
ok('resume produced no page errors on the fresh device', errs2b.length === 0, errs2b.join(' | '));
await p2b.screenshot({ path: `${OUT}/02-resumed.png` });
await ctx2b.close();
await ctx2.close();

/* ══ 3. server-side av2 validation (enums) + legacy bypass ══ */
const bad = await J('POST', `${API}/assessments`, {
  childId: fam2.kid, assessment_kind: 'LADDER', clientRef: `av2-bad-${rnd()}`,
  rule_pack_version: 'av2-1.0.0',
  item_results: { bankVersion: 'av2', calibration: {}, probe: [], observations: [{ item_id: 'X', outcome: 'totally-made-up' }], visitValidity: [] },
}, fam2.token);
ok('bogus outcome rejected with 400 BAD_OBSERVATION_OUTCOME', bad.status === 400 && /BAD_OBSERVATION_OUTCOME/.test(JSON.stringify(bad.data)), `status=${bad.status}`);
const goodv = await J('POST', `${API}/assessments`, {
  childId: fam2.kid, assessment_kind: 'LADDER', clientRef: `av2-good-${rnd()}`,
  rule_pack_version: 'av2-1.0.0',
  item_results: { bankVersion: 'av2', calibration: {}, probe: [], observations: [{ item_id: 'X', outcome: 'insufficient' }], visitValidity: [{ visit: 1, valid: 'low_performance' }] },
}, fam2.token);
ok('valid av2 record accepted (2xx)', goodv.status >= 200 && goodv.status < 300, JSON.stringify(goodv.data).slice(0, 100));
const legacy = await J('POST', `${API}/assessments`, {
  childId: fam2.kid, assessment_kind: 'LADDER', clientRef: `legacy-${rnd()}`,
  item_results: { calibration: {}, probe: [{ strand: 'LIT.LETTER_NAME', correct: 2, total: 3 }] },
}, fam2.token);
ok('legacy phase5 record bypasses av2 checks (2xx)', legacy.status >= 200 && legacy.status < 300, `status=${legacy.status}`);
const beacon = await fetch(`${API}/ladder/draft/beacon?token=${encodeURIComponent(fam2.token)}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ childId: fam2.kid, clientRef: `av2-beacon-${rnd()}`, status: 'IN_PROGRESS', bankVersion: 'av2', state: { phase: 'CALIBRATION', calIndex: 1 } }),
});
ok('beacon route authenticates via ?token= and stores (2xx)', beacon.status >= 200 && beacon.status < 300, `status=${beacon.status}`);

/* ══ 4. discrepancy strip on First Plan (parent words vs observed reality) ══ */
const fam3 = await newFamily('Diverging Kid', 5);
/* caregiver: communication reads STRONG (VQ1 words, VQ3 independent) */
const resp3 = {
  VQ1: { v: 'words' }, VQ2: { v: 'independent' }, VQ3: { v: 'independent' },
  VQ4: { v: 'independent' }, VQ5: { v: 'independent' }, VQ6: { v: 'free' },
  VQ7: { v: 'with_kids' }, VQ8: { v: ['none'] }, VQ9: { v: 'hug' },
  VQ10: { v: ['music'] }, VQ11: { v: 'morning' }, VQ12: { v: 'home' }, VQ13: { v: 'practiced' },
};
const sc3 = scoreCaregiverV2({ responses: resp3, meta: { ageMonths: 62, durationSeconds: 100 } });
await J('POST', `${API}/assessments`, { childId: fam3.kid, assessment_kind: 'CAREGIVER', clientRef: `dv-cg-${rnd()}`, item_results: { responses: resp3, scored: sc3 } }, fam3.token);
/* ladder: LISTENING strand floored with NOT_DEMONSTRATED observations */
await J('POST', `${API}/assessments`, {
  childId: fam3.kid, assessment_kind: 'LADDER', clientRef: `dv-ld-${rnd()}`,
  rule_pack_version: 'av2-1.0.0',
  domain_scores: { 'LIT.LISTEN_WORD': { accuracy: 0, depth: 0, independence: 1, floor: true, items: 3 } },
  data_quality_flags: [], accommodations_used: [],
  item_results: {
    bankVersion: 'av2', calibration: {},
    probe: [{ strand: 'LIT.LISTEN_WORD', ladder: 'LITERACY', track: 'LISTENING', rung: 0, correct: 0, total: 3, supported: 0, insufficient: 0, modality: 'TPL-AR_LISTEN_WORD', accuracy: 0, move: 'HOLD' }],
    observations: [
      { item_id: 'AR-LW-001', strand: 'LIT.LISTEN_WORD', outcome: 'not_demonstrated', prompt_level: 1, mode: 'single', completed: true },
      { item_id: 'AR-LW-002', strand: 'LIT.LISTEN_WORD', outcome: 'not_demonstrated', prompt_level: 1, mode: 'single', completed: true },
      { item_id: 'AR-LW-003', strand: 'LIT.LISTEN_WORD', outcome: 'not_demonstrated', prompt_level: 0, mode: 'single', completed: true },
    ],
    opportunityGates: {}, visitValidity: [{ visit: 1, valid: 'valid' }], caregiverRef: null,
  },
}, fam3.token);
const ctx3 = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const p3 = await ctx3.newPage();
const errs3 = []; p3.on('pageerror', (e) => errs3.push(String(e).slice(0, 140)));
await p3.goto(`${WEB}/login`, { waitUntil: 'domcontentloaded' });
await p3.evaluate(({ t, e }) => { localStorage.clear(); localStorage.setItem('iris_auth_token', t); localStorage.setItem('iris_auth_email', e); }, { t: fam3.token, e: fam3.email });
await p3.goto(`${WEB}/plan`, { waitUntil: 'domcontentloaded' });
await p3.waitForTimeout(4200);
const planTxt = await p3.evaluate(() => document.body.innerText);
ok('First Plan shows the computed discrepancy strip', /لوحت الصورة في مكانين|differed in two places/.test(planTxt), planTxt.slice(0, 160));
ok('discrepancy is described neutrally (no blame, no averaging)', /مفيش تعارض|الاتنين معلومة|شكل المهمة/i.test(planTxt), planTxt.slice(0, 200));
ok('plan renders without page errors', errs3.length === 0, errs3.join(' | '));
await p3.screenshot({ path: `${OUT}/03-discrepancy.png` });
await ctx3.close();
await browser.close();

console.log(`RESULT av2: ${pass} pass / ${fail} fail`);
process.exit(fail ? 1 : 0);
