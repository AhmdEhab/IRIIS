/**
 * Headless run of the ladder adaptive scenarios.
 *
 * This is the one to run in front of a judge who asks "show me the adaptation".
 * It uses the same engine the app uses, contains no randomness, needs no
 * server, no browser and no API key, and exits non-zero if any scenario stops
 * behaving as documented.
 *
 *   npm run demo:ladder
 */
import { runLadderScenarios } from '../src/iris/demo/ladderScenarios.js';

const pct = (a) => (a == null ? ' —  ' : `${String(Math.round(a * 100)).padStart(3)}%`);
const line = (s = '') => console.log(s);

const { ok, scenarios, failures } = runLadderScenarios();

line('\n╔════════════════════════════════════════════════════════════════════════╗');
line('║  IRIS — ADAPTIVE LADDER SCENARIOS                                      ║');
line('║  Deterministic. No randomness, no network, no model call.              ║');
line('║  ALL DATA SYNTHETIC — illustrations of the rule set, not results.      ║');
line('╚════════════════════════════════════════════════════════════════════════╝');

const printSteps = (steps) => {
  for (const s of steps) {
    const moved = s.from_rung === s.to_rung ? `rung ${s.from_rung} held ` : `rung ${s.from_rung} → ${s.to_rung}`;
    line(
      `   session ${s.session}  ${String(s.observed.correct)}/${s.observed.total} = ${pct(s.observed.accuracy)}` +
      `   ${s.move.padEnd(19)} ${moved}   ${s.reason_code.padEnd(30)} [${s.rule_id}]`
    );
  }
};

for (const s of scenarios) {
  line(`\n── SCENARIO ${s.id} — ${s.label} ${'─'.repeat(Math.max(0, 50 - s.label.length))}`);
  if (s.steps) {
    printSteps(s.steps);
    line(`   ⇒ ${s.claim}`);
  } else {
    line(`   at the ladder top (rung ${s.top.rung}), answering everything correctly:`);
    printSteps(s.top.steps);
    line(`   at the ladder base (rung ${s.base.rung}), answering everything incorrectly:`);
    printSteps(s.base.steps);
    line(`   ⇒ ${s.claim}`);
  }
}

line('\n────────────────────────────────────────────────────────────────────────');
if (ok) {
  line('  ✅ every scenario matched its documented expectation exactly');
} else {
  line('  ❌ the rule set has drifted from what these scenarios document:');
  failures.forEach((f) => line(`     • ${f}`));
}
line('  Reminder: synthetic evidence. No child produced any of this.\n');

process.exitCode = ok ? 0 : 1;
