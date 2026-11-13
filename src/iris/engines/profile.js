/**
 * IRIS — Cognitive & Learning Profile Engine (doc 12)
 *
 * "The profile is computed by ONE function, identical for every child, that
 *  never reads Child.condition." — doc 12, central design commitment.
 *
 * Intra-individual comparison only. IRIS has no norming sample and must never
 * imply one. No percentile, no age equivalent, no IQ, no severity label.
 */
import { SUB_MEASURES, PROFILE, ASSESSMENT_CONFIG } from '../spec.js';

/** R-PROFILE-006 — absolute level band from a DPS. */
export function levelForDPS(dps) {
  if (dps == null) return null;
  for (const band of PROFILE.LEVEL_BANDS) if (dps <= band.max) return band.level;
  return PROFILE.LEVEL_BANDS[PROFILE.LEVEL_BANDS.length - 1].level;
}

/** R-PROFILE-008 — confidence. */
export function computeConfidence({ dataQualityFlags = [], notDeterminedCount = 0, interruptionCount = 0, minScoreableItems = null }) {
  if (
    dataQualityFlags.includes('RAPID_RESPONDING') ||
    dataQualityFlags.includes('HIGH_TIMEOUT_RATE') ||
    notDeterminedCount >= 3 ||
    interruptionCount > ASSESSMENT_CONFIG.MAX_INTERRUPTIONS
  ) return 'LOW';

  if (
    dataQualityFlags.includes('SESSION_INTERRUPTED') ||
    (notDeterminedCount >= 1 && notDeterminedCount <= 2) ||
    (minScoreableItems != null && minScoreableItems < 4)
  ) return 'MEDIUM';

  return 'HIGH';
}

/**
 * Build the Profile.
 *
 * @param {object} input
 * @param {Object<string, number|null>} input.domain_scores nine DPS values
 * @param {string[]} [input.data_quality_flags]
 * @param {number} [input.interruption_count]
 * @param {number|null} [input.min_scoreable_items]
 *
 * There is deliberately NO `condition` parameter. TEST-PROFILE-BLIND asserts
 * that mutating a diagnosis anywhere upstream leaves this output identical.
 */
export function buildProfile({
  domain_scores,
  data_quality_flags = [],
  interruption_count = 0,
  min_scoreable_items = null,
}) {
  const determined = SUB_MEASURES.filter((s) => domain_scores[s] != null);
  const notDetermined = SUB_MEASURES.filter((s) => domain_scores[s] == null);

  // R-PROFILE-001 — relative index against the child's OWN mean.
  const childMean =
    determined.length > 0
      ? determined.reduce((sum, s) => sum + domain_scores[s], 0) / determined.length
      : null;

  const relative_index = {};
  for (const s of SUB_MEASURES) {
    relative_index[s] = domain_scores[s] == null || childMean == null
      ? null
      : Number((domain_scores[s] - childMean).toFixed(2));
  }

  // R-PROFILE-002 — classification at ±8.
  const classified = {};
  for (const s of SUB_MEASURES) {
    const ri = relative_index[s];
    if (ri == null) classified[s] = 'NOT_DETERMINED';
    else if (ri >= PROFILE.DISCREPANCY) classified[s] = 'RELATIVE_STRENGTH';
    else if (ri <= -PROFILE.DISCREPANCY) classified[s] = 'RELATIVE_SUPPORT_AREA';
    else classified[s] = 'TYPICAL_FOR_THIS_CHILD';
  }

  // R-PROFILE-003 — flat-profile guard. Never manufacture a strength.
  const anyDiscrepant = SUB_MEASURES.some(
    (s) => relative_index[s] != null && Math.abs(relative_index[s]) >= PROFILE.DISCREPANCY
  );
  const profile_shape = anyDiscrepant ? 'DIFFERENTIATED' : 'FLAT';

  // R-PROFILE-004 — caps, largest magnitude first, deterministic tie-break by name.
  const sortByMagnitude = (list, dir) =>
    list
      .slice()
      .sort((a, b) => (dir * (relative_index[b] - relative_index[a])) || a.localeCompare(b));

  const strengths = anyDiscrepant
    ? sortByMagnitude(SUB_MEASURES.filter((s) => classified[s] === 'RELATIVE_STRENGTH'), 1)
        .slice(0, PROFILE.MAX_STRENGTHS)
    : [];

  const support_areas = anyDiscrepant
    ? sortByMagnitude(SUB_MEASURES.filter((s) => classified[s] === 'RELATIVE_SUPPORT_AREA'), -1)
        .slice(0, PROFILE.MAX_SUPPORT_AREAS)
    : [];

  const confidence = computeConfidence({
    dataQualityFlags: data_quality_flags,
    notDeterminedCount: notDetermined.length,
    interruptionCount: interruption_count,
    minScoreableItems: min_scoreable_items,
  });

  // R-PROFILE-006 / 007 — levels, reduced by 1 when confidence is LOW.
  const levels = {};
  for (const s of SUB_MEASURES) {
    const base = levelForDPS(domain_scores[s]);
    if (base == null) { levels[s] = null; continue; }
    levels[s] = confidence === 'LOW' ? Math.max(1, base - 1) : base;
  }

  return {
    domain_scores: { ...domain_scores },
    child_mean: childMean == null ? null : Number(childMean.toFixed(2)),
    relative_index,
    classified,
    profile_shape,
    strengths,
    support_areas,
    not_determined: notDetermined,
    levels,
    confidence,
    data_quality_flags: [...data_quality_flags],
    rule_ids: ['R-PROFILE-001', 'R-PROFILE-002', 'R-PROFILE-003', 'R-PROFILE-004', 'R-PROFILE-005', 'R-PROFILE-006', 'R-PROFILE-007', 'R-PROFILE-008'],
  };
}
