/**
 * IRIS — Deterministic demo scenarios.
 *
 * ALL DATA HERE IS SYNTHETIC. No real child's information is used anywhere.
 * Every generated session carries is_synthetic = true (doc 16 R-PROG-007).
 *
 * These scenarios run with no network, no database, and no external service,
 * so the committee demo cannot fail because something is offline.
 */
import { runAssessment, planGoals, nextActivity, completeSession, buildProgress, accommodationDefaults } from '../journey.js';
import { TASKS } from '../engines/assessment.js';

/** Build synthetic item rows for one stepped task at a target accuracy. */
function steppedRows({ perStep = 4, steps = 3, correctPattern }) {
  const rows = [];
  for (let step = 1; step <= steps; step++) {
    for (let i = 0; i < perStep; i++) {
      const is_correct = correctPattern(step, i);
      rows.push({
        difficulty_step: step,
        is_correct,
        response_time_ms: 2500,
        hints_used: 0,
        timed_out: false,
        response_type: 'ITEM',
        tapped: true,
      });
    }
    // stop presenting further steps once two consecutive in this step failed
    const stepRows = rows.filter((r) => r.difficulty_step === step);
    let consec = 0, broke = false;
    for (const r of stepRows) { consec = r.is_correct ? 0 : consec + 1; if (consec >= 2) { broke = true; break; } }
    if (broke) break;
  }
  return rows;
}

function continuousRows({ hits = 14, misses = 4, falseAlarms = 2, seconds = 60 }) {
  const rows = [];
  for (let i = 0; i < hits; i++) rows.push({ difficulty_step: null, is_correct: true, response_type: 'ITEM', response_time_ms: 900, hints_used: 0, timed_out: false, tapped: true, seconds_on_task: seconds });
  for (let i = 0; i < misses; i++) rows.push({ difficulty_step: null, is_correct: false, response_type: 'ITEM', response_time_ms: 4000, hints_used: 0, timed_out: true, tapped: false, seconds_on_task: seconds });
  for (let i = 0; i < falseAlarms; i++) rows.push({ difficulty_step: null, is_correct: false, response_type: 'FALSE_ALARM', response_time_ms: 700, hints_used: 0, timed_out: false, tapped: true, seconds_on_task: seconds });
  return rows;
}

/**
 * A synthetic assessment producing a differentiated profile.
 * `shape` picks which sub-measures come out stronger — this is the CHILD'S
 * PERFORMANCE, authored directly. No diagnosis is involved in producing it.
 */
export function syntheticAssessment(shape = 'VISUAL_STRONGER') {
  const strong = (step, i) => step <= 3;
  const mid = (step, i) => step <= 2 || (step === 3 && i < 1);
  const weak = (step, i) => step === 1 && i < 1;

  const profiles = {
    VISUAL_STRONGER: {
      'LANG.RECEP_VOCAB': mid, 'LANG.INSTRUCTION': mid, 'LANG.PHON_AWARE': weak,
      'MEM.VERBAL_STM': weak, 'MEM.VISUAL_STM': strong,
      'VSP.MATCHING': strong, 'VSP.PATTERN': mid,
    },
    VERBAL_STRONGER: {
      'LANG.RECEP_VOCAB': mid, 'LANG.INSTRUCTION': mid, 'LANG.PHON_AWARE': mid,
      'MEM.VERBAL_STM': strong, 'MEM.VISUAL_STM': weak,
      'VSP.MATCHING': mid, 'VSP.PATTERN': mid,
    },
    STRUGGLING: {
      'LANG.RECEP_VOCAB': weak, 'LANG.INSTRUCTION': weak, 'LANG.PHON_AWARE': weak,
      'MEM.VERBAL_STM': weak, 'MEM.VISUAL_STM': mid,
      'VSP.MATCHING': mid, 'VSP.PATTERN': weak,
    },
  };

  const map = profiles[shape] || profiles.VISUAL_STRONGER;
  const itemResultsBySubMeasure = {};

  for (const task of TASKS) {
    if (task.kind === 'CONTINUOUS') {
      const good = shape !== 'STRUGGLING';
      itemResultsBySubMeasure[task.subMeasure] = continuousRows(
        good ? { hits: 14, misses: 4, falseAlarms: 2 } : { hits: 6, misses: 10, falseAlarms: 4 }
      );
    } else {
      itemResultsBySubMeasure[task.subMeasure] = steppedRows({
        perStep: task.itemsPerStep,
        correctPattern: map[task.subMeasure] || mid,
      });
    }
  }
  return itemResultsBySubMeasure;
}

/** Synthetic session items at a target band. */
export function syntheticSessionItems({ accuracy, independence = 1, n = 6 }) {
  const correctCount = Math.round(accuracy * n);
  const hintCount = Math.round((1 - independence) * n);
  const items = [];
  for (let i = 0; i < n; i++) {
    items.push({
      is_correct: i < correctCount,
      hints_used: i < hintCount ? 1 : 0,
      response_time_ms: 3000,
      timed_out: false,
      tapped: true,
    });
  }
  return items;
}

/** SCENARIO A — successful progression: HIGH → HIGH → mastery → next level. */
export function scenarioA() {
  const steps = [];
  const { assessment, profile } = runAssessment({
    itemResultsBySubMeasure: syntheticAssessment('VISUAL_STRONGER'),
    accommodationsUsed: accommodationDefaults('DOWN_SYNDROME').accommodations,
  });
  steps.push({ step: 'ASSESSMENT', domain_scores: assessment.domain_scores, confidence: profile.confidence });

  const { assignments } = planGoals({ profile });
  steps.push({ step: 'GOALS', assignments });

  let current = { ...assignments[0], is_synthetic: true };
  let sessions = [];
  const decisions = [];

  for (let i = 0; i < 2; i++) {
    const { activity } = nextActivity({ assignment: current, variantSeed: `A${i}` });
    const items = syntheticSessionItems({ accuracy: 1.0, independence: 1.0, n: 6 });
    const r = completeSession({ assignment: current, sessionItems: items, sessions, confidence: profile.confidence });
    sessions = r.history;
    decisions.push(r.decision);
    steps.push({
      step: `SESSION_${i + 1}`, activity_id: activity.activity_id, validator_passed: activity.validator_passed,
      band: r.session.band, accuracy: r.session.accuracy, independence: r.session.independence,
      rule: r.decision.rule_id, reason: r.decision.reason_code,
      from_level: r.decision.from_level, to_level: r.decision.to_level,
    });
    current = { ...r.nextAssignment, is_synthetic: true };
  }

  const progress = buildProgress({ sessions, goalIds: [assignments[0].goal_id] });
  return { name: 'SCENARIO_A_SUCCESSFUL_PROGRESSION', steps, sessions, decisions, progress, final: current };
}

/** SCENARIO B — struggling child: LOW → simplify → LOW → modality/backstep. */
export function scenarioB() {
  const steps = [];
  const { assessment, profile } = runAssessment({
    itemResultsBySubMeasure: syntheticAssessment('STRUGGLING'),
    accommodationsUsed: accommodationDefaults('WILLIAMS_SYNDROME').accommodations,
  });
  steps.push({ step: 'ASSESSMENT', domain_scores: assessment.domain_scores, confidence: profile.confidence, flags: assessment.data_quality_flags });

  const { assignments } = planGoals({ profile });
  steps.push({ step: 'GOALS', assignments });

  let current = { ...assignments[0], is_synthetic: true };
  let sessions = [];
  const decisions = [];

  for (let i = 0; i < 4; i++) {
    const { activity } = nextActivity({
      assignment: current,
      decision: decisions[decisions.length - 1] ?? null,
      variantSeed: `B${i}`,
    });
    const items = syntheticSessionItems({ accuracy: 0.33, independence: 0.5, n: 6 });
    const r = completeSession({ assignment: current, sessionItems: items, sessions, confidence: profile.confidence });
    sessions = r.history;
    decisions.push(r.decision);
    steps.push({
      step: `SESSION_${i + 1}`, activity_id: activity.activity_id, validator_passed: activity.validator_passed,
      band: r.session.band, accuracy: r.session.accuracy,
      rule: r.decision.rule_id, reason: r.decision.reason_code,
      from_level: r.decision.from_level, to_level: r.decision.to_level,
      from_template: r.decision.from_template_id, to_template: r.decision.to_template_id,
      scaffolds: r.decision.scaffold_flags,
    });
    current = { ...r.nextAssignment, is_synthetic: true };
  }

  const progress = buildProgress({ sessions, goalIds: [assignments[0].goal_id] });
  return { name: 'SCENARIO_B_STRUGGLING', steps, sessions, decisions, progress, final: current };
}

/**
 * SCENARIO C — DIAGNOSIS BLINDNESS.
 * Identical performance, every different diagnosis → identical everything.
 * This is the architectural claim, demonstrated live.
 */
export function scenarioC() {
  const conditions = ['DOWN_SYNDROME', 'WILLIAMS_SYNDROME', 'OTHER', 'FRAGILE_X', 'AUTISM'];
  const identicalPerformance = syntheticAssessment('VISUAL_STRONGER');
  const runs = [];

  for (const condition of conditions) {
    // The ONLY thing the diagnosis touches: access accommodations.
    const acc = accommodationDefaults(condition);

    const { assessment, profile } = runAssessment({
      itemResultsBySubMeasure: identicalPerformance,
      accommodationsUsed: acc.accommodations,
    });
    const { assignments } = planGoals({ profile });

    let current = { ...assignments[0], is_synthetic: true };
    let sessions = [];
    const decisions = [];
    for (let i = 0; i < 3; i++) {
      const items = syntheticSessionItems({ accuracy: 0.85, independence: 0.9, n: 6 });
      const r = completeSession({ assignment: current, sessionItems: items, sessions, confidence: profile.confidence });
      sessions = r.history;
      decisions.push(r.decision);
      current = { ...r.nextAssignment, is_synthetic: true };
    }
    const { activity } = nextActivity({ assignment: current, variantSeed: 'C' });

    runs.push({
      condition,
      accommodations_only: acc.accommodations,
      domain_scores: assessment.domain_scores,
      levels: profile.levels,
      strengths: profile.strengths,
      support_areas: profile.support_areas,
      confidence: profile.confidence,
      assignments,
      decisions: decisions.map((d) => ({ rule_id: d.rule_id, reason_code: d.reason_code, to_level: d.to_level, to_template_id: d.to_template_id })),
      final_assignment: current,
      next_activity_id: activity.activity_id,
    });
  }

  // Compare everything EXCEPT the accommodation list.
  const comparable = (r) => JSON.stringify({ ...r, condition: undefined, accommodations_only: undefined });
  const first = comparable(runs[0]);
  const identical = runs.every((r) => comparable(r) === first);

  return {
    name: 'SCENARIO_C_DIAGNOSIS_BLINDNESS',
    conditions_tested: conditions,
    identical_outcomes: identical,
    runs,
    claim: identical
      ? 'Identical performance produced identical scores, levels, goals, pathway decisions and next activity across all five diagnoses. The only difference was the access accommodations (extra time, audio repeat, reduced animation), which never enter scoring or the pathway.'
      : 'FAILED — outcomes differed across diagnoses. This is a build-breaking defect.',
  };
}

export function runAllScenarios() {
  return { A: scenarioA(), B: scenarioB(), C: scenarioC() };
}
