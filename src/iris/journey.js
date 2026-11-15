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
import { startProbe, PROBE_PROFILES, nextProbe, recordProbe, runProbe, stopSummary } from './engines/adaptiveProbe.js';
import { scoreProbe, strandProfile, learningPriorities, domainSummary, OUTCOME } from './engines/indicators.js';
import {
  emptyLedger, putEstimate, newEstimate, updateEstimate, getEstimate, PROVENANCE,
} from './engines/skillEstimate.js';
import { contentBlueprint, materialise } from './content/blueprint.js';
import { buildSnapshot } from './parent/snapshot.js';
import { STRAND_BY_ID, LADDER_IDS, tracksFor, baseRungOf, metaForTrack } from './ladders/index.js';

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
/**
 * ══ av2 §7 — the record envelope ═════════════════════════════════════════
 *
 * phase5-1.0.0 records stay exactly as they were; an av2 session adds the
 * transparency log (item-level observations), the visit-validity rows, and
 * the opportunity gates that closed a track BEFORE it could be offered.
 *
 * Two hard rules this section exists to keep:
 *
 *  1. The LEGACY call shape — `finaliseLadderAssessment({calibration, probe,
 *     accommodations})` — must return the byte-identical object it returns
 *     today, keys in the same order, because the payload smoke compares the
 *     batch path against what the interactive path persists. Every av2
 *     addition therefore lives in a SEPARATE `envelope` key, present only
 *     when the caller passed av2 input.
 *  2. An opportunity gate is not a score. `no_opportunity` is an OBSERVATION
 *     about what IRIS was allowed to try; it never becomes `not_demonstrated`
 *     and never moves an indicator.
 */

/** The rule pack an av2 session is scored under. */
export const AV2_RULE_PACK_VERSION = 'av2-1.0.0';
/** The rule pack everything recorded before av2 is scored under. */
export const PHASE5_RULE_PACK_VERSION = 'phase5-1.0.0';

/** Re-exported so a caller has ONE import site for the outcome vocabulary. */
export { OUTCOME };

export const OPPORTUNITY_GATE = Object.freeze({ NOT_YET: 'not_yet', OPEN: 'open' });
export const GATE_SOURCE = Object.freeze({ CAREGIVER: 'CAREGIVER_OPPORTUNITY' });

/**
 * Caregiver opportunity → ladder gating, as pure data.
 *
 * ── WHY THIS IS THE ONLY LEGITIMATE ROUTE FROM THE QUESTIONNAIRE ──────────
 * A caregiver answer is not evidence about an ability; it is evidence about
 * whether the child has had the chance. The directive's whole point (spec §0,
 * §6) is that IRIS must stop reading "has never been offered" as "cannot do".
 * So the CAREGIVER can open a track, and a caregiver answer can close one
 * ONLY in the narrow, self-doubting case the questionnaire was actually asked
 * about — and even then what is produced is an OPPORTUNITY gate that logs a
 * `no_opportunity` observation, never a score of 0 and never a floor.
 *
 * ── THE ASYMMETRY, WHICH IS DELIBERATE ────────────────────────────────────
 *   gate missing / unsure / unreadable  → OPEN.  Absence of a chance-report
 *       is not a reason to stop measuring.
 *   gate `not_yet`                      → CLOSED for the LADDER session only,
 *       while the caregiver OPT IN to keep it hidden stays honoured (the UI
 *       lane owns that opt-in; this function just reports the state).
 *
 * cv2: `rawV2.VQ13` is the letter/number chance question, worded to cover
 * BOTH symbols, so a `not_yet` there gates BOTH tracks — NUMERACY today
 * because the ladder genuinely asks for digit recognition (CAL-07/08),
 * LITERACY because the same wording covers letters, and a family that has
 * never put letters in front of the child has not had the letter chance
 * either. The child may still be PROBED there (the rung walk is unchanged);
 * what the gate changes is the priority list and the parent copy, never a
 * score.
 *
 * cv1: `responses.L7` ('not_yet_chance') is the same question in the old
 * shape, and the domain roll-up (`domainStates.L.state ===
 * 'not_yet_opportunity'`) is the same fact after scoring, so either one
 * reads as closed. Anything else — including an absent L domain — is open.
 *
 * @param {object|null|undefined} caregiverScoredOrRecord  a scored caregiver
 *        profile (cv1 or cv2), or the parsed form of either.
 * @returns {{LITERACY:string, NUMERACY:string, source:object}}
 */
export function gatesFromCaregiver(caregiverScoredOrRecord) {
  const c = caregiverScoredOrRecord ?? null;
  const closed = c != null && typeof c === 'object'
    && String(c.bankVersion ?? c.meta?.bankVersion ?? '') === 'cv2'
    ? c.rawV2?.VQ13 === 'not_yet'
    : c != null && typeof c === 'object'
      ? c.responses?.L7?.v === 'not_yet_chance'
        || c.domainStates?.L?.state === 'not_yet_opportunity'
      : false;
  const state = closed ? OPPORTUNITY_GATE.NOT_YET : OPPORTUNITY_GATE.OPEN;
  return { LITERACY: state, NUMERACY: state, source: { ...GATE_SOURCE, via: 'VQ13/L7' } };
}

/** Every track the ladder registry contains, in walk order. */
export function allTrackKeys() {
  const out = [];
  for (const ladder of LADDER_IDS) {
    for (const track of tracksFor(ladder)) out.push(`${ladder}:${track}`);
  }
  return out;
}

/**
 * The tracks an opportunity gate closes for this session.
 *
 * `allGates` is the full list, including tracks the gate says nothing about:
 * a consumer must be able to tell "gated open", "gated not yet", and "no
 * opinion here" apart, because those three read very differently to a family
 * and identically to nothing at all if they are collapsed.
 */
export function gatedTracks(gates) {
  const closed = [];
  const allGates = {};
  for (const key of allTrackKeys()) {
    const gate = gates?.[key.split(':')[0]];
    allGates[key] = { gate: gate ?? OPPORTUNITY_GATE.OPEN, declared: gate != null };
    if (gate === OPPORTUNITY_GATE.NOT_YET) closed.push(key);
  }
  return { closed, allGates };
}

/**
 * One domain-level observation per track that never opened (spec §7 W5).
 *
 * Written at the rung the walk WOULD have started from, and carrying
 * `no_opportunity` — the outcome the scoring layer excludes from every
 * denominator by construction. This row is the audit trail for a question a
 * parent will ask: "did you try?" The honest answer is "no, and here is
 * who said not yet".
 */
export function gatingObservations(closedKeys, { at = null, source = null } = {}) {
  return closedKeys.map((trackKey) => {
    const [ladder, track] = trackKey.split(':');
    const meta = metaForTrack(ladder, track);
    return {
      strand: `${ladder}:${track}`,
      ladder,
      track,
      rung: baseRungOf(ladder, track),
      outcome: 'no_opportunity',
      target_skill: null,
      template_id: null,
      mode: 'domain_gate',
      reason: meta?.gate_reason ?? 'NOT_YET_REPORTED_BY_CAREGIVER',
      source: source ?? GATE_SOURCE,
      at,
    };
  });
}

/**
 * Flag the probe rows that belong to an invalid visit.
 *
 * Pairing is positional against the visit log, because the log is written one
 * row per visit in the same order the engine appended its rows — and it only
 * pairs at all when the two really do line up (same number of visits). When a
 * producer never recorded a row for an invalid visit, there is nothing to
 * exclude and nothing is invented. The incoming rows are COPIED: the caller's
 * state object is never mutated here.
 */
function withoutInvalidVisits(probe, visitValidity) {
  const rows = probe?.results ?? [];
  const log = visitValidity ?? [];
  if (!log.length || log.length !== rows.length) return probe;
  const isInvalid = (v) => v != null && (v === 'invalid' || v === 'invalid_administration');
  let flagged = false;
  const results = rows.map((r, i) => {
    if (!isInvalid(log[i]?.valid)) return r;
    flagged = true;
    return { ...r, invalid_flag: true };
  });
  if (!flagged) return probe;
  return { ...probe, results };
}

/**
 * Group the observation log by SKILL, not by number.
 *
 * Spec §8 asks for home-vs-screen comparisons per skill family. Counting the
 * six outcomes is a COUNT of categories, not an average of two instruments —
 * no numeric from either source crosses into the other.
 */
export function observationSkillIndex(observations) {
  const bySkill = {};
  for (const o of observations ?? []) {
    const id = o?.target_skill ?? o?.strand ?? o?.track ?? 'unknown';
    (bySkill[id] ??= { target_skill: id, outcomes: {}, strands: [] }).outcomes[o.outcome] =
      ((bySkill[id].outcomes[o.outcome] ?? 0) + 1);
    if (o.strand && !bySkill[id].strands.includes(o.strand)) bySkill[id].strands.push(o.strand);
  }
  return bySkill;
}

/**
 * The §7 envelope. Present ONLY when the caller handed av2 input, so the
 * legacy object never grows a key by accident.
 */
function buildEnvelope({ caregiverRef, opportunityGates, visitValidity, observations, probe }) {
  const items = probe?.results ?? [];
  return {
    bankVersion: 'av2',
    rule_pack_version: AV2_RULE_PACK_VERSION,
    caregiverRef: caregiverRef ?? null,
    opportunityGates: opportunityGates ?? null,
    visitValidity: visitValidity ?? [],
    observations: observations ?? [],
    // Counted, never averaged: what the log actually contains.
    outcomes: OUTCOME.map((o) => ({ outcome: o, items: items.filter((r) => r.outcome === o).length })),
  };
}

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
export function finaliseLadderAssessment({
  calibration,
  probe,
  accommodations = [],
  observations = null,
  opportunityGates = null,
  visitValidity = null,
  caregiverRef = null,
}) {
  /**
   * av2 is a SHAPE, not a flag: it exists exactly when the caller handed
   * something the pre-av2 call could not — an observation log, a gate set, a
   * visit-validity log, or a reference to the caregiver record that produced
   * them. Anything else runs the untouched path and gets the untouched
   * object, keys in the untouched order.
   */
  const av2 = observations != null || opportunityGates != null
    || visitValidity != null || caregiverRef != null;

  /*
   * §1.6 first, everything else after: a visit that was not administered as
   * specified is not evidence, and an estimate that moved on it cannot be
   * moved back. The rows stay in the record — flagged, never deleted, because
   * "we threw away four visits" is information a family is owed — but
   * indicators and the ledger read the flagged-out set.
   */
  const scored = av2 ? withoutInvalidVisits(probe, visitValidity) : probe;
  const indicators = scoreProbe(scored);
  const profile = strandProfile(indicators);
  const priorities = learningPriorities(indicators, profile);
  const domains = domainSummary(indicators);

  // Seed the ledger from the probe. Calibration placed the child; the probe is
  // the first real evidence, so provenance moves CALIBRATED → OBSERVED here.
  let ledger = emptyLedger();
  for (const row of scored.results) {
    // §1.6 again, on the other half of the maths: an invalid visit is kept in
    // the record and flagged, and takes no part in an estimate.
    if (av2 && row.invalid_flag) continue;
    let est = getEstimate(ledger, row.strand);
    if (!est) {
      est = newEstimate({ strandId: row.strand, rung: row.rung, provenance: PROVENANCE.CALIBRATED });
    }
    est = updateEstimate(est, {
      rung: row.rung,
      correct: row.correct,
      total: row.total,
      // av2: real support, and the items that never reached an answer. Both
      // default to 0 inside recordObservation for a row that carries neither,
      // which is why a legacy trace lands on exactly the numbers it did.
      supported: row.supported,
      insufficient: row.insufficient,
      modality: row.modality,
      dialect_distance: row.dialect_distance,
      session_id: 'ASSESSMENT',
    });
    ledger = putEstimate(ledger, est);
  }

  const result = {
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
  if (!av2) return result;   // byte-identical to the pre-av2 object

  return {
    ...result,
    // The rows the scoring actually used, with the invalid visits flagged.
    probe: scored,
    envelope: buildEnvelope({
      caregiverRef, opportunityGates, visitValidity, observations, probe: scored,
    }),
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
  const av2 = itemResults.bankVersion === 'av2';
  // Defaults are applied on the way IN so an old row that never carried the
  // av2 fields still replays through the same maths as the row beside it.
  const results = (Array.isArray(itemResults.probe) ? itemResults.probe : [])
    .map((r) => (r.supported == null || r.insufficient == null
      ? { supported: 0, insufficient: 0, ...r }
      : r));
  const probeState = { results, tracks: {}, finished: true };
  const indicators = scoreProbe(probeState);
  const profile = strandProfile(indicators);
  const priorities = learningPriorities(indicators, profile);
  const domains = domainSummary(indicators);
  const estimates = record.skill_estimates ?? {};

  /**
   * The ledger is REPLAYED from the stored evidence rows for an av2 record
   * rather than lifted out of `skill_estimates`.
   *
   * Not because the stored estimates cannot be trusted — they were produced
   * by this same engine — but because a reload that only re-reads a table of
   * numbers is a reload of a PICTURE, and the thing the family needs to be
   * able to ask is what the engine concludes now that the supported/
   * insufficient rows are in it. Invalid-visit rows are skipped exactly as
   * they were on the way in (§1.6), so the reload cannot quietly re-count
   * them. A phase5-1.0.0 record still gets its stored estimates verbatim:
   * there is nothing new in the rows to re-derive from, and replacing an
   * untouched legacy path with a replay is how a migration breaks one.
   */
  let ledger = { ...emptyLedger(), estimates };
  if (av2) {
    ledger = emptyLedger();
    for (const row of results) {
      if (row.invalid_flag) continue;
      let est = getEstimate(ledger, row.strand);
      if (!est) est = newEstimate({ strandId: row.strand, rung: row.rung, provenance: PROVENANCE.CALIBRATED });
      est = updateEstimate(est, {
        rung: row.rung,
        correct: row.correct ?? 0,
        total: row.total ?? 0,
        supported: row.supported ?? 0,
        insufficient: row.insufficient ?? 0,
        modality: row.modality ?? null,
        dialect_distance: row.dialect_distance ?? 'UNKNOWN',
        session_id: 'ASSESSMENT',
      });
      ledger = putEstimate(ledger, est);
    }
  }
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
    // av2 only. The envelope comes back as it went down, so a re-finalise of
    // a hydrated assessment reproduces the same record — the loop test in
    // tests/iris.av2.test.js depends on that being true, not approximately.
    ...(av2 ? {
      observations: itemResults.observations ?? [],
      opportunityGates: itemResults.opportunityGates ?? null,
      visitValidity: itemResults.visitValidity ?? [],
      caregiverRef: itemResults.caregiverRef ?? null,
      envelope: buildEnvelope({
        caregiverRef: itemResults.caregiverRef ?? null,
        opportunityGates: itemResults.opportunityGates ?? null,
        visitValidity: itemResults.visitValidity ?? [],
        observations: itemResults.observations ?? [],
        probe: probeState,
      }),
    } : {}),
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
  // Data quality, stated rather than implied: rows the scoring refused to use
  // are visible here, so a report can never look cleaner than the session was.
  for (const r of assessment.probe?.results ?? []) {
    if (r.invalid_flag) { flags.add('VISIT_INVALID_ADMINISTRATION'); break; }
  }

  const envelope = assessment.envelope ?? null;
  const av2 = envelope?.bankVersion === 'av2';
  const gates = envelope?.opportunityGates ?? null;
  const caregiverRef = envelope?.caregiverRef ?? null;

  /**
   * The §7 payload. `bankVersion` is the discriminator the server switches on,
   * so it goes FIRST: a record whose envelope is present but unmarked would
   * be read as a phase5 record and its observation log ignored, which is the
   * opposite of transparency.
   *
   * `caregiverRef` is the family's pointer to the questionnaire that opened or
   * held a gate. It is kept as its own key inside opportunityGates (where it
   * belongs semantically) and repeated at item_results level (where the reload
   * path and the server's tolerance check both look for it); the two are the
   * same value, never two values.
   */
  const item_results = av2
    ? {
      bankVersion: 'av2',
      calibration: assessment.calibration.entry_rungs,
      probe: assessment.probe.results,
      observations: envelope.observations ?? [],
      opportunityGates: gates == null ? null : { ...gates, ...(caregiverRef ? { caregiverRef } : {}) },
      visitValidity: envelope.visitValidity ?? [],
      ...(caregiverRef ? { caregiverRef } : {}),
    }
    : {
      calibration: assessment.calibration.entry_rungs,
      probe: assessment.probe.results,
    };

  return {
    domain_scores,
    data_quality_flags: [...flags],
    accommodations_used: assessment.accommodations_used,
    item_results,
    skill_estimates: assessment.ledger.estimates,
    learning_priorities: assessment.priorities.map((p) => p.strand),
    confidence: Object.fromEntries(
      Object.entries(assessment.indicators).map(([k, v]) => [k, v.confidence])
    ),
    // A phase5-1.0.0 record keeps its old stamp forever: the engine that
    // scores it must be the engine that scored it. av2 records are stamped
    // with the av2 pack, which is what makes a reload know it has supported
    // and insufficient rows to read.
    rule_pack_version: av2 ? AV2_RULE_PACK_VERSION : PHASE5_RULE_PACK_VERSION,
  };
}

export {
  TASKS, GOAL_BY_ID, isMastered, classifyBand, filterAccommodationsForTask,
  // Phase 5 pieces, re-exported so callers have one import site.
  runCalibration, startProbe, PROBE_PROFILES, nextProbe, recordProbe, stopSummary,
  scoreProbe, strandProfile, learningPriorities, domainSummary,
  emptyLedger, getEstimate, STRAND_BY_ID,
};
