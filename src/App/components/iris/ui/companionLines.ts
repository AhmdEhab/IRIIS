import type { MascotMood } from './IrisMascot';

/**
 * What the IRIS companion says, and which face it wears when it says it.
 *
 * WHY THIS IS SEPARATE FROM audio/phrases.ts
 * `phrases.ts` is the SPOKEN phrase library, consumed by AudioContext's
 * `say()`. This file is the companion's VISIBLE speech-bubble copy, keyed by
 * the moment in the child's journey rather than by audio event. Keeping them
 * apart means the companion can be given a face and a line on a screen that
 * plays no audio at all — and a child with sound off loses nothing.
 *
 * ARABIC REGISTER
 * Egyptian Arabic, because that is what reads as warm to the families this
 * MVP is aimed at. These are the lines the project owner specified, kept
 * verbatim, plus a small number of variants in the same register. Nothing
 * here is a word-for-word translation of the English.
 *
 * WORDING RULES (doc 31 §I14)
 * Failure wording describes the ATTEMPT, never the child. There is no line in
 * this file that says a child was wrong, slow, or unable — the nearest is
 * "let's try it a different way". Read the whole file before adding to it:
 * one discouraging line would undo the character.
 */

export type CompanionMoment =
  /** First meeting on a screen — the greeting. */
  | 'greeting'
  /** Just before an activity starts. */
  | 'beforeActivity'
  /** Waiting on the child; nothing is being asked yet. */
  | 'idle'
  /** The child is answering — IRIS is paying attention. */
  | 'listening'
  /** IRIS is working something out (loading a next activity). */
  | 'thinking'
  /** Correct answer. */
  | 'success'
  /** Nearly right — worth naming, because it is genuine progress. */
  | 'almost'
  /** Not right. Warm, and offers another route in. */
  | 'tryAgain'
  /** A softer acknowledgement than tryAgain, for a second attempt. */
  | 'gentleCorrection'
  /** Mid-task nudge with no judgement attached. */
  | 'encouraging'
  /** End of a session or a story — the big moment. */
  | 'celebrating';

interface Line {
  mood: MascotMood;
  ar: string[];
  en: string[];
}

const LINES: Record<CompanionMoment, Line> = {
  greeting: {
    mood: 'happy',
    ar: ['أهلاً يا بطل!', 'أهلاً بيك! جاهز نلعب؟'],
    en: ['Hi there, champion!', "Hello! Ready to play?"],
  },
  beforeActivity: {
    mood: 'encourage',
    ar: ['يلا نجربها سوا!', 'يلا نبدأ مع بعض!'],
    en: ["Let's try it together!", "Let's start together!"],
  },
  idle: {
    mood: 'idle',
    ar: ['جاهز نتعلم؟', 'أنا مستنيك!'],
    en: ['Ready to learn?', "I'm right here!"],
  },
  listening: {
    mood: 'listening',
    ar: ['أنا بسمعك!', 'خد وقتك.'],
    en: ["I'm listening!", 'Take your time.'],
  },
  thinking: {
    mood: 'thinking',
    ar: ['خليني أفكر شوية...', 'ثانية واحدة...'],
    en: ['Let me think...', 'One moment...'],
  },
  success: {
    mood: 'success',
    ar: ['برافو عليك!', 'شاطر أوي!', 'أحسنت!'],
    en: ['Well done!', "That's it!", 'Brilliant!'],
  },
  almost: {
    mood: 'encourage',
    ar: ['قربت جدًا!', 'قربت! جرب تاني.'],
    en: ['So close!', 'Very close — one more go.'],
  },
  tryAgain: {
    mood: 'tryAgain',
    ar: ['ولا يهمك، نجربها بطريقة تانية.', 'مفيش مشكلة، يلا نجرب تاني.'],
    en: ["No worries — let's try it a different way.", "That's okay. Let's try again."],
  },
  gentleCorrection: {
    mood: 'gentle',
    ar: ['تعال نبص عليها مع بعض.', 'خلينا نشوفها تاني بالراحة.'],
    en: ["Let's look at it together.", "Let's take that one slowly."],
  },
  encouraging: {
    mood: 'encourage',
    ar: ['أنا معاك، جرب تاني.', 'كمل، أنت بتعمل حلو!'],
    en: ["I'm with you — have another go.", "Keep going, you're doing well!"],
  },
  celebrating: {
    mood: 'celebrate',
    ar: ['برافو! عملتها!', 'يا سلام عليك!'],
    en: ['You did it!', 'Look at you go!'],
  },
};

/** The face that belongs to a moment. */
export function moodFor(moment: CompanionMoment): MascotMood {
  return LINES[moment].mood;
}

/**
 * A line for this moment.
 *
 * `variant` picks deterministically from the small set rather than at random,
 * so the same screen state always produces the same line. Predictable
 * feedback is one of the few interface principles the evidence base does
 * support (doc 05 §5) — a companion that says something different on every
 * re-render is noise, not warmth.
 */
export function lineFor(
  moment: CompanionMoment,
  language: 'ar' | 'en',
  variant = 0
): string {
  const set = language === 'ar' ? LINES[moment].ar : LINES[moment].en;
  return set[Math.abs(variant) % set.length];
}

/** Every line for a moment — used by the tests to sweep the whole library. */
export function allLines(moment: CompanionMoment, language: 'ar' | 'en'): string[] {
  return [...(language === 'ar' ? LINES[moment].ar : LINES[moment].en)];
}

export const COMPANION_MOMENTS = Object.keys(LINES) as CompanionMoment[];
