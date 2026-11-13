/**
 * qa-security-ai — the security properties of the surfaces added in this phase.
 *
 * `qa-security.mjs` covers auth, passwords, tokens and the user-dump endpoint.
 * This covers what is new: a billable third-party key, a route that spends
 * money, a persistence layer that now actually writes, and a browser bundle
 * that must contain no credential at all.
 *
 * Everything here runs against the built bundle and the live API — the two
 * places a credential can actually escape — rather than against source.
 *
 * Run: node qa-security-ai.mjs   (needs `npm run build` and the backend up)
 */
import fs from 'node:fs';
import path from 'node:path';

const API = 'http://localhost:5000/api';
let pass = 0;
const failures = [];
const check = (name, ok, detail = '') => {
  if (ok) { pass++; console.log(`  PASS  ${name}`); }
  else { failures.push(`${name}${detail ? ` — ${detail}` : ''}`); console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`); }
};

const j = async (p, opts = {}) => {
  // NOTE the order: `...opts` FIRST, then the merged headers. Spreading opts
  // last silently replaces the whole headers object with `opts.headers`,
  // dropping Content-Type — express then parses no body and every POST looks
  // like an empty request. Cost an hour once; the order stays.
  const res = await fetch(`${API}${p}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  let body = null;
  try { body = await res.json(); } catch { /* not json */ }
  return { status: res.status, body };
};

console.log('\n════ security — credentials, spend, and child data ════');

/* ── 1. no credential is in the shipped bundle ──────────────────────────── */
console.log('\n── 1. the browser bundle ──');
const distDir = 'dist/assets';
const bundleFiles = fs.existsSync(distDir)
  ? fs.readdirSync(distDir).filter((f) => f.endsWith('.js') || f.endsWith('.css'))
  : [];
check('a built bundle exists to inspect', bundleFiles.length > 0, `looked in ${distDir}`);

const bundle = bundleFiles.map((f) => fs.readFileSync(path.join(distDir, f), 'utf8')).join('\n');

/**
 * Shapes, not names. Checking for the string "GEMINI_API_KEY" would pass even
 * if the VALUE had been inlined, which is the failure that actually matters:
 * Vite replaces `import.meta.env.VITE_X` with the literal at build time.
 */
const CREDENTIAL_SHAPES = [
  [/AIza[0-9A-Za-z_-]{20,}/, 'a Google API key'],
  [/sk-[A-Za-z0-9]{20,}/, 'an OpenAI-style key'],
  [/\b[a-f0-9]{32}\b/, 'a 32-hex secret (ElevenLabs shape)'],
  [/xox[baprs]-[A-Za-z0-9-]{10,}/, 'a Slack token'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'a private key'],
];
for (const [re, label] of CREDENTIAL_SHAPES) {
  const hit = re.exec(bundle);
  check(`the bundle contains no ${label}`, !hit, hit ? hit[0].slice(0, 12) + '…' : '');
}
check('the bundle references no VITE_ secret variable',
  !/VITE_[A-Z_]*(KEY|SECRET|TOKEN|PASSWORD)/.test(bundle));
check('the bundle never calls a third-party AI host directly',
  !/generativelanguage\.googleapis\.com|api\.elevenlabs\.io|api\.openai\.com/.test(bundle),
  'the browser must go through this app\'s own server');

/* ── 2. the .env is not in the repository, and the example has no value ─── */
console.log('\n── 2. environment files ──');
const gitignore = fs.existsSync('.gitignore') ? fs.readFileSync('.gitignore', 'utf8') : '';
check('.env is gitignored', /^\.env\s*$/m.test(gitignore));
check('the sqlite database is gitignored', /database\.sqlite/.test(gitignore));

const example = fs.existsSync('server/.env.example') ? fs.readFileSync('server/.env.example', 'utf8') : '';
check('.env.example exists so the setup is documented', example.length > 0);
check('.env.example documents the Gemini key', /GEMINI_API_KEY=/.test(example));
const filled = [...example.matchAll(/^([A-Z_]*(KEY|SECRET|TOKEN|PASSWORD))\s*=\s*(.+)$/gm)]
  .filter((m) => m[3].trim() && !m[3].trim().startsWith('#'));
check('.env.example contains no real credential value', filled.length === 0,
  filled.map((m) => m[1]).join(','));

/* ── 3. the money-spending route is not open to the world ───────────────── */
console.log('\n── 3. the generation route ──');
let r = await j('/ai/items', {
  method: 'POST',
  body: JSON.stringify({ strand: 'LIT.LETTER_NAME', rung: 3, tier: 'PRACTICE', count: 1 }),
});
check('an unauthenticated caller cannot spend the generation quota',
  r.status === 401, `${r.status} ${JSON.stringify(r.body)}`);

r = await j('/ai/items', {
  method: 'POST',
  headers: { Authorization: 'Bearer not-a-real-token' },
  body: JSON.stringify({ strand: 'LIT.LETTER_NAME', rung: 3, tier: 'PRACTICE', count: 1 }),
});
check('a forged token cannot spend the generation quota', r.status === 401, `${r.status}`);

r = await j('/ai/status');
check('the status endpoint is readable without a login (it spends nothing)', r.status === 200);
const statusText = JSON.stringify(r.body ?? {});
check('the status endpoint returns no credential',
  !/AIza|[a-f0-9]{32}/.test(statusText), statusText.slice(0, 120));
check('the status endpoint states the learning loop does not depend on it',
  r.body?.core_learning_requires_ai === false);

/* ── 4. a child's record is reachable only by that child's parent ───────── */
console.log('\n── 4. child data ──');
const mk = async (tag) => {
  const email = `sec_${tag}_${Date.now()}@example.com`;
  const pw = 'CorrectHorse9!';
  await j('/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Sec', email, password: pw, consent_mvp_use: true }),
  });
  const login = await j('/login', { method: 'POST', body: JSON.stringify({ email, password: pw }) });
  const token = login.body?.token;
  const auth = { Authorization: `Bearer ${token}` };
  const child = await j('/children', {
    method: 'POST', headers: auth,
    body: JSON.stringify({ displayName: `Child ${tag}` }),
  });
  return { email, token, auth, childId: child.body?.id };
};

const a = await mk('a');
const b = await mk('b');
check('a parent can create a child record', !!a.childId && !!b.childId);

for (const [p, label] of [
  [`/sessions/${a.childId}`, 'session history'],
  [`/decisions/${a.childId}`, 'the decision audit trail'],
]) {
  const own = await j(p, { headers: a.auth });
  const other = await j(p, { headers: b.auth });
  const anon = await j(p);
  check(`a parent can read their own child's ${label}`, own.status === 200, `${own.status}`);
  check(`another parent CANNOT read that child's ${label}`, other.status === 403, `${other.status}`);
  check(`an anonymous caller CANNOT read that child's ${label}`, anon.status === 401, `${anon.status}`);
}

/* ── 5. what a written decision record actually contains ────────────────── */
console.log('\n── 5. the persisted decision record ──');
await j('/sessions', {
  method: 'POST', headers: a.auth,
  body: JSON.stringify({
    childId: a.childId, goal_id: 'LIT.LETTER_NAME', level: 3,
    template_id: 'TPL-AR_LETTER_NAME', accuracy: 1, independence: 1,
    item_results: [],
    decision: {
      rule_id: 'R-EST-001', reason_code: 'TWO_CONSECUTIVE_HIGH',
      rule_pack_version: 'phase5-1.0.0',
      schema: 'IRIS-ADAPTATION-TRACE/1',
      observed: { strand: 'LIT.LETTER_NAME', rung: 3, attempts: 5, correct: 5, accuracy: 1 },
      decision: { move: 'CLIMB', fromRung: 3, toRung: 4, reasonCode: 'TWO_CONSECUTIVE_HIGH', ruleId: 'R-EST-001' },
    },
  }),
});
const decisions = await j(`/decisions/${a.childId}`, { headers: a.auth });
const recorded = JSON.stringify(decisions.body ?? []);
check('the decision was recorded', (decisions.body ?? []).length >= 1);
check('the record carries no diagnosis, syndrome or condition field',
  !/condition|diagnos|syndrome|autis|adhd/i.test(recorded), recorded.slice(0, 160));
check('the record carries no parent email or password',
  !/@example\.com|password|\$2[aby]\$/i.test(recorded));
check('the record carries a rule id and a reason code',
  /R-EST-001/.test(recorded) && /TWO_CONSECUTIVE_HIGH/.test(recorded));

/* ── 6. bad input is refused, not absorbed ──────────────────────────────── */
console.log('\n── 6. input validation ──');
const badBodies = [
  [{}, 'an empty body'],
  [{ strand: 'LIT.LETTER_NAME' }, 'a request with no rung or tier'],
  [{ strand: { $ne: null }, rung: 3, tier: 'PRACTICE', count: 1 }, 'an object where a strand id belongs'],
  [{ strand: 'LIT.LETTER_NAME', rung: 3, tier: 'PRACTICE', count: 1000 }, 'an absurd item count'],
  [{ strand: '../../etc/passwd', rung: 0, tier: 'PRACTICE', count: 1 }, 'a path-traversal-shaped strand'],
];
for (const [body, label] of badBodies) {
  const res = await j('/ai/items', { method: 'POST', headers: a.auth, body: JSON.stringify(body) });
  check(`${label} is refused with a reason`, res.status === 400 && !!res.body?.reason,
    `${res.status} ${JSON.stringify(res.body)}`);
}

const huge = await fetch(`${API}/ai/items`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...a.auth },
  body: JSON.stringify({ strand: 'LIT.LETTER_NAME', rung: 3, tier: 'PRACTICE', count: 1, avoid: Array(5000).fill('x'.repeat(500)) }),
}).catch(() => ({ status: 0 }));
check('an oversized body is rejected by the payload limit rather than processed',
  huge.status === 413 || huge.status === 400, `${huge.status}`);

console.log(`\n════ ${pass} passed, ${failures.length} failed ════`);
if (failures.length) { failures.forEach((f) => console.log('  ✗ ' + f)); process.exit(1); }
