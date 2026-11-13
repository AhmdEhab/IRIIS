/**
 * IRIS — Stage 2: the adaptive probe (Phase 5).
 *
 * Walks each ladder track from its calibration entry rung, choosing the next
 * strand to probe from what the child has actually done.
 *
 * ── THIS IS NOT A COMPUTERISED ADAPTIVE TEST ──────────────────────────────
 * IRIS has an uncalibrated item bank. There is no item response theory here,
 * no ability estimate, no standard error, no maximum-information item
 * selection (matrix F1). This is a RULE-BASED adaptive probe, and the product
 * must never describe it as anything more.
 *
 * ── THE ROUTING RULE ──────────────────────────────────────────────────────
 *   at a rung, present k items:
 *     >= 2 of 3 correct  →  climb
 *      1 of 3 correct    →  hold, present the paired modality
 *      0 of 3 correct    →  step down; if at base, try the pair once, then stop
 *
 * `k = 3` and the 2/1/0 split come from ESTIMATE_CONFIG's accuracy thresholds
 * so there is one adaptation policy in the product, not two.
 *
 * ── STOPPING ──────────────────────────────────────────────────────────────
 * A track stops when it runs out of ladder, scores zero on two consecutive
 * rungs, spends its item budget, or the session budget runs out.
 *
 * ⚠ THE CONSECUTIVE-ERROR COUNT IS A CONVENTION, NOT A FINDING. Matrix F2:
 * the Springer reference chapter states test publishers "do not publish
 * details regarding the development of their basal and ceiling rules", and
 * published instruments use 3, 5 and 6. IRIS's pre-existing value of 2
 * (ASSESSMENT_CONFIG.DISCONTINUE_AFTER_CONSECUTIVE_WRONG) is at the aggressive
 * end. The new ladders use 3 — see PROBE_CONFIG.STOP_AFTER_EMPTY_RUNGS — and
 * the old value is left alone so no existing behaviour changes.
 *
 * ── DIAGNOSIS-BLINDNESS ───────────────────────────────────────────────────
 * No `condition` parameter. Accommodations arrive as an explicit array of
 * ACCESS codes and affect presentation and timing only — they never change
 * which strand is probed, which rung, or how a response is scored.
 */
import { VALIDATION } from '../spec.js';
import {
  STRAND_BY_ID, strandsAtRung, nextRung, prevRung, baseRungOf, tracksFor,
} from '../ladders/index.js';
import { ESTIMATE_CONFIG } from './skillEstimate.js';
import { CALIBRATION_PROBES } from './calibration.js';

export const PROBE_CONFIG = {
  /** Items presented per strand visit. F3: PROMIS uses a 4–5 item minimum. */
  ITEMS_PER_VISIT: 3,
  /** Consecutive all-wrong rungs that end a track. See the header warning. */
  STOP_AFTER_EMPTY_RUNGS: 2,
  /** Hard ceiling on strand visits per track, so one track cannot eat the session. */
  MAX_VISITS_PER_TRACK: 8,
  /**
   * Whole-session item budget. ~10–20 minutes of ~2-minute probes (F5).
   *
   * ⚠ ENGINEERING_ASSUMPTION. Matrix F6 found no usable fatigue evidence for
   * this population — in the one study retrieved, 6.5-hour paediatric
   * assessments showed no significant length-fatigue relationship. This target
   * is a design and engagement choice and must never be called evidence-based.
   */
  SESSION_ITEM_BUDGET: 60,
  _validation: VALIDATION.ENGINEERING_ASSUMPTION,
  _source: 'ASSESSMENT_RESEARCH_MATRIX.md §8 and F2/F6',
};

export const PROBE_STOP = {
  LADDER_TOP: 'LADDER_TOP',
  EMPTY_RUNGS: 'EMPTY_RUNGS',
  TRACK_VISIT_CAP: 'TRACK_VISIT_CAP',
  SESSION_BUDGET: 'SESSION_BUDGET',
  BASE_FLOOR: 'BASE_FLOOR',
  EXHAUSTED: 'EXHAUSTED',
};

/**
 * Strands the child already answered correctly during calibration.
 *
 * These are the rescue list: a track must not stop before probing a strand
 * calibration has already shown the child can do. Without this, a child who
 * fails quantity at the base but HAS cardinality would have the track closed
 * underneath them and cardinality would never be measured — the exact failure
 * matrix C1 and D10 warn about, where a group difference in counting did not
 * carry over to cardinality at all.
 */
function calibrationCorrectStrands(calibration) {
  // ONLY strands the child answered correctly. Deliberately NOT
  // `opening_strands`, which is merely the set probed first — including those
  // would resurrect strands the child is currently failing and would stop a
  // track from ever descending.
  if (Array.isArray(calibration.correct_strands)) return new Set(calibration.correct_strands);

  // Older calibration objects: fall back to the single highest correct probe
  // per track, which is the only correctness signal they carry.
  const correct = new Set();
  for (const v of Object.values(calibration.entry_rungs ?? {})) {
    if (!v.from_probe) continue;
    const probe = CALIBRATION_PROBES.find((p) => p.id === v.from_probe);
    if (probe) correct.add(probe.strand);
  }
  return correct;
}

/** Fresh probe state from a calibration result. */
export function startProbe(calibration) {
  const rescue = calibrationCorrectStrands(calibration);
  const tracks = {};
  for (const key of Object.keys(calibration.entry_rungs)) {
    const { ladder, track, rung } = calibration.entry_rungs[key];
    tracks[key] = {
      rescue: [...rescue].filter((id) => {
        const s = STRAND_BY_ID[id];
        return s && s.ladder === ladder && s.track === track;
      }),
      ladder,
      track,
      rung,
      entry_rung: rung,
      visited: [],          // strand ids already probed at their rung
      empty_rungs: 0,
      visits: 0,
      modality_tried: {},   // strandId -> true once the paired modality was used
      resampled: {},        // strandId -> true once a second sample was taken
      done: false,
      stop_reason: null,
    };
  }
  return {
    tracks,
    items_used: 0,
    results: [],            // one row per strand visit
    finished: false,
  };
}

/**
 * Move a track to a rung and make that rung probeable again.
 *
 * Clearing the rung's `visited` entries matters: a track that climbed through
 * a rung and later steps back down onto it would otherwise find every strand
 * there already marked visited, have nothing to probe, and be silently
 * abandoned with no stop reason — a dead track that reports nothing rather
 * than an honest floor.
 */
function moveTo(t, rung) {
  t.rung = rung;
  t.visited = t.visited.filter((v) => STRAND_BY_ID[v]?.rung !== rung);
}

/**
 * Strands still worth probing at a track's current rung.
 * All parallel strands at the rung are returned — none gates another.
 */
function pendingAtRung(t) {
  return strandsAtRung(t.ladder, t.track, t.rung)
    .filter((s) => !t.visited.includes(s.id))
    .map((s) => s.id);
}

/**
 * The next strand to probe, or null when the session is finished.
 *
 * Tracks are visited round-robin so a child does not spend twelve minutes on
 * letters before touching numbers — and so a session that runs out of budget
 * still has something to say about every domain.
 */
export function nextProbe(state) {
  if (state.finished) return null;
  if (state.items_used >= PROBE_CONFIG.SESSION_ITEM_BUDGET) return null;

  const keys = Object.keys(state.tracks).sort();
  // Round-robin: fewest visits first, ties broken by track name.
  const open = keys
    .map((k) => state.tracks[k])
    .filter((t) => !t.done)
    .sort((a, b) => a.visits - b.visits || `${a.ladder}:${a.track}`.localeCompare(`${b.ladder}:${b.track}`));

  for (const t of open) {
    const pending = pendingAtRung(t);
    if (pending.length === 0) continue; // nothing left here; advance() will move it
    const strandId = pending[0];
    const strand = STRAND_BY_ID[strandId];
    return {
      track_key: `${t.ladder}:${t.track}`,
      strand: strandId,
      ladder: t.ladder,
      track: t.track,
      rung: t.rung,
      item_count: PROBE_CONFIG.ITEMS_PER_VISIT,
      template: strand.templates?.[0] ?? null,
      use_modality_pair: !!t.modality_tried[strandId],
    };
  }
  return null;
}

/**
 * Record the result of a probe visit and move the track.
 *
 * @param {object} state
 * @param {object} visit   the object returned by nextProbe()
 * @param {object} result  { correct, total, supported?, modality?, dialect_distance? }
 */
export function recordProbe(state, visit, result) {
  const key = visit.track_key;
  const t = { ...state.tracks[key] };
  const correct = result.correct ?? 0;
  const total = result.total ?? visit.item_count;

  const row = {
    strand: visit.strand,
    ladder: visit.ladder,
    track: visit.track,
    rung: visit.rung,
    correct,
    total,
    supported: result.supported ?? 0,
    modality: result.modality ?? visit.template,
    dialect_distance: result.dialect_distance ?? 'UNKNOWN',
    used_modality_pair: !!visit.use_modality_pair,
  };

  t.visited = [...t.visited, visit.strand];
  t.visits += 1;

  const accuracy = total > 0 ? correct / total : 0;
  const stillPending = pendingAtRung(t).length > 0;

  // 'COLLECTING_RUNG' means parallel strands at this rung are still pending.
  // The rung decision waits until they have all been seen, so one weak
  // parallel strand cannot sink a rung the child has otherwise demonstrated.
  let move = 'COLLECTING_RUNG';

  if (!stillPending) {
    // Every parallel strand at this rung has now been probed. Decide by the
    // rung's combined evidence, so one weak parallel strand cannot sink a rung
    // the child has otherwise shown.
    const rungRows = [...state.results, row].filter(
      (r) => r.ladder === t.ladder && r.track === t.track && r.rung === t.rung
    );
    const rungTotal = rungRows.reduce((s, r) => s + r.total, 0);
    const rungCorrect = rungRows.reduce((s, r) => s + r.correct, 0);
    const rungAcc = rungTotal > 0 ? rungCorrect / rungTotal : 0;

    if (rungAcc >= ESTIMATE_CONFIG.CLIMB_AT_ACCURACY * 0.75) {
      // 0.6 of the rung correct is enough to look higher. Deliberately lower
      // than the mastery threshold: the probe is looking for a ceiling, not
      // certifying mastery. Mastery is decided later, by skillEstimate.
      const up = nextRung(t.ladder, t.track, t.rung);
      if (up == null) { t.done = true; t.stop_reason = PROBE_STOP.LADDER_TOP; move = 'STOP_LADDER_TOP'; }
      else { moveTo(t, up); t.empty_rungs = 0; move = 'CLIMB'; }
    } else if (rungAcc <= 0) {
      t.empty_rungs += 1;
      if (t.empty_rungs >= PROBE_CONFIG.STOP_AFTER_EMPTY_RUNGS) {
        t.done = true; t.stop_reason = PROBE_STOP.EMPTY_RUNGS; move = 'STOP_EMPTY_RUNGS';
      } else {
        const down = prevRung(t.ladder, t.track, t.rung);
        if (down == null) {
          // Already at the base. Try the paired modality once before giving up
          // — matrix E3: the same skill can be reachable by another route.
          const untried = strandsAtRung(t.ladder, t.track, t.rung)
            .find((s) => s.modality_pair && !t.modality_tried[s.id]);
          if (untried) {
            t.modality_tried = { ...t.modality_tried, [untried.id]: true };
            t.visited = t.visited.filter((v) => v !== untried.id);
            move = 'SHIFT_MODALITY_AT_BASE';
          } else {
            t.done = true; t.stop_reason = PROBE_STOP.BASE_FLOOR; move = 'STOP_BASE_FLOOR';
          }
        } else {
          moveTo(t, down); move = 'STEP_DOWN';
        }
      }
    } else {
      // Partial performance. §9 of the brief: gather additional evidence and
      // maintain appropriate uncertainty — do NOT conclude from one sample.
      // Order: paired modality first (E3 — the skill may be reachable by
      // another route), then a second sample, and only then step down.
      const pairable = strandsAtRung(t.ladder, t.track, t.rung)
        .find((s) => s.modality_pair && !t.modality_tried[s.id]);
      if (pairable) {
        t.modality_tried = { ...t.modality_tried, [pairable.id]: true };
        t.visited = t.visited.filter((v) => v !== pairable.id);
        move = 'SHIFT_MODALITY';
      } else {
        const down = prevRung(t.ladder, t.track, t.rung);
        if (down == null) {
          // Nowhere lower to go. Take one more sample before stopping rather
          // than reporting a strand from three items — otherwise a single
          // unlucky visit becomes the child's result.
          const resamplable = strandsAtRung(t.ladder, t.track, t.rung)
            .find((s) => !t.resampled[s.id]);
          if (resamplable) {
            t.resampled = { ...t.resampled, [resamplable.id]: true };
            t.visited = t.visited.filter((v) => v !== resamplable.id);
            move = 'RESAMPLE_AT_BASE';
          } else {
            t.done = true; t.stop_reason = PROBE_STOP.BASE_FLOOR; move = 'STOP_BASE_FLOOR';
          }
        } else {
          moveTo(t, down); move = 'STEP_DOWN_PARTIAL';
        }
      }
      t.empty_rungs = 0;
    }
  }

  /**
   * RESCUE — do not close a track over a strand calibration already passed.
   *
   * A track that has bottomed out may still have an unvisited strand higher up
   * that the child answered correctly during calibration. Stopping there would
   * throw away the one thing we already know they can do. Cardinality is the
   * case this exists for: a child can fail quantity and still have it (C1,
   * D10), and a counting-gated stop would hide it.
   *
   * Bounded: each rescue strand is used at most once, and the track's visit cap
   * and the session budget still apply, so this cannot extend a session
   * indefinitely.
   */
  if (t.done && (t.stop_reason === PROBE_STOP.BASE_FLOOR || t.stop_reason === PROBE_STOP.EMPTY_RUNGS)) {
    /**
     * Narrow on purpose. The rescue fires ONLY when the track collapsed at its
     * entry rung without ever descending — that is, exactly one rung has been
     * probed — and only to a strand ABOVE that rung.
     *
     * Test 16 is the case: numeracy enters at rung 0, the child fails quantity,
     * and cardinality at rung 1 would never be seen even though calibration
     * showed they have it.
     *
     * A child who has worked down through several rungs failing each one is a
     * different situation entirely, and pulling them back up to a higher rung
     * there would be both useless and unkind. Hence the single-rung condition
     * rather than a general "try everything calibration passed".
     */
    const rungsProbed = new Set(
      [...state.results, row].filter((r) => r.ladder === t.ladder && r.track === t.track).map((r) => r.rung)
    );
    const collapsedAtEntry = rungsProbed.size === 1;
    const probedRung = [...rungsProbed][0];

    const pending = collapsedAtEntry
      ? t.rescue.filter((id) => !t.visited.includes(id) && STRAND_BY_ID[id]?.rung > probedRung)
      : [];

    if (pending.length) {
      const strandId = pending.sort((a, b) => STRAND_BY_ID[a].rung - STRAND_BY_ID[b].rung || a.localeCompare(b))[0];
      t.rescue = t.rescue.filter((id) => id !== strandId);
      moveTo(t, STRAND_BY_ID[strandId].rung);
      t.done = false;
      t.stop_reason = null;
      t.empty_rungs = 0;
      move = 'RESCUE_TO_CALIBRATED_STRAND';
    }
  }

  if (!t.done && t.visits >= PROBE_CONFIG.MAX_VISITS_PER_TRACK) {
    t.done = true;
    t.stop_reason = PROBE_STOP.TRACK_VISIT_CAP;
  }

  const items_used = state.items_used + total;
  const tracks = { ...state.tracks, [key]: t };

  if (items_used >= PROBE_CONFIG.SESSION_ITEM_BUDGET) {
    for (const k of Object.keys(tracks)) {
      if (!tracks[k].done) {
        tracks[k] = { ...tracks[k], done: true, stop_reason: PROBE_STOP.SESSION_BUDGET };
      }
    }
  }

  const finished = Object.values(tracks).every((x) => x.done);

  return {
    ...state,
    tracks,
    items_used,
    results: [...state.results, { ...row, move, accuracy }],
    finished,
  };
}

/**
 * Drive a whole probe from a response function. Used by tests and the demo
 * runner; the UI drives it one visit at a time via nextProbe/recordProbe.
 *
 * @param {object} calibration result of runCalibration()
 * @param {(visit) => {correct,total,...}} respond
 */
export function runProbe(calibration, respond, { maxVisits = 200 } = {}) {
  let state = startProbe(calibration);
  let guard = 0;
  for (;;) {
    const visit = nextProbe(state);
    if (!visit) break;
    if (++guard > maxVisits) {
      throw new Error('adaptive probe did not terminate — routing bug');
    }
    state = recordProbe(state, visit, respond(visit));
  }

  // Safety net: nextProbe() returns null once nothing is probeable, which can
  // leave a track un-marked. A track with no stop reason is a track whose
  // result nobody can interpret, so it is closed explicitly here rather than
  // left ambiguous.
  const tracks = { ...state.tracks };
  for (const k of Object.keys(tracks)) {
    if (!tracks[k].done) tracks[k] = { ...tracks[k], done: true, stop_reason: PROBE_STOP.EXHAUSTED };
  }
  return { ...state, tracks, finished: true };
}

/** Stop reasons per track, for the report and the confidence calculation. */
export function stopSummary(state) {
  const out = {};
  for (const [k, t] of Object.entries(state.tracks)) {
    out[k] = { stop_reason: t.stop_reason, rung: t.rung, entry_rung: t.entry_rung, visits: t.visits };
  }
  return out;
}

export { tracksFor, baseRungOf };
