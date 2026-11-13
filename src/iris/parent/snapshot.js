/**
 * IRIS — Parent learning snapshot (Phase 5).
 *
 * Turns the assessment result into something a parent can act on.
 *
 * ── LANGUAGE RULES ────────────────────────────────────────────────────────
 *  - Egyptian Arabic, warm, second person to the parent.
 *  - Observation and inference stay separate: «لاحظنا…» for what happened,
 *    «ممكن نجرب…» for what to try. Never «طفلك عنده…».
 *  - No diagnosis, no IQ, no percentile, no age equivalent, no reading age,
 *    no comparison to other children of any kind. BANNED_TERMS enforces the
 *    vocabulary; this file must not route around it.
 *  - Internal vocabulary — rung, strand, indicator, DPS, ladder, confidence
 *    thresholds — does not appear in parent-facing strings.
 *
 * ── WHAT IS DELIBERATELY NOT CLAIMED ──────────────────────────────────────
 *  - The suggested practice time is an ENGINEERING ASSUMPTION. No source in
 *    ASSESSMENT_RESEARCH_MATRIX.md supplies a dosage; the one randomised trial
 *    that might have (D5) could not be retrieved. It is offered as a starting
 *    point, and the copy says so rather than implying evidence.
 *  - A dialect-distance caveat is rendered NEXT TO the number it qualifies,
 *    never in a footnote, because a phonological score that understates a
 *    child for a linguistic reason is exactly the number a parent would
 *    otherwise act on wrongly (matrix B5).
 */
import { PROFILE_DISCLAIMER, BANNED_TERMS, VALIDATION } from '../spec.js';
import { STRAND_BY_ID } from '../ladders/index.js';

export const PRACTICE_SUGGESTION = {
  minutes_per_day: 10,
  _validation: VALIDATION.ENGINEERING_ASSUMPTION,
  _source: 'no source in the research matrix supplies a dosage — see D5',
};

/** Domain labels for the parent view. No internal names. */
const DOMAIN_LABEL = {
  LITERACY: { ar: 'القراءة والحروف', en: 'Reading and letters' },
  NUMERACY: { ar: 'الأرقام والحساب', en: 'Numbers and counting' },
  LISTENING: { ar: 'الفهم بالسمع', en: 'Listening and understanding' },
};

/**
 * "What to observe" prompts, keyed by the shape of the finding rather than by
 * strand, so a new strand does not silently fall back to a generic line.
 */
const WATCH_FOR = {
  'LIT.SOUND_TO_LETTER': {
    ar: 'هل بيعرف يجيب الحرف لما تقوليله الصوت، لكن بيتلخبط لما تشوفيه الحرف وتسأليه بيقول إيه؟',
    en: 'Can he find the letter when you say the sound, but get stuck when you show him the letter and ask what it says?',
  },
  'LIT.LETTER_TO_SOUND': {
    ar: 'هل بيتعرّف على شكل الحرف بسهولة لكن بيتلخبط لما ييجي يقول صوته؟',
    en: 'Does he recognise the letter easily but get stuck saying its sound?',
  },
  'LIT.DOT_CONTRAST': {
    ar: 'خلّي بالك وهو بيقرا: هل بيخلط بين الحروف اللي شكلها واحد ومختلفة في النقط زي ب و ت و ث؟',
    en: 'Watch as he reads: does he mix up letters that share a shape and differ in dots, like ب ت ث?',
  },
  'LIT.LETTER_FORMS': {
    ar: 'هل بيعرف الحرف لوحده لكن مش بيعرفه لما يكون جوّه كلمة؟',
    en: 'Does he know the letter on its own but not inside a word?',
  },
  'NUM.CARDINALITY': {
    ar: 'لما تطلبي منه «هاتلي تلاتة» — بيدّيكي تلاتة بالظبط ولا بياخد كتير ويقف لما تقوليله؟',
    en: 'When you ask for three, does he give exactly three, or keep going until you stop him?',
  },
  'NUM.NUMERAL': {
    ar: 'هل بيعرف يعُدّ لكن لسه مش عارف شكل الرقم مكتوب؟',
    en: 'Can he count, but not yet recognise the written numeral?',
  },
  'NUM.COUNTING': {
    ar: 'وهو بيعُدّ — بيلمس كل حاجة مرّة واحدة بس، ولا بيتخطّى أو بيعُدّ نفس الحاجة تاني؟',
    en: 'As he counts, does he touch each thing exactly once, or skip and double back?',
  },
  'LIT.PHON_RHYME': {
    ar: 'جرّبي كلمتين بيخلصوا زي بعض وشوفي بيلاحظ ولا لأ.',
    en: 'Try two words that end the same and see whether he notices.',
  },
  _default: {
    ar: 'لاحظي إمتى بيعرف يعملها لوحده وإمتى بيحتاج مساعدة — الفرق ده بيقول كتير.',
    en: 'Notice when he manages alone and when he needs help — that difference says a lot.',
  },
};

const watchFor = (strandId) => WATCH_FOR[strandId] ?? WATCH_FOR._default;

/** Guard: nothing parent-facing may contain a banned term. */
export function containsBannedTerm(text) {
  const lower = String(text || '').toLowerCase();
  return BANNED_TERMS.filter((t) => lower.includes(t.toLowerCase()));
}

/**
 * Build the snapshot.
 *
 * @param {object} input
 * @param {object} input.indicators
 * @param {object} input.profile
 * @param {Array}  input.priorities
 * @param {object} [input.domains]
 * @param {string} [input.childName]
 */
export function buildSnapshot({ indicators, profile, priorities, domains = {}, childName = null }) {
  const name = childName || null;

  const line = (strandId) => {
    const i = indicators[strandId];
    const s = STRAND_BY_ID[strandId];
    if (!i || !s) return null;
    return {
      strand: strandId,
      nameAr: s.nameAr,
      nameEn: s.nameEn,
      /** null renders as "—". It must never render as zero. */
      value: i.notMeasured ? null : i.indicator,
      not_measured: i.notMeasured,
      floor: !!i.floor,
      confidence: i.confidence,
      /** Rendered beside the number, not in a footnote. */
      caveat: i.dialect_caveat
        ? {
            ar: 'الأصوات دي مش موجودة في العامية المصرية، فالنتيجة دي ممكن تكون أقل من قدرة الطفل الحقيقية.',
            en: 'These sounds are not used in everyday Egyptian Arabic, so this may understate what the child can do.',
          }
        : null,
    };
  };

  /**
   * Strengths, with a fallback that does not manufacture one.
   *
   * `profile.strengths` is empty whenever the profile is FLAT — the existing
   * guard that refuses to invent a relative strength where none exists, which
   * is right and stays. But handing a parent of a child with an intellectual
   * disability a page with an empty strengths section and four "still
   * developing" rows is a real harm of its own, and it is not even accurate:
   * the child did do some things well.
   *
   * So when there is no relative strength, we show the highest-scoring
   * measured strands under a DIFFERENT heading — "what he did well today" —
   * which is an observation, not a claim about his profile. The distinction is
   * carried in `kind` so the UI cannot blur the two.
   */
  const relative = profile.strengths.map(line).filter(Boolean);
  const bestToday = Object.values(indicators)
    .filter((i) => !i.notMeasured)
    .sort((a, b) => b.indicator - a.indicator || a.strand.localeCompare(b.strand))
    .slice(0, 3)
    .map((i) => line(i.strand))
    .filter(Boolean);

  const strengths = relative.length ? relative : bestToday;
  const strengthsKind = relative.length ? 'RELATIVE_STRENGTH' : 'DID_WELL_TODAY';
  const developing = [
    ...Object.values(indicators).filter((i) => i.floor).map((i) => line(i.strand)),
    ...profile.developing.map(line),
  ].filter(Boolean).filter((v, idx, arr) => arr.findIndex((x) => x.strand === v.strand) === idx).slice(0, 4);

  const next = priorities.map((p, idx) => ({
    order: idx + 1,
    strand: p.strand,
    nameAr: STRAND_BY_ID[p.strand]?.nameAr ?? p.nameAr,
    nameEn: STRAND_BY_ID[p.strand]?.nameEn ?? p.nameEn,
  }));

  const domainRows = Object.values(domains).map((d) => ({
    domain: d.domain,
    labelAr: DOMAIN_LABEL[d.domain]?.ar ?? d.domain,
    labelEn: DOMAIN_LABEL[d.domain]?.en ?? d.domain,
    value: d.mean,
    measured: d.measured,
  }));

  // Overall confidence is the honest one, not the flattering one: a single
  // short screening does not license a confident picture, and saying so is
  // more useful to a parent than a number that looks certain.
  const confidences = Object.values(indicators).filter((i) => !i.notMeasured).map((i) => i.confidence);
  const overall = confidences.length === 0 ? 'LOW'
    : confidences.every((c) => c === 'HIGH') ? 'HIGH'
    : confidences.some((c) => c === 'HIGH' || c === 'MEDIUM') ? 'MEDIUM'
    : 'LOW';

  const headlineAr = name ? `لمحة عن تعلّم ${name}` : 'لمحة عن تعلّم طفلك';

  return {
    headline: { ar: headlineAr, en: "Your child's learning snapshot" },

    strengths: {
      kind: strengthsKind,
      labelAr: strengthsKind === 'RELATIVE_STRENGTH' ? 'نقاط القوة' : 'اللي عمله كويس النهارده',
      labelEn: strengthsKind === 'RELATIVE_STRENGTH' ? 'Strengths' : 'What he did well today',
      introAr: strengths.length
        ? (strengthsKind === 'RELATIVE_STRENGTH'
            ? 'لاحظنا إن دي أقوى حاجات عنده مقارنة بباقي المهارات:'
            : 'المهارات كلها قريبة من بعض دلوقتي، بس دي الحاجات اللي عملها أحسن النهارده:')
        : 'الجلسة دي كانت قصيرة، ولسه بدري نحدّد حاجات واضحة.',
      introEn: strengths.length
        ? (strengthsKind === 'RELATIVE_STRENGTH'
            ? 'These stood out compared with his other skills:'
            : 'His skills are close together right now — these are what went best today:')
        : 'This was a short session — it is early to name anything clearly.',
      items: strengths,
    },

    developing: {
      labelAr: 'مهارات بتتطور دلوقتي', labelEn: 'Currently developing',
      introAr: 'الحاجات دي لسه بتتبني، وده طبيعي تمامًا:',
      introEn: 'These are still building, which is completely normal:',
      items: developing,
    },

    next_focus: {
      labelAr: 'الخطوة الجاية', labelEn: 'Recommended next focus',
      items: next,
    },

    practice: {
      labelAr: 'التدريب المقترح', labelEn: 'Suggested practice',
      ar: `حوالي ${PRACTICE_SUGGESTION.minutes_per_day} دقايق في اليوم — دي نقطة بداية مقترحة، مش قاعدة.`,
      en: `About ${PRACTICE_SUGGESTION.minutes_per_day} minutes a day — a suggested starting point, not a rule.`,
      _validation: PRACTICE_SUGGESTION._validation,
    },

    what_to_observe: {
      labelAr: 'اللي تلاحظيه', labelEn: 'What to observe',
      items: next.slice(0, 2).map((n) => ({ strand: n.strand, ...watchFor(n.strand) })),
    },

    domains: domainRows,

    confidence: {
      level: overall,
      ar: overall === 'HIGH'
        ? 'الصورة دي مبنية على أدلة كويسة من الجلسة.'
        : overall === 'MEDIUM'
        ? 'الصورة دي أوّلية — جلسة واحدة قصيرة بتدّي مؤشر، مش حكم.'
        : 'الأدلة لسه قليلة. الأرقام دي مؤشرات أوّلية وهتتحسّن مع كل جلسة.',
      en: overall === 'HIGH'
        ? 'This picture rests on good evidence from the session.'
        : overall === 'MEDIUM'
        ? 'This is a first picture — one short session gives an indication, not a verdict.'
        : 'Evidence is still thin. These are early indicators and they sharpen with each session.',
    },

    not_measured: {
      labelAr: 'لسه مقيسناهاش', labelEn: 'Not measured yet',
      /**
       * Floors are excluded here. A floor WAS tried — it is already shown
       * under "currently developing" with "we tried this today and it was
       * hard". Listing it again as "not tried yet" would contradict that on
       * the same page, and a parent would not know which to believe.
       *
       * "Not measured" here means only: never presented.
       */
      strands: profile.not_measured
        .filter((s) => !indicators[s]?.floor)
        .map((s) => ({
          strand: s,
          nameAr: STRAND_BY_ID[s]?.nameAr ?? s,
          nameEn: STRAND_BY_ID[s]?.nameEn ?? s,
        })),
      noteAr: 'الحاجات دي مجرّبناهاش لسه — مش معناها إن الطفل مش بيعرفها.',
      noteEn: 'These were not tried yet — it does not mean the child cannot do them.',
    },

    disclaimer: PROFILE_DISCLAIMER,
  };
}

/**
 * Flatten the snapshot's parent-facing strings, so a test can assert that no
 * banned term reaches a parent. Keys beginning with `_` are internal.
 */
export function snapshotStrings(snapshot, out = []) {
  const walk = (node) => {
    if (typeof node === 'string') { out.push(node); return; }
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) {
        if (k.startsWith('_')) continue;
        /**
         * The disclaimer is excluded, and only the disclaimer.
         *
         * It is fixed, approved copy in spec.js whose whole job is to NAME the
         * things IRIS is not — "It is not an IQ test and cannot diagnose
         * anything." That sentence necessarily contains banned terms, and a
         * scan that flagged it would push someone toward weakening the very
         * sentence that protects the child. Everything else is scanned.
         */
        if (k === 'disclaimer') continue;
        walk(v);
      }
    }
  };
  walk(snapshot);
  return out;
}
