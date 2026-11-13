/**
 * ChildProgressDots — a child-friendly progress representation.
 *
 * Replaces plain "Question 7 / 44" / "3 / 6" counters (Phase 8 of the
 * product brief explicitly asks for this). Shows a row of dots: filled for
 * done, glowing/current for the active one, empty for what's left — with an
 * accessible text alternative for screen readers. When there would be too
 * many dots to read at a glance, it collapses to a single filled bar instead.
 */
import React from 'react';

export function ChildProgressDots({
  total,
  currentIndex, // 0-based index of the item currently being shown
  language = 'ar',
  maxDots = 10,
}: {
  total: number;
  currentIndex: number;
  language?: 'ar' | 'en';
  maxDots?: number;
}) {
  const label = language === 'ar'
    ? `الخطوة ${currentIndex + 1} من ${total}`
    : `Step ${currentIndex + 1} of ${total}`;

  if (total > maxDots) {
    const pct = Math.min(100, Math.round(((currentIndex + 1) / total) * 100));
    return (
      <div className="w-full" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="h-4 w-full rounded-full bg-surface-sunk overflow-hidden border-2 border-hairline">
          <div
            className="h-full rounded-full bg-brand-green transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={total} aria-label={label}>
      {Array.from({ length: total }).map((_, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <span
            key={i}
            aria-hidden="true"
            className={`rounded-full transition-all duration-300 ${
              active
                ? 'w-5 h-5 bg-brand-yellow shadow-[0_0_0_4px_rgba(251,191,36,0.25)]'
                : done
                ? 'w-3.5 h-3.5 bg-brand-green'
                : 'w-3.5 h-3.5 bg-surface-sunk'
            }`}
          />
        );
      })}
    </div>
  );
}
