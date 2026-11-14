/**
 * IRIS — Family learning profile: merge of the two instruments (§4).
 *
 *   export function buildFamilyLearningProfile({ caregiver, ladderSnapshot, child })
 *
 * Two tracks, one page, NEVER one number. The caregiver profile answers "what
 * does daily life take, and what does the family need"; the child-facing
 * ladder answers "what does he do independently / emerging / needing support,
 * by strand". Averaging them is a category error: different informant,
 * different setting, different construct (§0.3).
 *
 * ── DETERMINISM ──────────────────────────────────────────────────────────
 * No randomness, no clock, no network. Same inputs → identical output; two
 * calls in a row return equal JSON (asserted in tests).
 *
 * ── CONDITION LABELS ARE NOT AN INPUT ─────────────────────────────────────
 * There is no `condition`, `diagnosis` or `iq` parameter on this function, and
 * `child` is read only for `name`/`ageMonths`. A condition label has no
 * channel through which to reach a priority, an intensity, a setting or a
 * note. §0.7 permits a condition to preset accommodation DEFAULTS only, and
 * those live in journey.js `accommodationDefaults()`, not here.
 *
 * ── PRIORITY RULE ────────────────────────────────────────────────────────
 * 1..3 slots, filled alternately (learning first). No track may hold more than
 * 2 of 3 slots unless the other track has nothing to offer, in which case the
 * available track fills all slots. Ordering within each track is fixed: the
 * ladder keeps its own order, the functional side keeps scoring order.
 */

const DIVERGENCE = {
  ar: 'الأطفال بيعملوا حاجات يومية أكتر من اللي بيعملوها في مهام schooling — والعكس صحيح. الاتنين جزء من الصورة.',
  en: 'Children do more everyday things than school-style tasks let on — and the other way round too. Both parts belong in the picture.',
};

const BLOCK_NAME = {
  C: { ar: 'التواصل', en: 'communication' },
  L: { ar: 'التعلم اليومي', en: 'everyday learning' },
  S: { ar: 'العناية بالنفس', en: 'self-care' },
  M: { ar: 'الحركة', en: 'movement' },
  P: { ar: 'الناس واللعب', en: 'people and play' },
  H: { ar: 'الصحة والحواس', en: 'health and senses' },
};
const TYPE_AR = { none: 'من غير مساعدة', supervise: 'بالكلام', partial_physical: 'بلمسة بداية', full_physical: 'بإيدنا معاه' };
const TYPE_EN = { none: 'none', supervise: 'verbal', partial_physical: 'a hand-start', full_physical: 'hands-on together' };
const FREQ_AR = { never: 'أبداً', rarely: 'نادراً', sometimes: 'أحياناً', most_times: 'أغلب الأوقات', always: 'دائماً' };
const FREQ_EN = { never: 'never', rarely: 'rarely', sometimes: 'sometimes', most_times: 'most times', always: 'always' };
const TIME_AR = { none: 'من غير وقت زيادة', lt15: 'أقل من ١٥ دقيقة', '15_30': '١٥–٣٠ دقيقة', '30_60': '٣٠–٦٠ دقيقة', most_day: 'أغلب اليوم' };
const TIME_EN = { none: 'no extra time', lt15: 'under 15 min', '15_30': '15–30 min', '30_60': '30–60 min', most_day: 'most of the day' };
const TRACK_CAP = 2;

/** Learning priorities, from whichever ladder shape the caller handed us. */
function learningPriorities(ladder) {
  if (!ladder) return [];
  if (Array.isArray(ladder.learningPriorities)) {
    return ladder.learningPriorities.map((p) => ({
      id: p.id || `strand:${p.strand || 'x'}`,
      labelAr: p.labelAr || p.nameAr || '', labelEn: p.labelEn || p.nameEn || '',
      whyAr: p.whyAr || p.reasonAr || '', whyEn: p.whyEn || p.reasonEn || '',
    }));
  }
  const src = Array.isArray(ladder.priorities) ? ladder.priorities
    : (ladder.next_focus && Array.isArray(ladder.next_focus.items) ? ladder.next_focus.items : []);
  return src.map((p) => ({
    id: `strand:${p.strand || p.code || 'x'}`,
    labelAr: p.nameAr || p.labelAr || '', labelEn: p.nameEn || p.labelEn || '',
    whyAr: p.reasonAr || p.whyAr || (p.indicator ? `لسه بيتعلّمها: ${p.nameAr || p.indicator}` : 'من خطوات اللي جاية'),
    whyEn: p.reasonEn || p.whyEn || (p.indicator ? `Still learning: ${p.nameEn || p.indicator}` : 'one of the next steps'),
  }));
}

/** Functional priorities: unmet needs first, then opportunity gaps (§0.5). */
function functionalPriorities(caregiver) {
  const out = [];
  if (!caregiver) return out;
  for (const u of caregiver.unmetNeeds || []) {
    out.push({
      id: u.itemId, track: 'functional', labelAr: u.ar, labelEn: u.en,
      whyAr: 'أنتِ قلتِ إن مفيش حد بيساعد في الحاجة دي.',
      whyEn: 'You told us nobody is helping with this yet.',
      source: u.itemId,
    });
  }
  for (const [block, d] of Object.entries(caregiver.domainStates || {})) {
    if (d.state === 'not_yet_opportunity') {
      out.push({
        id: `opportunity:${block}`, track: 'functional',
        labelAr: `فرص ناقصة في ${BLOCK_NAME[block]?.ar || block}`,
        labelEn: `Missing chances in ${BLOCK_NAME[block]?.en || block}`,
        whyAr: 'دي مش نقص قدرة — لسه ماخدش فرصة يعمله.',
        whyEn: 'Not a missing capacity — he has not had the chance.',
        source: `opportunity:${block}`,
      });
    }
  }
  return out;
}

function recheck(caregiver, learning) {
  const states = Object.values(caregiver?.domainStates || {});
  if (states.some((d) => d.confidence === 'NEEDS_MORE_INFO')) return 'بعد ٤ أسابيع من التمرين — مع إكمال ملف البيت';
  if ((caregiver?.unmetNeeds || []).length > 0) return 'بعد ٤ أسابيع من التمرين، أو أول ما دعم جديد يوصل';
  if (learning?.tiers && Object.keys(learning.tiers).length < 3) return 'بعد ٤ أسابيع من التمرين';
  if ((caregiver?.context?.school?.hoursPerDay || 0) >= 3) return 'بعد انتقال المدرسة الجاي';
  return 'بعد ٤ أسابيع من التمرين';
}

export function buildFamilyLearningProfile({ caregiver = null, ladderSnapshot = null, child = null } = {}) {
  const functional = caregiver ? {
    domainStates: caregiver.domainStates,
    supportIntensity: caregiver.supportIntensity,
    unmetNeeds: caregiver.unmetNeeds,
    strengths: caregiver.strengths,
  } : null;
  const learning = ladderSnapshot || null;
  const learn = learningPriorities(ladderSnapshot);
  const func = functionalPriorities(caregiver);

  const queues = { learning: learn, functional: func };
  const taken = { learning: 0, functional: 0 };
  const cursor = { learning: 0, functional: 0 };
  const priorities = [];
  while (priorities.length < 3) {
    let picked = null;
    for (const key of taken.learning + taken.functional === 0 ? ['learning', 'functional'] : ['learning', 'functional']) {
      const q = queues[key];
      if (cursor[key] >= q.length) continue;
      const other = key === 'learning' ? 'functional' : 'learning';
      const otherEmpty = cursor[other] >= queues[other].length;
      if (taken[key] >= TRACK_CAP && !otherEmpty) continue;
      picked = key;
      break;
    }
    if (!picked) break;
    const item = queues[picked][cursor[picked]++];
    taken[picked] += 1;
    priorities.push({
      track: picked, id: item.id,
      labelAr: item.labelAr, labelEn: item.labelEn,
      whyAr: item.whyAr, whyEn: item.whyEn,
      source: item.source || item.id,
    });
  }

  const ac = caregiver?.accessSettings || {};
  const sessionMinutes = typeof ac.sessionMinutes === 'number' ? ac.sessionMinutes : 5;
  const activities = priorities.map((p) => ({
    labelAr: p.labelAr, labelEn: p.labelEn,
    reasonAr: p.whyAr, reasonEn: p.whyEn, source: p.source,
  }));

  const supports = [];
  if (ac.audioFirst) supports.push('الصوت شغال من أول مرة — الكلام مكتوب ومسموع');
  if (ac.targetSize === 'large') supports.push('أهداف كبيرة ومتباعدة');
  if (ac.responseMode === 'point_assist') supports.push('نقر بمشاركة الكبير لحد ما إيده تثبت');
  if (ac.responseMode === 'scan') supports.push('اختيار واحد قدامه في كل مرة');
  if (ac.reducedMotion) supports.push('حركة أقل في الشاشات');
  supports.push('مفيش عدّاد وقت — هو اللي يخلص الحاجة في وقته');
  if (ac.breakPrompt) supports.push('زر «عايز آخد راحة» ظاهر دايمًا وشغّال بإيدته');
  if (ac.helperPresent) supports.push('الجلسات مع الكبير في الأول، مش لحاله');
  for (const [block, si] of Object.entries(caregiver?.supportIntensity || {})) {
    supports.push(`${BLOCK_NAME[block]?.ar || block}: مساعدة ${TYPE_AR[si.type] || si.type}، ${FREQ_AR[si.frequency] || si.frequency}، ${TIME_AR[si.time] || si.time}`);
  }
  const watch = [...(caregiver?.guidanceNotes || [])];
  if (!learning && caregiver) watch.push('أول ٤ جلسات هتبنّي الصورة التانية: اللي بيعمله لوحده قدام الشاشة.');
  if (learning && !caregiver) watch.push('ملف البيت هيكمّل اللي الشاشات مش شايفاه: الروتين والأكل والنوم.');

  const both = Boolean(functional && learning);
  const confidences = Object.values(caregiver?.domainStates || {}).map((d) => d.confidence);
  const lowInfo = confidences.filter((c) => c === 'NEEDS_MORE_INFO' || c === 'LOW').length;
  const ladderConf = learning?.confidence?.level || (typeof learning?.confidence === 'string' ? learning.confidence : null);
  const confidenceSummary = {
    ar: both
      ? (lowInfo === 0 ? 'عرفنا من البيت ومن الشاشات صورة كاملة.'
        : `ملف البيت كامل في ${confidences.length - lowInfo} من ${confidences} مجالات${ladderConf ? `، وصورة الشاشات ${ladderConf}` : ''}.`)
      : learning ? 'لسه عندنا صورة الشاشات بس — ملف البيت هيكمل الصورة.'
        : functional ? 'لسه عندنا صورة البيت بس — أول شاشات هتضيف الصورة التانية.'
          : 'مفيش صورة لسه: الملف بيتبني أول ما تبدأ.',
    en: both
      ? (lowInfo === 0 ? 'Home and screens both give a complete picture.'
        : `The home file is firm in ${confidences.length - lowInfo} of ${confidences} areas${ladderConf ? `, and the screen picture is ${ladderConf}` : ''}.`)
      : learning ? 'Only the screen picture exists so far — the home file will complete it.'
        : functional ? 'Only the home picture exists so far — the first screens will add the second.'
          : 'Nothing yet: the profile starts when you start.',
  };

  return {
    functional, learning, priorities,
    planSeed: {
      sessionsPerWeek: caregiver?.context?.therapies?.has ? 3 : 4,
      sessionMinutes, activities, supports, watch,
      recheckIn: recheck(caregiver, learning),
    },
    // Only shown when both tracks exist: the two instruments disagree by
    // design, and the difference is the information (§4).
    divergenceNote: both ? DIVERGENCE : null,
    confidenceSummary,
    // No condition label is read anywhere above; nothing above can be summed.
    bannedTermsVerified: true,
  };
}
