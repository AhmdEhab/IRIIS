/**
 * "What changed, and why" — the parent-facing view of the adaptation record.
 *
 * ── WHY THIS COMPONENT EXISTS ─────────────────────────────────────────────
 * IRIS claims that it observes performance, adapts the pathway from that
 * evidence, records why, and explains it to the parent. Everything up to
 * "records why" was true before this file: the engine decided, the trace was
 * built, the row was written. The last link was missing — a parent could not
 * see any of it. An audit trail nobody can read is not an explanation.
 *
 * Everything rendered here comes from an IRIS-ADAPTATION-TRACE/1 record. The
 * wording is a fixed template keyed on the reason code the engine emitted
 * (`explainAdaptation` in iris/parent/explain.js) — no model writes this text,
 * so it says the same thing every time for the same reason, and it can be
 * checked against the rule that fired.
 *
 * NEVER SHOWN, per doc 16: percentiles, age equivalents, IQ-like numbers,
 * comparisons to other children, clinical interpretation, predictions.
 * A "rung" is shown as a step number within one skill, never as an age or a
 * grade — those are the comparisons the product exists to avoid.
 */
import React from 'react';
import { explainAdaptation } from '../../../../iris/parent/explain.js';
import { Surface, BrandIcon } from './brand';
import type { IconName, BrandTone } from './brand';

/**
 * Tone per move, with the ink class written out in full.
 *
 * NOT `text-brand-${tone}-ink`. Tailwind scans source text, so a class
 * assembled at runtime is never generated and the icon silently loses its
 * colour. This codebase has been bitten by that twice; the literals stay.
 */
const MOVE_TONE: Record<string, { tone: BrandTone; ink: string }> = {
  CLIMB: { tone: 'green', ink: 'text-brand-green-ink' },
  AT_TOP: { tone: 'green', ink: 'text-brand-green-ink' },
  BACKSTEP: { tone: 'coral', ink: 'text-brand-coral-ink' },
  AT_BASE: { tone: 'coral', ink: 'text-brand-coral-ink' },
  HOLD: { tone: 'blue', ink: 'text-brand-blue-ink' },
  HOLD_ROTATE_FORMAT: { tone: 'blue', ink: 'text-brand-blue-ink' },
  HOLD_ADD_SCAFFOLD: { tone: 'yellow', ink: 'text-brand-yellow-ink' },
  SHIFT_MODALITY: { tone: 'yellow', ink: 'text-brand-yellow-ink' },
};
const DEFAULT_TONE = { tone: 'blue' as BrandTone, ink: 'text-brand-blue-ink' };

/** Drawn marks only — every name here is checked against the IconName union. */
const MOVE_ICON: Record<string, IconName> = {
  CLIMB: 'rocket',
  AT_TOP: 'star',
  BACKSTEP: 'sprout',
  AT_BASE: 'sprout',
  HOLD: 'pause',
  HOLD_ROTATE_FORMAT: 'repeat',
  HOLD_ADD_SCAFFOLD: 'heart',
  SHIFT_MODALITY: 'puzzle',
};

/** A single recorded adaptation. */
function TrailEntry({ trace, ar, showAudit }: { trace: any; ar: boolean; showAudit: boolean }) {
  const x = explainAdaptation(trace, ar ? 'ar' : 'en');
  if (!x) return null;

  const { tone, ink } = MOVE_TONE[x.move] ?? DEFAULT_TONE;
  const when = x.at ? new Date(x.at) : null;

  return (
    <Surface elevation="flat" tone={tone} className="p-4 space-y-2">
      <div className="flex items-start gap-3">
        <span className={`shrink-0 rounded-full p-2 bg-surface border border-hairline ${ink}`}>
          <BrandIcon name={MOVE_ICON[x.move] ?? 'info'} className="w-5 h-5" />
        </span>
        <div className="flex-1 min-w-0 space-y-1">
          {x.headline && <p className="t-body font-bold text-ink">{x.headline}</p>}
          <p className="t-body text-ink-muted">{x.reason}</p>
          {x.evidence && (
            <p className="t-small text-ink-muted">
              {x.evidence}
              {x.from_rung !== x.to_rung && (
                <span dir="ltr" className="ms-2 tabular-nums">
                  ({ar ? 'خطوة' : 'step'} {x.from_rung} → {x.to_rung})
                </span>
              )}
            </p>
          )}
          {trace.is_synthetic && (
            <p className="t-label text-brand-coral-ink">
              {ar ? 'بيانات توضيحية — ليست من طفلك' : 'Illustrative data — not from your child'}
            </p>
          )}
        </div>
        {when && (
          <time
            dateTime={x.at}
            dir="ltr"
            className="t-small text-ink-muted tabular-nums shrink-0"
          >
            {when.toLocaleDateString(ar ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short' })}
          </time>
        )}
      </div>

      {/**
        * The audit line. It is deliberately available rather than hidden: the
        * whole claim is that every adaptation is traceable to a named rule, and
        * a parent (or a specialist they show this to) can read the rule id and
        * the reason code straight off the screen and match it to the record.
        */}
      {showAudit && (
        <p dir="ltr" className="t-label text-ink-muted font-mono break-words pt-1 border-t border-hairline-soft">
          {x.rule_id} · {x.reason_code}
          {!x.has_approved_wording && (ar ? ' · بلا صياغة معتمدة' : ' · no approved wording')}
          {x.confidence ? ` · confidence ${x.confidence}` : ''}
        </p>
      )}
    </Surface>
  );
}

/**
 * The trail, newest first.
 *
 * `history` is the persisted record; `latest` is the round that just happened
 * and may not have reached the server yet. When there is nothing at all this
 * renders the honest absence rather than an encouraging placeholder — "not
 * enough observed yet" is a true statement and a useful one.
 */
export function AdaptationTrail({
  history = [], latest = null, ar, limit = 6, showAudit = true, error = null,
}: {
  history?: any[];
  latest?: any;
  ar: boolean;
  limit?: number;
  showAudit?: boolean;
  error?: string | null;
}) {
  // De-duplicate: the optimistic append means `latest` is usually already in
  // `history`. Matched on the trace's own timestamp + session id, which is
  // what makes one recorded round distinct from another.
  const key = (t: any) => `${t?.at ?? ''}|${t?.sessionId ?? ''}`;
  const seen = new Set<string>();
  const all = [...(history ?? []), ...(latest ? [latest] : [])]
    .filter((t) => {
      const k = key(t);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .reverse()
    .slice(0, limit);

  if (all.length === 0) {
    return (
      <div className="space-y-2">
        <p className="t-body text-ink-muted">
          {ar
            ? 'لم يتغيّر شيء في مسار طفلك بعد — لا توجد ملاحظات كافية. بعد جلسة أو جلستين سيظهر هنا ما تغيّر ولماذا.'
            : 'Nothing has changed in your child\'s pathway yet — there are not enough observations. After a session or two, what changed and why will appear here.'}
        </p>
        {error && (
          <p className="t-small text-brand-coral-ink">
            {ar
              ? 'تعذّر تحميل السجل من الخادم، لذلك قد يكون ناقصًا.'
              : 'The record could not be loaded from the server, so it may be incomplete.'}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {all.map((t, i) => <TrailEntry key={`${key(t)}-${i}`} trace={t} ar={ar} showAudit={showAudit} />)}
      <p className="t-small text-ink-muted">
        {ar
          ? 'كل تغيير هنا نتج عن أداء طفلك الملاحَظ، ومسجَّل مع القاعدة التي أنتجته. لا يوجد أي قرار مبني على تشخيص طفلك.'
          : 'Every change here came from your child\'s observed performance and is recorded with the rule that produced it. No decision is based on your child\'s diagnosis.'}
      </p>
      {error && (
        <p className="t-small text-brand-coral-ink">
          {ar ? 'قد يكون السجل ناقصًا: تعذّر الاتصال بالخادم.' : 'The record may be incomplete: the server could not be reached.'}
        </p>
      )}
    </div>
  );
}
