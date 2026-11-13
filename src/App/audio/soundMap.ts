/**
 * Mapping from IRIS events to the real audio assets in public/sounds/.
 *
 * PROVENANCE
 * Every file here is derived from an asset the project owner supplied in
 * IRIS_MEGA_FOLDER/Sounds. Nothing was downloaded, generated, or substituted.
 * The originals are untouched; these are trimmed, level-matched copies.
 *
 * HOW EACH ONE WAS PREPARED
 * The raw files varied wildly in length and loudness — from a 12s 96kHz WAV at
 * -22.8 LUFS to a 2s clip at -7.6 LUFS, which is broadcast-slamming loud and
 * would have been alarming through headphones. Each was therefore:
 *   - trimmed to the segment that actually contains the sound (onsets measured
 *     with silencedetect, not guessed),
 *   - given a short fade-in and a longer fade-out so nothing starts or stops
 *     abruptly,
 *   - loudness-normalised into a narrow band, and
 *   - re-encoded to a small mp3 (8.6MB of source → ~380KB shipped).
 *
 * LEVELS (measured after processing)
 *   effects  ≈ -20 LUFS   music ≈ -32 LUFS
 * The gap is deliberate: music must never compete with narration, and the
 * project's evidence review (30_CLAIMS_WE_CAN_MAKE.md H15) treats loud or
 * sudden audio as an access hazard for this population, not a design flourish.
 *
 * ONE ASSET IS DELIBERATELY NOT WIRED
 * `other/fanfare-trumpets.mp3` is processed and kept, but no event points at
 * it. Its spectrogram shows two hard transients followed by a 2s brass sustain
 * — the textbook "sudden, aggressive reward sound" that both the product brief
 * and H15 rule out — and its source is only 24kHz, so it sounds dull next to
 * the others. It is one line away from being used if that call is overridden.
 *
 * AUDIO IS NEVER THE ONLY CHANNEL
 * Every event below is also expressed visually (a glyph, a caption, a state
 * change). Muting IRIS must never cost a child information.
 */

export type SoundEvent =
  | 'correct'
  | 'encourage'
  | 'celebrate'
  | 'complete';

/** Paths are absolute from the web root; Vite serves public/ at '/'. */
export const SOUND_FILES: Record<SoundEvent, string> = {
  /** Correct answer — children calling "yay". Short, warm, not a fanfare. */
  correct: '/sounds/correct/cheer-yay.mp3',
  /**
   * Retry. A GIGGLE, never a buzzer — but see the note in AudioContext: this
   * is used sparingly, because a laugh after a miss can be misread by a child
   * as being laughed at. The default retry cue stays the soft two-tone.
   */
  encourage: '/sounds/encouragement/giggle.mp3',
  /** Level-up moment — a delighted "woah". */
  celebrate: '/sounds/celebration/woah.mp3',
  /** Finishing a round or a story — children applauding. */
  complete: '/sounds/completion/applause.mp3',
};

/** Optional background music. Off by default; never autoplayed. */
export const MUSIC_FILE = '/sounds/music/iris-theme-loop.mp3';

/** Kept for reference; intentionally unmapped (see the header). */
export const UNUSED_ASSETS = ['/sounds/other/fanfare-trumpets.mp3'];
