/**
 * RewardBadge — lightweight, non-competitive gamification (Phase 12).
 *
 * Shows a star count and, past small milestones, a badge. No leaderboards,
 * no ranking against other children, no comparison — just "you" against
 * "yesterday-you". Stars are a purely presentational counter computed in
 * IrisContext from completed sessions and strong-performance decisions; the
 * adaptive engine itself has no notion of "stars" and is untouched by this.
 */
import React from 'react';

const MILESTONES = [
  { at: 3, emoji: '🌱', ar: 'بداية رائعة', en: 'Great start' },
  { at: 6, emoji: '🌟', ar: 'نجم صاعد', en: 'Rising star' },
  { at: 10, emoji: '🏆', ar: 'بطل التعلم', en: 'Learning champion' },
];

export function RewardBadge({ stars, language = 'ar' }: { stars: number; language?: 'ar' | 'en' }) {
  const badge = [...MILESTONES].reverse().find((m) => stars >= m.at);
  const ar = language === 'ar';
  // One accessible sentence for the whole badge, so a screen reader says
  // "5 stars, Rising star" instead of spelling out each decorative emoji.
  const label = ar
    ? `${stars} نجمة${badge ? `، ${badge.ar}` : ''}`
    : `${stars} stars${badge ? `, ${badge.en}` : ''}`;

  return (
    <div
      className="flex items-center gap-2 bg-surface/90 rounded-full px-4 py-2 border-2 border-brand-yellow shadow-brand-sm"
      role="status"
      aria-label={label}
    >
      <span className="text-xl" aria-hidden="true">⭐</span>
      <span className="font-black text-brand-yellow-ink text-lg" aria-hidden="true">{stars}</span>
      {badge && (
        <span
          aria-hidden="true"
          className="ms-2 flex items-center gap-1 text-sm font-bold text-brand-purple-ink bg-brand-purple-wash rounded-full px-2 py-0.5"
        >
          <span>{badge.emoji}</span>
          <span>{ar ? badge.ar : badge.en}</span>
        </span>
      )}
    </div>
  );
}
