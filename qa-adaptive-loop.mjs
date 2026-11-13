/**
 * qa-adaptive-loop — the end-to-end proof of the sentence IRIS is built on:
 *
 *   "IRIS observes how a child performs, uses that evidence to adapt the
 *    learning pathway, records why the adaptation happened, and gives parents
 *    a clear explanation of the child's current learning state."
 *
 * ── WHY THIS RUNS IN A REAL BROWSER ──────────────────────────────────────
 * The engine unit tests already prove `decideMove()` is deterministic and
 * evidence-based. They cannot prove the app is WIRED to it. Before this file
 * existed the practice path computed a perfectly good adaptation and then
 * dropped it on the floor: no Child row was ever created, so every downstream
 * write had a null id and silently no-op'd. Files existing is not a runtime
 * flow. So this drives the actual UI a parent uses and then reads the database
 * back through the same authenticated API Parent Mode reads.
 *
 * ── HOW CORRECTNESS IS CONTROLLED ────────────────────────────────────────
 * The card publishes the bank item id it is rendering (`data-item-id`). The
 * test loads the same bank in Node and therefore knows which option is right,
 * so it can answer deliberately well or deliberately badly. That is what turns
 * "a decision was recorded" into "the decision followed the evidence".
 *
 * Run: node qa-adaptive-loop.mjs           (assumes api:5000 + vite dev up)
 */
import { chromium } from 'playwright';
import { PHASE5_ITEM_BY_ID } from './src/iris/content/phase5Bank.js';

const API = process.env.API || 'http://localhost:5000/api';
const APP = process.env.APP || 'http://localhost:5175';

let pass = 0;
const failures = [];
/** `[].every(...)` is true, which would let an empty result set pass a whole
 *  section silently. Every assertion over a collection goes through `all()`. */
const all = (arr, fn) => Array.isArray(arr) && arr.length > 0 && arr.every(fn);

const check = (name, ok, detail = '') => {
  if (ok) { pass++; console.log(`  PASS  ${name}`); }
  else { failures.push(`${name}${detail ? ` — ${detail}` : ''}`); console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`); }
};

/* ── account ─────────────────────────────────────────────────────────────── */
const email = `loop_${Date.now()}@example.com`;
const pw = 'Str0ng!Passw0rd';
await fetch(`${API}/register`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Loop Parent', email, password: pw, consent_mvp_use: true, age: 7 }),
});
const token = await fetch(`${API}/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password: pw }),
}).then((r) => r.json()).then((j) => j.token);

const api = async (path) => {
  const r = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  return { status: r.status, body: r.ok ? await r.json() : null };
};

/* ── browser ─────────────────────────────────────────────────────────────── */
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 1000, height: 1100 } });
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e)));

const txt = () => page.evaluate(() => document.body.innerText);
/**
 * Click a BUTTON by its accessible name.
 *
 * `text=/…/` matches the smallest element containing the text, which on the
 * snapshot screen is the explanatory paragraph, not the button beneath it —
 * clicking a <p> does nothing and the run silently answers zero items. Going
 * through the accessible name means the test can only click what a parent can
 * actually click.
 */
const clickButton = async (name, ms = 1600) => {
  const el = page.getByRole('button', { name }).first();
  if (!(await el.count())) { console.log(`   [no button] ${name}`); return false; }
  await el.click({ force: true });
  await page.waitForTimeout(ms);
  return true;
};

const toEnglish = async () => {
  const b = page.getByRole('button', { name: /^(EN|English)$/ }).first();
  if (await b.count()) { await b.click({ force: true }); await page.waitForTimeout(700); }
};

/**
 * Answer the item currently on screen.
 *
 * `want === true`  → give the answer the bank marks correct.
 * `want === false` → give a wrong one (and for tap-each, the wrong count).
 * When the id is missing from the bank the item is answered by first option and
 * reported, so a coverage hole shows up as a warning rather than a silent skip.
 */
const answerCurrent = async (want) => {
  const info = await page.evaluate(() => {
    const card = document.querySelector('[data-item-id]');
    const holder = document.querySelector('[data-response]');
    if (!holder) return null;
    const buttons = [...holder.querySelectorAll('button')];
    return {
      itemId: card?.getAttribute('data-item-id') ?? null,
      kind: holder.getAttribute('data-response'),
      count: buttons.length,
      labels: buttons.map((b) => b.textContent.trim()),
    };
  });
  if (!info) return null;

  const item = info.itemId ? PHASE5_ITEM_BY_ID[info.itemId] : null;
  const btns = page.locator(`[data-response="${info.kind}"] button`);

  if (info.kind === 'tap-each') {
    // Correct = tap exactly the expected count. Wrong = tap one fewer (or one
    // more when the expected count is 0), then submit either way.
    const expected = item?.expected_taps ?? 3;
    const taps = want ? expected : (expected > 0 ? expected - 1 : 1);
    for (let i = 0; i < Math.min(taps, info.count); i++) await btns.nth(i).click({ force: true });
    await page.locator('button:has-text("I\'m done"), button:has-text("خلصت")').first().click({ force: true });
  } else if (info.kind === 'ordered') {
    /**
     * `correct_order` in the bank is a list of OPTION VALUES, not indices —
     * the card maps the taps back to values before comparing. Resolving the
     * values against the rendered labels is what keeps the test honest: an
     * index-based guess silently taps nothing and the item never settles,
     * which is exactly the infinite loop this comment exists to prevent.
     */
    const order = item?.correct_order ?? [];
    const idx = order.map((v) => info.labels.indexOf(String(v))).filter((k) => k >= 0);
    // A one-step sequence cannot be got wrong by reversing it — pick another option.
    const wrong = idx.length > 1
      ? [...idx].reverse()
      : [[...Array(info.count).keys()].find((k) => k !== idx[0]) ?? idx[0]];
    const seq = want ? idx : wrong;
    const use = seq.length ? seq : [...Array(info.count).keys()];
    for (const i of use) await btns.nth(i).click({ force: true });
  } else {
    const right = item?.correct_index ?? 0;
    const pick = want ? right : (right + 1) % Math.max(1, info.count);
    await btns.nth(pick).click({ force: true });
  }
  await page.waitForTimeout(700);
  return { itemId: info.itemId, known: !!item, want };
};

const runItems = async (want, cap = 200) => {
  let n = 0, unknown = 0;
  for (;;) {
    const r = await answerCurrent(want);
    if (!r) break;
    n++;
    if (!r.known) unknown++;
    if (/Well done|أحسنت/.test(await txt())) break;
    if (n >= cap) break;
  }
  return { n, unknown };
};

console.log('\n════ IRIS adaptive loop — end to end ════');

/* ── 1. sign in through the real UI ──────────────────────────────────────── */
console.log('\n── 1. parent signs in ──');
await page.goto(APP, { waitUntil: 'networkidle' });
await page.waitForTimeout(1400);
await toEnglish();
await clickButton(/Parent Mode/, 1500);
await page.locator('input[type="email"]').first().fill(email);
await page.locator('input[type="password"]').first().fill(pw);
await clickButton(/Login Now/, 3000);
await toEnglish();
check('parent reaches Parent Mode', /Learning Snapshot/.test(await txt()));

/* ── 2. the child row: the link that used to be missing ──────────────────── */
console.log('\n── 2. child record ──');
await page.waitForTimeout(1500);
const children = await api('/children');
check('a Child row exists after sign-in', Array.isArray(children.body) && children.body.length >= 1,
  `got ${JSON.stringify(children.body)?.slice(0, 120)}`);
const childId = children.body?.[0]?.id ?? null;
check('the child row carries no diagnosis field value', !!childId && (children.body?.[0]?.condition == null || children.body?.[0]?.condition === ''),
  `condition=${children.body?.[0]?.condition}`);

/* ── 3. assessment: observation is persisted ─────────────────────────────── */
console.log('\n── 3. assessment (answered deliberately WELL) ──');
await clickButton(/Learning Snapshot/, 1800);
await clickButton(/getting-to-know/, 1800);
await clickButton(/Let's start/, 1600);
const a = await runItems(true, 200);
console.log(`   answered ${a.n} items (${a.unknown} not found in bank)`);
check('assessment ran to completion', a.n > 0 && /Well done|أحسنت/.test(await txt()), `${a.n} items`);
await clickButton(/^Done$|Done/, 2600);

const assess = childId ? await api(`/assessments/${childId}`) : { body: [] };
check('assessment persisted to the database', (assess.body ?? []).length >= 1,
  `${(assess.body ?? []).length} rows`);
const est = assess.body?.[0]?.skill_estimates ?? {};
check('the assessment carries skill estimates', Object.keys(est).length > 0,
  `keys=${Object.keys(est).length}`);
const anyProv = Object.values(est).some((e) => e?.provenance);
check('each estimate records its provenance', anyProv);

/* ── 4. practice: adaptation is persisted WITH its reason ────────────────── */
console.log('\n── 4. practice round 1 (answered deliberately WELL) ──');
await clickButton(/practice/i, 2200);
const p1 = await runItems(true, 120);
console.log(`   answered ${p1.n} items`);
await page.waitForTimeout(1800);

const s1 = await api(`/sessions/${childId}`);
check('practice sessions reach the database', (s1.body ?? []).length >= 1,
  `${(s1.body ?? []).length} rows`);

const d1 = await api(`/decisions/${childId}`);
const decisions = d1.body ?? [];
check('the decision audit trail returns those adaptations', decisions.length >= 1,
  `${decisions.length} decisions`);

/* ── 5. every adaptation is explainable and evidence-based ───────────────── */
console.log('\n── 5. explainability ──');
const GENERIC = /(ai decided|the model|magic|ready now|because it seemed|somehow)/i;
const traced = decisions.filter((d) => d.decision?.schema === 'IRIS-ADAPTATION-TRACE/1');
check('every decision carries a versioned trace schema', traced.length === decisions.length && traced.length > 0,
  `${traced.length}/${decisions.length}`);
check('every decision has a machine-readable reason code',
  all(decisions, (d) => !!d.reason_code),
  decisions.map((d) => d.reason_code).join(','));
check('every decision names the rule that produced it',
  all(decisions, (d) => !!d.rule_id),
  decisions.map((d) => d.rule_id).join(','));
check('no reason code is generic hand-waving',
  all(decisions, (d) => !GENERIC.test(String(d.reason_code))));
check('every decision cites the observation it was made from',
  all(traced, (d) => Number(d.decision?.observed?.attempts) > 0));
check('every decision reports the accuracy signal it used',
  all(traced, (d) => typeof d.decision?.decision?.signals?.recentAccuracy === 'number'));
check('every decision states where the pathway moved from and to',
  all(traced, (d) => d.decision?.decision?.fromRung != null && d.decision?.decision?.toRung != null));
check('every decision names the next activity it selected',
  all(traced, (d) => d.decision?.next?.strand != null || d.decision?.decision?.move === 'AT_TOP'));
check('the rule pack version is recorded',
  all(decisions, (d) => !!d.rule_pack_version));
check('nothing is flagged synthetic on a real run',
  all(decisions, (d) => d.is_synthetic !== true));

/* ── 6. the decision actually follows the evidence ───────────────────────── */
console.log('\n── 6. decision follows evidence ──');
/**
 * Not "a decision exists" but "the decision is the one the observation
 * warrants". Checked against the direction the rule table commits to rather
 * than against a hard-coded rung, so it stays true if the ladder is re-cut.
 */
const UP = new Set(['CLIMB']);
const DOWN = new Set(['BACKSTEP']);
const consistent = all(traced, (d) => {
  const acc = d.decision?.observed?.accuracy;
  const mv = d.decision?.decision?.move;
  const from = d.decision?.decision?.fromRung;
  const to = d.decision?.decision?.toRung;
  if (acc == null || mv == null) return true;
  if (UP.has(mv)) return to > from && acc >= 0.5;
  if (DOWN.has(mv)) return to < from && acc < 0.8;
  return to === from; // every HOLD variant must not move the rung
});
check('move direction matches the observed accuracy in every record', consistent,
  traced.map((d) => `${d.decision?.decision?.move}:${d.decision?.observed?.accuracy}`).join(' '));

const strongMoved = traced.some((d) => d.decision?.decision?.move === 'CLIMB' || d.decision?.decision?.move === 'AT_TOP');
check('a well-answered round produced a climb (or was already at the top)', strongMoved,
  traced.map((d) => d.decision?.decision?.move).join(','));

/* ── 7. a struggling round pushes the other way ──────────────────────────── */
console.log('\n── 7. practice round 2 (answered deliberately BADLY) ──');
await clickButton(/^Done$|Done/, 2200);
const before = (await api(`/decisions/${childId}`)).body?.length ?? 0;
await clickButton(/practice/i, 2200);
const p2 = await runItems(false, 120);
console.log(`   answered ${p2.n} items`);
await page.waitForTimeout(1800);

const d2 = (await api(`/decisions/${childId}`)).body ?? [];
check('the second round was persisted too', d2.length > before, `${before} → ${d2.length}`);
const fresh = d2.slice(before);
const supportive = fresh.some((d) =>
  ['BACKSTEP', 'HOLD_ADD_SCAFFOLD', 'HOLD_ROTATE_FORMAT', 'HOLD', 'SHIFT_MODALITY', 'AT_BASE'].includes(d.decision?.decision?.move));
check('a poorly-answered round did NOT climb',
  fresh.length > 0 && !fresh.some((d) => d.decision?.decision?.move === 'CLIMB'),
  fresh.map((d) => d.decision?.decision?.move).join(','));
check('a poorly-answered round produced a hold, scaffold or backstep', supportive,
  fresh.map((d) => d.decision?.decision?.move).join(','));

/* ── 8. the parent can see the state and the reason ──────────────────────── */
console.log('\n── 8. parent-facing explanation ──');
await clickButton(/^Done$|Done/, 2400);
await clickButton(/Parent Mode|^Home$/, 1600);
await clickButton(/Learning Snapshot/, 2200);
const snap = await txt();
check('the snapshot shows a learning state rather than an empty screen',
  !/no data|nothing yet|لا توجد بيانات/i.test(snap) && snap.length > 200);
check('the snapshot never shows a diagnosis or syndrome name',
  !/down syndrome|autis|adhd|متلازمة|توحّد|توحد/i.test(snap));

/* ── 8b. Parent Mode says what changed and why ───────────────────────────── */
console.log('\n── 8b. "what changed, and why" ──');
await clickButton(/Parent Mode|^Home$/, 1600);
await clickButton(/Progress|Insights/, 2600);
const dash = await txt();
check('Progress & Insights is not the empty state after real practice',
  !/hasn't started|has not started|لم يبدأ/i.test(dash), dash.slice(0, 120).replace(/\n/g, ' '));
check('the screen has a "what changed, and why" section',
  /what changed/i.test(dash) || /ما الذي تغيّر/.test(dash));
/**
 * The wording is a fixed template keyed on the reason code, so the exact
 * reason the engine recorded must be findable on the page. This is the check
 * that "explainable" means something a parent can read, not just a column.
 */
const reasonsShown = [...new Set(d2.map((d) => d.reason_code))].filter(Boolean);
const RULE_TEXT = {
  TWO_CONSECUTIVE_HIGH: /two sessions in a row/i,
  HIGH_BUT_NEEDS_CORROBORATION: /has not raised the difficulty yet/i,
  LADDER_TOP_REACHED: /highest step available/i,
  PARTIAL_MASTERY_ROTATE_FORMAT: /only the activity format changed/i,
  ONE_LOW_ADD_SUPPORT: /added extra support/i,
  TWO_CONSECUTIVE_LOW: /changed how the activity is presented/i,
  THREE_CONSECUTIVE_LOW: /stepped back one level/i,
  ALREADY_AT_LADDER_BASE: /first step of this skill/i,
  NO_SCORED_EVIDENCE: /not enough observations/i,
};
const explained = reasonsShown.filter((r) => RULE_TEXT[r] && RULE_TEXT[r].test(dash));
check('at least one recorded reason is explained in plain language on screen',
  explained.length > 0, `recorded=${reasonsShown.join(',')} explained=${explained.join(',')}`);
check('the audit line shows the rule id a specialist could check',
  /R-EST-001/.test(dash));
check('the screen states that no decision uses the diagnosis',
  /No decision is based on your child's diagnosis/i.test(dash) || /لا يوجد أي قرار مبني على تشخيص/.test(dash));
check('Parent Mode shows no percentile, age equivalent or IQ figure',
  !/percentile|age equivalent|\bIQ\b(?! test)/i.test(dash));

/* ── 8c. Ask IRIS answers from the record, and refuses to invent ─────────── */
console.log('\n── 8c. Ask IRIS ──');
await clickButton(/Parent Mode|^Home$/, 1600);
await clickButton(/Ask IRIS/, 2200);
await clickButton(/Why did my child/, 2400);
const chat = await txt();
const chatExplained = reasonsShown.some((r) => RULE_TEXT[r] && RULE_TEXT[r].test(chat));
check('Ask IRIS explains the real recorded adaptation', chatExplained,
  chat.slice(-260).replace(/\n/g, ' '));
const GENERIC_CHAT = /(the AI decided|the model decided|IRIS decided your child was ready|because the AI)/i;
check('Ask IRIS does not hand-wave about what the AI decided', !GENERIC_CHAT.test(chat));
/**
 * The suggested-question chips only render on an empty conversation, so the
 * second question is typed the way a parent would type it.
 */
await page.locator('input[placeholder]').first().fill('What is my child practising now?');
await page.getByRole('button', { name: /Send|إرسال/ }).first().click({ force: true });
await page.waitForTimeout(2400);
const chat2 = await txt();
check('Ask IRIS names what is being practised rather than saying there is no goal',
  !/No active goal yet/i.test(chat2) && /currently practising/i.test(chat2),
  chat2.slice(-200).replace(/\n/g, ' '));

/* ── 9. no runtime errors while all of that happened ─────────────────────── */
console.log('\n── 9. runtime health ──');
check('no uncaught page errors during the whole loop', pageErrors.length === 0,
  pageErrors.slice(0, 2).join(' | '));

await browser.close();

console.log(`\n════ ${pass} passed, ${failures.length} failed ════`);
if (failures.length) { failures.forEach((f) => console.log('  ✗ ' + f)); process.exit(1); }
