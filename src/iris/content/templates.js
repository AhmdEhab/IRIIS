/**
 * IRIS — The eight activity templates (doc 15 §3).
 *
 * Modality-shift pairs are declared here as TEMPLATE METADATA — symmetric and
 * diagnosis-blind. R-PATH-006 reads `modality_pair_id` and nothing else. There
 * is no diagnosis-to-modality table anywhere in this codebase.
 */
import { PHASE5_TEMPLATES } from './phase5Templates.js';

/**
 * The eight original goal-keyed templates. Phase 5's strand-keyed templates
 * are concatenated below so the product keeps ONE template registry rather
 * than two that can drift apart.
 */
const LEGACY_TEMPLATES = [
  {
    id: 'TPL-PICK_PICTURE',
    interaction: 'Hear/see word → choose picture from 2–4',
    goals: { 'G-LANG-VOCAB': [1, 2, 3] },
    modality: 'MULTIMODAL',
    wm_load: 'LOW',
    verbal_load: 'MEDIUM',
    modality_pair_id: 'TPL-PICK_WORD',
    response_type: 'SINGLE_SELECT',
    min_options: 2,
    max_options: 4,
    labelAr: 'اختر الصورة',
    labelEn: 'Pick the picture',
  },
  {
    id: 'TPL-PICK_WORD',
    interaction: 'See picture → choose written word from 2–3',
    goals: { 'G-LANG-VOCAB': [4] },
    modality: 'VISUAL',
    wm_load: 'LOW',
    verbal_load: 'MEDIUM',
    modality_pair_id: 'TPL-PICK_PICTURE',
    response_type: 'SINGLE_SELECT',
    min_options: 2,
    max_options: 3,
    labelAr: 'اختر الكلمة',
    labelEn: 'Pick the word',
  },
  {
    id: 'TPL-SOUND_MATCH',
    interaction: 'Initial-sound / blending / segmenting selection',
    goals: { 'G-LANG-PHON': [1, 2, 3, 4] },
    modality: 'AUDITORY_VISUAL',
    wm_load: 'MEDIUM',
    verbal_load: 'HIGH',
    modality_pair_id: 'TPL-SOUND_MATCH_PICTURE_LED',
    response_type: 'SINGLE_SELECT',
    min_options: 2,
    max_options: 3,
    labelAr: 'طابِق الصوت',
    labelEn: 'Match the sound',
  },
  {
    id: 'TPL-SOUND_MATCH_PICTURE_LED',
    interaction: 'Picture-led variant of sound matching (declared pair of TPL-SOUND_MATCH)',
    goals: { 'G-LANG-PHON': [1, 2, 3, 4] },
    modality: 'VISUAL_LED',
    wm_load: 'MEDIUM',
    verbal_load: 'MEDIUM',
    modality_pair_id: 'TPL-SOUND_MATCH',
    response_type: 'SINGLE_SELECT',
    min_options: 2,
    max_options: 3,
    labelAr: 'طابِق الصوت (بالصور)',
    labelEn: 'Match the sound (picture-led)',
  },
  {
    id: 'TPL-FOLLOW_INSTRUCTION',
    interaction: 'Hear instruction → tap item(s) in order',
    goals: { 'G-LANG-VOCAB': [3] },
    modality: 'AUDITORY_VISUAL',
    wm_load: 'MEDIUM',
    verbal_load: 'HIGH',
    modality_pair_id: null, // declared: no partner → R-PATH-006 falls through
    response_type: 'ORDERED_SELECT',
    min_options: 2,
    max_options: 4,
    labelAr: 'اتّبع التعليمة',
    labelEn: 'Follow the instruction',
  },
  {
    id: 'TPL-SEQ_VERBAL',
    interaction: 'Hear sequence → tap back in order',
    goals: { 'G-MEM-VERBAL': [1, 2, 3, 4] },
    modality: 'AUDITORY',
    wm_load: 'HIGH',
    verbal_load: 'HIGH',
    modality_pair_id: 'TPL-SEQ_VISUAL',
    response_type: 'ORDERED_SELECT',
    min_options: 2,
    max_options: 4,
    labelAr: 'كرّر التسلسل المسموع',
    labelEn: 'Repeat the spoken sequence',
  },
  {
    id: 'TPL-SEQ_VISUAL',
    interaction: 'Watch sequence → tap back in order',
    goals: { 'G-MEM-VISUAL': [1, 2, 3, 4] },
    modality: 'VISUAL',
    wm_load: 'HIGH',
    verbal_load: 'LOW',
    modality_pair_id: 'TPL-SEQ_VERBAL',
    response_type: 'ORDERED_SELECT',
    min_options: 2,
    max_options: 4,
    labelAr: 'كرّر التسلسل البصري',
    labelEn: 'Repeat the visual sequence',
  },
  {
    id: 'TPL-TARGET_DETECT',
    interaction: 'Tap target as it appears over a timed run',
    goals: { 'G-ATT-SUSTAIN': [1, 2, 3, 4] },
    modality: 'VISUAL',
    wm_load: 'LOW',
    verbal_load: 'LOW',
    modality_pair_id: null, // declared: no partner
    response_type: 'TIMED_DETECT',
    min_options: 1,
    max_options: 1,
    labelAr: 'اضغط على الهدف',
    labelEn: 'Tap the target',
  },
  {
    id: 'TPL-PATTERN_COMPLETE',
    interaction: 'Dual mode: L1–2 matching, L3–4 pattern completion',
    goals: { 'G-VSP-MATCH': [1, 2, 3, 4] },
    modality: 'VISUAL',
    wm_load: 'MEDIUM',
    verbal_load: 'LOW',
    modality_pair_id: null, // declared: no partner
    response_type: 'SINGLE_SELECT',
    min_options: 2,
    max_options: 4,
    labelAr: 'أكمل النمط',
    labelEn: 'Complete the pattern',
  },
];

export const TEMPLATES = [...LEGACY_TEMPLATES, ...PHASE5_TEMPLATES];

export const TEMPLATE_BY_ID = Object.fromEntries(TEMPLATES.map((t) => [t.id, t]));

const WM_ORDER = { LOW: 1, MEDIUM: 2, HIGH: 3 };
export const wmLoadRank = (v) => WM_ORDER[v] ?? 99;

/** Templates that declare support for this goal+level. */
export function templatesForGoalLevel(goalId, level) {
  return TEMPLATES.filter((t) => (t.goals[goalId] || []).includes(level));
}

/** The default (first declared) template for a goal+level. Deterministic. */
export function templateForGoalLevel(goalId, level) {
  const list = templatesForGoalLevel(goalId, level);
  return list[0] ?? null;
}
