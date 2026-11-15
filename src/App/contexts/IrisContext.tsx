/**
 * IRIS state container — wires the specification engines into React.
 *
 * IMPORTANT: this context holds STATE and calls engines. It contains no
 * pedagogical logic of its own, and it never passes `condition` to any engine.
 * The only place the diagnosis is used is accommodationDefaults(), which
 * returns access supports (extra time / audio repeat / reduced animation).
 */
import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  runAssessment, planGoals, nextActivity, completeSession, buildProgress,
  accommodationDefaults,
  // Phase 5 — the ladder assessment.
  ladderCalibrationProbes, runLadderAssessment, planLadderContent,
  ladderSnapshot, recordPracticeSession, toAssessmentRecord,
  runCalibration, startProbe, nextProbe, recordProbe, finaliseLadderAssessment,
 fromAssessmentRecord} from '../../iris/journey.js';
/* Namespace import so the OPTIONAL av2 engine exports (gatesFromCaregiver)
   can be probed at call time without breaking this build while the engine
   lane lands them in parallel. A named import of a not-yet-existing export
   would break the bundle; a namespace read is undefined-safe by design. */
import * as journeyApi from '../../iris/journey.js';
import { API_URL, authHeaders, readAuthToken } from '../config';
import { TASKS } from '../../iris/engines/assessment.js';
import { GOAL_BY_ID } from '../../iris/engines/goals.js';
import { explainProfile, explainGoalStatus, explainDecision } from '../../iris/parent/explain.js';
import { progressSnapshot } from '../../iris/engines/progress.js';
import { classifyVisitValidity, gatingObservations } from '../components/iris/ladderObservations.js';

type Ctx = ReturnType<typeof useIrisState>;
const IrisContext = createContext<Ctx | undefined>(undefined);

/**
 * ── Ladder run observation metadata (audit W13 + std-accom §17/§18) ────────
 * The shell object for everything the run observes ABOUT the run: per-item
 * latency, break count, when it started, whether a helper was present, and
 * whether item audio auto-played. It is DATA QUALITY and accommodation
 * RECORD only — nothing in it reaches scoring, placement or content, and it
 * travels as a TOP-LEVEL addition on the saved payload, never inside
 * `item_results`, which stays byte-compatible with the engine's record.
 */
const emptyLadderObservation = () => ({
  latencies: [] as { itemId: string; ms: number }[],
  breaks: 0,
  startedAt: null as string | null,
  helperUsed: false,
  audioAuto: false,
});

/** Normalise whatever was stored back into the full, honest shape. */
function normalizeObservationMeta(o: any) {
  return {
    latencies: Array.isArray(o?.latencies) ? o.latencies : [],
    breaks: Number(o?.breaks) || 0,
    startedAt: o?.startedAt ?? null,
    helperUsed: o?.helperUsed === true,
    audioAuto: o?.audioAuto === true,
  };
}

/**
 * Idempotency key for a pending ladder run (framework §1 `client_ref`).
 * One uuid per run, persisted with the draft so a reload-and-finish reuses
 * it and a double-submit cannot create two records for one session.
 */
function newLadderClientRef(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  } catch { /* older webviews */ }
  return `ladder-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * ── av2 §3: close the tracks the caregiver said have had no opportunity ──
 * A gated MAIN track never gets a visit: its probe-state track is marked
 * done with an explicit NO_OPPORTUNITY stop so nothing silently reads as
 * "untested". It changes NO entry rung, NO score and NO other track — the
 * track-independence doctrine (LISTENING/VSP/MEM/COMM are never affected)
 * is enforced by `t.track === 'MAIN'` here, not by a check elsewhere.
 */
function closeGatedTracks(state: any, gates: any) {
  if (!state || !state.tracks) return state;
  const closedFor = (ladder: string) =>
    !!gates && gates[ladder] === 'not_yet' && gates[`optIn${ladder}`] !== true;
  let touched = false;
  const tracks: any = {};
  for (const [k, t] of Object.entries(state.tracks as Record<string, any>)) {
    if (!t?.done && t?.track === 'MAIN' && closedFor(t?.ladder)) {
      tracks[k] = { ...t, done: true, stop_reason: 'NO_OPPORTUNITY' };
      touched = true;
    } else tracks[k] = t;
  }
  if (!touched) return state;
  const finished = Object.values(tracks).every((x: any) => x?.done === true);
  return { ...state, tracks, finished };
}

/** The §7 opportunityGates envelope: what was closed, what was overridden,
 *  why, and which caregiver record said so. Null when nothing was gated. */
function gatesEnvelope(gates: any, caregiverRef: any) {
  if (!gates) return null;
  const closed = (k: string) => gates[k] === 'not_yet' && gates[`optIn${k}`] !== true;
  return {
    LITERACY: gates.LITERACY ?? null,
    NUMERACY: gates.NUMERACY ?? null,
    optIn: { LITERACY: gates.optInLITERACY === true, NUMERACY: gates.optInNUMERACY === true },
    closed: { LITERACY: closed('LITERACY'), NUMERACY: closed('NUMERACY') },
    source: gates.source ?? null,
    caregiver: caregiverRef ?? null,
  };
}

/** av2 server-draft freshness: a draft older than this is not a resume
 *  point. The session target is 8–15 minutes (spec §4); two weeks of
 *  silence is a different child on a different day, not a half-finished
 *  run, and resuming it would misdate every observation stamp inside. */
const LADDER_DRAFT_FRESH_MS = 14 * 24 * 3600 * 1000;

/** The ladder draft localStorage envelope (kept in the SAME key it has
 *  always used, so phase5-1.0.0-era drafts still hydrate; av2 fields are
 *  additive and defaulted when missing). */
const LADDER_DRAFT_KEY = 'iris_ladder_probe_v1';

function readLocalLadderDraft(): any {
  try { return JSON.parse(localStorage.getItem(LADDER_DRAFT_KEY) || 'null'); } catch { return null; }
}
function localDraftStamp(env: any): number {
  const t = Date.parse(env?.updatedAt ?? '');
  return Number.isFinite(t) ? t : 0;
}

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
  const [avatar, setAvatar] = useState<string>(() => {
    try { return localStorage.getItem('iris_avatar_v1') || '🦊'; } catch { return '🦊'; }
  });
  React.useEffect(() => {
    try { localStorage.setItem('iris_avatar_v1', avatar); } catch { /* private mode */ }
  }, [avatar]);
  /* Audit P2: stars and avatar are presentation, not engine state — but a
     child who earned six stars and reloads to zero loses something real. */
  const [stars, setStars] = useState<number>(() => {
    try { return Math.max(0, Number(localStorage.getItem('iris_stars_v1') || 0) || 0); } catch { return 0; }
  });
  React.useEffect(() => {
    try { localStorage.setItem('iris_stars_v1', String(stars)); } catch { /* private mode */ }
  }, [stars]);
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
  /*
   * ── av2 run accumulators (spec §1/§5) ───────────────────────────────────
   * `ladderObservations` is the full per-item transparency log of the run;
   * `ladderVisitValidity` is the per-visit classification (valid / low /
   * invalid); `ladderCalDraft` mirrors the calibration progress the screen
   * owns so the SERVER draft can carry a resumable calibration too;
   * `ladderGates`/`ladderCaregiverRef` are the §3 opportunity decisions and
   * the record they came from. All of them hydrate from the extended local
   * envelope — an envelope written by an older build simply lacks the
   * fields, and the defaults below keep phase5-1.0.0 drafts loading
   * exactly as before (spec §0 non-negotiable 2).
   */
  const [ladderObservations, setLadderObservations] = useState<any[]>(
    Array.isArray(savedProbe?.observations) ? savedProbe.observations : [],
  );
  const [ladderVisitValidity, setLadderVisitValidity] = useState<any[]>(
    Array.isArray(savedProbe?.visitValidity) ? savedProbe.visitValidity : [],
  );
  const [ladderCalDraft, setLadderCalDraft] = useState<any>(
    savedProbe?.cal && typeof savedProbe.cal === 'object' ? savedProbe.cal : null,
  );
  const [ladderGates, setLadderGatesState] = useState<any>(savedProbe?.gates ?? null);
  const [ladderCaregiverRef, setLadderCaregiverRef] = useState<any>(savedProbe?.caregiverRef ?? null);
  /*
   * ── W17: the draft envelope, extended and debounced ──────────────────────
   * The same localStorage mechanism as before, now also carrying the run's
   * observation meta and its client_ref, so a reload mid-assessment resumes
   * the run AND keeps the idempotency key with it. Writes are debounced by
   * 800ms (one write per settled moment rather than one per keystroke of
   * state), and `flushLadderDraft` / the `pagehide` listener guarantee the
   * last moment is never lost to the debounce window when the child leaves
   * via SAVE & EXIT or the tab simply closes.
   *
   * ── av2 §5 adds the SERVER half ──────────────────────────────────────
   * The same debounce now also POSTs /api/ladder/draft (mirroring the
   * caregiver routes), every visit boundary forces an immediate write, and
   * `pagehide`/`visibilitychange` fire a synchronous sendBeacon to
   * /api/ladder/draft/beacon. localStorage is written FIRST and always:
   * the network path is an upgrade, never a dependency, and fails silently
   * when the server lane has not landed the endpoint yet.
   */
  const [ladderObservation, setLadderObservation] = useState<any>(savedProbe?.observation ?? null);
  const [ladderClientRef, setLadderClientRef] = useState<string | null>(
    typeof savedProbe?.clientRef === 'string' && savedProbe.clientRef ? savedProbe.clientRef : null,
  );
  /**
   * W4: hydration failure surfaced honestly. The app shows nothing
   * automatically on failure; the ladder intro screen reads this and offers
   * a gentle retry of `loadLadderFromServer`.
   */
  const [ladderLoadError, setLadderLoadError] = useState<string | null>(null);

  const ladderDraftRef = useRef<any>(null);
  ladderDraftRef.current = {
    probeState, probeCalibration, currentVisit, observation: ladderObservation, clientRef: ladderClientRef,
    // ── av2 additions (additive; an old envelope just lacks them) ──
    observations: ladderObservations, visitValidity: ladderVisitValidity,
    cal: ladderCalDraft, gates: ladderGates, caregiverRef: ladderCaregiverRef,
  };
  const writeLadderDraft = useCallback(() => {
    try {
      const d = ladderDraftRef.current;
      const empty = !d.probeState && !d.probeCalibration && !d.currentVisit && !d.observation && !d.clientRef;
      if (empty) localStorage.removeItem(LADDER_DRAFT_KEY);
      else localStorage.setItem(LADDER_DRAFT_KEY, JSON.stringify({
        ...d, bankVersion: d.clientRef ? 'av2' : d.bankVersion, updatedAt: new Date().toISOString(),
      }));
    } catch { /* private mode */ }
  }, []);
  useEffect(() => {
    const t = setTimeout(() => {
      writeLadderDraft();
      // av2 §5: the same settled moment flushes the SERVER draft, debounced
      // exactly like the local one. Silent failure — the local write above
      // is the guarantee, the server copy is the cross-device upgrade.
      void postLadderDraftRef.current?.('IN_PROGRESS');
    }, 800);
    return () => clearTimeout(t);
  }, [probeState, probeCalibration, currentVisit, ladderObservation, ladderClientRef,
      ladderObservations, ladderVisitValidity, ladderCalDraft, ladderGates, writeLadderDraft]);
  useEffect(() => {
    const flush = () => {
      writeLadderDraft();          // the local net always lands, synchronously
      beaconLadderDraftRef.current?.(); // then the fire-and-forget server copy
    };
    const onVis = () => { if (document.visibilityState === 'hidden') flush(); };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [writeLadderDraft]);

  /*
   * ── av2 §5: the server ladder draft (mirror of the caregiver routes) ─────
   * Body: {childId, clientRef, status, bankVersion:'av2', state, updatedAt}.
   * GET returns {ok, draft:{clientRef,status,state,updatedAt}} — both the
   * wrapped and flat shapes are accepted, exactly like the caregiver screen
   * learned to do. Everything fails SILENTLY on purpose: the ladder must
   * remain playable offline, and localStorage above is the never-fail copy.
   */
  const buildLadderDraftState = useCallback(() => {
    const d = ladderDraftRef.current ?? {};
    return {
      phase: d.probeState ? 'PROBE' : ((d.cal?.calResponses?.length ?? 0) > 0 ? 'CALIBRATION' : 'INTRO'),
      calIndex: d.cal?.calIndex ?? 0,
      calResponses: Array.isArray(d.cal?.calResponses) ? d.cal.calResponses : [],
      cal: d.cal ?? null,
      probeState: d.probeState ?? null,
      probeCalibration: d.probeCalibration ?? null,
      currentVisit: d.currentVisit ?? null,
      visitSeed: null,
      observations: Array.isArray(d.observations) ? d.observations : [],
      visitValidity: Array.isArray(d.visitValidity) ? d.visitValidity : [],
      gates: d.gates ?? null,
      caregiverRef: d.caregiverRef ?? null,
      observation: d.observation ?? null,
      startedAt: d.observation?.startedAt ?? null,
      bankVersion: 'av2',
      updatedAt: new Date().toISOString(),
    };
  }, []);

  const postLadderDraft = useCallback(async (
    status: 'IN_PROGRESS' | 'COMPLETE' | 'INVALID' = 'IN_PROGRESS',
    override: { state?: any; clientRef?: string | null } | null = null,
  ) => {
    if (!childDbId) return; // no bound child row — local net carries the run
    const d = ladderDraftRef.current ?? {};
    const clientRef = override?.clientRef !== undefined ? override.clientRef : (d.clientRef ?? null);
    if (!clientRef && !d.probeState && !d.cal?.calResponses?.length) return; // nothing to save yet
    let state = override?.state ?? buildLadderDraftState();
    try {
      // 512 KB server cap (spec §5): if the run log ever grows toward it,
      // keep the newest observations — the engine record is complete
      // regardless; the draft is a resume convenience.
      if (JSON.stringify(state).length > 420_000) {
        state = { ...state, observations: (state.observations ?? []).slice(-800) };
      }
      await fetch(`${API_URL}/ladder/draft`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ childId: childDbId, clientRef, status, bankVersion: 'av2', state, updatedAt: state.updatedAt }),
      });
    } catch { /* offline: localStorage is already written; resume falls back to it */ }
  }, [childDbId, buildLadderDraftState]);
  const postLadderDraftRef = useRef(postLadderDraft);
  postLadderDraftRef.current = postLadderDraft;

  /** Synchronous last-gasp flush (pagehide / tab hidden). If the beacon
   *  endpoint is absent at runtime the browser simply drops it — silently,
   *  which is the specified behavior; localStorage was written first. */
  const beaconLadderDraft = useCallback(() => {
    try {
      if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return;
      if (!childDbId) return;
      const d = ladderDraftRef.current ?? {};
      if (!d.clientRef && !d.probeState && !d.cal?.calResponses?.length) return;
      const state = buildLadderDraftState();
      const tok = readAuthToken();
      // sendBeacon cannot set headers, so the server beacon route accepts
      // the bearer in the query string; absent token → the POST is refused
      // server-side and the localStorage copy stands.
      const url = `${API_URL}/ladder/draft/beacon${tok ? `?token=${encodeURIComponent(tok)}` : ''}`;
      navigator.sendBeacon(url, new Blob(
        [JSON.stringify({ childId: childDbId, clientRef: d.clientRef ?? null, status: 'IN_PROGRESS', bankVersion: 'av2', state })],
        { type: 'application/json' },
      ));
    } catch { /* never block a page exit on the assessment's draft net */ }
  }, [childDbId, buildLadderDraftState]);
  const beaconLadderDraftRef = useRef(beaconLadderDraft);
  beaconLadderDraftRef.current = beaconLadderDraft;

  /** Local + server flush in one call, used at visit boundaries and exits. */
  const flushLadderDraft = useCallback(() => {
    writeLadderDraft();
    void postLadderDraftRef.current?.('IN_PROGRESS');
  }, [writeLadderDraft]);

  /**
   * av2 boot resume (spec §5): server draft (IN_PROGRESS, bankVersion av2,
   * fresh) > localStorage (both current keys) > nothing. Returns the cal
   * slice the screen owns so it can hydrate its own calibration position;
   * probe-side state is hydrated directly into the context here. A COMPLETE
   * or INVALID draft is never a resume point (§5).
   */
  const resumeLadderDraft = useCallback(async (): Promise<any | null> => {
    const local = readLocalLadderDraft();
    const lStamp = localDraftStamp(local);
    if (!childDbId) return null;
    try {
      const res = await fetch(
        `${API_URL}/ladder/draft?childId=${encodeURIComponent(String(childDbId))}`,
        { headers: authHeaders() },
      );
      if (!res.ok) return null;
      const raw = await res.json();
      const draft = (raw && (raw as any).draft) || raw;
      if (!draft || typeof draft !== 'object' || !('status' in draft)) return null;
      if (draft.status !== 'IN_PROGRESS') return null;
      const st: any = (draft as any).state ?? draft;
      if (st.bankVersion !== 'av2') return null;
      const sStamp = Date.parse((draft as any).updatedAt ?? st.updatedAt ?? '');
      if (!Number.isFinite(sStamp)) return null;
      if (Date.now() - sStamp > LADDER_DRAFT_FRESH_MS) return null; // stale: not a resume point
      if (lStamp && sStamp < lStamp) return null;                   // this device is newer
      setProbeState(st.probeState ?? null);
      setProbeCalibration(st.probeCalibration ?? null);
      setCurrentVisit(st.currentVisit ?? null);
      setLadderObservations(Array.isArray(st.observations) ? st.observations : []);
      setLadderVisitValidity(Array.isArray(st.visitValidity) ? st.visitValidity : []);
      setLadderGatesState(st.gates ?? null);
      setLadderCaregiverRef(st.caregiverRef ?? null);
      if (st.observation) setLadderObservation(st.observation);
      if (typeof draft.clientRef === 'string' && draft.clientRef) setLadderClientRef(draft.clientRef);
      const cal = st.cal ?? (Array.isArray(st.calResponses)
        ? { calIndex: st.calIndex ?? 0, calResponses: st.calResponses } : null);
      if (cal) setLadderCalDraft(cal);
      return { cal, resumed: true };
    } catch { return null; } // offline / endpoint absent: the local copy decides
  }, [childDbId]);

  /* ── av2 run accumulators — the actions the assessment screen calls ───── */
  /** One observation per presented item (spec §1). Stored sanitized. */
  const recordLadderObservation = useCallback((obs: any) => {
    if (!obs || typeof obs !== 'object') return;
    setLadderObservations((arr: any[]) => [...arr, obs]);
  }, []);
  /** The screen owns calibration progress; mirror it for the draft. */
  const setLadderCalProgress = useCallback((calIndex: number, calResponses: any[]) => {
    setLadderCalDraft({ calIndex, calResponses: Array.isArray(calResponses) ? calResponses : [] });
  }, []);
  /** §3 gates, decided from the caregiver record at INTRO. Null = no gating. */
  const setLadderGating = useCallback((gates: any, caregiverRef: any) => {
    setLadderGatesState(gates ?? null);
    setLadderCaregiverRef(caregiverRef ?? null);
  }, []);
  /**
   * The engine lane's `gatesFromCaregiver` (av2 contract), probed through
   * the namespace import so an engine that has not landed it yet — or a
   * caregiver record of an unexpected shape — can only ever produce NULL,
   * which the UI reads as "no gating". The rule is conservative in both
   * directions: opportunity gates exist ONLY when someone answered them
   * clearly; a crash, a missing export, or a malformed record silently
   * opens every track rather than hiding a domain from the child.
   */
  const ladderGatesFromCaregiver = useCallback((caregiverRecord: any) => {
    try {
      const fn: any = (journeyApi as any).gatesFromCaregiver;
      if (typeof fn !== 'function') return null;
      const g = fn.call(journeyApi, caregiverRecord?.scored ?? caregiverRecord);
      if (!g || typeof g !== 'object') return null;
      const src = (g as any).opportunityGates ?? g;
      const out: any = {};
      if (src.LITERACY === 'not_yet') out.LITERACY = 'not_yet';
      if (src.NUMERACY === 'not_yet') out.NUMERACY = 'not_yet';
      if (typeof g.source === 'string') out.source = g.source;
      return (out.LITERACY || out.NUMERACY) ? out : null;
    } catch { return null; } // any failure = no gating (spec §3 defensive)
  }, []);
  /** Fresh run: clear the accumulators and mint the draft's idempotency key
   *  up front, so even the calibration games ride a flushable clientRef. */
  const resetLadderRun = useCallback(() => {
    setLadderObservations([]);
    setLadderVisitValidity([]);
    setLadderCalDraft(null);
    setProbeState(null); setProbeCalibration(null); setCurrentVisit(null);
    setLadderClientRef(newLadderClientRef());
  }, []);

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
    setLadderObservation(null); setLadderClientRef(null); setLadderLoadError(null);
    // av2 run accumulators belong to the child whose intake this is, too.
    setLadderObservations([]); setLadderVisitValidity([]); setLadderCalDraft(null);
    setLadderGatesState(null); setLadderCaregiverRef(null);
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

  /*
   * ── Observation record actions (W13 / std-accom §17-18) ──────────────────
   * Presentation-layer bookkeeping only. None of these values is ever passed
   * to an engine call — they exist to be recorded, and scoring cannot see
   * them. The `condition` label never enters any of these paths either.
   */
  const patchLadderObservation = useCallback((patch: any) => {
    setLadderObservation((o: any) => {
      const base = o ?? emptyLadderObservation();
      const delta = typeof patch === 'function' ? patch(base) : patch;
      return { ...base, ...delta };
    });
  }, []);

  /** Per-item response latency: item-shown → answer, in ms. Data quality only. */
  const recordLadderLatency = useCallback((itemId: string, ms: number) => {
    if (!itemId || !Number.isFinite(ms)) return;
    patchLadderObservation((o: any) => ({
      latencies: [...(o.latencies ?? []), { itemId, ms: Math.max(0, Math.round(ms)) }],
    }));
  }, [patchLadderObservation]);

  /** Break-button interruptions. Counted as engagement context, never as ability. */
  const recordLadderBreak = useCallback(() => {
    patchLadderObservation((o: any) => ({ breaks: Number(o.breaks ?? 0) + 1 }));
  }, [patchLadderObservation]);

  /** Accommodation record: a helper was with the child. Does NOT change scoring. */
  const setLadderHelperUsed = useCallback(
    (v: boolean) => patchLadderObservation({ helperUsed: !!v }),
    [patchLadderObservation],
  );

  /** Accommodation record: item audio was on, so listen-item words auto-played. */
  const setLadderAudioAuto = useCallback(
    (v: boolean) => patchLadderObservation({ audioAuto: !!v }),
    [patchLadderObservation],
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
   *
   * ── W17 + W4 (audit §6 of ASSESSMENT_FRAMEWORK) ────────────────────────
   * Loads through the kind-filtered collection form
   * `GET /assessments?childId=…&kind=LADDER`. The parallel server work makes
   * the `kind` param authoritative; until it lands (or if it ever ignores the
   * param) the response is filtered CLIENT-SIDE as well:
   *   - CAREGIVER records NEVER hydrate into ladder state — explicit exclusion;
   *   - a row with no `assessment_kind` is treated as LADDER for legacy rows;
   *   - only status COMPLETE counts — an IN_PROGRESS draft is not a result.
   * A failed load sets `ladderLoadError` rather than failing silently; the
   * intro screen offers a gentle retry. A 404 (child genuinely has no rows)
   * is not an error — it is just "nothing yet".
   */
  const loadLadderFromServer = useCallback(async (id?: number | null) => {
    const childId = id ?? childDbId;
    if (!childId) return false;
    setLadderLoadError(null);
    try {
      let rows: any = null;
      try {
        const resQ = await fetch(`${API_URL}/assessments?childId=${childId}&kind=LADDER`, { headers: authHeaders() });
        if (resQ.ok) {
          const jsonQ = await resQ.json();
          if (Array.isArray(jsonQ)) rows = jsonQ;
        }
      } catch { /* collection form may not exist yet — fall through to the path form */ }
      if (!Array.isArray(rows)) {
        const res = await fetch(`${API_URL}/assessments/${childId}`, { headers: authHeaders() });
        if (!res.ok) {
          if (res.status !== 404) {
            setLadderLoadError(`LOAD_FAILED_${res.status}`);
            console.warn('IRIS ladder hydration failed:', `LOAD_FAILED_${res.status}`);
          }
          return false;
        }
        rows = await res.json();
      }
      if (!Array.isArray(rows)) {
        setLadderLoadError('LOAD_FAILED_SHAPE');
        console.warn('IRIS ladder hydration failed: unexpected response shape');
        return false;
      }
      const latest = rows
        .filter((r: any) => {
          const kind = r.assessment_kind ?? 'LADDER'; // legacy rows predate the column
          if (kind === 'CAREGIVER') return false;     // explicit — two tracks, never mixed
          return kind === 'LADDER' && r.status === 'COMPLETE';
        })
        .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];
      if (!latest) return false;
      const assessment = fromAssessmentRecord(latest);
      const plan = planLadderContent({ assessment, accommodations: assessment.accommodations_used });
      setLadder(assessment);
      setLadderPlan(plan);
      setLadderLedger(assessment.ledger);
      setLadderSaveError(null);
      setLadderLoadError(null);
      return true;
    } catch (e: any) {
      console.warn('IRIS ladder hydration failed:', e?.message || e);
      setLadderLoadError(e?.message || 'LOAD_FAILED');
      return false;
    }
  }, [childDbId]);

  const beginLadderProbe = useCallback((calibrationResponses: any[]) => {
    const calibration = runCalibration({ ageYears: childAgeYears, responses: calibrationResponses });
    /* §3 opportunity gating: a closed MAIN track is folded into the probe
       state as an explicit NO_OPPORTUNITY stop before the first visit — the
       engine never scores what the child never had the chance to meet, and
       no other track can feel the difference. */
    const state = closeGatedTracks(startProbe(calibration), ladderGates);
    const visit = nextProbe(state);
    setProbeCalibration(calibration);
    setProbeState(state);
    setCurrentVisit(visit);
    /* A run is starting: stamp its start time and mint (or reuse, on a
       reload-resume) the idempotency key. Reused later by the finalise POST. */
    setLadderObservation((o: any) => ({
      ...(o ?? emptyLadderObservation()),
      startedAt: o?.startedAt ?? new Date().toISOString(),
    }));
    setLadderClientRef((r: any) => (typeof r === 'string' && r ? r : newLadderClientRef()));
    return { calibration, visit };
  }, [childAgeYears, ladderGates]);

  /**
   * Record one strand visit and hand back the next, or null when finished.
   * Returns `{ visit, finished, assessment }` so the screen never has to
   * inspect engine state itself.
   *
   * ── av2 additions (spec §1.6 / §5 / §7) ─────────────────────────────────
   * Third argument `visitCtx` carries THIS visit's observation rows:
   *   { observations: [...], invalidVisit?: boolean }
   * The visit is classified locally from them. An `invalid_administration`
   * visit NEVER reaches `recordProbe` — the estimates do not move, the
   * strand is simply marked visited so the session keeps flowing, and the
   * validity row records what happened. On the finishing visit the engine
   * finalise call gains the av2 envelope options (observations, gates,
   * visitValidity, caregiverRef), and the POST's `item_results` carries the
   * full §7 av2 shape. A successful save marks the server draft COMPLETE
   * (never deletes it) and clears the local keys.
   */
  const submitLadderVisit = useCallback(async (
    result: any,
    explicitChildId: number | null = null,
    visitCtx: any = {},
  ) => {
    /* The assessment screen calls this with no id — it has none. Falling back
       to the bound child row is what makes the assessment actually persist;
       before this it silently skipped the write on every real run. */
    const childId = explicitChildId ?? childDbId;
    if (!probeState || !currentVisit) return { visit: null, finished: true, assessment: null };

    const visitObservations = Array.isArray(visitCtx?.observations) ? visitCtx.observations : [];
    // Prefer what the screen classified; classify defensively from the raw
    // rows if it did not. No rows at all (legacy callers) stays 'valid' so
    // pre-av2 call sites behave exactly as before.
    const validity = visitCtx?.invalidVisit === true
      ? 'invalid_administration'
      : (visitObservations.length
          ? classifyVisitValidity(visitObservations)
          : (result?.visitValidity === 'invalid_administration' ? 'invalid_administration' : 'valid'));
    const visitNo = (Array.isArray(ladderVisitValidity) ? ladderVisitValidity.length : 0) + 1;
    const validityRows = [...(ladderVisitValidity ?? []), {
      visit: visitNo,
      strand: currentVisit.strand ?? null,
      ladder: currentVisit.ladder ?? null,
      track: currentVisit.track ?? null,
      valid: validity,
    }];

    let next;
    if (validity === 'invalid_administration') {
      /* §1.6: never updates estimates. recordProbe is NOT called; the
         strand is marked visited so the track advances on its own. */
      const key = currentVisit.track_key;
      const t: any = probeState.tracks?.[key];
      const tracks = t
        ? {
            ...probeState.tracks,
            [key]: { ...t, visited: [...new Set([...(t.visited ?? []), currentVisit.strand])] },
          }
        : probeState.tracks;
      next = closeGatedTracks({ ...probeState, tracks }, ladderGates);
    } else {
      next = closeGatedTracks(recordProbe(probeState, currentVisit, result), ladderGates);
    }
    const visit = nextProbe(next);
    setLadderVisitValidity(validityRows);
    setProbeState(visit ? next : null);
    setCurrentVisit(visit);
    if (!visit) setProbeCalibration(null);

    /* §5: a visit boundary is a FORCED flush — no debounce waiting. */
    writeLadderDraft();
    void postLadderDraft('IN_PROGRESS');

    if (visit) return { visit, finished: false, assessment: null };

    /* The final observation log: item rows + this last visit + one
       domain-level no_opportunity row per closed track (§3). */
    const itemObservations = [
      ...(Array.isArray(ladderObservations) ? ladderObservations : []).filter((o: any) => o?.outcome !== 'no_opportunity'),
      ...visitObservations,
    ];
    const observations = [...itemObservations, ...gatingObservations(ladderGates)];
    const gates = gatesEnvelope(ladderGates, ladderCaregiverRef);

    const assessment = finaliseLadderAssessment({
      calibration: probeCalibration,
      probe: { ...next, finished: true },
      accommodations,
      // ── av2 envelope opts (engine lane contract; harmless no-ops until
      //    they land, and the engine lane's tests keep their own shape) ──
      observations,
      opportunityGates: gates,
      visitValidity: validityRows,
      caregiverRef: ladderCaregiverRef ?? null,
    });

    /*
     * ── W20 / principle 10: invalid administration ───────────────────────
     * A run that ends with fewer than three completed items is not a
     * measurement — it is an accidental exit. It is never persisted and never
     * published to local state (no low estimate, no phantom snapshot). The
     * draft is cleared, so on resume the child simply sees the intro again.
     * Under av2 the draft is explicitly marked INVALID first (§5: INVALID
     * drafts never hydrate as resume points).
     */
    const invalidRun = (assessment.items_presented ?? 0) < 3;

    /* The run is over either way: the pending draft (observation + clientRef)
       is consumed now, captured locally for the POST below. */
    const observationMeta = normalizeObservationMeta(ladderObservation);
    const clientRef = typeof ladderClientRef === 'string' && ladderClientRef
      ? ladderClientRef
      : newLadderClientRef();
    /* Snapshot the resumable draft BEFORE the state below consumes it, so
       the terminal draft POST still carries the full run log under the
       right clientRef. */
    const finalDraftState = buildLadderDraftState();
    setLadderObservation(null);
    setLadderClientRef(null);

    if (invalidRun) {
      void postLadderDraft('INVALID', { state: finalDraftState, clientRef });
      return { visit: null, finished: true, assessment: null, invalidRun: true };
    }

    const plan = planLadderContent({ assessment, accommodations });
    setLadder(assessment);
    setLadderPlan(plan);
    setLadderLedger(assessment.ledger);
    setLadderSaveError(null);

    if (childId) {
      try {
        const rec: any = toAssessmentRecord(assessment);
        /* §7 record envelope. The engine record is byte-compatible by
           construction (calibration + probe stay as they were); the av2
           arrays are additive INSIDE item_results, which is exactly the
           documented av2 shape, and `rule_pack_version` is stamped for the
           av2 pack. Server-side, legacy rows bypass the new enum checks;
           av2 rows validate shape only — ids stay client authority. */
        const itemResults = {
          ...(rec.item_results ?? {}),
          bankVersion: 'av2',
          observations,
          opportunityGates: gates,
          visitValidity: validityRows,
          caregiverRef: ladderCaregiverRef ?? null,
        };
        const res = await fetch(`${API_URL}/assessments`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            childId,
            assessment_kind: 'LADDER',
            ...rec,
            item_results: itemResults,
            rule_pack_version: 'av2-1.0.0',
            // ── TOP-LEVEL ADDITIONS ONLY (W13 + accommodation record + §1) ──
            // `observationMeta` and `clientRef` sit BESIDE the engine record,
            // never inside `item_results`, whose shape is byte-compatible
            // with every engine test. The server stores what it knows today
            // and ignores the rest; the parallel server work adds the
            // client_ref idempotency key and an observation column beside
            // the existing ones — nothing ladder-specific moves inside the
            // engine's envelope.
            observationMeta,
            clientRef,
          }),
        });
        if (!res.ok) {
          setLadderSaveError(`SAVE_FAILED_${res.status}`);
        } else {
          /* §5: a completed LADDER record clears the drafts — the SERVER
             draft is marked COMPLETE (never deleted) and the local keys go
             with the consumed run state below. */
          void postLadderDraft('COMPLETE', {
            state: { ...finalDraftState, probeState: null, currentVisit: null },
            clientRef,
          });
        }
      } catch (e: any) {
        setLadderSaveError(e?.message || 'SAVE_FAILED');
      }
    }

    return { visit: null, finished: true, assessment, invalidRun: false };
  }, [probeState, currentVisit, probeCalibration, accommodations, childDbId, ladderObservation,
      ladderClientRef, ladderObservations, ladderVisitValidity, ladderGates, ladderCaregiverRef,
      writeLadderDraft, postLadderDraft, buildLadderDraftState]);

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
    // Ladder run experience (W13/W17/W4/W20): observation record, idempotency
    // key, hydration error surface, and the debounced draft with its flush.
    ladderObservation, ladderClientRef, ladderLoadError,
    recordLadderLatency, recordLadderBreak, setLadderHelperUsed, setLadderAudioAuto,
    flushLadderDraft,
    // ── av2 (spec §1/§3/§5/§7): per-item observation log, per-visit
    // validity, opportunity gates, calibration draft mirror, server-draft
    // resume, and the defensive caregiver-gate probe. ──
    ladderObservations, ladderVisitValidity, ladderGates, ladderCaregiverRef,
    recordLadderObservation, setLadderCalProgress, setLadderGating,
    ladderGatesFromCaregiver, resetLadderRun, resumeLadderDraft,
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
