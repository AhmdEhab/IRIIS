/**
 * IRIS — Skill-estimate ledger (Phase 5).
 *
 * ── WHAT THIS IS ──────────────────────────────────────────────────────────
 * A ledger of observations plus an explicit, inspectable update rule. It is
 * NOT a psychometric model. There is no latent trait here, no ability
 * estimate, no standard error, no item response theory — IRIS has an
 * uncalibrated item bank and IRT language would be a false claim (matrix F1).
 *
 * The whole model is: what did the child do, at which rung, with how much
 * support, how recently — and one table that turns that into a move.
 *
 * ── WHY THERE IS NO PRIOR TO DECAY ────────────────────────────────────────
 * The approved decision is BLIND PLACEMENT. The diagnosis never enters this
 * file; there is no `condition` parameter anywhere in it. Age enters only via
 * calibration's downward-safe entry hint, and that is discarded the moment
 * real evidence arrives — `provenance` moves CALIBRATED → OBSERVED on the
 * first scored session.
 *
 * So "observed performance outweighs generic assumptions" is not a weighting
 * to tune. The generic assumption is structurally absent.
 *
 * ── THE UPDATE RULE IS THE EXISTING PATHWAY CASCADE ───────────────────────
 * The move table below is deliberately the same shape as R-PATH-005/006/007
 * in engines/pathway.js, applied to a ladder rung instead of a goal level:
 * simplify before shifting modality, shift modality before stepping down.
 * That ordering is already specified, already tested, and reusing it means
 * one adaptation policy in the product rather than two that can drift apart.
 */
import { VALIDATION } from '../spec.js';
import { nextRung, prevRung, STRAND_BY_ID, baseRungOf, topRungOf } from '../ladders/index.js';

/**
 * Thresholds for the move table.
 *
 * ENGINEERING_ASSUMPTION. No retrieved source supplies a mastery threshold for
 * this population; matrix §8 lists this among the parameters a specialist must
 * review. 0.8 and 0.5 are conventional mastery-learning values, kept here in
 * one place so they can be changed without touching logic.
 */
export const ESTIMATE_CONFIG = {
  CLIMB_AT_ACCURACY: 0.8,
  CLIMB_AFTER_SESSIONS: 2,
  HOLD_FLOOR_ACCURACY: 0.5,
  SCAFFOLD_AFTER_LOW: 1,
  MODALITY_SHIFT_AFTER_LOW: 2,
  BACKSTEP_AFTER_LOW: 3,
  /** Observations kept per strand. Older ones are summarised out, not lost. */
  EVIDENCE_WINDOW: 12,
  /** Below this, confidence can never be HIGH however good the accuracy. */
  MIN_ITEMS_FOR_HIGH_CONFIDENCE: 3,
  MIN_SESSIONS_FOR_HIGH_CONFIDENCE: 2,
  _validation: VALIDATION.ENGINEERING_ASSUMPTION,
  _source: 'ASSESSMENT_RESEARCH_MATRIX.md §8 — no source supplies these',
};

export const PROVENANCE = {
  CALIBRATED: 'CALIBRATED',
  OBSERVED: 'OBSERVED',
  CARRIED_FORWARD: 'CARRIED_FORWARD',
};

export const MOVES = {
  CLIMB: 'CLIMB',
  HOLD: 'HOLD',
  HOLD_ROTATE_FORMAT: 'HOLD_ROTATE_FORMAT',
  HOLD_ADD_SCAFFOLD: 'HOLD_ADD_SCAFFOLD',
  SHIFT_MODALITY: 'SHIFT_MODALITY',
  BACKSTEP: 'BACKSTEP',
  AT_TOP: 'AT_TOP',
  AT_BASE: 'AT_BASE',
};

/** A fresh estimate for a strand, placed by calibration. */
export function newEstimate({ strandId, rung, provenance = PROVENANCE.CALIBRATED, at = null }) {
  const strand = STRAND_BY_ID[strandId];
  if (!strand) throw new Error(`unknown strand: ${strandId}`);
  return {
    strand: strandId,
    ladder: strand.ladder,
    track: strand.track,
    rung,
    evidence: [],
    confidence: 'LOW', // nothing observed yet — never start at HIGH
    provenance,
    consecutive_low: 0,
    consecutive_high: 0,
    last_moved_at: at,
    last_move: null,
  };
}

/**
 * Record one observation.
 *
 * @param {object} estimate
 * @param {object} obs
 * @param {number} obs.rung        rung the items were drawn from
 * @param {number} obs.correct
 * @param {number} obs.total
 * @param {number} [obs.supported] items answered with a hint/scaffold shown
 * @param {string} [obs.modality]  template or modality id, for the multi-modal check
 * @param {boolean}[obs.calibration] calibration probes never count as attainment
 * @param {string} [obs.session_id]
 * @param {string} [obs.at]
 * @param {string} [obs.dialect_distance] 'MSA_ONLY' | 'SHIFTED' | 'SHARED' | 'UNKNOWN'
 */
export function recordObservation(estimate, obs) {
  const row = {
    rung: obs.rung,
    correct: obs.correct ?? 0,
    total: obs.total ?? 0,
    supported: obs.supported ?? 0,
    modality: obs.modality ?? null,
    calibration: !!obs.calibration,
    session_id: obs.session_id ?? null,
    at: obs.at ?? null,
    dialect_distance: obs.dialect_distance ?? 'UNKNOWN',
  };
  const evidence = [...estimate.evidence, row].slice(-ESTIMATE_CONFIG.EVIDENCE_WINDOW);
  return { ...estimate, evidence };
}

/** Observations that count toward attainment: scored, non-calibration, at this rung. */
export function scoredEvidenceAtRung(estimate, rung = estimate.rung) {
  return estimate.evidence.filter((e) => !e.calibration && e.rung === rung && e.total > 0);
}

/**
 * The most recent observations at a rung — what the move decision reads.
 *
 * The move must reflect the RECENT trend, not the lifetime average. A child
 * who failed a rung during the assessment and has since answered it correctly
 * three sessions running has improved, and a cumulative average would hide
 * that behind the original failure and hold them there indefinitely. §9 of the
 * brief requires that improvement allows upward progression; this is where
 * that is honoured.
 *
 * Attainment scoring (indicators.js) still uses ALL the evidence. Only the
 * move decision is recency-weighted.
 */
export function recentEvidenceAtRung(estimate, rung = estimate.rung, n = ESTIMATE_CONFIG.CLIMB_AFTER_SESSIONS) {
  return scoredEvidenceAtRung(estimate, rung).slice(-n);
}

/** Unsupported accuracy — the figure the move table reads. */
export function accuracyOf(rows) {
  const total = rows.reduce((s, r) => s + r.total, 0);
  if (total === 0) return null;
  return rows.reduce((s, r) => s + r.correct, 0) / total;
}

/**
 * Support ratio: how much of the child's correct work needed a scaffold.
 *
 * Reported separately rather than blended into one number because Chapman
 * (matrix D9) found the Down syndrome expressive-language deficit "disappears
 * when a preview opportunity and picture support is given", and Nye et al.
 * (D10) found both groups benefited similarly from scaffolding. What a child
 * can do WITH help is the thing a parent most needs and a single score hides.
 */
export function supportRatioOf(rows) {
  const total = rows.reduce((s, r) => s + r.total, 0);
  if (total === 0) return null;
  return rows.reduce((s, r) => s + r.supported, 0) / total;
}

/** Distinct modalities the strand has been observed through. */
export function modalitiesOf(estimate) {
  return [...new Set(estimate.evidence.filter((e) => e.modality).map((e) => e.modality))];
}

/**
 * Confidence in this estimate.
 *
 * Rises with more observations, consistency, and more than one modality;
 * stays low on thin or contradictory evidence. Thresholds are engineering
 * assumptions (see ESTIMATE_CONFIG).
 */
export function confidenceOf(estimate) {
  const rows = scoredEvidenceAtRung(estimate);
  const items = rows.reduce((s, r) => s + r.total, 0);
  const sessions = rows.length;

  if (items === 0) return 'LOW';
  if (items < ESTIMATE_CONFIG.MIN_ITEMS_FOR_HIGH_CONFIDENCE) return 'LOW';
  if (sessions < ESTIMATE_CONFIG.MIN_SESSIONS_FOR_HIGH_CONFIDENCE) return 'MEDIUM';

  // Inconsistency across sessions keeps confidence down even with many items.
  const perSession = rows.map((r) => r.correct / r.total);
  const spread = Math.max(...perSession) - Math.min(...perSession);
  if (spread > 0.5) return 'MEDIUM';

  // Corroboration through a second modality is the strongest signal available
  // (matrix E3 — the same score can be reached by a different route).
  if (modalitiesOf(estimate).length >= 2) return 'HIGH';
  return sessions >= 3 ? 'HIGH' : 'MEDIUM';
}

/**
 * Decide the next move for a strand. Pure; does not mutate.
 *
 * Returns { move, from_rung, to_rung, reason, accuracy, rule_id }.
 */
export function decideMove(estimate) {
  const { ladder, track, rung } = estimate;
  // Recent, not cumulative — see recentEvidenceAtRung().
  const rows = recentEvidenceAtRung(estimate);
  const accuracy = accuracyOf(rows);

  const at = (move, toRung, reason) => ({
    move,
    from_rung: rung,
    to_rung: toRung,
    reason,
    accuracy,
    consecutive_low: estimate.consecutive_low,
    consecutive_high: estimate.consecutive_high,
    rule_id: 'R-EST-001',
  });

  if (accuracy == null) return at(MOVES.HOLD, rung, 'NO_SCORED_EVIDENCE');

  // ── strong ──────────────────────────────────────────────────────────────
  // NOTE the counters are read as-is. updateEstimate() increments them BEFORE
  // calling this, so adding one here would climb after a single good session —
  // which is exactly the overconfident conclusion from one observation that
  // §14 of the brief forbids.
  if (accuracy >= ESTIMATE_CONFIG.CLIMB_AT_ACCURACY) {
    if (estimate.consecutive_high < ESTIMATE_CONFIG.CLIMB_AFTER_SESSIONS) {
      return at(MOVES.HOLD, rung, 'HIGH_BUT_NEEDS_CORROBORATION');
    }
    const up = nextRung(ladder, track, rung);
    if (up == null) return at(MOVES.AT_TOP, rung, 'LADDER_TOP_REACHED');
    return at(MOVES.CLIMB, up, 'TWO_CONSECUTIVE_HIGH');
  }

  // ── middling: enough to keep working here, not enough to move ───────────
  if (accuracy >= ESTIMATE_CONFIG.HOLD_FLOOR_ACCURACY) {
    return at(MOVES.HOLD_ROTATE_FORMAT, rung, 'PARTIAL_MASTERY_ROTATE_FORMAT');
  }

  // ── weak: the existing cascade order — scaffold, then modality, then down ─
  const low = estimate.consecutive_low;
  if (low >= ESTIMATE_CONFIG.BACKSTEP_AFTER_LOW) {
    const down = prevRung(ladder, track, rung);
    if (down == null) return at(MOVES.AT_BASE, rung, 'ALREADY_AT_LADDER_BASE');
    return at(MOVES.BACKSTEP, down, 'THREE_CONSECUTIVE_LOW');
  }
  if (low >= ESTIMATE_CONFIG.MODALITY_SHIFT_AFTER_LOW) {
    return at(MOVES.SHIFT_MODALITY, rung, 'TWO_CONSECUTIVE_LOW');
  }
  return at(MOVES.HOLD_ADD_SCAFFOLD, rung, 'ONE_LOW_ADD_SUPPORT');
}

/**
 * Apply an observation and the resulting move. This is the whole update step.
 *
 * Calibration observations are recorded but never move the rung — calibration
 * finds a starting point, it does not score the child.
 */
export function updateEstimate(estimate, obs) {
  let next = recordObservation(estimate, obs);

  if (obs.calibration) {
    return { ...next, confidence: confidenceOf(next) };
  }

  const accuracy = obs.total > 0 ? obs.correct / obs.total : null;
  if (accuracy != null) {
    next = {
      ...next,
      consecutive_high: accuracy >= ESTIMATE_CONFIG.CLIMB_AT_ACCURACY ? next.consecutive_high + 1 : 0,
      consecutive_low: accuracy < ESTIMATE_CONFIG.HOLD_FLOOR_ACCURACY ? next.consecutive_low + 1 : 0,
    };
  }

  const decision = decideMove(next);

  if (decision.move === MOVES.CLIMB || decision.move === MOVES.BACKSTEP) {
    next = {
      ...next,
      rung: decision.to_rung,
      consecutive_high: 0,
      consecutive_low: 0,
      last_moved_at: obs.at ?? next.last_moved_at,
    };
  }

  return {
    ...next,
    provenance: PROVENANCE.OBSERVED, // real evidence supersedes the calibration placement
    last_move: decision,
    confidence: confidenceOf(next),
  };
}

/**
 * Clamp a rung into a ladder's legal range. Used when carrying an estimate
 * forward from an older rule-pack version.
 */
export function clampRung(ladder, track, rung) {
  const lo = baseRungOf(ladder, track);
  const hi = topRungOf(ladder, track);
  return Math.min(hi, Math.max(lo, rung));
}

/** A map of strandId → estimate, for the whole child. */
export function emptyLedger() {
  return { estimates: {}, rule_pack_version: 'phase5-1.0.0' };
}

export function putEstimate(ledger, estimate) {
  return { ...ledger, estimates: { ...ledger.estimates, [estimate.strand]: estimate } };
}

export const getEstimate = (ledger, strandId) => ledger.estimates?.[strandId] ?? null;
