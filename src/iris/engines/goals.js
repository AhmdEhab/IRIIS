/**
 * IRIS — Learning Goals Engine (doc 13)
 *
 * The six MVP goals only. No goal may be added here without a specification
 * change: doc 13 deliberately excludes numeracy, expressive-language
 * production, reading comprehension, and social/adaptive skills from the MVP.
 *
 * Diagnosis-blind: goal selection reads the Profile (performance-derived) and
 * parent priority. It never reads `condition`.
 */
import { MASTERY, PATHWAY_CONFIG, VALIDATION } from '../spec.js';

/**
 * The MVP goal library — doc 13 §2.
 * Level ladders are quoted from the specification. Each is tagged with the
 * evidence tier from IRIS_CONTENT_FRAMEWORK_v1.md.
 */
export const GOALS = [
  {
    id: 'G-LANG-VOCAB',
    domain: 'LANG',
    primary_sub_measure: 'LANG.RECEP_VOCAB',
    nameAr: 'مفردات الاستيعاب اللغوي',
    nameEn: 'Receptive Vocabulary',
    objectiveAr: 'الانتقال من التعرّف على كلمة بين صورتين إلى اختيار كلمة تناسب سياق جملة بسيطة',
    objectiveEn: 'From recognizing a named object among two pictures to choosing a word fitting a simple spoken sentence',
    prerequisite: null,
    levels: [
      { level: 1, descAr: 'التعرّف على غرض مسمّى بين صورتين', descEn: 'Recognize a named object among 2 pictures' },
      { level: 2, descAr: 'مطابقة كلمة مسموعة بصورة من بين 3', descEn: 'Match a spoken word to a picture among 3' },
      { level: 3, descAr: 'اختيار الصورة التي تجيب عن سؤال مسموع قصير', descEn: 'Choose the picture answering a short spoken question' },
      { level: 4, descAr: 'اختيار كلمة مكتوبة تناسب سياق جملة بسيطة', descEn: 'Choose a word fitting a simple spoken sentence context' },
    ],
    evidence_tier: 'MODERATE',
    evidence_note_en: 'Concrete-vs-relational vocabulary distinction is STRONG (H13, S6/S7). The ladder itself is an engineering assumption.',
    validation_status: VALIDATION.RESEARCH_INFORMED_PROTOTYPE,
  },
  {
    id: 'G-LANG-PHON',
    domain: 'LANG',
    primary_sub_measure: 'LANG.PHON_AWARE',
    nameAr: 'الوعي الصوتي',
    nameEn: 'Phonological Awareness',
    objectiveAr: 'الانتقال من مطابقة الأصوات المتشابهة إلى تقطيع الكلمة إلى أصواتها',
    objectiveEn: 'From matching words by shared initial sound to segmenting a word into its sounds',
    prerequisite: { goal_id: 'G-LANG-VOCAB', min_level: 2, applies_from_level: 3 }, // R-GOAL-005
    levels: [
      { level: 1, descAr: 'مطابقة كلمتين تبدآن بنفس الصوت', descEn: 'Match two words starting with the same sound' },
      { level: 2, descAr: 'تحديد الحرف الأول لكلمة مسموعة (حروف حقيقية)', descEn: 'Identify the starting letter for a spoken word (real letters)' },
      { level: 3, descAr: 'دمج صوتين لتكوين كلمة واختيار صورتها', descEn: 'Blend two spoken sounds into a word and choose its picture' },
      { level: 4, descAr: 'تقطيع كلمة بسيطة إلى أصواتها بالترتيب', descEn: 'Segment a simple word into its sounds in order' },
    ],
    evidence_tier: 'STRONG',
    evidence_note_en: 'Systematic phonics association is the strongest finding in the corpus (H14). BOUNDARIES: association not causation; not tested in Down syndrome; source population age 9; not tested in Arabic orthography.',
    validation_status: VALIDATION.RESEARCH_INFORMED_PROTOTYPE,
  },
  {
    id: 'G-MEM-VERBAL',
    domain: 'MEM',
    primary_sub_measure: 'MEM.VERBAL_STM',
    nameAr: 'الذاكرة اللفظية قصيرة المدى',
    nameEn: 'Verbal Short-Term Memory',
    objectiveAr: 'إعادة تكرار تسلسل مسموع من عنصرين إلى أربعة، مع سحب الدعم البصري تدريجيًا',
    objectiveEn: 'Repeat a spoken sequence from 2 to 4 items, with picture anchors withdrawn progressively',
    prerequisite: null,
    levels: [
      { level: 1, descAr: 'تكرار تسلسل من عنصرين', descEn: 'Repeat a 2-item spoken sequence' },
      { level: 2, descAr: 'تكرار 3 عناصر مع بقاء الصور المرجعية ظاهرة', descEn: 'Repeat 3 items with picture anchors visible' },
      { level: 3, descAr: 'تكرار 3 عناصر مع اختفاء الصور بعد العرض', descEn: 'Repeat 3 items, anchors fade after presentation' },
      { level: 4, descAr: 'تكرار 4 عناصر بدون صور مرجعية', descEn: 'Repeat 4 items without anchors' },
    ],
    evidence_tier: 'STRONG',
    evidence_note_en: 'Verbal STM/WM is the largest documented DS deficit (H9). CONSTRAINT: this is in-task SUPPORT, never a memory-training claim — WM training does not transfer (H16/I10).',
    validation_status: VALIDATION.RESEARCH_INFORMED_PROTOTYPE,
  },
  {
    id: 'G-MEM-VISUAL',
    domain: 'MEM',
    primary_sub_measure: 'MEM.VISUAL_STM',
    nameAr: 'الذاكرة البصرية قصيرة المدى',
    nameEn: 'Visual Short-Term Memory',
    objectiveAr: 'إعادة إنتاج تسلسل بصري بالاختيار، مع زيادة العناصر وإضافة تأخير',
    objectiveEn: 'Reproduce a visual sequence by selection, with more items and an added delay',
    prerequisite: null,
    levels: [
      { level: 1, descAr: 'إعادة إنتاج تسلسل من عنصرين', descEn: 'Reproduce a 2-item visual sequence' },
      { level: 2, descAr: 'إعادة إنتاج تسلسل من 3 عناصر', descEn: 'Reproduce a 3-item visual sequence' },
      { level: 3, descAr: 'إعادة إنتاج 3 عناصر بعد تأخير 3 ثوانٍ', descEn: 'Reproduce 3 items after a 3-second delay' },
      { level: 4, descAr: 'إعادة إنتاج 4 عناصر بعد تأخير', descEn: 'Reproduce 4 items after a delay' },
    ],
    evidence_tier: 'LIMITED',
    evidence_note_en: 'DS visuospatial "strength" claim is CONTESTED and refuted three times in the corpus (I1). WS side rests on the construction-vs-recognition distinction (H12), inferred not directly tested for this paradigm.',
    validation_status: VALIDATION.RESEARCH_INFORMED_PROTOTYPE,
  },
  {
    id: 'G-ATT-SUSTAIN',
    domain: 'ATT',
    primary_sub_measure: 'ATT.SUSTAINED',
    nameAr: 'الانتباه المستمر',
    nameEn: 'Sustained Attention',
    objectiveAr: 'متابعة هدف بصري لفترة متزايدة مع إدخال مشتتات بسيطة',
    objectiveEn: 'Track a visual target for increasing durations with simple distractors introduced',
    prerequisite: null,
    levels: [
      { level: 1, descAr: '30 ثانية، بدون مشتتات', descEn: '30 seconds, no distractors' },
      { level: 2, descAr: '60 ثانية، بدون مشتتات', descEn: '60 seconds, no distractors' },
      { level: 3, descAr: '60 ثانية، مع مشتتات بسيطة', descEn: '60 seconds, low distractors' },
      { level: 4, descAr: '90 ثانية، مع مشتتات بسيطة', descEn: '90 seconds, low distractors' },
    ],
    evidence_tier: 'RESEARCH_GAP',
    evidence_note_en: 'NO source in the corpus supplies an attention duration or distractor level for either syndrome at any age (doc 29 §F). Every number in this ladder is an engineering assumption on top of a named research gap.',
    validation_status: VALIDATION.RESEARCH_INFORMED_PROTOTYPE,
  },
  {
    id: 'G-VSP-MATCH',
    domain: 'VSP',
    primary_sub_measure: 'VSP.MATCHING',
    secondary_sub_measure: 'VSP.PATTERN', // reported-only
    nameAr: 'المطابقة البصرية-المكانية',
    nameEn: 'Visual-Spatial Matching',
    objectiveAr: 'الانتقال من مطابقة أشكال متطابقة إلى إكمال نمط متكرر من 3 عناصر',
    objectiveEn: 'From matching identical shapes to completing a 3-element repeating pattern',
    prerequisite: null,
    levels: [
      { level: 1, descAr: 'مطابقة أشكال بسيطة متطابقة', descEn: 'Match identical simple shapes' },
      { level: 2, descAr: 'مطابقة شكل يختلف بميزة واحدة', descEn: 'Match a shape differing by one feature' },
      { level: 3, descAr: 'إكمال نمط متكرر من عنصرين', descEn: 'Complete a 2-element repeating pattern' },
      { level: 4, descAr: 'إكمال نمط متكرر من 3 عناصر', descEn: 'Complete a 3-element repeating pattern' },
    ],
    evidence_tier: 'MODERATE',
    evidence_note_en: 'Best design-to-evidence mapping of the six (H12): avoids construction, uses selection; nonverbal reasoning is a WS relative strength. DS side must be individually measured (I1).',
    validation_status: VALIDATION.RESEARCH_INFORMED_PROTOTYPE,
  },
];

export const GOAL_BY_ID = Object.fromEntries(GOALS.map((g) => [g.id, g]));

/** Sub-measures that are measured and reported but have no MVP goal (doc 13 §2). */
export const REPORTED_ONLY_SUB_MEASURES = ['LANG.INSTRUCTION', 'ATT.SELECTIVE'];

/** R-GOAL-004 — starting level from the profile, reduced by 1 if confidence LOW. */
export function startingLevelFor(goal, profile) {
  const base = profile.levels?.[goal.primary_sub_measure];
  if (base == null) return null;
  // profile.levels already applies the LOW-confidence reduction (R-PROFILE-007);
  // R-GOAL-004 does not reduce a second time.
  return Math.min(PATHWAY_CONFIG.MAX_LEVEL, Math.max(PATHWAY_CONFIG.MIN_LEVEL, base));
}

/** R-GOAL-005 — the single prerequisite in the whole system. */
export function prerequisiteSatisfied(goal, level, assignments = []) {
  const p = goal.prerequisite;
  if (!p) return { satisfied: true, ruleId: 'R-GOAL-005' };
  if (level < p.applies_from_level) return { satisfied: true, ruleId: 'R-GOAL-005' };
  const dep = assignments.find((a) => a.goal_id === p.goal_id);
  const depLevel = dep?.level ?? 0;
  return {
    satisfied: depLevel >= p.min_level,
    ruleId: 'R-GOAL-005',
    requires: `${p.goal_id} level >= ${p.min_level}`,
  };
}

/**
 * R-GOAL-003 — goal selection.
 *
 * Deterministic. Reads only the Profile (performance-derived) and an optional
 * parent priority. `condition` is not a parameter.
 */
export function selectGoals({ profile, parentPriorityGoalId = null, maxGoals = 2 }) {
  const decisions = [];
  const eligible = GOALS.filter((g) => {
    const lvl = profile.levels?.[g.primary_sub_measure];
    if (lvl == null) {
      decisions.push({ goal_id: g.id, excluded: true, reason: 'NOT_DETERMINED_SUB_MEASURE' });
      return false;
    }
    return true;
  });

  const chosen = [];
  const take = (goal, reason) => {
    if (!goal || chosen.find((c) => c.goal_id === goal.id)) return;
    if (chosen.length >= maxGoals) return;
    chosen.push({
      goal_id: goal.id,
      level: startingLevelFor(goal, profile),
      reason_code: reason,
      rule_id: 'R-GOAL-003',
    });
  };

  // 1. Parent priority first (R-GOAL-001 allows a 3rd goal only via parent priority).
  if (parentPriorityGoalId) {
    take(eligible.find((g) => g.id === parentPriorityGoalId), 'PARENT_PRIORITY');
  }

  // 2. Support-area slot (R-GOAL-002 balanced pairing).
  const supportGoal = eligible.find((g) => profile.support_areas?.includes(g.primary_sub_measure));
  take(supportGoal, 'SUPPORT_AREA');

  // 3. Strength-area slot.
  const strengthGoal = eligible.find((g) => profile.strengths?.includes(g.primary_sub_measure));
  take(strengthGoal, 'STRENGTH_AREA');

  // 4. Flat profile fallback — absolute level only, lowest level first (R-PROFILE-003 → doc 13 §3).
  if (chosen.length < maxGoals) {
    const byLevel = eligible
      .filter((g) => !chosen.find((c) => c.goal_id === g.id))
      .sort((a, b) => {
        const la = profile.levels[a.primary_sub_measure];
        const lb = profile.levels[b.primary_sub_measure];
        return la - lb || a.id.localeCompare(b.id); // deterministic tie-break
      });
    for (const g of byLevel) take(g, profile.profile_shape === 'FLAT' ? 'FLAT_PROFILE_LEVEL' : 'GOAL_SLOT_REFILL');
  }

  // Apply the prerequisite rule to the chosen levels.
  for (const c of chosen) {
    const goal = GOAL_BY_ID[c.goal_id];
    const pre = prerequisiteSatisfied(goal, c.level, chosen);
    if (!pre.satisfied) {
      c.level = Math.max(PATHWAY_CONFIG.MIN_LEVEL, goal.prerequisite.applies_from_level - 1);
      c.prerequisite_capped = true;
      c.prerequisite_note = pre.requires;
    }
  }

  return { assignments: chosen, excluded: decisions, rule_ids: ['R-GOAL-001', 'R-GOAL-002', 'R-GOAL-003', 'R-GOAL-004', 'R-GOAL-005'] };
}

/**
 * R-GOAL-006 — mastery.
 * The two most recent sessions at this goal-level are both band HIGH and
 * completion_status COMPLETE. Engagement-flagged sessions are excluded from
 * the count and do NOT break the run.
 */
export function isMastered(sessions, goalId, level) {
  const relevant = sessions
    .filter((s) => s.goal_id === goalId && s.level === level && !s.engagement_flag)
    .slice(-MASTERY.CONSECUTIVE_HIGH_SESSIONS);

  if (relevant.length < MASTERY.CONSECUTIVE_HIGH_SESSIONS) {
    return { mastered: false, rule_id: 'R-GOAL-006', reason: 'INSUFFICIENT_SESSIONS' };
  }
  const all = relevant.every((s) => s.band === 'HIGH' && s.completion_status === 'COMPLETE');
  return {
    mastered: all,
    rule_id: 'R-GOAL-006',
    reason: all ? 'TWO_CONSECUTIVE_HIGH' : 'NOT_ALL_HIGH',
  };
}
