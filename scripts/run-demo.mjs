/** Headless run of all three demo scenarios — proof the engines work with no UI. */
import { scenarioA, scenarioB, scenarioC } from '../src/iris/demo/scenarios.js';

const line = (s) => console.log(s);
line('\n╔══════════════════════════════════════════════════════════════╗');
line('║  IRIS MVP — DEMO SCENARIOS (all data synthetic)              ║');
line('╚══════════════════════════════════════════════════════════════╝');

const A = scenarioA();
line('\n── SCENARIO A — successful progression ──────────────────────');
A.steps.filter(s => String(s.step).startsWith('SESSION')).forEach((s, i) =>
  line(`  session ${i+1}: band=${s.band} acc=${Math.round(s.accuracy*100)}%  →  ${s.rule} ${s.reason}  L${s.from_level}→L${s.to_level}`));

const B = scenarioB();
line('\n── SCENARIO B — struggling child ───────────────────────────');
B.steps.filter(s => String(s.step).startsWith('SESSION')).forEach((s, i) =>
  line(`  session ${i+1}: band=${s.band} acc=${Math.round(s.accuracy*100)}%  →  ${s.rule} ${s.reason}  L${s.from_level}→L${s.to_level}${s.to_template !== s.from_template ? `  [${s.from_template} → ${s.to_template}]` : ''}`));
line(`  ordering check: simplify before level reduction = ${
  B.decisions.findIndex(d=>d.reason_code==='SIMPLIFY_SCAFFOLD') < B.decisions.findIndex(d=>d.reason_code==='PREREQ_BACKSTEP')}`);

const C = scenarioC();
line('\n── SCENARIO C — DIAGNOSIS BLINDNESS ────────────────────────');
C.runs.forEach(r => line(
  `  ${r.condition.padEnd(18)} goal=${r.assignments[0].goal_id.padEnd(14)} L${r.assignments[0].level}  ` +
  `path=${r.decisions.map(d=>d.reason_code).join('→').padEnd(48)} accommodations=${r.accommodations_only.join(',')}`));
line(`\n  IDENTICAL OUTCOMES ACROSS ALL ${C.conditions_tested.length} DIAGNOSES: ${C.identical_outcomes ? '✅ PASS' : '❌ FAIL'}`);
line(`  ${C.claim}\n`);

process.exitCode = C.identical_outcomes ? 0 : 1;
