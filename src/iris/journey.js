/**
 * IRIS — Journey orchestrator.
 *
 * Wires the engines into the end-to-end flow:
 *
 *   Child Profile → Assessment → Performance/DPS → Band → Learning Goal
 *     → Adaptive Pathway → Next Activity → Session Result → Progress
 *
 * ── DIAGNOSIS HANDLING ────────────────────────────────────────────────────
 * `condition` enters this module at EXACTLY ONE point: accommodationDefaults()
 * which returns ACCESS supports (extra time, audio repeat, reduced animation)
 * per doc 11 §1. That value is passed to the assessment presentation layer and
 * is never forwarded to scoring, profiling, goal selection, or the pathway.
 * Every engine call below is made without it.
 * ──────────────────────────────────────────────────────────────────────────
 */
import { ACCOMMODATION_DEFAULTS } from './spec.js';
import { scoreAssessment, TASKS, filterAccommodationsForTask } from './engines/assessment.js';
import { buildProfile } from './engines/profile.js';
import { selectGoals, GOAL_BY_ID, isMastered } from './engines/goals.js';
import { decideNext, summariseSession, classifyBand } from './engines/pathway.js';
import { templateForGoalLevel } from './content/templates.js';
import { generateActivity } from './content/generator.js';
import { progressSnapshot, reassessmentTriggers } from './engines/progress.js';

// ── Phase 5: the ladder assessment ────────────────────────────────────────
import { runCalibration, calibrationProbesFor } from './engines/calibration.js';
import { startProbe, nextProbe, recordProbe, runProbe, stopSummary } from './engines/adaptiveProbe.js';
import { scoreProbe, strandProfile, learningPriorities, domainSummary } from './engines/indicators.js';
import {
  emptyLedger, putEstimate, newEstimate, updateEstimate, getEstimate, PROVENANCE,
} from './engines/skillEstimate.js';
import { contentBlueprint, materialise } from './content/blueprint.js';
import { buildSnapshot } from './parent/snapshot.js';
import { STRAND_BY_ID } from './ladders/index.js';

/**
 * The ONLY diagnosis-reading function in IRIS.
 * Returns ACCESS accommodations only. Parent-visible, parent-overridable.
 * Doc 11 §1 explicitly permits this and forbids anything further.
 */
export function accommodationDefaults(condition) {
  const key = String(condition || '').toUpperCase().replace(/[- ]/g, '_');
  const list = ACCOMMODATION_DEFAULTS[key] || ACCOMMODATION_DEFAULTS.OTHER;
  return {
    accommodations: [...list],
    parent_overridable: true,
    affects: 'PRESENTATION_AND_TIMING_ONLY',
    never_affects: ['scoring', 'item_selection', 'difficulty', 'level', 'goal_selection', 'pathway'],
    source: 'doc 11 §1 [B] engineering assumption',
  };
}

/** Step 1–3: score the assessment and build the profile. */
export function runAssessment({ itemResultsBySubMeasure, accommodationsUsed = [], interruptionCount = 0 }) {
  const scored = scoreAssessment({ itemResultsBySubMeasure, accommodationsUsed, interruptionCount });

  const scoreableCounts = Object.values(scored.per_sub_measure)
    .map((s) => s.flags?.includes('INSUFFICIENT_ITEMS') ? 0 : null)
    .filter((v) => v !== null);

  const profile = buildProfile({
    domain_scores: scored.domain_scores,
    data_quality_flags: scored.data_quality_flags,
    interruption_count: interruptionCount,
    min_scoreable_items: scoreableCounts.length ? Math.min(...scoreableCounts) : null,
  });

  return { assessment: scored, profile };
}

/** Step 4–5: choose goals and place the child. */
export function planGoals({ profile, parentPriorityGoalId = null }) {
  const { assignments, excluded, rule_ids } = selectGoals({ profile, parentPriorityGoalId });
  const enriched = assignments.map((a) => {
    const tpl = templateForGoalLevel(a.goal_id, a.level);
    return { ...a, template_id: tpl?.id ?? null, consecutive_repeats: 0 };
  });
  return { assignments: enriched, excluded, rule_ids };
}

/** Step 6–7: produce the next activity for an assignment. */
export function nextActivity({ assignment, decision = null, accommodations = [], interestTheme = null, variantSeed = 'v1' }) {
  const goalId = decision?.to_goal_id ?? assignment.goal_id;
  const level = decision?.to_level ?? assignment.level;
  const templateId = decision?.to_template_id ?? assignment.template_id ?? templateForGoalLevel(goalId, level)?.id;
  const scaffolds = decision?.scaffold_flags ?? [];
  const factor = decision?.item_count_factor ?? 1;

  const constraints = {
    goal_id: goalId,
    level,
    template_id: templateId,
    item_count: Math.max(1, Math.round(6 * factor)),
    scaffold_flags: scaffolds,
    accommodations,
    wm_load_cap: 'HIGH',
    interest_theme: interestTheme,
    variant_seed: variantSeed,
  };

  const activity = generateActivity(constraints);
  return { constraints, activity };
}

/** Step 8–9: record a finished session and decide what comes next. */
export function completeSession({
  assignment, sessionItems, completion_status = 'COMPLETE', duration_ms = 0,
  sessions = [], confidence = 'HIGH', at = null,
}) {
  const summary = summariseSession({ items: sessionItems, completion_status, duration_ms });

  const record = {
    goal_id: assignment.goal_id,
    level: assignment.level,
    template_id: assignment.template_id,
    ...summary,
    at,
    is_synthetic: assignment.is_synthetic ?? false,
  };

  const history = [...sessions, record];

  const decision = decideNext({
    goal_id: assignment.goal_id,
    level: assignment.level,
    template_id: assignment.template_id,
    sessions: history,
    lastSession: record,
    confidence,
    consecutive_repeats: assignment.consecutive_repeats ?? 0,
  });

  record.decision = decision;

  const nextAssignment = {
    goal_id: decision.to_goal_id,
    level: decision.to_level,
    template_id: decision.to_template_id,
    consecutive_repeats: decision.consecutive_repeats,
    is_synthetic: assignment.is_synthetic ?? false,
  };

  return { session: record, decision, history, nextAssignment };
}

/** Step 10: progress view. */
export function buildProgress({ sessions, goalIds, daysSinceAssessment = 0, notDetermined = [] }) {
  return {
    per_goal: goalIds.map((g) => progressSnapshot(sessions, g)),
    reassessment: reassessmentTriggers({
      sessions,
      daysSinceAssessment,
      notDeterminedSubMeasures: notDetermined,
      daysSinceProfile: daysSinceAssessment,
    }),
  };
}

// ══════════════════════════════════════════════════════════════════════════
//  PHASE 5 — the research-informed adaptive assessment, end to end.
//
//  Child profile → age hint → calibration → adaptive probe → indicators →
//  skill estimates → learning priorities → content blueprint → practice →
//  new observation → updated estimate.
//
//  ── WHERE THE DIAGNOSIS GOES ─────────────────────────────────────────────
//  Exactly where it went before: accommodationDefaults(), and nowhere else.
//  Read the signatures below — runLadderAssessment() takes `ageYears` and
//  `accommodations`, and there is no parameter through which a diagnosis
//  could reach placement, scoring, priorities or content. That is the
//  approved BLIND PLACEMENT decision, expressed as an absence rather than a
//  check.
//
//  ── WHERE THE AGE GOES ───────────────────────────────────────────────────
//  Into calibrationProbesFor() only, which uses it to FILTER the probe set.
//  entryRungsFrom() — the function that decides where the child starts — does
//  not take it. Age can shorten the probe set for a very young child; it has
//  no channel through which to raise a rung.
// ══════════════════════════════════════════════════════════════════════════

/** The probe set to present. Age filters it; nothing else touches it. */
export function ladderCalibrationProbes({ ageYears = null } = {}) {
  return calibrationProbesFor({ ageYears });
}

/**
 * Stage 1 + 2: calibrate, then probe adaptively.
 *
 * @param {object} input
 * @param {number|null} [input.ageYears]
 * @param {Array} input.calibrationResponses  [{probe_id, is_correct}]
 * @param {Function} input.respond            (visit) => {correct,total,supported?,modality?,dialect_distance?}
 * @param {string[]} [input.accommodations]   ACCESS codes; presentation only
 */
export function runLadderAssessment({
  ageYears = null,
  calibrationResponses = [],
  respond,
  accommodations = [],
}) {
  const calibration = runCalibration({ ageYears, responses: calibrationResponses });
  const probe = runProbe(calibration, respond);
  return finaliseLadderAssessment({ calibration, probe, accommodations });
}

/**
 * Turn a finished calibration + probe into the full result.
 *
 * Split out from runLadderAssessment so the UI, which drives the probe one
 * visit at a time, produces exactly the same result object as the batch path
 * the tests use. Two code paths producing two shapes is how a UI quietly
 * diverges from what was tested.
 */
export function finaliseLadderAssessment({ calibration, probe, accommodations = [] }) {
  const indicators = scoreProbe(probe);
  const profile = strandProfile(indicators);
  const priorities = learningPriorities(indicators, profile);
  const domains = domainSummary(indicators);

  // Seed the ledger from the probe. Calibration placed the child; the probe is
  // the first real evidence, so provenance moves CALIBRATED → OBSERVED here.
  let ledger = emptyLedger();
  for (const row of probe.results) {
    let est = getEstimate(ledger, row.strand);
    if (!est) {
      est = newEstimate({ strandId: row.strand, rung: row.rung, provenance: PROVENANCE.CALIBRATED });
    }
    est = updateEstimate(est, {
      rung: row.rung,
      correct: row.correct,
      total: row.total,
      supported: row.supported,
      modality: row.modality,
      dialect_distance: row.dialect_distance,
      session_id: 'ASSESSMENT',
    });
    ledger = putEstimate(ledger, est);
  }

  return {
    calibration,
    probe,
    stops: stopSummary(probe),
    indicators,
    profile,
    priorities,
    domains,
    ledger,
    accommodations_used: [...accommodations],
    items_presented: probe.items_used,
  };
}

/**
 * Stage 2b: rebuild a finished assessment from its stored record.
 *
 * The GET /api/assessments/:childId rows carry every input the scoring layer
 * consumed (probe results, calibration entry rungs, ledger estimates), so the
 * snapshot after a reload is *derived by the same engine* — not a cached
 * picture. Where a field is genuinely absent from the record (per-track stop
 * reasons) we degrade honestly: indicator VALUES are unaffected because they
 * come from the evidence rows themselves; only the per-indicator stop flag is
 * omitted, and the record's global data_quality_flags still describe it.
 *
 * @param {object} record parsed row from GET /api/assessments/:childId
 * @returns assessment object shaped like finaliseLadderAssessment's output
 */
export function fromAssessmentRecord(record) {
  const itemResults = record.item_results ?? {};
  const results = Array.isArray(itemResults.probe) ? itemResults.probe : [];
  const probeState = { results, tracks: {}, finished: true };
  const indicators = scoreProbe(probeState);
  const profile = strandProfile(indicators);
  const priorities = learningPriorities(indicators, profile);
  const domains = domainSummary(indicators);
  const estimates = record.skill_estimates ?? {};
  const ledger = { ...emptyLedger(), estimates };
  return {
    calibration: itemResults.calibration ?? {},
    probe: probeState,
    stops: {},
    indicators,
    profile,
    priorities,
    domains,
    ledger,
    accommodations_used: record.accommodations_used ?? [],
    data_quality_flags: record.data_quality_flags ?? [],
    items_presented: results.reduce((n, r) => n + (r.total ?? 0), 0),
    status: record.status ?? 'COMPLETE',
    record_id: record.id ?? null,
    restored: true,
  };
}

/** Stage 3: what the child should practise next, and the concrete items. */
export function planLadderContent({
  assessment, accommodations = [], recentTemplates = [], interestTheme = null, seed = 1,
}) {
  const blueprint = contentBlueprint({
    indicators: assessment.indicators,
    profile: assessment.profile,
    priorities: assessment.priorities,
    ledger: assessment.ledger,
    accommodations,
    recentTemplates,
    interestTheme,
  });
  return {
    blueprint,
    activities: blueprint.activities.map((a) => materialise(a, { seed })),
  };
}

/**
 * Stage 4: fold a completed practice session back into the ledger.
 *
 * This is the step that closes the loop. Without it the assessment would be a
 * one-off results page, which §19 of the brief explicitly rules out.
 */
export function recordPracticeSession({ ledger, strand, rung, correct, total, supported = 0, modality = null, at = null, sessionId = null }) {
  let est = getEstimate(ledger, strand);
  if (!est) est = newEstimate({ strandId: strand, rung, provenance: PROVENANCE.OBSERVED, at });
  const updated = updateEstimate(est, {
    rung, correct, total, supported, modality, at, session_id: sessionId,
  });
  return { ledger: putEstimate(ledger, updated), estimate: updated, move: updated.last_move };
}

/** Stage 5: the parent-facing snapshot. */
export function ladderSnapshot(assessment, { childName = null } = {}) {
  return buildSnapshot({
    indicators: assessment.indicators,
    profile: assessment.profile,
    priorities: assessment.priorities,
    domains: assessment.domains,
    childName,
  });
}

/**
 * A serialisable record for the database. Shapes match the existing
 * AssessmentRecord columns so persistence reuses the model it already has.
 */
export function toAssessmentRecord(assessment) {
  const domain_scores = {};
  for (const [k, v] of Object.entries(assessment.indicators)) domain_scores[k] = v.indicator;

  const flags = new Set();
  for (const v of Object.values(assessment.indicators)) v.flags.forEach((f) => flags.add(f));
  for (const s of Object.values(assessment.stops)) if (s.stop_reason) flags.add(`STOP_${s.stop_reason}`);

  return {
    domain_scores,
    data_quality_flags: [...flags],
    accommodations_used: assessment.accommodations_used,
    item_results: {
      calibration: assessment.calibration.entry_rungs,
      probe: assessment.probe.results,
    },
    skill_estimates: assessment.ledger.estimates,
    learning_priorities: assessment.priorities.map((p) => p.strand),
    confidence: Object.fromEntries(
      Object.entries(assessment.indicators).map(([k, v]) => [k, v.confidence])
    ),
    rule_pack_version: 'phase5-1.0.0',
  };
}

export {
  TASKS, GOAL_BY_ID, isMastered, classifyBand, filterAccommodationsForTask,
  // Phase 5 pieces, re-exported so callers have one import site.
  runCalibration, startProbe, nextProbe, recordProbe, stopSummary,
  scoreProbe, strandProfile, learningPriorities, domainSummary,
  emptyLedger, getEstimate, STRAND_BY_ID,
};
