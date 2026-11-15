/**
 * av2 — engine & content-lane acceptance tests (spec §1 §2 §4 §6 §7 §11).
 *
 * These pin the six things av2 actually promises, each written so it fails if
 * the promise quietly stops being true:
 *
 *   1. The six-outcome vocabulary is ONE frozen list, shared by both ends.
 *   2. Support is a REAL count: two independent answers and two answered with
 *      a scaffold are not the same measurement.
 *   3. `insufficient` is in no denominator, and a strand whose rows are all
 *      insufficient asks for more information instead of reporting a score,
 *      a zero, or a floor.
 *   4. The insufficient walk terminates: paired modality once, then
 *      needs_more_information, then never re-presented.
 *   5. An invalid visit moves nothing — no indicator, no estimate, no rung.
 *   6. The §7 envelope round-trips through the stored record and hydrates to
 *      the same conclusions, while a phase5-1.0.0 record still hydrates
 *      exactly as it did before av2 existed.
 *
 * Everything here goes through the public functions the UI calls, because a
 * guarantee that only holds on a private path is not a guarantee.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  OUTCOME, visitCountsFromObservations, indicatorFor, scoreProbe, rowsForStrand,
} from '../src/iris/engines/indicators.js';
import {
  ESTIMATE_CONFIG, accuracyOf, supportRatioOf, presentedOf, newEstimate,
  recordObservation, updateEstimate, confidenceOf,
} from '../src/iris/engines/skillEstimate.js';
import {
  startProbe, nextProbe, recordProbe, runProbe, PROBE_STOP, PROBE_CONFIG,
} from '../src/iris/engines/adaptiveProbe.js';
import { runCalibration } from '../src/iris/engines/calibration.js';
import {
  runLadderAssessment, finaliseLadderAssessment, toAssessmentRecord,
  fromAssessmentRecord, gatesFromCaregiver, gatedTracks, allTrackKeys,
  gatingObservations, observationSkillIndex, accommodationDefaults,
  AV2_RULE_PACK_VERSION, PHASE5_RULE_PACK_VERSION, OPPORTUNITY_GATE,
  OUTCOME as OUTCOME_via_journey,
} from '../src/iris/journey.js';
import {
  PHASE5_BANK, bankCoverage, servableStrandItems,
} from '../src/iris/content/phase5Bank.js';
import {
  PHASE5_TEMPLATES, TARGET_SKILL_BY_TEMPLATE, templatesForStrand,
} from '../src/iris/content/phase5Templates.js';
import { TEMPLATE_BY_ID } from '../src/iris/content/templates.js';
import {
  ALL_STRANDS, STRAND_BY_ID, validateLadders, LADDER_IDS, tracksFor, baseRungOf,
} from '../src/iris/ladders/index.js';
import { ATTENTION_POLICY } from '../src/iris/ladders/memory.js';

// ── helpers ────────────────────────────────────────────────────────────────
const cal = (map) => Object.entries(map).map(([probe_id, is_correct]) => ({ probe_id, is_correct }));
const ALL_CORRECT = cal({
  'CAL-01': true, 'CAL-02': true, 'CAL-03': true, 'CAL-04': true, 'CAL-05': true,
  'CAL-06': true, 'CAL-07': true, 'CAL-08': true, 'CAL-09': true, 'CAL-10': true,
});
/** One probe row, in the shape recordProbe writes. */
const row = (over = {}) => ({
  strand: 'VSP.MATCH', ladder: 'VSP', track: 'MAIN', rung: 0,
  correct: 0, total: 3, supported: 0, insufficient: 0,
  modality: 'TPL-AR_VSP_MATCH', dialect_distance: 'UNKNOWN',
  calibration: false, used_modality_pair: false, ...over,
});
/** A minimal, finished single-track probe state, for scoring-only tests. */
const probeOf = (results) => ({
  results,
  tracks: {
    'VSP:MAIN': {
      rescue: [], ladder: 'VSP', track: 'MAIN', rung: 0, entry_rung: 0,
      visited: [...new Set(results.map((r) => r.strand))], empty_rungs: 0, visits: results.length,
      modality_tried: {}, resampled: {}, insufficient_retry: {}, needs_more_information: {},
      evidence: 'TRACK_OPEN_AT_BASE', done: true, stop_reason: PROBE_STOP.LADDER_TOP,
    },
  },
  items_used: results.reduce((n, r) => n + r.total, 0),
  finished: true,
});
/** Drive a whole probe with a scripted responder, with a loop guard. */
function drive(calibration, respond, maxVisits = 400) {
  let state = startProbe(calibration);
  let guard = 0;
  for (;;) {
    const visit = nextProbe(state);
    if (!visit) break;
    if (++guard > maxVisits) throw new Error(`probe did not terminate in ${maxVisits} visits`);
    state = recordProbe(state, visit, respond(visit));
  }
  return state;
}

// ══ §1 — THE SIX OUTCOMES ════════════════════════════════════════════════
test('OUTCOME: six outcomes, frozen, and the same list journey re-exports', () => {
  assert.deepEqual([...OUTCOME], [
    'demonstrated_independent',
    'demonstrated_with_support',
    'not_demonstrated',
    'insufficient',
    'no_opportunity',
    'invalid_administration',
  ]);
  assert.equal(Object.isFrozen(OUTCOME), true, 'the outcome list is mutable');
  assert.equal(new Set(OUTCOME).size, 6, 'an outcome is listed twice');
  // ONE vocabulary: journey hands back the same array, so a UI cannot grow a
  // seventh outcome the engine will quietly refuse to count.
  assert.equal(OUTCOME_via_journey, OUTCOME);
});

test('OUTCOME: item outcomes become counts, and only these outcomes count', () => {
  const obs = [
    { outcome: 'demonstrated_independent' },
    { outcome: 'demonstrated_independent' },
    { outcome: 'demonstrated_with_support' },
    { outcome: 'not_demonstrated' },
    { outcome: 'insufficient' },
    { outcome: 'no_opportunity' },          // never offered → not in a total
    { outcome: 'invalid_administration' },  // not administered → not in a total
    { outcome: 'nonsense' },                 // outside the vocabulary → dropped
    null,
  ];
  assert.deepEqual(visitCountsFromObservations(obs), {
    correct: 2, supported: 1, missed: 1, insufficient: 1, total: 5,
  });
  assert.deepEqual(visitCountsFromObservations([]), {
    correct: 0, supported: 0, missed: 0, insufficient: 0, total: 0,
  });
  assert.deepEqual(visitCountsFromObservations(null), {
    correct: 0, supported: 0, missed: 0, insufficient: 0, total: 0,
  });
  // `correct` is INDEPENDENT ONLY. If support leaked in here, the independence
  // term would be computed from a number that already swallowed it.
  const allSupported = visitCountsFromObservations([
    { outcome: 'demonstrated_with_support' }, { outcome: 'demonstrated_with_support' },
  ]);
  assert.equal(allSupported.correct, 0);
  assert.equal(allSupported.supported, 2);
  assert.equal(allSupported.total, 2);
});

// ══ §1 — SUPPORT IS A REAL COUNT ═════════════════════════════════════════
test('supported: two independent and two with support are different measurements', () => {
  assert.equal(ESTIMATE_CONFIG.SUPPORTED_CREDIT, 0.5);
  assert.equal(accuracyOf([row({ correct: 2, total: 2 })]), 1);
  assert.equal(accuracyOf([row({ correct: 0, total: 2, supported: 2 })]), 0.5);

  const three = (over) => [
    row({ ...over, modality: 'TPL-AR_VSP_MATCH' }),
    row({ ...over, modality: 'TPL-AR_VSP_MATCH_LISTEN' }),
    row({ ...over, modality: 'TPL-AR_VSP_MATCH', rung: 0 }),
  ];
  const indep = indicatorFor('VSP.MATCH', three({ correct: 2, total: 2 }));
  const supp = indicatorFor('VSP.MATCH', three({ correct: 0, total: 2, supported: 2 }));

  assert.equal(indep.notMeasured, false);
  assert.equal(supp.notMeasured, false, 'scaffolded work was filed as unmeasured');
  assert.equal(supp.floor, false, 'a scaffolded pass was reported as a floor');
  assert.equal(indep.independence, 1);
  assert.equal(supp.independence, 0);
  assert.equal(supp.support_ratio, 1);
  assert.notEqual(indep.indicator, supp.indicator, 'the indicator could not tell the two apart');
  assert.ok(indep.indicator > supp.indicator);
  assert.equal(indep.items, 6);
  assert.equal(supp.items, 6);
});

test('supported: a trace without the av2 fields is byte-identical to zeroes', () => {
  const legacy = [{ correct: 2, total: 3 }];
  assert.equal(accuracyOf(legacy), 2 / 3);
  assert.equal(accuracyOf([{ correct: 2, total: 3, supported: 0, insufficient: 0 }]), 2 / 3);
  assert.equal(supportRatioOf(legacy), 0);
  assert.equal(supportRatioOf([{ correct: 1, total: 2, supported: 1 }]), 0.5);

  // An estimate recorded the old way carries explicit zeroes, not undefined:
  // a legacy row replayed after av2 must not gain a mystery field per run.
  const e = recordObservation(newEstimate({ strandId: 'LIT.LETTER_NAME', rung: 2 }), { rung: 2, correct: 2, total: 3 });
  assert.equal(e.evidence[0].supported, 0);
  assert.equal(e.evidence[0].insufficient, 0);
  assert.equal(e.evidence[0].correct, 2);
  // Confidence is earned on presented items, so a legacy row counts the same.
  assert.equal(confidenceOf(e), confidenceOf(recordObservation(
    newEstimate({ strandId: 'LIT.LETTER_NAME', rung: 2 }), { rung: 2, correct: 2, total: 3, supported: 0, insufficient: 0 },
  )));
});

// ══ §4 — INSUFFICIENT IS NOT IN ANY DENOMINATOR ══════════════════════════
test('insufficient: excluded from the denominator, kept as its own count', () => {
  assert.equal(presentedOf({ total: 3, insufficient: 3, correct: 0 }), 0);
  assert.equal(presentedOf({ total: 3, insufficient: 2, correct: 1 }), 1);
  assert.equal(presentedOf({ total: 3, insufficient: 0, correct: 3 }), 3);
  assert.equal(presentedOf({ total: 3 }), 3, 'a row written before av2 keeps its denominator');
  assert.equal(presentedOf(undefined), 0);
  // Malformed producers cannot mint a negative or an over-claimed denominator.
  assert.equal(presentedOf({ total: 2, insufficient: 9, correct: 0 }), 0);
  assert.equal(presentedOf({ total: 2, insufficient: 0, correct: 5 }), 2);
  assert.equal(accuracyOf([{ total: 3, insufficient: 3, correct: 0, supported: 0 }]), null,
    'nothing presented must give no accuracy, not an accuracy of zero');

  assert.equal(accuracyOf([row({ correct: 1, total: 3, insufficient: 2 })]), 1,
    'one of one answered independently is 1.0, not 0.33');
  // Three visits of two disengaged items each: the denominator is the three
  // items really answered, not the nine tiles that were opened.
  const i = indicatorFor('VSP.MATCH', [
    row({ correct: 1, total: 3, insufficient: 2 }),
    row({ correct: 1, total: 3, insufficient: 2, modality: 'TPL-AR_VSP_MATCH_LISTEN' }),
    row({ correct: 1, total: 3, insufficient: 2, modality: 'TPL-AR_VSP_SORT' }),
  ]);
  assert.equal(i.items, 3, 'disengaged items were counted as presented');
  assert.equal(i.insufficient, 6);
  assert.equal(i.accuracy, 1, 'the indicator diluted 3-of-3 to 3-of-9');
  assert.equal(i.notMeasured, false);

  // Rows of nothing but insufficient are still VISIBLE to the strand — the
  // difference between NOT_PROBED and "we tried and learned nothing".
  const rows = [
    row({ correct: 0, total: 3, insufficient: 3 }),
    row({ correct: 0, total: 3, insufficient: 3, modality: 'TPL-AR_VSP_MATCH_LISTEN' }),
  ];
  assert.equal(rowsForStrand(rows, 'VSP.MATCH').length, 2);
  const none = indicatorFor('VSP.MATCH', rows);
  assert.equal(none.indicator, null);
  assert.equal(none.notMeasured, true);
  assert.equal(none.floor, false, 'an unengaged visit was reported as a floor');
  assert.equal(none.reason, 'NEEDS_MORE_INFORMATION');
  assert.equal(none.items, 0);
  assert.equal(none.insufficient, 6);
  // Zero evidence of any kind stays NOT_PROBED. The two reasons are not
  // interchangeable, and conflating them rewrites "we tried" as "never asked".
  assert.equal(indicatorFor('VSP.MATCH', []).reason, 'NOT_PROBED');
  assert.equal(indicatorFor('VSP.MATCH', [row({ correct: 0, total: 0 })]).reason, 'NOT_PROBED');
});

// ══ §4 — THE WALK ════════════════════════════════════════════════════════
test('walk: startProbe opens every registered track, at its base when calibration was silent', () => {
  const c = runCalibration({ ageYears: 7, responses: ALL_CORRECT });
  const s = startProbe(c);
  const expected = [];
  for (const ladder of LADDER_IDS) for (const track of tracksFor(ladder)) expected.push(`${ladder}:${track}`);
  assert.deepEqual(Object.keys(s.tracks).sort(), [...expected].sort(), 'the walked track set is not the registry');
  for (const key of expected) {
    const t = s.tracks[key];
    assert.ok(t, `${key} was never opened`);
    assert.equal(t.rung, t.entry_rung, `${key} opened away from its entry rung`);
  }
  // The tracks calibration has no probes for say WHY they start where they do.
  assert.equal(s.tracks['VSP:MAIN'].evidence, 'TRACK_OPEN_AT_BASE');
  assert.equal(s.tracks['MEM:MAIN'].evidence, 'TRACK_OPEN_AT_BASE');
  assert.equal(s.tracks['LITERACY:COMM'].evidence, 'TRACK_OPEN_AT_BASE');
  assert.equal(s.tracks['VSP:MAIN'].rung, baseRungOf('VSP', 'MAIN'));
  assert.equal(s.tracks['MEM:MAIN'].rung, baseRungOf('MEM', 'MAIN'));
  assert.equal(s.tracks['LITERACY:COMM'].rung, baseRungOf('LITERACY', 'COMM'));
  // And the placed ones keep the calibration reason and rung, untouched.
  for (const key of ['LITERACY:MAIN', 'LITERACY:LISTENING', 'NUMERACY:MAIN']) {
    assert.equal(s.tracks[key].evidence, c.entry_rungs[key].evidence);
    assert.equal(s.tracks[key].rung, c.entry_rungs[key].rung);
  }
});

test('walk: the new tracks are actually offered, and scored', () => {
  const c = runCalibration({ ageYears: 7, responses: ALL_CORRECT });
  const s = runProbe(c, () => ({ correct: 3, total: 3 }));
  const seen = new Set(s.results.map((r) => r.strand));
  for (const id of ['VSP.MATCH', 'MEM.VISUAL_STM', 'COMM.EXPRESS_CHOICE']) {
    assert.ok(seen.has(id), `${id} was never visited`);
  }
  const ind = scoreProbe(s);
  for (const id of ['VSP.MATCH', 'MEM.VISUAL_STM', 'COMM.EXPRESS_CHOICE']) {
    assert.ok(ind[id], `${id} has no indicator`);
    assert.equal(ind[id].notMeasured, false, `${id} was visited but never measured`);
  }
  // Round-robin, not appended: a track that only gets offered after the
  // originals are exhausted is a track a truncated session never reaches.
  const firstThree = new Set(s.results.slice(0, 3).map((r) => `${r.ladder}:${r.track}`));
  assert.equal(firstThree.size, 3, `the walk opened on too few tracks: ${s.results.slice(0, 6).map((r) => `${r.ladder}:${r.track}`).join(',')}`);
});

test('walk: paired modality once, then needs_more_information, then never again', () => {
  const c = runCalibration({ ageYears: 7, responses: ALL_CORRECT });
  // Every visit disengages. Two attempts per strand is the whole allowance.
  const s = drive(c, () => ({ correct: 0, total: 3, insufficient: 3 }));

  const rows = s.results.filter((r) => r.strand === 'VSP.MATCH');
  assert.equal(rows.length, 2, `VSP.MATCH was presented ${rows.length} times; two is the ceiling`);
  assert.equal(rows[0].move, 'PAIRED_MODALITY_RETRY');
  assert.equal(rows[1].move, 'NEEDS_MORE_INFORMATION');
  // The retry was a different ROUTE, not the same question asked twice: this
  // is the pair of formats the ladder registry declares.
  assert.equal(rows[0].modality, 'TPL-AR_VSP_MATCH');
  assert.equal(rows[1].modality, 'TPL-AR_VSP_MATCH_LISTEN');
  assert.equal(rows[0].used_modality_pair, false);
  assert.equal(rows[1].used_modality_pair, true);
  // Nothing at all was claimed about the child from an unanswered visit.
  assert.equal(rows[0].accuracy, null);
  assert.equal(rows[1].accuracy, null);

  // The track stops for the honest reason, and no track is left reasonless.
  assert.equal(s.finished, true);
  assert.equal(s.tracks['VSP:MAIN'].stop_reason, PROBE_STOP.INSUFFICIENT_INFORMATION);
  assert.ok(Object.values(PROBE_STOP).includes('INSUFFICIENT_INFORMATION'));
  for (const [k, t] of Object.entries(s.tracks)) {
    assert.ok(t.done, `${k} never finished`);
    assert.ok(t.stop_reason, `${k} stopped with no reason`);
  }
  // Every strand reports NEEDS_MORE_INFORMATION — not a score, not a zero,
  // not a floor. This is the whole point of the outcome existing.
  const ind = scoreProbe(s);
  for (const [id, v] of Object.entries(ind)) {
    assert.equal(v.reason, 'NEEDS_MORE_INFORMATION', `${id} concluded something from disengaged items`);
    assert.equal(v.floor, false, `${id} was filed as a floor without one scorable response`);
    assert.equal(v.indicator, null);
    assert.equal(v.items, 0);
    assert.ok(v.insufficient > 0);
  }
  // And the session stayed short: it did not grind through the budget.
  assert.ok(s.items_used < PROBE_CONFIG.SESSION_ITEM_BUDGET, `a disengaged child was kept for ${s.items_used} items`);
});

test('walk: a retry that does produce evidence is scored on its merits', () => {
  const c = runCalibration({ ageYears: 7, responses: ALL_CORRECT });
  let state = startProbe(c);
  let first;
  for (;;) {
    const visit = nextProbe(state);
    assert.ok(visit, 'the walk ran out before VSP.MATCH');
    if (visit.strand === 'VSP.MATCH') {
      first = visit;
      state = recordProbe(state, visit, { correct: 0, total: 3, insufficient: 3 });
      break;
    }
    state = recordProbe(state, visit, { correct: 3, total: 3 });
  }
  // The strand goes back into the pool at the same rung; the round-robin may
  // serve other tracks first, so wait for it rather than assuming order.
  let retry;
  for (;;) {
    const v = nextProbe(state);
    assert.ok(v, 'the walk ended without re-offering the disengaged strand');
    if (v.strand === 'VSP.MATCH') { retry = v; break; }
    assert.notEqual(v.use_modality_pair, true, `${v.strand} inherited VSP.MATCH's retry flag`);
    state = recordProbe(state, v, { correct: 3, total: 3 });
  }
  assert.equal(retry.strand, 'VSP.MATCH', 'the strand was not re-offered');
  assert.equal(retry.rung, first.rung, 'the retry moved off the disengaged rung');
  assert.equal(retry.rung, first.entry_rung ?? first.rung);
  assert.equal(retry.use_modality_pair, true);
  assert.notEqual(retry.template, first.template, 'the retry re-asked the same route');

  const after = recordProbe(state, retry, { correct: 2, total: 2 });
  const last = after.results[after.results.length - 1];
  assert.notEqual(last.move, 'NEEDS_MORE_INFORMATION', 'a scored retry was still filed as unmeasured');
  assert.equal(after.tracks['VSP:MAIN'].needs_more_information['VSP.MATCH'], undefined);

  // The strand is NOT filed as needing more information, and the earlier
  // disengaged visit does not dilute what the retry produced: two answered,
  // two correct, accuracy 1.0 — the three abandoned tiles are simply absent
  // from the maths (their only trace is `insufficient`, which is reported).
  const rows = rowsForStrand(after.results, 'VSP.MATCH');
  assert.equal(accuracyOf(rows), 1, 'the disengaged visit diluted the retry');
  const v = scoreProbe(after)['VSP.MATCH'];
  assert.equal(v.insufficient, 3);
  assert.equal(v.items, 2, 'the indicator denominator counted the disengaged items');
  assert.notEqual(v.reason, 'NEEDS_MORE_INFORMATION');
  // Two answered items is still below the reporting minimum, and the engine
  // says THAT rather than "we do not know": an honest thin sample, not a
  // disengaged one. One more visit would certify it.
  assert.equal(v.reason, 'TOO_FEW_ITEMS');
  assert.equal(v.indicator, null);
});

test('walk: support counts toward the climb gate but is not mastery', () => {
  const c = runCalibration({ ageYears: 7, responses: ALL_CORRECT });
  // The rung gate is CLIMB_AT_ACCURACY × 0.75 = 0.6 of the PRESENTED items.
  const mixed = runProbe(c, () => ({ correct: 1, total: 3, supported: 2 }));
  // 1 + 0.5×2 = 2 credit over 3 presented = 0.667 → high enough to look up.
  assert.ok(mixed.results.some((r) => r.move === 'CLIMB'),
    'independent-plus-support evidence at 0.67 was refused a look at the next rung');
  const only = runProbe(c, () => ({ correct: 0, total: 3, supported: 3 }));
  // 1.5 over 3 = 0.5 → partial: gather more, do not climb.
  assert.equal(only.results.some((r) => r.move === 'CLIMB'), false,
    'a wholly scaffolded 3/3 was allowed to look like mastery');
  assert.ok(only.results.every((r) => r.accuracy === 0.5));
  const ind = scoreProbe(only);
  for (const v of Object.values(ind)) {
    if (v.notMeasured) continue;
    assert.equal(v.independence, 0, 'scaffolded work was reported as independent');
  }
});

test('walk: the item budget still bounds a six-track session', () => {
  const c = runCalibration({ ageYears: 7, responses: ALL_CORRECT });
  for (const respond of [
    () => ({ correct: 3, total: 3 }),
    () => ({ correct: 0, total: 3 }),
    () => ({ correct: 1, total: 3 }),
    () => ({ correct: 0, total: 3, insufficient: 3 }),
    () => ({ correct: 0, total: 3, supported: 3 }),
    () => ({ correct: 3, total: 3, supported: 0, insufficient: 0 }),
  ]) {
    const s = runProbe(c, respond);
    assert.equal(s.finished, true);
    assert.ok(s.items_used <= PROBE_CONFIG.SESSION_ITEM_BUDGET + PROBE_CONFIG.ITEMS_PER_VISIT,
      `budget exceeded: ${s.items_used}`);
    assert.equal(s.results.every((r) => typeof r.strand === 'string' && STRAND_BY_ID[r.strand]), true);
  }
});

test('walk: a legacy trace is bit-for-bit what it was before av2', () => {
  const c = runCalibration({ ageYears: 7, responses: ALL_CORRECT });
  const implicit = runProbe(c, (v) => ({ correct: 2, total: 3, modality: v.template }));
  const explicit = runProbe(c, (v) => ({ correct: 2, total: 3, supported: 0, insufficient: 0, modality: v.template }));
  assert.equal(JSON.stringify(implicit.results), JSON.stringify(explicit.results),
    'writing the av2 fields as zeroes changed a legacy trace');
  assert.equal(JSON.stringify(implicit.tracks), JSON.stringify(explicit.tracks));
  assert.equal(JSON.stringify(scoreProbe(implicit)), JSON.stringify(scoreProbe(explicit)));
  const a = finaliseLadderAssessment({ calibration: c, probe: implicit, accommodations: [] });
  const b = finaliseLadderAssessment({ calibration: c, probe: explicit, accommodations: [] });
  assert.equal(JSON.stringify(a), JSON.stringify(b), 'the ledger or profile moved on explicit zeroes');
});

// ══ §1.6 — AN INVALID VISIT MOVES NOTHING ════════════════════════════════
test('invalid visit: excluded from indicators AND the ledger, kept in the record', () => {
  const good = row({ correct: 3, total: 3 });
  const suspect = row({ correct: 0, total: 3, modality: 'TPL-AR_VSP_MATCH_LISTEN' });
  const three = probeOf([good, suspect, row({ correct: 3, total: 3, modality: 'TPL-AR_VSP_MATCH' })]);
  const two = probeOf([good, row({ correct: 3, total: 3, modality: 'TPL-AR_VSP_MATCH' })]);
  const c = runCalibration({ ageYears: 7, responses: ALL_CORRECT });

  const plain = finaliseLadderAssessment({ calibration: c, probe: three, accommodations: [] });
  const flagged = finaliseLadderAssessment({
    calibration: c, probe: three, accommodations: [],
    visitValidity: [
      { visit: 1, strand: 'VSP.MATCH', ladder: 'VSP', track: 'MAIN', valid: 'valid' },
      { visit: 2, strand: 'VSP.MATCH', ladder: 'VSP', track: 'MAIN', valid: 'invalid_administration' },
      { visit: 3, strand: 'VSP.MATCH', ladder: 'VSP', track: 'MAIN', valid: 'valid' },
    ],
  });
  const asIfNeverHappened = finaliseLadderAssessment({ calibration: c, probe: two, accommodations: [] });

  // Flagged, never deleted: "four visits were thrown away" is only auditable
  // if the record still contains them.
  const bad = flagged.probe.results.filter((r) => r.invalid_flag);
  assert.equal(bad.length, 1);
  assert.equal(flagged.probe.results.length, 3, 'a row was deleted instead of flagged');
  assert.equal(plain.probe.results.every((r) => r.invalid_flag === undefined), true,
    'the caller’s probe state was mutated');

  // The counts drop by exactly that visit, and nothing else moves.
  assert.equal(flagged.indicators['VSP.MATCH'].items, asIfNeverHappened.indicators['VSP.MATCH'].items);
  assert.equal(JSON.stringify(flagged.indicators), JSON.stringify(asIfNeverHappened.indicators));
  assert.equal(JSON.stringify(flagged.ledger), JSON.stringify(asIfNeverHappened.ledger),
    'the ledger moved on an invalid visit');
  assert.equal(JSON.stringify(flagged.priorities), JSON.stringify(asIfNeverHappened.priorities));
  // …while the un-flagged run did move on it, which is the bug being guarded.
  assert.notEqual(plain.indicators['VSP.MATCH'].items, asIfNeverHappened.indicators['VSP.MATCH'].items);
  assert.equal(rowsForStrand(flagged.probe.results, 'VSP.MATCH').some((r) => r.invalid_flag), false);

  // Data quality says so out loud.
  assert.ok(toAssessmentRecord(flagged).data_quality_flags.includes('VISIT_INVALID_ADMINISTRATION'));
  assert.equal(toAssessmentRecord(plain).data_quality_flags.includes('VISIT_INVALID_ADMINISTRATION'), false);
});

test('invalid visit: a producer that recorded no row gets nothing invented', () => {
  const c = runCalibration({ ageYears: 7, responses: ALL_CORRECT });
  const probe = runProbe(c, () => ({ correct: 3, total: 3 }));
  // Two validity rows against dozens of results: the log and the rows do not
  // line up, so positional pairing refuses to act rather than guess.
  const a = finaliseLadderAssessment({
    calibration: c, probe, accommodations: [],
    visitValidity: [{ visit: 1, valid: 'invalid_administration' }, { visit: 2, valid: 'valid' }],
  });
  assert.equal(a.probe.results.some((r) => r.invalid_flag), false, 'a guessed row was flagged');
  assert.equal(JSON.stringify(a.indicators), JSON.stringify(finaliseLadderAssessment({ calibration: c, probe, accommodations: [] }).indicators));
  assert.equal(a.envelope.visitValidity.length, 2, 'the validity log was dropped from the envelope');
});

// ══ §6 — OPPORTUNITY GATES ARE DATA, NOT SCORES ══════════════════════════
test('gatesFromCaregiver: cv2 VQ13 gates both symbol tracks, one answer both ways', () => {
  const closed = gatesFromCaregiver({ bankVersion: 'cv2', rawV2: { VQ13: 'not_yet' } });
  assert.equal(closed.LITERACY, OPPORTUNITY_GATE.NOT_YET);
  assert.equal(closed.NUMERACY, OPPORTUNITY_GATE.NOT_YET);
  assert.equal(closed.LITERACY, closed.NUMERACY, 'one VQ13 answer scored two ways');
  assert.equal(closed.source.via, 'VQ13/L7');
  const open = gatesFromCaregiver({ bankVersion: 'cv2', rawV2: { VQ13: 'often' } });
  assert.equal(open.LITERACY, 'open');
  assert.equal(open.NUMERACY, 'open');
  // The meta wrapper shape the store actually returns.
  assert.equal(gatesFromCaregiver({ meta: { bankVersion: 'cv2' }, rawV2: { VQ13: 'not_yet' } }).NUMERACY, 'not_yet');
});

test('gatesFromCaregiver: cv1 L7 and the L domain state say the same thing', () => {
  assert.equal(gatesFromCaregiver({ bankVersion: 'cv1', responses: { L7: { v: 'not_yet_chance' } } }).NUMERACY, 'not_yet');
  assert.equal(gatesFromCaregiver({ domainStates: { L: { state: 'not_yet_opportunity' } } }).LITERACY, 'not_yet');
  assert.equal(gatesFromCaregiver({ bankVersion: 'cv1', responses: { L7: { v: 'sometimes' } } }).LITERACY, 'open');
  assert.equal(gatesFromCaregiver({ domainStates: { L: { state: 'emerging' } } }).LITERACY, 'open');
  assert.equal(gatesFromCaregiver({ domainStates: { L: { state: 'does_independently' } } }).LITERACY, 'open');
});

test('gatesFromCaregiver: absent, unsure or unreadable is OPEN, never closed', () => {
  for (const nothing of [null, undefined, {}, { responses: {} }, { rawV2: {} }, { domainStates: {} },
    { bankVersion: 'cv2', rawV2: { VQ13: 'unsure' } }, { bankVersion: 'cv2', rawV2: {} },
    { responses: { L7: { v: 'unsure' } } }, { L7: 'not_yet_chance' }, 'nonsense', 42, []]) {
    const g = gatesFromCaregiver(nothing);
    assert.equal(g.LITERACY, 'open', `${JSON.stringify(nothing)} gated literacy`);
    assert.equal(g.NUMERACY, 'open', `${JSON.stringify(nothing)} gated numeracy`);
  }
});

test('gates: every track is accounted for, and a gate never touches a score', () => {
  const g = { LITERACY: 'not_yet', NUMERACY: 'open' };
  const { closed, allGates } = gatedTracks(g);
  assert.deepEqual(closed.sort(), ['LITERACY:COMM', 'LITERACY:LISTENING', 'LITERACY:MAIN']);
  for (const key of allTrackKeys()) {
    assert.ok(allGates[key], `${key} is missing from the gate view`);
    assert.ok(['not_yet', 'open'].includes(allGates[key].gate));
    const symbolTrack = key.startsWith('LITERACY') || key.startsWith('NUMERACY');
    assert.equal(allGates[key].declared, symbolTrack,
      `${key} was reported ${symbolTrack ? 'as unaddressed' : 'as gated by'} a question that never asked about it`);
  }
  // The gate comes from a LETTERS-AND-NUMBERS question. It has no opinion
  // about the visual or memory ladders, and must not appear to.
  assert.equal(allGates['VSP:MAIN'].gate, 'open', 'a symbol question closed a visual track');
  assert.equal(allGates['MEM:MAIN'].gate, 'open', 'a symbol question closed a memory track');
  assert.equal(gatedTracks(null).closed.length, 0, 'an absent gate closed a track');

  const c = runCalibration({ ageYears: 7, responses: ALL_CORRECT });
  const probe = runProbe(c, () => ({ correct: 3, total: 3 }));
  const plain = finaliseLadderAssessment({ calibration: c, probe, accommodations: [] });
  const gated = finaliseLadderAssessment({
    calibration: c, probe, accommodations: [],
    opportunityGates: g, caregiverRef: { id: 12, bankVersion: 'cv2' },
  });
  // Gating is a reporting fact about what was OFFERED. Scores come from the
  // evidence rows, so they must be identical, byte for byte.
  assert.equal(JSON.stringify(gated.indicators), JSON.stringify(plain.indicators));
  assert.equal(JSON.stringify(gated.profile), JSON.stringify(plain.profile));
  assert.equal(JSON.stringify(gated.domains), JSON.stringify(plain.domains));
  assert.equal(JSON.stringify(gated.ledger), JSON.stringify(plain.ledger));
  assert.equal(JSON.stringify(gated.priorities), JSON.stringify(plain.priorities));
  // …and the gate itself is kept, with the pointer to who said it.
  assert.equal(gated.envelope.bankVersion, 'av2');
  assert.deepEqual(gated.envelope.caregiverRef, { id: 12, bankVersion: 'cv2' });
  assert.equal(gated.envelope.opportunityGates.LITERACY, 'not_yet');
});

test('gates: a closed track logs no_opportunity and never not_demonstrated', () => {
  const { closed } = gatedTracks({ LITERACY: 'not_yet', NUMERACY: 'open' });
  const rows = gatingObservations(closed, { at: '2026-11-15T00:00:00.000Z', source: { id: 3, bankVersion: 'cv2' } });
  assert.equal(rows.length, closed.length);
  for (const o of rows) {
    assert.equal(o.outcome, 'no_opportunity', 'a gate was logged as a scored outcome');
    assert.ok(OUTCOME.includes(o.outcome));
    assert.ok(o.strand.includes(':'), 'a domain-level row is not keyed to a track');
    assert.equal(typeof o.rung, 'number');
    assert.equal(o.rung, baseRungOf(o.ladder, o.track), 'the row was logged at a rung the child never reached');
    assert.ok(o.source && o.reason, 'an exclusion without a source is not auditable');
  }
  // The counts cannot be mistaken for a score: no_opportunity is outside every
  // denominator, and a strand with only such rows says NOT_PROBED.
  assert.equal(visitCountsFromObservations(rows).total, 0);
  assert.equal(rowsForStrand(rows.map((o) => ({ ...o, total: 0, correct: 0 })), 'VSP.MATCH').length, 0);
  assert.equal(indicatorFor('VSP.MATCH', []).reason, 'NOT_PROBED');

  // The skill index counts CATEGORIES per skill and never averages the two
  // instruments together (spec §8).
  const idx = observationSkillIndex([
    { target_skill: 'vsp-picture-match', outcome: 'demonstrated_independent', strand: 'VSP.MATCH' },
    { target_skill: 'vsp-picture-match', outcome: 'insufficient', strand: 'VSP.MATCH' },
    { target_skill: 'comm-express-choice', outcome: 'demonstrated_with_support', strand: 'COMM.EXPRESS_CHOICE' },
  ]);
  assert.deepEqual(idx['vsp-picture-match'].outcomes, { demonstrated_independent: 1, insufficient: 1 });
  assert.deepEqual(idx['vsp-picture-match'].strands, ['VSP.MATCH']);
  assert.deepEqual(Object.keys(idx).sort(), ['comm-express-choice', 'vsp-picture-match']);
  assert.deepEqual(observationSkillIndex(null), {}, 'an absent log must be an empty view, not a crash');
  assert.deepEqual(observationSkillIndex([]), {});
});

// ══ §7 — THE ENVELOPE ════════════════════════════════════════════════════
test('envelope: the legacy call is untouched, keys and order included', () => {
  const c = runCalibration({ ageYears: 7, responses: ALL_CORRECT });
  const probe = runProbe(c, () => ({ correct: 2, total: 3 }));
  const a = finaliseLadderAssessment({ calibration: c, probe, accommodations: ['AUDIO_SUPPORT'] });
  assert.deepEqual(Object.keys(a), [
    'calibration', 'probe', 'stops', 'indicators', 'profile', 'priorities',
    'domains', 'ledger', 'accommodations_used', 'items_presented',
  ], 'the legacy finalise grew or reordered a key');
  assert.equal(a.envelope, undefined, 'a legacy session grew an envelope');
  assert.equal(JSON.stringify(a), JSON.stringify(finaliseLadderAssessment({
    calibration: c, probe, accommodations: ['AUDIO_SUPPORT'],
  })));

  const rec = toAssessmentRecord(a);
  assert.deepEqual(Object.keys(rec.item_results), ['calibration', 'probe'], 'a phase5 record grew an envelope key');
  assert.equal(rec.rule_pack_version, PHASE5_RULE_PACK_VERSION);
  assert.equal(rec.rule_pack_version, 'phase5-1.0.0');
  assert.equal(a.probe.results.some((r) => r.insufficient !== undefined), true,
    'the engine stopped writing its own av2 fields — the batch path must still record them');
  // And the batch entry point (runLadderAssessment) is the same legacy shape.
  const batch = runLadderAssessment({ ageYears: 7, calibrationResponses: ALL_CORRECT, respond: () => ({ correct: 2, total: 3 }) });
  assert.deepEqual(Object.keys(batch), Object.keys(a));
});

test('envelope: an av2 session persists §7 and hydrates to the same conclusions', () => {
  const c = runCalibration({ ageYears: 7, responses: ALL_CORRECT });
  const observations = [
    { item_id: 'AR-VSPM-240', strand: 'VSP.MATCH', target_skill: 'vsp-picture-match', outcome: 'demonstrated_independent', mode: 'single' },
    { item_id: 'AR-CMEC-268', strand: 'COMM.EXPRESS_CHOICE', target_skill: 'comm-express-choice', outcome: 'demonstrated_with_support', mode: 'tap_each' },
    { item_id: 'AR-MEMV-256', strand: 'MEM.VISUAL_STM', target_skill: 'mem-visual-what-gone', outcome: 'insufficient', mode: 'single' },
  ];
  const probe = runProbe(c, (v) => (v.strand === 'MEM.VISUAL_STM'
    ? { correct: 0, total: 3, insufficient: 3 }
    : { correct: 1, total: 3, supported: 2 }));
  const a = finaliseLadderAssessment({
    calibration: c, probe, accommodations: ['EXTENDED_TIME'],
    observations,
    opportunityGates: { LITERACY: 'open', NUMERACY: 'not_yet' },
    visitValidity: probe.results.map((r, i) => ({ visit: i + 1, strand: r.strand, valid: 'valid' })),
    caregiverRef: { id: 7, bankVersion: 'cv2' },
  });
  const rec = toAssessmentRecord(a);
  assert.equal(rec.rule_pack_version, AV2_RULE_PACK_VERSION);
  assert.deepEqual(Object.keys(rec.item_results), [
    'bankVersion', 'calibration', 'probe', 'observations', 'opportunityGates', 'visitValidity', 'caregiverRef',
  ]);
  assert.equal(rec.item_results.bankVersion, 'av2', 'the discriminator is not first/absent');
  assert.deepEqual(rec.item_results.caregiverRef, { id: 7, bankVersion: 'cv2' });
  assert.deepEqual(rec.item_results.opportunityGates.caregiverRef, { id: 7, bankVersion: 'cv2' },
    'the two caregiverRef copies diverged');
  assert.equal(rec.item_results.observations.length, 3);
  assert.equal(rec.item_results.probe.some((r) => r.insufficient > 0), true);

  // Through the wire exactly as the API does it.
  const wire = JSON.parse(JSON.stringify(rec));
  const back = fromAssessmentRecord({ id: 1, item_results: wire.item_results, skill_estimates: wire.skill_estimates, status: 'COMPLETE' });
  assert.equal(back.restored, true);
  assert.deepEqual(back.indicators['VSP.MATCH'], a.indicators['VSP.MATCH']);
  assert.deepEqual(back.priorities, a.priorities);
  assert.deepEqual(back.profile, a.profile);
  // The replayed ledger agrees with the live one on every strand the probe
  // touched — this is what makes a reload a re-derivation, not a photo.
  for (const strandId of Object.keys(a.indicators)) {
    const live = a.ledger.estimates[strandId];
    const loaded = back.ledger.estimates[strandId];
    assert.ok(loaded, `${strandId} vanished on reload`);
    assert.equal(loaded.rung, live.rung, `${strandId} moved rung on reload`);
    assert.equal(JSON.stringify(loaded.evidence), JSON.stringify(live.evidence), `${strandId} evidence changed`);
    assert.equal(loaded.confidence, live.confidence);
    assert.equal(loaded.last_move.move, live.last_move.move);
  }
  // The av2 fields survived the round trip and reached the ledger.
  assert.equal(back.ledger.estimates['MEM.VISUAL_STM'].evidence.at(-1).insufficient, 3);
  assert.equal(back.ledger.estimates['COMM.EXPRESS_CHOICE'].evidence.at(-1).supported, 2);
  assert.equal(back.envelope.bankVersion, 'av2');
  assert.deepEqual(back.observations, observations);
  assert.deepEqual(back.caregiverRef, { id: 7, bankVersion: 'cv2' });
  assert.equal(back.visitValidity.length, a.probe.results.length, 'the validity log lost visits on reload');

  // A phase5-1.0.0 record still hydrates as it always did: stored estimates
  // verbatim, no envelope, no av2 stamp invented for it.
  const legacyRec = toAssessmentRecord(finaliseLadderAssessment({
    calibration: c, probe: runProbe(c, () => ({ correct: 2, total: 3 })), accommodations: [],
  }));
  const stored = JSON.parse(JSON.stringify({ ...legacyRec, skill_estimates: { 'LIT.LETTER_NAME': { strand: 'LIT.LETTER_NAME', ladder: 'LITERACY', track: 'MAIN', rung: 4, evidence: [], confidence: 'MEDIUM', provenance: 'OBSERVED', consecutive_low: 0, consecutive_high: 2, last_moved_at: null, last_move: null } } }));
  const legacyBack = fromAssessmentRecord(stored);
  assert.equal(legacyBack.envelope, undefined, 'a phase5 record gained an envelope on reload');
  assert.equal(legacyBack.observations, undefined);
  assert.equal(legacyBack.ledger.estimates['LIT.LETTER_NAME'].rung, 4, 'a legacy ledger was overwritten by a replay');
  assert.equal(legacyBack.ledger.estimates['LIT.LETTER_NAME'].consecutive_high, 2);
});

test('envelope: av2 finalise → record → finalise is idempotent', () => {
  const c = runCalibration({ ageYears: 7, responses: ALL_CORRECT });
  const probe = runProbe(c, () => ({ correct: 0, total: 3, insufficient: 3 }));
  const opts = {
    calibration: c, probe, accommodations: [],
    observations: [{ item_id: 'x', strand: 'VSP.MATCH', target_skill: 'vsp-picture-match', outcome: 'insufficient' }],
    opportunityGates: { LITERACY: 'open', NUMERACY: 'open' },
    caregiverRef: { id: 3, bankVersion: 'cv1' },
    visitValidity: probe.results.map((r, i) => ({ visit: i + 1, strand: r.strand, valid: 'valid' })),
  };
  const first = toAssessmentRecord(finaliseLadderAssessment(opts));
  const again = toAssessmentRecord(finaliseLadderAssessment({
    calibration: c, probe, accommodations: [],
    observations: first.item_results.observations,
    opportunityGates: first.item_results.opportunityGates,
    visitValidity: first.item_results.visitValidity,
    caregiverRef: first.item_results.caregiverRef,
  }));
  assert.equal(JSON.stringify(again.item_results), JSON.stringify(first.item_results), 'the loop is not idempotent');
  assert.equal(again.rule_pack_version, AV2_RULE_PACK_VERSION);
  assert.equal(again.rule_pack_version, 'av2-1.0.0');
});

// ══ §2 — DIAGNOSIS BLINDNESS, EXTENDED ══════════════════════════════════
test('blind: the engine sources never mention a diagnosis, and the ladder sources never take one', () => {
  // The existing pattern, extended to the files av2 added to the engines.
  for (const rel of [
    'src/iris/engines/adaptiveProbe.js',
    'src/iris/engines/indicators.js',
    'src/iris/engines/skillEstimate.js',
  ]) {
    const code = readFileSync(rel, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    assert.ok(!/\bcondition\b/.test(code), `${rel} references condition outside comments`);
    for (const d of ['DOWN_SYNDROME', 'WILLIAMS_SYNDROME', 'FRAGILE_X', 'AUTISM']) {
      assert.ok(!code.includes(d), `${rel} names the diagnosis ${d}`);
    }
  }
  // The new ladder files: no function or strand factory takes a diagnosis, and
  // no rung order is computed from one. (These files DO discuss diagnoses in
  // prose comments — that is the research citation, not a routing input.)
  for (const rel of ['src/iris/ladders/visual.js', 'src/iris/ladders/memory.js', 'src/iris/ladders/communication.js']) {
    const code = readFileSync(rel, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    assert.ok(!/[(,]\s*condition\b\s*[,)=]/.test(code), `${rel} takes a condition parameter`);
    assert.ok(!/\bcondition\s*:/.test(code), `${rel} reads a condition field`);
    for (const d of ['DOWN_SYNDROME', 'WILLIAMS_SYNDROME', 'FRAGILE_X']) {
      assert.ok(!code.includes(d), `${rel} names the diagnosis ${d} outside comments`);
    }
  }
});

test('blind: VSP/MEM/COMM positions are identical across every accommodation set', () => {
  const c = runCalibration({ ageYears: 7, responses: ALL_CORRECT });
  const probe = runProbe(c, () => ({ correct: 2, total: 3 }));
  const sets = [
    [],
    accommodationDefaults('DOWN_SYNDROME').accommodations,
    accommodationDefaults('WILLIAMS_SYNDROME').accommodations,
    accommodationDefaults('AUTISM').accommodations,
    accommodationDefaults('FRAGILE_X').accommodations,
    accommodationDefaults('OTHER').accommodations,
  ];
  const out = sets.map((acc) => JSON.stringify(finaliseLadderAssessment({ calibration: c, probe, accommodations: acc }).indicators));
  assert.equal(new Set(out).size, 1, 'the indicators moved with the diagnosis');

  const ind = JSON.parse(out[0]);
  const seen = new Set(probe.results.map((r) => r.strand));
  const wanted = ['VSP.MATCH', 'VSP.DIFFERENCE', 'VSP.SORT', 'VSP.PATTERN', 'MEM.VISUAL_STM', 'MEM.SEQUENCE', 'MEM.MEDIAL', 'COMM.EXPRESS_CHOICE', 'COMM.LABEL'];
  for (const id of wanted) {
    assert.ok(STRAND_BY_ID[id], `${id} is not a registered strand`);
    if (!seen.has(id)) continue; // the session ran out of ladder/budget above it
    const v = ind[id];
    assert.ok(v, `${id} was visited but has no indicator`);
    assert.equal(v.strand, id);
    assert.ok(['VSP', 'MEM', 'LITERACY'].includes(v.ladder), `${id} reported a strange ladder`);
    if (id.startsWith('COMM')) assert.equal(v.track, 'COMM', 'COMM is not its own track');
    if (id.startsWith('VSP') || id.startsWith('MEM')) assert.equal(v.track, 'MAIN');
  }
  // Rung order is the same for every child: the walk visits in ladder order.
  const byTrack = {};
  for (const r of probe.results) (byTrack[`${r.ladder}:${r.track}`] ??= []).push(r.rung);
  assert.deepEqual([...new Set(byTrack['VSP:MAIN'] ?? [])].sort(), [...new Set(byTrack['VSP:MAIN'] ?? [])].sort());

  // Attention is observed, never scored: no ATT strand may exist anywhere.
  for (const s of ALL_STRANDS) assert.ok(!s.id.startsWith('ATT.'), `${s.id} is a scored attention strand`);
  assert.equal(ATTENTION_POLICY.scored, false);
  assert.deepEqual(ATTENTION_POLICY.never_feeds, ['indicator', 'skill_estimate', 'learning_priority', 'difficulty']);
  assert.equal(STRAND_BY_ID['MEM.VISUAL_STM'].ladder, 'MEM');
});

test('blind: a caregiver reference and its gates change the envelope, never the scores', () => {
  const c = runCalibration({ ageYears: 7, responses: ALL_CORRECT });
  const probe = runProbe(c, () => ({ correct: 3, total: 3 }));
  const base = finaliseLadderAssessment({ calibration: c, probe, accommodations: [] });
  const g = gatesFromCaregiver({ bankVersion: 'cv2', rawV2: { VQ13: 'not_yet' } });
  const gated = finaliseLadderAssessment({
    calibration: c, probe, accommodations: [],
    observations: [{ item_id: 'x', strand: 'VSP.MATCH', target_skill: 'vsp-picture-match', outcome: 'demonstrated_independent' }],
    opportunityGates: g,
    caregiverRef: g.source,
  });
  assert.equal(JSON.stringify(gated.indicators), JSON.stringify(base.indicators));
  assert.equal(JSON.stringify(gated.ledger), JSON.stringify(base.ledger));
  assert.equal(JSON.stringify(gated.priorities), JSON.stringify(base.priorities));
  assert.equal(JSON.stringify(gated.domains), JSON.stringify(base.domains));
  assert.equal(gated.envelope.opportunityGates.NUMERACY, 'not_yet');
});

// ══ §2 — CONTENT LANE ════════════════════════════════════════════════════
test('content: validateLadders is ok and every av2 strand is servable at each tier it uses', () => {
  const v = validateLadders();
  assert.equal(v.ok, true, v.problems.join('; '));
  assert.deepEqual(v.problems, []);
  assert.ok(LADDER_IDS.length >= 4, 'the av2 ladders are not registered');
  const cov = bankCoverage();
  for (const s of ALL_STRANDS) {
    if (!(s.ladder === 'VSP' || s.ladder === 'MEM' || s.track === 'COMM')) continue;
    assert.ok(cov[s.id], `${s.id} has no items at all`);
    assert.ok(cov[s.id].items >= 3, `${s.id} has only ${cov[s.id].items} items`);
    for (const tier of cov[s.id].tiers) {
      const per = PHASE5_BANK.filter((i) => i.strand === s.id && i.tier === tier);
      assert.ok(per.length >= 2, `${s.id} has only ${per.length} items at ${tier}`);
    }
    for (const tpl of s.templates ?? []) {
      assert.ok(templatesForStrand(s.id).includes(tpl), `${s.id}/${tpl} is not in the strand registry`);
      assert.ok(PHASE5_BANK.some((i) => i.strand === s.id && i.template_id === tpl),
        `${s.id} declares ${tpl} but nothing is generated for it`);
      assert.equal(servableStrandItems({ strand: s.id, template_id: tpl }).length > 0, true,
        `${tpl} has no servable items for ${s.id}`);
      for (const tier of cov[s.id].tiers) {
        assert.equal(servableStrandItems({ strand: s.id, template_id: tpl, tier }).length >= 1, true,
          `${s.id}/${tpl}/${tier} cannot be served — a tier the probe reaches would be empty`);
      }
    }
  }
});

test('content: every bank item carries a stable target_skill its format declares', () => {
  assert.ok(PHASE5_BANK.length > 250, 'the av2 items were not generated');
  const missing = PHASE5_BANK.filter((i) => !i.target_skill || !/^[a-z0-9][a-z0-9-]*$/.test(i.target_skill));
  assert.deepEqual(missing.map((i) => i.item_id), [], 'items without a stable skill id');
  // Coverage is structural both ways: no format without an id, no id for a
  // format that does not exist.
  for (const tpl of PHASE5_TEMPLATES) {
    assert.ok(TARGET_SKILL_BY_TEMPLATE[tpl.id], `${tpl.id} declares no target_skill`);
  }
  for (const id of Object.keys(TARGET_SKILL_BY_TEMPLATE)) {
    assert.ok(TEMPLATE_BY_ID[id], `${id} is a skill id for a template that does not exist`);
  }
  // The format an item was generated on must be one its strand declares.
  const stray = PHASE5_BANK.filter((i) => !templatesForStrand(i.strand).includes(i.template_id));
  assert.deepEqual(stray.map((i) => `${i.item_id}/${i.template_id}`), [], 'items served by an undeclared format');
  // Paired routes share one id ON PURPOSE (same skill, different road). Two
  // genuinely different demands must not.
  assert.equal(TARGET_SKILL_BY_TEMPLATE['TPL-AR_VSP_MATCH'], TARGET_SKILL_BY_TEMPLATE['TPL-AR_VSP_MATCH_LISTEN']);
  assert.equal(TARGET_SKILL_BY_TEMPLATE['TPL-AR_MEM_DISAPPEARED'], TARGET_SKILL_BY_TEMPLATE['TPL-AR_MEM_DISAPPEARED_LISTEN']);
  assert.equal(TARGET_SKILL_BY_TEMPLATE['TPL-AR_COMM_CHOICE'], TARGET_SKILL_BY_TEMPLATE['TPL-AR_COMM_CHOICE_LISTEN']);
  assert.notEqual(TARGET_SKILL_BY_TEMPLATE['TPL-AR_VSP_SORT'], TARGET_SKILL_BY_TEMPLATE['TPL-AR_VSP_SORT_COLOR']);
  assert.notEqual(TARGET_SKILL_BY_TEMPLATE['TPL-AR_MEM_MEDIAL_FIRST'], TARGET_SKILL_BY_TEMPLATE['TPL-AR_MEM_MEDIAL_LAST']);
  assert.notEqual(TARGET_SKILL_BY_TEMPLATE['TPL-AR_PATTERN'], TARGET_SKILL_BY_TEMPLATE['TPL-AR_VSP_PATTERN']);
  // The VSP items on the re-hosted numeric format keep the VISUAL skill id, so
  // a visual pattern can never be rolled up with a numeric one.
  for (const i of PHASE5_BANK.filter((x) => x.strand === 'VSP.PATTERN')) {
    assert.equal(i.target_skill, 'vsp-pattern-extend', `${i.item_id} was filed under the numeric skill`);
  }
  // And every declared id has at least one real item behind it.
  const used = new Set(PHASE5_BANK.map((i) => i.target_skill));
  const never = [...new Set(Object.values(TARGET_SKILL_BY_TEMPLATE))].filter((s) => !used.has(s));
  assert.deepEqual(never, [], 'skill ids with no items behind them');
});

test('content: the av2 modality pairs are symmetric, and the twins ask one question', () => {
  const paired = PHASE5_TEMPLATES.filter((t) => t.modality_pair_id);
  for (const t of paired) {
    const p = TEMPLATE_BY_ID[t.modality_pair_id];
    assert.ok(p, `${t.id} pairs with the missing ${t.modality_pair_id}`);
    assert.equal(p.modality_pair_id, t.id, `${t.id}/${p.id} is not symmetric`);
  }
  // The retry depends on this: a paired format must serve the SAME strand, or
  // "the same rung by another route" would be a different question.
  // The retry only exists if the twin is a route to the SAME strand, declared
  // on that strand, and servable there. Checked in the direction the engine
  // actually walks: from a visual/memory strand to the format it declares, and
  // from there to the pair the format names.
  for (const t of paired) {
    if (!(t.id.startsWith('TPL-AR_VSP') || t.id.startsWith('TPL-AR_MEM'))) continue;
    const p = TEMPLATE_BY_ID[t.modality_pair_id];
    for (const s of t.strands) {
      if (!/^(VSP|MEM)\./.test(s)) continue;
      assert.ok(p.strands.includes(s), `${t.id}/${p.id} pair does not cover ${s}`);
      assert.ok(STRAND_BY_ID[s].templates.includes(p.id),
        `${s} does not declare its own twin ${p.id} — a retry would ask a format the strand never offered`);
    }
  }
  // The VSP pattern format is the same array-extend demand the numeric ladder
  // already served, re-hosted under a VISUAL skill id rather than cloned: a
  // pair ACROSS ladders. It is symmetric, and it is deliberately NOT a
  // same-strand retry route — adaptiveProbe must therefore leave the format
  // alone, or a visual pattern probe would be scored as a numeric one.
  const vspPat = TEMPLATE_BY_ID['TPL-AR_VSP_PATTERN'];
  const numPat = TEMPLATE_BY_ID['TPL-AR_PATTERN'];
  assert.equal(vspPat.modality_pair_id, 'TPL-AR_PATTERN');
  assert.equal(numPat.modality_pair_id, 'TPL-AR_VSP_PATTERN');
  // The visual twin serves VSP.PATTERN alone; the numeric format is RE-HOSTED
  // on the same strand rather than cloned, so its strand list is wider — the
  // containment below is what makes that safe, and the distinct skill ids are
  // what keep the two demands from being rolled up as one.
  assert.deepEqual(vspPat.strands, ['VSP.PATTERN']);
  for (const s of vspPat.strands) assert.ok(numPat.strands.includes(s), `the re-hosted format dropped ${s}`);
  assert.ok(numPat.strands.includes('NUM.PATTERN'), 'the numeric ladder lost its own pattern format');
  assert.equal(TEMPLATE_BY_ID['TPL-AR_PATTERN'].strands.includes('VSP.PATTERN'), true,
    'TPL-AR_PATTERN never declared the VSP twin it pairs with');
  assert.equal(TARGET_SKILL_BY_TEMPLATE['TPL-AR_PATTERN'], 'pattern-extend-numeric');
  assert.notEqual(TARGET_SKILL_BY_TEMPLATE['TPL-AR_VSP_PATTERN'], TARGET_SKILL_BY_TEMPLATE['TPL-AR_PATTERN'],
    'the re-hosted visual format was filed under the numeric skill');
});

test('content: nothing in COMM can require speech, and a choice has no wrong answer', () => {
  for (const t of PHASE5_TEMPLATES) {
    assert.equal(t.vocal_required, false, `${t.id} requires vocal output`);
  }
  const commItems = PHASE5_BANK.filter((i) => i.strand.startsWith('COMM'));
  assert.ok(commItems.length >= 12, `${commItems.length} COMM items`);
  for (const i of commItems) {
    assert.equal(i.vocal_required, false, `${i.item_id} requires a spoken answer`);
    assert.equal(i.accepts_any_output, true, `${i.item_id} accepts only one output form`);
    assert.equal(STRAND_BY_ID[i.strand].vocal_required, false, `${i.strand} is a vocal-required strand`);
    const nonVocal = (i.response_modes ?? []).some((m) => m !== 'any_vocal_helper_confirmed' && m !== 'vocal_attempt');
    assert.equal(nonVocal, true, `${i.item_id} has no non-vocal response mode`);
    assert.ok((i.options ?? []).length >= 2, `${i.item_id} has no picture fallback`);
  }
  // A choice board has no correct tile: the child's own choice IS the answer.
  const choice = PHASE5_BANK.filter((x) => x.strand === 'COMM.EXPRESS_CHOICE');
  assert.ok(choice.length >= 6);
  for (const i of choice) {
    assert.equal(i.correct_index, undefined, `${i.item_id} scored a preference right or wrong`);
    assert.equal(i.expected_taps, 1);
    assert.equal(i.helper_confirm, false, `${i.item_id} gates a tap behind an adult`);
    assert.equal(i.any_response_is_success, true);
    assert.ok(/[\u0600-\u06FF]/.test(i.prompt.ar));
  }
  assert.equal(PHASE5_BANK.some((i) => i.vocal_required === true), false, 'a vocal-required item exists in the bank');
});

test('content: the av2 items stay prototype-grade and honestly labelled', () => {
  const av2Items = PHASE5_BANK.filter((x) => x.strand.startsWith('VSP') || x.strand.startsWith('MEM') || x.strand.startsWith('COMM'));
  assert.ok(av2Items.length >= 42, `${av2Items.length} av2 items generated`);
  for (const i of av2Items) {
    assert.equal(i.validation_status, 'RESEARCH_INFORMED_PROTOTYPE');
    assert.equal(i.specialist_review_status, 'NOT_REVIEWED');
    assert.equal(i.reviewed_by, null);
    assert.ok(i.prompt?.ar && i.prompt?.en, `${i.item_id} is missing a mirror`);
    assert.ok(/[\u0600-\u06FF]/.test(i.prompt.ar), `${i.item_id} instruction is not Arabic`);
    assert.equal(i.language_light, true, `${i.item_id} is a language-light item without the flag`);
    assert.doesNotMatch(`${i.stimulus ?? ''}${(i.options ?? []).join('')}`, /[٠-٩0-9]/, `${i.item_id} put a numeral in a non-symbolic ladder`);
    assert.equal(i.vowelised, undefined, `${i.item_id} claims a vowelised Arabic reading target it does not have`);
  }
  // A disappearing display really is three tiles from the pool.
  for (const i of PHASE5_BANK.filter((x) => x.strand === 'MEM.VISUAL_STM')) {
    assert.equal(i.set_size, 3);
    assert.equal(i.tiles_shown.length, 3);
    assert.ok(i.tiles_shown.includes(i.disappeared));
    assert.ok(i.options.includes(i.disappeared), 'the disappeared tile was not even offered');
    assert.equal(new Set(i.tiles_shown).size, 3, `${i.item_id} showed the same tile twice`);
  }
  // A sequence names two steps and can actually be answered.
  for (const i of PHASE5_BANK.filter((x) => x.strand === 'MEM.SEQUENCE')) {
    assert.equal(i.correct_order.length, 2);
    assert.ok(i.audio_ar.includes('الأول'), `${i.item_id} instruction does not order anything`);
    for (const step of i.correct_order) {
      assert.ok(i.options.includes(step), `${i.item_id} asks for a tile it does not show`);
    }
  }
  // Odd-one-out needs at least three tiles for "different" to mean anything.
  for (const i of PHASE5_BANK.filter((x) => x.strand === 'VSP.DIFFERENCE')) {
    assert.ok(i.options.length >= 3, `${i.item_id} asks for an odd tile out of two`);
    assert.ok(i.options.some((o, k) => k !== i.correct_index));
  }
});
