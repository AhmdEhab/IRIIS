/**
 * IRIS — Caregiver (Family Profile) item bank.  Version `cv1`.
 *
 * ── WHAT THIS FILE IS ─────────────────────────────────────────────────────
 * Instrument ① of the assessment architecture (§1): the questionnaire an
 * everyday caregiver fills in BEFORE the child does anything. It is not an
 * ability test of the child — it is a structured account of what usually
 * happens in a normal day, over the last few weeks, in this family. The
 * child-facing learning ladder is instrument ②, a separate track that is
 * never averaged with this one (§0.3).
 *
 * ── EXACT PUBLIC CONTRACT ────────────────────────────────────────────────
 *   export const CAREGIVER_BANK_VERSION = 'cv1'
 *   export function getCaregiverBlocks(): Block[]      // ordered by `order`
 *
 *   Block = { id, order, icon, titleAr, titleEn, blurbAr, blurbEn, items }
 *   Item  = { id, block, scored, ar:{q,ex?,opts:[{v,label}]}, en:{...},
 *             format, gate?, triplet?, metUnmet?, followUps?,
 *             ageMinMonths?, ageMaxMonths?, feeds, tag }
 *
 * Additive exports (safe to ignore, needed to render the conditional layer):
 *   CAREGIVER_TRIPLET   — the type / frequency / time questions (§2)
 *   CAREGIVER_MET       — the handled / helped / unmet question (§2)
 *   CAREGIVER_BANDS     — answer value → support band
 *   getCaregiverItems() / getCaregiverFollowUps() / bandFor()
 *
 * ── `scored`, the one flag that must be read correctly ───────────────────
 * `scored: true` means the answer maps onto a support band and therefore
 * takes part in a domain state (§3). `scored: false` does NOT mean
 * unimportant: C9 (does he use a communication board), P6 (what calms him),
 * H6 (sensory profile), G1 (interests) and the whole X block are decisive
 * for the plan — they simply describe access, context and motivation rather
 * than how much support daily life currently takes. Keeping them out of the
 * band math is what makes the domain states honest instead of padded.
 *
 * ── THE RULE THAT DECIDES THE PRODUCT (§0.5) ─────────────────────────────
 * "Opportunity is not inability." Every gated item offers `not_yet_chance`
 * as a first-class answer. Scoring EXCLUDES it from every difficulty count
 * and logs it as an opportunity gap. Nothing here is ever summed into a
 * number (§0.1).
 *
 * ── LANGUAGE RULE (binding) ──────────────────────────────────────────────
 * Arabic is primary and written the way an Egyptian parent talks to a
 * neighbour: short, warm, concrete, second person, zero clinical register.
 * The English is the mirror. Every scored item carries a concrete example
 * anchor in BOTH languages, because the parent who has never seen a
 * behaviour named in words is exactly the parent who otherwise answers an
 * abstraction — or answers "no" about an experience the child never had.
 *
 * BANNED in Arabic: معدل ذكاء · درجة · درجة ذكاء · مستوى الذكاء · تخلف ·
 * تخلف عقلي · إعاقة ذهنية (as a description of the child) · معاق · مسكين ·
 * مريض · غير قابل · مش هيتعلم.
 * BANNED in English: IQ · score · mental age · severity · level of
 * functioning · untestable · normal child · suffers · victim · retarded.
 * The word for a diagnosis appears nowhere in this file. The bank never asks
 * what the child HAS; only what he DOES, and what the family NEEDS.
 *
 * ── VALIDATION STATUS ────────────────────────────────────────────────────
 * RESEARCH_INFORMED prototype. NOT_REVIEWED by any specialist, NOT normed on
 * Egyptian children, and no claim beyond "descriptive" is licensed (§8).
 * Response FORMATS are adapted from CANS/SIS-C gate logic, WG short-set
 * anchors, ICF `.99` opportunity handling, CANDID met/unmet and I-CAN goal
 * blocks. No instrument's items are translated or copied: every string here
 * is IRIS-authored.
 */

export const CAREGIVER_BANK_VERSION = 'cv1';

/* ══ shared response vocabularies ════════════════════════════════════════════
 * `v` values are the standard sets the scoring layer reads. Labels are
 * parent-facing. Values never change: item versioning would otherwise break
 * every stored profile (§7). */

const ABIL_AR = [
  { v: 'independent', label: 'بيعملها لوحده' },
  { v: 'little_help', label: 'بيعملها بمساعدة بسيطة — كلام أو إشارة أو نموذج' },
  { v: 'hands_on', label: 'بيعملها وإحنا بنساعده بإيدنا' },
  { v: 'does_not_yet', label: 'لسه بيعملهاش' },
];
const ABIL_EN = [
  { v: 'independent', label: 'Does it on his own' },
  { v: 'little_help', label: 'Does it with a little help — talking, pointing, showing' },
  { v: 'hands_on', label: 'Does it with hands-on help' },
  { v: 'does_not_yet', label: 'Not doing it yet' },
];

const FREQ_AR = [
  { v: 'never', label: 'أبداً' },
  { v: 'rarely', label: 'نادراً' },
  { v: 'sometimes', label: 'أحياناً' },
  { v: 'most_times', label: 'أغلب الأوقات' },
  { v: 'always', label: 'دائماً' },
];
const FREQ_EN = [
  { v: 'never', label: 'Never' },
  { v: 'rarely', label: 'Rarely' },
  { v: 'sometimes', label: 'Sometimes' },
  { v: 'most_times', label: 'Most of the time' },
  { v: 'always', label: 'Always' },
];

const GATE_AR = [
  { v: 'yes_happens', label: 'أيوة، دي حاجة بتحصل' },
  { v: 'not_yet_chance', label: 'لسه ماخدش فرصة يعملها' },
];
const GATE_EN = [
  { v: 'yes_happens', label: 'Yes, this happens' },
  { v: 'not_yet_chance', label: 'He has not had the chance yet' },
];

/**
 * The support triplet (§2). Asked ONLY for an area that needs support, and
 * never summed: type, frequency and time stay three separate small strips in
 * the results UI. Exported because it is conditional chrome, not an item.
 */
export const CAREGIVER_TRIPLET = {
  type: {
    ar: {
      q: 'المساعدة دي شكلها إيه؟',
      opts: [
        { v: 'none', label: 'مفيش مساعدة' },
        { v: 'supervise', label: 'متابعة وتذكير بالكلام' },
        { v: 'partial_physical', label: 'لمسة في الإيد أو بداية الحركة' },
        { v: 'full_physical', label: 'إحنا اللي بنعملها معاه بإيدنا' },
      ],
    },
    en: {
      q: 'What does the help look like?',
      opts: [
        { v: 'none', label: 'No help' },
        { v: 'supervise', label: 'Watching and reminding by words' },
        { v: 'partial_physical', label: 'A touch on the hand, or starting the movement' },
        { v: 'full_physical', label: 'We do it with our hands' },
      ],
    },
  },
  frequency: {
    ar: { q: 'المساعدة دي بتحصل كام مرة؟', opts: FREQ_AR },
    en: { q: 'How often does that help happen?', opts: FREQ_EN },
  },
  time: {
    ar: {
      q: 'بتاخد منه وقت قد إيه في اليوم؟',
      opts: [
        { v: 'none', label: 'مفيش وقت إضافي' },
        { v: 'lt15', label: 'أقل من ١٥ دقيقة' },
        { v: '15_30', label: 'من ١٥ لـ ٣٠ دقيقة' },
        { v: '30_60', label: 'من ٣٠ لـ ٦٠ دقيقة' },
        { v: 'most_day', label: 'أغلب اليوم' },
      ],
    },
    en: {
      q: 'How much of the day does it take?',
      opts: [
        { v: 'none', label: 'No extra time' },
        { v: 'lt15', label: 'Under 15 minutes' },
        { v: '15_30', label: '15 to 30 minutes' },
        { v: '30_60', label: '30 to 60 minutes' },
        { v: 'most_day', label: 'Most of the day' },
      ],
    },
  },
};

/**
 * Met / unmet (§2, CANDID logic). A need the family already handles is not a
 * learning lever, so the profile keys off UNMET support only (§0.6). This is
 * also the anti-stigma guard: the family is never asked to rate itself.
 */
export const CAREGIVER_MET = {
  ar: {
    q: 'والحاجة دي دلوقتي إيه حالتها؟',
    opts: [
      { v: 'handled', label: 'بنعملها بنفسنا وتمام' },
      { v: 'helped', label: 'فيه حد بيساعدنا فيها' },
      { v: 'unmet', label: 'مفيش حد بيساعدنا فيها لسه' },
    ],
  },
  en: {
    q: 'And how is this one going right now?',
    opts: [
      { v: 'handled', label: 'We handle it ourselves' },
      { v: 'helped', label: 'Someone is helping us with it' },
      { v: 'unmet', label: 'Nobody is helping with this yet' },
    ],
  },
};

/**
 * Support bands. `ability` and `frequency` formats derive their band from the
 * standard value sets; descriptive scales carry an explicit per-option band
 * written on the item itself, so bank and scorer can never drift apart.
 *
 * The frequency mapping is stated once, here, because it is a real design
 * decision and not an accident: a behaviour seen "most of the time" is
 * treated as established (independent), "sometimes" as not yet reliable
 * (a little help from the environment is carrying it), and "rarely/never" as
 * not established (does not do it yet). Frequency items say nothing about
 * hands-on help, so they never ask the met/unmet question. `unknown` is the
 * "can't tell" answer: it counts as an answer, and is excluded from the band
 * math — it is never silently read as a low rating.
 */
export const CAREGIVER_BANDS = {
  ability: {
    independent: 'independent',
    little_help: 'little_help',
    hands_on: 'hands_on',
    does_not_yet: 'does_not_yet',
    not_yet_chance: 'opportunity',
    yes_happens: 'experienced',
    unsure: 'unknown',
  },
  frequency: {
    always: 'independent',
    most_times: 'independent',
    sometimes: 'little_help',
    rarely: 'does_not_yet',
    never: 'does_not_yet',
  },
  context: {
    yes_happens: 'experienced',
    not_yet_chance: 'opportunity',
  },
};

const withBand = (opts, bands) => opts.map((o, i) => (bands[i] ? { ...o, band: bands[i] } : o));

/* ══ builders ════════════════════════════════════════════════════════════════
 * `ability` covers the two common shapes in one call: with `gate` the parent
 * is asked whether the situation happens at all BEFORE being asked how the
 * child manages it; without it the ability ladder is asked directly. */

const ability = (id, arQ, arEx, enQ, enEx, tag, o = {}) => ({
  id,
  block: id[0],
  scored: o.scored ?? true,
  format: o.format || (o.gate ? 'gate_ability' : 'ability'),
  ar: { q: arQ, ex: arEx, opts: o.scaled ? withBand(o.scaled[0], o.bands) : ABIL_AR },
  en: { q: enQ, ex: enEx, opts: o.scaled ? withBand(o.scaled[1], o.bands) : ABIL_EN },
  tag,
  ...(o.gate ? { gate: o.gate } : {}),
  ...(o.noTriplet ? {} : { triplet: true }),
  ...(o.noMet ? {} : { metUnmet: true }),
  ...(o.ageMinMonths ? { ageMinMonths: o.ageMinMonths } : {}),
  ...(o.ageMaxMonths ? { ageMaxMonths: o.ageMaxMonths } : {}),
  feeds: o.feeds || 'profile',
  ...(o.followUps ? { followUps: o.followUps } : {}),
});

const frequency = (id, arQ, arEx, enQ, enEx, tag, o = {}) => ability(id, arQ, arEx, enQ, enEx, tag, {
  // Frequency carries its OWN option set, with the bands documented in
  // CAREGIVER_BANDS.frequency written onto each option: never/rarely →
  // not established, sometimes → carried by a little help, most/always →
  // established. It never implies hands-on help, hence no triplet.
  ...o, format: 'frequency', noTriplet: true, noMet: true,
  scaled: [FREQ_AR, FREQ_EN],
  bands: ['does_not_yet', 'does_not_yet', 'little_help', 'independent', 'independent'],
});

/** A descriptive scale that is not the ability ladder; band per option. */
const scaled = (id, arQ, arEx, enQ, enEx, tag, optsAr, optsEn, bands, o = {}) => ability(
  id, arQ, arEx, enQ, enEx, tag, { ...o, format: 'situational', scaled: [optsAr, optsEn], bands },
);

/** A gate-only item: "was the chance there". Never a difficulty (§0.5). */
const opportunity = (id, arQ, arEx, enQ, enEx, tag, o = {}) => ability(id, arQ, arEx, enQ, enEx, tag, {
  ...o, format: 'context', scaled: [GATE_AR, GATE_EN],
  bands: ['experienced', 'opportunity'], noTriplet: true, noMet: true,
  feeds: o.feeds || 'plan',
});

const chip = (v, ar, en) => ({ v, ar, en });

/** Multi-select chips. Labels live once (v/ar/en), never duplicated. */
const multi = (id, arQ, enQ, chips, tag, o = {}) => ({
  id,
  block: id[0],
  scored: false,
  format: 'multi',
  ar: { q: arQ, ...(o.arEx ? { ex: o.arEx } : {}), opts: chips.map((c) => ({ v: c.v, label: c.ar })) },
  en: { q: enQ, ...(o.enEx ? { ex: o.enEx } : {}), opts: chips.map((c) => ({ v: c.v, label: c.en })) },
  tag,
  ...(o.maxSelect ? { maxSelect: o.maxSelect } : {}),
  ...(o.allowCustom ? { allowCustom: true } : {}),
  ...(o.groups ? { groups: true } : {}),
  ...(o.followUps ? { followUps: o.followUps } : {}),
  feeds: o.feeds || 'context',
});

/** Single choice outside the standard ladders. */
const single = (id, arQ, enQ, optsAr, optsEn, tag, o = {}) => ({
  id,
  block: id[0],
  scored: false,
  format: 'single',
  ar: { q: arQ, ...(o.arEx ? { ex: o.arEx } : {}), opts: optsAr },
  en: { q: enQ, ...(o.enEx ? { ex: o.enEx } : {}), opts: optsEn },
  tag,
  ...(o.followUps ? { followUps: o.followUps } : {}),
  feeds: o.feeds || 'context',
});

/** Free text. Optional, never marked wrong, never counted. */
const opentext = (id, arQ, arPh, enQ, enPh, tag, o = {}) => ({
  id,
  block: id[0],
  scored: false,
  format: 'opentext',
  ar: { q: arQ, placeholder: arPh, opts: [] },
  en: { q: enQ, placeholder: enPh, opts: [] },
  tag,
  ...(o.maxEntries ? { maxEntries: o.maxEntries } : {}),
  ...(o.followUps ? { followUps: o.followUps } : {}),
  feeds: o.feeds || 'context',
});

/** A conditional probe. `answers` are the parent item's `v` values. */
const fu = (id, whenItem, answers, item) => ({
  id, when: { itemId: whenItem, answers }, item,
});

/* ══ Block A — Communication & language (C) ═════════════════════════════════
 * The block everything else hangs from: what the ladder may ask by voice, how
 * long a spoken instruction can be, what a wordless "yes" counts as, and
 * whether the child already has any way of saying "no". Communication is the
 * domain missing from every standard support-needs instrument, which is
 * exactly why IRIS asks it first (IJERPH A1, UNICEF). §2 Block A. */

const BLOCK_C = {
  id: 'C', order: 1, icon: '💬',
  titleAr: 'التواصل واللغة',
  titleEn: 'Communication and language',
  blurbAr: 'إزاي بيقول اللي عايزه، وإزاي بيفهم اللي حواليه.',
  blurbEn: 'How he lets you know what he wants, and what he takes in around him.',
  items: [
    ability('C1',
      'لو قولتيله جملة بسيطة زي «تعالى» أو «ديني» أو «اقعد» — بيفهمها بلغتنا اللي بيسمعها في البيت؟',
      'زي إنه ييجي فعلاً لما تناديه، من غير ما تمسكي إيده أو تشاوريه.',
      'If you say a short everyday phrase like "come here", "give me" or "sit down" — does he understand it in the language he hears most at home?',
      'For example he actually comes when you call, without you taking his hand or pointing first.',
      { ar: 'يفهم جملة قصيرة', en: 'Understands a short phrase' },
      {
        gate: {
          ar: { q: 'بتقولي له كلام من ده في يومه العادي؟', opts: GATE_AR },
          en: { q: 'Do you say things like this to him in an ordinary day?', opts: GATE_EN },
        },
      }),
    ability('C2',
      'بيعرف يورّيك إنه عايز حاجة، أو مش عايزها — بأي طريقة: كلمة، صوت، إشارة، يشد إيدك، أو جهاز؟',
      'زي إنه يشير للكوب اللي عايزه، أو ياخد إيدك يمشي بيها ناحية التلاجة.',
      'He gets across that he wants something, or does not want it — in any way at all: a word, a sound, a gesture, taking your hand, or a device?',
      'For example he points to the cup he wants, or leads your hand toward the fridge.',
      { ar: 'يقول اللي عايزه', en: 'Makes his wants known' },
      {
        followUps: [
          fu('C2a', 'C2', ['hands_on', 'does_not_yet'], multi('C2a',
            'إيه اللي بيفرق معاه فعلًا ويخليها تحصل؟ (علّمي كل اللي ينفع)',
            'What actually makes it happen? (tick everything that works)',
            [
              chip('showing', 'إنك ورّيّه الحاجة نفسها', 'Showing him the thing itself'),
              chip('pointing', 'إنك تشاوري عليها', 'Pointing at it'),
              chip('word_start', 'إنك تقولي أول الكلمة', 'Saying the first part of the word'),
              chip('waiting', 'إنك تستني بهدوء من غير ما تعجلي', 'Waiting quietly without rushing him'),
              chip('model', 'إنك تعمليها قدامه مرة', 'Doing it once in front of him'),
              chip('routine_place', 'إن الحاجة دايماً في نفس المكان', 'Keeping the thing in the same place'),
              chip('nothing_yet', 'لحد دلوقتي مفيش حاجة عملت فرق', 'Nothing has made a difference so far'),
            ],
            { ar: 'إيه اللي بيساعده فعلًا', en: 'What actually helps' },
            {
              arEx: 'السؤال ده عن نوع المساعدة، مش عن تقصير منك.',
              enEx: 'This is about the kind of help, not about how much you are doing.',
              feeds: 'plan',
            })),
          fu('C2b', 'C2', ['independent', 'little_help', 'hands_on', 'does_not_yet'], multi('C2b',
            'بيستخدم إيه عشان يوصّل كلامه؟ (علّمي كل اللي بيحصل)',
            'What does he use to get his meaning across? (tick everything he uses)',
            [
              chip('words', 'كلمات', 'Words'),
              chip('sounds', 'أصوات', 'Sounds'),
              chip('pointing', 'إشارة بالإيد', 'Pointing with his hand'),
              chip('leading_hand', 'ياخد إيدك ويمشي بيها', 'Taking your hand and leading you'),
              chip('facial', 'تعابير وشه', 'His face'),
              chip('body', 'حركة جسمه', 'Body movement'),
              chip('device', 'جهاز أو لوحة صور', 'A device or picture board'),
            ],
            { ar: 'الطرق اللي بيتكلم بيها', en: 'The ways he communicates' },
            { feeds: 'access' })),
        ],
      }),
    ability('C3',
      'لو سألتيه سؤال «آه ولا لأ» — بيرد بأي طريقة؟ هزة دماغ، حركة، صوت، أو يضغط زرار؟',
      'زي «عايز مية؟» فيرد برأسه أو بصوته أو بإيده.',
      'If you ask a yes-or-no question, does he answer in any way at all — a nod, a shake, a movement, a sound, or pressing a button?',
      'For example "do you want water?" and he answers with his head, his voice or his hand.',
      { ar: 'يرد على سؤال «آه ولا لأ»', en: 'Answers a yes-or-no question' },
      {
        gate: {
          ar: { q: 'بتسأليه أسئلة «آه ولا لأ» في اليوم؟', opts: GATE_AR },
          en: { q: 'Do you ask him yes-or-no questions during the day?', opts: GATE_EN },
        },
      }),
    frequency('C4',
      'بيشاورك على حاجة حلوة شافها عشان تبصولها مع بعض — «بصي!»؟',
      'زي إنه يشير للطيارة في السما ويستناكي تبصوا مع بعض.',
      'Does he point to show you something interesting so that you look together — "look!"?',
      'For example he points at a plane in the sky and waits for you to look with him.',
      { ar: 'يشاور عشان تشوفوا مع بعض', en: 'Points to share attention' },
    ),
    ability('C5',
      'بيقول كلمات مفردة أو أصوات شبه الكلمات لحاجات بتتكرر في البيت؟',
      'زي «ماي» للمية، أو صوت بيطلّعه وهو عايز التليفون.',
      'Does he use single words, or word-like sounds, for things that come up at home?',
      'For example "may" for water, or a sound he makes when he wants the phone.',
      { ar: 'كلمة أو صوت لمعنى', en: 'A word or sound with meaning' },
    ),
    ability('C6',
      'لو عنده كلمات — بيلفظ اتنين ورا بعض زي «عايز مية» أو «بابا راح»؟',
      'كلمتين بيطلّعوهومع بعض من غير ما تقوليلهم واحد واحد.',
      'If he has spoken words, does he put two together, like "want water" or "daddy gone"?',
      'Two words that come out together, not one at a time.',
      { ar: 'يجمع كلمتين', en: 'Puts two words together' },
      {
        gate: {
          ar: { q: 'عنده كلمات بيلفظها عادةً؟', opts: GATE_AR },
          en: { q: 'Does he have words he usually says?', opts: GATE_EN },
        },
      }),
    ability('C7',
      'حتى من غير كلام — غالبًا بتعرفي هو عايز إيه من طريقته؟ (أي حد كبير بيشوفه كل يوم هيعرف)',
      'زي من صوته، أو من مشيته، أو وهو بيبص ناحية الحاجة.',
      'Even without words, can you usually tell what he wants — the way any adult who sees him daily could?',
      'From his sound, the way he moves, or the way he looks toward the thing.',
      { ar: 'تفهمي قصده من غير كلام', en: 'You read his meaning wordlessly' },
    ),
    scaled('C8',
      'هو بيفهم أكتر بكتير مما يقدر يطلّعهولك؟',
      'زي إنه يعرف الكلمة بس ميقدرش يقولها.',
      'Does he understand a great deal more than he can show you?',
      'For instance he knows the word but cannot get it out.',
      { ar: 'اللي بيفهمه أكبر من اللي طلّعه', en: 'Takes in more than he shows' },
      [
        { v: 'much_more', label: 'أيوة، بيفهم بكتير أوي أكتر مما يطلّع' },
        { v: 'a_bit_more', label: 'بيفهم أكتر بشوية' },
        { v: 'about_same', label: 'اللي بيقوله واللي بيفهمه قريبين من بعض' },
        { v: 'unsure', label: 'مش باينليّّا' },
      ],
      [
        { v: 'much_more', label: 'Yes — he takes in far more than he shows' },
        { v: 'a_bit_more', label: 'He takes in a little more' },
        { v: 'about_same', label: 'What he says and what he understands are close' },
        { v: 'unsure', label: 'Hard to tell' },
      ],
      ['independent', 'independent', 'little_help', 'unknown'],
      { noTriplet: true, noMet: true, feeds: 'profile' },
    ),
    opportunity('C9',
      'عنده إشارات أو لوحة صور أو جهاز بيطلّع عليه كلامه — في البيت أو في المدرسة؟',
      'زي لوحة عليها صور يحط صوابعه عليها، أو تطبيق على التاب.',
      'Does he have gestures, a picture board, or a device that speaks for him — at home or at school?',
      'For example a board with pictures he touches, or an app on a tablet.',
      { ar: 'عنده وسيلة توسّع كلامه', en: 'Has a communication aid' },
      {
        scored: false,
        feeds: 'access',
        followUps: [
          fu('C9a', 'C9', ['yes_happens'], multi('C9a',
            'بيستخدم إيه بالظبط؟',
            'Exactly what does he use?',
            [
              chip('gestures', 'إشارات بإيده', 'Hand gestures'),
              chip('signs', 'إشارات متفق عليها معاه', 'Agreed signs'),
              chip('board', 'لوحة صور', 'A picture board'),
              chip('app', 'تطبيق أو جهاز بيطلّع كلام', 'An app or device that speaks'),
              chip('photos', 'صور مطبوعة أو كروت', 'Printed photos or cards'),
            ],
            { ar: 'وسيلة التواصل', en: 'The communication aid' },
            { feeds: 'access' })),
          fu('C9b', 'C9', ['yes_happens'], multi('C9b',
            'وبيستخدمها فين ومتى؟',
            'And where and when does he use it?',
            [
              chip('home', 'في البيت', 'At home'),
              chip('school', 'في المدرسة أو الحضانة', 'At school or nursery'),
              chip('out', 'في الشارع أو النادي', 'Out and about'),
              chip('asking', 'لما هو عايز حاجة', 'When he wants something'),
              chip('answering', 'لما حد يسأله', 'When someone asks him'),
              chip('commenting', 'يقول رأيه في حاجة شافها', 'To comment on something he saw'),
            ],
            { ar: 'فين بتشتغل الوسيلة', en: 'Where the aid works' },
            { feeds: 'access' })),
          fu('C9c', 'C9', ['not_yet_chance'], single('C9c',
            'لو تحبّوا تجربوا حاجة من دي، أنهي واحدة أقرب ليكم؟',
            'If you wanted to try one of these, which would suit you best?',
            [
              { v: 'gestures', label: 'إشارات بالإيد' },
              { v: 'pictures', label: 'صور مطبوعة أو كروت' },
              { v: 'tablet', label: 'تطبيق على تاب أو موبايل' },
              { v: 'ask_help', label: 'أستنى حد يوريّني الأول' },
              { v: 'not_now', label: 'مش وقته دلوقتي' },
            ],
            [
              { v: 'gestures', label: 'Hand gestures' },
              { v: 'pictures', label: 'Printed pictures or cards' },
              { v: 'tablet', label: 'An app on a tablet or phone' },
              { v: 'ask_help', label: 'Wait until someone shows me first' },
              { v: 'not_now', label: 'Not the right time now' },
            ],
            { ar: 'الوسيلة اللي تنفع', en: 'The aid that would fit' },
            { feeds: 'plan' })),
        ],
      }),
  ],
};

/* ══ Block B — Learning & everyday problem-solving (L) ══════════════════════
 * Learning as it actually looks at home: routines that stick, matching what
 * goes together, knowing what comes next. ICF d1/d2 — general tasks and
 * demands, never body-function ratings. L7 is an opportunity gate and is
 * never counted as a difficulty. §2 Block B. */

const BLOCK_L = {
  id: 'L', order: 2, icon: '🧩',
  titleAr: 'التعلّم وحلّ الحاجات اليومية',
  titleEn: 'Learning and everyday problem-solving',
  blurbAr: 'إزاي بيتعلم من الروتين، وإزاي يوصل للحاجة اللي عايزها.',
  blurbEn: 'How he picks up daily life, and how he reaches the thing he wants.',
  items: [
    ability('L1',
      'بعد ما تتمرنوا مع بعض على روتين جديد — خطوات غسل الإيدين أو ترتيب اللبس — بقى يفتكره لوحده؟',
      'زي إنه يغسل إيده بالترتيب من غير ما تعدّيليه كل مرة.',
      'After you practise a new routine together — handwashing steps, the order of getting dressed — does he remember it on his own?',
      'For example he washes his hands in the right order without you correcting every step.',
      { ar: 'يتعلّم روتين جديد', en: 'Learns a new routine' },
      {
        followUps: [
          fu('L1a', 'L1', ['independent', 'little_help', 'hands_on', 'does_not_yet'], single('L1a',
            'قبل ما تثبت معاه، بياخد كام مرة تجربة عادةً؟',
            'Before it sticks, how many tries does it usually take?',
            [
              { v: 'few', label: 'مرتين تلاتة' },
              { v: 'some', label: 'من أربع لست مرات' },
              { v: 'many', label: 'مرات كتير' },
              { v: 'varies', label: 'بيختلف على المزاج والوقت' },
            ],
            [
              { v: 'few', label: 'Two or three' },
              { v: 'some', label: 'Four to six' },
              { v: 'many', label: 'Many' },
              { v: 'varies', label: 'It changes with mood and time of day' },
            ],
            { ar: 'كام مرة تجربة', en: 'How many tries' },
            { feeds: 'plan' })),
        ],
      }),
    ability('L2',
      'بيحط الحاجات اللي بتتقابل مع بعض، أو بيفرز الألعاب على ميزة واحدة؟',
      'زي جورب على جورب، كوب على طبقه، أو المكعبات الحمراء لوحدها.',
      'Does he match things that go together, or sort toys by one feature?',
      'Sock to sock, cup to saucer, or the red blocks in their own pile.',
      { ar: 'يقابل ويفرز', en: 'Matches and sorts' },
      {
        gate: {
          ar: { q: 'فيه حواليه حاجات تتقابل وتتفرز؟', opts: GATE_AR },
          en: { q: 'Is there stuff around him that can be matched and sorted?', opts: GATE_EN },
        },
      }),
    ability('L3',
      'لو بتعملوا نشاط متعود عليه من تلات خطوات — بيكمّله من غير ما تعدّيليه خطوة خطوة كل مرة؟',
      'زي تجهيز سندوتشة: يفتح العيش، يحط الحاجة، يقفل.',
      'In a familiar three-step activity, does he finish it without you talking him through each step every time?',
      'For example making a sandwich: open the bread, put the filling in, close it.',
      { ar: 'يكمل نشاط من تلات خطوات', en: 'Finishes a three-step activity' },
      {
        gate: {
          ar: { q: 'بيشارك معاكم في نشاطات بتتم على خطوات؟', opts: GATE_AR },
          en: { q: 'Does he join in activities that run in steps?', opts: GATE_EN },
        },
      }),
    frequency('L4',
      'في أغنية أو حكاية متعود عليها — بيوريّك إنه عارف الجاي إيه؟ يسكت، يكمّل، يتحرك؟',
      'زي إنك توقفي الأغنية في النص وهو يكمّلها.',
      'In a song or story he knows, does he show that he knows what comes next — pausing, filling in, moving?',
      'For example you stop the song halfway and he finishes it.',
      { ar: 'يعرف الجاي إيه', en: 'Knows what comes next' },
    ),
    ability('L5',
      'لو حاجة هو عايزها بعيدة عنه — بيوصلها بطريقته من غير ما تولّعي عليها إنتي؟',
      'زي لعبة على الكنبة وهو تحتها: يشد فوطة، أو يناديك، أو يطلع عليها.',
      'If something he wants is out of reach, does he work out a way to get it without you solving it for him?',
      'For example a toy on the couch while he is below it: pulls a cloth, calls you, or climbs.',
      { ar: 'يحل مشكلة توصله للحاجة', en: 'Solves how to reach it' },
      {
        followUps: [
          fu('L5a', 'L5', ['independent', 'little_help', 'hands_on', 'does_not_yet'], multi('L5a',
            'وبيعملها إزاي عادةً؟ (علّمي كل اللي بيحصل)',
            'And how does he usually go about it? (tick everything he does)',
            [
              chip('tool', 'يوصلها بأداة — فوطة أو عصاية', 'Reaches with a tool — a cloth or stick'),
              chip('asking', 'يطلب من حد يساعده', 'Asks someone for help'),
              chip('climbing', 'يطلع عليها نفسه', 'Climbs to it himself'),
              chip('gives_up', 'يسيّبها', 'Leaves it'),
              chip('upset', 'يتضيق ويصرخ أو يعيط', 'Gets stuck and shouts or cries'),
            ],
            { ar: 'طريقته في الحل', en: 'His way of solving it' },
            { feeds: 'plan' })),
        ],
      }),
    scaled('L6',
      'لو حاجة اتغيرت في روتين متعود عليه — الأكلة اتأخرت، أو مكانها اختلف — بيعدّيها إزاي؟',
      'من غير ما تعملوا استعداد للتغيير.',
      'If something changes inside a routine he is used to — lunch is late, it is in a different place — how does he get through it?',
      'With no special warning about the change.',
      { ar: 'يتعامل مع تغيير بسيط', en: 'Copes with a small change' },
      [
        { v: 'fine', label: 'بيعدّيها عادي' },
        { v: 'fussy', label: 'بيتضيق شوية بس بيهدي' },
        { v: 'long', label: 'بيتضيق ومبيهديش غير بعد وقت' },
        { v: 'big', label: 'رد كبير ومفيش حاجة تهديه' },
        { v: 'unsure', label: 'مش باين' },
      ],
      [
        { v: 'fine', label: 'Gets through it normally' },
        { v: 'fussy', label: 'A little unsettled, then settles' },
        { v: 'long', label: 'Unsettled, and takes a while to settle' },
        { v: 'big', label: 'A big reaction that nothing settles' },
        { v: 'unsure', label: 'Hard to tell' },
      ],
      ['independent', 'little_help', 'hands_on', 'does_not_yet', 'unknown'],
      { noTriplet: true, feeds: 'plan' },
    ),
    opportunity('L7',
      'خد فرصة يتمرّن على حروف أو أرقام أو يقلّم قلم، في البيت أو في المدرسة؟',
      'زي إنه يقلّم على ورق، أو يعدّ حبايات معاكم.',
      'Has he had any chance to practise early letters, numbers or mark-making, at home or at school?',
      'For example making marks on paper, or counting beads with you.',
      { ar: 'فرصة التمرّن على الحروف والأرقام', en: 'A chance to practise letters and numbers' },
      { feeds: 'plan' },
    ),
  ],
};

/* ══ Block C — Daily life & self-care (S) ══════════════════════════════════
 * The area parents report on most reliably (SIS-C "home", WG self-care,
 * ICF d5), and the area where an unmet support need hits the family hardest
 * and shows up latest — so every item here asks the met/unmet question.
 * §2 Block C. */

const BLOCK_S = {
  id: 'S', order: 3, icon: '🍽️',
  titleAr: 'الحياة اليومية والعناية بالنفس',
  titleEn: 'Daily life and self-care',
  blurbAr: 'الأكل، اللبس، الحمام، النظافة، والاختيار — في يوم عادي.',
  blurbEn: 'Eating, dressing, the toilet, cleanliness, and choosing — on an ordinary day.',
  items: [
    ability('S1',
      'بياكل بالملقة أو الشوكة ويشرب من الكوب، واللي بيتسكب منه بسيط؟',
      'زي إنه ياكل الزبادي لوحده ويشرب مية من كوباية عادية.',
      'Does he eat with a spoon or fork and drink from a cup, with only a little spilled?',
      'For example he eats yoghurt himself and drinks water from an ordinary cup.',
      { ar: 'ياكل ويشرب لوحده', en: 'Eats and drinks himself' }),
    ability('S2',
      'بيلبس أغلب هدومه، ومبتساعديش إلا في الحاجات الصعبة زي الزرار أو السحّاب اللي ورا؟',
      'زي إنه يلبس التيشيرت والبنطلون لوحده ويستناكي في الأزرار.',
      'He gets most of his clothes on, needing help only for the tricky steps like buttons or a back zip?',
      'For example he puts his T-shirt and trousers on himself and waits for you at the buttons.',
      { ar: 'يلبس أغلب هدومه', en: 'Dresses for most steps' },
      {
        gate: {
          ar: { q: 'بيشارك في اللبس في اليوم؟', opts: GATE_AR },
          en: { q: 'Does he take part in getting dressed during the day?', opts: GATE_EN },
        },
      }),
    ability('S3',
      'بيقولك — بأي طريقة — إنه محتاج الحمام، أو هو في ميعاد حمام متظبط؟',
      'زي إنه يشاور، أو يقول كلمة، أو يمشي ناحية الحمام لوحده.',
      'Does he tell you — in any way — that he needs the toilet, or is he in a set toilet routine?',
      'For example he points, says a word, or walks toward the bathroom on his own.',
      { ar: 'يقول إنه محتاج الحمام', en: 'Signals he needs the toilet' },
      {
        gate: {
          ar: { q: 'موضوع الحمام مطروح في يومكم؟', opts: GATE_AR },
          en: { q: 'Is the toilet part of your day yet?', opts: GATE_EN },
        },
        followUps: [
          fu('S3a', 'S3', ['independent', 'little_help', 'hands_on', 'does_not_yet'], single('S3a',
            'بيقولها إزاي بالظبط؟',
            'How exactly does he tell you?',
            [
              { v: 'words', label: 'بكلمة أو جملة' },
              { v: 'sign', label: 'بإشارة متفق عليها' },
              { v: 'leads', label: 'ياخد إيدك ويروح بيها' },
              { v: 'goes', label: 'يمشي ناحية الحمام نفسه' },
              { v: 'time', label: 'في ميعاد ثابت كل يوم' },
              { v: 'nothing_clear', label: 'مفيش طريقة واضحة لسه' },
            ],
            [
              { v: 'words', label: 'A word or phrase' },
              { v: 'sign', label: 'An agreed gesture' },
              { v: 'leads', label: 'Leads your hand there' },
              { v: 'goes', label: 'Walks to the bathroom himself' },
              { v: 'time', label: 'At a fixed time each day' },
              { v: 'nothing_clear', label: 'No clear way yet' },
            ],
            { ar: 'الطريقة اللي بيقول بيها', en: 'The way he says it' },
            { feeds: 'plan' })),
        ],
      }),
    ability('S4',
      'بيغسل إيده وينشفهم، والتذكير بالكلام كفاية معاه من غير ما تمسكي إيده؟',
      'زي إنه يفتح المية، يحط الصابون، يفوّف، وينشف بالمنشفة.',
      'Does he wash and dry his hands with spoken prompts only, without you guiding his hand through it?',
      'For example he turns the water on, adds soap, rinses, and dries on the towel.',
      { ar: 'يغسل وينشف إيده', en: 'Washes and dries his hands' }),
    ability('S5',
      'لو خيّرتيه بين حاجتين مألوفين — أكلة أو لعبة — بيقدر يختار بأي طريقة؟',
      'زي «تفاحة ولا موزة؟» فيشاور أو يقول أو يمد إيده.',
      'Offered two familiar things — a snack, a game — can he choose between them in any way?',
      'For example "apple or banana?" and he points, says one, or reaches for it.',
      { ar: 'يختار بين حاجتين', en: 'Chooses between two things' },
      {
        gate: {
          ar: { q: 'بتخيّروه في حاجات في اليوم؟', opts: GATE_AR },
          en: { q: 'Do you give him choices during the day?', opts: GATE_EN },
        },
      }),
    ability('S6',
      'بيتعامل مع فلوس أو موبايل بطريقة بسيطة، أو بيقولك إنه محتاج مساعدة فيها؟',
      'زي إنه يدي الفلوس للكاشير، أو يفتح التطبيق بتاعه على الموبايل.',
      'Does he handle small money or phone tasks in a simple way, or ask for help with them?',
      'For example he hands the money to the cashier, or opens his own app on the phone.',
      { ar: 'فلوس وموبايل', en: 'Money and phone tasks' },
      {
        // §5 age/individual differences: this task only exists for a child old
        // enough to be handed money or a phone. Below 7 it is NOT asked — the
        // honest alternative would be a false "does not do it yet".
        ageMinMonths: 84,
        gate: {
          ar: { q: 'بتتم له فرص كده في الطلعات؟', opts: GATE_AR },
          en: { q: 'Do these chances come up for him on outings?', opts: GATE_EN },
        },
      }),
  ],
};

/* ══ Block D — Movement & access (M) ═══════════════════════════════════════
 * WG mobility + ICF d4/b7-8. This block decides the INPUT LAYER, not the
 * difficulty: target size, response mode, and how long a seated session can
 * honestly be. Asking it in ability language is what lets a child who moves
 * differently still get a usable first screen. §2 Block D. */

const BLOCK_M = {
  id: 'M', order: 4, icon: '🦵',
  titleAr: 'الحركة والطريقة اللي بيتحكّم بيها',
  titleEn: 'Movement and how he controls things',
  blurbAr: 'الحركة، التوازن، استخدام الإيدين، والراحة في القعدة.',
  blurbEn: 'Moving, balance, hand use, and how comfortable sitting still is.',
  items: [
    ability('M1',
      'بيتمشى ويطلع السلم — ماسك في السور أو في إيدك، أو من غير مسكة؟',
      'زي إنه يطلع السلم ماسك في السور من غير ما تشيله.',
      'Does he walk and climb stairs — holding the rail or your hand, or with no hold at all?',
      'For example he goes up the stairs holding the rail without being lifted.',
      { ar: 'يمشي ويطلع السلم', en: 'Walks and climbs stairs' },
      {
        followUps: [
          fu('M1a', 'M1', ['independent', 'little_help', 'hands_on', 'does_not_yet'], multi('M1a',
            'شكل الحركة معاه إيه بالظبط؟ (علّمي كل اللي ينفع)',
            'What does movement look like for him? (tick all that apply)',
            [
              chip('none', 'يمشي من غير مسكة', 'Walks with no hold'),
              chip('rail', 'يمسك في السور', 'Holds the rail'),
              chip('hand', 'يمسك في إيدك', 'Holds your hand'),
              chip('frame', 'بيستخدم مشايب أو إطار مشي', 'Uses a walker or frame'),
              chip('wheels', 'مقعد بعجل في المسافات الطويلة', 'A wheeled chair for long distances'),
              chip('carried', 'يرفض يمشي ويتشال', 'Refuses to walk and is carried'),
            ],
            { ar: 'شكل الحركة', en: 'How movement works' },
            { feeds: 'access' })),
        ],
      }),
    ability('M2',
      'بيركض أو يتحرك بسرعة في اللعب — أو بيتحرك بطريقته هو عشان يوصل للحاجات؟',
      'زي إنه يهرول ورا الكورة، أو يزحف أو يتحرك على مقعدته ناحية اللعبة.',
      'Does he run or move fast in play — or get around in his own way to reach things?',
      'For example he chases a ball, or scoots or crawls toward the toy.',
      { ar: 'يتحرك بسرعة أو بطريقته', en: 'Moves fast, or his own way' },
      {
        gate: {
          ar: { q: 'عنده مساحة أو وقت يتحرك فيه كده؟', opts: GATE_AR },
          en: { q: 'Does he have space and time to move like that?', opts: GATE_EN },
        },
      }),
    ability('M3',
      'بياكل بالشوكة أو الملقة، يقلّب صفحات، ويرسم علامات بقلم أو طبشور؟',
      'زي إنه يمسك الملقة كويس ويقلب صفحة كراسة لوحده.',
      'Does he hold and use a spoon, turn pages, and make marks with a pen or chalk?',
      'For example he holds a spoon properly and turns a page of a book himself.',
      { ar: 'يستخدم إيده مع الأدوات', en: 'Uses his hands with tools' }),
    ability('M4',
      'بيتعامل مع شاشة التاب أو الموبايل — يضغط، يسحب، أو بطريقته اللي بتشتغل معاه؟',
      'زي إنه يفتح اللعبة نفسه ويضغط على الصورة اللي عايزها.',
      'Does he use a tablet or phone screen — tapping, dragging, or in his own way that works for him?',
      'For example he opens the game himself and touches the picture he wants.',
      { ar: 'يتحكم في الشاشة', en: 'Controls a screen' },
      {
        followUps: [
          fu('M4a', 'M4', ['little_help', 'hands_on', 'does_not_yet'], multi('M4a',
            'أنهي طريقة بتنجح معاه على الشاشة؟ (علّمي كل اللي يطلع معاه)',
            'Which ways of working with a screen actually work for him? (tick all that fit)',
            [
              chip('big_targets', 'أزرار وصور كبيرة', 'Big buttons and pictures'),
              chip('helper_taps', 'حد يضغط معاه أو يمسك إيده', 'Someone taps with him or guides his hand'),
              chip('one_choice', 'اختيارين بس على الشاشة', 'Only two choices on screen'),
              chip('swipe', 'يسحب بإيده على الشاشة', 'Swipe rather than tap'),
              chip('gaze', 'يبص على الصورة وهيختارها', 'Look at a picture to select it'),
              chip('switch_button', 'زر كبير جنبه يضغط عليه', 'A big switch beside him to press'),
              chip('voice', 'بصوته أو بكلمة', 'His voice or a word'),
              chip('not_yet_screen', 'لسه مافيش طريقة اشتغلت معاه', 'No way has worked yet'),
            ],
            { ar: 'الطرق اللي بتنجح على الشاشة', en: 'Screen methods that work' },
            {
              arEx: 'اللي تختاريه هنا بيظبط شكل الشاشات كلها من أول مرة.',
              enEx: 'What you tick here sets up every screen he will see.',
              feeds: 'access',
            })),
        ],
      }),
    scaled('M5',
      'بيقعد على الترابيزة أو في مكانه وقت نشاط — عشر دقايق أو أكتر؟',
      'زي قعدة الأكل، أو قعدة وهو بيرسم.',
      'Does he sit at the table or in his place for an activity — ten minutes or more?',
      'For example the way he sits for a meal, or sits to draw.',
      { ar: 'يقعد عشر دقايق أو أكتر', en: 'Sits for ten minutes or more' },
      [
        { v: 'independent', label: 'يقعد وقت كويس لوحده' },
        { v: 'little_help', label: 'بيقعد بمساعدة — كرسي مظبوط أو حد قاعد جنبه' },
        { v: 'hands_on', label: 'محتاج حد يثبّته أو يقعد وراه' },
        { v: 'does_not_yet', label: 'مش بيقعد على الترابيزة لسه' },
      ],
      [
        { v: 'independent', label: 'Sits a good length of time on his own' },
        { v: 'little_help', label: 'Sits with help — a well-set chair, or someone beside him' },
        { v: 'hands_on', label: 'Needs someone to steady him or sit behind him' },
        { v: 'does_not_yet', label: 'Not sitting at a table yet' },
      ],
      ['independent', 'little_help', 'hands_on', 'does_not_yet'],
      { feeds: 'plan' },
    ),
  ],
};

/* ══ Block E — People, play & feelings (P) ═════════════════════════════════
 * WG relationships/playing + SIS-C social + ICF d7/d9. The one place where
 * exceptional behavioural support belongs — as SUPPORT, never as conduct.
 * P7 is a support-needs gate: its answer is never counted as good or bad
 * behaviour, and nothing here asks for a diagnosis. §2 Block E. */

const BLOCK_P = {
  id: 'P', order: 5, icon: '🫂',
  titleAr: 'الناس واللعب والمشاعر',
  titleEn: 'People, play and feelings',
  blurbAr: 'إزاي بيلعب مع الناس، وإزاي بيتعامل مع الضيق.',
  blurbEn: 'How he plays with people, and how he gets through a hard moment.',
  items: [
    ability('P1',
      'بيقعد أو بيلعب جنب عيال تانيين، أو معاهم — بطريقته هو؟',
      'زي إنه يقعد جنبهم في الحديقة ياخد نفس الحاجة، أو يديهم اللعبة.',
      'Does he play next to other children, or with them — in his own way?',
      'For example he sits beside them in the garden and uses the same thing, or hands them a toy.',
      { ar: 'يلعب جنب عيال أو معاهم', en: 'Plays near or with other children' },
      {
        gate: {
          ar: { q: 'بيبقي حوله عيال في الأسبوع؟', opts: GATE_AR },
          en: { q: 'Is he around other children during the week?', opts: GATE_EN },
        },
        noTriplet: true,
      }),
    frequency('P2',
      'بيديك أو بيوريّك حاجة هو بيحبها — من غير ما حد يطلب؟',
      'زي إنه يجيبلك اللعبة وهو فرحان ويوريّا إياك.',
      'Does he show or give you something he likes, without anyone asking?',
      'For example he brings you a toy and shows it because he is pleased.',
      { ar: 'يشارك اللي بيحبه', en: 'Shares what he likes' }),
    ability('P3',
      'في لعبة بسيطة فيها دوره يستنى — بيستنى لو فكّرناه؟',
      'زي لعبة الكراسي، أو يرمي الكورة ويستنى دورها يرجع.',
      'In a simple game where he has to wait his turn, does he wait when he is reminded?',
      'For example musical chairs, or throwing the ball and waiting for it to come back.',
      { ar: 'يستنى دوره بالتذكير', en: 'Waits a turn with a reminder' }),
    scaled('P4',
      'لو حد جنبه تعبان أو زعلان — بيعمل إيه؟',
      'زي إنه يديله حاجة، أو يبصله، أو يروح ينادي حد.',
      'If someone near him is hurt or sad, what does he do?',
      'For example he hands them something, looks at them, or goes to call an adult.',
      { ar: 'يلحظ زعل حد', en: 'Notices someone is sad' },
      [
        { v: 'gives', label: 'يديه حاجة أو يربّت عليه' },
        { v: 'brings_help', label: 'يروح ينادي حد كبير' },
        { v: 'does_same', label: 'يعمل زيّه — زعلان فهو زعلان' },
        { v: 'looks', label: 'يبصله أو يتوقف عن اللي بيعمله' },
        { v: 'nothing', label: 'مفيش رد واضح' },
        { v: 'unsure', label: 'مش باين' },
      ],
      [
        { v: 'gives', label: 'Hands them something, or pats them' },
        { v: 'brings_help', label: 'Goes to fetch an adult' },
        { v: 'does_same', label: 'Matches them — sad, so he is sad' },
        { v: 'looks', label: 'Looks at them, or stops what he is doing' },
        { v: 'nothing', label: 'No clear response' },
        { v: 'unsure', label: 'Hard to tell' },
      ],
      ['independent', 'independent', 'independent', 'little_help', 'does_not_yet', 'unknown'],
      { noTriplet: true, noMet: true },
    ),
    scaled('P5',
      'لو قولتيله «استنى» أو «دي مش دلوقتي» أو «الدور على حد تاني» — بيعديها إزاي؟',
      'زي إنه يستنى دوره في الأكل أو في لعبة.',
      'If you say "wait", "not now", or "it is someone else\u2019s turn" — how does he get through it?',
      'For example waiting his turn at a meal, or in a game.',
      { ar: 'يتعامل مع الاستظار', en: 'Copes with waiting' },
      [
        { v: 'independent', label: 'بيستنى عادي' },
        { v: 'little_help', label: 'بيستنى بمساعدة — عدّ، أو جدول، أو انتظار قصير' },
        { v: 'hands_on', label: 'بيهدى بس لما حد يمسك إيده أو يطلّع من الموقف' },
        { v: 'does_not_yet', label: 'مبيقدرش يستنى لسه' },
      ],
      [
        { v: 'independent', label: 'Waits normally' },
        { v: 'little_help', label: 'Waits with help — counting, a chart, or a short wait' },
        { v: 'hands_on', label: 'Settles only when someone takes his hand or removes him' },
        { v: 'does_not_yet', label: 'Cannot wait yet' },
      ],
      ['independent', 'little_help', 'hands_on', 'does_not_yet'],
      { feeds: 'plan' },
    ),
    multi('P6',
      'لما بيتضيق أو بيتعصب — إيه اللي بيهديه فعلًا؟ (علّمي كل اللي بيشتغل)',
      'When he is upset or angry, what actually calms him? (tick everything that works)',
      [
        chip('hug', 'حضن أو تربيت', 'A hug or a pat'),
        chip('move', 'يتحرك: يمشي، يركض، يتهز', 'Moving: walking, running, swinging'),
        chip('quiet', 'مكان هادي وقليل الضجة', 'A quiet, low-noise space'),
        chip('music', 'مزيكا أو أنشودة بيحبها', 'Music or a song he likes'),
        chip('object', 'حاجة في إيده — بطانية، لعبة', 'Something in his hands — a blanket, a toy'),
        chip('humor', 'مزحة أو ضحكة تنقّله', 'A joke or a laugh that turns it'),
        chip('space', 'يسيبوه لحاله شوية', 'Being left alone a little'),
        chip('water', 'مية — يغسل إيده أو يشرب', 'Water — washing hands, or a drink'),
        chip('back_to_routine', 'يرجعلوه نفس الحاجة اللي اتقطعت', 'Going back to the thing that was interrupted'),
        chip('nothing_calms', 'مفيش حاجة بتهديه غالبًا', 'Nothing usually calms him'),
      ],
      { ar: 'إيه اللي بيهديه', en: 'What calms him' },
      {
        arEx: 'اللي تختاريه هنا هو اللي هييبقى في زرار «عايز آخد راحة» في الشاشات.',
        enEx: 'What you tick here becomes the "I need a break" button on his screens.',
        allowCustom: true,
        feeds: 'interests',
      }),
    multi('P7',
      'فيه سلوك بيقلقك أو بيصعّب عليه التعلم؟ (لو لأ، علّمي «مفيش» — الخانات دي مش حكم على حد، دي عن المساعدة)',
      'Is there any behaviour that worries you, or that makes learning hard? (if not, tick "nothing" — these boxes judge no one, they are about help)',
      [
        chip('none', 'مفيش حاجة مقلقة', 'Nothing worries me'),
        chip('hits', 'يضرب حد', 'Hits someone'),
        chip('bites', 'بعض أو يقرص', 'Bites or pinches'),
        chip('self', 'بياذي نفسه', 'Hurts himself'),
        chip('breaks', 'يكسر حاجات', 'Breaks things'),
        chip('runs_off', 'يجري لوحده في أماكن خطرة', 'Runs off into dangerous places'),
        chip('tantrums', 'نوبات ضيق كبيرة أو صريخ', 'Big upset episodes or screaming'),
        chip('frozen', 'يتجمد ومبتيحركش', 'Freezes and does not move'),
        chip('refuses', 'يرفض يشارك أو يتعامل', 'Refuses to take part'),
        chip('sleep_linked', 'قلة النوم بتقلب سلوكه', 'Little sleep turns his behaviour over'),
        chip('repetitive', 'حركات متكررة كتير (تهزيز الإيدين، اهتزاز)', 'Repeated movements (hand flapping, rocking)'),
      ],
      { ar: 'حاجات محتاجة دعم', en: 'Things that need support' },
      {
        arEx: 'لو علّمتي حاجة هنا، هنسأل عن إيه اللي بيساعدها — مش عن تقصير منك.',
        enEx: 'If you tick something here, we ask what helps it — not to judge you.',
        allowCustom: true,
        feeds: 'plan',
        followUps: [
          fu('P7a', 'P7', ['hits', 'bites', 'self', 'breaks', 'runs_off', 'tantrums',
            'frozen', 'refuses', 'sleep_linked', 'repetitive'], multi('P7a',
            'إيه اللي غالبًا بيجي قبلها؟ وإيه اللي بيساعدها؟ (علّمي كل اللي عرفتيه)',
            'What usually comes just before it? And what helps? (tick everything you know)',
            [
              chip('before_noise', 'ضجة أو زحمة', 'Noise or a crowd'),
              chip('before_change', 'تغيير في الروتين', 'A change in routine'),
              chip('before_demand', 'طلب كان تقيل عليه', 'A demand that was too much'),
              chip('before_wait', 'انتظار طويل', 'Waiting too long'),
              chip('before_tired', 'تعب أو قلة نوم', 'Tiredness or little sleep'),
              chip('before_hunger', 'جوع أو الأكل اتأخر', 'Hunger, or a late meal'),
              chip('before_unexplained', 'مفيش سبب واضح', 'No clear reason'),
              chip('helps_routine', 'روتين ثابت متوقع', 'A steady, expected routine'),
              chip('helps_notice', 'إنك تلحظي العلامة اللي قبلها', 'Catching the signal just before'),
              chip('helps_space', 'مكان واسع وهادي', 'A wide, quiet space'),
              chip('helps_choice', 'اختيار يخلّيه يحس إنها قراره', 'A choice he can own'),
              chip('helps_professional', 'مختص درّانا طريقة', 'A specialist taught us a way'),
              chip('helps_school', 'ترتيب في المدرسة', 'An arrangement at school'),
              chip('no_plan_yet', 'لسه مفيش خطة واضحة', 'There is no clear plan yet'),
            ],
            { ar: 'اللي بيجي قبلها واللي بيساعدها', en: 'What comes before, what helps' },
            {
              arEx: 'السؤال ده عن اللي بيحصل حواليه، مش عنه هو.',
              enEx: 'This is about what happens around him, not about him.',
              allowCustom: true,
              feeds: 'plan',
            })),
        ],
      }),
  ],
};

/* ══ Block F — Health, senses, routines & comfort (H) ═════════════════════
 * SIS exceptional medical + WG "even with glasses" anchoring + standard
 * accommodation sensory profile. Vision and hearing are asked WITH
 * correction, because an uncorrected sense is a measurement problem, not a
 * child problem. H7 is a record and a referral nudge, never a rating.
 * §2 Block F. */

const BLOCK_H = {
  id: 'H', order: 6, icon: '🌙',
  titleAr: 'الصحة والحواس والروتين والراحة',
  titleEn: 'Health, senses, routines and comfort',
  blurbAr: 'العين والأذن والنوم والأكل، والأشياء اللي بتريحه أو بتضايقه.',
  blurbEn: 'Eyes, ears, sleep, food, and the things that feel good or hard.',
  items: [
    scaled('H1',
      'عينه بتشتغل كويس مع الشاشات والصور والكتب — حتى لو لابس نضّارة؟',
      'زي إنه يشوف الصورة على التاب من غير ما يقربها أوي.',
      'Does his vision work well for screens, pictures and books — even with glasses if he wears them?',
      'For example he can see the picture on the tablet without bringing it very close.',
      { ar: 'الرؤية — حتى مع النضّارة', en: 'Vision — even with glasses' },
      [
        { v: 'independent', label: 'كويس، من غير أي حاجة' },
        { v: 'little_help', label: 'كويس بس بنقربله الحاجة أو نكبّرها' },
        { v: 'hands_on', label: 'غالبًا بنوريّه الحاجة بإيدنا أو بنمسك الورقة عنه' },
        { v: 'does_not_yet', label: 'مش واضح إنه بيستخدم عينه في الحاجات دي' },
      ],
      [
        { v: 'independent', label: 'Works well as it is' },
        { v: 'little_help', label: 'Works, but we bring things closer or make them bigger' },
        { v: 'hands_on', label: 'Mostly we have to show him the thing with our hand' },
        { v: 'does_not_yet', label: 'It is not clear he uses his eyes for these things' },
      ],
      ['independent', 'little_help', 'hands_on', 'does_not_yet'],
      { noTriplet: true, feeds: 'access' },
    ),
    scaled('H2',
      'وده بتشتغل كويس مع الكلام والتعليمات البسيطة — حتى لو بيستخدم سماعة ودان؟',
      'زي إنه يسمع نداءك له من أوضة تانية.',
      'Does his hearing work well for speech and simple instructions — even with a hearing aid if he uses one?',
      'For example he hears you call him from another room.',
      { ar: 'السمع — حتى مع السماعة', en: 'Hearing — even with an aid' },
      [
        { v: 'independent', label: 'كويس، من غير أي حاجة' },
        { v: 'little_help', label: 'كويس بس محتاجين نتكلم قريب أو نعيد' },
        { v: 'hands_on', label: 'غالبًا محتاجين نلمس إيده أو نشاور له عشان ينتبه' },
        { v: 'does_not_yet', label: 'مش واضح إنه بسمع الكلام اللي حواليه' },
      ],
      [
        { v: 'independent', label: 'Works well as it is' },
        { v: 'little_help', label: 'Works, but we have to speak close or repeat' },
        { v: 'hands_on', label: 'Mostly we have to touch his hand or signal to get attention' },
        { v: 'does_not_yet', label: 'It is not clear he hears the speech around him' },
      ],
      ['independent', 'little_help', 'hands_on', 'does_not_yet'],
      { noTriplet: true, feeds: 'access' },
    ),
    multi('H3',
      'النوم في الأسابيع الأخيرة كان عامل إزاي؟ (علّم كل اللي حصل)',
      'In the last few weeks, what has sleeping been like? (tick everything that happened)',
      [
        chip('hours_lt6', 'بياخد أقل من ٦ ساعات', 'Gets under 6 hours'),
        chip('hours_6_9', 'من ٦ لـ ٩ ساعات', 'Between 6 and 9 hours'),
        chip('hours_9_plus', '٩ ساعات أو أكتر', '9 hours or more'),
        chip('hard_to_settle', 'بياخد وقت عشان ينام', 'Takes a long time to settle'),
        chip('night_waking', 'بيصحى في نص الليل', 'Wakes in the middle of the night'),
        chip('very_early', 'بيقوم بدري أوي', 'Wakes very early'),
        chip('not_refreshed', 'بيقوم مش ارتاح', 'Gets up still tired'),
        chip('regular', 'موعده ثابت تقريبًا كل يوم', 'The time is roughly regular'),
        chip('caregiver_up', 'في حد بيفضل صاحي معاه', 'Someone stays up with him'),
      ],
      { ar: 'النوم', en: 'Sleep' },
      {
        arEx: 'لو النوم متقطع، الخطة هتبقى جلسات أقصر وفي وقت أحسن.',
        enEx: 'If sleep is broken, the plan uses shorter sessions at a better hour.',
        feeds: 'plan',
      }),
    ability('H4',
      'بياكل خامات مختلفة — مقرمش وطري ولين — ولا الأكل عنده بقى محدود؟',
      'زي إنه ياكل خيار وبيض وأرز في نفس اليوم.',
      'Does he eat a range of textures — crunchy, soft, smooth — or has food become narrow?',
      'For example he eats cucumber, egg and rice on the same day.',
      { ar: 'تنوّع الأكل', en: 'Range of food textures' },
      {
        gate: {
          ar: { q: 'قاعد معاكم على نفس الأكل في اليوم؟', opts: GATE_AR },
          en: { q: 'Does he sit with you for the same food during the day?', opts: GATE_EN },
        },
        followUps: [
          fu('H4a', 'H4', ['little_help', 'hands_on', 'does_not_yet'], multi('H4a',
            'إيه اللي بيحصل مع الأكل بالظبط؟ (علّم كل اللي ينفع)',
            'What exactly happens with food? (tick all that apply)',
            [
              chip('few_textures', 'خامات قليلة بس', 'Only a few textures'),
              chip('same_food', 'نفس الأكل كل يوم', 'The same food every day'),
              chip('refuses_new', 'بيرفض أي حاجة جديدة', 'Refuses anything new'),
              chip('throws_food', 'بيرمي الأكل أو يطرد الصحن', 'Throws food or pushes the plate away'),
              chip('choking_fear', 'يغص أو إحنا خايفين منه', 'Chokes, or we are afraid of that'),
              chip('medical_diet', 'دكتور قال نأكل بطريقة معينة', 'A doctor said to feed a certain way'),
              chip('meal_stress', 'وقت الأكل متعب للكل', 'Meal times are hard for everyone'),
              chip('someone_helps', 'فيه حد بيساعدنا في الأكل', 'Someone is helping us with food'),
            ],
            { ar: 'تفاصيل الأكل', en: 'Food details' },
            { feeds: 'plan' })),
        ],
      }),
  ],
};

/* H5–H7 added here rather than inline only to keep each chunk reviewable.
 * All three are deliberately UNSCORED: health care, sensory preference and
 * check-up history are not abilities. They set UI defaults, session timing,
 * and one honest referral nudge. */
BLOCK_H.items.push(
  multi('H5',
    'فيه رعاية طبية مستمرة أو علاج أو دوا بيأثر على نشاطه أو مزاجه أو وقت نومه؟',
    'Any ongoing medical care, therapy, or medicine that affects his energy, mood, or sleep time?',
    [
      chip('none', 'مفيش أي حاجة من دي', 'None of these'),
      chip('speech_therapy', 'جلسات كلام أو لغة', 'Speech or language sessions'),
      chip('physio', 'علاج طبيعي أو تأهيل حركي', 'Physiotherapy or movement therapy'),
      chip('occupational', 'علاج وظيفي أو تكاملي', 'Occupational or sensory therapy'),
      chip('daily_medicine', 'دوا كل يوم', 'Daily medicine'),
      chip('drowsy_medicine', 'دوا بيعمله نعسان أو بطيء', 'Medicine that makes him sleepy or slow'),
      chip('seizures', 'نوبات أو تشنجات', 'Episodes or seizures'),
      chip('stomach', 'معدة أو إمساك', 'Stomach or constipation'),
      chip('many_appointments', 'مواعيد كتير بتاخد من يومه', 'Many appointments taking up his day'),
      chip('wanted_not_available', 'محتاج رعاية ومفيش إمكانية دلوقتي', 'Care is needed and not available now'),
    ],
    { ar: 'الرعاية الجارية', en: 'Current care' },
    {
      arEx: 'وقت الرعاية ده بيتحسب في خطة الأسبوع عشان ما نتخنقش معاه.',
      enEx: 'Therapy time is counted into the weekly plan so we do not overload the day.',
      allowCustom: true,
      feeds: 'context',
    }),
  multi('H6',
    'حاجات حواسه بتحبها أو بتكرهها — أصوات، خامات، حركة، ضوء، روائح. (علّم كل اللي حصل)',
    'Things his senses like or avoid — sounds, textures, movement, light, smells. (tick everything that applies)',
    [
      chip('likes_music', 'بيحب المزيكا أو الإيقاع', 'Loves music or rhythm'),
      chip('likes_water', 'بيحب المية واللعب بيها', 'Loves water and playing in it'),
      chip('likes_spinning', 'بيحب الحاجات اللفّانة أو الحركة المتكررة', 'Loves spinning or repeated movement'),
      chip('likes_pressure', 'بيحب الحضن القوي أو البطانية التقيلة', 'Loves a firm hug or a heavy blanket'),
      chip('likes_movement', 'بيحب يتهز أو يطلع أو ينزل', 'Loves swinging, climbing up and down'),
      chip('likes_textures', 'بيحب يمسك خامات مختلفة', 'Loves touching different textures'),
      chip('likes_animals', 'بيحب الحيوان والطيور', 'Loves animals and birds'),
      chip('avoids_loud', 'الأصوات العالية بتفزعه', 'Loud sounds startle him'),
      chip('avoids_appliances', 'أصوات معينة بتضيقه (مكنسة، خلاط)', 'Certain sounds upset him (hoover, blender)'),
      chip('avoids_sticky', 'اللزج أو المية على إيده بتضيقه', 'Sticky things or wet hands upset him'),
      chip('avoids_crowds', 'الزحمة بتعبه', 'Crowds tire him'),
      chip('avoids_bright', 'الضوء القوي أو الشاشات السريعة بتضيقه', 'Bright light or fast screens upset him'),
      chip('avoids_smells', 'روائح معينة بتضايقه', 'Certain smells upset him'),
      chip('avoids_surprise', 'أي حاجة جديدة فجأة بتضيقه', 'Anything new without warning upsets him'),
      chip('seeks_pressure', 'يدفن نفسه تحت مخد أو يطلب حضن كتير', 'Pushes under cushions or asks for hugs a lot'),
    ],
    { ar: 'الحواس: بيحب إيه وبيavoid إيه', en: 'Senses: likes and avoids' },
    {
      arEx: 'اللي هنا بيظبط الشكل الافتراضي للشاشات: صوت، حركة، وزحمة صور.',
      enEx: 'What you tick here sets the default screen look: sound, motion, and how busy it is.',
      groups: true,
      allowCustom: true,
      feeds: 'access',
    }),
  single('H7',
    'في السنة اللي فاتت، اتعمل كشف سمع أو نظر أو صحة عام؟',
    'In the last year, has a hearing, vision or general health check been done?',
    [
      { v: 'hearing', label: 'أيوة، كشف سمع' },
      { v: 'vision', label: 'أيوة، كشف نظر' },
      { v: 'both', label: 'السمع والنظر الاتنين' },
      { v: 'general_only', label: 'كشف صحة عام بس' },
      { v: 'none', label: 'لأ، مفيش حاجة اتعملت' },
      { v: 'tried_unavailable', label: 'حاولنا ومفيش إمكانية دلوقتي' },
    ],
    [
      { v: 'hearing', label: 'Yes, a hearing check' },
      { v: 'vision', label: 'Yes, a vision check' },
      { v: 'both', label: 'Both hearing and vision' },
      { v: 'general_only', label: 'A general health check only' },
      { v: 'none', label: 'No, nothing has been done' },
      { v: 'tried_unavailable', label: 'We tried; nothing is available now' },
    ],
    { ar: 'آخر كشف', en: 'Last check-up' },
    {
      arEx: 'الحواس أول حاجة نتأكد منها — قبل أي تدريب على الشاشة.',
      enEx: 'The senses are the first thing to confirm — before any screen practice.',
      feeds: 'context',
    }),
);

/* ══ Block G — Interests, strengths & what works (G) ══════════════════════
 * The strengths-first block. Standard accommodation reinforcer lists, ICF
 * recreation (best by self-report), Schalock (strengths coexist with needs)
 * and I-CAN (qualitative goals set by the family). Nothing here is scored as
 * an ability; everything here is what makes the first plan worth doing.
 * §2 Block G. */

const BLOCK_G = {
  id: 'G', order: 7, icon: '⭐',
  titleAr: 'الأشياء اللي بيحبها واللي بيعملها حلو',
  titleEn: 'What he loves and what he does well',
  blurbAr: 'دي أهم قطعة في الملف: هنا بنبناء الحاجات اللي بنشتغل بيها.',
  blurbEn: 'This is the most important block: this is what we build the plan from.',
  items: [
    multi('G1',
      'إيه أكتر الحاجات اللي بتشدّه؟ (اختاروا لحد ٥، وضيفوا بنفسكم أي حاجة تانية)',
      'What pulls his attention most? (choose up to 5, and add anything else yourself)',
      [
        chip('animals', 'حيوانات أو طيور', 'Animals or birds'),
        chip('vehicles', 'عربيات، أوتوبيس، طيارات', 'Cars, buses, planes'),
        chip('water', 'مية وحوض وسقاية الزرع', 'Water, the tap, watering plants'),
        chip('music', 'مزيكا وأناشيد', 'Music and songs'),
        chip('building', 'مكعبات وتجميع', 'Blocks and building up'),
        chip('characters', 'شخصية كرتونية معينة', 'One particular cartoon character'),
        chip('outdoors', 'الشارع والحديقة والسطح', 'The street, garden, rooftop'),
        chip('balls', 'كره وركض', 'Balls and running'),
        chip('puzzles', 'بازل وتجميع قطع', 'Puzzles and fitting pieces'),
        chip('spinning', 'حاجات لفّانة ودوّارة', 'Spinning and turning things'),
        chip('sensory', 'خامات وتراب ومية ومية فقاعة', 'Textures, sand, bubbles'),
        chip('helping', 'يساعد: يجيب حاجة، يلمّ', 'Helping: fetching, tidying'),
        chip('screens', 'تاب أو موبايل', 'A tablet or phone'),
        chip('books', 'كتب وصور اتقلّب', 'Books and picture pages'),
        chip('people', 'ناس وأصوات ناس وعيال', 'People, voices, other children'),
        chip('food', 'أكل وريحة أكل وثلاجة', 'Food, the smell of food, the fridge'),
      ],
      { ar: 'اللي بيشدّه', en: 'What pulls him in' },
      {
        arEx: 'الحاجات دي هتبقى مكافآت وهيظهر منها شكل الأنشطة.',
        enEx: 'These become the rewards, and the activities take their shape from them.',
        maxSelect: 5,
        allowCustom: true,
        feeds: 'interests',
      }),
    multi('G2',
      'لو يومه تقيل أو حدّه ضيق — إيه اللي بيرجّعه؟ (علّم كل اللي يطلع معاه)',
      'When the day is heavy or he has a hard moment — what brings him back? (tick all that work)',
      [
        chip('hug', 'حضن أو تربيت على كتفه', 'A hug or a pat on the shoulder'),
        chip('move_out', 'نطلع نمشي أو نركض شوية', 'Going out for a walk or a run'),
        chip('music_play', 'أنشودة أو أغنية بيحفظها', 'A song he knows by heart'),
        chip('quiet_corner', 'مكان هادي لوحده', 'A quiet place on his own'),
        chip('joke', 'مزحة أو ضحكة', 'A joke or a laugh'),
        chip('favourite_object', 'حاجة بيحبها في إيده', 'A special thing in his hands'),
        chip('water_play', 'مية — يغسل إيده أو يلعب', 'Water — washing hands, or playing'),
        chip('food_treat', 'حاجة بيحب ياكلها', 'A food he loves'),
        chip('screen_time', 'تاب أو برنامج معين', 'A tablet or a particular show'),
        chip('back_to_routine', 'نرجعله نفس اللي كان بيعمله', 'Going back to what he was doing'),
        chip('another_person', 'حد تاني بيهدّيه غيري', 'Someone else calms him, not me'),
      ],
      { ar: 'اللي بيرجّعه', en: 'What brings him back' },
      {
        arEx: 'دي مشاوير يومكم، ودي اللي هتحطها IRIS قدامك وقت الحاجة.',
        enEx: 'These are your real daily moves, and IRIS will put them in front of you when needed.',
        allowCustom: true,
        feeds: 'interests',
      }),
    single('G3',
      'بيقول «كفاية» أو «عايز أرتاح» إزاي؟ (علّم أي طريقة بتحصل)',
      'How does he say "enough" or "I need a break"? (tick any way it happens)',
      [
        { v: 'words', label: 'بكلمة أو جملة' },
        { v: 'pushes', label: 'يدّي الإيد أو يطرد الحاجة' },
        { v: 'leaves', label: 'يقوم ويمشي' },
        { v: 'covers', label: 'يغطّي ودانه أو عينه' },
        { v: 'sounds', label: 'أصوات أو نهجة معينة' },
        { v: 'hand_sign', label: 'إشارة متفق عليها' },
        { v: 'device', label: 'يضغط على زرار أو صورة' },
        { v: 'fuss', label: 'يتضيق ويتحرك كتير' },
        { v: 'no_signal', label: 'مفيش علامة واضحة لسه' },
      ],
      [
        { v: 'words', label: 'A word or phrase' },
        { v: 'pushes', label: 'Pushes the hand or the thing away' },
        { v: 'leaves', label: 'Gets up and leaves' },
        { v: 'covers', label: 'Covers his ears or eyes' },
        { v: 'sounds', label: 'A particular sound or tone' },
        { v: 'hand_sign', label: 'An agreed gesture' },
        { v: 'device', label: 'Presses a button or a picture' },
        { v: 'fuss', label: 'Gets fussy and moves a lot' },
        { v: 'no_signal', label: 'No clear signal yet' },
      ],
      { ar: 'علامة «كفاية»', en: 'The "I am done" signal' },
      {
        arEx: 'العلامة دي بتتحول لزر «أنا خلصت» في الشاشات — ماحدش هيزعّله.',
        enEx: 'This signal becomes the "I am done" button on his screens — nobody will push him.',
        followUps: [
          fu('G3a', 'G3', ['no_signal'], single('G3a',
            'تحبوا زر الراحة يظهر إزاي؟',
            'How would you like the break button to appear?',
            [
              { v: 'big_first', label: 'زر كبير في أول الشاشة' },
              { v: 'small_corner', label: 'زر صغير في الكورنر' },
              { v: 'picture_only', label: 'صورة بس من غير كلام' },
              { v: 'adult_help', label: 'حد كبير يضغطه معاه' },
            ],
            [
              { v: 'big_first', label: 'A big button at the top of the screen' },
              { v: 'small_corner', label: 'A small button in the corner' },
              { v: 'picture_only', label: 'Just a picture, no words' },
              { v: 'adult_help', label: 'An adult presses it with him' },
            ],
            { ar: 'شكل زر الراحة', en: 'How the break button looks' },
            { feeds: 'access' })),
        ],
      }),
    single('G4',
      'أنى وقت في اليوم بيبقى أقدر يركّز أو يستمتع؟',
      'At what time of day is he best able to focus and enjoy things?',
      [
        { v: 'morning', label: 'الصباح بدري' },
        { v: 'before_noon', label: 'قبل الضهر' },
        { v: 'after_noon', label: 'بعد الضهر والأكل' },
        { v: 'after_rest', label: 'بعد ما يرتاح أو ينايم شوية' },
        { v: 'evening', label: 'بالليل قبل النوم' },
        { v: 'varies', label: 'بيختلف يوم عن يوم' },
      ],
      [
        { v: 'morning', label: 'Early morning' },
        { v: 'before_noon', label: 'Before noon' },
        { v: 'after_noon', label: 'After lunch' },
        { v: 'after_rest', label: 'After a rest or a nap' },
        { v: 'evening', label: 'Evening, before bed' },
        { v: 'varies', label: 'It changes day by day' },
      ],
      { ar: 'أحسن وقت', en: 'Best time of day' },
      { feeds: 'plan' },
    ),
    opentext('G5',
      'حاجة واحدة بيعملها حلو أوي، أو بتفخري بيه وهو عملها — احكيها بالكلام بتاعك.',
      'نفس اللي بتقوله بالظبط، من غير تصحيح.',
      'One thing he does really well, or one thing you were proud of when he did it — say it in your own words.',
      'Exactly what you say, no correcting.',
      { ar: 'حاجة بتفخر بيه', en: 'Something you are proud of' },
      {
        followUps: [],
        feeds: 'plan',
      }),
    opentext('G6',
      'إيه أمنيتك ليه في التلات شهور الجاية؟ (اكتبي اللي ييجي في بالك — اتنين كفاية)',
      'مثال: «يركب الدولاب» — «يقولي عايز مية».',
      'What do you hope for him in the next three months? (write whatever comes — two is enough)',
      'Example: "ride the bicycle" — "tell me he wants water".',
      { ar: 'أماني التلات شهور', en: 'Hopes for the next 3 months' },
      { maxEntries: 2, feeds: 'plan' }),
  ],
};

/* ══ Block H — About your child's world (X) ══════════════════════════════
 * Context: unscored but decisive (UNICEF pp.112-113 broad respondent, p.32
 * preferred formats). A child exposed to two languages is not behind: the
 * school-language caveat below is what keeps the ladder from being read as
 * an ability finding when it is really a language-of-instruction finding.
 * §2 Block H (X items). */

const BLOCK_X = {
  id: 'X', order: 8, icon: '🏠',
  titleAr: 'عن عالم طفلك',
  titleEn: 'About your child\u2019s world',
  blurbAr: 'الأسئلة دي مش عن قدرته — دي عن البيت والمدرسة واللي حواليه.',
  blurbEn: 'These are not about what he can do — they are about home, school, and around him.',
  items: [
    multi('X1',
      'إيه اللغات واللهجات اللي بيتقال حواليه أو هو بيقولها؟ (علّم كل اللي موجود)',
      'Which languages or dialects are spoken around him, or used by him? (tick everything present)',
      [
        chip('egy_arabic', 'عربي مصري (عامية البيت)', 'Egyptian Arabic (home dialect)'),
        chip('msa', 'عربي فصيح (زي في المدرسة أو القراءة)', 'Modern Standard Arabic (school and reading)'),
        chip('other_arabic', 'لهجة عربية تانية (صعيدي/سوداني/بدوي)', 'Another Arabic dialect'),
        chip('english', 'إنجليزي', 'English'),
        chip('french', 'فرنسي', 'French'),
        chip('other_language', 'language تانية', 'Another language'),
        chip('sign', 'لغة إشارة', 'A sign language'),
      ],
      { ar: 'اللغات حوالينه', en: 'Languages around him' },
      {
        allowCustom: true,
        feeds: 'context',
        followUps: [
          fu('X1a', 'X1', [], single('X1a',
            'أنهي لغة بيفهمها أحسن من غيرها؟',
            'Which language does he understand best?',
            [
              { v: 'same_as_home', label: 'لغة البيت نفسها' },
              { v: 'school_language', label: 'لغة المدرسة' },
              { v: 'both_equal', label: 'الاتنين بنفس القدر' },
              { v: 'one_word_more', label: 'كلمة واحدة من أي لغة بتوصل' },
              { v: 'unsure', label: 'مش متأكد' },
            ],
            [
              { v: 'same_as_home', label: 'The home language itself' },
              { v: 'school_language', label: 'The school language' },
              { v: 'both_equal', label: 'Both equally' },
              { v: 'one_word_more', label: 'One word from any language gets through' },
              { v: 'unsure', label: 'Not sure' },
            ],
            { ar: 'الأسهل عليه', en: 'Easiest to understand' },
            { feeds: 'context' })),
          fu('X1b', 'X1', [], single('X1b',
            'أنهي لغة مكتوبة أو مسموعة هو أكتر عرضة لها؟',
            'Which written or spoken form does he meet most?',
            [
              { v: 'spoken_only', label: 'منطوق بس (عامية)' },
              { v: 'read_aloud_msa', label: 'فصيح بيتقرا ليه أو بيسمعه' },
              { v: 'both_script', label: 'الاتنين بالنص المكتوب' },
              { v: 'no_exposure', label: 'لسه ما تعرضّوش على حاجة مكتوبة' },
            ],
            [
              { v: 'spoken_only', label: 'Spoken only (dialect)' },
              { v: 'read_aloud_msa', label: 'Standard Arabic read aloud to him' },
              { v: 'both_script', label: 'Both in writing' },
              { v: 'no_exposure', label: 'He has not met written language yet' },
            ],
            { ar: 'أقرب حاجة للنص', en: 'Closest to print' },
            { feeds: 'context' })),
        ],
      }),
    single('X2',
      'روّح المدرسة أو الحضانة أو أي مكان بيتعلم فيه؟',
      'Does he go to school, kindergarten, or any place where he learns?',
      [
        { v: 'school_full', label: 'مدرسة — يوم كامل' },
        { v: 'school_part', label: 'مدرسة — نص يوم' },
        { v: 'kindergarten', label: 'حضانة أو كي جي' },
        { v: 'learning_place', label: 'مركز أو مكان تعلم مش مدرسة' },
        { v: 'home_only', label: 'في البيت بس' },
        { v: 'left_recently', label: 'كان رايح وقفنا مؤخرًا' },
      ],
      [
        { v: 'school_full', label: 'School — full day' },
        { v: 'school_part', label: 'School — part day' },
        { v: 'kindergarten', label: 'Kindergarten or nursery' },
        { v: 'learning_place', label: 'A learning centre, not school' },
        { v: 'home_only', label: 'Home only' },
        { v: 'left_recently', label: 'He went and we stopped recently' },
      ],
      { ar: 'مكان التعلم', en: 'Where he learns' },
      {
        feeds: 'context',
        followUps: [
          fu('X2a', 'X2', ['school_full', 'school_part', 'kindergarten', 'learning_place'], single('X2a',
            'كام ساعة في اليوم هناك؟',
            'How many hours a day is he there?',
            [
              { v: 'lt2', label: 'أقل من اتنين' },
              { v: '2_4', label: 'من اتنين لأربعة' },
              { v: '4_6', label: 'من أربعة لستة' },
              { v: '6_plus', label: 'ستة أو أكتر' },
            ],
            [
              { v: 'lt2', label: 'Under two' },
              { v: '2_4', label: 'Two to four' },
              { v: '4_6', label: 'Four to six' },
              { v: '6_plus', label: 'Six or more' },
            ],
            { ar: 'ساعات المدرسة', en: 'School hours' },
            { feeds: 'context' })),
          fu('X2b', 'X2', [], multi('X2b',
            'فيه جلسات علاج أو دعم بتتم أسبوعيًا؟',
            'Are there therapy or support sessions each week?',
            [
              chip('speech', 'كلام أو لغة', 'Speech or language'),
              chip('mot', 'حركي أو وظيفي', 'Movement or occupational'),
              chip('sensory', 'تكاملي أو حسي', 'Sensory or integrative'),
              chip('academic', 'دعم تعليمي أو دروس', 'Academic support or tutoring'),
              chip('psych', 'نفسي أو سلوكي', 'Psychological or behavioural'),
              chip('group', 'جماعة أو اللعب مع عيال', 'A play or social group'),
              chip('no_therapy', 'لأ، مفيش جلسات', 'No, no sessions'),
              chip('wanted_none', 'عايزين ومفيش في منطقتنا', 'We want them; none near us'),
            ],
            { ar: 'الجلسات الأسبوعية', en: 'Weekly sessions' },
            { feeds: 'context' })),
          fu('X2c', 'X2', ['speech', 'mot', 'sensory', 'academic', 'psych', 'group'], single('X2c',
            'مجموع الساعات دي كام في الأسبوع؟',
            'How many hours is that in total each week?',
            [
              { v: 'lt1', label: 'أقل من ساعة' },
              { v: '1_3', label: 'من ساعة لتلات' },
              { v: '3_6', label: 'من تلات لست' },
              { v: '6_plus', label: 'ست أو أكتر' },
            ],
            [
              { v: 'lt1', label: 'Under one hour' },
              { v: '1_3', label: 'One to three' },
              { v: '3_6', label: 'Three to six' },
              { v: '6_plus', label: 'Six or more' },
            ],
            { ar: 'ساعات الجلسات', en: 'Session hours' },
            { feeds: 'context' })),
        ],
      }),
    multi('X3',
      'عملتوا قبل كده تقييم أو تقرير لطفل (نطق، نفسية، طب، مدرسة)؟ تحب تضيف حاجة منه؟',
      'Has any assessment or report been done for your child before (speech, psychology, medical, school)? Would you like to add anything from it?',
      [
        chip('speech_report', 'تقرير نطق أو كلام', 'A speech report'),
        chip('psych_report', 'تقييم نفسي أو سلوكي', 'A psychological or behavioural assessment'),
        chip('medical_report', 'تقرير من دكتور أو مستشفى', 'A doctor or hospital report'),
        chip('school_report', 'ورقة من المدرسة أو تقرير سنوي', 'A school note or annual report'),
        chip('upload_want', 'أقدر أضيف ورقة أو صورة؟', 'Can I add a paper or photo?'),
        chip('none_needed', 'مفيش أو مش محتاج نضيف', 'There is none, or nothing to add'),
      ],
      { ar: 'تقارير قبل كده', en: 'Reports from before' },
      {
        arEx: 'مفيش حاجة هتتحول لتشخيص — بنقرأها بس عشان نفهم أفضل.',
        enEx: 'Nothing here becomes a diagnosis — we read it only to understand better.',
        allowCustom: true,
        feeds: 'context',
      }),
    opentext('X4',
      'مين اللي بيرد على الأسئلة دي، ومن كام أسبوع هو اللي شايف يوم طفلك العادي؟',
      'مثال: «ماما، من ٤٠ أسبوع» أو «تيتا من شهرين».',
      'Who is answering these questions, and for how many weeks have they seen your child\u2019s ordinary day?',
      'Example: "mum, for 40 weeks" or "grandma, two months".',
      { ar: 'مين بيرد', en: 'Who is answering' },
      { feeds: 'context' }),
    single('X5',
      'تحب IRIS يعرض عليك إيه: كلام مكتوب، صوت مسموع، ولا الاتنين؟',
      'How would you like IRIS to present things: written text, spoken audio, or both?',
      [
        { v: 'text', label: 'مكتوب بس' },
        { v: 'audio', label: 'مسموع بس' },
        { v: 'both', label: 'الاتنين مع بعض' },
      ],
      [
        { v: 'text', label: 'Text only' },
        { v: 'audio', label: 'Audio only' },
        { v: 'both', label: 'Both together' },
      ],
      { ar: 'شكل العرض', en: 'Preferred format' },
      {
        arEx: 'الحاجة دي بتتطبق على التطبيق كله، وممكن تتغير في أي وقت.',
        enEx: 'This applies to the whole app and can change any time.',
        feeds: 'access',
      }),
    single('X6',
      'النهارده وقت هادي كفاية إنك تكمل؟ تقدر توقف وترجع في أي وقت.',
      'Is today quiet enough for you to carry on? You can pause and come back any time.',
      [
        { v: 'calm', label: 'أيوة، وقته دلوقتي' },
        { v: 'a_bit', label: 'هكمل شوية بس ممكن أقف' },
        { v: 'not_now', label: 'مش وقته، هرجع بعدين' },
      ],
      [
        { v: 'calm', label: 'Yes, now is fine' },
        { v: 'a_bit', label: 'I will do a little but may stop' },
        { v: 'not_now', label: 'Not now, I will come back' },
      ],
      { ar: 'وقت مريح؟', en: 'Is today calm enough?' },
      {
        arEx: 'مفيش وقت محدد ومفيش سؤال هيفوتك — كل حاجة محفوظة.',
        enEx: 'There is no time limit and no question is lost — everything is saved.',
        feeds: 'plan',
      }),
    single('X7',
      'دورك يا حبيبنا على نشاط سريع وحلو بعد شوية — جاهز؟ (السؤال ده للطفل نفسه، بص معاه على الصور)',
      'It is your turn soon for a short, fun activity — are you ready? (this one is asked of the child, looking at the pictures together)',
      [
        { v: 'yes', label: 'أيوة جاهز' },
        { v: 'not_now', label: 'لأ، مش دلوقتي' },
        { v: 'maybe', label: 'ممكن شوية' },
      ],
      [
        { v: 'yes', label: 'Yes, ready' },
        { v: 'not_now', label: 'No, not now' },
        { v: 'maybe', label: 'Maybe a little' },
      ],
      { ar: 'موافقة الطفل', en: 'The child\u2019s own yes' },
      { feeds: 'context' },
    // X7 is the assent screen. A "not_now" here stops the ladder, not the
    // plan: §0 principle 10 and the child-consent rule in the spec.
    ),
  ],
};

/* ══ assembly ═══════════════════════════════════════════════════════════════
 * Order is fixed: the questionnaire progress bar and the resumable draft both
 * index by this array, so a re-ordered bank would silently break every
 * IN_PROGRESS record (§7 item versioning). */

const BLOCKS = [BLOCK_C, BLOCK_L, BLOCK_S, BLOCK_M, BLOCK_P, BLOCK_H, BLOCK_G, BLOCK_X];

/** Blocks in questionnaire order. Every item carries its block id. */
export function getCaregiverBlocks() {
  return BLOCKS.map((b) => ({ ...b, items: b.items.map((it) => ({ ...it, block: b.id })) }));
}

/** Flat index: main items and every conditional probe, by id. */
export function getCaregiverItems() {
  const out = {};
  const walk = (item) => {
    out[item.id] = item;
    (item.followUps || []).forEach((f) => walk(f.item));
  };
  getCaregiverBlocks().forEach((b) => b.items.forEach(walk));
  return out;
}

/** Every triggerable follow-up, flattened with its condition. */
export function getCaregiverFollowUps() {
  const out = [];
  const walk = (item) => {
    (item.followUps || []).forEach((f) => { out.push(f); walk(f.item); });
  };
  getCaregiverBlocks().forEach((b) => b.items.forEach(walk));
  return out;
}

/** Support band for one answer. §3 works on bands, never on the raw value. */
export function bandFor(itemId, value) {
  const item = getCaregiverItems()[itemId];
  if (!item) return null;
  const opt = (item.ar.opts || []).find((o) => o.v === value);
  if (opt && opt.band) return opt.band;
  const map = CAREGIVER_BANDS[item.format] || CAREGIVER_BANDS.ability;
  return map[value] ?? null;
}
