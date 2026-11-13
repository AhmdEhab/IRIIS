import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { phraseFor, allPhrases, PHRASE_KINDS, type PhraseKind, type Lang } from '../audio/phrases';
import { SOUND_FILES, MUSIC_FILE, type SoundEvent } from '../audio/soundMap';
import { getClip, voiceUsable, releaseClips, warmClips } from '../audio/voice';

/**
 * IRIS audio system.
 *
 * DESIGN CONSTRAINT (from the project's own evidence review, doc 30 H15):
 * the single sanctioned population-level audio default is that audio must be
 * "optional, adjustable, never sudden or loud, with visual/captioned
 * equivalents". It is sanctioned because the default is CHEAP, not because
 * audio is shown to help learning. Doc 31 I3 additionally PROHIBITS
 * audio-first design and any "[diagnosis] → modality" rule.
 *
 * Therefore, in this file:
 *   - every tone has a soft attack/release envelope (no clicks, nothing sudden)
 *   - effect and music gains are capped well below full volume
 *   - speech and music never talk over each other (music ducks under speech)
 *   - every spoken line is mirrored to `caption` so the UI can always show a
 *     visual equivalent, and the product stays fully usable with sound off
 *   - nothing here reads the child's diagnosis
 *
 * WHAT CHANGED FROM THE PREVIOUS VERSION AND WHY
 *  1. playSound() used to construct a brand-new window.AudioContext on EVERY
 *     call. Browsers cap concurrent AudioContexts (~6), so after a handful of
 *     taps all sound silently died. Now one context is created lazily and
 *     reused for the lifetime of the app.
 *  2. playSound() used to sweep ONE oscillator's frequency between notes with
 *     no gain envelope, which produces an audible click on start/stop and a
 *     buzzy portamento between pitches — the main reason the old audio read as
 *     "clinical". Each note is now its own oscillator with a short
 *     attack/decay envelope, so tones start and end softly.
 *  3. Speech pitch was 1.3, which is what made the voice sound synthetic and
 *     chipmunk-like. It is now 1.0 — natural — with a slower rate (0.82 for
 *     Arabic, 0.86 for English) so the fallback reads as calm and unhurried
 *     rather than cartoonish. These match the ElevenLabs delivery settings in
 *     server/routes/tts.js on purpose; see browserSpeak() below.
 *  4. Arabic was pinned to ar-SA. Egyptian families are the target audience,
 *     so ar-EG is now preferred where the platform offers it.
 *  5. Synthesized background music did not pause for narration (only the
 *     <audio> element did), so the pad played underneath speech. Music now
 *     ducks to near-silence while speaking and restores afterwards.
 */

interface AudioContextType {
  isEnabled: boolean;
  volume: number;
  toggleAudio: () => void;
  setVolume: (volume: number) => void;
  playSound: (type: SoundName) => void;
  speak: (text: string, language?: Lang) => void;
  stopSpeaking: () => void;
  playAudio: (url: string) => void;
  stopAudio: () => void;
  /** Optional, muteable, low-volume ambient background music. Off by default. */
  musicEnabled: boolean;
  toggleMusic: () => void;
  /**
   * Speak one of the shared child-facing phrases (welcome / correct / retry /
   * encouragement / completion / navigation). Returns the text that was
   * chosen, so a caller can also render it on screen.
   */
  say: (kind: PhraseKind, language?: Lang) => string;
  /**
   * The text most recently spoken, for rendering the on-screen caption that
   * doc 30 H15 requires as the visual equivalent of any audio. Empty when
   * nothing is being spoken.
   */
  caption: string;
  /** True while speech synthesis is actively speaking. */
  isSpeaking: boolean;
  /** Play one of the real recorded cues (see audio/soundMap.ts). */
  playCue: (event: SoundEvent) => void;
  /** Stop narration, cues and one-off audio — e.g. when leaving a screen. */
  stopAllSounds: () => void;
}

const AudioCtxContext = createContext<AudioContextType | undefined>(undefined);

type SoundName = 'tap' | 'success' | 'error' | 'retry' | 'welcome' | 'celebration';

/**
 * Effect gain ceiling. Deliberately low: doc 30 H15 flags loud/sudden audio as
 * an access hazard (loud-noise phobia and undetected hearing loss are both
 * documented in this population), so the effects sit under the voice.
 */
const EFFECT_GAIN = 0.16;
/** Ceiling for the recorded cues. They are already normalised to ~-20 LUFS,
 *  so this is a further safety margin rather than the main level control. */
const CUE_GAIN = 0.55;
/** Music ceiling — must stay far under narration. */
const MUSIC_GAIN = 0.5;

/**
 * Which synthesized names now play a REAL recording instead.
 *
 * Routing it here rather than at each call site means every existing
 * playSound('success') across the app upgraded to the children's cheer without
 * touching those screens. Anything not listed keeps the synthesized tone,
 * which is the right choice for high-frequency micro-feedback like 'tap'.
 *
 * NOTE ON 'error'/'retry': deliberately NOT mapped to the giggle asset. A
 * child who has just answered incorrectly should not hear laughter — it is too
 * easily read as being laughed at. Retries keep the soft, neutral two-tone.
 */
const SOUND_TO_CUE: Partial<Record<SoundName, SoundEvent>> = {
  success: 'correct',
  celebration: 'celebrate',
};

/** Gentle, consonant tone sets. No harsh intervals, nothing descending-minor. */
const TONES: Record<SoundName, number[]> = {
  tap: [440],
  // Rising major triad — reads as "yes" without being a fanfare.
  success: [523.25, 659.25, 783.99],
  // Soft, neutral, NON-punitive. Two warm mid tones, no dissonance, no
  // downward "wrong answer" cadence. A retry must never sound like a buzzer.
  error: [392.0, 440.0],
  retry: [392.0, 440.0],
  welcome: [523.25, 659.25, 783.99, 1046.5],
  celebration: [523.25, 659.25, 783.99, 1046.5],
};

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [volume, setVolumeState] = useState(0.7);
  const [musicEnabled, setMusicEnabled] = useState(false); // opt-in, never autoplay
  const [caption, setCaption] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  /** Looping background music, from a real asset (see audio/soundMap.ts). */
  const musicElRef = useRef<HTMLAudioElement | null>(null);
  /**
   * One reusable <audio> per cue URL. Creating a fresh element on every correct
   * answer leaks elements and makes the browser re-fetch/decode the file, which
   * is why short cues used to arrive late or not at all after a few rounds.
   * Reusing one element per sound also guarantees a cue can never overlap
   * itself — a rapid double-tap restarts it instead of stacking two copies.
   */
  const cuePoolRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  // Read inside callbacks that must not be re-created on every volume change.
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  /** Read inside async narration callbacks, which may resolve after the child
   *  has muted; the captured `isEnabled` would be stale there. */
  const isEnabledRef = useRef(isEnabled);
  isEnabledRef.current = isEnabled;

  /**
   * The single <audio> element that plays ElevenLabs narration. Reusing one
   * element (rather than `new Audio()` per line) is what makes narration
   * physically unable to overlap itself: assigning a new src replaces whatever
   * was playing.
   */
  const narrationElRef = useRef<HTMLAudioElement | null>(null);
  /** Languages whose shared phrase library has already been pre-synthesised. */
  const warmedRef = useRef<Set<Lang>>(new Set());
  /**
   * Incremented by every speak() and every stop. Narration audio that arrives
   * with a stale number is thrown away instead of played — see speak().
   */
  const speakSeqRef = useRef(0);

  const getNarrationEl = useCallback((): HTMLAudioElement => {
    if (!narrationElRef.current) {
      const el = new Audio();
      el.preload = 'auto';
      narrationElRef.current = el;
    }
    return narrationElRef.current;
  }, []);

  /** Halt narration playback without discarding the element. */
  const stopNarrationEl = useCallback(() => {
    const el = narrationElRef.current;
    if (!el) return;
    try {
      el.pause();
      el.currentTime = 0;
    } catch {
      /* ignore */
    }
  }, []);

  /** One shared Web Audio context, created lazily on first real use. */
  const getCtx = useCallback((): AudioContext | null => {
    try {
      if (!ctxRef.current) {
        const Ctor = window.AudioContext || (window as any).webkitAudioContext;
        if (!Ctor) return null;
        ctxRef.current = new Ctor();
      }
      // Browsers start contexts suspended until a user gesture; resuming here
      // is safe and is what "warms up" audio on the first tap.
      if (ctxRef.current.state === 'suspended') void ctxRef.current.resume();
      return ctxRef.current;
    } catch {
      return null;
    }
  }, []);

  // ---------------------------------------------------------------- music --

  /**
   * Background music now plays the real asset the project owner supplied
   * (public/sounds/music/, see audio/soundMap.ts) instead of the synthesized
   * two-oscillator pad that used to stand in for it. The file is already
   * mastered down to about -32 LUFS with long fades at both ends, so it loops
   * without a click and sits far below narration.
   */
  const stopMusicNodes = useCallback(() => {
    const el = musicElRef.current;
    if (!el) return;
    // Fade out over ~0.6s rather than cutting, then pause.
    const startVol = el.volume;
    const steps = 12;
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      try {
        el.volume = Math.max(0, startVol * (1 - i / steps));
        if (i >= steps) {
          clearInterval(timer);
          el.pause();
          el.currentTime = 0;
        }
      } catch {
        clearInterval(timer);
      }
    }, 50);
  }, []);

  /** Target music volume, well under speech. Never autoplayed. */
  const musicTargetVolume = () => Math.max(0, Math.min(1, volumeRef.current)) * MUSIC_GAIN;

  const startMusicNodes = useCallback(() => {
    try {
      if (!musicElRef.current) {
        const el = new Audio(MUSIC_FILE);
        el.loop = true;
        el.preload = 'auto';
        // Attached to the document rather than left as a detached object:
        // browsers treat an in-document media element as a first-class one
        // (media-session handling, correct behaviour when the tab is
        // backgrounded), and it makes the music observable to tests.
        el.setAttribute('data-iris-music', 'true');
        el.hidden = true;
        document.body.appendChild(el);
        musicElRef.current = el;
      }
      const el = musicElRef.current;
      el.volume = 0;
      // Only ever called from a direct user gesture (toggleMusic), which is
      // what browser autoplay policy requires — and what stops music from ever
      // starting unexpectedly.
      void el.play().then(() => {
        const target = musicTargetVolume();
        const steps = 20;
        let i = 0;
        const timer = setInterval(() => {
          i += 1;
          try {
            el.volume = Math.min(target, target * (i / steps));
            if (i >= steps) clearInterval(timer);
          } catch {
            clearInterval(timer);
          }
        }, 80);
      }).catch(() => {
        /* blocked or file missing — music simply stays off, nothing breaks */
      });
    } catch {
      /* audio unavailable — music stays off */
    }
  }, []);

  /**
   * Duck music under narration so speech never competes with it. Stepped
   * rather than jumped, because an instant volume change is itself a "sudden"
   * audio event.
   */
  const duckTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const duckMusic = useCallback((ducked: boolean) => {
    const el = musicElRef.current;
    if (!el || el.paused) return;
    const full = musicTargetVolume();
    const target = ducked ? full * 0.12 : full;
    if (duckTimerRef.current) clearInterval(duckTimerRef.current);
    const from = el.volume;
    const steps = 8;
    let i = 0;
    duckTimerRef.current = setInterval(() => {
      i += 1;
      try {
        el.volume = Math.max(0, Math.min(1, from + (target - from) * (i / steps)));
        if (i >= steps && duckTimerRef.current) {
          clearInterval(duckTimerRef.current);
          duckTimerRef.current = null;
        }
      } catch {
        if (duckTimerRef.current) clearInterval(duckTimerRef.current);
      }
    }, 40);
  }, []);

  /**
   * Play one of the real recorded cues. Reuses a single element per sound, so
   * repeated correct answers restart the cue rather than layering copies of it
   * on top of each other.
   */
  const playCue = useCallback((event: SoundEvent) => {
    if (!isEnabled) return;
    const url = SOUND_FILES[event];
    if (!url) return;
    try {
      let el = cuePoolRef.current.get(url);
      if (!el) {
        el = new Audio(url);
        el.preload = 'auto';
        cuePoolRef.current.set(url, el);
      }
      el.volume = Math.max(0, Math.min(1, volumeRef.current)) * CUE_GAIN;
      el.currentTime = 0;
      // Duck music for the length of the cue too, not just for speech.
      duckMusic(true);
      const restore = () => duckMusic(false);
      el.onended = restore;
      void el.play().catch(() => {
        // File missing or autoplay blocked: fall back to the synthesized tone
        // so the child still gets feedback, and un-duck immediately.
        restore();
      });
    } catch {
      /* never let a cue break the activity */
    }
  }, [isEnabled, duckMusic]);

  const toggleMusic = useCallback(() => {
    setMusicEnabled((prev) => {
      const next = !prev;
      if (next && isEnabled) startMusicNodes();
      else stopMusicNodes();
      return next;
    });
  }, [isEnabled, startMusicNodes, stopMusicNodes]);

  // --------------------------------------------------------------- effects --

  /**
   * Play a short tone sequence. Each note gets its own oscillator and an
   * attack/release envelope, so nothing clicks and nothing is sudden.
   */
  const playSound = useCallback(
    (type: SoundName) => {
      if (!isEnabled) return;
      // Prefer the real recording where one is mapped for this event.
      const cue = SOUND_TO_CUE[type];
      if (cue) { playCue(cue); return; }
      const ctx = getCtx();
      if (!ctx) return;
      try {
        const freqs = TONES[type] ?? [440];
        const peak = Math.max(0, Math.min(1, volumeRef.current)) * EFFECT_GAIN;
        const noteLen = type === 'tap' ? 0.09 : 0.16;
        const attack = 0.015; // soft onset — this is what removes the click
        const release = type === 'tap' ? 0.06 : 0.14;

        freqs.forEach((freq, i) => {
          const start = ctx.currentTime + i * noteLen;
          const osc = ctx.createOscillator();
          const g = ctx.createGain();
          // Triangle is softer and less piercing than sine at these pitches.
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, start);
          g.gain.setValueAtTime(0.0001, start);
          g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), start + attack);
          g.gain.exponentialRampToValueAtTime(0.0001, start + noteLen + release);
          osc.connect(g);
          g.connect(ctx.destination);
          osc.start(start);
          osc.stop(start + noteLen + release + 0.02);
        });
      } catch {
        /* audio unavailable — the UI stays fully usable in silence */
      }
    },
    [isEnabled, getCtx]
  );

  // ----------------------------------------------------------------- voice --

  useEffect(() => {
    if (!window.speechSynthesis) return;
    const load = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  /**
   * Pick the most natural available voice for the language.
   *
   * Ranking rationale: platform "Natural"/"Neural"/"Premium"/"Enhanced" voices
   * are markedly warmer than the default formant-synthesis fallbacks, which are
   * what made the old narration sound robotic. We do NOT chase names like
   * "child"/"boy"/"girl" any more — on most platforms those are novelty
   * pitch-shifted voices that sound worse, not friendlier.
   *
   * For Arabic, ar-EG is preferred because this MVP is aimed at Egyptian
   * families and the friendly phrases are written in Egyptian Arabic.
   */
  const pickVoice = useCallback((language: Lang): SpeechSynthesisVoice | null => {
    const voices = voicesRef.current.length
      ? voicesRef.current
      : window.speechSynthesis?.getVoices() ?? [];
    if (!voices.length) return null;

    const quality = (v: SpeechSynthesisVoice) => {
      const n = v.name.toLowerCase();
      let score = 0;
      if (/natural|neural|premium|enhanced|online/.test(n)) score += 4;
      if (/google/.test(n)) score += 2;
      if (/female|woman|hoda|salma|zaina|aria|jenny|sonia|samantha/.test(n)) score += 1;
      if (/compact|espeak|novelty/.test(n)) score -= 3;
      if (v.localService === false) score += 1; // cloud voices are usually richer
      return score;
    };

    const pool =
      language === 'ar'
        ? [
            voices.filter((v) => /^ar[-_]?eg/i.test(v.lang)),
            voices.filter((v) => v.lang.toLowerCase().startsWith('ar')),
          ]
        : [
            voices.filter((v) => /^en[-_]?(gb|us)/i.test(v.lang)),
            voices.filter((v) => v.lang.toLowerCase().startsWith('en')),
          ];

    for (const group of pool) {
      if (group.length) {
        return [...group].sort((a, b) => quality(b) - quality(a))[0];
      }
    }
    return null;
  }, []);

  /** Strip emoji and decorative symbols so they are not read aloud literally. */
  const cleanForSpeech = (text: string) =>
    text
      .replace(/[\u{1F000}-\u{1FAFF}]/gu, '')
      .replace(/[\u{2190}-\u{2BFF}]/gu, '')
      .replace(/[\u{FE00}-\u{FE0F}]/gu, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

  /**
   * The browser's own speech synthesis. This is no longer the primary voice —
   * it is the fallback used when ElevenLabs narration is unconfigured,
   * unreachable, or declines a line. Keeping it means IRIS is never silent:
   * a demo machine with no network still talks, just in the old voice.
   */
  const browserSpeak = useCallback(
    (clean: string, language: Lang) => {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();

      const u = new SpeechSynthesisUtterance(clean);
      const voice = pickVoice(language);
      if (voice) u.voice = voice;
      u.lang = voice?.lang || (language === 'ar' ? 'ar-EG' : 'en-GB');
      /**
       * Delivery tuning (Phase 8), matched to the ElevenLabs settings in
       * server/routes/tts.js so the fallback does not sound like a different
       * character. If the two drift apart, a child hears one voice on a good
       * network and a noticeably brisker, brighter one on a bad one.
       *
       *  rate   Arabic slightly slower than English, for the same reason the
       *         ElevenLabs speed is: Egyptian Arabic carries meaning in
       *         consonant length and short vowels that a quick read smears.
       *  pitch  Lowered from 1.05 to natural. The raised pitch was what made
       *         the fallback read as an artificial child voice, which the
       *         brief rules out.
       */
      u.rate = language === 'ar' ? 0.82 : 0.86;
      u.pitch = 1.0;
      u.volume = Math.max(0, Math.min(1, volumeRef.current));

      u.onstart = () => {
        setIsSpeaking(true);
        duckMusic(true);
      };
      const done = () => {
        setIsSpeaking(false);
        duckMusic(false);
      };
      u.onend = done;
      u.onerror = done;

      utteranceRef.current = u;
      window.speechSynthesis.speak(u);
    },
    [pickVoice, duckMusic]
  );

  /**
   * Speak a line in the current language.
   *
   * The signature and behaviour every caller sees are unchanged. What changed
   * is where the voice comes from: ElevenLabs first (the configured Arabic or
   * English voice, chosen purely from `language`), the browser voice only if
   * that is unavailable.
   *
   * Overlap is prevented by a sequence number rather than by a lock. Every call
   * — and every stop — bumps it, and a synthesis that finishes after its number
   * has moved on is discarded rather than played. That is what stops a line
   * fetched on one screen from starting after the child has navigated away.
   */
  const speak = useCallback(
    (text: string, language: Lang = 'ar') => {
      if (!text) return;
      // The caption is the visual equivalent required by doc 30 H15. It is set
      // even when sound is muted, so a child with audio off still gets the
      // instruction on screen.
      setCaption(text);
      if (!isEnabled) return;

      const clean = cleanForSpeech(text);
      if (!clean) return;

      // Whatever was speaking stops now, in both voices.
      const seq = ++speakSeqRef.current;
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      stopNarrationEl();
      if (audioRef.current) audioRef.current.pause();

      if (!voiceUsable()) {
        browserSpeak(clean, language);
        return;
      }

      // Issue the line the child is waiting for FIRST. Warming the shared
      // phrase library is queued behind it (see warmClips) so pre-synthesis can
      // never take the synthesis slot this line needs.
      const live = getClip(clean, language);
      if (!warmedRef.current.has(language)) {
        warmedRef.current.add(language);
        void live.then(() => {
          const lines: string[] = [];
          for (const kind of PHRASE_KINDS) lines.push(...allPhrases(kind, language));
          warmClips(lines, language);
        });
      }

      void live.then((url) => {
        // Stale: a newer speak(), or a stop, happened while we were fetching.
        if (seq !== speakSeqRef.current) return;
        // The child may have muted during the fetch.
        if (!isEnabledRef.current) return;

        if (!url) {
          browserSpeak(clean, language);
          return;
        }

        const el = getNarrationEl();
        el.src = url;
        el.volume = Math.max(0, Math.min(1, volumeRef.current));
        el.onplay = () => {
          setIsSpeaking(true);
          duckMusic(true);
        };
        const done = () => {
          if (seq !== speakSeqRef.current) return;
          setIsSpeaking(false);
          duckMusic(false);
        };
        el.onended = done;
        el.onerror = () => {
          done();
          // The blob failed to decode — rare, but fall back rather than go mute.
          if (seq === speakSeqRef.current && isEnabledRef.current) browserSpeak(clean, language);
        };
        el.play().catch(() => {
          // Autoplay blocked before the first gesture. The browser voice is
          // subject to the same restriction, so this just stays quiet.
          done();
        });
      });
    },
    [isEnabled, browserSpeak, duckMusic, getNarrationEl, stopNarrationEl]
  );

  /** Speak a shared phrase and return the chosen text for on-screen display. */
  const say = useCallback(
    (kind: PhraseKind, language: Lang = 'ar') => {
      const text = phraseFor(kind, language);
      if (text) speak(text, language);
      return text;
    },
    [speak]
  );

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    // Bumping the sequence cancels any narration still being synthesised, so a
    // line requested a moment ago cannot start speaking after this call.
    speakSeqRef.current += 1;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    stopNarrationEl();
    utteranceRef.current = null;
    setIsSpeaking(false);
    setCaption('');
    duckMusic(false);
    stopAudio();
  }, [duckMusic, stopAudio, stopNarrationEl]);

  const playAudio = useCallback(
    (url: string) => {
      if (!isEnabled) return;
      stopAudio();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      const audio = new Audio(url);
      audio.volume = Math.max(0, Math.min(1, volumeRef.current));
      audio.play().catch(() => {
        /* autoplay blocked or file missing — stay silent, never throw */
      });
      audioRef.current = audio;
      audio.onended = () => {
        audioRef.current = null;
      };
    },
    [isEnabled, stopAudio]
  );

  // --------------------------------------------------------------- toggles --

  const toggleAudio = useCallback(() => {
    setIsEnabled((prev) => {
      const next = !prev;
      if (!next) {
        speakSeqRef.current += 1;
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        stopNarrationEl();
        if (audioRef.current) audioRef.current.pause();
        setIsSpeaking(false);
        stopMusicNodes();
      } else if (musicEnabled) {
        startMusicNodes();
      }
      return next;
    });
  }, [musicEnabled, startMusicNodes, stopMusicNodes, stopNarrationEl]);

  const setVolume = useCallback((newVolume: number) => {
    const v = Math.max(0, Math.min(1, newVolume));
    setVolumeState(v);
    volumeRef.current = v;
    if (audioRef.current) audioRef.current.volume = v;
    if (narrationElRef.current) narrationElRef.current.volume = v;
    // Music and cues both follow the master volume live.
    const el = musicElRef.current;
    if (el && !el.paused) el.volume = v * MUSIC_GAIN;
    cuePoolRef.current.forEach((cue) => { cue.volume = v * CUE_GAIN; });
  }, []);

  /**
   * Stop every sound this system owns. Called when leaving a screen so a cue,
   * a narration line, or the music can never carry on over the next activity.
   */
  const stopAllSounds = useCallback(() => {
    speakSeqRef.current += 1;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    stopNarrationEl();
    setIsSpeaking(false);
    cuePoolRef.current.forEach((cue) => {
      try { cue.pause(); cue.currentTime = 0; } catch { /* ignore */ }
    });
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
  }, [stopNarrationEl]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (narrationElRef.current) {
        try { narrationElRef.current.pause(); } catch { /* ignore */ }
        narrationElRef.current = null;
      }
      releaseClips();
      cuePoolRef.current.forEach((cue) => { try { cue.pause(); } catch { /* ignore */ } });
      cuePoolRef.current.clear();
      if (musicElRef.current) {
        try { musicElRef.current.pause(); musicElRef.current.remove(); } catch { /* ignore */ }
        musicElRef.current = null;
      }
      if (duckTimerRef.current) clearInterval(duckTimerRef.current);
      if (ctxRef.current) {
        ctxRef.current.close().catch(() => {});
        ctxRef.current = null;
      }
    };
  }, [stopMusicNodes]);

  return (
    <AudioCtxContext.Provider
      value={{
        isEnabled,
        volume,
        toggleAudio,
        setVolume,
        playSound,
        speak,
        stopSpeaking,
        playAudio,
        stopAudio,
        musicEnabled,
        toggleMusic,
        say,
        caption,
        isSpeaking,
        playCue,
        stopAllSounds,
      }}
    >
      {children}
    </AudioCtxContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioCtxContext);
  if (!context) throw new Error('useAudio must be used within AudioProvider');
  return context;
}
