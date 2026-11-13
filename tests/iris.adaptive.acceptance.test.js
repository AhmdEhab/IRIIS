/**
 * Adaptive engine acceptance tests.
 *
 * ── WHAT THESE ARE FOR ────────────────────────────────────────────────────
 * The other suites check that the engine's pieces work. These check the four
 * claims IRIS actually makes to a judge or a parent, and they are written so
 * that they fail loudly if any of them stops being true:
 *
 *   1. The decision comes from OBSERVED PERFORMANCE — not from the child's
 *      diagnosis, age, name, or any static profile field.
 *   2. The decision is DETERMINISTIC — the same evidence always yields the
 *      same move, every time, on every machine. Nothing is sampled.
 *   3. The decision is BOUNDED — it can never walk off either end of a ladder.
 *   4. The decision DEGRADES SAFELY — missing or malformed input produces a
 *      hold with an explicit "no evidence" reason, never a guess and never a
 *      crash.
 *
 * A test here that starts failing is a product regression, not a test that
 * needs relaxing.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  newEstimate, updateEstimate, decideMove, recordObservation,
  confidenceOf, accuracyOf, clampRung,
  MOVES, PROVENANCE, ESTIMATE_CONFIG,
} from '../src/iris/engines/skillEstimate.js';
import { baseRungOf, topRungOf, nextRung, STRAND_BY_ID } from '../src/iris/ladders/index.js';

const STRAND = 'LIT.LETTER_NAME';
const LADDER = STRAND_BY_ID[STRAND].ladder;
const TRACK = STRAND_BY_ID[STRAND].track;

/** A fresh estimate parked at a given rung. */
const at = (rung) => newEstimate({ strandId: STRAND, rung, at: '2026-01-01T00:00:00.000Z' });

/** Apply a run of sessions, each `correct` out of `total`. */
const play = (estimate, rounds) =>
  rounds.reduce((e, [correct, total], i) =>
    updateEstimate(e, {
      rung: e.rung, correct, total,
      modality: 'TPL-A', session_id: `S${i}`, at: `2026-01-0${(i % 9) + 1}T00:00:00.000Z`,
    }), estimate);

/* ── 1. the decision follows observed performance ────────────────────────── */

test('acceptance: two strong sessions climb, and the reason names the evidence', () => {
  const e = play(at(2), [[5, 5], [5, 5]]);
  assert.equal(e.last_move.move, MOVES.CLIMB);
  assert.equal(e.last_move.reason, 'TWO_CONSECUTIVE_HIGH');
  assert.equal(e.last_move.to_rung, nextRung(LADDER, TRACK, 2));
  assert.equal(e.rung, nextRung(LADDER, TRACK, 2));
});

test('acceptance: one strong session is NOT enough to climb', () => {
  const e = play(at(2), [[5, 5]]);
  assert.equal(e.last_move.move, MOVES.HOLD);
  assert.equal(e.last_move.reason, 'HIGH_BUT_NEEDS_CORROBORATION');
  assert.equal(e.rung, 2, 'a single good session must not move the rung');
});

test('acceptance: the weak cascade runs scaffold → modality → backstep, in that order', () => {
  let e = at(3);
  e = play(e, [[0, 5]]);
  assert.equal(e.last_move.move, MOVES.HOLD_ADD_SCAFFOLD, 'first low adds support');
  assert.equal(e.rung, 3);

  e = play(e, [[0, 5]]);
  assert.equal(e.last_move.move, MOVES.SHIFT_MODALITY, 'second low changes how it is asked');
  assert.equal(e.rung, 3, 'trying another modality must not move the rung');

  e = play(e, [[0, 5]]);
  assert.equal(e.last_move.move, MOVES.BACKSTEP, 'third low steps down');
  assert.equal(e.last_move.reason, 'THREE_CONSECUTIVE_LOW');
  assert.equal(e.rung, 2);
});

test('acceptance: partial mastery holds the rung and rotates the format', () => {
  const e = play(at(2), [[3, 5]]); // 0.6 — above the hold floor, below the climb bar
  assert.equal(e.last_move.move, MOVES.HOLD_ROTATE_FORMAT);
  assert.equal(e.last_move.reason, 'PARTIAL_MASTERY_ROTATE_FORMAT');
  assert.equal(e.rung, 2);
});

test('acceptance: a good session resets the low streak, so recovery is immediate', () => {
  let e = play(at(3), [[0, 5], [0, 5]]);
  assert.equal(e.consecutive_low, 2);
  e = play(e, [[5, 5]]);
  assert.equal(e.consecutive_low, 0, 'one good session must clear the backstep countdown');
  assert.equal(e.rung, 3);
});

/* ── 2. the decision ignores everything that is not performance ──────────── */

test('acceptance: identical evidence decides identically whatever else is on the record', () => {
  /**
   * The engine takes an estimate, not a child. This pins that: fields a
   * diagnosis-aware system would reach for are attached to the object and the
   * decision must be byte-identical with and without them.
   */
  const base = play(at(2), [[4, 5], [5, 5]]);
  const contaminated = {
    ...base,
    condition: 'DOWN_SYNDROME',
    diagnosis: 'ASD',
    age_years: 4,
    iq: 55,
    displayName: 'Yara',
    severity: 'SEVERE',
  };
  assert.deepEqual(decideMove(contaminated), decideMove(base));
});

test('acceptance: the same evidence decides the same way on every call', () => {
  const e = play(at(2), [[4, 5], [5, 5]]);
  const first = JSON.stringify(decideMove(e));
  for (let i = 0; i < 50; i++) {
    assert.equal(JSON.stringify(decideMove(e)), first, `call ${i} diverged`);
  }
});

test('acceptance: replaying the same session history reproduces the same state', () => {
  const rounds = [[4, 5], [5, 5], [1, 5], [0, 5], [3, 5], [5, 5], [5, 5]];
  const a = play(at(1), rounds);
  const b = play(at(1), rounds);
  const strip = (x) => ({ ...x, evidence: x.evidence.map((r) => ({ ...r, at: null })) });
  assert.deepEqual(strip(a), strip(b));
});

test('acceptance: decideMove does not mutate the estimate it is given', () => {
  const e = play(at(2), [[5, 5], [5, 5]]);
  const before = JSON.stringify(e);
  decideMove(e);
  assert.equal(JSON.stringify(e), before);
});

/* ── 3. the decision is bounded by the ladder ────────────────────────────── */

test('acceptance: a child at the top of the ladder is held, not pushed past it', () => {
  const top = topRungOf(LADDER, TRACK);
  const e = play(at(top), [[5, 5], [5, 5]]);
  assert.equal(e.last_move.move, MOVES.AT_TOP);
  assert.equal(e.last_move.reason, 'LADDER_TOP_REACHED');
  assert.equal(e.last_move.to_rung, top);
  assert.equal(e.rung, top);
});

test('acceptance: a child at the base of the ladder is held, not pushed below it', () => {
  const base = baseRungOf(LADDER, TRACK);
  const e = play(at(base), [[0, 5], [0, 5], [0, 5]]);
  assert.equal(e.last_move.move, MOVES.AT_BASE);
  assert.equal(e.last_move.reason, 'ALREADY_AT_LADDER_BASE');
  assert.equal(e.rung, base);
});

test('acceptance: a long perfect run never leaves the ladder', () => {
  let e = at(baseRungOf(LADDER, TRACK));
  for (let i = 0; i < 60; i++) e = play(e, [[5, 5]]);
  assert.equal(e.rung, topRungOf(LADDER, TRACK));
  assert.equal(e.last_move.move, MOVES.AT_TOP);
});

test('acceptance: a long failing run never leaves the ladder', () => {
  let e = at(topRungOf(LADDER, TRACK));
  for (let i = 0; i < 60; i++) e = play(e, [[0, 5]]);
  assert.equal(e.rung, baseRungOf(LADDER, TRACK));
  assert.equal(e.last_move.move, MOVES.AT_BASE);
});

test('acceptance: a rung carried forward from an older rule pack is clamped into range', () => {
  assert.equal(clampRung(LADDER, TRACK, 999), topRungOf(LADDER, TRACK));
  assert.equal(clampRung(LADDER, TRACK, -50), baseRungOf(LADDER, TRACK));
});

/* ── 4. missing and malformed input degrade safely ───────────────────────── */

test('acceptance: no evidence yields a hold that says so, never a guess', () => {
  const d = decideMove(at(2));
  assert.equal(d.move, MOVES.HOLD);
  assert.equal(d.reason, 'NO_SCORED_EVIDENCE');
  assert.equal(d.accuracy, null, 'an unmeasured skill must report null, never 0');
  assert.equal(d.to_rung, d.from_rung);
});

test('acceptance: calibration probes place a child but never score them', () => {
  const e = updateEstimate(at(2), { rung: 2, correct: 0, total: 5, calibration: true });
  assert.equal(e.rung, 2, 'calibration must not move the rung');
  assert.equal(e.last_move, null, 'calibration must not produce a move');
  assert.equal(e.provenance, PROVENANCE.CALIBRATED);
});

test('acceptance: a zero-item observation cannot manufacture an accuracy', () => {
  const e = updateEstimate(at(2), { rung: 2, correct: 0, total: 0 });
  assert.equal(e.last_move.reason, 'NO_SCORED_EVIDENCE');
  assert.equal(e.last_move.accuracy, null);
  assert.equal(e.rung, 2);
});

test('acceptance: an observation with missing counts is treated as no evidence', () => {
  const e = updateEstimate(at(2), { rung: 2 }); // no correct, no total
  assert.equal(e.last_move.move, MOVES.HOLD);
  assert.equal(e.last_move.reason, 'NO_SCORED_EVIDENCE');
  assert.equal(e.rung, 2);
});

test('acceptance: evidence from a different rung does not decide the current one', () => {
  let e = at(4);
  e = recordObservation(e, { rung: 1, correct: 5, total: 5 }); // mastery two rungs down
  const d = decideMove(e);
  assert.equal(d.reason, 'NO_SCORED_EVIDENCE',
    'work at another rung is not evidence about this one');
  assert.equal(d.to_rung, 4);
});

test('acceptance: an unknown strand is rejected at construction, not silently accepted', () => {
  assert.throws(() => newEstimate({ strandId: 'LIT.NOT_A_REAL_STRAND', rung: 0 }), /unknown strand/);
});

test('acceptance: accuracy over an empty or unscored set is null, not zero', () => {
  assert.equal(accuracyOf([]), null);
  assert.equal(accuracyOf([{ correct: 0, total: 0 }]), null);
});

/* ── 5. confidence is earned, never asserted ─────────────────────────────── */

test('acceptance: confidence starts LOW and cannot be HIGH on a single session', () => {
  assert.equal(at(2).confidence, 'LOW');
  const one = play(at(2), [[5, 5]]);
  assert.notEqual(one.confidence, 'HIGH',
    `one session must not reach HIGH (needs ${ESTIMATE_CONFIG.MIN_SESSIONS_FOR_HIGH_CONFIDENCE})`);
});

test('acceptance: confidence never claims more than the evidence supports', () => {
  const thin = recordObservation(at(2), { rung: 2, correct: 1, total: 1 });
  assert.notEqual(confidenceOf(thin), 'HIGH',
    `a single item must not reach HIGH (needs ${ESTIMATE_CONFIG.MIN_ITEMS_FOR_HIGH_CONFIDENCE} items)`);
});

/* ── 6. every decision is explainable ────────────────────────────────────── */

test('acceptance: every reachable move carries a rule id and a specific reason code', () => {
  /**
   * Reason codes are UPPER_SNAKE, so this matches whole segments rather than
   * substrings — a plain /ready/i would flag ALREADY_AT_LADDER_BASE, which is
   * one of the most specific reasons the engine produces.
   */
  const GENERIC = /(^|_)(AI|MODEL|MAGIC|READY|SEEMED|SOMEHOW|DECIDED|GOOD|BAD|BETTER|WORSE)(_|$)/;
  const seen = new Set();

  const cases = [
    at(2),                                                   // no evidence
    play(at(2), [[5, 5]]),                                   // high, uncorroborated
    play(at(2), [[5, 5], [5, 5]]),                           // climb
    play(at(topRungOf(LADDER, TRACK)), [[5, 5], [5, 5]]),    // at top
    play(at(2), [[3, 5]]),                                   // partial
    play(at(3), [[0, 5]]),                                   // one low
    play(at(3), [[0, 5], [0, 5]]),                           // two low
    play(at(3), [[0, 5], [0, 5], [0, 5]]),                   // three low
    play(at(baseRungOf(LADDER, TRACK)), [[0, 5], [0, 5], [0, 5]]), // at base
  ];

  for (const e of cases) {
    const d = e.last_move ?? decideMove(e);
    assert.equal(d.rule_id, 'R-EST-001', `missing rule id for ${d.move}`);
    assert.ok(d.reason && d.reason.length > 3, `missing reason for ${d.move}`);
    assert.ok(!GENERIC.test(d.reason), `reason "${d.reason}" is hand-waving, not evidence`);
    assert.ok(Object.values(MOVES).includes(d.move), `unknown move ${d.move}`);
    assert.equal(typeof d.from_rung, 'number');
    assert.equal(typeof d.to_rung, 'number');
    seen.add(d.move);
  }

  // Every move the cascade can reach must have been exercised above, so a new
  // move cannot be added without an accompanying case here.
  for (const m of Object.values(MOVES)) {
    assert.ok(seen.has(m), `move ${m} is reachable but has no acceptance case`);
  }
});

test('acceptance: a move that holds the rung reports to_rung === from_rung', () => {
  const holds = [MOVES.HOLD, MOVES.HOLD_ROTATE_FORMAT, MOVES.HOLD_ADD_SCAFFOLD,
    MOVES.SHIFT_MODALITY, MOVES.AT_TOP, MOVES.AT_BASE];
  const cases = [
    at(2), play(at(2), [[5, 5]]), play(at(2), [[3, 5]]),
    play(at(3), [[0, 5]]), play(at(3), [[0, 5], [0, 5]]),
    play(at(topRungOf(LADDER, TRACK)), [[5, 5], [5, 5]]),
    play(at(baseRungOf(LADDER, TRACK)), [[0, 5], [0, 5], [0, 5]]),
  ];
  for (const e of cases) {
    const d = e.last_move ?? decideMove(e);
    if (holds.includes(d.move)) assert.equal(d.to_rung, d.from_rung, `${d.move} moved the rung`);
  }
});
