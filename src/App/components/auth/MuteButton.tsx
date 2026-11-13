import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useAudio } from '../../contexts/AudioContext';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * MuteButton — the landing's glass circle language on sound: same 48px
 * frosted disc, same hover fill, same press-in. Behaviour is the shared
 * AudioContext toggle with the identical accessibility label the old
 * ChromeActions control carried.
 */
export function MuteButton() {
  const { isEnabled, toggleAudio } = useAudio();
  const { language } = useLanguage();
  const ar = language === 'ar';
  const label = ar
    ? isEnabled ? 'الصوت مفتوح. اضغط للكتم.' : 'الصوت مكتوم. اضغط للتشغيل.'
    : isEnabled ? 'Sound is on. Press to mute.' : 'Sound is off. Press to unmute.';
  return (
    <button type="button" className="ir-auth-mute" aria-label={label} onClick={toggleAudio}>
      {isEnabled ? <Volume2 aria-hidden="true" /> : <VolumeX aria-hidden="true" />}
    </button>
  );
}
