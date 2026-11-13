import React from 'react';
import { useAudio } from '../../../contexts/AudioContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { BarButton, BarAction } from './brand';

/**
 * The two controls that belong on every screen: mute and language.
 *
 * ── WHAT THIS REPLACES ────────────────────────────────────────────────────
 * `GlobalControls` — a glassmorphism pill fixed at `top-4 right-4 z-[100]`,
 * rendered above every screen in the app. It was the only glass surface in the
 * product, it was styled with `slate` rather than the warm neutral ramp, and
 * because it floated over arbitrary content it physically collided with
 * whatever else occupied that corner. Two separate audit defects came from
 * that one component: "Log out" was unreadable on Parent Home (D1) and "Back"
 * rendered as "BaAR" on Ask IRIS (D2). A third (D6) was the landing screen
 * showing this control's language toggle AND its own language pills at once.
 *
 * The fix is not to move the overlay. It is to stop having an overlay: these
 * controls now live inside `TopBar`, in the layout, where they take up space
 * and therefore cannot sit on top of anything.
 *
 * ── WHY THE LANGUAGE CONTROL SHOWS THE TARGET LANGUAGE ────────────────────
 * The button reads "EN" while the app is in Arabic. That is the convention the
 * product already used and it is the less ambiguous of the two: a label naming
 * the CURRENT language looks like a status readout, not a switch.
 */
export function ChromeActions({
  showMute = true,
  showLanguage = true,
}: {
  /** Off on screens that offer their own richer audio controls (mute + repeat
   *  + music), so a child is never shown two speaker icons meaning almost the
   *  same thing. */
  showMute?: boolean;
  showLanguage?: boolean;
}) {
  const { isEnabled, toggleAudio } = useAudio();
  const { language, setLanguage } = useLanguage();
  const ar = language === 'ar';

  return (
    <>
      {showMute && (
        <BarButton
          icon={isEnabled ? 'sound-on' : 'sound-off'}
          pressed={isEnabled}
          label={
            ar
              ? isEnabled
                ? 'الصوت مفتوح. اضغط للكتم.'
                : 'الصوت مكتوم. اضغط للتشغيل.'
              : isEnabled
                ? 'Sound is on. Press to mute.'
                : 'Sound is off. Press to unmute.'
          }
          onClick={toggleAudio}
        />
      )}
      {showLanguage && (
        <BarAction onClick={() => setLanguage(ar ? 'en' : 'ar')}>
          <span aria-hidden="true">{ar ? 'EN' : 'ع'}</span>
          <span className="sr-only-iris">{ar ? 'Switch to English' : 'التبديل إلى العربية'}</span>
        </BarAction>
      )}
    </>
  );
}
