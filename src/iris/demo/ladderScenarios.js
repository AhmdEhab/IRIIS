/**
 * Deterministic demo scenarios for the LADDER adaptive engine.
 *
 * ── WHY A SECOND SCENARIO FILE ────────────────────────────────────────────
 * `scenarios.js` demonstrates the original goal/level pathway engine and, most
 * importantly, diagnosis blindness. It is still correct and still runs. But the
 * engine that now drives every screen a child touches is the skill-estimate
 * ladder in `engines/skillEstimate.js`, and a demo that does not exercise the
 * live engine proves nothing about the live product. These three scenarios run
 * the same functions the app runs, on synthetic evidence.
 *
 * ── DETERMINISM ───────────────────────────────────────────────────────────
 * There is no randomness here at all — not seeded randomness, none. Every
 * scenario is a fixed list of (correct, total) pairs fed to `updateEstimate()`,
 * which is pure. Run it on any machine, any day, any number of times: identical
 * output. That is a hard requirement for a live demo, and `expected` on each
 * scenario is the assertion that makes a drift fail loudly instead of quietly
 * producing a different story on stage.
 *
 * ── EVERYTHING HERE IS SYNTHETIC ──────────────────────────────────────────
 * No real child produced any of this. Each scenario carries `is_synthetic:
 * true` and a `label`, and anything written to the database from a demo run
 * must carry that flag through. These are illustrations of the rule set, not
 * evidence about children and not results.
 */
import {
  newEstimate, updateEstimate, MOVES,
} from '../engines/skillEstimate.js';
import { baseRungOf, topRungOf, STRAND_BY_ID } from '../ladders/index.js';

/** One strand, chosen because its ladder is tall enough to climb and fall in. */
const STRAND = 'LIT.LETTER_NAME';
const LADDER = STRAND_BY_ID[STRAND].ladder;
const TRACK = STRAND_BY_ID[STRAND].track;

/**
 * Play a fixed sequence of sessions against a fresh estimate.
 *
 * Timestamps are fixed strings rather than `new Date()` so two runs of the
 * demo are byte-identical, including the evidence rows.
 */
function playFixed({ startRung, rounds, modality = 'TPL-AR_LETTER_NAME' }) {
  let estimate = newEstimate({ strandId: STRAND, rung: startRung, at: '2026-01-01T09:00:00.000Z' });
  const steps = [];

  rounds.forEach(([correct, total], i) => {
    const before = estimate.rung;
    estimate = updateEstimate(estimate, {
      rung: before,
      correct,
      total,
      supported: 0,
      modality,
      session_id: `DEMO-S${i + 1}`,
      at: `2026-01-${String(i + 1).padStart(2, '0')}T09:00:00.000Z`,
    });
    const d = estimate.last_move;
    steps.push({
      session: i + 1,
      observed: { correct, total, accuracy: total > 0 ? correct / total : null },
      move: d.move,
      reason_code: d.reason,
      rule_id: d.rule_id,
      from_rung: d.from_rung,
      to_rung: d.to_rung,
      consecutive_high: d.consecutive_high,
      consecutive_low: d.consecutive_low,
      rung_after: estimate.rung,
      confidence: estimate.confidence,
    });
  });

  return { estimate, steps };
}

/** The move sequence a scenario produced, for asserting against `expected`. */
const movesOf = (steps) => steps.map((s) => s.move);

/**
 * SCENARIO A — a child performing strongly.
 *
 * Two consecutive sessions at or above the climb bar. The first does NOT move
 * the rung: one good session is a good day, not a skill. The second corroborates
 * it and the pathway steps up. Difficulty increases *because* two independent
 * observations agreed, and the record says exactly that.
 */
export function ladderScenarioA() {
  const startRung = 2;
  const rounds = [[5, 5], [5, 5], [5, 5], [5, 5]];
  const { estimate, steps } = playFixed({ startRung, rounds });
  return {
    id: 'A',
    label: 'Strong performance — difficulty increases',
    is_synthetic: true,
    strand: STRAND,
    start_rung: startRung,
    steps,
    final_rung: estimate.rung,
    expected: {
      moves: [MOVES.HOLD, MOVES.CLIMB, MOVES.HOLD, MOVES.CLIMB],
      final_rung: startRung + 2,
      first_reason: 'HIGH_BUT_NEEDS_CORROBORATION',
      climb_reason: 'TWO_CONSECUTIVE_HIGH',
    },
    claim: 'Difficulty rose only after two corroborating observations at the same rung.',
  };
}

/**
 * SCENARIO B — a child struggling.
 *
 * The cascade is deliberately gentle before it is decisive: add support, then
 * change how the question is asked, and only then step down. A system that
 * dropped the rung on the first bad session would be reading a bad morning as a
 * missing skill.
 */
export function ladderScenarioB() {
  const startRung = 4;
  const rounds = [[1, 5], [0, 5], [1, 5], [0, 5]];
  const { estimate, steps } = playFixed({ startRung, rounds });
  return {
    id: 'B',
    label: 'Struggling — support first, then modality, then step down',
    is_synthetic: true,
    strand: STRAND,
    start_rung: startRung,
    steps,
    final_rung: estimate.rung,
    expected: {
      moves: [MOVES.HOLD_ADD_SCAFFOLD, MOVES.SHIFT_MODALITY, MOVES.BACKSTEP, MOVES.HOLD_ADD_SCAFFOLD],
      final_rung: startRung - 1,
      ordering: 'scaffold before modality before backstep',
    },
    claim: 'Support and a change of format were tried before the difficulty was reduced.',
  };
}

/**
 * SCENARIO C — a child performing inconsistently.
 *
 * Sessions land in the middle band: too good to reduce, not good enough to
 * raise. The engine holds the rung and rotates the format, which is the
 * conservative move — it keeps gathering evidence at the same difficulty rather
 * than reading noise as a trend in either direction.
 */
export function ladderScenarioC() {
  const startRung = 3;
  const rounds = [[3, 5], [4, 5], [3, 5], [3, 5]];
  const { estimate, steps } = playFixed({ startRung, rounds });
  return {
    id: 'C',
    label: 'Mixed performance — conservative, no unjustified move',
    is_synthetic: true,
    strand: STRAND,
    start_rung: startRung,
    steps,
    final_rung: estimate.rung,
    expected: {
      // Four sessions, four identical conservative holds. The recency window
      // keeps the run in the middle band throughout, so there is never a point
      // at which the engine has grounds to move in either direction.
      moves: [
        MOVES.HOLD_ROTATE_FORMAT, MOVES.HOLD_ROTATE_FORMAT,
        MOVES.HOLD_ROTATE_FORMAT, MOVES.HOLD_ROTATE_FORMAT,
      ],
      final_rung: startRung,
      no_climb: true,
      no_backstep: true,
    },
    claim: 'Inconsistent evidence moved nothing: the rung is unchanged after four sessions.',
  };
}

/**
 * SCENARIO D — the ladder ends are hard walls.
 *
 * Included because "adaptive" systems fail most visibly at their boundaries: a
 * child at the top of what the content covers must be held there with an honest
 * reason, not pushed into a rung that does not exist.
 */
export function ladderScenarioD() {
  const top = topRungOf(LADDER, TRACK);
  const base = baseRungOf(LADDER, TRACK);
  const atTop = playFixed({ startRung: top, rounds: [[5, 5], [5, 5]] });
  const atBase = playFixed({ startRung: base, rounds: [[0, 5], [0, 5], [0, 5]] });
  return {
    id: 'D',
    label: 'Ladder boundaries — held, never pushed past the content',
    is_synthetic: true,
    strand: STRAND,
    top: { rung: top, steps: atTop.steps, final_rung: atTop.estimate.rung },
    base: { rung: base, steps: atBase.steps, final_rung: atBase.estimate.rung },
    expected: {
      top_move: MOVES.AT_TOP, top_reason: 'LADDER_TOP_REACHED', top_rung: top,
      base_move: MOVES.AT_BASE, base_reason: 'ALREADY_AT_LADDER_BASE', base_rung: base,
    },
    claim: 'Neither end of the ladder can be walked off, however the child performs.',
  };
}

/**
 * Run all four and check each against its own `expected` block.
 *
 * Returns `{ ok, scenarios, failures }`. The demo script exits non-zero on a
 * failure, so a drift in the rule set is caught by CI rather than on stage.
 */
export function runLadderScenarios() {
  const failures = [];
  const a = ladderScenarioA();
  const b = ladderScenarioB();
  const c = ladderScenarioC();
  const d = ladderScenarioD();

  const eq = (name, got, want) => {
    if (JSON.stringify(got) !== JSON.stringify(want)) {
      failures.push(`${name}: expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
    }
  };

  eq('A moves', movesOf(a.steps), a.expected.moves);
  eq('A final rung', a.final_rung, a.expected.final_rung);
  eq('A first reason', a.steps[0].reason_code, a.expected.first_reason);

  eq('B moves', movesOf(b.steps), b.expected.moves);
  eq('B final rung', b.final_rung, b.expected.final_rung);

  eq('C moves', movesOf(c.steps), c.expected.moves);
  eq('C final rung', c.final_rung, c.expected.final_rung);
  if (movesOf(c.steps).includes(MOVES.CLIMB)) failures.push('C climbed on inconsistent evidence');
  if (movesOf(c.steps).includes(MOVES.BACKSTEP)) failures.push('C backstepped on inconsistent evidence');

  eq('D top move', d.top.steps.at(-1).move, d.expected.top_move);
  eq('D top rung', d.top.final_rung, d.expected.top_rung);
  eq('D base move', d.base.steps.at(-1).move, d.expected.base_move);
  eq('D base rung', d.base.final_rung, d.expected.base_rung);

  return { ok: failures.length === 0, scenarios: [a, b, c, d], failures, is_synthetic: true };
}
