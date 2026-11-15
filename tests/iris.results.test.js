/**
 * iris — getting-to-know result screen (src/iris/journey/results.js).
 *
 * What these tests pin:
 *   1. The exact export contract the UI will bind to: headline / honestLine /
 *      skills rows / strengths / nextSteps / hasChildEvidence, and the four
 *      RESULT_STATE_COPY states.
 *   2. The module reads REAL engine output. The main fixture is a genuine
 *      finaliseLadderAssessment() object built through runCalibration +
 *      runProbe with a scripted respond — the same path the UI drives.
 *   3. Rows appear ONLY for attempted tracks, in ladder order, and every
 *      emitted string is non-empty bilingual.
 *   4. The descriptive-only rule: no banned word (IQ, ذكاء, تشخيص, درجة,
 *      'level =', %) and no digit anywhere in the output — the page cannot
 *      contain a number because no number is ever let out of the engine.
 *   5. Caregiver line: filled from the REAL scoreCaregiverProfile shape for
 *      mapped blocks, null for unmapped (memory/attention) and absent inputs.
 *   6. Missing everything → hasChildEvidence false, empty skills, no crash.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { runCalibration } from '../src/iris/engines/calibration.js';
import { runProbe } from '../src/iris/engines/adaptiveProbe.js';
import { finaliseLadderAssessment } from '../src/iris/journey.js';
import { scoreCaregiverProfile } from '../src/iris/caregiver/scoring.js';
import { getCaregiverBlocks } from '../src/iris/caregiver/bank.js';
import { LADDER_IDS, tracksFor } from '../src/iris/ladders/index.js';

import {
  buildGettingToKnowResult, RESULT_STATE_COPY, RESULT_STATE_KEYS,
} from '../src/iris/journey/results.js';

// ── helpers ────────────────────────────────────────────────────────────────
const cal = (map) => Object.entries(map).map(([probe_id, is_correct]) => ({ probe_id, is_correct }));
const ALL_CORRECT = cal({
  'CAL-01': true, 'CAL-02': true, 'CAL-03': true, 'CAL-04': true, 'CAL-05': true,
  'CAL-06': true, 'CAL-07': true, 'CAL-08': true, 'CAL-09': true, 'CAL-10': true,
});

/**
 * A scripted child:
 *   LITERACY MAIN/LISTENING + NUMERACY — everything right  → solo
 *   COMM — one of three, never climbs                     → emerging
 *   MEM  — everything answered only with a scaffold        → help
 *   VSP  — never reaches a scorable answer                 → more_info
 */
function scriptedLadder() {
  const calibration = runCalibration({ ageYears: 7, responses: ALL_CORRECT });
  const probe = runProbe(calibration, (visit) => {
    if (visit.ladder === 'VSP') return { correct: 0, total: 3, insufficient: 3 };
    if (visit.ladder === 'MEM') return { correct: 0, total: 3, supported: 3 };
    if (visit.ladder === 'LITERACY' && visit.track === 'COMM') return { correct: 1, total: 3 };
    return { correct: 3, total: 3 };
  });
  return finaliseLadderAssessment({ calibration, probe });
}

/** A real caregiver profile: independent answers in C, L and M. */
function scriptedCaregiver() {
  const responses = {};
  for (const id of ['C', 'L', 'M']) {
    const block = getCaregiverBlocks().find((b) => b.id === id);
    for (const item of block.items.filter((i) => i.scored).slice(0, 4)) {
      responses[item.id] = { v: 'independent' };
    }
  }
  return scoreCaregiverProfile({ meta: { childAgeMonths: 90, completed: true }, responses });
}

/** Every string the screen can render, flattened — the banned-word sweep. */
function allStrings(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => allStrings(v, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => allStrings(v, out));
  return out;
}

const BANNED_SUBSTRINGS = ['IQ', 'iq,', 'ذكاء', 'تشخيص', 'درجة', 'level =', '%'];

// ══ the contract ═══════════════════════════════════════════════════════════
test('contract: RESULT_STATE_COPY exposes the four states with bilingual chip + meaning', () => {
  assert.deepEqual([...RESULT_STATE_KEYS], ['solo', 'help', 'emerging', 'more_info']);
  assert.deepEqual(Object.keys(RESULT_STATE_COPY), [...RESULT_STATE_KEYS]);
  for (const key of RESULT_STATE_KEYS) {
    const c = RESULT_STATE_COPY[key];
    for (const field of ['ar', 'en', 'meaningAr', 'meaningEn']) {
      assert.equal(typeof c[field], 'string', `${key}.${field} must be a string`);
      assert.ok(c[field].trim().length > 0, `${key}.${field} must not be empty`);
    }
  }
});

test('contract: top-level shape is headline/honestLine/skills/strengths/nextSteps/hasChildEvidence', () => {
  const r = buildGettingToKnowResult({ ladderResult: scriptedLadder(), childName: 'يوسف' });
  assert.deepEqual(
    Object.keys(r).sort(),
    ['hasChildEvidence', 'headline', 'honestLine', 'nextSteps', 'skills', 'strengths'],
  );
  assert.equal(r.headline, 'اتعرفنا على يوسف النهاردة');
  assert.equal(typeof r.honestLine, 'string');
  assert.ok(r.honestLine.includes('مش حكم'), 'the honest line must stay a calm description');
  assert.equal(r.hasChildEvidence, true);
  for (const list of [r.strengths, r.nextSteps]) {
    assert.ok(Array.isArray(list));
    for (const s of list) assert.equal(typeof s, 'string');
  }
});

// ══ rows only for attempted tracks, in ladder order ════════════════════════
test('skills: one row per attempted track, in ladder order (LITERACY → NUMERACY → VSP → MEM)', () => {
  const expectedOrder = [];
  for (const ladder of LADDER_IDS) {
    for (const track of tracksFor(ladder)) expectedOrder.push(`${ladder}:${track}`);
  }
  assert.deepEqual(expectedOrder, [
    'LITERACY:MAIN', 'LITERACY:LISTENING', 'LITERACY:COMM',
    'NUMERACY:MAIN', 'VSP:MAIN', 'MEM:MAIN',
  ], 'the registry itself changed — revisit the labels map');

  const r = buildGettingToKnowResult({ ladderResult: scriptedLadder(), childName: 'يوسف' });
  assert.deepEqual(r.skills.map((s) => s.key), expectedOrder, 'the scripted session attempts every track');
});

test('skills: an unattempted track gets no row at all', () => {
  const ladder = {
    probe: {
      results: [{
        strand: 'NUM.COUNTING', ladder: 'NUMERACY', track: 'MAIN', rung: 0,
        correct: 2, total: 3, supported: 0, insufficient: 0, invalid_flag: false,
      }],
      tracks: {},
    },
    stops: {},
    indicators: {
      'NUM.COUNTING': {
        strand: 'NUM.COUNTING', ladder: 'NUMERACY', track: 'MAIN',
        code: 'NUM-C', nameAr: 'العدّ', nameEn: 'Counting',
        indicator: 40, notMeasured: false, floor: false, reason: null,
        items: 3, accuracy: 0.667, support_ratio: 0, independence: 1,
        highest_rung: 0, confidence: 'MEDIUM', flags: [],
      },
    },
    profile: { strengths: [], developing: [], profile_shape: 'FLAT', classified: {} },
    priorities: [],
  };
  const r = buildGettingToKnowResult({ ladderResult: ladder });
  assert.equal(r.skills.length, 1, 'only the walked track may appear');
  assert.equal(r.skills[0].key, 'NUMERACY:MAIN');
  assert.ok(RESULT_STATE_KEYS.includes(r.skills[0].state));
  assert.ok(['solo', 'help', 'emerging'].includes(r.skills[0].state), 'counted evidence is not more_info');
});

// ══ states, derived from the REAL engine output ════════════════════════════
test('states: solo/help/emerging/more_info come out of a genuine finaliseLadderAssessment object', () => {
  const ladder = scriptedLadder();
  const r = buildGettingToKnowResult({ ladderResult: ladder, childName: 'يوسف' });
  const byKey = Object.fromEntries(r.skills.map((s) => [s.key, s]));
  for (const s of r.skills) assert.ok(RESULT_STATE_KEYS.includes(s.state), `bad state ${s.state}`);
  assert.equal(byKey['LITERACY:MAIN'].state, 'solo');
  assert.equal(byKey['LITERACY:LISTENING'].state, 'solo');
  assert.equal(byKey['NUMERACY:MAIN'].state, 'solo');
  assert.equal(byKey['MEM:MAIN'].state, 'help');
  assert.equal(byKey['VSP:MAIN'].state, 'more_info');
  assert.equal(byKey['LITERACY:COMM'].state, 'emerging');
});

test('states: a track stopped on INSUFFICIENT_INFORMATION is more_info, a floored track is emerging', () => {
  const mk = (track, stopReason, indOver) => ({
    probe: { results: [{ strand: `${track}.X`, ladder: track.split(':')[0], track: track.split(':')[1], rung: 0, correct: 0, total: 3, supported: 0, insufficient: 3 }], tracks: {} },
    stops: { [track]: { stop_reason: stopReason } },
    indicators: {
      [`${track}.X`]: {
        strand: `${track}.X`, ladder: track.split(':')[0], track: track.split(':')[1],
        code: 'X', nameAr: 'حاجة', nameEn: 'A thing',
        indicator: null, items: 0, accuracy: null, support_ratio: null, highest_rung: null,
        ...indOver,
      },
    },
    profile: { strengths: [], developing: [] },
    priorities: [],
  });
  const gated = buildGettingToKnowResult({
    ladderResult: mk('VSP:MAIN', 'INSUFFICIENT_INFORMATION', { notMeasured: true, floor: false, reason: 'NEEDS_MORE_INFORMATION' }),
  });
  assert.equal(gated.skills.length, 1);
  assert.equal(gated.skills[0].state, 'more_info');

  const floored = buildGettingToKnowResult({
    ladderResult: mk('MEM:MAIN', 'BASE_FLOOR', { notMeasured: true, floor: true, reason: 'FLOOR_NO_CORRECT_RESPONSE', items: 3 }),
  });
  assert.equal(floored.skills[0].state, 'emerging');
});

// ══ row content: bilingual, non-empty, honest ══════════════════════════════
test('rows: every string field is non-empty; parent line only for mapped caregiver blocks', () => {
  const r = buildGettingToKnowResult({
    ladderResult: scriptedLadder(),
    caregiverProfile: scriptedCaregiver(),
    childName: 'يوسف',
  });
  for (const s of r.skills) {
    for (const field of ['key', 'nameAr', 'nameEn', 'stateAr', 'stateEn', 'evidenceLineAr', 'evidenceLineEn']) {
      assert.equal(typeof s[field], 'string', `${s.key}.${field} must be a string`);
      assert.ok(s[field].trim().length > 0, `${s.key}.${field} must not be empty`);
    }
    const copy = RESULT_STATE_COPY[s.state];
    assert.equal(s.stateAr, copy.ar);
    assert.equal(s.stateEn, copy.en);
  }
  const byKey = Object.fromEntries(r.skills.map((s) => [s.key, s]));
  // C/L/M are answered → language, listening, communication, numeracy, visual all get a home line.
  for (const key of ['LITERACY:MAIN', 'LITERACY:LISTENING', 'LITERACY:COMM', 'NUMERACY:MAIN', 'VSP:MAIN']) {
    assert.equal(typeof byKey[key].fromParentLineAr, 'string', `${key} should carry a home line`);
    assert.ok(byKey[key].fromParentLineAr.includes('وفي البيت، حسب كلامك'), key);
    assert.equal(typeof byKey[key].fromParentLineEn, 'string', key);
  }
  // No caregiver block talks about memory or attention — so none is invented.
  assert.equal(byKey['MEM:MAIN'].fromParentLineAr, null);
  assert.equal(byKey['MEM:MAIN'].fromParentLineEn, null);
});

test('rows: with no caregiverProfile every parent line is null', () => {
  const r = buildGettingToKnowResult({ ladderResult: scriptedLadder() });
  for (const s of r.skills) {
    assert.equal(s.fromParentLineAr, null);
    assert.equal(s.fromParentLineEn, null);
  }
});

// ══ descriptive only ═══════════════════════════════════════════════════════
test('descriptive only: no banned word and no digit anywhere in the output', () => {
  const inputs = [
    { ladderResult: scriptedLadder(), caregiverProfile: scriptedCaregiver(), childName: 'يوسف', lang: 'ar' },
    { ladderResult: scriptedLadder(), caregiverProfile: scriptedCaregiver(), lang: 'en' },
    {},
  ];
  for (const input of inputs) {
    const r = buildGettingToKnowResult(input);
    for (const str of allStrings(r)) {
      for (const banned of BANNED_SUBSTRINGS) {
        assert.ok(!str.includes(banned), `banned token «${banned}» in: ${str}`);
      }
      assert.ok(!/[0-9٠-٩]/.test(str), `a digit leaked into: ${str}`);
    }
    // and no numeric field sneaks into a skill row either
    for (const s of r.skills) {
      for (const v of Object.values(s)) assert.ok(typeof v === 'string' || v === null, `${s.key}: non-string/non-null ${typeof v}`);
    }
  }
});

// ══ strengths and next steps ═══════════════════════════════════════════════
test('strengths/nextSteps: string arrays drawn from the profile and the caregiver lists', () => {
  const r = buildGettingToKnowResult({
    ladderResult: scriptedLadder(), caregiverProfile: scriptedCaregiver(), childName: 'يوسف',
  });
  assert.ok(r.strengths.length >= 2 && r.strengths.length <= 4, `strengths count ${r.strengths.length}`);
  assert.ok(r.nextSteps.length >= 1 && r.nextSteps.length <= 3);
  for (const s of [...r.strengths, ...r.nextSteps]) assert.ok(s.trim().length > 0);
  const ladder = scriptedLadder();
  if (Array.isArray(ladder.priorities) && ladder.priorities.length) {
    const firstName = ladder.priorities[0].nameAr || ladder.priorities[0].nameEn;
    assert.ok(r.nextSteps.some((s) => s.includes(firstName.slice(0, 4))), 'next steps must echo learningPriorities');
  }
});

// ══ robustness ═════════════════════════════════════════════════════════════
test('empty everything: no crash, no child evidence, caregiver-only still readable', () => {
  for (const input of [{}, { ladderResult: {} }, { ladderResult: null, caregiverProfile: null }, undefined]) {
    const r = buildGettingToKnowResult(input ?? {});
    assert.equal(r.hasChildEvidence, false);
    assert.deepEqual(r.skills, []);
    assert.ok(r.headline.trim().length > 0);
    assert.ok(r.honestLine.trim().length > 0);
    assert.ok(Array.isArray(r.strengths));
    assert.ok(Array.isArray(r.nextSteps));
    for (const s of r.strengths) assert.equal(typeof s, 'string');
  }
  const caregiverOnly = buildGettingToKnowResult({ caregiverProfile: scriptedCaregiver(), lang: 'en' });
  assert.equal(caregiverOnly.hasChildEvidence, false);
  assert.equal(caregiverOnly.headline, 'What we got to know today');
  assert.ok(caregiverOnly.strengths.length >= 1, 'caregiver strengths may still fill the page');
});

test('lang: en gives an English headline and honest line; rows stay bilingual', () => {
  const r = buildGettingToKnowResult({ ladderResult: scriptedLadder(), childName: 'Youssef', lang: 'en' });
  assert.equal(r.headline, 'Getting to know Youssef today');
  assert.ok(r.honestLine.startsWith('This is only'));
  assert.ok(r.skills.every((s) => s.nameAr && s.nameEn && s.stateAr && s.stateEn));
});
