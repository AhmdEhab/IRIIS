/**
 * IRIS — Adaptive Pathway Engine (doc 14)
 *
 * ── THE CORE ARCHITECTURAL GUARANTEE ──────────────────────────────────────
 * doc 14 R-PATH-006, quoted verbatim:
 *   "The modality shift is triggered by this child's observed failure at this
 *    modality, and the alternate is chosen by template availability, never by
 *    a diagnosis-to-modality table. There is no rule anywhere in IRIS of the
 *    form 'DS → visual' or 'WS → auditory'. The rule is symmetric and
 *    diagnosis-blind."
 *
 * `decideNext()` has no `condition` parameter. It cannot be diagnosis-
 * conditioned because the diagnosis is not in scope. TEST-PATH-BLIND asserts
 * this by mutating the diagnosis across every value and requiring byte-
 * identical output.
 * ──────────────────────────────────────────────────────────────────────────
 */
import { BANDS, PATHWAY_CONFIG, ENGAGEMENT_CONFIG } from '../spec.js';
import { GOAL_BY_ID, isMastered } from './goals.js';
import { TEMPLATE_BY_ID, templateForGoalLevel } from '../content/templates.js';

/**
 * R-PATH-001 — band classification.
 * Evaluated in the specified order: LOW first, then HIGH, then MODERATE as the
 * catch-all. Total by construction: every input maps to exactly one band.
 */
export function classifyBand({ accuracy, independence }) {
  if (typeof accuracy !== 'number' || Number.isNaN(accuracy)) {
    throw new TypeError('classifyBand: accuracy must be a number');
  }
  if (accuracy < BANDS.LOW_ACCURACY_BELOW) {
    return { band: 'LOW', rule_id: 'R-PATH-001' };
  }
  if (accuracy >= BANDS.HIGH_ACCURACY_AT_LEAST && independence >= BANDS.HIGH_INDEPENDENCE_AT_LEAST) {
    return { band: 'HIGH', rule_id: 'R-PATH-001' };
  }
  return { band: 'MODERATE', rule_id: 'R-PATH-001' };
}

/** Derive session metrics from raw item rows (doc 16 §per-session capture). */
export function summariseSession({ items = [], completion_status = 'COMPLETE', duration_ms = 0 }) {
  const presented = items.length;
  const correct = items.filter((i) => i.is_correct).length;
  const hints = items.reduce((s, i) => s + (i.hints_used || 0), 0);
  const accuracy = presented > 0 ? correct / presented : 0;
  const independence = presented > 0 ? Math.max(0, 1 - hints / presented) : 0;
  const engagement = detectEngagementFlag({ items, completion_status });
  const { band } = classifyBand({ accuracy, independence });
  return {
    presented, correct, total_hints: hints,
    accuracy: Number(accuracy.toFixed(4)),
    independence: Number(independence.toFixed(4)),
    completion_status, duration_ms,
    engagement_flag: engagement.flagged,
    engagement_reason: engagement.reason,
    band: engagement.flagged ? null : band, // flagged sessions are not band-classified
  };
}

/**
 * R-PATH-010 — engagement flag [C].
 * A wrong guess costs a skipped adaptation, never a wrongly lowered level.
 */
export function detectEngagementFlag({ items = [], completion_status = 'COMPLETE' }) {
  const n = items.length;
  if (n === 0) return { flagged: false, reason: null };

  const timedOutNoTap = items.filter((i) => i.timed_out && !i.tapped).length;
  if (timedOutNoTap / n > ENGAGEMENT_CONFIG.TIMEOUT_NO_TAP_RATIO) {
    return { flagged: true, reason: 'HIGH_TIMEOUT_NO_RESPONSE' };
  }
  const rapid = items.filter(
    (i) => typeof i.response_time_ms === 'number' && i.response_time_ms < ENGAGEMENT_CONFIG.RAPID_RESPONSE_MS
  ).length;
  if (rapid / n > ENGAGEMENT_CONFIG.RAPID_RESPONSE_RATIO) {
    return { flagged: true, reason: 'RAPID_RANDOM_RESPONDING' };
  }
  if (completion_status === 'ABANDONED') {
    return { flagged: true, reason: 'ABANDONED_EARLY' };
  }
  return { flagged: false, reason: null };
}

/** Fixed parent-explanation templates — R-PATH-011. No LLM. */
export const PARENT_EXPLANATIONS = {
  ADVANCE_MASTERY: {
    ar: 'حقّق طفلك أداءً مرتفعًا في آخر جلستين على هذا المستوى، لذلك انتقلنا إلى المستوى التالي.',
    en: 'Your child performed strongly in the last two sessions at this level, so we moved to the next level.',
  },
  CONSOLIDATE_HIGH: {
    ar: 'كان أداء طفلك مرتفعًا في هذه الجلسة. سنعيد نفس المستوى بنشاط مختلف للتأكد قبل الانتقال.',
    en: "Your child did well this session. We'll repeat the same level with a different activity to confirm before moving on.",
  },
  REPEAT_VARIANT: {
    ar: 'سنكرّر نفس المستوى بنشاط مختلف لإتاحة مزيد من التدريب المتنوّع.',
    en: "We'll repeat the same level with a different activity to give more varied practice.",
  },
  SIMPLIFY_SCAFFOLD: {
    ar: 'كانت هذه الجلسة صعبة، لذلك سنبقى على نفس المستوى ونقلّل عدد العناصر ونضيف دعمًا إضافيًا.',
    en: "This session was difficult, so we're staying at the same level with fewer items and extra support.",
  },
  MODALITY_SHIFT: {
    ar: 'جرّبنا نفس المهارة بطريقة عرض مختلفة، لأن الطريقة السابقة كانت صعبة على طفلك في هاتين الجلستين.',
    en: "We're trying the same skill presented a different way, because the previous way was difficult in these two sessions.",
  },
  PREREQ_BACKSTEP: {
    ar: 'رجعنا خطوة إلى مستوى أسبق لبناء أساس أقوى قبل المحاولة مرة أخرى.',
    en: "We stepped back one level to build a stronger foundation before trying again.",
  },
  HOLD_LOW_CONFIDENCE: {
    ar: 'ما زلنا نتعرّف على مستوى طفلك، لذلك سنبقى على نفس المستوى بنشاط جديد لجلسة أخرى.',
    en: "We're still learning about your child's level, so we'll stay here with a new activity for another session.",
  },
  FLAG_ENGAGEMENT: {
    ar: 'يبدو أن هذه الجلسة انتهت مبكرًا — قد يكون من المفيد تجربتها في وقت آخر من اليوم.',
    en: 'This session was cut short — it may be worth trying again at a different time of day.',
  },
  GOAL_MASTERED: {
    ar: 'أتمّ طفلك جميع مستويات هذا الهدف. سنختار هدفًا جديدًا.',
    en: 'Your child completed all levels of this goal. We will select a new goal.',
  },
};

/**
 * The ordered decision function.
 *
 * @param {object} state
 * @param {string} state.goal_id
 * @param {number} state.level
 * @param {string} state.template_id
 * @param {Array} state.sessions      full history for this child (chronological)
 * @param {object} state.lastSession  summarised session just completed
 * @param {string} state.confidence   profile confidence
 * @param {number} state.consecutive_repeats
 * @param {string} [state.rule_pack_version]
 *
 * NOTE: no `condition`. Not accepted, not read, not reachable.
 */
export function decideNext(state) {
  const {
    goal_id, level, template_id, sessions = [], lastSession,
    confidence = 'HIGH', consecutive_repeats = 0,
    rule_pack_version = 'mvp-1.0.0',
  } = state;

  const goal = GOAL_BY_ID[goal_id];
  if (!goal) throw new Error(`decideNext: unknown goal ${goal_id}`);

  const decide = (rule_id, reason_code, patch, extra = {}) => ({
    rule_id,
    reason_code,
    from_goal_id: goal_id,
    from_level: level,
    from_template_id: template_id,
    to_goal_id: patch.goal_id ?? goal_id,
    to_level: patch.level ?? level,
    to_template_id: patch.template_id ?? template_id,
    scaffold_flags: patch.scaffold_flags ?? [],
    item_count_factor: patch.item_count_factor ?? 1,
    consecutive_repeats: patch.consecutive_repeats ?? consecutive_repeats,
    explanation_parent: PARENT_EXPLANATIONS[reason_code],
    rule_pack_version,
    inputs_snapshot: {
      band: lastSession?.band ?? null,
      accuracy: lastSession?.accuracy ?? null,
      independence: lastSession?.independence ?? null,
      engagement_flag: lastSession?.engagement_flag ?? false,
      confidence,
      consecutive_repeats,
      consecutive_low: countConsecutiveLow(sessions, goal_id, level),
      ...extra,
    },
  });

  // R-PATH-010 — engagement flag short-circuits everything. No level change.
  if (lastSession?.engagement_flag) {
    return decide('R-PATH-010', 'FLAG_ENGAGEMENT', { consecutive_repeats });
  }

  // R-PATH-002 — hold while confidence is LOW and we have < 2 sessions here.
  const sessionsAtLevel = sessions.filter(
    (s) => s.goal_id === goal_id && s.level === level && !s.engagement_flag
  ).length;
  if (confidence === 'LOW' && sessionsAtLevel < PATHWAY_CONFIG.HOLD_LOW_CONFIDENCE_SESSIONS) {
    return decide('R-PATH-002', 'HOLD_LOW_CONFIDENCE', {
      consecutive_repeats: consecutive_repeats + 1,
    });
  }

  const band = lastSession?.band;

  // R-PATH-003 — advance on mastery.
  const mastery = isMastered(sessions, goal_id, level);
  if (mastery.mastered) {
    if (level >= PATHWAY_CONFIG.MAX_LEVEL) {
      return decide('R-PATH-003', 'GOAL_MASTERED', { consecutive_repeats: 0 }, { mastery_rule: mastery.rule_id });
    }
    const nextLevel = level + 1;
    const nextTpl = templateForGoalLevel(goal_id, nextLevel);
    return decide('R-PATH-003', 'ADVANCE_MASTERY', {
      level: nextLevel,
      template_id: nextTpl?.id ?? template_id,
      consecutive_repeats: 0,
    }, { mastery_rule: mastery.rule_id });
  }

  // R-PATH-003b — HIGH but mastery not yet met: consolidate, don't stall.
  if (band === 'HIGH') {
    return decide('R-PATH-003b', 'CONSOLIDATE_HIGH', {
      consecutive_repeats: consecutive_repeats + 1,
    });
  }

  // R-PATH-004 — MODERATE: repeat with a different variant.
  if (band === 'MODERATE') {
    if (consecutive_repeats + 1 >= PATHWAY_CONFIG.REPEAT_CAP) {
      // R-PATH-008 repeat cap → escalate to simplify.
      return decide('R-PATH-008', 'SIMPLIFY_SCAFFOLD', {
        scaffold_flags: scaffoldsFor(goal_id),
        item_count_factor: PATHWAY_CONFIG.REDUCED_ITEMS_FACTOR,
        consecutive_repeats: 0,
      }, { escalated_by: 'REPEAT_CAP' });
    }
    return decide('R-PATH-004', 'REPEAT_VARIANT', {
      consecutive_repeats: consecutive_repeats + 1,
    });
  }

  // band === 'LOW' — the ordered de-escalation.
  const consecutiveLow = countConsecutiveLow(sessions, goal_id, level);

  // R-PATH-005 — first LOW: reduce LOAD before reducing LEVEL.
  // This ordering is the one evidence-motivated part of the sequence:
  // WM is the strongest predictor of achievement (H9) but training it does not
  // transfer (H16) — so the correct response is instructional load reduction.
  if (consecutiveLow <= PATHWAY_CONFIG.SIMPLIFY_AT_CONSECUTIVE_LOW) {
    return decide('R-PATH-005', 'SIMPLIFY_SCAFFOLD', {
      scaffold_flags: scaffoldsFor(goal_id),
      item_count_factor: PATHWAY_CONFIG.REDUCED_ITEMS_FACTOR,
      consecutive_repeats: consecutive_repeats + 1,
    });
  }

  // R-PATH-006 — second LOW: shift modality IF a partner template exists.
  if (consecutiveLow === PATHWAY_CONFIG.MODALITY_SHIFT_AT_CONSECUTIVE_LOW) {
    const current = TEMPLATE_BY_ID[template_id];
    const partnerId = current?.modality_pair_id ?? null;
    if (partnerId) {
      return decide('R-PATH-006', 'MODALITY_SHIFT', {
        template_id: partnerId,
        scaffold_flags: scaffoldsFor(goal_id),
        consecutive_repeats: 0,
      }, { modality_pair_available: true });
    }
    // Declared fallback: no partner → fall straight through to R-PATH-007.
    return backstep(decide, goal, level, { modality_pair_available: false });
  }

  // R-PATH-007 — third consecutive LOW.
  return backstep(decide, goal, level, { modality_pair_available: !!TEMPLATE_BY_ID[template_id]?.modality_pair_id });
}

function backstep(decide, goal, level, extra) {
  if (level > PATHWAY_CONFIG.MIN_LEVEL) {
    const lower = level - 1;
    const tpl = templateForGoalLevel(goal.id, lower);
    return decide('R-PATH-007', 'PREREQ_BACKSTEP', {
      level: lower,
      template_id: tpl?.id,
      consecutive_repeats: 0,
    }, extra);
  }
  if (goal.prerequisite) {
    const preGoal = GOAL_BY_ID[goal.prerequisite.goal_id];
    const tpl = templateForGoalLevel(preGoal.id, goal.prerequisite.min_level);
    return decide('R-PATH-007', 'PREREQ_BACKSTEP', {
      goal_id: preGoal.id,
      level: goal.prerequisite.min_level,
      template_id: tpl?.id,
      consecutive_repeats: 0,
    }, { ...extra, switched_to_prerequisite: true });
  }
  // At level 1 with no prerequisite: pause the goal, hold, notify parent.
  return decide('R-PATH-007', 'PREREQ_BACKSTEP', {
    level: PATHWAY_CONFIG.MIN_LEVEL,
    consecutive_repeats: 0,
  }, { ...extra, goal_paused: true });
}

/**
 * Consecutive LOW-band sessions at this goal-level, most recent backwards.
 *
 * Two categories of session are SKIPPED rather than counted, because in both
 * cases no adaptation was applied to the child and so the de-escalation ladder
 * has not actually advanced:
 *
 *  1. engagement-flagged sessions — excluded by R-PATH-010; a wrong engagement
 *     guess must never cost the child a level.
 *  2. sessions whose decision was HOLD_LOW_CONFIDENCE (R-PATH-002) — the hold
 *     means "we do not trust the placement yet, stay put". The child was never
 *     offered a simplified variant, so counting it would let the ladder jump
 *     past R-PATH-005 straight to a modality shift or a level reduction. That
 *     would break the evidence-motivated ordering (reduce LOAD before reducing
 *     LEVEL) that R-PATH-005 exists to guarantee.
 */
export function countConsecutiveLow(sessions, goalId, level) {
  let n = 0;
  for (let i = sessions.length - 1; i >= 0; i--) {
    const s = sessions[i];
    if (s.goal_id !== goalId || s.level !== level) continue;
    if (s.engagement_flag) continue; // R-PATH-010 — does not break the run
    if (s.decision?.reason_code === 'HOLD_LOW_CONFIDENCE') continue; // R-PATH-002
    if (s.band === 'LOW') n++;
    else break;
  }
  return n;
}

/**
 * Scaffold flags handed DOWN to the content engine (doc 15 §3).
 * Chosen by goal + template capability, never by diagnosis.
 */
export function scaffoldsFor(goalId) {
  switch (goalId) {
    case 'G-LANG-PHON': return ['REAL_LETTERS', 'MNEMONIC_PAIR', 'REDUCED_ITEMS'];
    case 'G-MEM-VERBAL': return ['ANCHOR_VISIBLE', 'REDUCED_ITEMS'];
    case 'G-MEM-VISUAL': return ['ANCHOR_VISIBLE', 'REDUCED_ITEMS'];
    case 'G-LANG-VOCAB': return ['WORKED_EXAMPLE', 'REDUCED_ITEMS'];
    case 'G-VSP-MATCH': return ['WORKED_EXAMPLE', 'REDUCED_ITEMS'];
    case 'G-ATT-SUSTAIN': return ['REDUCED_ITEMS'];
    default: return ['REDUCED_ITEMS'];
  }
}
