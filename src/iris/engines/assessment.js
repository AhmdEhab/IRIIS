/**
 * IRIS — Assessment Engine (doc 11)
 *
 * Criterion-referenced educational learning screening.
 * NOT an IQ test. NOT norm-referenced. NOT diagnostic.
 *
 * ── DIAGNOSIS-BLINDNESS CONTRACT ──────────────────────────────────────────
 * No function in this file accepts, reads, or is influenced by `condition`.
 * The task list is identical for every child (doc 11 §1). Accommodations are
 * passed in as an explicit array of ACCESS codes and affect only timing and
 * presentation — never scoring, never item selection, never difficulty.
 * Enforced by TEST-PATH-BLIND / TEST-ASSESS-BLIND.
 * ──────────────────────────────────────────────────────────────────────────
 */
import {
  SUB_MEASURES,
  DPS_WEIGHTS,
  ASSESSMENT_CONFIG,
  FORBIDDEN_ACCOMMODATIONS_BY_TASK,
} from '../spec.js';

/** The nine tasks — doc 11 §3. Identical for every child. */
export const TASKS = [
  { id: 'T-L1', subMeasure: 'LANG.RECEP_VOCAB', kind: 'STEPPED', sitting: 'A', itemsPerStep: 4, labelAr: 'مفردات الاستيعاب', labelEn: 'Receptive vocabulary' },
  { id: 'T-L2', subMeasure: 'LANG.INSTRUCTION', kind: 'STEPPED', sitting: 'B', itemsPerStep: 3, labelAr: 'اتّباع التعليمات', labelEn: 'Instruction following' },
  { id: 'T-L3', subMeasure: 'LANG.PHON_AWARE', kind: 'STEPPED', sitting: 'B', itemsPerStep: 4, labelAr: 'مطابقة الصوت الأول', labelEn: 'Initial-sound matching' },
  { id: 'T-M1', subMeasure: 'MEM.VERBAL_STM', kind: 'STEPPED', sitting: 'B', itemsPerStep: 3, labelAr: 'تذكّر تسلسل مسموع', labelEn: 'Verbal sequence recall' },
  { id: 'T-M2', subMeasure: 'MEM.VISUAL_STM', kind: 'STEPPED', sitting: 'A', itemsPerStep: 3, labelAr: 'تذكّر تسلسل بصري', labelEn: 'Visual sequence recall' },
  { id: 'T-A1', subMeasure: 'ATT.SUSTAINED', kind: 'CONTINUOUS', sitting: 'A', trials: 20, labelAr: 'الانتباه المستمر', labelEn: 'Sustained target detection' },
  { id: 'T-A2', subMeasure: 'ATT.SELECTIVE', kind: 'CONTINUOUS', sitting: 'B', trials: 20, labelAr: 'الانتباه الانتقائي', labelEn: 'Selective target detection' },
  { id: 'T-V1', subMeasure: 'VSP.MATCHING', kind: 'STEPPED', sitting: 'A', itemsPerStep: 4, labelAr: 'المطابقة البصرية', labelEn: 'Visual matching' },
  { id: 'T-V2', subMeasure: 'VSP.PATTERN', kind: 'STEPPED', sitting: 'B', itemsPerStep: 3, labelAr: 'إكمال النمط', labelEn: 'Pattern completion' },
];

export const TASK_BY_SUBMEASURE = Object.fromEntries(TASKS.map((t) => [t.subMeasure, t]));

/**
 * R-ASSESS-006 — validity constraint.
 * An accommodation must reduce an access barrier without changing the target
 * skill. Returns the accommodations that are legal for this task.
 */
export function filterAccommodationsForTask(taskId, accommodations = []) {
  const forbidden = FORBIDDEN_ACCOMMODATIONS_BY_TASK[taskId] || [];
  const allowed = accommodations.filter((a) => !forbidden.includes(a));
  const blocked = accommodations.filter((a) => forbidden.includes(a));
  return { allowed, blocked, ruleId: 'R-ASSESS-006' };
}

/** Timing derived from accommodations only (doc 11 §6). Never from diagnosis. */
export function timingFor(accommodations = []) {
  const extended = accommodations.includes('EXTENDED_TIME');
  return {
    hintDelayMs: extended ? ASSESSMENT_CONFIG.HINT_DELAY_MS_EXTENDED : ASSESSMENT_CONFIG.HINT_DELAY_MS,
    timeoutMs: extended ? ASSESSMENT_CONFIG.TIMEOUT_MS_EXTENDED : ASSESSMENT_CONFIG.TIMEOUT_MS,
  };
}

/**
 * R-ASSESS-001 — adaptive stop rule, evaluated over one task's item results
 * in presentation order.
 *
 * STEPPED: advance a step after >= 2 correct in that step; discontinue the
 * task after 2 consecutive incorrect WITHIN a step.
 * CONTINUOUS: never discontinued early.
 */
export function evaluateStopRule(task, itemResults) {
  if (task.kind === 'CONTINUOUS') {
    return { discontinued: false, highestStepPassed: 0, ruleId: 'R-ASSESS-001' };
  }
  let highestStepPassed = 0;
  let discontinued = false;
  const byStep = new Map();
  for (const r of itemResults) {
    const step = r.difficulty_step;
    if (step == null) continue;
    if (!byStep.has(step)) byStep.set(step, []);
    byStep.get(step).push(r);
  }
  for (const step of [...byStep.keys()].sort((a, b) => a - b)) {
    const rows = byStep.get(step);
    const correct = rows.filter((r) => r.is_correct).length;
    if (correct >= ASSESSMENT_CONFIG.ADVANCE_STEP_AT_CORRECT) highestStepPassed = step;
    let consecutiveWrong = 0;
    for (const r of rows) {
      consecutiveWrong = r.is_correct ? 0 : consecutiveWrong + 1;
      if (consecutiveWrong >= ASSESSMENT_CONFIG.DISCONTINUE_AFTER_CONSECUTIVE_WRONG) {
        discontinued = true;
        break;
      }
    }
    if (discontinued) break;
  }
  return { discontinued, highestStepPassed, ruleId: 'R-ASSESS-001' };
}

/**
 * R-ASSESS-005 — validity screening. Flags DATA QUALITY, never the child.
 * Doc 11 §8: there is no "untestable" state.
 */
export function computeDataQualityFlags(task, itemResults, stop) {
  const flags = [];
  const scoreable = itemResults.filter((r) => r.response_type !== 'FALSE_ALARM');
  const n = scoreable.length;

  if (n > 0) {
    const rapid = scoreable.filter(
      (r) => typeof r.response_time_ms === 'number' && r.response_time_ms < ASSESSMENT_CONFIG.RAPID_RESPONSE_MS
    ).length;
    if (rapid / n > ASSESSMENT_CONFIG.RAPID_RESPONDING_RATIO) flags.push('RAPID_RESPONDING');

    const timedOut = scoreable.filter((r) => r.timed_out).length;
    if (timedOut / n > ASSESSMENT_CONFIG.HIGH_TIMEOUT_RATIO) flags.push('HIGH_TIMEOUT_RATE');
  }

  if (n < ASSESSMENT_CONFIG.MIN_SCOREABLE_ITEMS) flags.push('INSUFFICIENT_ITEMS');

  if (task.kind === 'STEPPED') {
    const step1 = scoreable.filter((r) => r.difficulty_step === 1);
    if (stop.discontinued && step1.length > 0 && step1.every((r) => !r.is_correct)) {
      flags.push('FLOOR_AT_STEP_1');
    }
    const step3 = scoreable.filter((r) => r.difficulty_step === 3);
    if (step3.length > 0 && step3.every((r) => r.is_correct)) flags.push('CEILING_NOT_REACHED');
  } else {
    const hits = scoreable.filter((r) => r.is_correct).length;
    if (hits === 0 && !flags.includes('INSUFFICIENT_ITEMS')) flags.push('INSUFFICIENT_ITEMS');
  }
  return flags;
}

/**
 * DPS — doc 11 §5. Pure function. 0–100 criterion-referenced index.
 * NOT a standard score, NOT a percentile, NOT an age equivalent, NOT an IQ.
 *
 * Returns { dps, accuracy, depth, independence, flags, notDetermined }.
 * DPS is null when the sub-measure was NOT MEASURED, only bounded.
 */
export function computeDPS(task, itemResults) {
  const stop = evaluateStopRule(task, itemResults);
  const flags = computeDataQualityFlags(task, itemResults, stop);
  const notDetermined = flags.includes('INSUFFICIENT_ITEMS') || flags.includes('FLOOR_AT_STEP_1');

  if (notDetermined) {
    return {
      subMeasure: task.subMeasure, dps: null, accuracy: null, depth: null,
      independence: null, flags, notDetermined: true, highestStepPassed: stop.highestStepPassed,
    };
  }

  let accuracy, depth, independence;

  if (task.kind === 'CONTINUOUS') {
    // doc 11 §5 attention variant
    const hits = itemResults.filter((r) => r.response_type !== 'FALSE_ALARM' && r.is_correct).length;
    const misses = itemResults.filter((r) => r.response_type !== 'FALSE_ALARM' && !r.is_correct).length;
    const falseAlarms = itemResults.filter((r) => r.response_type === 'FALSE_ALARM').length;
    const denom = hits + misses + falseAlarms;
    accuracy = denom > 0 ? hits / denom : 0;
    const seconds = itemResults[0]?.seconds_on_task ?? ASSESSMENT_CONFIG.ATTENTION_TASK_SECONDS;
    depth = Math.min(1, seconds / ASSESSMENT_CONFIG.ATTENTION_TASK_SECONDS);
    independence = 1; // no hints are offered on continuous tasks
  } else {
    const scoreable = itemResults.filter((r) => r.response_type !== 'FALSE_ALARM');
    const n = scoreable.length;
    accuracy = n > 0 ? scoreable.filter((r) => r.is_correct).length / n : 0;
    depth = stop.highestStepPassed / 3;
    const hints = scoreable.reduce((s, r) => s + (r.hints_used || 0), 0);
    independence = Math.max(0, 1 - hints / (n || 1));
  }

  const dps = Math.round(
    100 * (DPS_WEIGHTS.accuracy * accuracy + DPS_WEIGHTS.depth * depth + DPS_WEIGHTS.independence * independence)
  );

  return {
    subMeasure: task.subMeasure, dps, accuracy, depth, independence,
    flags, notDetermined: false, highestStepPassed: stop.highestStepPassed,
  };
}

/**
 * Score a whole assessment.
 *
 * @param {object} input
 * @param {Object<string, Array>} input.itemResultsBySubMeasure raw evidence rows
 * @param {string[]} [input.accommodationsUsed] recorded for the Assessment record
 * @param {number} [input.interruptionCount]
 * @returns {{domain_scores, per_sub_measure, data_quality_flags, accommodations_used, interruption_count}}
 *
 * NOTE the absent parameter: there is no `condition` argument. Scoring cannot
 * be diagnosis-conditioned because the diagnosis is not in scope here.
 */
export function scoreAssessment({ itemResultsBySubMeasure, accommodationsUsed = [], interruptionCount = 0 }) {
  const domain_scores = {};
  const per_sub_measure = {};
  const allFlags = new Set();

  for (const sm of SUB_MEASURES) {
    const task = TASK_BY_SUBMEASURE[sm];
    const rows = itemResultsBySubMeasure[sm];
    if (!rows || rows.length === 0) {
      domain_scores[sm] = null;
      per_sub_measure[sm] = {
        subMeasure: sm, dps: null, accuracy: null, depth: null, independence: null,
        flags: ['INSUFFICIENT_ITEMS'], notDetermined: true, highestStepPassed: 0,
      };
      allFlags.add('INSUFFICIENT_ITEMS');
      continue;
    }
    const scored = computeDPS(task, rows);
    domain_scores[sm] = scored.dps;
    per_sub_measure[sm] = scored;
    scored.flags.forEach((f) => allFlags.add(f));
  }

  if (interruptionCount > ASSESSMENT_CONFIG.MAX_INTERRUPTIONS) allFlags.add('SESSION_INTERRUPTED');

  return {
    domain_scores,
    per_sub_measure,
    data_quality_flags: [...allFlags],
    accommodations_used: [...accommodationsUsed],
    interruption_count: interruptionCount,
  };
}
