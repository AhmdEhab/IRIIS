/**
 * qa-gemini-wiring — does a generated item actually reach a child?
 *
 * `qa-gemini.mjs` proves the route behaves. This proves the app is WIRED to
 * it: it stands a mock upstream, points the real IRIS server at it, drives a
 * real child through a real practice activity, and looks for a generated item
 * on screen by its id.
 *
 * The distinction matters. This codebase has already produced one design
 * system nothing rendered and one persistence layer nothing called; "the
 * endpoint works" is not the same claim as "the child sees it".
 *
 * It also proves the more important negative: with the mock returning unsafe
 * content, no generated item appears at all and the activity still runs on
 * bank items.
 *
 * Run: node qa-gemini-wiring.mjs      (needs the vite dev server on 5175)
 */
import http from 'node:http';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { PHASE5_ITEM_BY_ID } from './src/iris/content/phase5Bank.js';

const APP = process.env.APP || 'http://localhost:5175';
const API = 'http://localhost:5000/api';

let pass = 0;
const failures = [];
const check = (name, ok, detail = '') => {
  if (ok) { pass++; console.log(`  PASS  ${name}`); }
  else { failures.push(`${name}${detail ? ` — ${detail}` : ''}`); console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`); }
};

/* ── mock upstream ───────────────────────────────────────────────────────── */

let mode = 'valid';
let upstreamCalls = 0;
let n = 0;

const mock = http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', () => {
    upstreamCalls += 1;
    n += 1;
    const json = (obj) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(obj) }] } }] }));
    };
    /**
     * Honour the option count the ROUTE asked for. The tier decides it — 2 for
     * FOUNDATION, 3 for PRACTICE, 4 for CHALLENGE — and the guard rejects any
     * item that comes back with a different number. A mock that always returns
     * three options therefore fails validation on every FOUNDATION activity,
     * which is a bug in the mock, not in the product.
     */
    const asked = Number(/Number of answer options: (\d+)/.exec(body)?.[1]) || 3;
    const pool = ['🔵', '🔺', '⭐', '🟩'];
    const options = pool.slice(0, Math.max(2, Math.min(4, asked)));

    /**
     * Answer in the language that was asked for. The guard rejects an Arabic
     * reply to an English request (NOT_LATIN_SCRIPT) and vice versa — which is
     * correct behaviour, and which a mock that always replies in Arabic trips
     * on every English run.
     */
    const ar = /Language: Egyptian Arabic/.test(body);

    if (mode === 'unsafe') {
      return json({
        prompt: ar ? `اختار الطفل اللي عنده تشخيص رقم ${n}` : `Pick the child with a diagnosis, number ${n}`,
        options, correct_index: 0,
      });
    }
    // A distinct, safe item each time, so a repeat would be visible.
    return json({
      prompt: ar ? `سؤال إضافي رقم ${n}: فين الشكل ده؟` : `Extra question ${n}: where is this shape?`,
      options,
      correct_index: 0,
      hint: ar ? 'بصّ كويس' : 'Look carefully',
    });
  });
});
await new Promise((r) => mock.listen(5599, r));

/* ── the real IRIS server, pointed at the mock ──────────────────────────── */

/**
 * This test must OWN port 5000: it starts the backend itself, with the
 * environment that points generation at the mock. If another backend is
 * already listening there, the spawn fails with EADDRINUSE, the browser talks
 * to that other server instead, and every assertion fails for a reason that
 * has nothing to do with the product — which is exactly how an hour gets lost.
 * So check first and say so.
 */
const portBusy = await fetch(`${API}/health`).then(() => true).catch(() => false);
if (portBusy) {
  console.error(
    '\nport 5000 is already serving. This test starts its own backend pointed at\n'
    + 'the mock upstream, so stop the running one first:\n'
    + '  pkill -f "node server.js"\n'
  );
  await new Promise((r) => mock.close(r));
  process.exit(2);
}

const server = spawn('node', ['server.js'], {
  cwd: new URL('./server/', import.meta.url).pathname,
  env: {
    ...process.env,
    GEMINI_API_ROOT: 'http://127.0.0.1:5599/v1beta',
    GEMINI_API_KEY: 'AIzaTEST_wiring_key_0123456789',
    GEMINI_MAX_PER_MIN: '60',
    GEMINI_TIMEOUT_MS: '5000',
  },
  stdio: 'ignore',
});
const waitForServer = async () => {
  for (let i = 0; i < 40; i++) {
    try { if ((await fetch(`${API}/health`)).ok) return true; } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
};
const stop = () => { try { server.kill('SIGTERM'); } catch { /* already gone */ } };
process.on('exit', stop);

if (!(await waitForServer())) {
  console.error('the IRIS server did not start — is port 5000 already in use?');
  stop(); await new Promise((r) => mock.close(r));
  process.exit(1);
}

const status = await fetch(`${API}/ai/status`).then((r) => r.json());
console.log('\n════ Gemini wiring — does a generated item reach a child? ════');
console.log('\n── 0. the server is pointed at the mock ──');
check('generation reports itself configured', status.configured === true);
check('the ladder manifest loaded, so requests can be validated', status.manifest_loaded === true);

/* ── drive a real child through practice ────────────────────────────────── */

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

async function runPractice(label) {
  const email = `gw_${Date.now()}@example.com`;
  const pw = 'Str0ng!Passw0rd';
  await fetch(`${API}/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Wiring', email, password: pw, consent_mvp_use: true, age: 7 }),
  });

  const page = await browser.newPage({ viewport: { width: 1000, height: 1100 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  const txt = () => page.evaluate(() => document.body.innerText);
  const cb = async (name, ms = 1600) => {
    const el = page.getByRole('button', { name }).first();
    if (!(await el.count())) return false;
    await el.click({ force: true });
    await page.waitForTimeout(ms);
    return true;
  };
  const en = async () => {
    const b = page.getByRole('button', { name: /^(EN|English)$/ }).first();
    if (await b.count()) { await b.click({ force: true }); await page.waitForTimeout(700); }
  };

  const seenIds = [];
  const answer = async () => {
    const info = await page.evaluate(() => {
      const card = document.querySelector('[data-item-id]');
      const holder = document.querySelector('[data-response]');
      if (!holder) return null;
      const bs = [...holder.querySelectorAll('button')];
      return {
        itemId: card?.getAttribute('data-item-id') ?? null,
        kind: holder.getAttribute('data-response'),
        count: bs.length,
        labels: bs.map((b) => b.textContent.trim()),
      };
    });
    if (!info) return false;
    seenIds.push(info.itemId);
    const it = info.itemId ? PHASE5_ITEM_BY_ID[info.itemId] : null;
    const btns = page.locator(`[data-response="${info.kind}"] button`);
    if (info.kind === 'tap-each') {
      const exp = it?.expected_taps ?? 3;
      for (let i = 0; i < Math.min(exp, info.count); i++) await btns.nth(i).click({ force: true });
      await page.locator('button:has-text("I\'m done"), button:has-text("خلصت")').first().click({ force: true });
    } else if (info.kind === 'ordered') {
      const ord = it?.correct_order ?? [];
      const idx = ord.map((v) => info.labels.indexOf(String(v))).filter((k) => k >= 0);
      for (const i of (idx.length ? idx : [...Array(info.count).keys()])) await btns.nth(i).click({ force: true });
    } else {
      await btns.nth(it?.correct_index ?? 0).click({ force: true });
    }
    await page.waitForTimeout(650);
    return true;
  };

  await page.goto(APP, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1400);
  await en();
  await cb(/Parent Mode/, 1500);
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(pw);
  await cb(/Login Now/, 3000);
  await en();
  await cb(/Learning Snapshot/, 1800);
  await cb(/getting-to-know/, 1800);
  await cb(/Let's start/, 1800);
  for (let i = 0; i < 150; i++) { if (!(await answer())) break; if (/Well done/.test(await txt())) break; }
  await cb(/^Done$|Done/, 2600);

  const before = seenIds.length;
  await cb(/practice/i, 2600);
  for (let i = 0; i < 60; i++) { if (!(await answer())) break; if (/Well done/.test(await txt())) break; }
  const practiceIds = seenIds.slice(before);

  await page.close();
  console.log(`   [${label}] practice items presented: ${practiceIds.length}`);
  return { practiceIds, errors };
}

/* ── 1. safe generated content reaches the child ────────────────────────── */
console.log('\n── 1. the mock returns valid items ──');
mode = 'valid';
upstreamCalls = 0;
const good = await runPractice('valid');
check('the app actually asked the generation route for content', upstreamCalls > 0,
  `${upstreamCalls} upstream calls`);
const generated = good.practiceIds.filter((id) => String(id).startsWith('GEN-'));
check('a generated item was presented to the child', generated.length > 0,
  `ids: ${good.practiceIds.join(', ')}`);
check('bank items were presented as well — generation tops up, it does not replace',
  good.practiceIds.some((id) => id && !String(id).startsWith('GEN-')));
check('every generated item is distinct', new Set(generated).size === generated.length);
check('no runtime errors with generation on', good.errors.length === 0, good.errors.slice(0, 2).join(' | '));

/* ── 2. unsafe generated content reaches nobody ─────────────────────────── */
console.log('\n── 2. the mock returns unsafe items ──');
mode = 'unsafe';
upstreamCalls = 0;
const bad = await runPractice('unsafe');
check('the app asked again (so the negative result is meaningful)', upstreamCalls > 0,
  `${upstreamCalls} upstream calls`);
check('NO generated item reached the child',
  bad.practiceIds.every((id) => !String(id).startsWith('GEN-')),
  bad.practiceIds.join(', '));
check('practice still ran on bank items', bad.practiceIds.length > 0);
check('no runtime errors when every generation is rejected', bad.errors.length === 0,
  bad.errors.slice(0, 2).join(' | '));

const finalStatus = await fetch(`${API}/ai/status`).then((r) => r.json());
check('the rejections are visible in the status counters', finalStatus.stats.rejected > 0,
  JSON.stringify(finalStatus.stats));
check('the status endpoint leaks no key', !/AIza/.test(JSON.stringify(finalStatus)));

await browser.close();
stop();
await new Promise((r) => mock.close(r));

console.log(`\n════ ${pass} passed, ${failures.length} failed ════`);
if (failures.length) { failures.forEach((f) => console.log('  ✗ ' + f)); process.exit(1); }
process.exit(0);
