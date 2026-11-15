import React, { useEffect, useState } from 'react';
import { Surface, ProgressTrack } from './brand';
import { PROBE_CONFIG } from '../../../../iris/engines/adaptiveProbe.js';
import { decideOutcome, decideOutcomeFromCorrect } from '../ladderObservations.js';

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
 * Kid-legible "how much is left" chip for the probe phase (std-accom §2 /
 * audit W14: progress predictability — a child must never feel a session
 * simply disappears).
 *
 * ── WHY IT SAYS "تقريباً" ──────────────────────────────────────────────────
 * The engine bounds the session with `PROBE_CONFIG.SESSION_ITEM_BUDGET`, but
 * it does not expose an exact count of items REMAINING: tracks climb, step
 * down, re-sample and rescue, so the real end can come earlier than the
 * budget ceiling. Rather than invent precision, this chip shows an honest
 * soft indicator computed from items already done plus the engine's budget,
 * and labels it "تقريباً" (roughly). It counts missions, never performance —
 * no accuracy, no rank, nothing score-shaped.
 */
export function LadderRemainingChip({ itemsAnswered, ar }: { itemsAnswered: number; ar: boolean }) {
  const done = Math.max(0, Math.round(itemsAnswered || 0));
  const remainingItems = Math.max(0, PROBE_CONFIG.SESSION_ITEM_BUDGET - done);
  const remainingMissions = Math.ceil(remainingItems / PROBE_CONFIG.ITEMS_PER_VISIT);
  // Arabic-Indic digits read more naturally to the child than Latin ones.
  const num = (v: number) => {
    try { return ar ? v.toLocaleString('ar-EG') : String(v); } catch { return String(v); }
  };
  const text = done > 0 && remainingMissions <= 1
    ? (ar ? 'قربنا نخلص!' : 'Almost done!')
    : (ar
        ? `المهمة ${num(done + 1)} · فاضل كم little وهنخلص`
        : `Mission ${done + 1} · a few little games to go`);
  return (
    <p
      className="ps-ghost-chip"
      role="status"
      aria-label={ar ? `${text} — تقريباً` : `${text} — roughly`}
      style={{ marginTop: 10 }}
    >
      <span>{text}</span>
      <span style={{ opacity: 0.7, marginInlineStart: 8 }}>{ar ? 'تقريباً' : 'roughly'}</span>
    </p>
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

/** ── av2 adaptive-assessment timing (spec §1/§6) ──────────────────────────
 * None of these are TIME PRESSURE. The dwell window never sounds, never
 * counts down on screen, and never advances the child by itself — it only
 * decides when the calm "مش عارف؟ خلينا نكمّل" chip becomes visible, and
 * pressing it is always the child's (or the helper's) choice.
 */
const NO_RESPONSE_DWELL_MS = 12000;
/** A short beat so the child sees their choice register — unchanged for v1. */
const SETTLE_MS = 550;
/** How long the gentle end-state copy stays up before the screen advances. */
const NOT_DEMONSTRATED_MSG = ['جميل إنك جربت! نكمّل لحاجة تانية', 'Thanks for trying! Let’s move to another game'];
const INSUFFICIENT_MSG = ['تمام، خلصنا دي — ممكن نرجعلها بعدين', 'All done with this one — we can come back later'];

/**
 * The card.
 *
 * ── hintMode ───────────────────────────────────────────────────────────────
 *   'none'                 practice INDEPENDENT/CHALLENGE tiers
 *   'request'              practice — the child can ask for the hint
 *   'always'               practice FOUNDATION — the hint is on from the start
 *   'adaptive-assessment'  av2 child assessment — the observation pipeline:
 *       · first miss  → the existing hint is offered ONCE (settle UI, no red
 *         X, no correction said); a correct retry records
 *         `demonstrated_with_support` at prompt_level 1
 *       · second miss → `not_demonstrated` with the §6 gentle copy and an
 *         automatic advance — never a failure screen
 *       · long dwell  → a calm no-response chip appears (never auto-fires);
 *         pressing it records `insufficient`, not a failure
 *       · helper-present + bank `helper_confirm` item (COMM.LABEL-type) → a
 *         "بابا/ماما أكد" button is a valid response path recording
 *         `demonstrated_with_support` at prompt_level 2 — an ANY-VOCAL
 *         acceptance route, because expressive items never require speech
 *   Every resolution also reports a decision record through `onObserved`, so
 *   the context can build the §1 observation. Tap-anything-tallies practice
 *   modes are untouched: they never see any of this code path.
 */
export function LadderItemCard({
  ar, item, fallbackPrompt, onAnswer, onSpeak, disabled = false, hintMode = 'none',
  onObserved, helperPresent = false,
}: {
  ar: boolean;
  item: any;
  fallbackPrompt?: string;
  /** `decision` is only supplied in adaptive-assessment mode. */
  onAnswer: (correct: boolean, decision?: any) => void;
  onSpeak?: (t: string, lang?: 'ar' | 'en') => void;
  disabled?: boolean;
  hintMode?: 'none' | 'request' | 'always' | 'adaptive-assessment';
  /** Reports the frozen-outcome decision record for the item as it settles. */
  onObserved?: (decision: any) => void;
  /** The run-level helper switch (std-accom §17). Enables helper-confirm. */
  helperPresent?: boolean;
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
  /* ── adaptive-assessment only state ── */
  /** Wrong answers on THIS item so far: 0, then 1 (hint offered), then end. */
  const [misses, setMisses] = useState(0);
  /** The card is in its end state — locked while the gentle copy is up. */
  const [locked, setLocked] = useState(false);
  /** A recorded answer happened at all (stops the dwell chip from offering). */
  const [answered, setAnswered] = useState(false);
  /** The dwell window passed with no response — the calm chip is now visible. */
  const [showDwellChip, setShowDwellChip] = useState(false);
  /** The gentle end-state copy (spec §6) shown before advancing. */
  const [endMsg, setEndMsg] = useState<[string, string] | null>(null);

  const adaptive = hintMode === 'adaptive-assessment';
  const off = disabled || locked;

  const prompt = (ar ? item?.prompt?.ar : item?.prompt?.en) ?? fallbackPrompt;
  const options: string[] = item?.options ?? [];
  const isTapEach = item?.expected_taps != null && options.length === 0;
  const isOrdered = Array.isArray(item?.correct_order) && options.length > 0;

  /** A short beat so the child sees their choice register. No "wrong" is said. */
  const settle = (correct: boolean) => {
    setTimeout(() => {
      setPicked(null); setTaps([]); setOrder([]);
      onAnswer(correct);
    }, SETTLE_MS);
  };

  /**
   * The adaptive end path: freeze the card, report the decision, and — for a
   * not_demonstrated / insufficient end state — show the §6 gentle copy for a
   * beat before the parent advances. A red X never appears anywhere in this
   * flow; the only visible "wrong" is the plain picked highlight already on
   * the button, which is removed before the retry opens.
   */
  const resolve = (kind: string, response: any) => {
    const decision = decideOutcome(kind, { hintUsed: hintShown }) ?? decideOutcomeFromCorrect(kind === 'first-correct');
    const reported = { ...decision, kind, response };
    setLocked(true);
    setAnswered(true);
    if (kind === 'second-miss') setEndMsg(NOT_DEMONSTRATED_MSG);
    if (kind === 'no-response') setEndMsg(INSUFFICIENT_MSG);
    const delay = kind === 'second-miss' ? 1800 : kind === 'no-response' ? 1500 : SETTLE_MS;
    setTimeout(() => {
      setPicked(null); setTaps([]); setOrder([]);
      try { onObserved?.(reported); } catch { /* the observation net must never break the game */ }
      onAnswer(decision.correct, reported);
    }, delay);
  };

  /**
   * A first miss in adaptive mode is not an end — it is the HINT MOMENT: the
   * selection clears (no correction is ever shown), the existing hint opens
   * once, and the item re-arms for a supported retry. Listen items replay
   * their word: a replayed audio prompt is itself a prompt_level 1 support.
   */
  const offerHintOnce = () => {
    setMisses(1);
    setTimeout(() => {
      setPicked(null); setTaps([]); setOrder([]);
      setHintShown(true);
      if (audioText && onSpeak) { try { onSpeak(audioText, 'ar'); } catch { /* audio is best-effort */ } }
    }, SETTLE_MS);
  };

  const chooseOne = (i: number) => {
    if (off || picked !== null) return;
    setPicked(i);
    const correct = i === (item?.correct_index ?? 0);
    if (!adaptive) { settle(correct); return; }
    if (correct) resolve(misses > 0 || hintShown ? 'retry-correct' : 'first-correct', { index: i });
    else if (misses === 0) offerHintOnce();
    else resolve('second-miss', { index: i });
  };

  const toggleTap = (i: number) => {
    if (off) return;
    setTaps((t) => (t.includes(i) ? t.filter((x) => x !== i) : [...t, i]));
  };

  const pushOrder = (i: number) => {
    if (off || order.includes(i)) return;
    const next = [...order, i];
    setOrder(next);
    if (next.length === (item.correct_order?.length ?? options.length)) {
      const chosen = next.map((k) => options[k]);
      const correct = chosen.every((v: string, k: number) => v === item.correct_order[k]);
      if (!adaptive) { settle(correct); return; }
      if (correct) resolve(misses > 0 || hintShown ? 'retry-correct' : 'first-correct', { order: next });
      else if (misses === 0) offerHintOnce();
      else resolve('second-miss', { order: next });
    }
  };

  /** The tap-each "I'm done" press, per mode. */
  const submitTaps = () => {
    const correct = taps.length === item.expected_taps;
    if (!adaptive) { settle(correct); return; }
    if (correct) resolve(misses > 0 || hintShown ? 'retry-correct' : 'first-correct', { taps, count: taps.length });
    else if (misses === 0) offerHintOnce();
    else resolve('second-miss', { taps, count: taps.length });
  };

  /** Helper-present confirm path (COMM.LABEL-type items, spec §2 anti-rule:
   *  expressive items NEVER require vocal output). The grown-up presses it;
   *  it is a full, valid response, not an excuse. */
  const helperConfirm = () => {
    if (off || answered) return;
    resolve('helper-confirm', { confirmed: true, reason: 'helper_confirm' });
  };

  /** The child opted out of this item via the calm chip. Never a failure. */
  const passOnItem = () => {
    if (off || answered) return;
    resolve('no-response', { reason: 'no_response' });
  };

  const audioText = typeof item?.audio_ar === 'string' && item.audio_ar.trim() ? item.audio_ar.trim() : null;

  // Listen items are blind unless the WORD itself is spoken — not the instruction.
  // Autoplay it when the item appears (after a gesture has unlocked audio) and
  // let the speaker replay the word rather than the prompt text.
  useEffect(() => {
    if (!audioText || !onSpeak) return;
    const t = setTimeout(() => onSpeak(audioText, 'ar'), 650);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.item_id]);

  /* The dwell window: a plain 12 s timer that only REVEALS a choice. It is
     frozen while the parent holds the card (break / busy) and ends the moment
     anything was answered. Nothing ever fires by itself. */
  useEffect(() => {
    if (!adaptive || disabled || answered || showDwellChip) return;
    const t = setTimeout(() => setShowDwellChip(true), NO_RESPONSE_DWELL_MS);
    return () => clearTimeout(t);
  }, [adaptive, disabled, answered, showDwellChip, item?.item_id]);

  const header = (
    <>
      {prompt && (
        <div className="flex items-start gap-3">
          <h2 className="text-xl font-black text-ink flex-1 leading-relaxed">{prompt}</h2>
          {onSpeak && (
            <button
              onClick={() => onSpeak(audioText ?? prompt, audioText ? 'ar' : undefined)}
              aria-label={audioText ? (ar ? 'اسمع الكلمة' : 'Hear the word') : (ar ? 'اسمع السؤال' : 'Hear the question')}
              className="rounded-full bg-surface-sunk border border-hairline w-11 h-11 text-lg shrink-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue"
            >
              🔊
            </button>
          )}
        </div>
      )}
      {audioText && !item?.stimulus && (
        <div className="text-center py-4 rounded-brand-sm bg-surface-sunk">
          <span className="text-5xl" role="img" aria-label={ar ? 'اسمع' : 'Listen'}>🔊</span>
          <p className="mt-2 text-lg font-black text-ink" dir="auto">{ar ? 'اسمع كويس' : 'Listen closely'}</p>
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
      {/* Adaptive mode without bank hint text still re-arms gently: the miss
          must never leave the child staring at a silent screen. */}
      {adaptive && hintShown && !item?.hint && (
        <p className="text-sm text-brand-blue-ink bg-brand-blue-wash rounded-brand-sm p-3 leading-relaxed" dir="auto">
          {ar ? 'خد وقتك — بص على الاختيارات من تاني' : 'Take your time — look at the choices again'}
        </p>
      )}

      {/* ── helper-confirm (adaptive mode, helper switch on, bank-flagged
          COMM.LABEL-type items only) ─────────────────────────────────────── */}
      {adaptive && helperPresent && item?.helper_confirm === true && !answered && !locked && (
        <button
          type="button"
          onClick={helperConfirm}
          aria-label={ar ? 'المساعد أكد إن الطفل عملها — ضغطك ده إجابة كاملة' : 'Grown-up confirms the child did it — this press is a full response'}
          className="w-full rounded-full border-2 border-brand-green bg-brand-green-wash px-5 py-3 text-lg font-black text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-green"
          style={{ minHeight: 48 }}
        >
          <span aria-hidden="true">🤝 </span>
          {ar ? 'بابا/ماما أكد' : 'بابا/ماما confirmed'}
        </button>
      )}
    </>
  );

  /** The calm end-state copy + the no-response chip. Both below the board so
   *  the last thing on screen is always forward motion, never a mark. */
  const foot = (
    <>
      {adaptive && showDwellChip && !answered && !locked && (
        <button
          type="button"
          onClick={passOnItem}
          aria-label={ar ? 'مش عارف؟ خلينا نكمّل — مفيش أي مشكلة' : 'Not sure? Let’s keep going — no problem at all'}
          className="w-full rounded-full ps-ghost-chip focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue"
          style={{ minHeight: 48, cursor: 'pointer', textAlign: 'center' }}
        >
          <span aria-hidden="true">🎈 </span>
          {ar ? 'مش عارف؟ خلينا نكمّل' : 'Not sure? Let’s keep going'}
        </button>
      )}
      {endMsg && (
        <p
          role="status"
          aria-live="polite"
          className="text-center text-lg font-black text-brand-blue-ink bg-brand-blue-wash rounded-brand-sm p-3"
          dir="auto"
        >
          {ar ? endMsg[0] : endMsg[1]}
        </p>
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
              disabled={off}
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
          onClick={submitTaps}
          disabled={off}
          className="w-full rounded-full bg-brand-blue-ink text-white px-6 py-3 font-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-green"
          style={{ minHeight: 48 }}
        >
          {ar ? 'خلصت' : "I'm done"}
        </button>
        {foot}
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
                disabled={off || pos !== -1}
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
        {foot}
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
            disabled={off || picked !== null}
            dir="auto"
            className={`rounded-brand-sm border-2 px-4 py-6 text-3xl font-black transition-colors
              focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue
              ${picked === i ? 'bg-brand-blue-wash border-brand-blue' : 'bg-surface border-hairline'}`}
          >
            {opt}
          </button>
        ))}
      </div>
      {foot}
    </Surface>
  );
}
