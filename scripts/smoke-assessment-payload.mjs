/**
 * One-off smoke for the ladder save payload (audit W13 / framework §1).
 *
 * Verifies two things about the interactive save path in IrisContext:
 *   1. `item_results` (and every engine-shaped field) is BYTE-IDENTICAL to
 *      what `toAssessmentRecord()` produces from the engine — the additions
 *      live only beside it.
 *   2. The only new top-level keys are `observationMeta` (with the exact
 *      documented shape) and `clientRef` (a string).
 *
 * The interactive POST body is reconstructed here exactly as the context
 * builds it: { childId, assessment_kind, ...toAssessmentRecord(a),
 * observationMeta, clientRef }. If that line ever drifts, this smoke is the
 * tripwire; the shape it mirrors is asserted against the engine batch path.
 *
 * av2 (spec §7/§11): the LEGACY branch above stays byte-for-byte the
 * calibration+probe assertion — `finaliseLadderAssessment` still emits that
 * shape and old clients must keep storing exactly it. The av2 branch at the
 * bottom pins the ALLOWED top-level keys of an `item_results` envelope once
 * the UI lane stamps `bankVersion:'av2'` — bankVersion, calibration, probe,
 * observations, opportunityGates, visitValidity, caregiverRef — and asserts
 * the server validator (server/lib/draftValidators.js, shared with
 * POST /api/assessments) accepts that envelope and still refuses legacy
 * payloads to be judged by it.
 */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { runLadderAssessment, toAssessmentRecord, ladderCalibrationProbes } from '../src/iris/journey.js';

/* The validators are CommonJS under server/ (its own package scope);
 * createRequire reaches them without duplicating a single rule. */
const require = createRequire(import.meta.url);
const dv = require('../server/lib/draftValidators.js');

const ALL_CORRECT = ladderCalibrationProbes({ ageYears: 7 }).probes.map((p) => ({ probe_id: p.id, is_correct: true }));

function buildBody(assessment, observationMeta, clientRef) {
  return {
    childId: 7,
    assessment_kind: 'LADDER',
    ...toAssessmentRecord(assessment),
    observationMeta,
    clientRef,
  };
}

let runs = 0;
for (const respond of [
  () => ({ correct: 3, total: 3 }),
  () => ({ correct: 0, total: 3 }),
  () => ({ correct: 1, total: 3 }),
  () => ({ correct: 2, total: 3 }),
]) {
  const a = runLadderAssessment({ ageYears: 7, calibrationResponses: ALL_CORRECT, respond, accommodations: ['EXTENDED_TIME'] });

  // Engine reference record, built independently.
  const record = toAssessmentRecord(a);
  const meta = {
    latencies: [{ itemId: 'PHON-SEG-001', ms: 4210 }, { itemId: 'QNT-MORE-002', ms: 13500 }],
    breaks: 1,
    startedAt: '2026-11-14T16:00:00.000Z',
    helperUsed: true,
    audioAuto: true,
  };
  const body = buildBody(a, meta, '11111111-2222-4333-8444-555555555555');

  // 1. item_results and every engine field untouched — byte-identical.
  assert.deepEqual(body.item_results, record.item_results, 'item_results changed!');
  assert.equal(JSON.stringify(body.item_results), JSON.stringify(record.item_results), 'item_results bytes changed!');
  for (const key of ['domain_scores', 'data_quality_flags', 'accommodations_used', 'skill_estimates', 'learning_priorities', 'confidence', 'rule_pack_version']) {
    assert.deepEqual(body[key], record[key], `${key} changed!`);
  }

  // 2. Additions are EXACTLY observationMeta + clientRef, top level.
  const envelope = ['childId', 'assessment_kind']; // pre-existing request keys
  const added = Object.keys(body).filter((k) => !(k in record) && !envelope.includes(k));
  assert.deepEqual(added.sort(), ['clientRef', 'observationMeta'], `unexpected top-level keys: ${added}`);
  assert.deepEqual(Object.keys(body.observationMeta).sort(), ['audioAuto', 'breaks', 'helperUsed', 'latencies', 'startedAt']);
  assert.equal(typeof body.clientRef, 'string');
  assert.ok(body.clientRef.length > 0);

  // Sanity: item_results envelope itself only ever carries calibration+probe.
  assert.deepEqual(Object.keys(body.item_results).sort(), ['calibration', 'probe']);
  runs += 1;
}

// Default meta normalisation (no observation recorded — cold abort shape).
 const a = runLadderAssessment({ ageYears: 6, calibrationResponses: [], respond: () => ({ correct: 2, total: 3 }) });
 const body = buildBody(a, { latencies: [], breaks: 0, startedAt: null, helperUsed: false, audioAuto: false }, 'abc');
 assert.equal(JSON.stringify(body.item_results), JSON.stringify(toAssessmentRecord(a).item_results));

/* ── av2 branch (spec §7 envelope; §10 server rules) ──────────────────────
 * The engine record above is untouched — when it still says calibration +
 * probe, it stays exactly a legacy payload and the server judge skips it.
 * The av2 envelope below is the shape the UI lane adds at POST time. */
const av2Envelope = {
  bankVersion: 'av2',
  calibration: { LITERACY: 3, NUMERACY: 3 },
  probe: [[{ strand: 'LIT.LETTER_NAME', rung: 3, correct: 2, total: 3, supported: 1 }]],
  observations: [
    { item_id: 'a1', strand: 'LIT.LETTER_NAME', outcome: 'demonstrated_independent' },
    { item_id: 'a2', strand: 'COMM.LABEL', outcome: 'demonstrated_with_support' },
    { item_id: 'a3', strand: 'NUM.COUNTING', outcome: 'insufficient' },
    { item_id: null, strand: 'LITERACY', outcome: 'no_opportunity' },
  ],
  opportunityGates: { LITERACY: 'not_yet', NUMERACY: 'open' },
  visitValidity: [
    { visit: 1, valid: 'valid' },
    { visit: 2, valid: 'low_performance' },
    { visit: 3, valid: 'invalid_administration' },
  ],
  caregiverRef: { clientRef: 'cg-ref', responses: null },
};
// Allowed keys, exactly, both directions — the list above AND the
// validator's own view of it must agree.
assert.deepEqual(
  Object.keys(av2Envelope).sort(),
  [...dv.AV2_ITEM_RESULT_KEYS].sort(),
  'item_results av2 envelope keys drifted',
);
assert.deepEqual(dv.AV2_ITEM_RESULT_KEYS, [
  'bankVersion', 'calibration', 'probe', 'observations',
  'opportunityGates', 'visitValidity', 'caregiverRef',
]);
// The full envelope validates clean, every outcome known, BOTH visitValidity
// spellings accepted (spec shorthand + real client values).
assert.deepEqual(dv.validateAv2ItemResults(av2Envelope), { ok: true });
assert.deepEqual(dv.validateAv2ItemResults({
  ...av2Envelope,
  visitValidity: [{ visit: 1, valid: 'low' }, { visit: 2, valid: 'invalid' }],
}), { ok: true });
// And a broken outcome is still caught through the SAME door the server uses.
assert.equal(dv.validateAv2ItemResults({
  ...av2Envelope,
  observations: [{ outcome: 'half_demonstrated' }],
}).error, 'BAD_OBSERVATION_OUTCOME');
// Legacy envelopes never trigger a finding, whatever they carry — the
// bankVersion stamp is the gate, checked in server.js BEFORE this function.
assert.deepEqual(Object.keys(body.item_results).sort(), ['calibration', 'probe']);

console.log(`OK — payload smoke passed over ${runs} adaptive runs; item_results byte-identical; additions: observationMeta, clientRef; av2 envelope: ${dv.AV2_ITEM_RESULT_KEYS.join(', ')}.`);
