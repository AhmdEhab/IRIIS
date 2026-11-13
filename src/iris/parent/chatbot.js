/**
 * IRIS — Parent Chatbot (rule-based + knowledge-base retrieval)
 *
 * ── DESIGN CHOICE, STATED HONESTLY ────────────────────────────────────────
 * This is NOT a generative LLM chatbot. It is deterministic retrieval over an
 * approved knowledge base, plus live facts from the child's own session data.
 *
 * That is a deliberate safety decision, not a limitation we are hiding:
 * doc 20 §11 lists open-ended chat as deliberately absent, and doc 15 §5
 * requires that anything reaching a parent be reviewed content. A retrieval
 * bot cannot invent a research citation, cannot invent a diagnosis, and
 * cannot fabricate a benefit claim, because it can only return text that
 * already exists in guidance.js.
 *
 * If it has no approved answer, it SAYS SO. It never guesses.
 * ──────────────────────────────────────────────────────────────────────────
 */
import { PARENT_GUIDANCE } from './guidance.js';
import { currentPracticeSummary, explainDecision, explainGoalStatus, subMeasureLabel, adaptationAnswer, currentLadderPractice } from './explain.js';
import { activityFor, PLAYBOOK_TIER } from './playbook.js';

/** Topics that must ALWAYS route to a human professional. */
const SAFETY_ROUTES = [
  {
    id: 'MEDICAL',
    patterns: [
      // `نوم` alone used to match ANY bedtime question, so "what time should
      // he sleep?" was refused as medical while the English side correctly
      // matched only apnea/snoring. Narrowed to the clinical sleep terms so
      // the two languages now have the same boundary.
      /دواء|علاج دوائي|طبيب|مرض|أعراض|جرعة|تشنج|نوبة|قلب|تنفّس|تنفس|انقطاع النفس|شخير|يشخر|تشخر|اضطراب النوم|صعوبة في النوم/i,
      /medicine|medication|drug|doctor|symptom|dose|seizure|heart|breathing|sleep apnea|snoring|sleep disorder/i,
    ],
    ar: 'هذا سؤال طبي، وIRIS ليس أداة طبية ولا يمكنه الإجابة عنه. أنصحك بالتواصل مع طبيب الأطفال أو الطبيب المتابع لحالة طفلك. لن أقدّم لك إجابة تخمينية في موضوع طبي.',
    en: 'This is a medical question. IRIS is not a medical tool and cannot answer it. Please speak with your paediatrician or your child\'s treating doctor. I will not give you a guessed answer on a medical matter.',
  },
  {
    id: 'DIAGNOSIS',
    patterns: [
      /تشخيص|هل عند طفلي|هل ابني مصاب|ذكاء|توحّد|توحد|متلازمة/i,
      // \biq\b, not `iq`: unanchored it matched inside ordinary words, so
      // "what is a unique activity for him?" was refused as a diagnosis
      // question. Verified by running the pattern against that sentence.
      /diagnos|does my child have|\biq\b|\bi\.q\b|autistic|autism level|intelligence score/i,
    ],
    ar: 'IRIS لا يشخّص ولا يقيس الذكاء إطلاقًا. ما يعرضه هو أداء طفلك في أنشطة تعليمية محدّدة فقط. أي سؤال عن تشخيص أو مستوى ذكاء يحتاج تقييمًا من مختص مؤهّل (طبيب نمو أو أخصائي نفسي إكلينيكي).',
    en: 'IRIS does not diagnose and does not measure intelligence at all. What it shows is only your child\'s performance on specific educational activities. Any question about a diagnosis or an intelligence level needs an assessment by a qualified professional (a developmental paediatrician or clinical psychologist).',
  },
  {
    id: 'EMERGENCY',
    patterns: [
      /طوارئ|إسعاف|خطر|يؤذي نفسه|إيذاء|انتحار|لا يتنفّس|فقد الوعي/i,
      /emergency|ambulance|hurting himself|hurting herself|self-harm|suicide|not breathing|unconscious/i,
    ],
    ar: 'إذا كان هناك خطر فوري على طفلك، توقّفي عن استخدام التطبيق واتصلي بخدمات الطوارئ في بلدك أو توجّهي لأقرب مستشفى فورًا. هذا ليس شيئًا يمكن لتطبيق تعليمي المساعدة فيه.',
    en: 'If your child is in immediate danger, stop using the app and contact emergency services in your country or go to the nearest hospital right away. This is not something an educational app can help with.',
  },
  {
    id: 'THERAPY_PLAN',
    patterns: [
      /خطة علاجية|جلسات تخاطب|علاج وظيفي|تدخل مبكر|برنامج علاجي/i,
      /therapy plan|speech therapy|occupational therapy|treatment plan|early intervention programme/i,
    ],
    ar: 'وضع خطة علاجية أو تحديد نوع الجلسات المناسبة قرار مهني يحتاج أخصائيًا (تخاطب، علاج وظيفي، أو تربية خاصة) يقابل طفلك مباشرة. IRIS أداة تدريب تعليمي فقط ولا يمكنه أن يحلّ محل ذلك.',
    en: 'Setting a therapy plan or deciding which sessions are appropriate is a professional decision that needs a specialist (speech, occupational therapy, or special education) who sees your child directly. IRIS is an educational practice tool only and cannot replace that.',
  },
];

/** Live-data intents answered from the child's own session record. */
const LIVE_INTENTS = [
  {
    id: 'CURRENT_PRACTICE',
    patterns: [/ماذا يتدرّب|ماذا يتدرب|على ماذا يعمل|ما الهدف الحالي|إيه اللي بيتدرب/i, /what is my child practis|current goal|what are they working on/i],
  },
  {
    id: 'WHY_DECISION',
    patterns: [/لماذا|ليه|لماذا انتقل|لماذا تغيّر|سبب القرار/i, /why did|why has|reason for the change|why level/i],
  },
  {
    id: 'PROGRESS',
    patterns: [/تقدّم|تقدم|كيف أداؤه|هل تحسّن|هل تحسن|مستواه/i, /progress|how is my child doing|improving|their level/i],
  },
];

function matches(patterns, text) {
  return patterns.some((p) => p.test(text));
}

/** Simple deterministic keyword scoring over the approved KB. */
function retrieve(question, lang) {
  const q = question.toLowerCase();
  const scored = PARENT_GUIDANCE.map((entry) => {
    let score = 0;
    for (const kw of entry.keywords) {
      if (q.includes(kw.toLowerCase())) score += 2;
    }
    const topic = (lang === 'ar' ? entry.topic_ar : entry.topic_en).toLowerCase();
    for (const word of topic.split(/\s+/)) {
      if (word.length > 3 && q.includes(word)) score += 1;
    }
    return { entry, score };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id));

  return scored;
}


/* ═══════════════════════════════════════════════════════════════════════════
   THE SUPPORT PLAN

   A parent asking "what do I do about this?" needs seven things, in order:
   what was seen, what that might mean for learning, what to do today, the
   activity itself, roughly how long, what to watch, and when to change it.
   "Practise memory skills with your child" answers none of them.

   TWO RULES HOLD THIS TOGETHER, AND BOTH ARE STRUCTURAL RATHER THAN STYLISTIC

   1. OBSERVED IS SEPARATE FROM INFERRED.
      `observed` is built ONLY from numbers that exist in the child's own
      session records — accuracy, independence, which goal, which level, how
      many sessions. If there are no sessions, the array is EMPTY and the
      answer says so. Nothing is ever estimated into it. `meaning` is the
      inference, is always hedged ("ممكن يكون…", "قد يساعد…"), and is never
      phrased as a fact about the child.

   2. NO DATA MEANS NO PLAN.
      Without session records this path does not run at all, and the question
      falls through to the knowledge base. A "personalised" plan built on no
      observations is exactly the generic advice this is meant to replace.

   ON THE DURATION FIELD
   The minutes come from the playbook and describe how long that little
   activity takes. They are never an answer to "how long should sessions be" —
   that stays a research gap with no number (PG-SESSION-LENGTH), and the guard
   below routes such questions there before this code runs.
═══════════════════════════════════════════════════════════════════════════ */

/** "What do I do?" — the questions a support plan is the right answer to. */
const HELP_INTENT = [
  /إيه أعمل|إزاي أساعد|كيف أساعد|أساعده إزاي|نعمل إيه|أعمل إيه|إيه اللي أقدر|ممكن أعمل|نشاط|تمرين|في البيت|أتمرن معاه|أذاكر معاه/i,
  /what (can|should|do) i do|how (can|do) i help|help (him|her|them|my child)|activity|exercise|at home|practise with|practice with/i,
];

/** Session length is a research gap and must reach PG-SESSION-LENGTH, never a plan. */
const SESSION_LENGTH_GUARD = [
  /مدة الجلسة|كام دقيقة|كم دقيقة|طول الجلسة|قد إيه وقت|كام مرة في اليوم/i,
  /how long.*(session|should)|session length|how many minutes|how often.*day/i,
];

/**
 * Facts, straight from the child's own records. No estimates, no rounding up
 * into a story. Returns [] when there is nothing real to report.
 */
function observedFrom(context, lang) {
  const out = [];
  const ar = lang === 'ar';
  const sessions = Array.isArray(context.sessions) ? context.sessions : [];
  const assignments = Array.isArray(context.assignments) ? context.assignments : [];
  const profile = context.profile || null;

  if (assignments.length) {
    const a = assignments[0];
    out.push(
      ar
        ? `دلوقتي بيتدرّب على «${goalLabel(a, 'ar')}» عند المستوى ${a.level} من ٤.`
        : `Right now they are practising "${goalLabel(a, 'en')}" at level ${a.level} of 4.`
    );
  }

  const recent = sessions.slice(-3);
  if (recent.length) {
    const acc = recent
      .map((r) => (typeof r.accuracy === 'number' ? Math.round(r.accuracy * 100) : null))
      .filter((n) => n !== null);
    if (acc.length) {
      out.push(
        ar
          ? `في آخر ${recent.length} ${recent.length === 1 ? 'جلسة' : 'جلسات'}، الإجابات الصح كانت ${acc.join('٪ و')}٪.`
          : `Across the last ${recent.length} session${recent.length === 1 ? '' : 's'}, correct answers were ${acc.join('% and ')}%.`
      );
    }
    const flagged = recent.filter((r) => r.engagement_flag).length;
    if (flagged) {
      out.push(
        ar
          ? `${flagged} من الجلسات دي اتسجّل فيها إن التركيز راح قبل ما تخلص.`
          : `${flagged} of those sessions were recorded as losing focus before the end.`
      );
    }
  }

  if (profile?.support_areas?.length) {
    const names = profile.support_areas.map((s) => subMeasureLabel(s, ar ? 'ar' : 'en'));
    out.push(
      ar
        ? `من أنشطة التعرّف، المجال اللي بنشتغل عليه دلوقتي هو ${names.join(' و')}.`
        : `From the getting-to-know activities, the area being worked on is ${names.join(' and ')}.`
    );
  }
  if (profile?.strengths?.length) {
    const names = profile.strengths.map((s) => subMeasureLabel(s, ar ? 'ar' : 'en'));
    out.push(
      ar
        ? `وكمان ظهر إنه مرتاح أكتر في ${names.join(' و')}.`
        : `They also came across as more comfortable with ${names.join(' and ')}.`
    );
  }

  // The ladder assessment, when one has been completed.
  out.push(...observedFromLadder(context.ladder, lang));

  return out;
}

/**
 * ── LADDER ASSESSMENT CONTEXT (Phase 9 fix) ───────────────────────────────
 *
 * The Phase 5 ladder assessment produces the richest picture IRIS has of a
 * child — per-strand indicators, floors, strengths, priorities — and the
 * chatbot could not see any of it. A parent whose child had just completed a
 * full assessment still got generic answers, which the brief rules out
 * explicitly ("do NOT give generic advice when useful child context is
 * available").
 *
 * This is additive. When `context.ladder` is absent, everything below is
 * skipped and the original behaviour is unchanged.
 *
 * Nothing here invents an observation: every line is built from a measured
 * indicator or a recorded floor, and a strand with no evidence produces no
 * sentence at all.
 */

/**
 * Strand → playbook activity key.
 *
 * Only mappings where a genuine counterpart exists. The playbook has nine
 * home activities, all built for the original sub-measures; a ladder strand
 * with no honest match is deliberately absent from this table rather than
 * pointed at the nearest thing, because a "suggested activity" that does not
 * actually target the skill is worse than no suggestion.
 *
 * NUMERACY IS ABSENT ON PURPOSE. The playbook contains no numeracy activity,
 * and inventing one here would be fabricating advice for a parent. When the
 * top priority is numeracy the chatbot falls through to its existing
 * "no approved answer, and I will not invent one" path.
 */
const STRAND_TO_SUB_MEASURE = {
  'LIT.READINESS': 'VSP.MATCHING',
  'LIT.LETTER_AWARE': 'VSP.MATCHING',
  'LIT.LETTER_FORMS': 'VSP.MATCHING',
  'LIT.DOT_CONTRAST': 'VSP.MATCHING',
  'LIT.PHON_SYLLABLE': 'LANG.PHON_AWARE',
  'LIT.PHON_RHYME': 'LANG.PHON_AWARE',
  'LIT.PHON_BLEND': 'LANG.PHON_AWARE',
  'LIT.PHON_SEGMENT': 'LANG.PHON_AWARE',
  'LIT.SOUND_TO_LETTER': 'LANG.PHON_AWARE',
  'LIT.LETTER_TO_SOUND': 'LANG.PHON_AWARE',
  'LIT.LISTEN_WORD': 'LANG.RECEP_VOCAB',
  'LIT.LISTEN_SENTENCE': 'LANG.RECEP_VOCAB',
  'LIT.LISTEN_INSTRUCTION': 'LANG.INSTRUCTION',
  'LIT.LISTEN_STORY': 'LANG.INSTRUCTION',
  'NUM.PATTERN': 'VSP.PATTERN',
};

const strandName = (s, ar) => (ar ? s?.nameAr : s?.nameEn) || s?.strand || '';

/** Observations drawn from a completed ladder assessment. Facts only. */
function observedFromLadder(ladder, lang) {
  const out = [];
  if (!ladder) return out;
  const ar = lang === 'ar';

  const strengths = (ladder.strengths || []).filter((s) => s && !s.notMeasured);
  const floors = (ladder.floors || []);

  /**
   * A floor is already listed under "still building" in the snapshot, so
   * passing both through unfiltered made the assistant name the same three
   * skills twice in consecutive sentences — once as building, once as tried
   * and hard. A parent reads that as two separate findings.
   *
   * Floors get the more specific sentence (we tried it and nothing came out
   * right), so they are removed from the general "still building" list.
   */
  const floorIds = new Set(floors.map((f) => f.strand));
  const developing = (ladder.developing || [])
    .filter((s) => s && !s.notMeasured && !floorIds.has(s.strand));

  if (strengths.length) {
    const names = strengths.map((s) => strandName(s, ar));
    out.push(
      ar
        ? `في أنشطة التعرّف، أحسن حاجة عملها كانت ${names.join(' و')}.`
        : `In the getting-to-know activities, what went best was ${names.join(' and ')}.`
    );
  }
  if (developing.length) {
    const names = developing.map((s) => strandName(s, ar));
    out.push(
      ar
        ? `والحاجات اللي لسه بتتبني عنده: ${names.join(' و')}.`
        : `The skills still building are ${names.join(' and ')}.`
    );
  }
  if (floors.length) {
    const names = floors.map((s) => strandName(s, ar));
    out.push(
      ar
        ? `وفي ${names.join(' و')} جرّبنا ومحصلش إجابة صح، فدي نقطة بداية كويسة للتدريب.`
        : `On ${names.join(' and ')} we tried and no answer came out right, so that is a good place to start practising.`
    );
  }

  // Confidence is reported honestly rather than implied.
  if (ladder.confidence === 'LOW') {
    out.push(
      ar
        ? 'دي جلسة واحدة قصيرة، فالصورة لسه أوّلية وهتوضح أكتر مع كل جلسة.'
        : 'This was one short session, so the picture is still early and sharpens with each session.'
    );
  }
  return out;
}

function goalLabel(assignment, lang) {
  const g = assignment?.goal || {};
  return (lang === 'ar' ? g.title_ar || g.label_ar : g.title_en || g.label_en) || assignment?.goal_id || '';
}

/**
 * Which area should the activity target? The child's own support area first,
 * then whatever goal they are currently assigned. Never a diagnosis.
 */
function pickFocus(context) {
  const profile = context.profile || null;
  const assignments = Array.isArray(context.assignments) ? context.assignments : [];

  // The ladder's own top priority wins when there is one — it is the most
  // recent and most specific evidence available. Falls back to the original
  // sources when no ladder assessment has been run.
  const ladderPriority = (context.ladder?.priorities || [])
    .map((p) => STRAND_TO_SUB_MEASURE[p.strand])
    .find(Boolean) || null;

  const sub_measure =
    ladderPriority
    || profile?.support_areas?.[0]
    || assignments[0]?.goal?.primary_sub_measure
    || null;
  const goal_id = assignments[0]?.goal_id || null;
  return { sub_measure, goal_id };
}

/** Build the seven-part answer. Returns null when there is nothing real to build on. */
function composeSupportPlan(context, lang) {
  const ar = lang === 'ar';
  const observed = observedFrom(context, lang);
  if (!observed.length) return null;

  const act = activityFor(pickFocus(context));
  if (!act) return null;

  return {
    type: 'SUPPORT_PLAN',
    // 1 — facts only
    observed,
    // 2 — inference, always hedged, never a statement about the child
    meaning: ar ? act.means_ar : act.means_en,
    // 3 — what to do today
    today: ar
      ? 'خلينا نجرب حاجة بسيطة النهارده، مش محتاجة تحضير.'
      : "Let's try one simple thing today — nothing to prepare.",
    // 4 — the activity itself
    activity: {
      title: ar ? act.title_ar : act.title_en,
      materials: ar ? act.materials_ar : act.materials_en,
      steps: ar ? [...act.steps_ar] : [...act.steps_en],
    },
    // 5 — a suggestion, not a prescription
    duration: ar ? act.duration_ar : act.duration_en,
    // 6 — what to watch, phrased as noticing rather than measuring
    watch: ar ? act.watch_ar : act.watch_en,
    // 7 — easier first, always
    adjust: {
      easier: ar ? act.easier_ar : act.easier_en,
      harder: ar ? act.harder_ar : act.harder_en,
    },
    reassurance: ar
      ? 'ولا يهمك لو النشاط كان صعب — ده بيدينا معلومة مهمة عن المستوى الحالي.'
      : "It is fine if the activity turns out hard — that tells us something useful about where things are now.",
    activity_id: act.id,
    evidence_tier: act.evidence_tier,
    source: act.source,
    sources: ['child_session_data', act.id],
    disclosure: ar
      ? 'ℹ️ «لاحظنا» فوق مبني على جلسات طفلك الفعلية. الاقتراح نفسه فكرة عملية بسيطة، مش برنامج علاجي ولا نتيجة بحث.'
      : 'ℹ️ The "what we noticed" part comes from your child\'s actual sessions. The suggestion itself is a simple practical idea — not a treatment plan and not a research finding.',
  };
}

const FALLBACK = {
  ar: 'لا أملك إجابة معتمدة على هذا السؤال ضمن قاعدة المعرفة الحالية، ولن أخترع إجابة. هذا السؤال يحتاج رأي مختص (تربية خاصة أو تخاطب أو طبيب نمو). يمكنك أيضًا إعادة صياغة السؤال بكلمات أبسط وسأبحث مرة أخرى.',
  en: 'I do not have an approved answer to this in the current knowledge base, and I will not invent one. This question needs a specialist (special education, speech and language, or developmental paediatrics). You can also rephrase it more simply and I will search again.',
};

const DISCLOSURE = {
  ar: 'ℹ️ هذه إجابة مسترجَعة من قاعدة معرفة مبنية على الأدلة البحثية الحالية، ولم تتم مراجعتها من مختص بعد.',
  en: 'ℹ️ This answer is retrieved from a knowledge base built on the current research evidence. It has not yet been reviewed by a specialist.',
};

/**
 * Answer a parent question.
 *
 * @param {string} question
 * @param {object} [context] live child data: { assignments, lastDecision, snapshots }
 * @param {string} [lang] 'ar' | 'en'
 */
export function answerParentQuestion(question, context = {}, lang = 'ar') {
  const text = String(question || '').trim();
  if (!text) {
    return { type: 'EMPTY', answer: lang === 'ar' ? 'اكتبي سؤالك من فضلك.' : 'Please type your question.', sources: [] };
  }

  // 1. Safety routing ALWAYS runs first and always wins.
  for (const route of SAFETY_ROUTES) {
    if (matches(route.patterns, text)) {
      return {
        type: 'SAFETY_FALLBACK',
        route: route.id,
        answer: route[lang],
        sources: [],
        requires_professional: true,
      };
    }
  }

  // 2. A support plan, when the parent is asking what to DO and we have real
  //    observations to ground it in. Session-length questions are guarded out
  //    first: that one is a research gap and belongs to the knowledge base.
  if (matches(HELP_INTENT, text) && !matches(SESSION_LENGTH_GUARD, text)) {
    const plan = composeSupportPlan(context, lang);
    if (plan) return plan;
  }

  // 3. Live data about this specific child.
  for (const intent of LIVE_INTENTS) {
    if (matches(intent.patterns, text)) {
      if (intent.id === 'CURRENT_PRACTICE') {
        /**
         * Ladder priorities first: a child on the current pathway has no
         * goal/level assignments, and answering from the older shape told a
         * parent "no active goal yet" immediately after their child had
         * finished an assessment and three rounds of practice.
         */
        const fromLadder = currentLadderPractice(
          { priorities: context.ladder?.priorities, next: context.lastAdaptation?.next },
          lang
        );
        if (fromLadder) {
          return {
            type: 'LIVE_DATA', intent: intent.id,
            answer: fromLadder, observed: true, sources: ['child_session_data'],
          };
        }
        if (context.assignments?.length) {
          return {
            type: 'LIVE_DATA', intent: intent.id,
            answer: currentPracticeSummary(context.assignments, lang),
            observed: true, sources: ['child_session_data'],
          };
        }
        return {
          type: 'NO_OBSERVATION', intent: intent.id,
          answer: lang === 'ar'
            ? 'لم يبدأ طفلك أي نشاط بعد، فلا توجد ملاحظات أقول منها على ماذا يتدرّب. ابدأ بأنشطة التعرّف أولًا.'
            : 'Your child has not started any activities yet, so there is nothing observed to tell you what they are practising. Start with the getting-to-know activities first.',
          observed: false, sources: [],
        };
      }
      if (intent.id === 'WHY_DECISION') {
        /**
         * The ladder trace is preferred over the older pathway decision
         * because it is what the app now produces on every practice round.
         * Both are real records of a rule that fired; neither is generated.
         */
        if (context.lastAdaptation) {
          const a = adaptationAnswer(context.lastAdaptation, lang);
          return {
            type: 'LIVE_DATA', intent: intent.id,
            answer: a.text,
            observed: a.answered,
            sources: a.answered
              ? ['child_session_data', a.detail.rule_id, a.detail.reason_code]
              : [],
            reason_code: a.detail?.reason_code ?? null,
            rule_id: a.detail?.rule_id ?? null,
          };
        }
        if (context.lastDecision) {
          return {
            type: 'LIVE_DATA', intent: intent.id,
            answer: explainDecision(context.lastDecision, lang),
            observed: true,
            sources: ['child_session_data', context.lastDecision.rule_id],
          };
        }
        /**
         * Nothing observed. This returns the honest absence rather than
         * dropping through to knowledge-base retrieval, which would answer a
         * question about THIS child with generic guidance and read, to a
         * parent, as if IRIS had looked and found something.
         */
        return {
          type: 'NO_OBSERVATION', intent: intent.id,
          answer: adaptationAnswer(null, lang).text,
          observed: false,
          sources: [],
        };
      }
      if (intent.id === 'PROGRESS' && context.assignments?.length) {
        const parts = context.assignments.map((a, i) =>
          explainGoalStatus({ assignment: a, snapshot: context.snapshots?.[i] }, lang)
        );
        return {
          type: 'LIVE_DATA', intent: intent.id,
          answer: parts.join(' '),
          sources: ['child_session_data'],
        };
      }
    }
  }

  // 4. Knowledge-base retrieval.
  const hits = retrieve(text, lang);
  if (hits.length === 0) {
    return { type: 'FALLBACK_NO_ANSWER', answer: FALLBACK[lang], sources: [], requires_professional: true };
  }

  const best = hits[0].entry;
  const body = lang === 'ar' ? best.guidance_ar : best.guidance_en;
  const safety = best.safety_note ? `\n\n⚠️ ${best.safety_note}` : '';

  return {
    type: 'KB_ANSWER',
    answer: `${body}${safety}\n\n${DISCLOSURE[lang]}`,
    topic: lang === 'ar' ? best.topic_ar : best.topic_en,
    evidence_tier: best.evidence_tier,
    source: best.source,
    validation_status: best.validation_status,
    specialist_review_status: best.specialist_review_status,
    sources: [best.id],
    related: hits.slice(1, 3).map((h) => ({ id: h.entry.id, topic: lang === 'ar' ? h.entry.topic_ar : h.entry.topic_en })),
  };
}

/** Suggested starter questions for the demo UI. */
export const SUGGESTED_QUESTIONS = {
  ar: [
    'على ماذا يتدرّب طفلي الآن؟',
    'لماذا تغيّر مستوى طفلي؟',
    'كيف أساعده عندما يجد النشاط صعبًا؟',
    'كيف أشجّعه على الاستقلالية دون مساعدة زائدة؟',
    'كم يجب أن تكون مدة الجلسة؟',
    'كيف أقلّل المشتتات في البيت؟',
  ],
  en: [
    'What is my child practising now?',
    'Why did my child\'s level change?',
    'How do I help when the activity is hard?',
    'How do I encourage independence without over-helping?',
    'How long should a session be?',
    'How do I reduce distractions at home?',
  ],
};
