/**
 * IRIS spoken-phrase library — bilingual, child-facing.
 *
 * WHY THIS FILE EXISTS
 * Screens used to pass ad-hoc strings straight into speech synthesis, so the
 * spoken register drifted from screen to screen (some formal, some clipped,
 * some literal translations of English into Arabic that no Egyptian child
 * would say). Centralising the phrases keeps the voice consistent and keeps
 * the Arabic idiomatic rather than word-for-word.
 *
 * ARABIC REGISTER
 * Friendly//conversational lines are Egyptian Arabic, because that is what
 * reads as warm to the families this MVP is aimed at ("برافو عليك", "يلا",
 * "شاطر"). Instructional lines that must be unambiguous stay close to Modern
 * Standard Arabic. Nothing here is a word-for-word translation of the English.
 *
 * RESEARCH BOUNDARY — read before adding to this file
 * The project's own evidence review (research_deliverables/30, /31, /29) is
 * blunt about audio:
 *   - The ONLY well-supported population-level audio finding is a CAUTION:
 *     make audio optional, adjustable, never sudden or loud, and provide a
 *     visual/captioned equivalent. It is sanctioned because the default is
 *     cheap, NOT because audio is shown to help learning.
 *   - "Audio-first" or "auditory learner" design is explicitly PROHIBITED
 *     (doc 31, I3), as is any rule of the form "[diagnosis] → [modality]".
 *   - No evidence in the corpus covers narration quality, TTS, voice
 *     characteristics, music, earcons, or reward/feedback sound design.
 * So: speech here is an OPTIONAL ACCESS AID layered on top of a UI that must
 * remain fully usable in silence. Every phrase spoken to a child is also
 * rendered on screen as a caption. None of this is claimed to improve
 * learning, and none of it is selected by diagnosis.
 *
 * Failure/retry wording follows doc 31 I14: describe the SESSION or the
 * ATTEMPT, never the child. There is no phrase here that says a child failed.
 */

export type PhraseKind =
  | 'welcome'
  | 'instruction'
  | 'correct'
  | 'retry'
  | 'encouragement'
  | 'completion'
  | 'navigation';

export type Lang = 'ar' | 'en';

/**
 * The phrase kinds as a runtime value.
 *
 * Exists so callers can iterate every shared phrase without duplicating the
 * list — used by the narration prewarm, which synthesises the whole library
 * for a language the first time that language is spoken.
 */
export const PHRASE_KINDS: readonly PhraseKind[] = [
  'welcome',
  'instruction',
  'correct',
  'retry',
  'encouragement',
  'completion',
  'navigation',
] as const;

/**
 * Small rotating sets (2–3 variants) rather than one fixed line, so repeated
 * play does not feel mechanical — but deliberately small, because predictable
 * feedback is one of the few interface principles the evidence base does
 * support (doc 05 §5, predictable transitions).
 */
const PHRASES: Record<PhraseKind, Record<Lang, string[]>> = {
  welcome: {
    en: ['Hi! Ready to learn together?', 'Hello! Let us play and learn.'],
    ar: ['أهلاً! جاهز نتعلم مع بعض؟', 'أهلاً بيك! يلا نلعب ونتعلم.'],
  },
  instruction: {
    // Fallback only — real instructions are passed through verbatim.
    en: ['Have a look, then choose your answer.'],
    ar: ['بصّ كده، وبعدين اختار إجابتك.'],
  },
  correct: {
    en: ['Great job!', 'Well done!', 'Excellent!'],
    ar: ['برافو عليك!', 'شاطر!', 'ممتاز!'],
  },
  retry: {
    // Non-punitive by design. Describes the attempt, never the child.
    en: ['Good try! Let us try again.', 'Almost! One more go.'],
    ar: ['محاولة حلوة! يلا نجرب تاني.', 'قربت! يلا نجرب مرة كمان.'],
  },
  encouragement: {
    en: ['You can do this.', 'Keep going, you are doing well.'],
    ar: ['أنت تقدر!', 'كمّل، أنت بتعمل كويس.'],
  },
  completion: {
    en: ['You finished! Well done.', 'All done! Great work today.'],
    ar: ['خلصت! برافو عليك.', 'كده خلصنا! شغل حلو النهاردة.'],
  },
  navigation: {
    en: ['Here we go!', 'Next one.'],
    ar: ['يلا بينا!', 'اللي بعده.'],
  },
};

/** Round-robin cursor per phrase kind, so variants cycle instead of repeating. */
const cursors: Partial<Record<PhraseKind, number>> = {};

export function phraseFor(kind: PhraseKind, language: Lang): string {
  const set = PHRASES[kind]?.[language];
  if (!set || set.length === 0) return '';
  const i = cursors[kind] ?? 0;
  cursors[kind] = (i + 1) % set.length;
  return set[i % set.length];
}

/** All variants for a kind — used by tests and by caption previews. */
export function allPhrases(kind: PhraseKind, language: Lang): string[] {
  return PHRASES[kind]?.[language] ?? [];
}
