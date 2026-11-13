import React from 'react';
import { useAudio } from '../../../contexts/AudioContext';

/**
 * On-screen caption for whatever IRIS just said.
 *
 * This is not decoration — it is the visual equivalent that the project's
 * evidence review requires for any audio content (research_deliverables/30,
 * H15: audio must be "optional, adjustable, never sudden or loud", with
 * "visual/captioned equivalents"). Documented hearing loss in this population
 * is frequently undetected, so nothing may be conveyed by sound alone.
 *
 * It renders whenever there is a caption to show — including when sound is
 * muted — so a child using IRIS in silence receives exactly the same
 * information as a child with sound on.
 */
export function NarrationCaption({
  language,
  className = '',
}: {
  language: 'ar' | 'en';
  className?: string;
}) {
  const { caption, isSpeaking, isEnabled } = useAudio();
  if (!caption) return null;

  const ar = language === 'ar';

  return (
    <div
      // polite: announce after the current task, never interrupt a screen reader
      aria-live="polite"
      aria-atomic="true"
      className={`mx-auto max-w-2xl rounded-brand bg-surface/85 border border-hairline px-4 py-2.5
        text-center text-ink-muted shadow-brand-sm backdrop-blur-sm ${className}`}
      dir={ar ? 'rtl' : 'ltr'}
    >
      <span className="inline-flex items-center gap-2">
        {/* Non-colour, non-audio indicator of speech state (icon + text both). */}
        <span aria-hidden="true" className="text-base">
          {isEnabled && isSpeaking ? '🗣️' : '💬'}
        </span>
        <span className="text-base font-semibold leading-snug">{caption}</span>
      </span>
    </div>
  );
}
