import React from 'react';
import { IrisMascot } from './IrisMascot';
import { useLanguage } from '../../../contexts/LanguageContext';
import { lineFor, moodFor, type CompanionMoment } from './companionLines';

/**
 * IrisCompanion — the companion, addressed by MOMENT rather than by mood.
 *
 * WHY THIS EXISTS ON TOP OF IrisMascot
 * A screen knows what just happened ("the child got it right"); it should not
 * also have to know which face and which words go with that. Every call site
 * that reaches for `IrisMascot mood="happy" messageAr="..." messageEn="..."`
 * is re-deciding the companion's personality locally, which is how a
 * character drifts from screen to screen. Here a screen names the moment and
 * the companion's voice stays consistent everywhere.
 *
 * IrisMascot is unchanged and still available for the few places that need
 * direct control of the mood without a line.
 *
 * SILENT BY DESIGN
 * This renders visuals and text only. Narration stays with the screens'
 * existing `say()` / `speak()` calls, so adding a companion to a screen can
 * never introduce a second voice talking over the first.
 */
export function IrisCompanion({
  moment,
  size = 'md',
  variant = 0,
  showLine = true,
  onDark = false,
  className = '',
  title,
}: {
  moment: CompanionMoment;
  size?: 'sm' | 'md' | 'lg';
  /** Picks deterministically between the small set of lines for this moment. */
  variant?: number;
  /** Set false where the surrounding screen already carries the words. */
  showLine?: boolean;
  onDark?: boolean;
  className?: string;
  /** Accessible name, when the companion is not purely decorative. */
  title?: string;
}) {
  const { language } = useLanguage();
  const lang = language === 'ar' ? 'ar' : 'en';

  // The bubble already renders the line as real text, so the character itself
  // stays decorative — announcing both would read the same words twice to a
  // screen reader. `title` is honoured only when there is no visible line.
  const needsLabel = !showLine && !!title;

  return (
    <div className={className} role={needsLabel ? 'img' : undefined} aria-label={needsLabel ? title : undefined}>
      <IrisMascot
        mood={moodFor(moment)}
        size={size}
        messageAr={showLine ? lineFor(moment, 'ar', variant) : undefined}
        messageEn={showLine ? lineFor(moment, 'en', variant) : undefined}
        language={lang}
        onDark={onDark}
      />
    </div>
  );
}
