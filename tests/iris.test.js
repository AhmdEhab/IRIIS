/**
 * IRIS — Core safety and correctness tests.
 *
 * Run with: node --test tests/
 *
 * TEST-PATH-BLIND is the headline test. It is a BUILD-BREAKING test:
 * if it fails, the architecture's central claim is false.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { classifyBand, decideNext, summariseSession, countConsecutiveLow } from '../src/iris/engines/pathway.js';
import { buildProfile, levelForDPS, computeConfidence } from '../src/iris/engines/profile.js';
import { scoreAssessment, computeDPS, TASK_BY_SUBMEASURE, filterAccommodationsForTask } from '../src/iris/engines/assessment.js';
import { GOALS, GOAL_BY_ID, isMastered, selectGoals } from '../src/iris/engines/goals.js';
import { TEMPLATES, TEMPLATE_BY_ID, templatesForGoalLevel } from '../src/iris/content/templates.js';
import { CONTENT_BANK, servableItems } from '../src/iris/content/contentBank.js';
import { generateActivity } from '../src/iris/content/generator.js';
import { validateActivity } from '../src/iris/content/validator.js';
import { runAssessment, planGoals, completeSession, nextActivity, accommodationDefaults } from '../src/iris/journey.js';
import { syntheticAssessment, syntheticSessionItems, scenarioA, scenarioB, scenarioC } from '../src/iris/demo/scenarios.js';
import { answerParentQuestion } from '../src/iris/parent/chatbot.js';
import { PLAYBOOK, PLAYBOOK_TIER } from '../src/iris/parent/playbook.js';
import { explainProfile, explainDecision } from '../src/iris/parent/explain.js';
import { PARENT_GUIDANCE } from '../src/iris/parent/guidance.js';
import { BANNED_TERMS, PROFILE_DISCLAIMER } from '../src/iris/spec.js';

const ALL_CONDITIONS = ['DOWN_SYNDROME', 'WILLIAMS_SYNDROME', 'FRAGILE_X', 'AUTISM', 'OTHER', null, undefined, '', 'nonsense'];

// ═══════════════════════════════════════════════════════════════════════════
// 1. TEST-PATH-BLIND — the headline safety guarantee
// ═══════════════════════════════════════════════════════════════════════════

test('TEST-PATH-BLIND: identical performance + different diagnosis → identical score, band, level, mastery, pathway, next activity', () => {
  const performance = syntheticAssessment('VISUAL_STRONGER');
  const results = [];

  for (const condition of ALL_CONDITIONS) {
    const acc = accommodationDefaults(condition);
    const { assessment, profile } = runAssessment({
      itemResultsBySubMeasure: performance,
      accommodationsUsed: acc.accommodations,
    });
    const { assignments } = planGoals({ profile });

    let current = { ...assignments[0] };
    let sessions = [];
    const decisions = [];
    for (let i = 0; i < 3; i++) {
      const items = syntheticSessionItems({ accuracy: 0.85, independence: 0.9, n: 6 });
      const r = completeSession({ assignment: current, sessionItems: items, sessions, confidence: profile.confidence });
      sessions = r.history;
      decisions.push({ rule_id: r.decision.rule_id, reason_code: r.decision.reason_code, to_level: r.decision.to_level, to_template_id: r.decision.to_template_id });
      current = r.nextAssignment;
    }
    const { activity } = nextActivity({ assignment: current, variantSeed: 'blind' });

    results.push(JSON.stringify({
      domain_scores: assessment.domain_scores,   // score
      bands: sessions.map((s) => s.band),        // band
      levels: profile.levels,                    // level
      strengths: profile.strengths,
      support_areas: profile.support_areas,
      confidence: profile.confidence,
      assignments,                               // goal
      decisions,                                 // pathway
      next_activity: activity.activity_id,       // next activity
      items: activity.items.map((i) => i.item_id),
    }));
  }

  const first = results[0];
  for (let i = 1; i < results.length; i++) {
    assert.equal(results[i], first, `Diagnosis "${ALL_CONDITIONS[i]}" produced a DIFFERENT outcome. This is a build-breaking defect.`);
  }
});

test('TEST-PROFILE-BLIND: the profile function has no condition parameter and cannot read one', () => {
  const scores = { 'LANG.RECEP_VOCAB': 62, 'LANG.INSTRUCTION': 44, 'LANG.PHON_AWARE': 38, 'MEM.VERBAL_STM': 35, 'MEM.VISUAL_STM': 71, 'ATT.SUSTAINED': 55, 'ATT.SELECTIVE': 48, 'VSP.MATCHING': 74, 'VSP.PATTERN': 66 };
  const base = JSON.stringify(buildProfile({ domain_scores: scores }));
  for (const condition of ALL_CONDITIONS) {
    // Even if a caller tries to smuggle it in, it must be ignored.
    const out = JSON.stringify(buildProfile({ domain_scores: scores, condition, diagnosis: condition }));
    assert.equal(out, base, `condition=${condition} changed the profile`);
  }
});

test('No diagnosis-based scoring: source of every engine is free of diagnosis→pedagogy mapping', async () => {
  const fs = await import('node:fs/promises');
  const files = [
    'src/iris/engines/assessment.js', 'src/iris/engines/profile.js',
    'src/iris/engines/goals.js', 'src/iris/engines/pathway.js',
    'src/iris/content/generator.js', 'src/iris/content/templates.js',
  ];
  const forbidden = [
    /visualPriority/i, /auditoryHook/i, /nonVerbalWeight/i, /verbalWeight/i,
    /assessmentFocus/i, /feedbackStyle/i, /baseLevel/i, /iqScore/i, /holisticScore/i,
    /down[-_ ]?syndrome/i, /williams/i, /fragile/i, /autism/i,
  ];
  for (const f of files) {
    const raw = await fs.readFile(new URL(`../${f}`, import.meta.url), 'utf8');
    // Strip comments and provenance strings. A syndrome name is legitimate in
    // an evidence citation ("H9: verbal STM is the largest DS deficit"); it is
    // NOT legitimate in executable code. This test targets the latter.
    const src = raw
      .replace(/\/\*[\s\S]*?\*\//g, '')          // block comments
      .replace(/^\s*\/\/.*$/gm, '')              // line comments
      .replace(/^\s*evidence_note[^\n]*$/gm, '') // provenance fields
      .replace(/^\s*evidence_note_en[^\n]*$/gm, '')
      .replace(/^\s*_source[^\n]*$/gm, '');
    for (const re of forbidden) {
      assert.ok(!re.test(src), `${f} contains forbidden diagnosis/pedagogy token ${re} in executable code`);
    }
  }
});

test('Diagnosis appears in engine files ONLY as provenance, never in a branch or lookup', async () => {
  const fs = await import('node:fs/promises');
  const files = ['src/iris/engines/goals.js', 'src/iris/engines/pathway.js', 'src/iris/engines/profile.js', 'src/iris/engines/assessment.js'];
  for (const f of files) {
    const raw = await fs.readFile(new URL(`../${f}`, import.meta.url), 'utf8');
    const code = raw
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
      .replace(/^\s*evidence_note[^\n]*$/gm, '')
      .replace(/^\s*_source[^\n]*$/gm, '');
    // No engine may reference a condition/diagnosis identifier in real code.
    for (const re of [/\bcondition\b/, /\bdiagnosis\b/, /SYNDROME_RULES/, /getRulesForCondition/]) {
      assert.ok(!re.test(code), `${f} references ${re} in executable code — engines must be diagnosis-blind`);
    }
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. Band totality and correctness
// ═══════════════════════════════════════════════════════════════════════════

test('Band totality: every valid (accuracy, independence) maps to exactly one band', () => {
  const seen = new Set();
  for (let a = 0; a <= 100; a++) {
    for (let i = 0; i <= 100; i += 5) {
      const { band } = classifyBand({ accuracy: a / 100, independence: i / 100 });
      assert.ok(['LOW', 'MODERATE', 'HIGH'].includes(band), `unexpected band ${band}`);
      seen.add(band);
    }
  }
  assert.deepEqual([...seen].sort(), ['HIGH', 'LOW', 'MODERATE']);
});

test('Band cut-points match the specification exactly', () => {
  assert.equal(classifyBand({ accuracy: 0.49, independence: 1 }).band, 'LOW');
  assert.equal(classifyBand({ accuracy: 0.50, independence: 1 }).band, 'MODERATE');
  assert.equal(classifyBand({ accuracy: 0.79, independence: 1 }).band, 'MODERATE');
  assert.equal(classifyBand({ accuracy: 0.80, independence: 0.69 }).band, 'MODERATE', 'HIGH requires BOTH conditions');
  assert.equal(classifyBand({ accuracy: 0.80, independence: 0.70 }).band, 'HIGH');
  assert.equal(classifyBand({ accuracy: 1.0, independence: 1.0 }).band, 'HIGH');
  assert.equal(classifyBand({ accuracy: 0.0, independence: 0.0 }).band, 'LOW');
});

test('Band classification is independent of independence when accuracy is LOW', () => {
  for (let i = 0; i <= 10; i++) {
    assert.equal(classifyBand({ accuracy: 0.2, independence: i / 10 }).band, 'LOW');
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. Determinism
// ═══════════════════════════════════════════════════════════════════════════

test('Determinism: same input → same decision, 50 repetitions', () => {
  const sessions = [{ goal_id: 'G-LANG-VOCAB', level: 2, band: 'MODERATE', completion_status: 'COMPLETE', accuracy: 0.6, independence: 0.8, engagement_flag: false }];
  const state = {
    goal_id: 'G-LANG-VOCAB', level: 2, template_id: 'TPL-PICK_PICTURE',
    sessions, lastSession: sessions[0], confidence: 'HIGH', consecutive_repeats: 0,
  };
  const first = JSON.stringify(decideNext(state));
  for (let i = 0; i < 50; i++) {
    assert.equal(JSON.stringify(decideNext(state)), first);
  }
});

test('Determinism: activity generation is reproducible from the same constraints', () => {
  const c = { goal_id: 'G-LANG-VOCAB', level: 1, template_id: 'TPL-PICK_PICTURE', item_count: 3, variant_seed: 'x' };
  const a = generateActivity(c);
  const b = generateActivity(c);
  assert.deepEqual(a.items.map((i) => i.item_id), b.items.map((i) => i.item_id));
});

test('Determinism: DPS scoring is reproducible', () => {
  const rows = syntheticAssessment('VERBAL_STRONGER');
  const a = JSON.stringify(scoreAssessment({ itemResultsBySubMeasure: rows }));
  const b = JSON.stringify(scoreAssessment({ itemResultsBySubMeasure: rows }));
  assert.equal(a, b);
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. Mastery follows the specification exactly
// ═══════════════════════════════════════════════════════════════════════════

const S = (band, extra = {}) => ({ goal_id: 'G1', level: 1, band, completion_status: 'COMPLETE', engagement_flag: false, ...extra });

test('Mastery: exactly two consecutive HIGH + COMPLETE', () => {
  assert.equal(isMastered([S('HIGH')], 'G1', 1).mastered, false, 'one HIGH is not mastery');
  assert.equal(isMastered([S('HIGH'), S('HIGH')], 'G1', 1).mastered, true);
  assert.equal(isMastered([S('HIGH'), S('MODERATE')], 'G1', 1).mastered, false);
  assert.equal(isMastered([S('MODERATE'), S('HIGH')], 'G1', 1).mastered, false);
});

test('Mastery: an incomplete session does not count as HIGH', () => {
  assert.equal(isMastered([S('HIGH'), S('HIGH', { completion_status: 'ABANDONED' })], 'G1', 1).mastered, false);
});

test('Mastery: engagement-flagged sessions are excluded and do NOT break the run', () => {
  const sessions = [S('HIGH'), S('LOW', { engagement_flag: true, band: null }), S('HIGH')];
  assert.equal(isMastered(sessions, 'G1', 1).mastered, true, 'flagged session must be skipped, not counted');
});

test('Mastery: only sessions at the SAME goal-level count', () => {
  const sessions = [S('HIGH'), { ...S('HIGH'), level: 2 }];
  assert.equal(isMastered(sessions, 'G1', 1).mastered, false);
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. Adaptation ordering — simplify BEFORE level reduction
// ═══════════════════════════════════════════════════════════════════════════

test('Adaptation ordering: first LOW simplifies, it does NOT reduce level', () => {
  const low = { goal_id: 'G-LANG-VOCAB', level: 3, band: 'LOW', completion_status: 'COMPLETE', accuracy: 0.3, independence: 0.5, engagement_flag: false };
  const d = decideNext({
    goal_id: 'G-LANG-VOCAB', level: 3, template_id: 'TPL-PICK_PICTURE',
    sessions: [low], lastSession: low, confidence: 'HIGH', consecutive_repeats: 0,
  });
  assert.equal(d.reason_code, 'SIMPLIFY_SCAFFOLD');
  assert.equal(d.rule_id, 'R-PATH-005');
  assert.equal(d.to_level, 3, 'level must NOT change on the first LOW');
  assert.ok(d.scaffold_flags.length > 0, 'scaffolds must be handed down');
  assert.ok(d.item_count_factor < 1, 'item count must be reduced');
});

test('Adaptation ordering: second consecutive LOW shifts modality when a partner exists', () => {
  const low = (l) => ({ goal_id: 'G-MEM-VERBAL', level: l, band: 'LOW', completion_status: 'COMPLETE', accuracy: 0.3, independence: 0.5, engagement_flag: false });
  const sessions = [low(2), low(2)];
  const d = decideNext({
    goal_id: 'G-MEM-VERBAL', level: 2, template_id: 'TPL-SEQ_VERBAL',
    sessions, lastSession: sessions[1], confidence: 'HIGH', consecutive_repeats: 1,
  });
  assert.equal(d.reason_code, 'MODALITY_SHIFT');
  assert.equal(d.rule_id, 'R-PATH-006');
  assert.equal(d.to_template_id, 'TPL-SEQ_VISUAL', 'must use the DECLARED partner template');
  assert.equal(d.to_level, 2, 'modality shift must not change level');
});

test('Adaptation ordering: second LOW falls through to backstep when NO modality partner exists', () => {
  const low = { goal_id: 'G-VSP-MATCH', level: 3, band: 'LOW', completion_status: 'COMPLETE', accuracy: 0.3, independence: 0.5, engagement_flag: false };
  const sessions = [low, low];
  const d = decideNext({
    goal_id: 'G-VSP-MATCH', level: 3, template_id: 'TPL-PATTERN_COMPLETE',
    sessions, lastSession: low, confidence: 'HIGH', consecutive_repeats: 1,
  });
  assert.equal(d.reason_code, 'PREREQ_BACKSTEP');
  assert.equal(d.inputs_snapshot.modality_pair_available, false, 'must record why the shift was skipped');
  assert.equal(d.to_level, 2);
});

test('Adaptation ordering: third consecutive LOW backsteps a level', () => {
  const low = { goal_id: 'G-MEM-VERBAL', level: 3, band: 'LOW', completion_status: 'COMPLETE', accuracy: 0.2, independence: 0.5, engagement_flag: false };
  const sessions = [low, low, low];
  const d = decideNext({
    goal_id: 'G-MEM-VERBAL', level: 3, template_id: 'TPL-SEQ_VERBAL',
    sessions, lastSession: low, confidence: 'HIGH', consecutive_repeats: 2,
  });
  assert.equal(d.reason_code, 'PREREQ_BACKSTEP');
  assert.equal(d.to_level, 2);
});

test('Adaptation: mastery advances the level', () => {
  const hi = { goal_id: 'G-LANG-VOCAB', level: 2, band: 'HIGH', completion_status: 'COMPLETE', accuracy: 0.9, independence: 0.9, engagement_flag: false };
  const d = decideNext({
    goal_id: 'G-LANG-VOCAB', level: 2, template_id: 'TPL-PICK_PICTURE',
    sessions: [hi, hi], lastSession: hi, confidence: 'HIGH', consecutive_repeats: 0,
  });
  assert.equal(d.reason_code, 'ADVANCE_MASTERY');
  assert.equal(d.to_level, 3);
});

test('Adaptation: single HIGH consolidates instead of stalling', () => {
  const hi = { goal_id: 'G-LANG-VOCAB', level: 2, band: 'HIGH', completion_status: 'COMPLETE', accuracy: 0.9, independence: 0.9, engagement_flag: false };
  const d = decideNext({
    goal_id: 'G-LANG-VOCAB', level: 2, template_id: 'TPL-PICK_PICTURE',
    sessions: [hi], lastSession: hi, confidence: 'HIGH', consecutive_repeats: 0,
  });
  assert.equal(d.reason_code, 'CONSOLIDATE_HIGH');
  assert.equal(d.to_level, 2);
});

test('Adaptation: engagement flag never lowers the level', () => {
  const flagged = { goal_id: 'G-LANG-VOCAB', level: 3, band: null, completion_status: 'ABANDONED', engagement_flag: true, accuracy: 0.1, independence: 0.2 };
  const d = decideNext({
    goal_id: 'G-LANG-VOCAB', level: 3, template_id: 'TPL-PICK_PICTURE',
    sessions: [flagged], lastSession: flagged, confidence: 'HIGH', consecutive_repeats: 0,
  });
  assert.equal(d.reason_code, 'FLAG_ENGAGEMENT');
  assert.equal(d.to_level, 3, 'a flagged session must never cost the child a level');
});

test('Adaptation: every decision carries a rule id and a parent explanation', () => {
  const cases = [
    { band: 'HIGH', n: 1 }, { band: 'HIGH', n: 2 }, { band: 'MODERATE', n: 1 }, { band: 'LOW', n: 1 }, { band: 'LOW', n: 3 },
  ];
  for (const c of cases) {
    const s = { goal_id: 'G-LANG-VOCAB', level: 2, band: c.band, completion_status: 'COMPLETE', accuracy: 0.9, independence: 0.9, engagement_flag: false };
    const d = decideNext({
      goal_id: 'G-LANG-VOCAB', level: 2, template_id: 'TPL-PICK_PICTURE',
      sessions: Array(c.n).fill(s), lastSession: s, confidence: 'HIGH', consecutive_repeats: 0,
    });
    assert.ok(d.rule_id, 'missing rule_id');
    assert.ok(d.explanation_parent?.ar && d.explanation_parent?.en, `missing parent explanation for ${d.reason_code}`);
    assert.ok(d.inputs_snapshot, 'missing inputs snapshot');
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. Assessment / DPS
// ═══════════════════════════════════════════════════════════════════════════

test('DPS: floor at step 1 yields null, never zero', () => {
  const task = TASK_BY_SUBMEASURE['LANG.RECEP_VOCAB'];
  const rows = [
    { difficulty_step: 1, is_correct: false, response_time_ms: 3000, hints_used: 0, timed_out: false, response_type: 'ITEM' },
    { difficulty_step: 1, is_correct: false, response_time_ms: 3000, hints_used: 0, timed_out: false, response_type: 'ITEM' },
    { difficulty_step: 1, is_correct: false, response_time_ms: 3000, hints_used: 0, timed_out: false, response_type: 'ITEM' },
  ];
  const r = computeDPS(task, rows);
  assert.equal(r.dps, null, 'a floored sub-measure must be null, not 0');
  assert.equal(r.notDetermined, true);
  assert.ok(r.flags.includes('FLOOR_AT_STEP_1'));
});

test('DPS: insufficient items yields null', () => {
  const task = TASK_BY_SUBMEASURE['VSP.MATCHING'];
  const r = computeDPS(task, [{ difficulty_step: 1, is_correct: true, hints_used: 0, response_type: 'ITEM' }]);
  assert.equal(r.dps, null);
  assert.ok(r.flags.includes('INSUFFICIENT_ITEMS'));
});

test('DPS: hints reduce independence but a hinted-correct item still scores correct', () => {
  const task = TASK_BY_SUBMEASURE['VSP.MATCHING'];
  const mk = (hints) => Array.from({ length: 4 }, () => ({ difficulty_step: 1, is_correct: true, hints_used: hints, response_time_ms: 3000, timed_out: false, response_type: 'ITEM' }));
  const noHints = computeDPS(task, mk(0));
  const allHints = computeDPS(task, mk(1));
  assert.equal(noHints.accuracy, 1);
  assert.equal(allHints.accuracy, 1, 'hinted-then-correct must still be correct');
  assert.ok(allHints.independence < noHints.independence);
  assert.ok(allHints.dps < noHints.dps);
});

test('DPS: never produces an IQ-like construct — output keys contain no iq/percentile', () => {
  const r = scoreAssessment({ itemResultsBySubMeasure: syntheticAssessment('VISUAL_STRONGER') });
  const json = JSON.stringify(r).toLowerCase();
  for (const term of ['iqscore', 'iq_score', '"iq"', 'percentile', 'age_equivalent', 'standard_score']) {
    assert.ok(!json.includes(term), `assessment output contains ${term}`);
  }
});

test('R-ASSESS-006: SIMPLIFIED_INSTRUCTION is blocked on T-L2 but allowed elsewhere', () => {
  const blocked = filterAccommodationsForTask('T-L2', ['EXTENDED_TIME', 'SIMPLIFIED_INSTRUCTION']);
  assert.deepEqual(blocked.allowed, ['EXTENDED_TIME']);
  assert.deepEqual(blocked.blocked, ['SIMPLIFIED_INSTRUCTION']);

  const ok = filterAccommodationsForTask('T-L1', ['EXTENDED_TIME', 'SIMPLIFIED_INSTRUCTION']);
  assert.deepEqual(ok.blocked, []);
});

test('Profile: level bands match the specification', () => {
  assert.equal(levelForDPS(0), 1);
  assert.equal(levelForDPS(34), 1);
  assert.equal(levelForDPS(35), 2);
  assert.equal(levelForDPS(54), 2);
  assert.equal(levelForDPS(55), 3);
  assert.equal(levelForDPS(74), 3);
  assert.equal(levelForDPS(75), 4);
  assert.equal(levelForDPS(100), 4);
  assert.equal(levelForDPS(null), null);
});

test('Profile: not-determined sub-measures are excluded from the mean and never become weaknesses', () => {
  const scores = { 'LANG.RECEP_VOCAB': 60, 'LANG.INSTRUCTION': 60, 'LANG.PHON_AWARE': null, 'MEM.VERBAL_STM': 60, 'MEM.VISUAL_STM': 60, 'ATT.SUSTAINED': 60, 'ATT.SELECTIVE': 60, 'VSP.MATCHING': 60, 'VSP.PATTERN': 60 };
  const p = buildProfile({ domain_scores: scores });
  assert.equal(p.child_mean, 60, 'null must not drag the mean toward zero');
  assert.ok(!p.support_areas.includes('LANG.PHON_AWARE'));
  assert.ok(p.not_determined.includes('LANG.PHON_AWARE'));
});

test('Profile: a flat profile does not manufacture a strength', () => {
  const scores = Object.fromEntries(['LANG.RECEP_VOCAB', 'LANG.INSTRUCTION', 'LANG.PHON_AWARE', 'MEM.VERBAL_STM', 'MEM.VISUAL_STM', 'ATT.SUSTAINED', 'ATT.SELECTIVE', 'VSP.MATCHING', 'VSP.PATTERN'].map((s, i) => [s, 50 + (i % 2)]));
  const p = buildProfile({ domain_scores: scores });
  assert.equal(p.profile_shape, 'FLAT');
  assert.deepEqual(p.strengths, []);
  assert.deepEqual(p.support_areas, []);
});

test('Profile: LOW confidence reduces the placement level by one', () => {
  const scores = Object.fromEntries(['LANG.RECEP_VOCAB', 'LANG.INSTRUCTION', 'LANG.PHON_AWARE', 'MEM.VERBAL_STM', 'MEM.VISUAL_STM', 'ATT.SUSTAINED', 'ATT.SELECTIVE', 'VSP.MATCHING', 'VSP.PATTERN'].map((s) => [s, 60]));
  const high = buildProfile({ domain_scores: scores });
  const low = buildProfile({ domain_scores: scores, data_quality_flags: ['RAPID_RESPONDING'] });
  assert.equal(high.confidence, 'HIGH');
  assert.equal(low.confidence, 'LOW');
  assert.equal(low.levels['VSP.MATCHING'], high.levels['VSP.MATCHING'] - 1);
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. Content / template compatibility
// ═══════════════════════════════════════════════════════════════════════════

test('Content: only the six MVP goals exist — no goal invention', () => {
  assert.equal(GOALS.length, 6);
  assert.deepEqual(GOALS.map((g) => g.id).sort(), [
    'G-ATT-SUSTAIN', 'G-LANG-PHON', 'G-LANG-VOCAB', 'G-MEM-VERBAL', 'G-MEM-VISUAL', 'G-VSP-MATCH',
  ]);
});

test('Content: every goal-level has at least one template that declares it', () => {
  for (const goal of GOALS) {
    for (const lvl of [1, 2, 3, 4]) {
      const tpls = templatesForGoalLevel(goal.id, lvl);
      assert.ok(tpls.length > 0, `${goal.id} L${lvl} has no template`);
    }
  }
});

test('Content: every goal-level has at least one servable APPROVED item', () => {
  for (const goal of GOALS) {
    for (const lvl of [1, 2, 3, 4]) {
      const tpls = templatesForGoalLevel(goal.id, lvl);
      const total = tpls.reduce((n, t) => n + servableItems({ goal_id: goal.id, level: lvl, template_id: t.id }).length, 0);
      assert.ok(total > 0, `${goal.id} L${lvl} has no approved items`);
    }
  }
});

test('Content: every item references a template that declares its goal and level', () => {
  for (const it of CONTENT_BANK) {
    const tpl = TEMPLATE_BY_ID[it.template_id];
    assert.ok(tpl, `${it.item_id} references unknown template ${it.template_id}`);
    const levels = tpl.goals[it.goal_id] || [];
    assert.ok(levels.includes(it.level), `${it.item_id}: ${it.template_id} does not declare ${it.goal_id} L${it.level}`);
  }
});

test('Content: modality pairs are symmetric', () => {
  for (const t of TEMPLATES) {
    if (!t.modality_pair_id) continue;
    const partner = TEMPLATE_BY_ID[t.modality_pair_id];
    assert.ok(partner, `${t.id} declares missing partner ${t.modality_pair_id}`);
    assert.equal(partner.modality_pair_id, t.id, `${t.id} ↔ ${partner.id} is not symmetric`);
  }
});

test('Content: no PENDING item can be served', () => {
  const pending = { ...CONTENT_BANK[0], item_id: 'INJECT-PENDING', review_status: 'PENDING' };
  const instance = {
    activity_id: 'x', goal_id: pending.goal_id, level: pending.level, template_id: pending.template_id,
    items: [pending], constraint_snapshot: { goal_id: pending.goal_id, level: pending.level, template_id: pending.template_id },
  };
  const r = validateActivity(instance, { goal_id: pending.goal_id, level: pending.level, template_id: pending.template_id });
  assert.equal(r.passed, false);
  assert.ok(r.failures.some((f) => f.check === 'approval_gate'));
});

test('Content validator: rejects a constraint-snapshot mismatch', () => {
  const inst = generateActivity({ goal_id: 'G-LANG-VOCAB', level: 1, template_id: 'TPL-PICK_PICTURE', item_count: 3 });
  inst.constraint_snapshot.level = 4; // tamper
  const r = validateActivity(inst, { goal_id: 'G-LANG-VOCAB', level: 1, template_id: 'TPL-PICK_PICTURE' });
  assert.equal(r.passed, false);
  assert.ok(r.failures.some((f) => f.check === 'constraint_fidelity'));
});

test('Content validator: rejects a template that does not serve the goal-level', () => {
  const inst = {
    activity_id: 'x', goal_id: 'G-MEM-VERBAL', level: 1, template_id: 'TPL-PICK_PICTURE',
    items: [], constraint_snapshot: { goal_id: 'G-MEM-VERBAL', level: 1, template_id: 'TPL-PICK_PICTURE' },
  };
  const r = validateActivity(inst, { goal_id: 'G-MEM-VERBAL', level: 1, template_id: 'TPL-PICK_PICTURE' });
  assert.equal(r.passed, false);
  assert.ok(r.failures.some((f) => f.check === 'template_eligibility'));
});

test('Content validator: rejects banned terms and diagnosis names in activity content', () => {
  const inst = generateActivity({ goal_id: 'G-LANG-VOCAB', level: 1, template_id: 'TPL-PICK_PICTURE', item_count: 2 });
  inst.items = [{ ...inst.items[0], prompt: { ar: 'طفل لديه متلازمة داون', en: 'a child with a deficit' } }];
  const r = validateActivity(inst, { goal_id: 'G-LANG-VOCAB', level: 1, template_id: 'TPL-PICK_PICTURE' });
  assert.equal(r.passed, false);
  assert.ok(r.failures.some((f) => f.check === 'banned_terms' || f.check === 'safety'));
});

test('Content: every generated activity for every goal-level passes the validator', () => {
  for (const goal of GOALS) {
    for (const lvl of [1, 2, 3, 4]) {
      for (const tpl of templatesForGoalLevel(goal.id, lvl)) {
        const a = generateActivity({ goal_id: goal.id, level: lvl, template_id: tpl.id, item_count: 4 });
        assert.equal(a.validator_passed, true, `${goal.id} L${lvl} ${tpl.id}: ${JSON.stringify(a.validator_failures)}`);
      }
    }
  }
});

test('Content: every item carries honest provenance metadata', () => {
  for (const it of CONTENT_BANK) {
    assert.equal(it.validation_status, 'RESEARCH_INFORMED_PROTOTYPE', `${it.item_id} must not claim validation`);
    assert.equal(it.specialist_review_status, 'NOT_REVIEWED');
    assert.equal(it.reviewed_by, null, `${it.item_id} must not name a specialist`);
    assert.equal(it.reviewed_at, null);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. Parent mode safety
// ═══════════════════════════════════════════════════════════════════════════

test('Parent chatbot: medical questions always route to a professional', () => {
  for (const q of ['هل أعطيه دواء للتركيز؟', 'should I give him medication?', 'طفلي يشخر أثناء النوم ماذا أفعل']) {
    const r = answerParentQuestion(q, {}, q.match(/[؀-ۿ]/) ? 'ar' : 'en');
    assert.equal(r.type, 'SAFETY_FALLBACK');
    assert.equal(r.requires_professional, true);
  }
});

test('Parent chatbot: diagnosis and IQ questions are refused, never guessed', () => {
  for (const q of ['ما هي درجة ذكاء طفلي؟', 'what is my child IQ', 'هل عند طفلي توحد؟']) {
    const r = answerParentQuestion(q, {}, q.match(/[؀-ۿ]/) ? 'ar' : 'en');
    assert.equal(r.type, 'SAFETY_FALLBACK');
    assert.equal(r.route, 'DIAGNOSIS');
  }
});

test('Parent chatbot: unknown questions fall back honestly instead of inventing an answer', () => {
  const r = answerParentQuestion('ما رأيك في الطقس اليوم في القاهرة؟', {}, 'ar');
  assert.ok(['FALLBACK_NO_ANSWER', 'SAFETY_FALLBACK'].includes(r.type));
  assert.deepEqual(r.sources, []);
});

test('Parent chatbot: every KB answer carries an evidence tier and a source', () => {
  const r = answerParentQuestion('كيف أشجع الاستقلالية؟', {}, 'ar');
  assert.equal(r.type, 'KB_ANSWER');
  assert.ok(r.evidence_tier);
  assert.ok(r.source);
  assert.equal(r.specialist_review_status, 'NOT_REVIEWED');
});

test('Parent chatbot: session-length question returns the research gap, not a number', () => {
  const r = answerParentQuestion('كم يجب أن تكون مدة الجلسة؟', {}, 'ar');
  assert.equal(r.type, 'KB_ANSWER');
  assert.equal(r.evidence_tier, 'RESEARCH_GAP');
  assert.ok(!/\d+\s*(دقيقة|دقائق)/.test(r.answer), 'must not invent a duration');
});

test('Parent guidance: no entry claims specialist approval or names a reviewer', () => {
  for (const g of PARENT_GUIDANCE) {
    assert.equal(g.validation_status, 'RESEARCH_INFORMED_PROTOTYPE');
    assert.equal(g.specialist_review_status, 'NOT_REVIEWED');
    assert.equal(g.reviewed_by, null);
    assert.ok(g.source, `${g.id} missing a source`);
    assert.ok(g.evidence_tier, `${g.id} missing an evidence tier`);
  }
});

test('Parent output: profile summary contains no banned term and no DPS number', () => {
  const { profile } = runAssessment({ itemResultsBySubMeasure: syntheticAssessment('VISUAL_STRONGER') });
  for (const lang of ['ar', 'en']) {
    const lines = explainProfile(profile, lang);
    // The mandated disclaimer (doc 12 §6) must say "It is not an IQ test".
    // That required negation is excluded; every other line is scanned.
    const generated = lines.filter((l) => l !== PROFILE_DISCLAIMER[lang]);
    assert.equal(lines.length - generated.length, 1, 'the required disclaimer must be present exactly once');
    const joined = generated.join(' ').toLowerCase();
    for (const term of BANNED_TERMS) {
      assert.ok(!new RegExp(`(^|[^a-z])${term}([^a-z]|$)`, 'i').test(joined), `parent summary contains "${term}"`);
    }
    for (const dps of Object.values(profile.domain_scores)) {
      if (dps != null && dps > 20) {
        assert.ok(!joined.includes(String(dps)), `parent summary leaked DPS value ${dps}`);
      }
    }
  }
});

test('Parent output: decision explanations never mention a diagnosis', () => {
  const s = { goal_id: 'G-LANG-VOCAB', level: 2, band: 'HIGH', completion_status: 'COMPLETE', accuracy: 0.9, independence: 0.9, engagement_flag: false };
  const d = decideNext({ goal_id: 'G-LANG-VOCAB', level: 2, template_id: 'TPL-PICK_PICTURE', sessions: [s, s], lastSession: s, confidence: 'HIGH', consecutive_repeats: 0 });
  for (const lang of ['ar', 'en']) {
    const text = explainDecision(d, lang);
    for (const term of ['متلازمة', 'down', 'williams', 'syndrome', 'تشخيص']) {
      assert.ok(!text.toLowerCase().includes(term), `explanation mentions "${term}"`);
    }
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. End-to-end demo scenarios
// ═══════════════════════════════════════════════════════════════════════════

test('SCENARIO A: assessment → HIGH → HIGH → mastery → next level', () => {
  const r = scenarioA();
  const reasons = r.decisions.map((d) => d.reason_code);
  assert.ok(reasons.includes('ADVANCE_MASTERY'), `expected mastery advance, got ${reasons.join(', ')}`);
  const advance = r.decisions.find((d) => d.reason_code === 'ADVANCE_MASTERY');
  assert.equal(advance.to_level, advance.from_level + 1);
});

test('SCENARIO B: struggling child simplifies before any level reduction', () => {
  const r = scenarioB();
  const reasons = r.decisions.map((d) => d.reason_code);
  const firstSimplify = reasons.indexOf('SIMPLIFY_SCAFFOLD');
  const firstBackstep = reasons.indexOf('PREREQ_BACKSTEP');
  assert.ok(firstSimplify >= 0, 'expected a simplify step');
  if (firstBackstep >= 0) {
    assert.ok(firstSimplify < firstBackstep, 'simplify must come before level reduction');
  }
});

test('SCENARIO C: identical performance across five diagnoses → identical outcomes', () => {
  const r = scenarioC();
  assert.equal(r.identical_outcomes, true, r.claim);
  assert.equal(r.conditions_tested.length, 5);
});

test('End-to-end: full journey produces a traceable decision for every session', () => {
  const { profile } = runAssessment({ itemResultsBySubMeasure: syntheticAssessment('VERBAL_STRONGER') });
  const { assignments } = planGoals({ profile });
  assert.ok(assignments.length >= 1);

  let current = { ...assignments[0] };
  let sessions = [];
  for (let i = 0; i < 5; i++) {
    const { activity } = nextActivity({ assignment: current, variantSeed: `e2e${i}` });
    assert.equal(activity.validator_passed, true);
    const r = completeSession({
      assignment: current,
      sessionItems: syntheticSessionItems({ accuracy: 0.6, independence: 0.8, n: 6 }),
      sessions, confidence: profile.confidence,
    });
    assert.ok(r.decision.rule_id);
    assert.ok(r.decision.rule_pack_version);
    sessions = r.history;
    current = r.nextAssignment;
  }
  assert.equal(sessions.length, 5);
  assert.ok(sessions.every((s) => s.decision));
});

test('Synthetic data is always labelled', () => {
  const r = scenarioA();
  assert.ok(r.sessions.every((s) => s.is_synthetic === true), 'every demo session must carry is_synthetic');
});

// ── Parent support plan (Phase 4) ───────────────────────────────────────────

/** Context standing in for a real child with real session history. */
const PLAN_CTX = {
  assignments: [{
    goal_id: 'G-MEM-VISUAL', level: 2,
    goal: { title_ar: 'تذكّر ما يراه', title_en: 'remembering what they see', primary_sub_measure: 'MEM.VISUAL_STM' },
  }],
  sessions: [{ accuracy: 0.5, engagement_flag: false }, { accuracy: 0.42, engagement_flag: true }],
  profile: { support_areas: ['MEM.VISUAL_STM'], strengths: ['VSP.MATCHING'] },
};

test('Support plan: a "what do I do" question with real data returns all seven parts', () => {
  const r = answerParentQuestion('أساعده إزاي في البيت؟', PLAN_CTX, 'ar');
  assert.equal(r.type, 'SUPPORT_PLAN');
  assert.ok(r.observed.length > 0, 'what was observed');
  assert.ok(r.meaning, 'what it may mean');
  assert.ok(r.today, 'what to do today');
  assert.ok(r.activity?.steps?.length >= 2, 'a real activity with steps');
  assert.ok(r.duration, 'a suggested duration');
  assert.ok(r.watch, 'what to observe');
  assert.ok(r.adjust?.easier && r.adjust?.harder, 'when to adjust, both directions');
});

test('Support plan: NO plan without observations — it never invents a personalised answer', () => {
  const r = answerParentQuestion('أساعده إزاي في البيت؟', {}, 'ar');
  assert.notEqual(r.type, 'SUPPORT_PLAN');
});

test('Support plan: observed content is traceable to the session record, not invented', () => {
  const r = answerParentQuestion('أساعده إزاي في البيت؟', PLAN_CTX, 'ar');
  const joined = r.observed.join(' ');
  // Every number in the observed block must come from PLAN_CTX.
  assert.ok(/50/.test(joined) && /42/.test(joined), 'accuracies are the real ones');
  assert.ok(/2/.test(joined), 'the real level appears');
  const numbers = joined.match(/\d+/g) || [];
  const allowed = new Set(['50', '42', '2', '1', '4']);
  for (const n of numbers) {
    assert.ok(allowed.has(n), `observed block contains an unexplained number: ${n}`);
  }
});

test('Support plan: never states a diagnosis or a deficit about the child', () => {
  const r = answerParentQuestion('أساعده إزاي في البيت؟', PLAN_CTX, 'ar');
  const all = JSON.stringify(r);
  for (const bad of ['تشخيص', 'إعاقة', 'قصور', 'متخلف', 'ضعف عقلي', 'ذكاء',
                     'diagnos', 'deficit', 'disorder', 'retard', 'IQ']) {
    assert.ok(!all.includes(bad), `support plan contains "${bad}"`);
  }
});

test('Support plan: inference is hedged, never asserted as fact about the child', () => {
  for (const p of PLAYBOOK) {
    // The educational reading must never be phrased as "your child is/has".
    assert.ok(!/طفلك (عنده|بيعاني|مش قادر)/.test(p.means_ar), `${p.id} asserts about the child (ar)`);
    assert.ok(!/your child (has|is unable|cannot)/i.test(p.means_en), `${p.id} asserts about the child (en)`);
  }
});

test('Support plan: durations are labelled as suggestions, and never answer the session-length gap', () => {
  // Every playbook duration must be hedged, not prescriptive.
  for (const p of PLAYBOOK) {
    assert.ok(/حوالي|أو أقل|بالراحة|مش نشاط منفصل|دقيقة تحضير|متفرّقة/.test(p.duration_ar), `${p.id} ar duration is not hedged`);
    assert.ok(/About|or less|slowly|Not a separate|One minute|rather than/i.test(p.duration_en), `${p.id} en duration is not hedged`);
  }
  // And the research-gap answer must still win for the question it owns,
  // even when the child has full session data available.
  const r = answerParentQuestion('كم يجب أن تكون مدة الجلسة؟', PLAN_CTX, 'ar');
  assert.equal(r.type, 'KB_ANSWER');
  assert.equal(r.evidence_tier, 'RESEARCH_GAP');
  assert.ok(!/\d+\s*(دقيقة|دقائق)/.test(r.answer), 'must not invent a duration');
});

test('Playbook: every activity is labelled an engineering suggestion with an honest source', () => {
  assert.ok(PLAYBOOK.length >= 9, 'one activity per sub-measure');
  for (const p of PLAYBOOK) {
    assert.equal(p.evidence_tier, PLAYBOOK_TIER);
    assert.ok(/29_RESEARCH_GAPS_REGISTER/.test(p.source), `${p.id} does not disclose the gap`);
    assert.ok(p.steps_ar.length >= 3 && p.steps_en.length >= 3, `${p.id} is not concrete enough`);
    assert.ok(p.easier_ar && p.harder_ar, `${p.id} missing an adjustment route`);
  }
});

test('Safety: the fixed regexes no longer over-trigger, and still catch the real thing', () => {
  // "unique" used to match the unanchored `iq` and be refused as a diagnosis question.
  assert.notEqual(answerParentQuestion('What is a unique activity for him?', {}, 'en').route, 'DIAGNOSIS');
  // A plain bedtime question used to be refused as medical on the Arabic side only.
  assert.notEqual(answerParentQuestion('امتى ينام؟', {}, 'ar').route, 'MEDICAL');
  // The real ones must still route.
  assert.equal(answerParentQuestion('What is his IQ?', {}, 'en').route, 'DIAGNOSIS');
  assert.equal(answerParentQuestion('هل عنده انقطاع النفس أثناء النوم؟', {}, 'ar').route, 'MEDICAL');
  assert.equal(answerParentQuestion('Does my child have autism?', {}, 'en').route, 'DIAGNOSIS');
});

test('Safety: a medical question wins even when a support plan could be built', () => {
  const r = answerParentQuestion('أساعده إزاي مع الدواء ده؟', PLAN_CTX, 'ar');
  assert.equal(r.type, 'SAFETY_FALLBACK');
  assert.equal(r.requires_professional, true);
});
