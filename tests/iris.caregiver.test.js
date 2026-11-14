import test from 'node:test';
import assert from 'node:assert/strict';
import { CAREGIVER_BANK_VERSION, getCaregiverBlocks, getCaregiverItems, bandFor } from '../src/iris/caregiver/bank.js';
import { scoreCaregiverProfile } from '../src/iris/caregiver/scoring.js';
import { buildFamilyLearningProfile } from '../src/iris/caregiver/merge.js';

const META = { childAgeMonths: 90, completed: true };
const blocks = getCaregiverBlocks();
const items = getCaregiverItems();
const scoredByBlock = (id) => blocks.find((b) => b.id === id).items.filter((i) => i.scored).map((i) => i.id);

test('bank: unique ids, bilingual copy, example anchors, stable order', () => {
  assert.equal(CAREGIVER_BANK_VERSION, 'cv1');
  assert.deepEqual(blocks.map((b) => b.id), ['C', 'L', 'S', 'M', 'P', 'H', 'G', 'X']);
  assert.deepEqual(blocks.map((b) => b.order), [1, 2, 3, 4, 5, 6, 7, 8]);
  const seen = new Set();
  for (const [id, it] of Object.entries(items)) {
    assert.ok(!seen.has(id), `duplicate id ${id}`);
    seen.add(id);
    assert.ok(it.ar?.q && it.en?.q, `${id} needs both questions`);
    assert.ok(Array.isArray(it.ar?.opts) && Array.isArray(it.en?.opts), `${id} needs option sets`);
    assert.deepEqual(it.ar.opts.map((o) => o.v), it.en.opts.map((o) => o.v), `${id} mirrored values`);
    if (it.scored && ['ability', 'gate_ability', 'frequency', 'situational'].includes(it.format)) {
      assert.ok(it.ar.ex && it.en.ex, `${id} scored item needs an example in BOTH languages`);
      it.ar.opts.forEach((o) => assert.ok(bandFor(id, o.v), `${id}/${o.v} must map to a band`));
    }
  }
  assert.equal(scoredByBlock('C').length, 8);
  assert.equal(Object.values(items).filter((i) => i.scored).length, 34);
});

test('bank: no banned vocabulary in any caregiver-facing string', () => {
  const bannedAr = ['معدل ذكاء', 'درجة ذكاء', 'درجة', 'مستوى الذكاء', 'تخلف', 'إعاقة ذهنية', 'معاق', 'مسكين', 'مريض', 'غير قابل'];
  const bannedEn = [/\bIQ\b/, /mental age/i, /severity/i, /level of functioning/i, /untestable/i, /normal child/i, /\bscore\b/i, /retarded/i, /suffers?\b/i, /\bvictim/i];
  const json = JSON.stringify({ blocks, triplet: true });
  for (const w of bannedAr) assert.ok(!json.includes(w), `banned Arabic term present: ${w}`);
  for (const re of bannedEn) assert.ok(!re.test(json), `banned English term present: ${re}`);
});

test('scoring: does_independently needs >=75% independent and zero hands_on', () => {
  const r = scoreCaregiverProfile({ meta: META, responses: { H1: { v: 'independent' }, H2: { v: 'independent' }, H4: { v: 'independent' } } });
  assert.equal(r.domainStates.H.state, 'does_independently');
  assert.equal(r.domainStates.H.confidence, 'HIGH');
  assert.ok(r.strengths.some((s) => s.itemId === 'H1'));
});

test('scoring: emerging is a mix that includes some independent', () => {
  const responses = { S1: { v: 'independent' }, S2: { v: 'independent' }, S4: { v: 'independent' }, S5: { v: 'little_help', t: 'supervise', f: 'sometimes', tm: 'lt15' }, S3: { v: 'does_not_yet' }, S6: { v: 'does_not_yet' } };
  const r = scoreCaregiverProfile({ meta: META, responses });
  assert.equal(r.domainStates.S.state, 'emerging');
});

test('scoring: does_with_support is a majority of helped items, with triplet majority', () => {
  const responses = { P1: { v: 'little_help', t: 'supervise', f: 'most_times', tm: '15_30' }, P2: { v: 'sometimes' }, P3: { v: 'hands_on', t: 'partial_physical', f: 'most_times', tm: '15_30' }, P5: { v: 'little_help', t: 'supervise', f: 'rarely', tm: 'none' } };
  const r = scoreCaregiverProfile({ meta: { ...META, completed: false }, responses });
  assert.equal(r.domainStates.P.state, 'does_with_support');
  assert.equal(r.domainStates.P.confidence, 'MEDIUM');
  assert.deepEqual(r.supportIntensity.P, { type: 'supervise', frequency: 'most_times', time: '15_30' });
  assert.ok(!('L' in r.supportIntensity && r.supportIntensity.L.type === undefined));
});

test('scoring: hands_on + met=unmet becomes unmet_need and lands in unmetNeeds', () => {
  const responses = { M1: { v: 'little_help', t: 'supervise', f: 'sometimes', tm: 'lt15' }, M3: { v: 'hands_on', t: 'full_physical', f: 'always', tm: '30_60', met: 'unmet' }, M4: { v: 'hands_on', t: 'partial_physical', f: 'most_times', tm: '15_30', met: 'unmet' }, M5: { v: 'independent' } };
  const r = scoreCaregiverProfile({ meta: META, responses });
  assert.equal(r.domainStates.M.state, 'unmet_need');
  assert.deepEqual(r.domainStates.M.unmet.sort(), ['M3', 'M4']);
  assert.ok(r.unmetNeeds.some((u) => u.itemId === 'M3' && u.block === 'M' && u.ar && u.en));
});

test('scoring: opportunity answers are excluded from eligible, never counted as difficulty', () => {
  const responses = { L1: { v: 'independent' }, L2: { v: 'not_yet_chance' }, L3: { v: 'not_yet_chance' }, L7: { v: 'not_yet_chance' } };
  const r = scoreCaregiverProfile({ meta: META, responses });
  const L = r.domainStates.L;
  assert.equal(L.state, 'not_yet_opportunity');
  assert.equal(L.notYetCount, 3);
  assert.equal(L.answered, 4);
  assert.equal(L.supportItems.length, 0);
  assert.equal(L.unmet.length, 0);
  assert.ok(r.guidanceNotes.some((g) => g.includes('فرص')));
});

test('scoring: under 50% answered is needs_more_information, never a weakness', () => {
  const r = scoreCaregiverProfile({ meta: META, responses: { C1: { v: 'independent' }, C4: { v: 'rarely' }, C7: { v: 'does_not_yet' } } });
  assert.equal(r.domainStates.C.state, 'needs_more_information');
  assert.equal(r.domainStates.C.confidence, 'NEEDS_MORE_INFO');
  assert.deepEqual(r.domainStates.C.supportItems, ['C4', 'C7'], 'only ANSWERED items can be support items — the 5 unanswered are absent, not does_not_yet');
  assert.equal(r.domainStates.C.unmet.length, 0);
});

test('scoring: access settings derive from the answers, null is never zero', () => {
  const r = scoreCaregiverProfile({
    meta: { childAgeMonths: 60, completed: true },
    responses: {
      H1: { v: 'hands_on' }, H6: { v: ['avoids_bright'] },
      M1: { v: 'little_help', t: 'supervise', f: 'sometimes', tm: 'lt15' },
    M3: { v: 'hands_on', t: 'full_physical', f: 'always', tm: '30_60', met: 'unmet' },
    M4: { v: 'does_not_yet', met: 'unmet' },
      M4: { v: 'hands_on', t: 'partial_physical', f: 'most_times', tm: '15_30' }, M4a: { v: ['big_targets', 'helper_taps'] },
      M5: { v: 'does_not_yet' }, L6: { v: 'big' }, H3: { v: ['night_waking'] },
      C2: { v: 'hands_on', t: 'supervise', f: 'always', tm: '15_30' }, C2b: { v: ['pointing'] }, C8: { v: 'much_more' },
      G1: { v: ['animals', 'water'] }, P6: { v: ['hug'] }, G3: { v: 'pushes' }, G4: { v: 'morning' }, G6: { v: ['يركب العجلة'] },
      X1: { v: ['egy_arabic'] }, X1a: { v: 'same_as_home' }, X2: { v: 'school_part' }, X2a: { v: '2_4' }, X5: { v: 'both' },
    },
  });
  const a = r.accessSettings;
  assert.equal(a.audioFirst, true);
  assert.equal(a.responseMode, 'point_assist');
  assert.equal(a.targetSize, 'large');
  assert.equal(a.timersOff, true);
  assert.equal(a.breakPrompt, true);
  assert.equal(a.reducedMotion, true);
  assert.equal(a.helperPresent, true);
  assert.ok(a.sessionMinutes >= 4 && a.sessionMinutes <= 8);
  assert.equal(r.interests.length, 2);
  assert.deepEqual(r.soothing, [r.soothing[0]]);
  assert.ok(r.doneSignal && r.bestTime && r.goals.length === 1);
  assert.equal(r.context.school.attending, true);
  assert.equal(r.context.school.hoursPerDay, 3);
  assert.equal(r.context.therapies.has, false);
  assert.equal(r.context.therapies.hoursPerWeek, null, 'unanswered therapy hours stay null, not 0');
  assert.equal(r.context.respondent.knownWeeks, null, 'unanswered respondent weeks stay null, not 0');
  assert.equal(r.domainStates.S.eligible, 5, 'S6 is age-gated out at 60 months');
  assert.ok(!Object.keys(r.domainStates.L).some((k) => /score|composite|total/i.test(k)), 'no score-like keys in domain objects');
  assert.ok(!Object.keys(r.supportIntensity.P || {}).some((k) => /score|composite|total/i.test(k)));
  assert.ok(!Object.keys(r).some((k) => /composite|totalscore/i.test(k)));
});

const ladder = { learningPriorities: [{ id: 'strand:letter_name', labelAr: 'حروف', labelEn: 'letters', whyAr: 'جاية', whyEn: 'next' }, { id: 'strand:counting', labelAr: 'عدد', labelEn: 'counting', whyAr: 'جاية', whyEn: 'next' }] };
const caregiverFixture = () => scoreCaregiverProfile({
  meta: META,
  responses: {
    H1: { v: 'independent' }, H2: { v: 'hands_on', met: 'unmet' }, H4: { v: 'independent' },
    M1: { v: 'little_help', t: 'supervise', f: 'sometimes', tm: 'lt15' },
    M3: { v: 'hands_on', t: 'full_physical', f: 'always', tm: '30_60', met: 'unmet' },
    M5: { v: 'hands_on', t: 'partial_physical', f: 'most_times', tm: '15_30', met: 'unmet' },
  },
});

test('merge: ladder only, caregiver only, both, neither', () => {
  const onlyLadder = buildFamilyLearningProfile({ ladderSnapshot: ladder });
  assert.equal(onlyLadder.functional, null);
  assert.equal(onlyLadder.priorities.length, 2);
  assert.ok(onlyLadder.priorities.every((p) => p.track === 'learning'));
  assert.equal(onlyLadder.divergenceNote, null);

  const cg = caregiverFixture();
  const onlyCaregiver = buildFamilyLearningProfile({ caregiver: cg });
  assert.equal(onlyCaregiver.learning, null);
  assert.ok(onlyCaregiver.priorities.length > 0 && onlyCaregiver.priorities.every((p) => p.track === 'functional'));
  assert.equal(onlyCaregiver.functional.domainStates.M.state, 'unmet_need');

  const neither = buildFamilyLearningProfile({});
  assert.equal(neither.functional, null);
  assert.equal(neither.learning, null);
  assert.deepEqual(neither.priorities, []);
  assert.equal(neither.divergenceNote, null);
  assert.equal(neither.bannedTermsVerified, true);

  const both = buildFamilyLearningProfile({ caregiver: cg, ladderSnapshot: ladder, child: { name: 'وديد', ageMonths: 90 } });
  assert.equal(both.priorities.length, 3);
  const counts = both.priorities.reduce((a, p) => ({ ...a, [p.track]: (a[p.track] || 0) + 1 }), {});
  assert.ok((counts.learning || 0) <= 2 && (counts.functional || 0) <= 2, `track balance broken: ${JSON.stringify(counts)}`);
  assert.equal(both.divergenceNote.ar.includes('schooling'), true);
  assert.equal(both.learning, ladder, 'ladder passes through unchanged');
  assert.ok(both.confidenceSummary.ar && both.planSeed.recheckIn);
});

test('merge: deterministic, and planSeed carries the derived settings', () => {
  const cg = caregiverFixture();
  const one = buildFamilyLearningProfile({ caregiver: cg, ladderSnapshot: ladder, child: { name: 'وديد', ageMonths: 90 } });
  const two = buildFamilyLearningProfile({ caregiver: cg, ladderSnapshot: ladder, child: { name: 'وديد', ageMonths: 90 } });
  assert.deepEqual(JSON.parse(JSON.stringify(one)), JSON.parse(JSON.stringify(two)));
  assert.equal(one.planSeed.sessionMinutes, cg.accessSettings.sessionMinutes);
  assert.ok(one.planSeed.activities.length === 3 && one.planSeed.supports.length >= 2);
  assert.ok(one.planSeed.activities.every((a) => a.labelAr && a.labelEn && a.reasonAr && a.reasonEn && a.source));
  assert.ok(!/composite|score/i.test(JSON.stringify(Object.keys(cg))));
});
