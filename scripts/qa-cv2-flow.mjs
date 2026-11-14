/* ── qa-cv2-flow.mjs ── cv2 deterministic walk:
   register(age 5) → forced Family File on cv2 → plan-driven answers that fire
   EVERY probe + the care card → honest counts ≤15 → submit → ladder gate →
   API proofs (bankVersion cv2, careFlags, metrics, no scores) → settings pref.
   Also a second registration (age 3) asserting VQ13 stays hidden.
   Local stack: 5173 vite + 5000 API, VERIFY_DEV_CODES=true. */
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
const WEB = process.env.QA_ORIGIN || 'http://127.0.0.1:5173';
const API = process.env.QA_API || 'http://127.0.0.1:5000/api';
const OUT = '/home/ubuntu/iris-delivery/cv2-flow';
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

/* question-substring → the answer(s) to press (label substrings) */
const PLAN = [
  ['بيقول اللي عايزه', ['بفهم طريقته']],
  ['بيفهم الكلام', ['لسه واضحش']],
  ['عينه أو ودانه', ['الودن']],
  ['اللعب والأنشطة الجديدة', ['لسه ماخدش']],
  ['لعبتين تقابل', ['أيوة']],
  ['علبة البسكوت', ['نص المساعدة']], /* falls back to first if miss */
  ['أكل، لبس', ['محتاج مساعدة في أغلبها']],
  ['محتاج مساعدة في إيه', ['الأكل', 'الحمام']],
  ['مين بيساعد', ['ماما']],
  ['بيتمشى', ['ماسك']],
  ['بالمؤشر', ['الشغل الدقيق']],
  ['حروف أو أرقام', ['لسه ماخدش']],
  ['مع العيال', ['جنبهم']],
  ['بيصعّب يومه', ['عناد', 'يؤذي نفسه', 'النوم']],
  ['بيرجّعه لوضعه', ['ماوصلناش']],
  ['بيضيق قبل إيه', ['تغيير']],
  ['أكتر الحاجات', ['حيوانات', 'مزيكا']],
  ['بيعملها حلو', '__TEXT__'],
  ['أحسن وقت', ['الصباح']],
  ['بيعدّي فين', ['في البيت']],
  ['IRIS يعرض', ['الاتنين']],
];
const FALLBACK_FIRST = /كلامه وصل/; /* must never appear on this walk */

const browser = await chromium.launch({ executablePath: '/usr/bin/chromium' });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR:', String(e).slice(0, 200)));

/* ── 1. register a 5-year-old via API, verify, enter app ─────────────────── */
const email = `cv2qa_${rnd()}@example.test`;
const r = await J('POST', `${API}/register`, { email, password: 'Passw0rd1', name: 'cv2 QA Kid', age: 5, condition: 'other', consent_mvp_use: true });
ok('register 201', r.status === 201 && !!r.data.token && !!r.data.child, JSON.stringify(r.data).slice(0, 140));
const token = r.data.token, kid = r.data.child?.id;
const devCode = r.data.verification?.devCode;
if (devCode) await J('POST', `${API}/verify/confirm`, { code: devCode }, token);
await page.goto(`${WEB}/`, { waitUntil: 'domcontentloaded' });
await page.evaluate(({ t, e }) => { localStorage.clear(); localStorage.setItem('iris_auth_token', t); localStorage.setItem('iris_auth_email', e); }, { t: token, e: email });
await page.goto(`${WEB}/parent`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2600);

/* ── 2. forced profile shows cv2 intro copy ──────────────────────────────── */
const intro = await page.evaluate(() => document.body.innerText);
ok('intro promises question COUNT not minutes', /١٥ سؤال قصير على الأكثر/.test(intro) && !/دقيقة/.test(intro), intro.slice(0, 140));
await page.screenshot({ path: `${OUT}/01-cv2-intro.png` });
await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(يبدأ|ابدأ|Start|نبدأ)/.test((x.innerText || '').trim())); if (b) b.click(); });
await page.waitForTimeout(700);

/* block intros need a Next press each time */
const seen = { probes: new Set(), care: false, maxTotal: 0, clicks: 0, questions: [] };
for (let turn = 0; turn < 140; turn++) {
  const st = await page.evaluate(() => {
    const body = document.body.innerText;
    const q = document.querySelector('.cp-q')?.innerText || '';
    const care = /خدنا بالك من النقطة دي/.test(body);
    const review = /مراجعة سريعة/.test(body);
    const blockIntro = !!document.querySelector('.cp-block-title') && !document.querySelector('.cp-opt,.cp-topt,.cp-chips');
    const opts = Array.from(document.querySelectorAll('button.cp-opt, button.cp-topt, .cp-chips button[role="radio"], .cp-chips button'))
      .map((b) => ({ text: (b.innerText || '').trim(), el: b })).filter((o) => o.text);
    const prog = (body.match(/سؤال\s*(\d+)\s*من\s*(\d+)/) || []).slice(1).map(Number);
    return { q, care, review, blockIntro, optCount: opts.length, prog, hasText: !!document.querySelector('.cp-q') };
  });
  if (st.prog && st.prog[1]) seen.maxTotal = Math.max(seen.maxTotal, st.prog[1]);
  if (st.review) {
    const done = await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find((x) => /أرسل الملف|Submit the profile/.test((x.innerText || '')));
      if (b) { b.click(); return true; }
      return false;
    });
    if (done) { await page.waitForTimeout(1400); break; }
  }
  if (st.care) {
    seen.care = true;
    await page.screenshot({ path: `${OUT}/02-care-card.png` });
    const careTxt = await page.evaluate(() => document.body.innerText);
    ok('care card is calm + points to the existing clinician, no diagnosis', /ماحدش غلطان فيه/.test(careTxt) && /الدكتور اللي متابع معاكم/.test(careTxt) && !/توحد|diagno/i.test(careTxt));
    await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /تمام، نكمّل|Okay, continue/.test((x.innerText || ''))); if (b) b.click(); });
    await page.waitForTimeout(500);
    continue;
  }
  if (st.blockIntro) {
    await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(التالي|Next)/.test((x.innerText || '').trim())); if (b) b.click(); });
    await page.waitForTimeout(450);
    continue;
  }
  if (!st.q) { await page.waitForTimeout(400); continue; }
  if (FALLBACK_FIRST.test(st.q)) { console.log('UNEXPECTED SPEECH PROBE:', st.q.slice(0, 60)); }
  seen.questions.push(st.q);
  /* choose plan labels */
  const rule = PLAN.find(([sub]) => st.q.includes(sub));
  const wants = rule ? rule[1] : [];
  if (wants === '__TEXT__') {
    await page.evaluate(() => {
      const ta = document.querySelector('textarea.cp-textarea');
      if (!ta) return;
      const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
      setter.call(ta, 'بيركب السلالم لوحده من غير ما حد يمسه');
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    });
  } else if (wants.length) {
    for (const w of wants) {
      await page.evaluate((want) => {
        const btns = Array.from(document.querySelectorAll('button.cp-opt, button.cp-topt, .cp-chips button'));
        const b = btns.find((x) => (x.innerText || '').includes(want)) || btns[Math.floor(btns.length / 2)];
        if (b) b.click();
      }, w);
      await page.waitForTimeout(320);
    }
  } else {
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button.cp-opt, button.cp-topt, .cp-chips button'));
      if (btns[1]) btns[1].click(); /* middle-ish fallback */
    });
    await page.waitForTimeout(320);
  }
  /* press التالي unless the option already advanced */
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => /^(التالي|Next|خلصت|Done)$/.test((x.innerText || '').trim()));
    if (b && !b.disabled) b.click();
  });
  await page.waitForTimeout(380);
}
await page.screenshot({ path: `${OUT}/03-after-submit.png` });

/* ── 3. structural assertions about the walk itself ──────────────────────── */
ok('progress denominator never exceeded 15 (≤15 promise holds)', seen.maxTotal <= 15, `maxTotal=${seen.maxTotal}`);
ok('care card fired for self-harm tick', seen.care);
const joined = seen.questions.join(' | ');
ok('speech-level probe correctly NEVER shown (channel was "I read him")', !/كلامه وصل/.test(joined));
ok('senses probe shown for hard-to-read + not-yet-both', seen.probes.has('senses') || /عينه أو ودانه/.test(joined), joined.slice(0, 160));
ok('opportunity probe shown for not-yet activities', /لعبتين تقابل/.test(joined));
ok('daily parts + helper probes shown', /محتاج مساعدة في إيه/.test(joined) && /مين بيساعد/.test(joined));
ok('hands probe shown for supported walker', /بالمؤشر|بيشاور/.test(joined));
ok('letters question shown at age 5', /حروف أو أرقام/.test(joined));
ok('upset-cause probe shown after nothing-works soothing', /بيضيق قبل إيه/.test(joined));
ok('preference question is the LAST thing asked', /IRIS يعرض/.test(joined));

/* ── 4. ladder appears right after the profile (gate intact) ─────────────── */
await page.waitForTimeout(1800);
const ladderShown = await page.evaluate(() => /نتعرّف على بعض|تسلّم|يلا نبدأ|ابدأ التقييم/.test(document.body.innerText));
ok('ladder gate appears after cv2 profile', ladderShown, await page.evaluate(() => document.body.innerText.slice(0, 120)));

/* ── 5. API proofs ────────────────────────────────────────────────────────── */
await page.waitForTimeout(1500);
const cg = await J('GET', `${API}/assessments/${kid}?kind=CAREGIVER`, null, token);
const rows = Array.isArray(cg.data) ? cg.data : [];
ok('CAREGIVER record stored', rows.length >= 1);
const sc = rows[0]?.item_results?.scored;
ok('scored is bankVersion cv2', sc?.bankVersion === 'cv2', String(sc?.bankVersion));
ok('careFlags carries the calm flag', Array.isArray(sc?.careFlags) && sc.careFlags.includes('self_care'), JSON.stringify(sc?.careFlags));
ok('care guidance note present', /الدكتور اللي متابع معاكم/.test(JSON.stringify(sc?.guidanceNotes || [])));
ok('metrics captured (duration + probes + care)', sc?.metrics && typeof sc.metrics.durationSeconds === 'number' && sc.metrics.careCardShown === true, JSON.stringify(sc?.metrics));
ok('completeness honest (≤15 core)', sc?.completeness?.total <= 15 && sc.completeness.answered <= 15, JSON.stringify(sc?.completeness));
ok('no numeric score keys', !!sc && !/^(score|composite|totalScore|iq|mentalAge)/i.test(Object.keys(sc).join(',')), Object.keys(sc || {}).join(','));
ok('confidence of S/M never HIGH', sc && sc.domainStates.S.confidence !== 'HIGH' && sc.domainStates.M.confidence !== 'HIGH',
  `S=${sc?.domainStates?.S?.confidence} M=${sc?.domainStates?.M?.confidence}`);
const pref = await page.evaluate(() => localStorage.getItem('iris_display_pref'));
ok('display preference stored OUTSIDE assessment data', pref === 'both', String(pref));
const dr = await J('GET', `${API}/caregiver/draft?childId=${kid}`, null, token);
ok('draft COMPLETE', dr.data?.draft?.status === 'COMPLETE', JSON.stringify(dr.data || {}).slice(0, 100));

/* ── 5a. open the hub by stubbing a LADDER record (settings UI check only) ── */
const stub = await J('POST', `${API}/assessments`, { childId: kid, assessment_kind: 'LADDER', clientRef: 'qa-cv2-stub', item_results: { stub: true, items: [] } }, token);
ok('stub ladder record accepted', stub.status === 200 || stub.status === 201, JSON.stringify(stub.data || {}).slice(0, 90));

/* ── 5b. parent settings shows the display-preference plate (outside data) ── */
await page.goto(`${WEB}/parent`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2200);
await page.evaluate(() => {
  const el = Array.from(document.querySelectorAll('button, a, [role="button"]')).find((x) => /الإعدادات|Settings/.test(x.innerText || ''));
  if (el) el.click();
});
await page.waitForTimeout(1600);
const settingsTxt = await page.evaluate(() => document.body.innerText);
ok('parent settings exposes the display preference plate', /IRIS يعرض إزاي|How IRIS shows things/.test(settingsTxt),
  settingsTxt.slice(0, 120));
ok('settings plate states it never touches the assessment', /ده تفضيل للعرض/.test(settingsTxt) && /\u0645\u0627\u0628\u064a\u0623\u062b\u0631\u0634/.test(settingsTxt));
await page.screenshot({ path: `${OUT}/04b-settings-pref.png`, fullPage: true });

/* ── 6. a 3-year-old never sees the letters question ─────────────────────── */
const email2 = `cv2qa2_${rnd()}@example.test`;
const r2 = await J('POST', `${API}/register`, { email: email2, password: 'Passw0rd1', name: 'cv2 QA Toddler', age: 3, condition: 'other', consent_mvp_use: true });
const t2 = r2.data.token;
const dc2 = r2.data.verification?.devCode;
if (dc2) await J('POST', `${API}/verify/confirm`, { code: dc2 }, t2);
const page2 = await ctx.newPage();
await page2.goto(`${WEB}/`, { waitUntil: 'domcontentloaded' });
await page2.evaluate(({ t, e }) => { localStorage.clear(); localStorage.setItem('iris_auth_token', t); localStorage.setItem('iris_auth_email', e); }, { t: t2, e: email2 });
await page2.goto(`${WEB}/parent`, { waitUntil: 'domcontentloaded' });
await page2.waitForTimeout(2400);
await page2.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(يبدأ|ابدأ|Start|نبدأ)/.test((x.innerText || '').trim())); if (b) b.click(); });
await page2.waitForTimeout(700);
let sawLetters = false, steps2 = 0;
for (let turn = 0; turn < 60 && steps2 < 17; turn++) {
  const st = await page2.evaluate(() => ({
    q: document.querySelector('.cp-q')?.innerText || '',
    block: !!document.querySelector('.cp-block-title') && !document.querySelector('.cp-opt'),
    review: /مراجعة سريعة/.test(document.body.innerText),
  }));
  if (st.review) break;
  if (st.block) { await page2.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find((x) => /^(التالي|Next)/.test((x.innerText || '').trim())); if (b) b.click(); }); await page2.waitForTimeout(350); continue; }
  if (!st.q) { await page2.waitForTimeout(300); continue; }
  if (/حروف أو أرقام/.test(st.q)) sawLetters = true;
  steps2 += 1;
  await page2.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button.cp-opt, button.cp-topt, .cp-chips button'));
    if (btns[0]) btns[0].click();
    const b = Array.from(document.querySelectorAll('button')).find((x) => /^(التالي|Next)$/.test((x.innerText || '').trim()));
    if (b && !b.disabled) b.click();
  });
  await page2.waitForTimeout(320);
}
ok('3-year-old walk NEVER shows the letters question (age gate)', !sawLetters, `steps=${steps2}`);
await page2.screenshot({ path: `${OUT}/04-toddler-no-letters.png` });

/* ── 7. a cv1-era draft must RESUME on the cv1 bank (compatibility) ──────── */
const email3 = `cv1qa_${rnd()}@example.test`;
const r3 = await J('POST', `${API}/register`, { email: email3, password: 'Passw0rd1', name: 'cv1 Legacy Kid', age: 4, condition: 'other', consent_mvp_use: true });
const t3 = r3.data.token, kid3 = r3.data.child?.id;
const dc3 = r3.data.verification?.devCode;
if (dc3) await J('POST', `${API}/verify/confirm`, { code: dc3 }, t3);
// forge an un-stamped cv1 draft exactly like the old client wrote it
const cv1resp = { C1: { v: 'little_help' }, C2: { v: 'independent' }, C3: { v: 'independent' }, S1: { v: 'yes_happens', t: 'supervise' }, L1: { v: 'yes_happens' } };
await J('POST', `${API}/caregiver/draft`, { childId: kid3, clientRef: 'cv1-legacy-ref', responses: cv1resp, status: 'IN_PROGRESS', updatedAt: new Date().toISOString() }, t3);
const page3 = await ctx.newPage();
await page3.goto(`${WEB}/`, { waitUntil: 'domcontentloaded' });
await page3.evaluate(({ t, e }) => { localStorage.clear(); localStorage.setItem('iris_auth_token', t); localStorage.setItem('iris_auth_email', e); }, { t: t3, e: email3 });
await page3.goto(`${WEB}/parent`, { waitUntil: 'domcontentloaded' });
await page3.waitForTimeout(3000);
const resumed = await page3.evaluate(() => document.body.innerText);
const q1 = await page3.evaluate(() => document.querySelector('.cp-q')?.innerText || '');
// cv1's total question count is far above 15 — the counter proves the bank
const digits = { '٠': 0, '١': 1, '٢': 2, '٣': 3, '٤': 4, '٥': 5, '٦': 6, '٧': 7, '٨': 8, '٩': 9 };
const toNum = (x) => String(x || '').split('').map((c) => (c in digits ? digits[c] : (/\d/.test(c) ? Number(c) : ''))).join('');
const denom = Number(toNum((resumed.match(/من\s*([٠-٩0-9]+)/) || [])[1]));
ok('cv1-era draft resumes on the cv1 bank (denominator > 15)', q1.length > 0 && denom > 15, `q=${q1.slice(0, 50)} denom=${denom}`);
ok('resumed screen is a question, not the cv2 intro', !/١٥ سؤال قصير على الأكثر/.test(resumed));
await page3.screenshot({ path: `${OUT}/05-cv1-resume.png` });
// submitting the resumed cv1 draft must produce cv1 stamp, not cv2
const qres3 = await playQuestionnaireQuick(page3);
await page3.waitForTimeout(2200);
const cg3 = await J('GET', `${API}/assessments/${kid3}?kind=CAREGIVER`, null, t3);
const sc3 = (Array.isArray(cg3.data) ? cg3.data : [])[0]?.item_results?.scored;
ok('cv1-resumed submit scores as cv1', sc3?.bankVersion === 'cv1', String(sc3?.bankVersion));

async function playQuestionnaireQuick(pg) {
  /* generic cv1 walk: one option + one Next per turn; types into opentexts;
     clears care cards; submits on the review screen. Cap 900 turns. */
  for (let i = 0; i < 900; i++) {
    const st = await pg.evaluate(() => ({
      review: /مراجعة سريعة|Quick review/.test(document.body.innerText),
      care: /خدنا بالك من النقطة دي|We took this part/.test(document.body.innerText),
      block: !!document.querySelector('.cp-block-title') && !document.querySelector('.cp-opt, .cp-topt, .cp-chips button'),
      q: document.querySelector('.cp-q')?.innerText || '',
    }));
    if (st.review) {
      const done = await pg.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button')).find((x) => /أرسل الملف|Submit the profile/.test(x.innerText || ''));
        if (b) { b.click(); return true; }
        return false;
      });
      if (done) { await pg.waitForTimeout(1600); return true; }
    }
    if (st.care) {
      await pg.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button')).find((x) => /تمام، نكمّل|Okay, continue/.test(x.innerText || ''));
        if (b) b.click();
      });
      await pg.waitForTimeout(320);
      continue;
    }
    if (st.block) {
      await pg.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button')).find((x) => /^(التالي|Next)/.test((x.innerText || '').trim()));
        if (b) b.click();
      });
      await pg.waitForTimeout(320);
      continue;
    }
    if (/احك|ملحوظة|نقطة قوة|بتفخر|مهم ليكم|بتفضلوا|لو عندكم/.test(st.q)) {
      await pg.evaluate(() => {
        const ta = document.querySelector('textarea.cp-textarea');
        if (ta) {
          const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
          setter.call(ta, 'بيجهز الشاي لنفسه');
          ta.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
    } else {
      await pg.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button.cp-opt, button.cp-topt, .cp-chips button'));
        if (btns[0]) btns[0].click();
      });
    }
    await pg.waitForTimeout(260);
    await pg.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find((x) => /^(التالي|Next|خلصت|Done)$/.test((x.innerText || '').trim()));
      if (b && !b.disabled) b.click();
    });
    await pg.waitForTimeout(260);
  }
  return false;
}

await browser.close();
console.log(`\nRESULT cv2: ${pass} pass / ${fail} fail`);
process.exit(fail ? 1 : 0);
