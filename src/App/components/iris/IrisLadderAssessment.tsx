import React, { useMemo, useState, useCallback } from 'react';
import { useIris } from '../../contexts/IrisContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAudio } from '../../contexts/AudioContext';
import { servableStrandItems } from '../../../iris/content/phase5Bank.js';
import { ScreenFrame, TopBar, DisplayTitle, Button, Celebration } from './ui/brand';
import { LadderItemCard, LadderProgress } from './ui/LadderItemCard';
import { IrisBuddy } from './ui/IrisBuddy';
import { ChromeActions } from './ui/ChromeActions';

/**
 * Child Mode — the ladder assessment.
 *
 * Two stages, exactly as approved:
 *   1. CALIBRATION — a short fixed set of foundational probes that finds where
 *      to start. Not scored as attainment.
 *   2. ADAPTIVE PROBE — strand visits chosen by the engine from what the child
 *      has just done.
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
  const [calIndex, setCalIndex] = useState(0);
  const [calResponses, setCalResponses] = useState<any[]>([]);
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
        <div className="text-center space-y-5 flex flex-col items-center">
          {/* The companion, not an emoji seedling. A child about to be assessed
              should see the same face that will be with them through it. */}
          <IrisBuddy mood="encourage" className="w-36 h-36" />
          <DisplayTitle size="title">
            {ar ? 'يلا نتعرّف على بعض!' : "Let's get to know each other!"}
          </DisplayTitle>
          <p className="t-body-lg text-ink-muted leading-relaxed max-w-md mx-auto">
            {ar
              ? 'هنلعب شوية ألعاب قصيرة عشان نعرف نبدأ منين. مفيش صح وغلط — كل حاجة تعملها بتساعدنا.'
              : "We'll play a few short games so we know where to start. There is no right or wrong — everything you do helps."}
          </p>
          <Button variant="play" size="lg" icon="play" onClick={startCalibration}>
            {ar ? 'يلا نبدأ' : "Let's start"}
          </Button>
        </div>
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
        <LadderProgress current={calIndex + 1} total={probes.length} ar={ar} label={ar ? 'نتعرّف' : 'Getting to know you'} />
        <LadderItemCard
          key={probe.id}
          ar={ar}
          item={item}
          fallbackPrompt={ar ? probe.labelAr : probe.labelEn}
          onAnswer={answerCalibration}
          onSpeak={(t) => speak?.(t)}
        />
      </Shell>
    );
  }

  // ── ADAPTIVE PROBE ───────────────────────────────────────────────────────
  if (phase === 'PROBE' && visit && visitItems.length > 0) {
    const item = visitItems[visitIndex];
    return (
      <Shell ar={ar} companion={busy ? 'thinking' : 'listening'}>
        <LadderProgress
          current={visitIndex + 1}
          total={visitItems.length}
          ar={ar}
          label={ar ? 'لعبة جديدة' : 'A new game'}
        />
        <LadderItemCard
          key={item.item_id}
          ar={ar}
          item={item}
          onAnswer={answerItem}
          onSpeak={(t) => speak?.(t)}
          disabled={busy}
        />
      </Shell>
    );
  }

  // ── DONE ─────────────────────────────────────────────────────────────────
  return (
    <Shell ar={ar}>
      <Celebration
        mascot={<IrisBuddy mood="celebrate" className="w-32 h-32" />}
        headline={ar ? 'برافو عليك!' : 'Well done!'}
        body={ar ? 'خلّصنا. شكراً إنك لعبت معانا!' : "That's it. Thanks for playing with us!"}
        action={
          <Button variant="primary" size="lg" onClick={onFinish}>
            {ar ? 'تمام' : 'Done'}
          </Button>
        }
      />
    </Shell>
  );
}

// ── presentation helpers ────────────────────────────────────────────────────

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
 * Now: the frame's own corner colour, the question anchored near the top of
 * the reading area rather than floating in the middle, and the companion
 * present at a fixed low-motion position so the child has someone with them.
 * The companion reacts by mood only — it never moves toward or away from an
 * answer, because a character that leans in when you are right is a scoring
 * signal wearing a friendly costume.
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
    <ScreenFrame
      accent="green"
      width="md"
      childMode
      center
      topBar={<TopBar ar={ar} title={ar ? 'نتعرّف على بعض' : 'Getting to know you'} actions={<ChromeActions />} />}
    >
      <div className="pt-2 space-y-5">
        {companion && (
          <div className="flex justify-center">
            <IrisBuddy mood={companion === 'thinking' ? 'thinking' : 'listening'} className="w-20 h-20" />
          </div>
        )}
        {children}
      </div>
    </ScreenFrame>
  );
}
