/**
 * qa-gemini — the Gemini route, end to end, against a mock upstream.
 *
 * ── WHY A MOCK AND NOT THE REAL API ───────────────────────────────────────
 * The behaviour that has to be proven is what IRIS does with what the model
 * returns — including the returns that matter most: unsafe content, malformed
 * JSON, a blocked prompt, a timeout, a 429. Those cannot be produced on demand
 * from the real API, and the interesting ones cost money to try. So this stands
 * a real HTTP server in front of the route, points GEMINI_API_ROOT at it, and
 * drives every branch deterministically.
 *
 * The route under test is the real one. Only the upstream is substituted, at
 * exactly the seam the route already exposes for that purpose.
 *
 * A separate, single live call against the real API is what confirms the wire
 * format; that needs a key and is documented in the final report rather than
 * run here.
 *
 * Run: node qa-gemini.mjs
 */
import http from 'node:http';
import { createRequire } from 'node:module';

const require_ = createRequire(import.meta.url);
const express = require_('./server/node_modules/express');

let pass = 0;
const failures = [];
const check = (name, ok, detail = '') => {
  if (ok) { pass++; console.log(`  PASS  ${name}`); }
  else { failures.push(`${name}${detail ? ` — ${detail}` : ''}`); console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`); }
};

/* ── the mock upstream ───────────────────────────────────────────────────── */

/** What the next upstream call should do. Set by each scenario. */
let mode = 'valid';
/** Every request the route made, so the payload can be inspected. */
const seen = [];

const geminiText = (obj) => ({
  candidates: [{ content: { parts: [{ text: JSON.stringify(obj) }] } }],
});

const mock = http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => { body += c; });
  req.on('end', () => {
    seen.push({ url: req.url, headers: req.headers, body: safeParse(body) });
    const send = (code, obj) => {
      res.writeHead(code, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(obj));
    };

    switch (mode) {
      case 'valid':
        return send(200, geminiText({
          prompt: 'فين حرف الميم؟',
          options: ['م', 'ب', 'س'],
          correct_index: 0,
          hint: 'بصّ على السنّ',
        }));
      case 'unsafe':
        return send(200, geminiText({
          prompt: 'اختار صورة الطفل اللي عنده تشخيص',
          options: ['أ', 'ب', 'ج'],
          correct_index: 0,
        }));
      case 'wrong_shape':
        return send(200, geminiText({ prompt: 'فين حرف الميم؟', options: ['م', 'ب'], correct_index: 5 }));
      case 'latin_for_arabic':
        return send(200, geminiText({ prompt: 'Where is the letter meem?', options: ['م', 'ب', 'س'], correct_index: 0 }));
      case 'not_json':
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ candidates: [{ content: { parts: [{ text: 'sorry, here is some prose' }] } }] }));
      case 'blocked':
        return send(200, { promptFeedback: { blockReason: 'SAFETY' } });
      case 'quota':
        // Deliberately echoes the key back, the way a real error page can.
        return send(429, { error: { message: `Quota exceeded for key=${process.env.GEMINI_API_KEY}` } });
      case 'hang':
        return; // never responds — exercises the timeout
      default:
        return send(500, { error: 'unknown mode' });
    }
  });
});

const safeParse = (s) => { try { return JSON.parse(s); } catch { return null; } };
const listen = (server, port) => new Promise((r) => server.listen(port, r));
const close = (server) => new Promise((r) => server.close(r));

await listen(mock, 5599);

/* ── the route under test ────────────────────────────────────────────────── */

process.env.GEMINI_API_ROOT = 'http://127.0.0.1:5599/v1beta';
process.env.GEMINI_API_KEY = 'AIzaTESTKEY_must_never_be_echoed_1234567890';
process.env.GEMINI_TIMEOUT_MS = '1200';
process.env.GEMINI_MAX_PER_MIN = '40';

const app = express();
app.use(express.json());
app.use('/api/ai', require_('./server/routes/gemini.js'));
const under = http.createServer(app);
await listen(under, 5598);

const API = 'http://127.0.0.1:5598/api/ai';
const post = (body) => fetch(`${API}/items`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
}).then(async (r) => ({ status: r.status, body: await r.json() }));

const REQ = {
  strand: 'LIT.LETTER_NAME', rung: 3, tier: 'PRACTICE',
  template_id: 'TPL-AR_LETTER_NAME', language: 'ar', count: 1,
};

console.log('\n════ Gemini constrained-generation layer ════');

/* ── 1. the happy path ───────────────────────────────────────────────────── */
console.log('\n── 1. a valid generated item ──');
mode = 'valid';
seen.length = 0;
let r = await post(REQ);
check('a valid item is returned', r.body.items?.length === 1, JSON.stringify(r.body).slice(0, 160));
const item = r.body.items?.[0] ?? {};
check('the item is marked as generated, not reviewed content',
  item.source === 'GENERATED' && item.validation_status === 'GENERATED_UNREVIEWED');
check('the item is filed at the rung and tier the ENGINE asked for',
  item.strand === REQ.strand && item.rung === REQ.rung && item.tier === REQ.tier,
  `${item.strand}/${item.rung}/${item.tier}`);
check('the option count came from the tier, not the model', item.options?.length === 3,
  `${item.options?.length} options`);

/* ── 2. nothing about a child crosses the wire ───────────────────────────── */
console.log('\n── 2. what was actually transmitted ──');
/**
 * The variable half of the payload. The system instruction is a fixed string
 * that necessarily CONTAINS words like "diagnosis" and "syndrome" — it is the
 * list of things the model must never do — so scanning it for those words
 * proves nothing. What must be clean is the part assembled from application
 * state: the user turn.
 */
const sentUser = JSON.stringify(seen[0]?.body?.contents ?? {});
const sentAll = JSON.stringify(seen[0]?.body ?? {});
check('the upstream request was made at all', seen.length === 1);
check('the request carries no child identifier of any kind',
  // NB: not /token/ — `maxOutputTokens` is a generation setting, not a credential.
  !/childId|displayName|parentId|"email"|"age"|accuracy|sessionId|Bearer /i.test(sentAll));
check('the assembled request carries no diagnosis or condition',
  !/condition|diagnos|syndrome|autis|adhd|متلازمة|تشخيص/i.test(sentUser), sentUser.slice(0, 200));
check('the assembled request carries no session history or performance figure',
  !/correct|attempts|history|ledger|evidence|accuracy|rung|streak/i.test(sentUser), sentUser.slice(0, 200));
check('the assembled request names only the skill, difficulty, format and language',
  /Skill:/.test(sentUser) && /Difficulty/.test(sentUser) && /Language:/.test(sentUser));
check('the key is sent as a header, never in the URL',
  !!seen[0]?.headers?.['x-goog-api-key'] && !String(seen[0]?.url).includes('key='),
  seen[0]?.url);
check('the system instruction tells the model the difficulty is not its to choose',
  /ALREADY been decided/i.test(sentAll));

/* ── 3. unsafe output never reaches a child ──────────────────────────────── */
console.log('\n── 3. unsafe and malformed output ──');
for (const [m, label] of [
  ['unsafe', 'clinical content is rejected'],
  ['wrong_shape', 'an out-of-range correct answer is rejected'],
  ['latin_for_arabic', 'an Arabic request answered in Latin script is rejected'],
  ['not_json', 'prose instead of JSON is rejected'],
  ['blocked', 'an upstream safety block falls back cleanly'],
]) {
  mode = m;
  r = await post(REQ);
  check(label, r.body.items?.length === 0 && r.body.fallback === true,
    `${r.body.items?.length} items, reason=${r.body.reason}`);
}

/* ── 4. failures are safe, and never leak the key ────────────────────────── */
console.log('\n── 4. upstream failure ──');
mode = 'quota';
r = await post(REQ);
check('a 429 falls back rather than erroring the caller',
  r.status === 200 && r.body.fallback === true, `${r.status} ${r.body.reason}`);
const quotaBody = JSON.stringify(r.body);
check('the API key never appears in the response body',
  !quotaBody.includes(process.env.GEMINI_API_KEY) && !/AIza/.test(quotaBody), quotaBody.slice(0, 200));

let status = await fetch(`${API}/status`).then((x) => x.json());
check('the key never appears in the status endpoint either',
  !JSON.stringify(status).includes(process.env.GEMINI_API_KEY)
  && !/AIza/.test(JSON.stringify(status)));
check('the status endpoint says WHY generation last failed',
  !!status.last_error?.reason, JSON.stringify(status.last_error));
check('the redaction replaced the echoed key rather than dropping the message',
  /REDACTED/.test(JSON.stringify(status.last_error ?? {})), JSON.stringify(status.last_error));

console.log('\n── 5. a hung upstream ──');
mode = 'hang';
const t0 = Date.now();
r = await post(REQ);
const took = Date.now() - t0;
check('a hung upstream times out instead of hanging the child\'s screen',
  r.body.fallback === true && took < 4000, `${took}ms, reason=${r.body.reason}`);

/* ── 6. the request itself is validated against the real ladders ─────────── */
console.log('\n── 6. the engine, not the client, decides difficulty ──');
mode = 'valid';
for (const [body, reason] of [
  [{ ...REQ, strand: 'NOT.A.STRAND' }, 'UNKNOWN_STRAND'],
  [{ ...REQ, rung: 99 }, 'RUNG_NOT_ON_LADDER'],
  [{ ...REQ, rung: 'three' }, 'RUNG_NOT_AN_INTEGER'],
  [{ ...REQ, tier: 'IMPOSSIBLE' }, 'UNKNOWN_TIER'],
  [{ ...REQ, template_id: 'TPL-MADE-UP' }, 'UNKNOWN_TEMPLATE'],
  [{ ...REQ, count: 99 }, 'BAD_COUNT'],
  [{ ...REQ, count: 0 }, 'BAD_COUNT'],
]) {
  r = await post(body);
  check(`a request with ${reason} is refused`, r.status === 400 && r.body.reason === reason,
    `${r.status} ${r.body.reason}`);
}

/* ── 7. the bill cannot run away ─────────────────────────────────────────── */
console.log('\n── 7. rate limiting ──');
mode = 'valid';
let limited = false;
for (let i = 0; i < 60; i++) {
  const x = await post(REQ);
  if (x.body.reason === 'RATE_LIMITED') { limited = true; break; }
}
check('repeated requests hit a rate limit rather than a bill', limited);
r = await post(REQ);
check('a rate-limited request still falls back cleanly instead of erroring',
  r.status === 200 && r.body.fallback === true);

/* ── 8. switched off entirely ────────────────────────────────────────────── */
console.log('\n── 8. no key configured ──');
const saved = process.env.GEMINI_API_KEY;
delete process.env.GEMINI_API_KEY;
r = await post(REQ);
check('with no key the route reports NOT_CONFIGURED and falls back',
  r.body.fallback === true && r.body.reason === 'NOT_CONFIGURED', JSON.stringify(r.body));
status = await fetch(`${API}/status`).then((x) => x.json());
check('status reports it is not configured', status.configured === false);
check('status states plainly that core learning does not need this route',
  status.core_learning_requires_ai === false && /bank/i.test(status.fallback));
process.env.GEMINI_API_KEY = saved;

await close(under);
await close(mock);

console.log(`\n════ ${pass} passed, ${failures.length} failed ════`);
if (failures.length) { failures.forEach((f) => console.log('  ✗ ' + f)); process.exit(1); }
