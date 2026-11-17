/* ═══════════════════════════════════════════════════════════════════════════
 * P67 — CHILD-ASSESSMENT DELIVERY RULES CHECKER
 * Mirrors IrisLadderAssessment.loadVisit with the proven engine contract
 * (startProbe(cal, profile) / nextProbe / recordProbe — see dedup-sim.mjs)
 * and the REAL picker + ledger, then runs many virtual families through
 * complete sessions (and stop→serialize→resume variants).
 * Rules asserted (user-approved in P63):
 *   R1 same prompt text ≤2/session   R2 identical task never twice
 *   B1 ceiling ≤12 (family budget)   target ≈10
 *   Resume: ledger survives a JSON draft round-trip with no new repeats.
 * ═══════════════════════════════════════════════════════════════════════════ */
import { runCalibration, startProbe, nextProbe, recordProbe, PROBE_PROFILES } from '../src/iris/journey.js';
import { PHASE5_ITEM_BY_ID, servableStrandItems } from '../src/iris/content/phase5Bank.js';
import { pickVisitItems, ledgerFromObservations, taskKeyOf, promptKeyOf } from '../src/iris/content/visitPicker.js';

const FAMILY = PROBE_PROFILES.family;
const rngSeed = (s) => () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
const POLICIES = {
  strong: (r) => r() < 0.9,
  weak: (r) => r() < 0.1,
  mixed: (r) => r() < 0.55,
  flaky: (r) => r() < 0.4,
};

function runSession(seed, policyName, resumeAt) {
  const rnd = rngSeed(seed);
  const policy = POLICIES[policyName];
  const cal = runCalibration({ ageYears: 5 });
  let st = startProbe(cal, FAMILY);
  let obs = [];
  let resumed = false;
  let visits = 0;
  const perTrack = {};
  for (;;) {
    const v = nextProbe(st);
    if (!v) break;
    if (++visits > 40) return { obs, runaway: true, seed, policyName };
    perTrack[v.strand] = (perTrack[v.strand] || 0) + 1;
    const pool = servableStrandItems({ strand: v.strand, template_id: v.template });
    const fb = pool.length ? pool : servableStrandItems({ strand: v.strand });
    const ledger = ledgerFromObservations(obs);
    const items = pickVisitItems({
      pool: fb,
      itemCount: v.item_count,
      visitOffset: v.visit_offset || 0,
      servedItemIds: ledger.servedItemIds,
      promptCounts: ledger.promptCounts,
      taskKeysUsed: ledger.taskKeysUsed,
    });
    let correct = 0;
    for (const item of items) {
      const hit = policy(rnd);
      if (hit) correct++;
      obs.push({ item_id: item.item_id, outcome: hit ? 'correct' : 'incorrect', strand: v.strand, rung: item.rung });
    }
    // stop → serialize like the server draft → deep-clone back (resume)
    if (resumeAt != null && !resumed && obs.length >= resumeAt) {
      obs = JSON.parse(JSON.stringify(obs));
      resumed = true;
    }
    st = recordProbe(st, v, {
      correct, total: items.length || v.item_count || 1,
      supported: 0, insufficient: rnd() < 0.2 && correct === 0 ? 1 : 0,
    });
  }
  return { obs, seed, policyName, visits, perTrack, resumed: resumed ?? false, runaway: false };
}

function check(runs, label) {
  let fails = 0;
  const detail = [];
  const maxPrompt = { v: 0, who: '' };
  const counts = [];
  for (const r of runs) {
    if (r.runaway) { fails++; detail.push(`RUNAWAY ${r.policyName}/${r.seed}`); continue; }
    const items = r.obs.map((o) => PHASE5_ITEM_BY_ID[o.item_id]).filter(Boolean);
    counts.push(items.length);
    // R2: task uniqueness
    const tasks = items.map(taskKeyOf);
    const tSet = new Set();
    let dupN = 0;
    for (const t of tasks) { if (tSet.has(t)) dupN++; tSet.add(t); }
    if (dupN > 0) { fails++; detail.push(`R2 dup ${r.policyName}/${r.seed}: ${dupN}`); }
    // R1: prompt text ≤2
    const pc = {};
    for (const i of items) { const k = promptKeyOf(i); pc[k] = (pc[k] ?? 0) + 1; if (pc[k] > maxPrompt.v) { maxPrompt.v = pc[k]; maxPrompt.who = `${r.policyName}/${r.seed}::${k.slice(0, 40)}`; } }
    const over = Object.values(pc).filter((n) => n > 2).length;
    if (over > 0) { fails++; detail.push(`R1 over ${r.policyName}/${r.seed}: ${over} texts >2x`); }
    // B1 ceiling
    if (items.length > FAMILY.SESSION_ITEM_BUDGET) { fails++; detail.push(`B1 over ${r.policyName}/${r.seed}: ${items.length}`); }
    // B2 visits per track ≤ 2 + evidence(1)
    const overTrack = Object.entries(r.perTrack).filter(([, n]) => n > FAMILY.MAX_VISITS_PER_TRACK + FAMILY.TRACK_VISIT_EVIDENCE_EXTENSION);
    if (overTrack.length) { fails++; detail.push(`B2 over ${r.policyName}/${r.seed}: ${JSON.stringify(overTrack)}`); }
  }
  const avg = counts.reduce((a, b) => a + b, 0) / (counts.length || 1);
  console.log(`${label}: ${fails === 0 ? 'ALL PASS' : fails + ' FAIL'} | ${runs.length} sessions | items avg ${avg.toFixed(1)} / max ${Math.max(...counts)} / min ${Math.min(...counts)} | worst prompt repeats ${maxPrompt.v} (${maxPrompt.who})`);
  for (const d of detail.slice(0, 8)) console.log('   ', d);
  return fails;
}

let seed = 777;
const plain = []; const resumed = [];
for (const p of Object.keys(POLICIES)) {
  for (let i = 0; i < 100; i++) plain.push(runSession(seed++, p, null));
  for (let i = 0; i < 50; i++) resumed.push(runSession(seed++, p, 4));
}
const f1 = check(plain, 'PLAIN ');
const f2 = check(resumed, 'RESUME');

/* ── P67b CHAINED: same child, three back-to-back runs with the NEW
 * mechanisms (per-run salt + cross-session fresh-first history), which
 * mirror exactly what IrisLadderAssessment.loadVisit now does. Baseline
 * before the fix was overlap 12/12 for EVERY pair of sessions. ── */
function sessionV2(rnd, historyObs) {
  const cal = runCalibration({ ageYears: 5 });
  let st = startProbe(cal, FAMILY);
  const salt = Math.floor(rnd() * 99991); // minted once per run
  const obs = [];
  for (;;) {
    const v = nextProbe(st); if (!v) break;
    const pool = servableStrandItems({ strand: v.strand, template_id: v.template });
    const fb = pool.length ? pool : servableStrandItems({ strand: v.strand });
    const ledger = ledgerFromObservations(obs);
    const histIds = historyObs.map((o) => String(o.item_id));
    const histTasks = histIds.map((id) => PHASE5_ITEM_BY_ID[id]).filter(Boolean).map(taskKeyOf);
    const items = pickVisitItems({
      pool: fb, itemCount: v.item_count,
      visitOffset: (v.visit_offset || 0) + salt,
      servedItemIds: [...ledger.servedItemIds, ...histIds],
      promptCounts: ledger.promptCounts,
      taskKeysUsed: [...ledger.taskKeysUsed, ...histTasks],
    });
    let c = 0;
    for (const i of items) { const hit = rnd() < 0.55; if (hit) c++; obs.push({ item_id: i.item_id, outcome: hit ? 'correct' : 'incorrect', strand: v.strand, rung: i.rung }); }
    st = recordProbe(st, v, { correct: c, total: items.length || 1, supported: 0, insufficient: 0 });
    if (obs.length > 40) break;
  }
  return obs;
}
let f3 = 0;
{
  let sum12 = 0; let sum23 = 0; let worst = 0; const notes = [];
  const ids = (o) => o.map((x) => x.item_id);
  const ov = (a2, b2) => ids(a2).filter((x) => ids(b2).includes(x)).length;
  for (let child = 0; child < 60; child++) {
    const rnd = rngSeed(20000 + child);
    const s1 = sessionV2(rnd, []);
    const s2 = sessionV2(rnd, s1);
    const s3 = sessionV2(rnd, s1.concat(s2));
    const o12 = ov(s1, s2); const o23 = ov(s2, s3);
    sum12 += o12; sum23 += o23;
    worst = Math.max(worst, o12, o23);
    const t2 = s2.map((o) => PHASE5_ITEM_BY_ID[o.item_id]).filter(Boolean).map(taskKeyOf);
    if (t2.length !== new Set(t2).size) { f3++; notes.push(`child ${child}: task repeat INSIDE session2`); }
    if (s2.length > FAMILY.SESSION_ITEM_BUDGET) { f3++; notes.push(`child ${child}: over budget (${s2.length})`); }
    if (s2.length < FAMILY.SESSION_TARGET_ITEMS - 4) { f3++; notes.push(`child ${child}: starved (${s2.length})`); }
  }
  console.log(`CHAIN : ${f3 === 0 ? 'ALL PASS' : f3 + ' FAIL'} | avg overlap s1-s2 ${(sum12 / 60).toFixed(1)}/12 | s2-s3 ${(sum23 / 60).toFixed(1)}/12 | worst ${worst}/12 (baseline: 12/12 always)`);
  for (const n of notes.slice(0, 5)) console.log('   ', n);
}
process.exit(f1 + f2 + f3 === 0 ? 0 : 1);

