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
 */
import assert from 'node:assert/strict';
import { runLadderAssessment, toAssessmentRecord, ladderCalibrationProbes } from '../src/iris/journey.js';

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

console.log(`OK — payload smoke passed over ${runs} adaptive runs; item_results byte-identical; additions: observationMeta, clientRef.`);
