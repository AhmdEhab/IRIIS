/**
 * The demo scenarios are load-bearing: they are what gets shown when someone
 * asks IRIS to prove it adapts. A demo that quietly tells a different story
 * after a rule change is worse than no demo, so the scenario expectations are
 * asserted here and run with the rest of the suite, not only by hand before a
 * presentation.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  runLadderScenarios, ladderScenarioA, ladderScenarioB, ladderScenarioC,
} from '../src/iris/demo/ladderScenarios.js';
import { MOVES } from '../src/iris/engines/skillEstimate.js';

test('ladder demo: every scenario matches its documented expectation', () => {
  const r = runLadderScenarios();
  assert.equal(r.ok, true, r.failures.join('\n'));
});

test('ladder demo: the run is deterministic across repeated invocations', () => {
  const once = JSON.stringify(runLadderScenarios());
  for (let i = 0; i < 5; i++) {
    assert.equal(JSON.stringify(runLadderScenarios()), once, `run ${i} diverged`);
  }
});

test('ladder demo: A raises difficulty and B lowers it', () => {
  const a = ladderScenarioA();
  const b = ladderScenarioB();
  assert.ok(a.final_rung > a.start_rung, 'strong performance must end higher');
  assert.ok(b.final_rung < b.start_rung, 'struggling must end lower');
});

test('ladder demo: B tries support and a format change before reducing difficulty', () => {
  const moves = ladderScenarioB().steps.map((s) => s.move);
  const scaffold = moves.indexOf(MOVES.HOLD_ADD_SCAFFOLD);
  const modality = moves.indexOf(MOVES.SHIFT_MODALITY);
  const back = moves.indexOf(MOVES.BACKSTEP);
  assert.ok(scaffold >= 0 && modality >= 0 && back >= 0, moves.join(','));
  assert.ok(scaffold < modality, 'support must be offered before the format changes');
  assert.ok(modality < back, 'the format must change before the difficulty drops');
});

test('ladder demo: C moves nothing on inconsistent evidence', () => {
  const c = ladderScenarioC();
  assert.equal(c.final_rung, c.start_rung);
  const moves = c.steps.map((s) => s.move);
  assert.ok(!moves.includes(MOVES.CLIMB));
  assert.ok(!moves.includes(MOVES.BACKSTEP));
});

test('ladder demo: every scenario is flagged synthetic', () => {
  const r = runLadderScenarios();
  assert.equal(r.is_synthetic, true);
  for (const s of r.scenarios) assert.equal(s.is_synthetic, true, `${s.id} is not flagged synthetic`);
});

test('ladder demo: every step carries a reason code and the rule that produced it', () => {
  for (const s of runLadderScenarios().scenarios) {
    const steps = s.steps ?? [...s.top.steps, ...s.base.steps];
    for (const step of steps) {
      assert.ok(step.reason_code, `${s.id} session ${step.session} has no reason code`);
      assert.equal(step.rule_id, 'R-EST-001');
    }
  }
});
