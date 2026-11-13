import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useIris } from '../../contexts/IrisContext';
import { topUpActivityItems } from '../../services/aiContent';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAudio } from '../../contexts/AudioContext';
import { ScreenFrame, TopBar, Pill, Button, Celebration, EmptyState } from './ui/brand';
import { LadderItemCard, LadderProgress } from './ui/LadderItemCard';
import { IrisBuddy } from './ui/IrisBuddy';
import { ChromeActions } from './ui/ChromeActions';

/**
 * Child Mode — practice from the assessment's content plan.
 *
 * ── WHY THIS SCREEN EXISTS ────────────────────────────────────────────────
 * Without it the pipeline stops at a results page. The assessment produced a
 * plan, the parent could read the plan, and nothing could play it — so no
 * practice result ever reached the skill ledger and the estimate never moved
 * after the first session. The engine supported the whole loop; the app had
 * no route through it.
 *
 * This screen is that route:
 *
 *   blueprint activity → items → child answers → recordLadderPractice()
 *     → updated estimate → re-planned blueprint → next activity
 *
 * ── WHAT IT DOES NOT DECIDE ───────────────────────────────────────────────
 * Which strand, which rung, which tier, how many items and which scaffolds —
 * all of that arrives already decided in the plan. This file presents and
 * reports. It has no access to the diagnosis and does no pedagogy of its own.
 */
export function IrisLadderPractice({ onFinish }: { onFinish: () => void }) {
  const { ladderPlan, recordLadderPractice, ladderLedger } = useIris();
  const { language } = useLanguage();
  const { speak, playSound } = useAudio();
  const ar = language === 'ar';

  const activities = ladderPlan?.activities ?? [];
  const [activityIndex, setActivityIndex] = useState(0);
  const [itemIndex, setItemIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [supported, setSupported] = useState(0);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const activity = activities[activityIndex] ?? null;

  /**
   * The items this activity will actually present.
   *
   * ── WHY THIS IS STATE AND NOT `activity.items` ────────────────────────────
   * The reviewed bank often cannot fill an activity: most (strand × rung ×
   * tier × format) slots hold fewer than four items, so a child held at a rung
   * — the correct adaptation, and the common one — meets the same three
   * questions over and over, and repetition stops measuring the skill and
   * starts measuring memory of the item. `topUpActivityItems` asks the server
   * for extra variants at the difficulty the ENGINE already chose.
   *
   * The bank's items always come first and are never replaced. The top-up is
   * applied ONLY before the child has answered anything, so the number of
   * items in an activity can never change underneath them mid-way — that
   * would move the goalposts of a session that is already being scored.
   */
  const [items, setItems] = useState<any[]>(activity?.items ?? []);

  useEffect(() => {
    setItems(activity?.items ?? []);
    if (!activity) return;

    const want = (activity.item_count ?? 4) - (activity.items?.length ?? 0);
    if (want <= 0) return;

    let cancelled = false;
    void topUpActivityItems(activity, { language: ar ? 'ar' : 'en', want }).then((extra) => {
      // `itemIndex === 0` is the guard: nothing has been answered yet, so
      // extending the activity is safe. Anything later is dropped silently —
      // a missed top-up costs a repeated question, which is what would have
      // happened anyway.
      if (cancelled || extra.length === 0) return;
      setItems((current) => (itemIndex === 0 ? [...(activity.items ?? []), ...extra] : current));
    });
    return () => { cancelled = true; };
    // Deliberately keyed on the activity alone: re-running on itemIndex would
    // fire a request after every answer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity?.activity_id, ar]);

  const item = items[itemIndex] ?? null;

  /** Scaffold flags come from the plan, not from this screen. */
  const showHintAlways = !!activity?.scaffold_flags?.includes('HINT_ALWAYS_SHOWN');
  const hintOnRequest = !!activity?.scaffold_flags?.includes('HINT_ON_REQUEST');
  const noHint = !!activity?.scaffold_flags?.includes('NO_HINT');

  const finishActivity = useCallback(async (finalCorrect: number, usedSupport: number) => {
    if (!activity) return;
    setBusy(true);
    recordLadderPractice({
      strand: activity.strand,
      rung: activity.rung,
      correct: finalCorrect,
      total: items.length,
      supported: usedSupport,
      modality: activity.template_id,
      at: new Date().toISOString(),
      sessionId: `PRACTICE-${Date.now()}`,
    });
    setBusy(false);

    if (activityIndex + 1 < activities.length) {
      setActivityIndex(activityIndex + 1);
      setItemIndex(0);
      setCorrect(0);
      setSupported(0);
    } else {
      setDone(true);
    }
  }, [activity, items.length, activityIndex, activities.length, recordLadderPractice]);

  const answer = useCallback((isCorrect: boolean) => {
    if (busy) return;
    playSound?.(isCorrect ? 'success' : 'tap');
    const nextCorrect = correct + (isCorrect ? 1 : 0);
    const nextSupported = supported + (showHintAlways ? 1 : 0);
    setCorrect(nextCorrect);
    setSupported(nextSupported);

    if (itemIndex + 1 < items.length) {
      setItemIndex(itemIndex + 1);
      return;
    }
    void finishActivity(nextCorrect, nextSupported);
  }, [busy, correct, supported, itemIndex, items.length, showHintAlways, finishActivity, playSound]);

  /**
   * The human name of the skill being practised.
   *
   * `activity` comes from the materialised plan, which carries items but not
   * display names; the names live on the matching blueprint entry. Matched by
   * strand rather than by index so a reordered plan cannot mislabel a screen.
   */
  const skillName = useMemo(() => {
    const entry = (ladderPlan?.blueprint?.activities ?? []).find((a: any) => a.strand === activity?.strand);
    return (ar ? entry?.strand_name_ar : entry?.strand_name_en) ?? '';
  }, [ladderPlan, activity, ar]);

  const movedRungs = useMemo(() => {
    if (!ladderLedger) return [];
    return Object.values(ladderLedger.estimates ?? {})
      .filter((e: any) => e.last_move && ['CLIMB', 'BACKSTEP'].includes(e.last_move.move));
  }, [ladderLedger]);

  // ── no plan ──────────────────────────────────────────────────────────────
  if (activities.length === 0) {
    return (
      <Shell ar={ar} onBack={onFinish}>
        <EmptyState
          illustration={<IrisBuddy mood="idle" className="w-28 h-28" />}
          body={
            ar
              ? 'مفيش تدريب جاهز لسه. لما نخلّص أنشطة التعرّف هنعرف نبدأ منين.'
              : 'No practice ready yet. Once the getting-to-know activities are done we will know where to start.'
          }
          action={
            <Button variant="quiet" onClick={onFinish}>
              {ar ? 'رجوع' : 'Back'}
            </Button>
          }
        />
      </Shell>
    );
  }

  // ── finished ─────────────────────────────────────────────────────────────
  if (done) {
    return (
      <Shell ar={ar}>
        <Celebration
          mascot={<IrisBuddy mood="celebrate" className="w-32 h-32" />}
          headline={ar ? 'برافو عليك!' : 'Well done!'}
          body={
            ar
              ? 'خلّصنا التدريب النهارده. شكراً إنك لعبت معانا.'
              : "That's today's practice done. Thanks for playing with us."
          }
          /* Shown because it is true and it is the point of the loop: the
             child's own work moved the estimate. No score is displayed. */
          note={
            movedRungs.length > 0
              ? ar
                ? 'اتعلمنا حاجة جديدة عنك النهارده'
                : 'We learned something new about you today'
              : undefined
          }
          action={
            <Button variant="primary" size="lg" onClick={onFinish}>
              {ar ? 'تمام' : 'Done'}
            </Button>
          }
        />
      </Shell>
    );
  }

  // ── practising ───────────────────────────────────────────────────────────
  return (
    <Shell ar={ar} companion={busy ? 'thinking' : 'listening'}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="t-label text-accent-screen-ink">{ar ? 'تدريب' : 'Practice'}</p>
          <h2 className="t-heading text-ink">{skillName}</h2>
        </div>
        <Pill tone="blue">
          <span dir="ltr" className="tabular-nums">{activityIndex + 1}/{activities.length}</span>
        </Pill>
      </div>

      <LadderProgress current={itemIndex + 1} total={items.length} ar={ar} label={ar ? 'النشاط' : 'This activity'} />

      {item && (
        <LadderItemCard
          key={item.item_id}
          ar={ar}
          item={item}
          onAnswer={answer}
          onSpeak={(t) => speak?.(t)}
          disabled={busy}
          hintMode={noHint ? 'none' : showHintAlways ? 'always' : hintOnRequest ? 'request' : 'request'}
        />
      )}
    </Shell>
  );
}

/**
 * Practice shares the assessment's shell shape on purpose: from the child's
 * side these are the same activity, and a different frame would make practice
 * feel like a different, harder thing. Only the accent differs — coral for
 * doing, green for getting to know you.
 */
function Shell({
  children,
  ar,
  companion,
  onBack,
}: {
  children: React.ReactNode;
  ar: boolean;
  companion?: 'listening' | 'thinking';
  onBack?: () => void;
}) {
  return (
    <ScreenFrame
      accent="coral"
      width="md"
      childMode
      center
      topBar={
        <TopBar
          ar={ar}
          onBack={onBack}
          backLabel={ar ? 'رجوع' : 'Back'}
          title={ar ? 'تدريب' : 'Practice'}
          actions={<ChromeActions />}
        />
      }
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
