import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Play } from 'lucide-react';
import { useIris } from '../../contexts/IrisContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAudio } from '../../contexts/AudioContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { servableStrandItems } from '../../../iris/content/phase5Bank.js';
import { LadderItemCard, LadderProgress, LadderRemainingChip } from './ui/LadderItemCard';
import { IrisBuddy } from './ui/IrisBuddy';
import { ChromeActions } from './ui/ChromeActions';
import { Blob, Sparkle } from '../landing/LandingDecor';
import '../landing-child.css';
import '../parent-snapshot-landing.css';

/**
 * Child Mode — the ladder assessment.
 *
 * Two stages, exactly as approved:
 *   1. CALIBRATION — a short fixed set of foundational probes that finds where
 *      to start. Not scored as attainment.
 *   2. ADAPTIVE PROBE — strand visits chosen by the engine from what the child
 *      has just done.
 *
 * The dressing is the landing / child-home language (`.lc-*` + `.ps-*`):
 * cream ground, glass header, a white hero plate for the intro and the
 * done screen, and the question on a white plate with ghost-pill answers.
 * The items, the bank calls and the state machine below are untouched —
 * this file only decides what things look like, never what they mean.
 *
 * ── WHAT THIS COMPONENT DOES NOT DECIDE ───────────────────────────────────
 * Nothing pedagogical. It presents what `currentVisit` names and reports back
 * what happened. Which strand, which rung, when to climb, when to stop and
 * when to finish are all the engine's, and this file has no access to the
 * diagnosis at all. The same holds for everything added in the assessment
 * hardening pass: the progress chip, the break button, the latency clock and
 * the helper switch OBSERVE and PRESENT. None of them reaches scoring —
 * they end up in `observationMeta` beside the record, never inside it.
 *
 * ── TONE ──────────────────────────────────────────────────────────────────
 * A child must not experience this as a test. No score is shown, no "wrong"
 * is announced, nothing counts down, and the child always moves forward.
 * Praise counts CONTINUATION ("you kept going"), never correctness — effort
 * is the only thing this screen is allowed to reward.
 */

type Phase = 'INTRO' | 'CALIBRATION' | 'PROBE' | 'DONE';

/**
 * UI pacing rule (std-accom §2 / W14): after this many probe items the child
 * is offered a genuine choice — keep going or save and stop. The engine
 * already bounds the session with its own item budget; this is the
 * engagement cap that sits INSIDE it, so the child is asked long before the
 * session ever truncates silently.
 */
const SESSION_CAP_ITEMS = 12;

/**
 * Stop reasons that mean "the session was cut short" rather than "we
 * measured what we came to measure". LADDER_TOP / EMPTY_RUNGS / BASE_FLOOR
 * are natural ceilings and floors; a track that finished with NO reason, or
 * was closed by the visit cap or the item budget, was truncated — and the
 * done screen must then say so honestly (audit W4 surface).
 */
const TRUNCATING_STOPS = ['SESSION_BUDGET', 'TRACK_VISIT_CAP', 'EXHAUSTED'];

function isTruncatedRun(r: any): boolean {
  if (!r) return false;
  if (r.invalidRun) return true;
  const stops = r.assessment?.stops;
  if (!stops || typeof stops !== 'object' || Object.keys(stops).length === 0) return false;
  return Object.values(stops).some(
    (s: any) => !s?.stop_reason || TRUNCATING_STOPS.includes(s.stop_reason),
  );
}

export function IrisLadderAssessment({ onFinish, onExit }: { onFinish: () => void; onExit?: () => void }) {
  const iris = useIris();
  const { language } = useLanguage();
  const { speak, isEnabled } = useAudio();
  const ar = language === 'ar';

  const [phase, setPhase] = useState<Phase>('INTRO');
  /* Calibration is 10 short games — long enough to lose to a dead battery.
     Its progress rides in the same localStorage envelope as the probe. */
  const CAL_KEY = 'iris_ladder_cal_v1';
  const savedCal = (() => {
    try { return JSON.parse(localStorage.getItem(CAL_KEY) || 'null'); } catch { return null; }
  })();
  const [calIndex, setCalIndex] = useState<number>(savedCal?.calIndex ?? 0);
  const [calResponses, setCalResponses] = useState<any[]>(Array.isArray(savedCal?.calResponses) ? savedCal.calResponses : []);
  const [visitItems, setVisitItems] = useState<any[]>([]);
  const [visitIndex, setVisitIndex] = useState(0);
  const [visitCorrect, setVisitCorrect] = useState(0);
  const [busy, setBusy] = useState(false);

  // ── run-experience state (std-accom + audit W4/W13/W20) ──────────────────
  /** Break overlay is open — the plate is frozen, nothing counts down. */
  const [onBreak, setOnBreak] = useState(false);
  /** The 12-item "keep going or save a long break?" choice is on screen. */
  const [capAsk, setCapAsk] = useState(false);
  /** Effort burst counter — pure UI, advanced every 3rd answer, right or wrong. */
  const [burst, setBurst] = useState(0);
  /** Did the engine stop early (truncation) rather than cover the ladder? */
  const [partialCoverage, setPartialCoverage] = useState(false);
  /** Intro helper switch — recorded as an accommodation, never as scoring. */
  const [helperUsed, setHelperUsed] = useState<boolean>(iris.ladderObservation?.helperUsed === true);

  /*
   * W13 — response latency. A plain stopwatch per item: from item-shown to
   * answer. Time spent on a BREAK is subtracted, because a break is a break,
   * not slowness. The number is data-quality metadata; it is reported to the
   * context and travels only in `observationMeta`.
   */
  const shownAtRef = useRef(0);
  const pausedMsRef = useRef(0);
  const pauseStartRef = useRef(0);
  /** Effort counting across the run (engagement, not correctness). */
  const effortRef = useRef(0);
  /** The 12-item choice is asked once per mounted run, not every item. */
  const capAskedRef = useRef(false);

  const probes = useMemo(() => iris.getCalibrationProbes().probes, [iris]);
  const visit = iris.currentVisit;

  /** Load the items for a strand visit from the bank. */
  const loadVisit = useCallback((v: any) => {
    if (!v) return;
    const pool = servableStrandItems({ strand: v.strand, template_id: v.template });
    const fallback = pool.length ? pool : servableStrandItems({ strand: v.strand });
    setVisitItems(fallback.slice(0, v.item_count));
    setVisitIndex(0);
    setVisitCorrect(0);
  }, []);

  useEffect(() => {
    try {
      if (phase === 'CALIBRATION' && calResponses.length > 0) localStorage.setItem(CAL_KEY, JSON.stringify({ calIndex, calResponses }));
      else localStorage.removeItem(CAL_KEY);
    } catch { /* private mode */ }
  }, [phase, calIndex, calResponses]);
  const hasSavedCal = calResponses.length > 0 && calResponses.length < (probes.length || 99);
  const hasSavedProbe = !!iris.probeState && !!iris.currentVisit;
  const startOrResume = () => {
    if (hasSavedProbe && iris.currentVisit) {
      loadVisit(iris.currentVisit);
      setPhase('PROBE');
      return;
    }
    if (hasSavedCal) { setPhase('CALIBRATION'); return; }
    startCalibration();
  };
  const startCalibration = () => {
    setPhase('CALIBRATION');
    setCalIndex(0);
    setCalResponses([]);
  };

  // ── per-item stopwatch + effort bookkeeping ──────────────────────────────
  const activeItemId =
    phase === 'PROBE' && visitItems.length > 0
      ? visitItems[visitIndex]?.item_id ?? null
      : phase === 'CALIBRATION'
        ? probes[calIndex]?.id ?? null
        : null;

  useEffect(() => {
    if (!activeItemId) return;
    shownAtRef.current = Date.now();
    pausedMsRef.current = 0;
    // The listen-item word auto-plays when the card appears (see
    // LadderItemCard); `audioAuto` records whether audio was ON for the run,
    // i.e. whether that auto-read actually happened. Presentation fact only.
    iris.setLadderAudioAuto(!!isEnabled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeItemId]);

  const latencyMs = () => Math.max(0, Date.now() - shownAtRef.current - pausedMsRef.current);

  /** Every answer — right or wrong — is engagement. Every third gets a burst. */
  const noteEffort = () => {
    effortRef.current += 1;
    if (effortRef.current % 3 === 0) setBurst((b) => b + 1);
  };

  useEffect(() => {
    if (!burst) return;
    const t = setTimeout(() => setBurst(0), 1900);
    return () => clearTimeout(t);
  }, [burst]);

  const startBreak = () => {
    if (onBreak) return;
    pauseStartRef.current = Date.now();
    iris.recordLadderBreak();
    setOnBreak(true);
  };
  const endBreak = () => {
    if (pauseStartRef.current) pausedMsRef.current += Date.now() - pauseStartRef.current;
    pauseStartRef.current = 0;
    setOnBreak(false);
  };

  /** Session-cap choice (UI pacing, never engine pacing). */
  const maybeAskCap = (answered: number) => {
    if (!capAskedRef.current && answered >= SESSION_CAP_ITEMS) {
      capAskedRef.current = true;
      setCapAsk(true);
    }
  };
  const continueAfterCap = () => setCapAsk(false);
  const saveAndExit = () => {
    // Persist the resumable draft immediately (bypasses the 800ms debounce)
    // and leave. No finalise runs here, so nothing is scored or POSTed —
    // the IN_PROGRESS path is the draft, exactly as the framework §1 says.
    iris.flushLadderDraft();
    onFinish();
  };
  /** Audit P1: an OPTIONAL (retake) run must always be exit-able, mid-run
      included — same draft flush, but back to wherever the parent came from.
      The forced onboarding ladder never receives onExit: no control there
      can pretend to leave when the gate would only re-ask. */
  const exitMidRun = () => {
    iris.flushLadderDraft();
    (onExit ?? onFinish)();
  };

  const answerCalibration = (isCorrect: boolean) => {
    const probe = probes[calIndex];
    iris.recordLadderLatency(String(probe?.id ?? ''), latencyMs());
    noteEffort();
    const next = [...calResponses, { probe_id: probe.id, is_correct: isCorrect }];
    setCalResponses(next);

    if (calIndex + 1 < probes.length) {
      setCalIndex(calIndex + 1);
      return;
    }
    // Calibration finished — hand it to the engine and start probing.
    const { visit: first } = iris.beginLadderProbe(next);
    if (!first) { setPhase('DONE'); return; }
    loadVisit(first);
    setPhase('PROBE');
  };

  const answerItem = async (isCorrect: boolean) => {
    if (busy) return;
    const item = visitItems[visitIndex];
    iris.recordLadderLatency(String(item?.item_id ?? ''), latencyMs());
    noteEffort();
    // items done so far in this run, counting the one just answered:
    // engine-recorded items from finished visits + position in this visit.
    const answered = (iris.probeState?.items_used ?? 0) + visitIndex + 1;

    const correct = visitCorrect + (isCorrect ? 1 : 0);
    setVisitCorrect(correct);

    if (visitIndex + 1 < visitItems.length) {
      setVisitIndex(visitIndex + 1);
      maybeAskCap(answered);
      return;
    }

    setBusy(true);
    const r = await iris.submitLadderVisit(
      {
        correct,
        total: visitItems.length,
        supported: 0,
        modality: visit?.template ?? null,
        // Carried from the item so the engine can attribute a phonological
        // failure to dialect distance rather than to the child.
        dialect_distance: item?.dialect_distance ?? 'UNKNOWN',
      },
      null
    );
    setBusy(false);

    if (r.finished || !r.visit) {
      // W4 surface: budget/stop-reason truncation must be said out loud on
      // the done screen rather than implied as full coverage.
      setPartialCoverage(isTruncatedRun(r));
      setPhase('DONE');
      return;
    }
    loadVisit(r.visit);
    maybeAskCap(answered);
  };

  // ── INTRO ────────────────────────────────────────────────────────────────
  if (phase === 'INTRO') {
    return (
      <Shell ar={ar}>
        <IntroPlate
          ar={ar}
          hasSaved={hasSavedProbe || hasSavedCal}
          onStart={startOrResume}
          helperUsed={helperUsed}
          onToggleHelper={() => setHelperUsed((v) => { const nv = !v; iris.setLadderHelperUsed(nv); return nv; })}
          loadError={!!iris.ladderLoadError}
          onRetryLoad={() => { void iris.loadLadderFromServer(); }}
        />
      </Shell>
    );
  }

  // ── CALIBRATION ──────────────────────────────────────────────────────────
  if (phase === 'CALIBRATION') {
    // Audit P1: a localStorage-restored calIndex can outrun a shorter probe
    // set (age changed between sessions) — clamp instead of white-screening.
    if (!probes[calIndex]) {
      if (probes.length) queueMicrotask(() => setCalIndex(Math.max(0, probes.length - 1)));
      return null;
    }
    const probe = probes[calIndex];
    const items = servableStrandItems({ strand: probe.strand, template_id: probe.template });
    const item = items[0];
    return (
      <Shell ar={ar} companion="listening" onExit={onExit ? exitMidRun : undefined}>
        <div className="ps-progress">
          <LadderProgress current={calIndex + 1} total={probes.length} ar={ar} label={ar ? 'نتعرّف' : 'Getting to know you'} />
        </div>
        <div className="ps-plate" style={{ position: 'relative' }}>
          <LadderItemCard
            key={probe.id}
            ar={ar}
            item={item}
            fallbackPrompt={ar ? probe.labelAr : probe.labelEn}
            onAnswer={answerCalibration}
            onSpeak={(t, lang) => speak?.(t, lang ?? language)}
          />
          <EffortBurst burst={burst} ar={ar} />
        </div>
      </Shell>
    );
  }

  // ── ADAPTIVE PROBE ───────────────────────────────────────────────────────
  if (phase === 'PROBE' && visit && visitItems.length > 0) {
    const item = visitItems[visitIndex];
    return (
      <Shell
        ar={ar}
        companion={busy ? 'thinking' : 'listening'}
        onExit={onExit ? exitMidRun : undefined}
        breakAction={
          <button
            type="button"
            className="ps-ghost-chip"
            onClick={startBreak}
            aria-label={ar ? 'خد بريك' : 'Take a break'}
            title={ar ? 'خد بريك' : 'Take a break'}
            style={{ cursor: 'pointer', minHeight: 40 }}
          >
            <span aria-hidden="true">✋☕</span>
            <span style={{ marginInlineStart: 6 }}>{ar ? 'بريك' : 'Break'}</span>
          </button>
        }
      >
        <div className="ps-progress">
          <LadderProgress
            current={visitIndex + 1}
            total={visitItems.length}
            ar={ar}
            label={ar ? 'لعبة جديدة' : 'A new game'}
          />
          {/* std-accom §2: the child can always see roughly where the session
              is going. Soft number, honest "تقريباً", never a performance bar. */}
          <LadderRemainingChip itemsAnswered={(iris.probeState?.items_used ?? 0) + visitIndex} ar={ar} />
        </div>
        <div className="ps-plate" style={{ position: 'relative' }}>
          <LadderItemCard
            key={item.item_id}
            ar={ar}
            item={item}
            onAnswer={answerItem}
            onSpeak={(t, lang) => speak?.(t, lang ?? language)}
            disabled={busy || onBreak || capAsk}
          />
          <EffortBurst burst={burst} ar={ar} />
        </div>

        {/* ── BREAK ─────────────────────────────────────────────────────────
            The child asked for it; the app must never make asking feel like
            leaving. There are no timers anywhere, so "pause" means the
            honest thing it always meant here: nothing moves, and the same
            game will still be on the plate when they press continue. */}
        <AnimatePresence>
          {onBreak && (
            <KidOverlay key="break" ar={ar}>
              <IrisBuddy mood="encourage" />
              <h2 className="lc-hero-title" style={{ fontSize: 28 }}>{ar ? 'خد راحتك! 🎈' : 'Take your time! 🎈'}</h2>
              <p className="lc-hero-sub" style={{ margin: 0 }}>
                {ar
                  ? 'لما تكون جاهز دوس نكمل — مفيش وقت بيعدّي، وإيريس مستنياك هنا.'
                  : 'When you are ready, press continue — nothing counts down, and IRIS is right here waiting.'}
              </p>
              <button type="button" className="lc-pill lc-pill--blue lc-pill--primary" onClick={endBreak}>
                <Play aria-hidden="true" />
                <span>{ar ? 'يلا نكمّل' : "Let's continue"}</span>
              </button>
            </KidOverlay>
          )}

          {/* ── SESSION CAP CHOICE ──────────────────────────────────────────
              After a stretch of play the child gets a real choice. Saving is
              neutral and dignified: the run's draft is kept, "يلا نكمّل" next
              time lands exactly here. No reward either way — a long break is
              not a prize and stopping is not a failure. */}
          {capAsk && (
            <KidOverlay key="cap" ar={ar}>
              <IrisBuddy mood="celebrate" />
              <h2 className="lc-hero-title" style={{ fontSize: 26 }}>
                {ar ? 'عملت ألعاب كتير النهارده! 🌟' : 'You have played a lot today! 🌟'}
              </h2>
              <p className="lc-hero-sub" style={{ margin: 0 }}>
                {ar ? 'نكمل دلوقتي ولا ناخد بريك طويل؟' : 'Keep going now, or take a long break?'}
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button type="button" className="lc-pill lc-pill--blue lc-pill--primary" onClick={continueAfterCap}>
                  <Play aria-hidden="true" />
                  <span>{ar ? 'يلا نكمّل' : 'Keep going'}</span>
                </button>
                <button type="button" className="lc-pill lc-pill--ghost" onClick={saveAndExit}>
                  <Check aria-hidden="true" />
                  <span>{ar ? 'نحفظ ونأخد بريك طويل' : 'Save and take a long break'}</span>
                </button>
              </div>
            </KidOverlay>
          )}
        </AnimatePresence>
      </Shell>
    );
  }

  // ── DONE ─────────────────────────────────────────────────────────────────
  const doneBody = partialCoverage
    ? (ar
        ? 'مش كل حاجة قدرنا نقيسها النهارده — وده طبيعي. هنكمل مرة تانية'
        : 'We could not measure everything today — and that is normal. We will finish another time.')
    : (ar ? 'خلّصنا. شكراً إنك لعبت معانا!' : "That's it. Thanks for playing with us!");
  return (
    <Shell ar={ar}>
      <DonePlate ar={ar} body={doneBody} onFinish={onFinish} />
    </Shell>
  );
}

// ── presentation helpers ────────────────────────────────────────────────────

/**
 * The intro plate — the same white hero the parent hub uses, but facing a
 * child: the companion the child will play with, the invitation, and one
 * blue button. No score, no countdown, nothing that says "test".
 *
 * Two additions, both parent-facing and neither touching scoring:
 *   - the helper switch (accommodation record — "someone was with the child",
 *     logged for comparability, never for placement), and
 *   - the gentle hydration retry (audit W4): when the server did not answer,
 *     the app says so in a soft voice and offers one button.
 */
function IntroPlate({
  ar, hasSaved, onStart, helperUsed, onToggleHelper, loadError, onRetryLoad,
}: {
  ar: boolean;
  hasSaved: boolean;
  onStart: () => void;
  helperUsed: boolean;
  onToggleHelper: () => void;
  loadError: boolean;
  onRetryLoad: () => void;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.section
      className="lc-hero"
      initial={reduceMotion ? false : { y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <div className="lc-hero-dots" aria-hidden="true" />
      <div className="lc-hero-grid">
        <div className="lc-hero-copy">
          <h1 className="lc-hero-title">
            {ar ? 'يلا نتعرّف على بعض!' : "Let's get to know each other!"}
          </h1>
          <p className="lc-hero-sub">
            {ar
              ? 'هنلعب شوية ألعاب قصيرة عشان نعرف نبدأ منين. مفيش صح وغلط — كل حاجة تعملها بتساعدنا.'
              : "We'll play a few short games so we know where to start. There is no right or wrong — everything you do helps."}
          </p>
          {/* The companion, not an emoji seedling. A child about to be assessed
              should see the same face that will be with them through it. */}
          <div className="lc-hero-actions">
            <button type="button" className="lc-pill lc-pill--blue lc-pill--primary" onClick={onStart}>
              <Play aria-hidden="true" />
              <span>{ar ? (hasSaved ? 'يلا نكمّل' : 'يلا نبدأ') : (hasSaved ? "Let's continue" : "Let's start")}</span>
            </button>
          </div>
          {/* ── Accommodation record (std-accom §17-18) ─────────────────────
              A parent note, in the parent's register, sitting under the
              child's big blue button. Switching it on records "a helper was
              with the child" in the run's observation metadata so results can
              later be compared honestly. It changes NOTHING about what is
              presented or scored. Default off. */}
          <button
            type="button"
            onClick={onToggleHelper}
            aria-pressed={helperUsed}
            className="ps-ghost-chip"
            style={{ marginTop: 18, cursor: 'pointer', minHeight: 44, maxWidth: 420 }}
          >
            <span aria-hidden="true">{helperUsed ? '🤝' : '🫱'}</span>
            <span style={{ marginInlineStart: 8 }}>
              {helperUsed
                ? (ar ? 'تمام — مسجّل إن في حد بيساعد معاه' : 'Noted — a helper is with the child')
                : (ar ? 'لو محتاج يساعد معاه — اضغط هنا' : 'If someone helps them — tap here')}
            </span>
          </button>
          {loadError && (
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" onClick={onRetryLoad} className="lc-pill lc-pill--yellow" style={{ minHeight: 44 }}>
                <span>{ar ? 'التحميل اتأخر — جرّب تاني' : 'Loading took too long — try again'}</span>
              </button>
            </div>
          )}
        </div>
        <div className="lc-hero-mascot">
          <IrisBuddy mood="encourage" />
        </div>
      </div>
    </motion.section>
  );
}

/** The well-done plate, in the same hero language. */
function DonePlate({ ar, body, onFinish }: { ar: boolean; body: string; onFinish: () => void }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.section
      className="lc-hero"
      initial={reduceMotion ? false : { y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <div className="lc-hero-dots" aria-hidden="true" />
      <div className="lc-hero-grid">
        <div className="lc-hero-copy">
          <h1 className="lc-hero-title">
            <span className="lc-hero-mark">{ar ? 'برافو عليك!' : 'Well done!'}</span>
          </h1>
          <p className="lc-hero-sub">{body}</p>
          <div className="lc-hero-actions">
            <button type="button" className="lc-pill lc-pill--blue lc-pill--primary" onClick={onFinish}>
              <Check aria-hidden="true" />
              <span>{ar ? 'تمام' : 'Done'}</span>
            </button>
          </div>
        </div>
        <div className="lc-hero-mascot">
          <IrisBuddy mood="celebrate" />
        </div>
      </div>
    </motion.section>
  );
}

/**
 * A tiny burst of stars after every three answers — right or wrong.
 *
 * std-accom §11: reinforce EFFORT and ENGAGEMENT, not correctness. The copy
 * praises continuing ("you kept going"), never getting things right, so the
 * child is never paid for accuracy and never punished for honesty. Pure
 * presentation: no context value, no engine call, no persisted field.
 */
function EffortBurst({ burst, ar }: { burst: number; ar: boolean }) {
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence>
      {burst > 0 && (
        <motion.div
          key={burst}
          role="status"
          aria-live="polite"
          dir={ar ? 'rtl' : 'ltr'}
          className="absolute left-1/2 -translate-x-1/2 -top-3 z-30 flex flex-col items-center gap-1 rounded-full px-5 py-2"
          style={{
            background: 'var(--lc-surface, #FFFDF6)',
            border: '2px solid var(--lc-border, rgba(31,103,177,0.16))',
            boxShadow: '0 12px 28px -14px rgba(222, 162, 26, 0.55)',
          }}
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.85 }}
          animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.15 : 0.4, ease: 'easeOut' }}
        >
          <span className="text-lg" aria-hidden="true">⭐✨⭐✨⭐</span>
          <span style={{ fontWeight: 800, color: '#8A5A00' }}>
            {ar ? 'ممتاز إنك كمّلت!' : 'Great job keeping going!'}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** A calm, cream, focusable overlay the child can sit inside (break / choice). */
function KidOverlay({ ar, children, onClose }: { ar: boolean; children: React.ReactNode; onClose?: () => void }) {
  const reduceMotion = useReducedMotion();
  const panelRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && onClose) onClose(); };
    window.addEventListener('keydown', onKey);
    // Audit P2: the overlay must not strand a keyboard/switch user — focus
    // lands inside the panel as soon as it opens.
    const t = setTimeout(() => panelRef.current?.focus(), 30);
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(t); };
  }, [onClose]);
  return createPortal((
    <motion.div
      dir={ar ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[300] grid place-items-center p-6 lc-token-scope ps-scope"
      style={{ background: 'rgba(253, 250, 241, 0.94)' }}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        style={{
          maxWidth: 460,
          width: '100%',
          background: 'var(--lc-surface, #FFFDF6)',
          border: '2px solid var(--lc-border, rgba(31,103,177,0.16))',
          borderRadius: 24,
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          textAlign: 'center',
          boxShadow: '0 18px 40px -24px rgba(42, 33, 24, 0.3)',
        }}
      >
        {children}
      </div>
    </motion.div>
    ), document.body
  );
}

/**
 * The assessment shell.
 *
 * ── AUDIT DEFECT D7 ───────────────────────────────────────────────────────
 * The old shell centred a small card in a `min-h-screen flex items-center`
 * with nothing else on the page. On a 900×1100 viewport that left the question
 * adrift in a large empty field, with a green decorative circle clipped hard
 * against the top-left corner as the only other thing on screen. It read as an
 * unfinished page rather than as a calm one.
 *
 * Now: the landing cream ground with its ambient corner washes, the question
 * anchored in a reading column near the top of the page rather than floating
 * in the middle, and the companion present at a fixed low-motion position so
 * the child has someone with them. The companion reacts by mood only — it
 * never moves toward or away from an answer, because a character that leans
 * in when you are right is a scoring signal wearing a friendly costume.
 *
 * `breakAction` puts the break chip in the header side, always visible during
 * probe items — asking for a break should never be hidden behind a menu.
 */
function Shell({
  children,
  ar,
  companion,
  breakAction,
  onExit,
}: {
  children: React.ReactNode;
  ar: boolean;
  companion?: 'listening' | 'thinking';
  breakAction?: React.ReactNode;
  onExit?: () => void;
}) {
  return (
    <div className="lc-root ps-scope" dir={ar ? 'rtl' : 'ltr'}>
      <div className="lc-decor" aria-hidden="true">
        <Blob className="lc-blob lc-blob--1" fill="var(--brand-yellow-wash, #FBE7B8)" />
        <Blob className="lc-blob lc-blob--2" fill="var(--brand-blue-wash, #C9E5F7)" />
        <Sparkle className="lc-spark lc-spark--1" />
        <Sparkle className="lc-spark lc-spark--2" />
        <Sparkle className="lc-spark lc-spark--3" />
      </div>

      <header className="lc-header">
        <div className="lc-header-inner">
          <span className="ps-header-title">{ar ? 'نتعرّف على بعض' : 'Getting to know you'}</span>
          <div className="lc-header-side">
            {onExit && (
              <button type="button" className="lc-pill lc-pill--ghost" onClick={onExit} data-sfx="tap">
                {ar ? 'حفظ وخروج' : 'Save & exit'}
              </button>
            )}
            {breakAction}
            <ChromeActions />
          </div>
        </div>
      </header>

      <main className="lc-main ps-main--narrow">
        <div className="ps-stage">
          {companion && (
            <div className="ps-companion">
              <IrisBuddy mood={companion === 'thinking' ? 'thinking' : 'listening'} />
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
