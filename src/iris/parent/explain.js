/**
 * IRIS — Parent-facing explanation layer (doc 12 §6, doc 16 §Parent Mode)
 *
 * ── WHAT PARENTS MAY NEVER SEE (doc 16, doc 12 §6) ────────────────────────
 *   percentiles · age equivalents · IQ-like numbers · DPS values ·
 *   comparisons to other children / to a "typical 7-year-old" / to a
 *   diagnosis group · clinical interpretation · predictions or prognoses ·
 *   "this will improve memory/language" claims · deficit language
 *
 * Every explanation below is generated from a FIXED TEMPLATE keyed on the
 * rule that actually fired. No LLM. No free text. The explanation always
 * cites observed performance, never the diagnosis.
 * ──────────────────────────────────────────────────────────────────────────
 */
import { PROFILE_DISCLAIMER, BANNED_TERMS } from '../spec.js';
import { GOAL_BY_ID, REPORTED_ONLY_SUB_MEASURES } from '../engines/goals.js';
import { STRAND_BY_ID } from '../ladders/index.js';

const LEVEL_WORD = {
  ar: { 1: 'الأول', 2: 'الثاني', 3: 'الثالث', 4: 'الرابع' },
  en: { 1: 'one', 2: 'two', 3: 'three', 4: 'four' },
};

const SUB_MEASURE_LABEL = {
  'LANG.RECEP_VOCAB': { ar: 'فهم المفردات', en: 'understanding words' },
  'LANG.INSTRUCTION': { ar: 'اتّباع التعليمات', en: 'following instructions' },
  'LANG.PHON_AWARE': { ar: 'التعرّف على أصوات الحروف', en: 'letter sounds' },
  'MEM.VERBAL_STM': { ar: 'تذكّر ما يسمعه', en: 'remembering what they hear' },
  'MEM.VISUAL_STM': { ar: 'تذكّر ما يراه', en: 'remembering what they see' },
  'ATT.SUSTAINED': { ar: 'الاستمرار في الانتباه', en: 'staying focused' },
  'ATT.SELECTIVE': { ar: 'الانتباه وسط المشتتات', en: 'focusing with distractions' },
  'VSP.MATCHING': { ar: 'مطابقة الأشكال', en: 'matching shapes' },
  'VSP.PATTERN': { ar: 'إكمال الأنماط', en: 'completing patterns' },
};

export const subMeasureLabel = (sm, lang = 'ar') => SUB_MEASURE_LABEL[sm]?.[lang] ?? sm;

/**
 * Guard: nothing leaves this module carrying a banned term.
 *
 * ONE exemption, and only one: the required disclaimer in doc 12 §6 contains
 * the phrase "It is not an IQ test" / "ليس اختبار ذكاء". That is a mandated
 * NEGATION of the banned construct, not an assertion of it — the specification
 * requires those exact words on every profile view. The exemption is matched
 * against the exact approved strings, so no other text can smuggle "IQ"
 * through by claiming to be a disclaimer.
 */
const APPROVED_DISCLAIMERS = new Set(Object.values(PROFILE_DISCLAIMER));

export function assertSafeText(text) {
  const str = String(text);
  if (APPROVED_DISCLAIMERS.has(str)) return text;
  const lower = str.toLowerCase();
  for (const term of BANNED_TERMS) {
    const re = new RegExp(`(^|[^a-z])${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`, 'i');
    if (re.test(lower)) throw new Error(`Parent text contains banned term "${term}": ${text}`);
  }
  return text;
}

/**
 * Explain ONE pathway decision to a parent.
 * The explanation is the fixed template from R-PATH-011, plus the observed
 * numbers that triggered it — never the diagnosis.
 */
export function explainDecision(decision, lang = 'ar') {
  const base = decision.explanation_parent?.[lang] ?? '';
  const acc = decision.inputs_snapshot?.accuracy;
  const ind = decision.inputs_snapshot?.independence;

  let evidence = '';
  if (typeof acc === 'number') {
    const accPct = Math.round(acc * 100);
    const indPct = typeof ind === 'number' ? Math.round(ind * 100) : null;
    evidence = lang === 'ar'
      ? ` (في الجلسة الأخيرة: ${accPct}٪ إجابات صحيحة${indPct != null ? `، و${indPct}٪ بدون مساعدة` : ''})`
      : ` (last session: ${accPct}% correct${indPct != null ? `, ${indPct}% without help` : ''})`;
  }

  return assertSafeText(base + evidence);
}

/** Plain-language status for one active goal. */
export function explainGoalStatus({ assignment, snapshot }, lang = 'ar') {
  const goal = GOAL_BY_ID[assignment.goal_id];
  if (!goal) return '';
  const goalName = lang === 'ar' ? goal.nameAr : goal.nameEn;
  const levelDesc = goal.levels.find((l) => l.level === assignment.level);
  const levelText = lang === 'ar' ? levelDesc?.descAr : levelDesc?.descEn;
  const lw = LEVEL_WORD[lang][assignment.level];

  const trend = snapshot?.accuracy_trend;
  let trendText;
  if (!trend || trend.trend === 'INSUFFICIENT_DATA') {
    trendText = lang === 'ar'
      ? 'لا توجد جلسات كافية بعد لعرض اتجاه واضح.'
      : 'Not enough sessions yet to show a clear trend.';
  } else {
    const map = {
      IMPROVING: { ar: 'الأداء في تحسّن عبر الجلسات الأخيرة.', en: 'Performance is improving across recent sessions.' },
      STABLE: { ar: 'الأداء ثابت عبر الجلسات الأخيرة.', en: 'Performance is steady across recent sessions.' },
      DECLINING: { ar: 'الأداء أقل مما كان في الجلسات السابقة.', en: 'Performance is lower than in earlier sessions.' },
    };
    trendText = map[trend.trend][lang];
  }

  const text = lang === 'ar'
    ? `يتدرّب طفلك الآن على «${goalName}» — المستوى ${lw}: ${levelText}. ${trendText}`
    : `Your child is practising "${goalName}" — level ${lw}: ${levelText}. ${trendText}`;

  return assertSafeText(text);
}

/**
 * Profile summary — strengths first, person-first, no numbers.
 * DPS values are deliberately NOT shown (doc 12 §6).
 */
export function explainProfile(profile, lang = 'ar') {
  const lines = [];

  if (profile.strengths.length > 0) {
    const names = profile.strengths.map((s) => subMeasureLabel(s, lang)).join(lang === 'ar' ? ' و' : ', ');
    lines.push(lang === 'ar'
      ? `كان أداء طفلك اليوم أقوى نسبيًا في: ${names}.`
      : `Today your child did relatively well at: ${names}.`);
  } else if (profile.profile_shape === 'FLAT') {
    lines.push(lang === 'ar'
      ? 'كان أداء طفلك اليوم متقاربًا عبر الأنشطة المختلفة، دون فرق واضح بينها.'
      : 'Your child performed similarly across the different activities today, with no clear difference between them.');
  }

  const actionable = profile.support_areas.filter((s) => !REPORTED_ONLY_SUB_MEASURES.includes(s));
  if (actionable.length > 0) {
    const names = actionable.map((s) => subMeasureLabel(s, lang)).join(lang === 'ar' ? ' و' : ', ');
    lines.push(lang === 'ar'
      ? `سنبدأ التدريب على: ${names}.`
      : `We will start practising: ${names}.`);
  }

  // Reported-only areas are stated honestly but marked as not-yet-targeted.
  const reportedOnly = profile.support_areas.filter((s) => REPORTED_ONLY_SUB_MEASURES.includes(s));
  for (const s of reportedOnly) {
    lines.push(lang === 'ar'
      ? `لاحظنا أيضًا صعوبة نسبية في ${subMeasureLabel(s, lang)}. هذا شيء لاحظناه، لكنه ليس من المجالات التي يعمل عليها IRIS حاليًا.`
      : `We also noticed relative difficulty with ${subMeasureLabel(s, lang)}. This is something we noticed, but it isn't one of the areas IRIS is working on yet.`);
  }

  if (profile.not_determined.length > 0) {
    const names = profile.not_determined.map((s) => subMeasureLabel(s, lang)).join(lang === 'ar' ? ' و' : ', ');
    lines.push(lang === 'ar'
      ? `لم نتمكّن بعد من قياس: ${names}. سنحاول مرة أخرى لاحقًا — هذا لا يعني أن طفلك لا يستطيع.`
      : `We could not measure these yet: ${names}. We will try again later — this does not mean your child cannot do them.`);
  }

  if (profile.confidence !== 'HIGH') {
    lines.push(lang === 'ar'
      ? 'ملاحظة: ظروف هذه الجلسة تجعل النتيجة تقديرية أكثر من المعتاد، لذلك سنبدأ بهدوء ونعيد التقييم قريبًا.'
      : 'Note: conditions in this session make the result more of an estimate than usual, so we will start gently and re-check soon.');
  }

  lines.push(PROFILE_DISCLAIMER[lang]);
  return lines.map(assertSafeText);
}

/** The one-line "what is my child practising" answer used by the chatbot. */
export function currentPracticeSummary(assignments, lang = 'ar') {
  if (!assignments?.length) {
    return lang === 'ar'
      ? 'لا يوجد هدف نشط حاليًا. ابدأ بالتقييم أولًا.'
      : 'No active goal yet. Start with the assessment first.';
  }
  const names = assignments.map((a) => {
    const g = GOAL_BY_ID[a.goal_id];
    return lang === 'ar' ? `«${g.nameAr}» (المستوى ${LEVEL_WORD.ar[a.level]})` : `"${g.nameEn}" (level ${a.level})`;
  }).join(lang === 'ar' ? ' و' : ' and ');

  return assertSafeText(lang === 'ar'
    ? `يتدرّب طفلك حاليًا على ${names}.`
    : `Your child is currently practising ${names}.`);
}

/* ══════════════════════════════════════════════════════════════════════════
 * LADDER ADAPTATION — the parent-facing side of IRIS-ADAPTATION-TRACE/1
 * ═══════════════════════════════════════════════════════════════════════ */

/**
 * One fixed sentence per reason code the engine can emit.
 *
 * ── WHY TEMPLATES AND NOT A LANGUAGE MODEL ────────────────────────────────
 * This is the sentence a parent reads to understand why their child's work
 * changed. It has to be true, it has to be the same every time for the same
 * reason code, and it has to be auditable against the rule that fired. A
 * generated sentence is none of those things — and "the AI decided your child
 * was ready" is precisely the explanation this product exists to replace.
 *
 * Each template describes the RULE. The observed numbers are appended
 * separately by `explainAdaptation()` from the trace, so the evidence and the
 * reasoning are visibly separate things.
 *
 * A reason code with no template here is a bug, and `explainAdaptation()`
 * reports it as "no explanation on record" rather than inventing one.
 */
const ADAPTATION_TEMPLATE = {
  TWO_CONSECUTIVE_HIGH: {
    ar: 'انتقل طفلك إلى خطوة أصعب لأنه أنهى جلستين متتاليتين بدقة عالية على نفس الخطوة.',
    en: 'Your child moved up to a harder step because two sessions in a row at the same step were highly accurate.',
  },
  HIGH_BUT_NEEDS_CORROBORATION: {
    ar: 'الجلسة كانت قوية، لكن IRIS لم يرفع مستوى الصعوبة بعد. جلسة واحدة ممتازة قد تكون يومًا جيدًا، لذلك ننتظر جلسة ثانية تؤكّدها.',
    en: 'The session was strong, but IRIS has not raised the difficulty yet. One excellent session can be a good day, so it waits for a second one to confirm it.',
  },
  LADDER_TOP_REACHED: {
    ar: 'طفلك وصل إلى أعلى خطوة متاحة في هذه المهارة داخل المحتوى الحالي، لذلك يواصل التدرّب عليها بدل الانتقال.',
    en: 'Your child has reached the highest step available for this skill in the current content, so the practice stays there rather than moving on.',
  },
  PARTIAL_MASTERY_ROTATE_FORMAT: {
    ar: 'بقيت الخطوة كما هي وتغيّر شكل النشاط فقط. الأداء في المنتصف — أعلى من أن نخفّض الصعوبة، وأقل من أن نرفعها.',
    en: 'The step stayed the same and only the activity format changed. The performance was in the middle — too strong to reduce the difficulty, not strong enough to raise it.',
  },
  ONE_LOW_ADD_SUPPORT: {
    ar: 'أضاف IRIS مساعدة إضافية على نفس الخطوة بعد جلسة صعبة واحدة، بدل تخفيض المستوى مباشرة.',
    en: 'IRIS added extra support at the same step after one difficult session, rather than reducing the level straight away.',
  },
  TWO_CONSECUTIVE_LOW: {
    ar: 'بعد جلستين صعبتين، غيّر IRIS طريقة عرض النشاط — أحيانًا يكون شكل السؤال هو الصعب، لا المهارة نفسها.',
    en: 'After two difficult sessions, IRIS changed how the activity is presented — sometimes it is the format that is hard, not the skill itself.',
  },
  THREE_CONSECUTIVE_LOW: {
    ar: 'بعد ثلاث جلسات صعبة متتالية، عاد IRIS خطوة إلى الوراء ليتدرّب طفلك على أساس أقوى.',
    en: 'After three difficult sessions in a row, IRIS stepped back one level so your child can practise on firmer ground.',
  },
  ALREADY_AT_LADDER_BASE: {
    ar: 'طفلك على أول خطوة في هذه المهارة، فلا يمكن النزول أكثر. يواصل التدرّب هنا مع مساعدة إضافية.',
    en: 'Your child is on the first step of this skill, so there is nothing lower to go to. Practice continues here with extra support.',
  },
  NO_SCORED_EVIDENCE: {
    ar: 'لا توجد ملاحظات كافية على هذه المهارة بعد، فلم يتغيّر شيء. سيتضح الأمر بعد جلسات أكثر.',
    en: 'There are not enough observations of this skill yet, so nothing changed. It will become clearer after more sessions.',
  },
};

/** What a move did, in one clause. Kept separate from the reason on purpose. */
const MOVE_EFFECT = {
  CLIMB: { ar: 'ارتفعت الصعوبة خطوة', en: 'the difficulty went up one step' },
  BACKSTEP: { ar: 'انخفضت الصعوبة خطوة', en: 'the difficulty went down one step' },
  HOLD: { ar: 'بقيت الصعوبة كما هي', en: 'the difficulty stayed the same' },
  HOLD_ROTATE_FORMAT: { ar: 'بقيت الصعوبة كما هي مع تغيير شكل النشاط', en: 'the difficulty stayed the same, with a different activity format' },
  HOLD_ADD_SCAFFOLD: { ar: 'بقيت الصعوبة كما هي مع مساعدة إضافية', en: 'the difficulty stayed the same, with extra support added' },
  SHIFT_MODALITY: { ar: 'بقيت الصعوبة كما هي مع تغيير طريقة العرض', en: 'the difficulty stayed the same, presented a different way' },
  AT_TOP: { ar: 'بقي التدرّب على أعلى خطوة متاحة', en: 'practice stayed at the highest available step' },
  AT_BASE: { ar: 'بقي التدرّب على أول خطوة', en: 'practice stayed at the first step' },
};

/** The parent-safe name of a skill strand. Falls back to nothing, never to an id. */
export function strandLabel(strandId, lang = 'ar') {
  const s = STRAND_BY_ID[strandId];
  if (!s) return null;
  return lang === 'ar' ? s.nameAr : s.nameEn;
}

/**
 * Turn one IRIS-ADAPTATION-TRACE/1 record into what a parent reads.
 *
 * Returns `null` when there is nothing observed to explain — the caller must
 * say so plainly rather than filling the gap. This function never guesses: if
 * the trace has no decision, or the reason code has no approved template, that
 * is reported as an absence, not smoothed over.
 *
 * @returns {null | { headline, reason, evidence, skill, move, reason_code, rule_id, confidence }}
 */
export function explainAdaptation(trace, lang = 'ar') {
  if (!trace || trace.schema !== 'IRIS-ADAPTATION-TRACE/1' || !trace.decision) return null;

  const { move, reasonCode, ruleId, fromRung, toRung } = trace.decision;
  const obs = trace.observed ?? {};
  const skill = strandLabel(obs.strand, lang);

  const effect = MOVE_EFFECT[move]?.[lang] ?? null;
  const headline = skill && effect
    ? (lang === 'ar' ? `في «${skill}»: ${effect}.` : `In "${skill}": ${effect}.`)
    : effect
      ? (lang === 'ar' ? `${effect}.` : `${effect[0].toUpperCase()}${effect.slice(1)}.`)
      : null;

  const template = ADAPTATION_TEMPLATE[reasonCode]?.[lang] ?? null;
  const reason = template ?? (lang === 'ar'
    ? 'لا توجد صياغة معتمدة لهذا السبب بعد، لذلك لن نخترع تفسيرًا. السبب المسجَّل في السجل هو الأساس.'
    : 'There is no approved wording for this reason yet, so no explanation is invented here. The recorded reason code is the record.');

  /**
   * The evidence line is the observation itself, in the plainest terms
   * available: how many, out of how many. No percentile, no comparison, no
   * band label — those are the things doc 16 forbids showing a parent.
   */
  let evidence = null;
  if (Number(obs.attempts) > 0) {
    evidence = lang === 'ar'
      ? `الملاحظة: ${obs.correct} إجابة صحيحة من ${obs.attempts}.`
      : `Observed: ${obs.correct} correct out of ${obs.attempts}.`;
  }

  return {
    headline: headline ? assertSafeText(headline) : null,
    reason: assertSafeText(reason),
    evidence: evidence ? assertSafeText(evidence) : null,
    skill,
    move,
    from_rung: fromRung,
    to_rung: toRung,
    reason_code: reasonCode,
    rule_id: ruleId,
    has_approved_wording: template != null,
    confidence: trace.state?.confidence ?? null,
    at: trace.at ?? null,
  };
}

/**
 * The sentence Ask IRIS gives when a parent asks why something changed.
 *
 * When there is no observed adaptation this returns the honest absence. It is
 * a separate string rather than the generic fallback because "I have not seen
 * enough yet" and "I do not know the answer to that question" are different
 * things, and a parent deserves to be told which one applies.
 */
export function adaptationAnswer(trace, lang = 'ar') {
  const x = explainAdaptation(trace, lang);
  if (!x) {
    return {
      answered: false,
      text: lang === 'ar'
        ? 'لم يسجّل IRIS أي تغيير في مسار طفلك بعد، لأن الملاحظات المتاحة غير كافية. بعد جلسة أو جلستين سيظهر هنا ما تغيّر ولماذا.'
        : 'IRIS has not recorded any change to your child\'s pathway yet, because there is not enough observed information. After a session or two, what changed and why will appear here.',
    };
  }
  return {
    answered: true,
    text: [x.headline, x.reason, x.evidence].filter(Boolean).join(' '),
    detail: x,
  };
}

/**
 * "What is my child practising now?", answered from the ladder pathway.
 *
 * The older `currentPracticeSummary()` reads the goal/level assignments, which
 * a child on the ladder path never has — so it answered "no active goal yet"
 * for a child who had just finished an assessment and three practice rounds.
 * This reads the same priorities Parent Mode shows.
 *
 * Returns null when there is genuinely nothing observed, so the caller can say
 * that rather than produce a sentence with nothing in it.
 */
export function currentLadderPractice({ priorities, next }, lang = 'ar') {
  const names = [];
  if (next?.strand) {
    const n = strandLabel(next.strand, lang);
    if (n) names.push(n);
  }
  for (const p of priorities ?? []) {
    const id = typeof p === 'string' ? p : p?.strand ?? p?.id;
    const n = strandLabel(id, lang);
    if (n && !names.includes(n)) names.push(n);
    if (names.length >= 3) break;
  }
  if (names.length === 0) return null;

  const list = names.map((n) => (lang === 'ar' ? `«${n}»` : `"${n}"`))
    .join(lang === 'ar' ? '، و' : ', ');
  return assertSafeText(lang === 'ar'
    ? `يتدرّب طفلك حاليًا على ${list}. هذه المهارات اختيرت من أداء طفلك نفسه في الجلسات السابقة.`
    : `Your child is currently practising ${list}. These were chosen from your child's own performance in earlier sessions.`);
}
