/**
 * IRIS — Progress & Adaptation Engine (doc 16)
 *
 * Progress is always measured against the CHILD'S OWN baseline, never against
 * population norms and never against other children (R-PROG-002).
 *
 * Parent-facing output rules (doc 16 §Parent Mode) are enforced in
 * parent/explain.js — this file produces the facts, not the wording.
 */
import { PROGRESS_CONFIG, ENGAGEMENT_CONFIG } from '../spec.js';

/**
 * R-PROG-002 — baseline: the FIRST completed session at the goal's first
 * assigned level. Frozen. Never recomputed.
 */
export function computeBaseline(sessions, goalId) {
  const forGoal = sessions.filter((s) => s.goal_id === goalId && s.completion_status === 'COMPLETE' && !s.engagement_flag);
  if (forGoal.length === 0) return null;
  const first = forGoal[0];
  return {
    goal_id: goalId,
    level: first.level,
    accuracy: first.accuracy,
    independence: first.independence,
    at: first.at ?? null,
    frozen: true,
    rule_id: 'R-PROG-002',
  };
}

/**
 * R-PROG-003 — trend over the snapshot window.
 * < 3 sessions → INSUFFICIENT_DATA (never guessed).
 */
export function computeTrend(sessions, goalId, { metric = 'accuracy' } = {}) {
  const usable = sessions.filter((s) => s.goal_id === goalId && !s.engagement_flag);
  if (usable.length < PROGRESS_CONFIG.MIN_SESSIONS_FOR_TREND) {
    return { trend: 'INSUFFICIENT_DATA', delta: null, n: usable.length, rule_id: 'R-PROG-003' };
  }
  const half = Math.floor(usable.length / 2);
  const earlier = usable.slice(0, half);
  const later = usable.slice(-half);
  const mean = (arr) => arr.reduce((s, x) => s + (x[metric] ?? 0), 0) / (arr.length || 1);
  const delta = Number((mean(later) - mean(earlier)).toFixed(4));

  let trend = 'STABLE';
  if (delta >= PROGRESS_CONFIG.TREND_DELTA) trend = 'IMPROVING';
  else if (delta <= -PROGRESS_CONFIG.TREND_DELTA) trend = 'DECLINING';

  return { trend, delta, n: usable.length, metric, rule_id: 'R-PROG-003' };
}

/** R-PROG-004 — objective level-progress facts. No interpretation. */
export function levelProgress(sessions, goalId) {
  const forGoal = sessions.filter((s) => s.goal_id === goalId);
  const decisions = forGoal.flatMap((s) => (s.decision ? [s.decision] : []));
  return {
    goal_id: goalId,
    sessions_completed: forGoal.filter((s) => s.completion_status === 'COMPLETE').length,
    levels_advanced: decisions.filter((d) => d.reason_code === 'ADVANCE_MASTERY').length,
    goal_levels_mastered: decisions.filter((d) => d.reason_code === 'ADVANCE_MASTERY' || d.reason_code === 'GOAL_MASTERED').length,
    modality_shifts: decisions.filter((d) => d.reason_code === 'MODALITY_SHIFT').length,
    back_steps: decisions.filter((d) => d.reason_code === 'PREREQ_BACKSTEP').length,
    scaffold_applications: decisions.filter((d) => d.reason_code === 'SIMPLIFY_SCAFFOLD').length,
    current_level: forGoal.length ? forGoal[forGoal.length - 1].level : null,
    rule_id: 'R-PROG-004',
  };
}

/** R-PROG-005 — independence tracked SEPARATELY from accuracy. */
export function independenceTrend(sessions, goalId) {
  return { ...computeTrend(sessions, goalId, { metric: 'independence' }), rule_id: 'R-PROG-005' };
}

/** R-PROG-006 — re-assessment triggers. */
export function reassessmentTriggers({ sessions = [], daysSinceAssessment = 0, notDeterminedSubMeasures = [], daysSinceProfile = 0 }) {
  const triggers = [];
  if (daysSinceAssessment >= PROGRESS_CONFIG.REASSESS_DAYS) triggers.push('ASSESSMENT_AGE');

  const decisions = sessions.flatMap((s) => (s.decision ? [s.decision] : []));
  const masteredToTop = decisions.filter((d) => d.reason_code === 'GOAL_MASTERED').length;
  if (masteredToTop >= PROGRESS_CONFIG.REASSESS_GOALS_MASTERED) triggers.push('GOALS_MASTERED');

  const backsteps = decisions.filter((d) => d.reason_code === 'PREREQ_BACKSTEP').length;
  if (backsteps >= PROGRESS_CONFIG.REASSESS_BACKSTEPS) triggers.push('REPEATED_BACKSTEP');

  let consecutiveFlags = 0;
  for (let i = sessions.length - 1; i >= 0; i--) {
    if (sessions[i].engagement_flag) consecutiveFlags++;
    else break;
  }
  if (consecutiveFlags >= ENGAGEMENT_CONFIG.CONSECUTIVE_FLAGS_TO_SUGGEST_REASSESS) triggers.push('REPEATED_ENGAGEMENT_FLAG');

  if (notDeterminedSubMeasures.length > 0 && daysSinceProfile >= PROGRESS_CONFIG.REASSESS_NOT_DETERMINED_DAYS) {
    triggers.push('STILL_NOT_DETERMINED');
  }

  return { triggers, should_reassess: triggers.length > 0, rule_id: 'R-PROG-006' };
}

/** A full progress snapshot for one goal. */
export function progressSnapshot(sessions, goalId) {
  return {
    goal_id: goalId,
    baseline: computeBaseline(sessions, goalId),
    accuracy_trend: computeTrend(sessions, goalId, { metric: 'accuracy' }),
    independence_trend: independenceTrend(sessions, goalId),
    level_progress: levelProgress(sessions, goalId),
    window_days: PROGRESS_CONFIG.WINDOW_DAYS,
    rule_ids: ['R-PROG-001', 'R-PROG-002', 'R-PROG-003', 'R-PROG-004', 'R-PROG-005'],
  };
}
