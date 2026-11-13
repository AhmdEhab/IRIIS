/**
 * IRIS state container — wires the specification engines into React.
 *
 * IMPORTANT: this context holds STATE and calls engines. It contains no
 * pedagogical logic of its own, and it never passes `condition` to any engine.
 * The only place the diagnosis is used is accommodationDefaults(), which
 * returns access supports (extra time / audio repeat / reduced animation).
 */
import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import {
  runAssessment, planGoals, nextActivity, completeSession, buildProgress,
  accommodationDefaults,
  // Phase 5 — the ladder assessment.
  ladderCalibrationProbes, runLadderAssessment, planLadderContent,
  ladderSnapshot, recordPracticeSession, toAssessmentRecord,
  runCalibration, startProbe, nextProbe, recordProbe, finaliseLadderAssessment,
 fromAssessmentRecord} from '../../iris/journey.js';
import { API_URL, authHeaders } from '../config';
import { TASKS } from '../../iris/engines/assessment.js';
import { GOAL_BY_ID } from '../../iris/engines/goals.js';
import { explainProfile, explainGoalStatus, explainDecision } from '../../iris/parent/explain.js';
import { progressSnapshot } from '../../iris/engines/progress.js';

type Ctx = ReturnType<typeof useIrisState>;
const IrisContext = createContext<Ctx | undefined>(undefined);

function useIrisState() {
  const [childName, setChildName] = useState<string>('');
  const [condition, setCondition] = useState<string>('OTHER');
  /**
   * Age in years. Used for ONE thing: shortening the calibration probe set for
   * a very young child. It never reaches placement, scoring or content — see
   * entryHint() in engines/calibration.js.
   */
  const [childAgeYears, setChildAgeYears] = useState<number | null>(null);
  const [accommodations, setAccommodations] = useState<string[]>([]);
  /**
   * Presentation-only state (Phases 7/11/12). These never feed the engine —
   * they are computed from its outputs (submitSession's decision) purely to
   * decorate the child's experience. Nothing in src/iris/ reads them.
   */
  const [avatar, setAvatar] = useState<string>('🦊');
  const [stars, setStars] = useState<number>(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [assessment, setAssessment] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [sessions, setSessions] = useState<any[]>([]);
  const [lastDecision, setLastDecision] = useState<any>(null);
  const [currentActivity, setCurrentActivity] = useState<any>(null);
  const [sessionCounter, setSessionCounter] = useState(0);

  // ── Phase 5 ladder assessment state ─────────────────────────────────────
  const [ladder, setLadder] = useState<any>(null);        // full assessment result
  const [ladderPlan, setLadderPlan] = useState<any>(null); // content plan
  const [ladderLedger, setLadderLedger] = useState<any>(null);
  const [ladderSaveError, setLadderSaveError] = useState<string | null>(null);
  /** The most recent adaptation decision, in full. Drives the "what changed
   *  and why" surfaces and gives Ask IRIS something concrete to explain. */
  const [lastAdaptation, setLastAdaptation] = useState<any>(null);
  const [practiceSaveError, setPracticeSaveError] = useState<string | null>(null);
  /** Every recorded adaptation for this child, newest last. Loaded from the
   *  server so the trail survives a reload; empty until a child row is bound. */
  const [adaptationHistory, setAdaptationHistory] = useState<any[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  /** The database id of the child this session is writing against. Without it
   *  the loop still runs, but nothing is persisted — so it is surfaced rather
   *  than assumed. */
  const [childDbId, setChildDbId] = useState<number | null>(null);
  /** Live probe state while the child is mid-assessment. */
  /* The getting-to-know loop can take several minutes — longer than a five
     year-old's session and longer than a browser tab. Persist it so a reload
     resumes instead of restarting; the finish path nulls these and the effect
     below clears storage with them. */
  const savedProbe = (() => {
    try { return JSON.parse(localStorage.getItem('iris_ladder_probe_v1') || 'null'); } catch { return null; }
  })();
  const [probeState, setProbeState] = useState<any>(savedProbe?.probeState ?? null);
  const [probeCalibration, setProbeCalibration] = useState<any>(savedProbe?.probeCalibration ?? null);
  const [currentVisit, setCurrentVisit] = useState<any>(savedProbe?.currentVisit ?? null);
  useEffect(() => {
    try {
      if (!probeState && !probeCalibration && !currentVisit) localStorage.removeItem('iris_ladder_probe_v1');
      else localStorage.setItem('iris_ladder_probe_v1', JSON.stringify({ probeState, probeCalibration, currentVisit }));
    } catch { /* private mode */ }
  }, [probeState, probeCalibration, currentVisit]);

  /** Intake — the ONLY diagnosis touchpoint, and it sets access supports only. */
  const startChild = useCallback((name: string, cond: string, ageYears: number | null = null) => {
    setChildName(name);
    setCondition(cond);
    setChildAgeYears(Number.isFinite(ageYears as number) ? (ageYears as number) : null);
    setAccommodations(accommodationDefaults(cond).accommodations);
    setAssessment(null); setProfile(null); setAssignments([]);
    setSessions([]); setLastDecision(null); setCurrentActivity(null);
    setLadder(null); setLadderPlan(null); setLadderLedger(null); setLadderSaveError(null);
    setProbeState(null); setProbeCalibration(null); setCurrentVisit(null);
  }, []);

  const accommodationInfo = useMemo(() => accommodationDefaults(condition), [condition]);

  /** Finish the assessment: score → profile → goals. No diagnosis involved. */
  const finishAssessment = useCallback((itemResultsBySubMeasure: any) => {
    const { assessment: a, profile: p } = runAssessment({
      itemResultsBySubMeasure,
      accommodationsUsed: accommodations,
    });
    setAssessment(a);
    setProfile(p);
    const { assignments: assigns } = planGoals({ profile: p });
    setAssignments(assigns);
    setActiveIndex(0);
    return { assessment: a, profile: p, assignments: assigns };
  }, [accommodations]);

  // ══ Phase 5 — calibration → probe → indicators → plan → persist ═══════
  //
  // `condition` is NOT passed to any of these. Age reaches only the probe
  // filter. The diagnosis-blind guarantee is preserved by what is absent from
  // these calls, not by a check inside them.

  /** The calibration probe set. Age can shorten it; nothing else touches it. */
  const getCalibrationProbes = useCallback(
    () => ladderCalibrationProbes({ ageYears: childAgeYears }),
    [childAgeYears]
  );

  /**
   * Turn one practice session plus the engine's decision into a single
   * inspectable record.
   *
   * ── WHY A SEPARATE SHAPE ──────────────────────────────────────────────────
   * The engine's `last_move` is written for the engine: rungs, moves, counters.
   * This is written for anyone who has to ANSWER FOR the decision — a parent, a
   * specialist, a judge asking "why did IRIS make this harder?". It keeps the
   * engine's own fields verbatim (no reinterpretation) and adds the three
   * things the engine does not carry: what was observed, what changed, and a
   * sentence a human can read.
   *
   * Everything here is derived from values the child actually produced. There
   * is no field this function can populate by guessing.
   */
  const buildAdaptationTrace = useCallback(({ args, result, plan }: any) => {
    const move = result?.move ?? null;
    const est = result?.estimate ?? null;
    const total = Number(args?.total) || 0;
    const correct = Number(args?.correct) || 0;
    const accuracy = total > 0 ? correct / total : null;

    return {
      schema: 'IRIS-ADAPTATION-TRACE/1',
      at: args?.at ?? new Date().toISOString(),
      sessionId: args?.sessionId ?? null,
      // ── what the child did ──────────────────────────────────────────────
      observed: {
        strand: args?.strand ?? null,
        rung: args?.rung ?? null,
        modality: args?.modality ?? null,
        attempts: total,
        correct,
        accuracy,
        supported: Number(args?.supported) || 0,
        responseTimeMs: Number.isFinite(args?.responseTimeMs) ? args.responseTimeMs : null,
        completed: args?.completed !== false,
      },
      // ── what the engine decided, verbatim ───────────────────────────────
      decision: move
        ? {
            move: move.move,
            fromRung: move.from_rung,
            toRung: move.to_rung,
            reasonCode: move.reason,
            ruleId: move.rule_id,
            signals: {
              recentAccuracy: move.accuracy,
              consecutiveHigh: move.consecutive_high,
              consecutiveLow: move.consecutive_low,
            },
          }
        : null,
      // ── the resulting skill state ───────────────────────────────────────
      state: est
        ? {
            rung: est.rung,
            provenance: est.provenance,
            observationCount: (est.evidence ?? []).length,
            confidence: est.confidence ?? null,
          }
        : null,
      // ── what happens next ───────────────────────────────────────────────
      next: plan?.blueprint?.activities?.[0]
        ? {
            strand: plan.blueprint.activities[0].strand,
            rung: plan.blueprint.activities[0].rung,
            tier: plan.blueprint.activities[0].tier ?? null,
            templateId: plan.blueprint.activities[0].template_id ?? null,
          }
        : null,
      rulePackVersion: 'phase5-1.0.0',
    };
  }, []);

  /**
   * Write the practice session and its decision trace to the backend.
   *
   * Maps onto the EXISTING `/api/sessions` contract rather than inventing a
   * new endpoint: `ActivitySession` already models a result plus the decision
   * that followed it, which is exactly this. `decision_payload` carries the
   * whole trace, so the audit endpoint `/api/decisions/:childId` starts
   * returning practice adaptations without any change of its own.
   */
  const persistPracticeSession = useCallback(
    async (trace: any, args: any) => {
      if (!childDbId) return; // no account bound — the loop still runs locally
      try {
        const res = await fetch(`${API_URL}/sessions`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            childId: childDbId,
            goal_id: trace.observed.strand,
            level: trace.observed.rung,
            template_id: trace.observed.modality,
            accuracy: trace.observed.accuracy,
            independence:
              trace.observed.attempts > 0
                ? 1 - trace.observed.supported / trace.observed.attempts
                : null,
            band: trace.decision?.move ?? null,
            completion_status: trace.observed.completed ? 'COMPLETE' : 'PARTIAL',
            total_hints: trace.observed.supported,
            item_results: args?.itemResults ?? [],
            decision: {
              rule_id: trace.decision?.ruleId ?? null,
              reason_code: trace.decision?.reasonCode ?? null,
              rule_pack_version: trace.rulePackVersion,
              ...trace,
            },
            is_synthetic: args?.isSynthetic === true,
          }),
        });
        setPracticeSaveError(res.ok ? null : `SAVE_FAILED_${res.status}`);
      } catch (e: any) {
        setPracticeSaveError(e?.message || 'SAVE_FAILED');
      }
    },
    [childDbId]
  );

  /**
   * Load the child's recorded adaptation history from the server.
   *
   * ── WHY THIS IS NOT JUST `lastAdaptation` ─────────────────────────────────
   * `lastAdaptation` lives in React state and dies with the tab. A parent who
   * opens Parent Mode the next morning, or on their phone, must still be able
   * to see what changed and why — otherwise the audit trail exists only for
   * whoever happened to be watching. This reads the same `/api/decisions`
   * endpoint that an auditor would, so the screen and the audit see one record.
   *
   * Failures are surfaced, not swallowed: an empty history and an unreachable
   * server say different things to a parent, and conflating them is how an app
   * ends up quietly telling someone their child has done nothing.
   */
  const refreshAdaptationHistory = useCallback(async () => {
    if (!childDbId) return [];
    try {
      const res = await fetch(`${API_URL}/decisions/${childDbId}`, { headers: authHeaders() });
      if (!res.ok) { setHistoryError(`LOAD_FAILED_${res.status}`); return []; }
      const rows = await res.json();
      const traces = (Array.isArray(rows) ? rows : [])
        .filter((r: any) => r?.decision?.schema === 'IRIS-ADAPTATION-TRACE/1')
        .map((r: any) => ({ ...r.decision, at: r.at ?? r.decision.at, is_synthetic: r.is_synthetic === true }));
      setAdaptationHistory(traces);
      setHistoryError(null);
      return traces;
    } catch (e: any) {
      setHistoryError(e?.message || 'LOAD_FAILED');
      return [];
    }
  }, [childDbId]);

  /**
   * Run the full ladder assessment from the child's responses.
   *
   * `respond` is supplied by the assessment screen and returns the child's
   * result for one strand visit. Persisting is best-effort: a failed save is
   * surfaced rather than swallowed, because a silently unsaved assessment is
   * worse than a visible error.
   */
  const runLadder = useCallback(async ({ calibrationResponses, respond, childId: explicitChildId = null }: any) => {
    const childId = explicitChildId ?? childDbId;
    const result = runLadderAssessment({
      ageYears: childAgeYears,
      calibrationResponses,
      respond,
      accommodations,
    });
    const plan = planLadderContent({ assessment: result, accommodations });

    setLadder(result);
    setLadderPlan(plan);
    setLadderLedger(result.ledger);
    setLadderSaveError(null);

    if (childId) {
      try {
        const res = await fetch(`${API_URL}/assessments`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            childId,
            assessment_kind: 'LADDER',
            ...toAssessmentRecord(result),
          }),
        });
        if (!res.ok) setLadderSaveError(`SAVE_FAILED_${res.status}`);
      } catch (e: any) {
        setLadderSaveError(e?.message || 'SAVE_FAILED');
      }
    }

    return { result, plan };
  }, [childAgeYears, accommodations, childDbId]);

  /**
   * ── The interactive path ────────────────────────────────────────────────
   * The batch `runLadder` above is what the tests drive. A child cannot be
   * driven by a callback, so the UI walks the same engine one visit at a time
   * and finishes through the SAME finalise step — so the interactive result
   * object is identical to the tested one rather than a parallel shape.
   */
  /**
   * Reload the latest complete LADDER assessment from the server and re-derive
   * the snapshot with the engine. Fixes the amnesia where a finished assessment
   * vanished on the next login (the record existed; nothing read it back).
   */
  const loadLadderFromServer = useCallback(async (id?: number | null) => {
    const childId = id ?? childDbId;
    if (!childId) return false;
    try {
      const res = await fetch(`${API_URL}/assessments/${childId}`, { headers: authHeaders() });
      if (!res.ok) return false;
      const rows = await res.json();
      const latest = (Array.isArray(rows) ? rows : [])
        .filter((r: any) => (r.assessment_kind ?? 'LADDER') === 'LADDER' && r.status === 'COMPLETE')
        .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];
      if (!latest) return false;
      const assessment = fromAssessmentRecord(latest);
      const plan = planLadderContent({ assessment, accommodations: assessment.accommodations_used });
      setLadder(assessment);
      setLadderPlan(plan);
      setLadderLedger(assessment.ledger);
      setLadderSaveError(null);
      return true;
    } catch {
      return false;
    }
  }, [childDbId]);

  const beginLadderProbe = useCallback((calibrationResponses: any[]) => {
    const calibration = runCalibration({ ageYears: childAgeYears, responses: calibrationResponses });
    const state = startProbe(calibration);
    const visit = nextProbe(state);
    setProbeCalibration(calibration);
    setProbeState(state);
    setCurrentVisit(visit);
    return { calibration, visit };
  }, [childAgeYears]);

  /**
   * Record one strand visit and hand back the next, or null when finished.
   * Returns `{ visit, finished, assessment }` so the screen never has to
   * inspect engine state itself.
   */
  const submitLadderVisit = useCallback(async (result: any, explicitChildId: number | null = null) => {
    /* The assessment screen calls this with no id — it has none. Falling back
       to the bound child row is what makes the assessment actually persist;
       before this it silently skipped the write on every real run. */
    const childId = explicitChildId ?? childDbId;
    if (!probeState || !currentVisit) return { visit: null, finished: true, assessment: null };

    const next = recordProbe(probeState, currentVisit, result);
    const visit = nextProbe(next);
    setProbeState(next);
    setCurrentVisit(visit);

    if (visit) return { visit, finished: false, assessment: null };

    const assessment = finaliseLadderAssessment({
      calibration: probeCalibration,
      probe: { ...next, finished: true },
      accommodations,
    });
    const plan = planLadderContent({ assessment, accommodations });
    setLadder(assessment);
    setLadderPlan(plan);
    setLadderLedger(assessment.ledger);
    setLadderSaveError(null);

    if (childId) {
      try {
        const res = await fetch(`${API_URL}/assessments`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ childId, assessment_kind: 'LADDER', ...toAssessmentRecord(assessment) }),
        });
        if (!res.ok) setLadderSaveError(`SAVE_FAILED_${res.status}`);
      } catch (e: any) {
        setLadderSaveError(e?.message || 'SAVE_FAILED');
      }
    }

    return { visit: null, finished: true, assessment };
  }, [probeState, currentVisit, probeCalibration, accommodations, childDbId]);

  /**
   * Fold a finished practice session back into the ledger — closes the loop.
   *
   * ── WHY THIS NOW PERSISTS ─────────────────────────────────────────────────
   * Until this change the loop closed only in React state: the estimate moved,
   * the plan was re-derived, and then a page reload threw all of it away. The
   * Phase 9 audit listed it as the top post-demo priority, and it is the single
   * thing that decides whether "IRIS adapts based on observed performance" is a
   * claim or a fact — an adaptation nobody can look up afterwards is not
   * evidence of anything.
   *
   * The POST carries BOTH halves:
   *   - what the child did      → accuracy, hints, item results, response time
   *   - what IRIS decided       → the move, the rungs, the signals, the reason
   *
   * `ActivitySession` already had columns for the decision trace
   * (`decision_rule_id`, `decision_reason_code`, `decision_payload`) — they
   * were simply never written by the practice path. Nothing new was invented
   * server-side; an existing contract is finally being honoured.
   *
   * ── FAILURE BEHAVIOUR ─────────────────────────────────────────────────────
   * Persistence is fire-and-forget on purpose. A child mid-activity must never
   * be blocked by a slow network, so the ledger updates locally first and the
   * write follows. A failure is surfaced through `practiceSaveError` rather
   * than swallowed, because a parent reading a dashboard that was never saved
   * is worse than a visible warning.
   */
  const recordLadderPractice = useCallback((args: any) => {
    if (!ladderLedger) return null;
    const r = recordPracticeSession({ ledger: ladderLedger, ...args });
    setLadderLedger(r.ledger);

    let nextPlan = ladderPlan;
    if (ladder) {
      nextPlan = planLadderContent({
        assessment: { ...ladder, ledger: r.ledger },
        accommodations,
        recentTemplates: ladderPlan?.blueprint?.activities?.map((a: any) => a.template_id) ?? [],
      });
      setLadderPlan(nextPlan);
    }

    const trace = buildAdaptationTrace({ args, result: r, plan: nextPlan });
    setLastAdaptation(trace);
    /**
     * Optimistic append, then reconcile. The trail a parent sees must include
     * the round that just happened even if the write is still in flight; the
     * refresh afterwards replaces it with whatever the server actually holds,
     * so a failed write shows as a missing row rather than a phantom one.
     */
    setAdaptationHistory((h) => [...h, trace]);
    void persistPracticeSession(trace, args).then(() => { void refreshAdaptationHistory(); });

    return { ...r, trace };
  }, [ladderLedger, ladder, ladderPlan, accommodations, persistPracticeSession, refreshAdaptationHistory]);

  /** The parent-facing snapshot. Recomputed, never cached stale. */
  const learningSnapshot = useMemo(
    () => (ladder ? ladderSnapshot(ladder, { childName }) : null),
    [ladder, childName]
  );

  const activeAssignment = assignments[activeIndex] ?? null;

  const loadNextActivity = useCallback(() => {
    if (!activeAssignment) return null;
    const { activity } = nextActivity({
      assignment: activeAssignment,
      decision: lastDecision && lastDecision.to_goal_id === activeAssignment.goal_id ? lastDecision : null,
      accommodations,
      variantSeed: `s${sessionCounter}`,
    });
    setCurrentActivity(activity);
    return activity;
  }, [activeAssignment, lastDecision, accommodations, sessionCounter]);

  /** Record a finished session and run the pathway engine. */
  const submitSession = useCallback((sessionItems: any[], completion = 'COMPLETE') => {
    if (!activeAssignment) return null;
    const r = completeSession({
      assignment: activeAssignment,
      sessionItems,
      completion_status: completion,
      sessions,
      confidence: profile?.confidence ?? 'HIGH',
      at: new Date().toISOString(),
    });
    setSessions(r.history);
    setLastDecision(r.decision);
    setSessionCounter((c) => c + 1);
    setAssignments((prev) => {
      const copy = [...prev];
      copy[activeIndex] = { ...r.nextAssignment };
      return copy;
    });

    // Presentation-only reward bookkeeping — derived AFTER the engine has
    // already decided everything; never influences it.
    setStars((s) => {
      const code = r.decision?.reason_code;
      if (code === 'ADVANCE_MASTERY') return s + 3;
      if (code === 'CONSOLIDATE_HIGH') return s + 2;
      return s + 1;
    });
    if (r.decision?.reason_code === 'ADVANCE_MASTERY') {
      setShowCelebration(true);
    }

    return r;
  }, [activeAssignment, sessions, profile, activeIndex]);

  const dismissCelebration = useCallback(() => setShowCelebration(false), []);

  /**
   * Award a star for something OUTSIDE the adaptive activity loop — finishing a
   * story, for example. Deliberately a narrow function rather than exposing
   * setStars, so no caller can reinterpret the counter as engine state.
   *
   * Stars are presentation only: they are computed from decisions the engine
   * has ALREADY made (or from optional content like stories), and are never
   * read back by scoring, goal selection, pathway, or difficulty.
   */
  const awardPresentationStar = useCallback((count = 1) => {
    setStars((s) => s + Math.max(0, count));
  }, []);

  const snapshots = useMemo(
    () => assignments.map((a) => progressSnapshot(sessions, a.goal_id)),
    [assignments, sessions]
  );

  const progress = useMemo(
    () => (assignments.length ? buildProgress({ sessions, goalIds: assignments.map((a) => a.goal_id) }) : null),
    [sessions, assignments]
  );

  return {
    childName, condition, accommodations, accommodationInfo, setAccommodations,
    assessment, profile, assignments, activeAssignment, activeIndex, setActiveIndex,
    sessions, lastDecision, currentActivity, snapshots, progress,
    startChild, finishAssessment, loadNextActivity, submitSession,
    // Phase 5
    childAgeYears, getCalibrationProbes, runLadder, recordLadderPractice,
    beginLadderProbe, submitLadderVisit, currentVisit, probeState, loadLadderFromServer,
    ladder, ladderPlan, ladderLedger, learningSnapshot, ladderSaveError,
    // The adaptive decision trace — what changed, why, and on what evidence.
    lastAdaptation, practiceSaveError, childDbId, setChildDbId,
    adaptationHistory, historyError, refreshAdaptationHistory,
    TASKS, GOAL_BY_ID, explainProfile, explainGoalStatus, explainDecision,
    avatar, setAvatar, stars, awardPresentationStar, showCelebration, dismissCelebration,
  };
}

export function IrisProvider({ children }: { children: React.ReactNode }) {
  const value = useIrisState();
  return <IrisContext.Provider value={value}>{children}</IrisContext.Provider>;
}

export function useIris() {
  const ctx = useContext(IrisContext);
  if (!ctx) throw new Error('useIris must be used within IrisProvider');
  return ctx;
}
