/**
 * AudioControl — the child-facing audio access controls: mute/unmute, optional
 * background music, and a repeat-what-was-said button.
 *
 * This exists because the project's evidence review treats audio as an ACCESS
 * setting to be made adjustable, not as a learning channel
 * (research_deliverables/30 H15; doc 05 §5 "ability to reduce or mute
 * background audio/animation"). Controls are therefore always reachable, sized
 * for young/imprecise touch (44px+ targets), labelled for screen readers, and
 * never signal state by colour alone — each button carries a distinct glyph and
 * an accessible name that states the current state.
 */
import React from 'react';
import { useAudio } from '../../../contexts/AudioContext';

export function AudioControl({
  language = 'ar',
  /** Optional: text to re-speak when the repeat button is pressed. */
  repeatText,
}: {
  language?: 'ar' | 'en';
  repeatText?: string;
}) {
  const { isEnabled, toggleAudio, musicEnabled, toggleMusic, speak, caption } = useAudio();
  const ar = language === 'ar';

  const btn =
    'w-11 h-11 rounded-brand border-2 shadow-brand-sm flex items-center justify-center text-xl ' +
    'transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue ' +
    'disabled:opacity-40 disabled:cursor-not-allowed';

  const toRepeat = repeatText || caption;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggleAudio}
        aria-pressed={isEnabled}
        aria-label={ar ? (isEnabled ? 'الصوت مفتوح. اضغط للكتم.' : 'الصوت مكتوم. اضغط للتشغيل.') : isEnabled ? 'Sound is on. Press to mute.' : 'Sound is off. Press to unmute.'}
        title={ar ? (isEnabled ? 'كتم الصوت' : 'تشغيل الصوت') : isEnabled ? 'Mute' : 'Unmute'}
        className={`${btn} bg-surface border-hairline hover:border-hairline`}
      >
        <span aria-hidden="true">{isEnabled ? '🔊' : '🔇'}</span>
      </button>

      <button
        type="button"
        onClick={() => toRepeat && speak(toRepeat, language)}
        disabled={!isEnabled || !toRepeat}
        aria-label={ar ? 'إعادة سماع التعليمات' : 'Hear the instruction again'}
        title={ar ? 'إعادة السماع' : 'Repeat'}
        className={`${btn} bg-surface border-hairline hover:border-hairline`}
      >
        <span aria-hidden="true">🔁</span>
      </button>

      <button
        type="button"
        onClick={toggleMusic}
        aria-pressed={musicEnabled}
        disabled={!isEnabled}
        aria-label={ar ? (musicEnabled ? 'الموسيقى الهادئة مفعّلة. اضغط لإيقافها.' : 'الموسيقى الهادئة متوقفة. اضغط لتشغيلها.') : musicEnabled ? 'Soft music is on. Press to turn it off.' : 'Soft music is off. Press to turn it on.'}
        title={ar ? 'موسيقى هادئة اختيارية' : 'Optional soft background music'}
        className={`${btn} ${
          musicEnabled
            ? 'bg-brand-purple-wash border-brand-purple'
            : 'bg-surface border-hairline hover:border-hairline'
        }`}
      >
        {/* Glyph differs by state so music on/off is not signalled by colour alone. */}
        <span aria-hidden="true">{musicEnabled ? '🎵' : '🎶'}</span>
      </button>
    </div>
  );
}
