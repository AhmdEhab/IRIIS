import React, { useState } from 'react';
import { Surface, ProgressTrack } from './brand';

/**
 * The shared item renderer for the ladder assessment AND ladder practice.
 *
 * It lives here, in one file, on purpose. Two copies of a question renderer
 * drift: one grows a response type or a hint mode the other lacks, and a child
 * hits a dead screen on whichever path was not updated. Both callers import
 * this.
 *
 * It renders all three response shapes the Arabic bank actually contains —
 * single select, tap-each ("give me three"), and ordered select (segmenting a
 * word into its sounds). A renderer that only handled multiple choice stalled
 * the assessment on the first cardinality probe.
 */

/**
 * A progress bar with no numbers attached to performance — it shows how far
 * through the activity the child is, never how well they are doing.
 */
/**
 * Progress through an activity.
 *
 * ── WHY DOTS AND NOT A BAR ────────────────────────────────────────────────
 * A filled bar reads as "how much is left to endure". A row of dots reads as
 * "how many we have collected", which is the register everything else in Child
 * Mode is written in — stars, "we learned something new", no scores. The brand
 * system already had `ProgressTrack` for exactly this and it had zero render
 * sites while this file drew its own bar.
 *
 * Above ten steps the dot row stops being readable at 390px, so it falls back
 * to a plain "3 / 14" count rather than a bar. Either way the value is also
 * announced as text, so nothing is carried by shape alone.
 */
export function LadderProgress({ current, total, ar, label }: { current: number; total: number; ar: boolean; label: string }) {
  const many = total > 10;
  return (
    <div>
      <p className="t-label text-ink-muted mb-1.5">{label}</p>
      {many ? (
        <p
          className="t-small text-ink tabular-nums"
          dir="ltr"
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-label={ar ? 'التقدّم في النشاط' : 'Activity progress'}
        >
          {current} / {total}
        </p>
      ) : (
        <ProgressTrack
          total={total}
          done={current}
          tone="green"
          label={ar ? `${current} من ${total}` : `${current} of ${total}`}
        />
      )}
    </div>
  );
}

/**
 * One item, in whichever of the three response shapes the bank declares.
 *
 * The bank contains genuine tap-count items ("give me three") and ordered
 * items (segmenting a word into its sounds), not only multiple choice. A card
 * that could only render single-select would stall the assessment on the first
 * cardinality probe — which is exactly what it did before this was written.
 */

/**
 * One item, in whichever of the three response shapes the bank declares.
 *
 * The bank contains genuine tap-count items ("give me three") and ordered
 * items (segmenting a word into its sounds), not only multiple choice. A card
 * that could only render single-select would stall the assessment on the first
 * cardinality probe — which is exactly what it did before this was written.
 */
export function LadderItemCard({
  ar, item, fallbackPrompt, onAnswer, onSpeak, disabled = false, hintMode = 'none',
}: {
  ar: boolean;
  item: any;
  fallbackPrompt?: string;
  onAnswer: (correct: boolean) => void;
  onSpeak?: (t: string) => void;
  disabled?: boolean;
  /**
   * Comes from the plan's scaffold flags, never chosen here:
   *   'none'    assessment, and the INDEPENDENT/CHALLENGE tiers
   *   'request' the child can ask for the hint
   *   'always'  FOUNDATION — the hint is on screen from the start
   */
  hintMode?: 'none' | 'request' | 'always';
}) {
  /**
   * `data-item-id` on the card root is an observability hook, not decoration.
   * The end-to-end adaptive test has to be able to answer a specific item
   * correctly or incorrectly on purpose; without a stable handle it can only
   * tap blindly, and a blind run cannot prove that the engine moved the rung
   * because of the evidence rather than by coincidence. It carries a bank id,
   * never anything about the child.
   */
  const [picked, setPicked] = useState<number | null>(null);
  const [taps, setTaps] = useState<number[]>([]);
  const [order, setOrder] = useState<number[]>([]);
  const [hintShown, setHintShown] = useState(hintMode === 'always');

  const prompt = (ar ? item?.prompt?.ar : item?.prompt?.en) ?? fallbackPrompt;
  const options: string[] = item?.options ?? [];
  const isTapEach = item?.expected_taps != null && options.length === 0;
  const isOrdered = Array.isArray(item?.correct_order) && options.length > 0;

  /** A short beat so the child sees their choice register. No "wrong" is said. */
  const settle = (correct: boolean) => {
    setTimeout(() => {
      setPicked(null); setTaps([]); setOrder([]);
      onAnswer(correct);
    }, 550);
  };

  const chooseOne = (i: number) => {
    if (disabled || picked !== null) return;
    setPicked(i);
    settle(i === (item?.correct_index ?? 0));
  };

  const toggleTap = (i: number) => {
    if (disabled) return;
    setTaps((t) => (t.includes(i) ? t.filter((x) => x !== i) : [...t, i]));
  };

  const pushOrder = (i: number) => {
    if (disabled || order.includes(i)) return;
    const next = [...order, i];
    setOrder(next);
    if (next.length === (item.correct_order?.length ?? options.length)) {
      const chosen = next.map((k) => options[k]);
      settle(chosen.every((v, k) => v === item.correct_order[k]));
    }
  };

  const header = (
    <>
      {prompt && (
        <div className="flex items-start gap-3">
          <h2 className="text-xl font-black text-ink flex-1 leading-relaxed">{prompt}</h2>
          {onSpeak && (
            <button
              onClick={() => onSpeak(prompt)}
              aria-label={ar ? 'اسمع السؤال' : 'Hear the question'}
              className="rounded-full bg-surface-sunk border border-hairline w-11 h-11 text-lg shrink-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue"
            >
              🔊
            </button>
          )}
        </div>
      )}
      {item?.stimulus && (
        <div className="text-center py-4 rounded-brand-sm bg-surface-sunk">
          <span className="text-5xl font-black text-ink" dir="auto">{item.stimulus}</span>
        </div>
      )}

      {/* The hint is help, never a correction. It never says what is wrong. */}
      {hintMode !== 'none' && item?.hint && (
        hintShown ? (
          <p className="text-sm text-brand-blue-ink bg-brand-blue-wash rounded-brand-sm p-3 leading-relaxed" dir="auto">
            💡 {ar ? item.hint.ar : item.hint.en}
          </p>
        ) : (
          <button
            type="button"
            onClick={() => setHintShown(true)}
            className="text-sm font-bold text-brand-blue underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue rounded"
          >
            {ar ? '💡 محتاج مساعدة؟' : '💡 Need a hint?'}
          </button>
        )
      )}
    </>
  );

  // ── tap-each: "give me three", or count this set ─────────────────────────
  if (isTapEach) {
    const pool = Array.from({ length: item.pool_size ?? item.set_size ?? item.expected_taps ?? 5 });
    return (
      <Surface elevation="raised" className="p-6 space-y-5" data-item-id={item?.item_id ?? undefined}>
        {header}
        <div className="grid grid-cols-4 gap-3" data-response="tap-each">
          {pool.map((_, i) => (
            <button
              key={i}
              onClick={() => toggleTap(i)}
              disabled={disabled}
              aria-pressed={taps.includes(i)}
              className={`rounded-brand-sm border-2 py-6 text-3xl transition-colors
                focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue
                ${taps.includes(i) ? 'bg-brand-green-wash border-brand-green' : 'bg-surface border-hairline'}`}
            >
              🟠
            </button>
          ))}
        </div>
        <button
          onClick={() => settle(taps.length === item.expected_taps)}
          disabled={disabled}
          className="w-full rounded-full bg-brand-blue-ink text-white px-6 py-3 font-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-green"
        >
          {ar ? 'خلصت' : "I'm done"}
        </button>
      </Surface>
    );
  }

  // ── ordered select: tap the sounds in order ──────────────────────────────
  if (isOrdered) {
    return (
      <Surface elevation="raised" className="p-6 space-y-5" data-item-id={item?.item_id ?? undefined}>
        {header}
        <div className="grid grid-cols-3 gap-3" data-response="ordered">
          {options.map((opt, i) => {
            const pos = order.indexOf(i);
            return (
              <button
                key={`${opt}-${i}`}
                onClick={() => pushOrder(i)}
                disabled={disabled || pos !== -1}
                dir="auto"
                className={`relative rounded-brand-sm border-2 px-4 py-6 text-3xl font-black transition-colors
                  focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue
                  ${pos !== -1 ? 'bg-brand-green-wash border-brand-green' : 'bg-surface border-hairline'}`}
              >
                {opt}
                {pos !== -1 && (
                  <span dir="ltr" className="absolute top-1 end-2 text-xs tabular-nums text-brand-green-ink">
                    {pos + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Surface>
    );
  }

  // ── single select ────────────────────────────────────────────────────────
  return (
    <Surface elevation="raised" className="p-6 space-y-5" data-item-id={item?.item_id ?? undefined}>
      {header}
      <div className="grid grid-cols-2 gap-3" data-response="single">
        {options.map((opt, i) => (
          <button
            key={`${opt}-${i}`}
            onClick={() => chooseOne(i)}
            disabled={disabled || picked !== null}
            dir="auto"
            className={`rounded-brand-sm border-2 px-4 py-6 text-3xl font-black transition-colors
              focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue
              ${picked === i ? 'bg-brand-green-wash border-brand-green' : 'bg-surface border-hairline'}`}
          >
            {opt}
          </button>
        ))}
      </div>
    </Surface>
  );
}
