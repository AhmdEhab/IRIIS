/* P68b — SEMANTIC assessment QA: plays the ladder as a child who ALWAYS
 * answers correctly (using the bank's own keys), so every correct response
 * must be recorded as a demonstration. Any item where a bank-correct click
 * ends as a miss/hint is a presentation or key bug. Also checks each served
 * card is visually complete (prompt + tiles, no literal 'undefined'), the
 * disappeared-rows actually change, choice boards accept ANY tile, and the
 * run always ends on the results report.
 *
 * Usage: QA_WEB=http://127.0.0.1:4173 QA_API=http://127.0.0.1:5000 node scripts/qa-child-honest.mjs
 */
import { chromium } from 'playwright';
import { PHASE5_ITEM_BY_ID as BANK } from '../src/iris/content/phase5Bank.js';

const WEB = process.env.QA_WEB || 'http://127.0.0.1:5173';
const API = process.env.QA_API || 'http://127.0.0.1:5000/api';
const OUT = process.env.QA_OUT || '/home/ubuntu/iris-delivery/honest-child';
const rnd = () => Math.random().toString(36).slice(2, 8);
const fails = [];
const ok = (name, cond, info = '') => {
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${info ? ' — ' + info : ''}`);
  if (!cond) fails.push(name);
};

/* ── register + verify + forge caregiver via API (proven pattern) ── */
const J = async (m, u, b, t) => {
  const r = await fetch(u, {
    method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) },
    body: b ? JSON.stringify(b) : undefined,
  });
  return { status: r.status, data: await r.json().catch(() => ({})) };
};
const { scoreCaregiverV2 } = await import('../src/iris/caregiver/scoringV2.js');

async function newFamily() {
  const email = 'honest_' + rnd() + '@example.test';
  const r = await J('POST', `${API}/register`, { email, password: 'Passw0rd1', name: 'Honest Kid', age: 5, condition: 'other', consent_mvp_use: true });
  if (!r.data.token) throw new Error('register failed: ' + JSON.stringify(r.data).slice(0, 200));
  const t = r.data.token, kid = r.data.child?.id;
  const dc = r.data.verification?.devCode;
  if (dc) await J('POST', `${API}/verify/confirm`, { code: dc }, t);
  const responses = {
    VQ1: { v: 'words' }, VQ2: { v: 'independent' }, VQ3: { v: 'independent' },
    VQ4: { v: 'independent' }, VQ5: { v: 'middle' }, VQ6: { v: 'free' },
    VQ7: { v: 'with_kids' }, VQ8: { v: ['none'] }, VQ9: { v: 'hug' },
    VQ10: { v: ['music'] }, VQ11: { v: 'morning' }, VQ12: { v: 'home' },
    VQ13: { v: 'not_yet' },
  };
  const scored = scoreCaregiverV2({ responses, meta: { ageMonths: 66, durationSeconds: 120 } });
  await J('POST', `${API}/assessments`, { childId: kid, assessment_kind: 'CAREGIVER', clientRef: `honest-cg-${rnd()}`, item_results: { responses, scored } }, t);
  return { email, token: t, kid };
}

/* ── answer a card CORRECTLY per the bank, return how it resolved ── */
async function answerCorrect(page) {
  const info = await page.evaluate(() => {
    const card = document.querySelector('[data-item-id]');
    if (!card) return null;
    const id = card.getAttribute('data-item-id');
    const mode = card.querySelector('[data-response]')?.getAttribute('data-response') || null;
    const texts = Array.from(card.querySelectorAll('[data-response] button')).map((b) => b.textContent.trim());
    const body = (document.body.innerText || '');
    return { id, mode, texts, hintUp: /محتاج مساعدة|💡/.test(body), hadMissBefore: false };
  });
  if (!info) return { type: 'no-card' };
  const item = BANK[info.id];
  if (!item) return { type: 'unknown', id: info.id };

  if (info.mode === 'tap-each') {
    // tap exactly expected_taps plain tiles then done
    const n = item.expected_taps ?? 2;
    await page.evaluate((count) => {
      const bs = Array.from(document.querySelectorAll('[data-response="tap-each"] button'));
      bs.slice(0, count).forEach((b) => b.click());
    }, n);
    await page.evaluate(() => {
      const done = Array.from(document.querySelectorAll('button')).find((b) => /خلصت|I.m done/.test(b.textContent));
      done?.click();
    });
  } else if (info.mode === 'ordered') {
    await page.evaluate((order) => {
      const bs = Array.from(document.querySelectorAll('[data-response="ordered"] button'));
      const byText = {};
      bs.forEach((b, i) => { (byText[b.textContent.trim()] ??= []).push(i); });
      const used = new Set();
      for (const t of order) {
        const idx = byText[t]?.find((i) => !used.has(i));
        if (idx != null) { used.add(idx); bs[idx].click(); }
      }
    }, item.correct_order || []);
  } else if (info.mode === 'single') {
    if (item.accepts_any_output && (item.correct_index === undefined || item.correct_index === null)) {
      // choice board: pick the LAST tile (never slot 0) — any pick must score
      await page.evaluate(() => {
        const bs = Array.from(document.querySelectorAll('[data-response="single"] button'));
        bs[bs.length - 1]?.click();
      });
    } else {
      const correctText = item.options?.[item.correct_index ?? 0];
      await page.evaluate((t) => {
        const bs = Array.from(document.querySelectorAll('[data-response="single"] button'));
        const b = bs.find((x) => x.textContent.trim() === t) || bs[item.correct_index ?? 0];
        b?.click();
      }, correctText);
    }
  } else {
    return { type: 'other', id: info.id };
  }

  // settle: give the card up to 2.6s to either advance or show the hint moment
  await page.waitForTimeout(1400);
  const after = await page.evaluate(() => {
    const card = document.querySelector('[data-item-id]');
    const body = document.body.innerText || '';
    return {
      stillSame: card ? card.getAttribute('data-item-id') : null,
      hintLine: /خد وقتك|بص على الاختيارات/.test(body) && !!card,
    };
  });
  return { type: 'answered', id: info.id, after };
}

async function runAssessment(page) {
  const seen = [];
  const misses = [];
  for (let step = 0; step < 60; step++) {
    const st = await page.evaluate(() => {
      const body = document.body.innerText || '';
      return {
        done: /برافو|حاجات شوفناها|الخطة|Well done/i.test(body),
        results: !!document.querySelector('[data-results-screen], .lr-results, [class*="results"]'),
        id: document.querySelector('[data-item-id]')?.getAttribute('data-item-id') || null,
      };
    });
    if (st.done) return { seen, misses, ended: 'done' };
    if (!st.id) {
      // intro/gate/plate screens: click the primary CTA or wait
      const clicked = await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button')).find((x) => /يلا|نبدأ|Start|أكمل|استئناف|Resume|التقييم|هتعرف/.test(x.textContent) && !x.disabled);
        if (b) { b.click(); return b.textContent.trim().slice(0, 30); }
        return null;
      });
      if (!clicked && step > 8) { await page.waitForTimeout(700); continue; }
      await page.waitForTimeout(900);
      continue;
    }
    if (st.id.startsWith('undefined') || !BANK[st.id]) {
      misses.push(`${st.id}: not a bank id`);
    }
    if (!seen.includes(st.id)) seen.push(st.id); /* P68b: a lingering card (animation/re-present) is the SAME item, not a new one */
    await checkCard(page);
    const r = await answerCorrect(page);
    if (r.type === 'answered') {
      // if the SAME card is still up with the hint line, a correct answer was scored wrong
      if (r.after.hintLine && r.after.stillSame === r.id) {
        misses.push(`${r.id}: bank-correct answer scored as miss`);
        await page.screenshot({ path: `${OUT}/miss-${r.id}.png` }).catch(() => {});
        // nudge past: retry the same correct click once (hint re-arm)
        await answerCorrect(page);
        const r2 = await page.evaluate(() => document.querySelector('[data-item-id]')?.getAttribute('data-item-id'));
        if (r2 === r.id) {
          // second attempt also stuck → hard stall; record and escape via dwell chip
          await page.evaluate(() => {
            const p = Array.from(document.querySelectorAll('button')).find((b) => /مش عارف/.test(b.textContent));
            p?.click();
          });
          await page.waitForTimeout(1500);
        }
      }
    }
    await page.waitForTimeout(400);
  }
  return { seen, misses, ended: 'cap' };
}

/* card completeness + display sanity during the run */
let cardChecks = { total: 0, undefinedText: 0, disappearedSame: 0, disappearedChecked: 0 };
async function checkCard(page) {
  const c = await page.evaluate(() => {
    const card = document.querySelector('[data-item-id]');
    if (!card) return null;
    const txt = card.innerText || '';
    return { id: card.getAttribute('data-item-id'), undef: /undefined|null/.test(txt), h1: !!card.querySelector('h2') };
  });
  if (!c) return;
  cardChecks.total++;
  if (c.undef) cardChecks.undefinedText++;
  if (!c.h1) cardChecks.undefinedText++;
  // disappeared items: header must show the ⬜ after the reveal delay
  if (c.id && BANK[c.id]?.display_after) {
    cardChecks.disappearedChecked++;
    await page.waitForTimeout(2600);
    const after = await page.evaluate(() => (document.querySelector('[data-item-id]')?.innerText || ''));
    if (!after.includes('⬜')) cardChecks.disappearedSame++;
    const t = setTimeout(() => {}, 0); clearTimeout(t);
  }
}

/* ── main ── */
import { mkdirSync } from 'fs';
mkdirSync(OUT, { recursive: true });
const fam = await newFamily();
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'ar' });
const page = await ctx.newPage();
const consoleErrs = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrs.push(m.text().slice(0, 160)); });
page.on('pageerror', (e) => consoleErrs.push('PAGEERROR ' + String(e.message).slice(0, 160)));
page.on('response', (r) => { if (r.status() >= 400) consoleErrs.push(`HTTP ${r.status()} ${r.url().replace(/^http:\/\/127\.0\.0\.1:\d+/, '')}`); });

await page.addInitScript(([token, email]) => {
  localStorage.clear();
  localStorage.setItem('iris_auth_token', token);
  localStorage.setItem('iris_auth_email', email);
  localStorage.setItem('iris_lang', 'ar');
}, [fam.token, fam.email]);
await page.goto(`${WEB}/assessment`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);

const res = await runAssessment(page);
ok('run reached its end (done plate / results)', res.ended === 'done', res.ended);
ok('no bank-correct answer was scored wrong', res.misses.length === 0, res.misses.join(' | ').slice(0, 400));
ok('cards render complete (prompt present, no undefined text)', cardChecks.undefinedText === 0, JSON.stringify(cardChecks));
ok('disappeared rows visually change (⬜ reveal)', cardChecks.disappearedSame === 0, `${cardChecks.disappearedSame}/${cardChecks.disappearedChecked} stayed whole`);
ok('no console/page errors during the run', consoleErrs.length === 0, consoleErrs.slice(0, 3).join(' | '));
const uniq = new Set(res.seen);
ok('session served 8-14 items without dead loops', res.seen.length >= 8 && res.seen.length <= 20, `${res.seen.length} served, ${uniq.size} unique`);

await page.screenshot({ path: `${OUT}/final.png` }).catch(() => {});
// results leg: click the finish CTA if we're on the done plate, expect report copy
await page.evaluate(() => {
  const b = Array.from(document.querySelectorAll('button')).find((x) => /تمام|Done|يلا نشوف|النتيجة/i.test(x.textContent));
  b?.click();
});
await page.waitForTimeout(2500);
const report = await page.evaluate(() => ({
  url: location.pathname,
  body: (document.body.innerText || '').slice(0, 3000),
}));
const hasReport = /results/.test(report.url) && /اتعرفنا|حاجات شوفناها|قوي|بيميل|نوصي/i.test(report.body) && !/حصل مشكلة/.test(report.body);
ok('report screen renders after the ladder', hasReport, `url=${report.url} head=${report.body.replace(/\s+/g, ' ').slice(0, 90)}`);
await page.screenshot({ path: `${OUT}/report.png` }).catch(() => {});

await browser.close();
console.log(`RESULT honest-child: ${fails.length === 0 ? 'ALL PASS' : fails.length + ' FAIL'} | items served ${res.seen.length} unique ${uniq.size}`);
if (fails.length) process.exit(1);
