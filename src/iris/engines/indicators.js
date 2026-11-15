/**
 * IRIS — Learning Indicators (Phase 5 scoring).
 *
 * ── WHAT THESE ARE ────────────────────────────────────────────────────────
 * Criterion-referenced educational indicators, 0–100, computed per STRAND.
 *
 * They are NOT IQ, NOT percentiles, NOT age equivalents, NOT reading ages,
 * NOT standard scores, and NOT diagnostic. IRIS has no norming sample and
 * must never imply one. `BANNED_TERMS` in spec.js enforces the vocabulary in
 * child- and parent-facing text.
 *
 * ── THE FORMULA IS THE EXISTING ONE ───────────────────────────────────────
 * Indicator = 100 × (0.50·accuracy + 0.30·depth + 0.20·independence)
 *
 * Identical to the DPS already used for the nine sub-measures, reading the
 * same DPS_WEIGHTS from spec.js. Only `depth` changes meaning: highest rung
 * reached ÷ ladder height, instead of step ÷ 3.
 *
 * The weights remain an ENGINEERING_ASSUMPTION. Nothing in the research matrix
 * validates or replaces them, so changing them would swap one guess for
 * another. See matrix §8.
 *
 * ── "NOT MEASURED" IS A FIRST-CLASS VALUE ─────────────────────────────────
 * A strand with too little evidence returns `indicator: null`, not 0. Zero
 * means the child got everything wrong; null means we did not find out. A UI
 * that renders null as an empty bar or a zero is lying, so `notMeasured` is
 * returned explicitly alongside.
 *
 * ── DIAGNOSIS-BLINDNESS ───────────────────────────────────────────────────
 * There is no `condition` parameter in this file. Scoring cannot be
 * diagnosis-conditioned because the diagnosis is not in scope here.
 */
import { DPS_WEIGHTS, PROFILE, VALIDATION } from '../spec.js';
import { STRAND_BY_ID, heightOf, baseRungOf } from '../ladders/index.js';
import { carriesDialectCaveat } from '../ladders/literacy.js';
import { presentedOf } from './skillEstimate.js';

/**
 * av2 §1 — the six outcomes an observation can carry.
 *
 * Exported as ONE frozen list so a consumer cannot invent a seventh and a
 * producer cannot silently drop one; the UI's helper-confirm buttons and the
 * engine's counting both read this array, so the two ends of the wire cannot
 * drift apart.
 *
 * The distinction that makes this list necessary is the last three:
 *
 *   demonstrated_independent  did it without a scaffold
 *   demonstrated_with_support did it WITH a scaffold shown   (counts 0.5, and
 *                             moves `independence` — this is the difference
 *                             between "can do it" and "can do it today with
 *                             help", which matrix D9/D10 say parents need)
 *   not_demonstrated          tried, and did not get there
 *   insufficient              NOT a failure. The item never reached a
 *                             scorable response: disengaged, off-task, audio
 *                             not played, interface not understood this time.
 *                             Never counted in a denominator (spec §4).
 *   no_opportunity            the domain was never offered — gated before the
 *                             session. Honest absence, not a zero.
 *   invalid_administration    the VISIT was not administered as specified
 *                             (<3 items, interruption, wrong device). All its
 *                             rows are excluded from every estimate (§1.6).
 *
 * None of these is a diagnosis and none of them is a behaviour-clinical
 * statement: they describe what happened during an item.
 */
export const OUTCOME = Object.freeze([
  'demonstrated_independent',
  'demonstrated_with_support',
  'not_demonstrated',
  'insufficient',
  'no_opportunity',
  'invalid_administration',
]);

/**
 * Turn one visit's item-level observations into the counts the probe row and
 * the indicators are built from. This is the ONLY place outcomes become
 * numbers, which is what keeps `supported` real instead of a hardcoded 0.
 *
 * Conventions, stated because the denominators depend on them:
 *   correct      = demonstrated_independent ONLY. Support is its own count,
 *                  so independence (1 − supported/presented) can be computed
 *                  and a supported answer cannot silently look like mastery.
 *   supported    = demonstrated_with_support.
 *   insufficient = items that never reached a scorable response.
 *   total        = every item that was presented and scored in some way, so
 *                  insufficient IS inside `total`, and the scorable share is
 *                  `total − insufficient` (see presentedOf in skillEstimate).
 *   no_opportunity and invalid_administration rows are excluded from `total`:
 *                  the first was never presented, the second was presented
 *                  but is not evidence about the child (§1.6).
 */
export function visitCountsFromObservations(obs) {
  const rows = (Array.isArray(obs) ? obs : []).filter(
    (o) => o && OUTCOME.includes(o.outcome) &&
      o.outcome !== 'no_opportunity' && o.outcome !== 'invalid_administration'
  );
  const count = (want) => rows.filter((o) => o.outcome === want).length;
  return {
    correct: count('demonstrated_independent'),
    supported: count('demonstrated_with_support'),
    missed: count('not_demonstrated'),
    insufficient: count('insufficient'),
    total: rows.length,
  };
}

export const INDICATOR_CONFIG = {
  /** Below this many scored items a strand is NOT MEASURED, not scored low. */
  MIN_ITEMS_TO_REPORT: 3,
  /** Below this, confidence cannot be HIGH. */
  MIN_ITEMS_FOR_HIGH: 6,
  /** Share of phonological items on MSA-only phonemes that triggers a caveat. */
  DIALECT_CAVEAT_RATIO: 0.25,
  _validation: VALIDATION.ENGINEERING_ASSUMPTION,
  _source: 'ASSESSMENT_RESEARCH_MATRIX.md §8',
};

/**
 * Rows for one strand: scored, non-calibration only.
 *
 * Two av2 allowances, both deliberate:
 *   - a row whose visit was flagged invalid never reaches the counts (§1.6);
 *   - a row of nothing but `insufficient` still has to be VISIBLE here, or a
 *     strand that never got a scorable response would report NOT_PROBED, which
 *     is a claim nobody tested. It reports NEEDS_MORE_INFORMATION instead —
 *     we tried, and the attempt did not produce evidence.
 */
export function rowsForStrand(results, strandId) {
  return results.filter(
    (r) => r.strand === strandId && !r.calibration && !r.invalid_flag &&
      (r.total > 0 || (r.insufficient ?? 0) > 0)
  );
}

/**
 * Compute one strand's indicator.
 *
 * @param {string} strandId
 * @param {Array} results   probe result rows
 * @param {object} [opts]
 * @param {string} [opts.stopReason] why the strand's track stopped
 * @param {string[]} [opts.dataQualityFlags]
 */
export function indicatorFor(strandId, results, opts = {}) {
  const strand = STRAND_BY_ID[strandId];
  if (!strand) throw new Error(`unknown strand: ${strandId}`);

  const rows = rowsForStrand(results, strandId);
  /**
   * av2 §1 — `items` is the PRESENTED count: everything the child was actually
   * given a chance to answer. Disengaged and unreachable items are inside the
   * visit's `total` but not inside this number, so an item that was never
   * really asked cannot dilute an accuracy. For a row with no insufficient
   * items — every row produced before av2 — presented === total, and every
   * number below is bit-for-bit what it always was.
   */
  const items = rows.reduce((s, r) => s + presentedOf(r), 0);
  const insufficient = rows.reduce((s, r) => s + (r.insufficient ?? 0), 0);
  const correct = rows.reduce((s, r) => s + (r.correct ?? 0), 0);
  const supported = rows.reduce((s, r) => s + (r.supported ?? 0), 0);
  const flags = [];

  // Dialect distance — annotation only. It NEVER changes the number.
  const dialectRows = rows.filter((r) => carriesDialectCaveat(r.dialect_distance));
  const dialectItems = dialectRows.reduce((s, r) => s + presentedOf(r), 0);
  const dialectRatio = items > 0 ? dialectItems / items : 0;
  const dialect_caveat = strand.phonological === true && dialectRatio >= INDICATOR_CONFIG.DIALECT_CAVEAT_RATIO;
  if (dialect_caveat) flags.push('DIALECT_DISTANCE');

  /**
   * FLOOR — no correct response at all.
   *
   * This must NOT be reported as a low number. With accuracy 0 the formula
   * still returns ~29 for a strand probed at rung 2, because `depth` credits
   * the rung the child was asked about and `independence` credits them for not
   * needing a hint on items they got wrong. That number looks like partial
   * knowledge and there is none. It is the same situation the existing engine
   * already handles with FLOOR_AT_STEP_1 → notDetermined, so it is handled the
   * same way here: we learned the child could not do these items, but we did
   * not establish a level.
   *
   * A floor is still a strong signal for what to teach next — see
   * learningPriorities(), which ranks floors first.
   */
  // A floor is "nothing was gotten", and a scaffolded success IS a gotten
  // thing: a child who completed three items with hints has not floored, they
  // have demonstrated with support. Counting supported answers as zero would
  // turn the scaffolding the evidence says works (D9, D10) into a failure.
  const isFloor = items >= INDICATOR_CONFIG.MIN_ITEMS_TO_REPORT && (correct + supported) === 0;

  if (items < INDICATOR_CONFIG.MIN_ITEMS_TO_REPORT || isFloor) {
    return {
      strand: strandId,
      ladder: strand.ladder,
      track: strand.track,
      code: strand.code,
      nameAr: strand.nameAr,
      nameEn: strand.nameEn,
      indicator: null,
      notMeasured: true,
      floor: isFloor,
      reason: isFloor
        ? 'FLOOR_NO_CORRECT_RESPONSE'
        : items === 0
          // Nothing scorable, but items WERE attempted: that is a request for
          // more information, not an unprobed strand (spec §4).
          ? (insufficient > 0 ? 'NEEDS_MORE_INFORMATION' : 'NOT_PROBED')
          : 'TOO_FEW_ITEMS',
      lowest_probed_rung: rows.length ? Math.min(...rows.map((r) => r.rung)) : null,
      items,
      insufficient,
      accuracy: null,
      depth: null,
      independence: null,
      support_ratio: null,
      highest_rung: null,
      confidence: 'LOW',
      dialect_caveat,
      dialect_ratio: Number(dialectRatio.toFixed(2)),
      flags,
    };
  }

  const accuracy = correct / items;
  const highestRung = Math.max(...rows.map((r) => r.rung));
  const base = baseRungOf(strand.ladder, strand.track);
  const depth = Math.min(1, Math.max(0, (highestRung - base) / heightOf(strand.ladder, strand.track)));
  const support_ratio = supported / items;
  const independence = Math.max(0, 1 - support_ratio);

  const indicator = Math.round(
    100 * (DPS_WEIGHTS.accuracy * accuracy + DPS_WEIGHTS.depth * depth + DPS_WEIGHTS.independence * independence)
  );

  // ── confidence ──────────────────────────────────────────────────────────
  const dq = opts.dataQualityFlags ?? [];
  let confidence = 'HIGH';

  if (
    items < INDICATOR_CONFIG.MIN_ITEMS_FOR_HIGH ||
    dq.includes('RAPID_RESPONDING') ||
    dq.includes('HIGH_TIMEOUT_RATE') ||
    opts.stopReason === 'SESSION_BUDGET'
  ) {
    confidence = 'LOW';
  } else if (
    dq.includes('SESSION_INTERRUPTED') ||
    dialect_caveat ||
    new Set(rows.map((r) => r.modality)).size < 2
  ) {
    confidence = 'MEDIUM';
  }

  if (opts.stopReason === 'SESSION_BUDGET') flags.push('STOPPED_ON_BUDGET');

  return {
    strand: strandId,
    ladder: strand.ladder,
    track: strand.track,
    code: strand.code,
    nameAr: strand.nameAr,
    nameEn: strand.nameEn,
    indicator,
    notMeasured: false,
    floor: false,
    reason: null,
    lowest_probed_rung: Math.min(...rows.map((r) => r.rung)),
    items,
    insufficient,
    accuracy: Number(accuracy.toFixed(3)),
    depth: Number(depth.toFixed(3)),
    independence: Number(independence.toFixed(3)),
    support_ratio: Number(support_ratio.toFixed(3)),
    highest_rung: highestRung,
    confidence,
    dialect_caveat,
    dialect_ratio: Number(dialectRatio.toFixed(2)),
    flags,
  };
}

/**
 * Score every strand touched by a probe.
 *
 * @param {object} probeState result of runProbe()
 * @param {object} [opts]
 */
export function scoreProbe(probeState, opts = {}) {
  const stopByTrack = {};
  for (const [k, t] of Object.entries(probeState.tracks ?? {})) stopByTrack[k] = t.stop_reason;

  const strandIds = [...new Set(probeState.results.map((r) => r.strand))].sort();
  const indicators = {};
  for (const id of strandIds) {
    const s = STRAND_BY_ID[id];
    indicators[id] = indicatorFor(id, probeState.results, {
      ...opts,
      stopReason: stopByTrack[`${s.ladder}:${s.track}`],
    });
  }
  return indicators;
}

/**
 * Strengths and currently-developing, from the child's OWN mean.
 *
 * Reuses the existing profile policy exactly (R-PROFILE-001…004): relative
 * index against the child's own mean, ±8 to classify, and the flat-profile
 * guard that refuses to manufacture a strength when the profile is genuinely
 * flat. Intra-individual only — IRIS never compares a child to other children.
 */
export function strandProfile(indicators) {
  const measured = Object.values(indicators).filter((i) => !i.notMeasured);
  const notMeasured = Object.values(indicators).filter((i) => i.notMeasured).map((i) => i.strand);

  if (measured.length === 0) {
    return {
      child_mean: null, relative_index: {}, classified: {},
      profile_shape: 'NOT_DETERMINED', strengths: [], developing: [],
      not_measured: notMeasured,
    };
  }

  const mean = measured.reduce((s, i) => s + i.indicator, 0) / measured.length;

  const relative_index = {};
  const classified = {};
  for (const i of measured) {
    const ri = Number((i.indicator - mean).toFixed(2));
    relative_index[i.strand] = ri;
    classified[i.strand] =
      ri >= PROFILE.DISCREPANCY ? 'STRENGTH'
      : ri <= -PROFILE.DISCREPANCY ? 'DEVELOPING'
      : 'TYPICAL_FOR_THIS_CHILD';
  }
  for (const s of notMeasured) classified[s] = 'NOT_MEASURED';

  const anyDiscrepant = Object.values(relative_index).some((ri) => Math.abs(ri) >= PROFILE.DISCREPANCY);

  const sortBy = (pred, dir) =>
    measured
      .filter((i) => pred(i))
      .sort((a, b) => dir * (relative_index[b.strand] - relative_index[a.strand]) || a.strand.localeCompare(b.strand))
      .map((i) => i.strand);

  return {
    child_mean: Number(mean.toFixed(2)),
    relative_index,
    classified,
    profile_shape: anyDiscrepant ? 'DIFFERENTIATED' : 'FLAT',
    strengths: anyDiscrepant
      ? sortBy((i) => classified[i.strand] === 'STRENGTH', 1).slice(0, PROFILE.MAX_STRENGTHS)
      : [],
    developing: anyDiscrepant
      ? sortBy((i) => classified[i.strand] === 'DEVELOPING', -1).slice(0, PROFILE.MAX_SUPPORT_AREAS)
      : [],
    not_measured: notMeasured,
    rule_ids: ['R-PROFILE-001', 'R-PROFILE-002', 'R-PROFILE-003', 'R-PROFILE-004'],
  };
}

/**
 * Next learning priorities.
 *
 * Developing strands first (most negative relative index), then any strand
 * sitting below the child's mean. Never more than three — a list of ten
 * priorities is not a list of priorities.
 *
 * A FLAT profile deliberately still yields priorities: the flat-profile guard
 * refuses to manufacture a *strength*, but a child with an even profile still
 * has a next thing to work on. That next thing is chosen by absolute level,
 * lowest first, which is the same fallback selectGoals() already uses.
 */
export function learningPriorities(indicators, profile, max = 3) {
  const all = Object.values(indicators);
  const measured = all.filter((i) => !i.notMeasured);
  const floors = all.filter((i) => i.floor);
  if (measured.length === 0 && floors.length === 0) return [];

  const seen = new Set();
  const out = [];

  const push = (strandId, reason) => {
    if (!strandId || seen.has(strandId) || out.length >= max) return;
    seen.add(strandId);
    const ind = indicators[strandId];
    out.push({
      strand: strandId,
      code: ind.code,
      nameAr: ind.nameAr,
      nameEn: ind.nameEn,
      indicator: ind.indicator, // null for a floor — the UI shows "—", not 0
      floor: !!ind.floor,
      confidence: ind.confidence,
      reason,
    });
  };

  /**
   * Rank everything that needs work in ONE ordering, most foundational first.
   *
   * Floors and low scores are ranked together rather than floors-first. Doing
   * floors first looks principled but produces a bad list: a floor at the TOP
   * of a ladder (the child mastered every rung below it and stalled at the
   * hardest one) would outrank a foundational skill the child is genuinely
   * struggling with. Observed in testing — "understanding a short story",
   * the top listening rung, outranked quantity awareness at 37.
   *
   * So the sort is:
   *   1. rung ascending      — foundational skills come first
   *   2. floor before scored — at the same rung, no correct answer is worse
   *   3. indicator ascending — then simply the weakest
   */
  const needsWork = [
    ...floors,
    ...measured.filter((i) => i.indicator < (profile.child_mean ?? Infinity)),
  ].filter((v, idx, arr) => arr.findIndex((x) => x.strand === v.strand) === idx);

  const rungOf = (i) => i.lowest_probed_rung ?? STRAND_BY_ID[i.strand]?.rung ?? 99;

  needsWork.sort((a, b) =>
    rungOf(a) - rungOf(b)
    || (b.floor ? 1 : 0) - (a.floor ? 1 : 0)
    || (a.indicator ?? -1) - (b.indicator ?? -1)
    || a.strand.localeCompare(b.strand)
  );

  for (const i of needsWork) {
    push(
      i.strand,
      i.floor ? 'FLOOR_NO_CORRECT_RESPONSE'
        : profile.developing.includes(i.strand) ? 'RELATIVE_SUPPORT_AREA'
        : profile.profile_shape === 'FLAT' ? 'FLAT_PROFILE_LOWEST_FIRST'
        : 'BELOW_OWN_MEAN'
    );
  }

  // Fallback: an even profile with nothing below the mean still needs a next
  // step, so take the lowest scores.
  for (const i of measured.slice().sort((a, b) => a.indicator - b.indicator || a.strand.localeCompare(b.strand))) {
    push(i.strand, 'LOWEST_MEASURED');
  }

  return out;
}

/** Roll strand indicators up to a domain view for the parent snapshot. */
export function domainSummary(indicators) {
  const domains = {};
  for (const i of Object.values(indicators)) {
    const key = i.ladder === 'LITERACY' && i.track === 'LISTENING' ? 'LISTENING' : i.ladder;
    if (!domains[key]) domains[key] = { domain: key, strands: [], measured: 0, mean: null };
    domains[key].strands.push(i);
    if (!i.notMeasured) domains[key].measured += 1;
  }
  for (const d of Object.values(domains)) {
    const m = d.strands.filter((s) => !s.notMeasured);
    d.mean = m.length ? Math.round(m.reduce((s, x) => s + x.indicator, 0) / m.length) : null;
    d.strands.sort((a, b) => a.code.localeCompare(b.code));
  }
  return domains;
}
