/**
 * av2 §8 — computeTrackDiscrepancies: the two tracks compared, NEVER
 * averaged.
 *
 * The contract (spec §8): categorical entries only — family, parent,
 * observed, note{ar,en}. No number from either instrument may enter, since
 * averaging a home report and a screen observation is a category error
 * (§0.3, asserted by the never-numeric walk below). Tolerance is half the
 * contract: a phase5-1.0.0 snapshot without the new strand names, or an
 * absent caregiver / absent ladder, yields [] — never a crash, never a
 * manufactured claim.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeTrackDiscrepancies, buildFamilyLearningProfile,
  PARENT_STATE_WORDS, OBSERVED_STATE_WORDS, DISCREPANCY_FAMILY_WORDS,
} from '../src/iris/caregiver/merge.js';
import { scoreCaregiverProfile } from '../src/iris/caregiver/scoring.js';

/* ── fixtures ─────────────────────────────────────────────────────────── */
const cgStates = (over = {}) => ({
  domainStates: {
    C: { state: 'does_independently', confidence: 'HIGH', answered: 4, eligible: 4 },
    L: { state: 'emerging', confidence: 'MEDIUM', answered: 3, eligible: 4 },
    S: { state: 'does_with_support', confidence: 'MEDIUM', answered: 2, eligible: 5 },
    M: { state: 'emerging', confidence: 'MEDIUM', answered: 2, eligible: 4 },
    P: { state: 'does_independently', confidence: 'HIGH', answered: 3, eligible: 3 },
    H: { state: 'needs_more_information', confidence: 'LOW', answered: 1, eligible: 4 },
    ...over,
  },
  supportIntensity: { S: { type: 'partial_physical', frequency: 'sometimes', time: 'lt15' } },
});

/** An av2-ish ladder: indicators keyed by strand id, as journey hands them. */
const listenFloor = {
  'LIT.LISTEN_WORD': { strand: 'LIT.LISTEN_WORD', ladder: 'LITERACY', track: 'LISTENING', indicator: null, notMeasured: true, floor: true },
  'COMM.EXPRESS_CHOICE': { strand: 'COMM.EXPRESS_CHOICE', ladder: 'LITERACY', track: 'COMM', indicator: null, notMeasured: true, floor: true },
};
const listenWin = {
  'LIT.LISTEN_WORD': { strand: 'LIT.LISTEN_WORD', ladder: 'LITERACY', track: 'LISTENING', indicator: 61, notMeasured: false, floor: false },
  'LIT.LETTER_NAME': { strand: 'LIT.LETTER_NAME', ladder: 'LITERACY', track: 'MAIN', indicator: 40, notMeasured: false, floor: false },
};
const av2LadderFloor = { indicators: { ...listenFloor, 'LIT.LETTER_NAME': { strand: 'LIT.LETTER_NAME', ladder: 'LITERACY', track: 'MAIN', indicator: null, notMeasured: true, floor: true }, 'NUM.COUNTING': { strand: 'NUM.COUNTING', ladder: 'NUMERACY', track: 'MAIN', indicator: null, notMeasured: true, floor: true } } };
const av2LadderWin = { indicators: { ...listenWin, 'NUM.COUNTING': { strand: 'NUM.COUNTING', ladder: 'NUMERACY', track: 'MAIN', indicator: 55, notMeasured: false, floor: false } } };

/** Recursively assert that a value contains NO number anywhere. */
function assertNoNumbers(v, path = 'root') {
  if (typeof v === 'number') throw new assert.AssertionError({ message: `numeric value at ${path}` });
  if (Array.isArray(v)) v.forEach((x, i) => assertNoNumbers(x, `${path}[${i}]`));
  else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => assertNoNumbers(x, `${path}.${k}`));
}

/* ── symmetry: both directions of the same disagreement are found ─────── */
test('discrepancies: home-yes/screen-no and screen-yes/home-support are symmetric entries', () => {
  const fwd = computeTrackDiscrepancies(cgStates(), av2LadderFloor);
  const commFwd = fwd.filter((d) => d.family === 'communication');
  assert.equal(commFwd.length, 1, JSON.stringify(fwd));
  assert.equal(commFwd[0].parent, 'does_independently');
  assert.equal(commFwd[0].observed, 'not_demonstrated');

  const rev = computeTrackDiscrepancies(
    cgStates({ C: { state: 'does_with_support', confidence: 'MEDIUM', answered: 4, eligible: 4 } }),
    av2LadderWin,
  );
  const commRev = rev.filter((d) => d.family === 'communication');
  assert.equal(commRev.length, 1, JSON.stringify(rev));
  assert.equal(commRev[0].parent, 'does_with_support');
  assert.equal(commRev[0].observed, 'demonstrated');

  // opposite rules, opposite notes — and both notes bilingual, neutral.
  assert.notEqual(commFwd[0].note.en, commRev[0].note.en);
  for (const d of [...commFwd, ...commRev]) {
    assert.ok(d.note.ar && d.note.en);
    assert.ok(typeof d.note.ar === 'string' && typeof d.note.en === 'string');
  }
});

test('discrepancies: the support family reads the av2 outcome log, both directions', () => {
  const homeHelpedScreenIndependent = computeTrackDiscrepancies(
    cgStates(), // S = does_with_support + partial_physical
    { indicators: {}, observations: [{ outcome: 'demonstrated_independent' }, { outcome: 'demonstrated_independent' }] },
  );
  const sup = homeHelpedScreenIndependent.filter((d) => d.family === 'support');
  assert.equal(sup.length, 1);
  assert.equal(sup[0].observed, 'independent');

  const homeAloneScreenHelped = computeTrackDiscrepancies(
    { domainStates: { S: { state: 'does_independently', confidence: 'HIGH' } }, supportIntensity: { S: { type: 'none' } } },
    { indicators: {}, observations: [{ outcome: 'demonstrated_with_support' }] },
  );
  assert.equal(homeAloneScreenHelped.filter((d) => d.family === 'support').length, 1);
  // a MIXED outcome log is not a discrepancy — nothing is forced into a pair.
  assert.equal(computeTrackDiscrepancies(cgStates(), { indicators: {}, observations: [{ outcome: 'demonstrated_independent' }, { outcome: 'demonstrated_with_support' }] })
    .filter((d) => d.family === 'support').length, 0);
});

test('discrepancies: learning exposure vs LIT/NUM entry — a gated block that succeeded on screen is information, not contradiction', () => {
  const gated = { ...cgStates({ L: { state: 'not_yet_opportunity', confidence: 'MEDIUM', answered: 4, eligible: 4 } }), opportunityGates: { LITERACY: 'not_yet' } };
  const found = computeTrackDiscrepancies(gated, av2LadderWin);
  const learn = found.filter((d) => d.family === 'learning');
  assert.equal(learn.length, 1, JSON.stringify(found));
  assert.equal(learn[0].observed, 'demonstrated');
  // and the mirror: exposure said yes, screen floored → re-check tone only.
  const mirrored = computeTrackDiscrepancies(cgStates(), av2LadderFloor);
  assert.equal(mirrored.filter((d) => d.family === 'learning').length, 1);
});

/* ── never numeric ────────────────────────────────────────────────────── */
test('discrepancies: NEVER numeric, and insensitive to numeric drift in either track', () => {
  const ds = computeTrackDiscrepancies(cgStates(), av2LadderFloor);
  assert.ok(ds.length > 0, 'fixtures should disagree somewhere');
  assertNoNumbers(ds);
  for (const d of ds) {
    assert.deepEqual(Object.keys(d).sort(), ['family', 'note', 'observed', 'parent']);
    assert.ok(Object.keys(DISCREPANCY_FAMILY_WORDS).includes(d.family));
    assert.ok(Object.keys(PARENT_STATE_WORDS).includes(d.parent), d.parent);
    assert.ok(Object.keys(OBSERVED_STATE_WORDS).includes(d.observed), d.observed);
  }
  // the two entries before and after a purely NUMERIC change of the ladder
  // are identical: numbers cannot move a discrepancy, only categories can.
  const numericDrift = JSON.parse(JSON.stringify(av2LadderFloor));
  for (const i of Object.values(numericDrift.indicators)) { i.indicator = 12; i.confidence = 'HIGH'; }
  assert.deepEqual(computeTrackDiscrepancies(cgStates(), numericDrift), ds);
});

/* ── tolerance ────────────────────────────────────────────────────────── */
test('discrepancies: legacy phase5-1.0.0 ladders and absent tracks yield [], never a crash', () => {
  // merge() fixtures across this suite: the old snapshot shape carried no
  // indicators at all — compare nothing.
  assert.deepEqual(computeTrackDiscrepancies(cgStates(), { learningPriorities: [{ id: 'strand:x' }] }), []);
  assert.deepEqual(computeTrackDiscrepancies(cgStates(), { indicators: {} }), []);
  // COMM names absent (phase5-1.0.0): only the families WITH names compare;
  // a receptive-track floor is a legitimate observation even so.
  const legacy = { indicators: { 'LIT.LISTEN_WORD': { track: 'LISTENING', notMeasured: true, floor: true } } };
  const out = computeTrackDiscrepancies(cgStates(), legacy);
  assert.equal(out.filter((d) => d.family === 'support').length, 0, 'no outcome log ⇒ the support family declines');
  assert.ok(out.every((d) => !String(d.observed).includes('COMM')));
  // absent on either side — and on both.
  assert.deepEqual(computeTrackDiscrepancies(null, av2LadderFloor), []);
  assert.deepEqual(computeTrackDiscrepancies(cgStates(), null), []);
  assert.deepEqual(computeTrackDiscrepancies(undefined, undefined), []);
  assert.deepEqual(computeTrackDiscrepancies({}, {}), []);
});

/* ── cv1 caregiver shape is OK (no domainStates assumptions beyond cv2) ── */
test('discrepancies: a real cv1 scored object flows through unchanged', () => {
  const scored = scoreCaregiverProfile({
    meta: { childAgeMonths: 84, completed: true },
    responses: {
      C1: { v: 'independent' }, C2: { v: 'independent' }, C3: { v: 'independent' }, C4: { v: 'independent' },
      S1: { v: 'little_help', t: 'supervise', f: 'sometimes', tm: 'lt15' },
      S2: { v: 'hands_on', t: 'partial_physical', f: 'often', tm: '15_30' },
      S4: { v: 'hands_on', t: 'partial_physical', f: 'often', tm: '15_30' },
    },
  });
  const out = computeTrackDiscrepancies(scored, av2LadderFloor);
  assert.ok(Array.isArray(out));
  assertNoNumbers(out);
  // buildFamilyLearningProfile attaches the list on EVERY shape, empty or not.
  const profile = buildFamilyLearningProfile({ caregiver: scored, ladderSnapshot: av2LadderFloor });
  assert.ok(Array.isArray(profile.discrepancies));
  assert.deepEqual(profile.discrepancies, out);
});

/* ── the merge surface stays whole ────────────────────────────────────── */
test('discrepancies: attached as profile.discrepancies; priorities and the static note untouched', () => {
  const both = buildFamilyLearningProfile({
    caregiver: { ...cgStates(), unmetNeeds: [{ itemId: 'S2', block: 'S', ar: 'حاجة', en: 'a need' }] },
    ladderSnapshot: { ...av2LadderFloor, learningPriorities: [{ id: 'strand:a', labelAr: 'أ', labelEn: 'a', whyAr: 'و', whyEn: 'w' }, { id: 'strand:b', labelAr: 'ب', labelEn: 'b', whyAr: 'و', whyEn: 'w' }] },
    child: { name: 'وديد', ageMonths: 90 },
  });
  assert.ok(Array.isArray(both.discrepancies) && both.discrepancies.length > 0);
  // the resolver is unchanged: track-balanced priorities, same cap, and the
  // divergence sentence still exists beside the strip as the static fallback.
  assert.equal(both.priorities.length, 3);
  assert.ok(both.divergenceNote && both.divergenceNote.ar);
  assertNoNumbers(both.discrepancies);
  // determinism: two calls, identical JSON (no clock, no randomness).
  const again = buildFamilyLearningProfile({
    caregiver: { ...cgStates(), unmetNeeds: [{ itemId: 'S2', block: 'S', ar: 'حاجة', en: 'a need' }] },
    ladderSnapshot: { ...av2LadderFloor, learningPriorities: [{ id: 'strand:a', labelAr: 'أ', labelEn: 'a', whyAr: 'و', whyEn: 'w' }, { id: 'strand:b', labelAr: 'ب', labelEn: 'b', whyAr: 'و', whyEn: 'w' }] },
    child: { name: 'وديد', ageMonths: 90 },
  });
  assert.deepEqual(JSON.parse(JSON.stringify(again.discrepancies)), JSON.parse(JSON.stringify(both.discrepancies)));
  // a single track never fabricates a strip.
  assert.deepEqual(buildFamilyLearningProfile({ caregiver: cgStates() }).discrepancies, []);
  assert.deepEqual(buildFamilyLearningProfile({ ladderSnapshot: av2LadderFloor }).discrepancies, []);
});
