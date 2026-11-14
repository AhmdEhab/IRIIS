import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Check, Play } from 'lucide-react';
import { useIris } from '../../contexts/IrisContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAudio } from '../../contexts/AudioContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { servableStrandItems } from '../../../iris/content/phase5Bank.js';
import { LadderItemCard, LadderProgress } from './ui/LadderItemCard';
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
 * diagnosis at all.
 *
 * ── TONE ──────────────────────────────────────────────────────────────────
 * A child must not experience this as a test. No score is shown, no "wrong"
 * is announced, nothing counts down, and the child always moves forward.
 */

type Phase = 'INTRO' | 'CALIBRATION' | 'PROBE' | 'DONE';

export function IrisLadderAssessment({ onFinish }: { onFinish: () => void }) {
  const iris = useIris();
  const { language } = useLanguage();
  const { speak } = useAudio();
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

  const answerCalibration = (isCorrect: boolean) => {
    const probe = probes[calIndex];
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
    const correct = visitCorrect + (isCorrect ? 1 : 0);
    setVisitCorrect(correct);

    if (visitIndex + 1 < visitItems.length) {
      setVisitIndex(visitIndex + 1);
      return;
    }

    setBusy(true);
    const item = visitItems[visitIndex];
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

    if (r.finished || !r.visit) { setPhase('DONE'); return; }
    loadVisit(r.visit);
  };

  // ── INTRO ────────────────────────────────────────────────────────────────
  if (phase === 'INTRO') {
    return (
      <Shell ar={ar}>
        <IntroPlate
          ar={ar}
          hasSaved={hasSavedProbe || hasSavedCal}
          onStart={startOrResume}
        />
      </Shell>
    );
  }

  // ── CALIBRATION ──────────────────────────────────────────────────────────
  if (phase === 'CALIBRATION') {
    const probe = probes[calIndex];
    const items = servableStrandItems({ strand: probe.strand, template_id: probe.template });
    const item = items[0];
    return (
      <Shell ar={ar} companion="listening">
        <div className="ps-progress">
          <LadderProgress current={calIndex + 1} total={probes.length} ar={ar} label={ar ? 'نتعرّف' : 'Getting to know you'} />
        </div>
        <div className="ps-plate">
          <LadderItemCard
            key={probe.id}
            ar={ar}
            item={item}
            fallbackPrompt={ar ? probe.labelAr : probe.labelEn}
            onAnswer={answerCalibration}
            onSpeak={(t, lang) => speak?.(t, lang ?? language)}
          />
        </div>
      </Shell>
    );
  }

  // ── ADAPTIVE PROBE ───────────────────────────────────────────────────────
  if (phase === 'PROBE' && visit && visitItems.length > 0) {
    const item = visitItems[visitIndex];
    return (
      <Shell ar={ar} companion={busy ? 'thinking' : 'listening'}>
        <div className="ps-progress">
          <LadderProgress
            current={visitIndex + 1}
            total={visitItems.length}
            ar={ar}
            label={ar ? 'لعبة جديدة' : 'A new game'}
          />
        </div>
        <div className="ps-plate">
          <LadderItemCard
            key={item.item_id}
            ar={ar}
            item={item}
            onAnswer={answerItem}
            onSpeak={(t, lang) => speak?.(t, lang ?? language)}
            disabled={busy}
          />
        </div>
      </Shell>
    );
  }

  // ── DONE ─────────────────────────────────────────────────────────────────
  return (
    <Shell ar={ar}>
      <DonePlate
        ar={ar}
        body={ar ? 'خلّصنا. شكراً إنك لعبت معانا!' : "That's it. Thanks for playing with us!"}
        onFinish={onFinish}
      />
    </Shell>
  );
}

// ── presentation helpers ────────────────────────────────────────────────────

/**
 * The intro plate — the same white hero the parent hub uses, but facing a
 * child: the companion the child will play with, the invitation, and one
 * blue button. No score, no countdown, nothing that says "test".
 */
function IntroPlate({ ar, hasSaved, onStart }: { ar: boolean; hasSaved: boolean; onStart: () => void }) {
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
 */
function Shell({
  children,
  ar,
  companion,
}: {
  children: React.ReactNode;
  ar: boolean;
  companion?: 'listening' | 'thinking';
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
