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

/* ── Two-track discrepancies (framework §8 / spec §8) ──────────────────────
 * Canonical, category-only label maps shared with the parent instruments:
 * CaregiverProfileScreen's completion summary (P2) and IrisFirstPlan's
 * «لوحت الصورة في مكانين» strip render these words, so a family never sees
 * two vocabularies for one thing. They are EXPORTED, not invented per
 * screen. The state tokens and the Arabic wording mirror the STATE_LABELS
 * keys in `IrisFamilyProfile.tsx` — copied, not imported, because merge.js
 * is plain engine-side JS that the node test suite loads without JSX.
 * If either list drifts, tests/iris.discrepancy.test.js fails. */
export const PARENT_STATE_WORDS = {
  does_independently: { ar: 'بيعمله لوحده', en: 'does it on his own' },
  does_with_support: { ar: 'بيعمله بمساعدة', en: 'does it with support' },
  emerging: { ar: 'لسه بيشوف طريقه', en: 'finding his way in it' },
  unmet_need: { ar: 'محتاج دعم — والدعم ده لسه مش موجود', en: 'needs support — and it is not there yet' },
  not_yet_opportunity: { ar: 'ماخدش فرصة يعملها لحد دلوقتي', en: 'has not had the chance to try it' },
  needs_more_information: { ar: 'لسه بنجمع معلومات كفاية', en: 'still gathering enough to say' },
};
/** Confidence WORDS (P2 summary) — plain parent language, not HIGH/MEDIUM. */
export const PARENT_CONFIDENCE_WORDS = {
  HIGH: { ar: 'واضح', en: 'clear' },
  MEDIUM: { ar: 'محتاج تأكيد', en: 'needs confirming' },
  LOW: { ar: 'مش كافي', en: 'not enough yet' },
  NEEDS_MORE_INFO: { ar: 'مش كافي', en: 'not enough yet' },
};
/** What the screen side shows of a family, as a category. Never a number. */
export const OBSERVED_STATE_WORDS = {
  demonstrated: { ar: 'على الشاشة حصلت', en: 'seen on screen' },
  not_demonstrated: { ar: 'على الشاشة ماظهرتش النهارده', en: 'not seen on screen today' },
  no_data: { ar: 'على الشاشة لسه ما اتقاسش', en: 'not measured on screen yet' },
  independent: { ar: 'على الشاشة عمله لوحده', en: 'done alone on screen' },
  with_support: { ar: 'على الشاشة محتاج مساعدة', en: 'needed support on screen' },
};
/** Discrepancy family → the block word the rest of the product already uses. */
const FAMILY_BLOCK = { communication: 'C', learning: 'L', support: 'S' };
export const DISCREPANCY_FAMILY_WORDS = Object.fromEntries(
  Object.keys(FAMILY_BLOCK).map((f) => [f, BLOCK_NAME[FAMILY_BLOCK[f]]]),
);
/** The six block names, exported for the P2 summary rows. */
export const BLOCK_LABELS = BLOCK_NAME;

/** Indicator rows for one skill family, by STRAND NAME ONLY — categorical.
 *  `indicators` is the engine's map keyed by strand id (LIT.*, NUM.*, the
 *  LISTENING track, and the new COMM.*). A ladder that predates a family
 *  simply has no rows for it; the family then compares nothing. */
function familyIndicators(ladder, which) {
  const ind = ladder && ladder.indicators;
  if (!ind || typeof ind !== 'object') return [];
  const rows = [];
  for (const [id, i] of Object.entries(ind)) {
    if (!i || typeof i !== 'object') continue;
    if (which === 'communication' && (/^COMM\./.test(id) || i.track === 'LISTENING' || /^LIT\.LISTEN/.test(id))) rows.push(i);
    else if (which === 'learning' && (/^(LIT|NUM)\./.test(id) && i.track !== 'LISTENING' && !/^LIT\.LISTEN/.test(id))) rows.push(i);
  }
  return rows;
}

/** Collapse a family's indicator rows to ONE observed category. No sums,
 *  no means, no averaging across the two tracks (§0.3 — it is a category
 *  error, and here it is also simply not done). */
function observedCategory(rows) {
  if (!rows.length) return null; // family absent from this ladder shape
  const measured = rows.filter((i) => i.notMeasured !== true);
  if (measured.length) return 'demonstrated';
  if (rows.some((i) => i.floor === true)) return 'not_demonstrated';
  return 'no_data';
}

/** Independence pattern observed on screen, read ONLY from the av2
 *  transparency log (outcome enums — spec §1). A phase5-1.0.0 ladder has
 *  no outcome log, so this family declines to compare rather than guess
 *  from numbers. */
function observedSupportPattern(ladder) {
  const log = Array.isArray(ladder && ladder.observations) ? ladder.observations : null;
  if (!log) return null;
  let independent = false, supported = false;
  for (const o of log) {
    if (!o || typeof o.outcome !== 'string') continue;
    if (o.outcome === 'demonstrated_independent') independent = true;
    if (o.outcome === 'demonstrated_with_support') supported = true;
  }
  if (!independent && !supported) return null;
  if (independent && supported) return 'mixed';
  return independent ? 'independent' : 'with_support';
}

const NOTE = {
  home_yes_screen_no: {
    ar: 'في البيت الحاجة دي بتتحصل لوحدها، وعلى الشاشة النهارده ماظهارش — ده في الغالب شكل المهمة على الشاشة هو اللي مختلف، مش المهارة نفسها. مفيش تعارض، الاتنين معلومة.',
    en: 'At home this happens on its own; on screen today it did not appear — that usually means the task format was the barrier, not the skill. There is no conflict; both parts are information.',
  },
  home_less_screen_yes: {
    ar: 'في البيت لسه بمساعدة أو من غير فرصة، وعلى الشاشة حصلت — فيه مساحة نجرّب نقلّل المساعدة في البيت خطوة خطوة.',
    en: 'At home it still needs help or has not had the chance; on screen it happened — room to try easing the help at home, one step at a time.',
  },
  recheck: {
    ar: 'البيت والشاشة مش في نفس المرحلة دلوقتي — دي حاجة تستاهل نعيد النظر فيها بهدوء، ومش حكم على الطفل.',
    en: 'Home and screen are not at the same point right now — this is worth a calm re-check, not a verdict on the child.',
  },
  chance_new: {
    ar: 'قولتِ إن الفرصة لسه ما جاتش في البيت، لكن على الشاشة تحصلت — يعني فيه فرصة جديدة تنفتح في اليوم، مش نقص قدرة.',
    en: 'You told us the chance has not come yet at home, but it happened on screen — that is a new opening for the day, not a missing ability.',
  },
  support_home_more: {
    ar: 'في البيت المساعدة بتيجي من الكبير، وعلى الشاشة عملها لوحده — نقدر نجرب نقلّل المساعدة معاه شوية شوية.',
    en: 'At home an adult steps in to help; on screen he did it alone — we can try easing the help a little.',
  },
  support_home_less: {
    ar: 'في البيت الحاجة بتتحصل من غير مساعدة، وعلى الشاشة طلبت تلميح — هنراقب الموضوع بهدوء قبل أي تغيير في الخطة.',
    en: 'At home it happens without help; on screen it asked for hints — we will watch this quietly before changing anything in the plan.',
  },
};

/**
 * The two-track comparison — spec §8. Pure, deterministic, categorical.
 *
 * @param caregiverScored the cv1/cv2 `scored` object (or null — absent
 *        caregiver simply compares nothing)
 * @param ladderSnapshot  the ladder assessment object as it is already
 *        passed to buildFamilyLearningProfile (or null)
 * @returns {Array<{family: string, parent: string, observed: string, note: {ar: string, en: string}}>}
 *          possibly empty; NEVER numbers, NEVER an average of the tracks.
 * Tolerant by contract: an old phase5-1.0.0 snapshot simply has no COMM
 * strands and no outcome log, so at most the families whose strand names
 * exist compare; a snapshot with no indicators at all yields [].
 */
export function computeTrackDiscrepancies(caregiverScored, ladderSnapshot) {
  const out = [];
  const cg = caregiverScored;
  const ladder = ladderSnapshot;
  if (!cg || !ladder) return out;
  const states = cg.domainStates || {};

  const push = (family, parent, observed, note) => {
    out.push({ family, parent, observed, note: { ar: note.ar, en: note.en } });
  };

  /* — Communication: the C block vs LISTENING/COMM indicators (where they
     exist). Opportunity ≠ inability: a screen floor never becomes a child
     failure, and a caregiver 'not yet' never becomes one either (§0.5). */
  const cState = states.C && states.C.state;
  const cObserved = observedCategory(familyIndicators(ladder, 'communication'));
  if (cState && cObserved && cObserved !== 'no_data') {
    if (cState === 'does_independently' && cObserved === 'not_demonstrated') push('communication', cState, cObserved, NOTE.home_yes_screen_no);
    else if (['does_with_support', 'unmet_need', 'not_yet_opportunity'].includes(cState) && cObserved === 'demonstrated') push('communication', cState, cObserved, NOTE.home_less_screen_yes);
    else if (cState === 'needs_more_information') push('communication', cState, cObserved, NOTE.recheck);
  }

  /* — Learning exposure: the L block (+ the §3 opportunityGates stamp when
     the caller carries one) vs the LIT/NUM entry states on the ladder. */
  const lState = states.L && states.L.state;
  const gated = cg.opportunityGates
    && (cg.opportunityGates.LITERACY === 'not_yet' || cg.opportunityGates.NUMERACY === 'not_yet');
  const lObserved = observedCategory(familyIndicators(ladder, 'learning'));
  if (lObserved && lObserved !== 'no_data') {
    if ((lState === 'not_yet_opportunity' || gated) && lObserved === 'demonstrated') push('learning', 'not_yet_opportunity', lObserved, NOTE.chance_new);
    else if (lState && lState !== 'not_yet_opportunity' && lObserved === 'not_demonstrated') push('learning', lState, lObserved, NOTE.recheck);
  }

  /* — Support pattern: the S block's help pattern vs the independence
     pattern in the av2 outcome log (enums only — no numbers anywhere). */
  const sState = states.S && states.S.state;
  const sIntensity = (cg.supportIntensity && cg.supportIntensity.S && cg.supportIntensity.S.type) || null;
  const sObserved = observedSupportPattern(ladder);
  if (sObserved && sObserved !== 'mixed') {
    const homeSupported = sState === 'does_with_support' || sState === 'unmet_need'
      || sIntensity === 'partial_physical' || sIntensity === 'full_physical';
    const homeIndependent = sState === 'does_independently' || sIntensity === 'none';
    if (homeSupported && sObserved === 'independent') push('support', sState || 'does_with_support', sObserved, NOTE.support_home_more);
    else if (homeIndependent && sObserved === 'with_support') push('support', sState || 'does_independently', sObserved, NOTE.support_home_less);
  }

  return out;
}

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
      /* §8: where exactly the two tracks disagree, family by family —
       * categorical, NEVER averaged, empty when nothing can be compared
       * (one track, a legacy ladder without these strand names, or no
       * caregiver at all). The First Plan strip renders this list. */
      discrepancies: computeTrackDiscrepancies(caregiver, ladderSnapshot),
      confidenceSummary,
      // No condition label is read anywhere above; nothing above can be summed.
      bannedTermsVerified: true,
    };
}
