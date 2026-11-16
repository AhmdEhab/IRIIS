/* ══════════════════════════════════════════════════════════════════════════
 * IRIS Caregiver bank — version cv2 (approved PARENT_ASSESSMENT_CV2_FINAL_DRAFT)
 *
 * Same shape as cv1 (blocks → items → conditional followUps) so the existing
 * questionnaire engine renders it unchanged. Only three formats are used:
 * single / multi / opentext — NO gates, NO triplets: opportunity became a
 * visible option inside every scale, and the support triplet collapsed into
 * one consolidated follow-up (VQ5f + VQ5h). 13 core questions + VQ13 (age ≥5)
 * + VPREF (an app preference, not child information) + rare conditional
 * probes. Arabic is Egyptian-conversational; English mirrors it. No diagnosis
 * words, no scores, no levels (§0 banned register of cv1 still applies).
 *
 * Completion time target is ~2–3 minutes — a TARGET, not a claimed figure
 * (refinement §5). The intro copy therefore promises question count only.
 * ═════════════════════════════════════════════════════════════════════════ */
export const CAREGIVER_V2_VERSION = 'cv2';

const abil = (id, arQ, enQ, tag, o = {}) => ({
  id,
  block: id[0],
  scored: true,
  format: 'single',
  ar: { q: arQ, opts: [
    { v: 'independent', label: 'بيعملها لوحده' },
    { v: 'little_help', label: 'بمساعدة بسيطة — كلام أو إشارة' },
    { v: 'hands_on', label: 'ومساعدتنا باليد' },
    { v: 'not_yet', label: 'لسه ماخدش فرصة يعملها' },
  ], ...(o.arEx ? { ex: o.arEx } : {}) },
  en: { q: enQ, opts: [
    { v: 'independent', label: 'Does it on his own' },
    { v: 'little_help', label: 'With a little help — talking or a sign' },
    { v: 'hands_on', label: 'With hands-on help' },
    { v: 'not_yet', label: 'Has not had the chance yet' },
  ], ...(o.enEx ? { ex: o.enEx } : {}) },
  tag,
  feeds: 'profile',
  ...(o.followUps ? { followUps: o.followUps } : {}),
  ...(o.ageMinMonths ? { ageMinMonths: o.ageMinMonths } : {}),
});

const q = (id, arQ, enQ, optsAr, optsEn, tag, o = {}) => ({
  id,
  block: id[0],
  scored: true,
  format: 'single',
  ar: { q: arQ, opts: optsAr, ...(o.arEx ? { ex: o.arEx } : {}) },
  en: { q: enQ, opts: optsEn, ...(o.enEx ? { ex: o.enEx } : {}) },
  tag,
  feeds: o.feeds || 'profile',
  ...(o.followUps ? { followUps: o.followUps } : {}),
  ...(o.ageMinMonths ? { ageMinMonths: o.ageMinMonths } : {}),
});

const m = (id, arQ, enQ, chips, tag, o = {}) => ({
  id,
  block: id[0],
  scored: true,
  format: 'multi',
  ar: { q: arQ, opts: chips.map((c) => ({ v: c.v, label: c.ar })), ...(o.arEx ? { ex: o.arEx } : {}) },
  en: { q: enQ, opts: chips.map((c) => ({ v: c.v, label: c.en })), ...(o.enEx ? { ex: o.enEx } : {}) },
  tag,
  feeds: o.feeds || 'context',
  ...(o.maxSelect ? { maxSelect: o.maxSelect } : {}),
  ...(o.allowCustom ? { allowCustom: true } : {}),
  ...(o.followUps ? { followUps: o.followUps } : {}),
});

const text = (id, arQ, arPh, enQ, enPh, tag, o = {}) => ({
  id,
  block: id[0],
  scored: false,
  format: 'opentext',
  ar: { q: arQ, placeholder: arPh, opts: [] },
  en: { q: enQ, placeholder: enPh, opts: [] },
  tag,
  feeds: o.feeds || 'context',
});

const fu = (whenItem, answers, item) => ({ when: { itemId: whenItem, answers }, item });
const fuAll = (allOf, item) => ({ when: { allOf }, item });

/* ── Block V-A · التواصل والكلام ─────────────────────────────────────────── */
const BLOCK_A = {
  id: 'V-A', order: 1, icon: '💬',
  titleAr: 'التواصل والكلام', titleEn: 'Communication and words',
  blurbAr: 'ازاي بيقول اللي جواه، وبيفهم اللي حواليه.', blurbEn: 'How he says what he wants, and what he takes in.',
  items: [
    q('VQ1',
      'ازاي بيقول اللي عايزه أو اللي جواه؟',
      'How does he say what he wants or feels?',
      [
        { v: 'words', label: 'بكلام وأصوات شبه الكلام' },
        { v: 'sentences', label: 'بجُمَل صغيرة زي «عايز مية»' },
        { v: 'gesture', label: 'بيشارة أو شد إيدك أو إيماءة' },
        { v: 'aac', label: 'بلوحة صور أو إشارات أو جهاز' },
        { v: 'hard_to_read', label: 'أنا بفهم طريقته، بس هو ما بيوضّحش كتير' },
        { v: 'not_yet', label: 'لسه ما وضّحش / ماخدش فرصة' },
      ],
      [
        { v: 'words', label: 'With words or word-like sounds' },
        { v: 'sentences', label: 'With little sentences like “water please”' },
        { v: 'gesture', label: 'Pointing, pulling your hand, gestures' },
        { v: 'aac', label: 'A picture board, signs, or a device' },
        { v: 'hard_to_read', label: 'I understand his way, but he rarely makes it clear' },
        { v: 'not_yet', label: 'Not clear yet / has not had the chance' },
      ],
      { ar: 'التعبير', en: 'Expressing' },
      {
        followUps: [
          fu('VQ1', ['words', 'sentences'], q('VQ1v',
            'كلامه وصل لإيه؟',
            'Where is his speech now?',
            [
              { v: 'sentences_plus', label: 'جُمل من اتنين تلات كلمات' },
              { v: 'many_words', label: 'كلمات كتير' },
              { v: 'few_words', label: 'كلمات قليلة' },
              { v: 'sounds', label: 'أصوات شبه الكلام بس' },
            ],
            [
              { v: 'sentences_plus', label: 'Two- or three-word sentences' },
              { v: 'many_words', label: 'Many single words' },
              { v: 'few_words', label: 'A few words' },
              { v: 'sounds', label: 'Word-like sounds only' },
            ],
            { ar: 'مستوى الكلام', en: 'Speech level' },
          )),
        ],
      }),
    q('VQ2',
      'وبيفهم الكلام اللي حواليه قد إيه؟ زي «تعالى» أو «ديني المية»',
      'And how much does he understand around him, like “come here” or “give me the water”?',
      [
        { v: 'independent', label: 'بيفهم كل حاجة تقريبًا' },
        { v: 'little_help', label: 'بيفهم أوي، وخصوصًا لو معاهَا إيماءة' },
        { v: 'hands_on', label: 'بيفهم حاجات معينة بس' },
        { v: 'routine_only', label: 'بيفهم الروتين بس — وقت الأكل وقت النوم' },
        { v: 'not_yet', label: 'لسه واضحش / ماخدش فرصة' },
      ],
      [
        { v: 'independent', label: 'Understands almost everything' },
        { v: 'little_help', label: 'Understands a lot, especially with a gesture' },
        { v: 'hands_on', label: 'Understands only certain things' },
        { v: 'routine_only', label: 'Only the routine — meal time, sleep time' },
        { v: 'not_yet', label: 'Not clear yet / has not had the chance' },
      ],
      { ar: 'الفهم', en: 'Understanding' },
      {
        followUps: [
          fuAll(
            [
              { itemId: 'VQ1', answers: ['hard_to_read', 'not_yet'] },
              { itemId: 'VQ2', answers: ['routine_only', 'not_yet'] },
            ],
            q('VQ6s',
              'سؤال سريع: عينه أو ودانه محتاجة ترتيب خاص؟',
              'Quick one: do his eyes or ears need special care?',
              [
                { v: 'nothing', label: 'لأ، تمام' },
                { v: 'vision', label: 'العين محتاجة ترتيب' },
                { v: 'hearing', label: 'الودن محتاجة ترتيب' },
                { v: 'both', label: 'الاتنين' },
                { v: 'unsure', label: 'مش متأكد/ة' },
              ],
              [
                { v: 'nothing', label: 'No, they are fine' },
                { v: 'vision', label: 'His eyes need attention' },
                { v: 'hearing', label: 'His ears need attention' },
                { v: 'both', label: 'Both' },
                { v: 'unsure', label: 'Not sure' },
              ],
              { ar: 'البصر والسمع', en: 'Vision and hearing' },
              { feeds: 'access' },
            ),
          ),
        ],
      }),
  ],
};

/* ── Block V-B · التعلم والاستقلالية والحركة ─────────────────────────────── */
const BLOCK_B = {
  id: 'V-B', order: 2, icon: '🧩',
  titleAr: 'التعلم، الاستقلالية، والحركة', titleEn: 'Learning and movement',
  blurbAr: 'بيتعلم إزاي، بيعتمد على نفسه قد إيه، وبيتحرك إزاي.', blurbEn: 'How he learns, how he manages his day, how he moves.',
  items: [
    q('VQ3',
      'في اللعب والأنشطة الجديدة — تقابل حاجات، فرز، نشاط من تلات خطوات — بيمشي معها إزاي؟',
      'In play and new activities — matching, sorting, a three-step game — how does he get on?',
      [
        { v: 'independent', label: 'بيكمّل لوحده' },
        { v: 'little_help', label: 'بلميح مننا وبس' },
        { v: 'hands_on', label: 'لحد ما نعمل معاه الخطوة خطوة' },
        { v: 'not_yet', label: 'لسه ماخدش فرصة' },
      ],
      [
        { v: 'independent', label: 'Finishes it alone' },
        { v: 'little_help', label: 'Just needs a hint' },
        { v: 'hands_on', label: 'Step by step with us' },
        { v: 'not_yet', label: 'Has not had the chance' },
      ],
      { ar: 'التعلم', en: 'Learning' },
      {
        followUps: [
          fu('VQ3', ['not_yet'], q('VQ3f',
            'مفيش مشكلة — تحبوا نبدأ مع لعبتين تقابل فيهم حاجات؟ هنسجّل الاقتراح ونبدأ بيهم.',
            'No problem — shall we start with two matching games? We will save the idea and begin with them.',
            [
              { v: 'suggest', label: 'أيوة، جرّبوا لعب تقابل' },
              { v: 'skip', label: 'حاضر، نتكلم بعدين' },
            ],
            [
              { v: 'suggest', label: 'Yes, try a matching game' },
              { v: 'skip', label: 'Okay, talk later' },
            ],
            { ar: 'فرصة للعب', en: 'A play chance' },
            { feeds: 'plan' },
          )),
        ],
      }),
    abil('VQ4',
      'لما يحتاج حاجة مش قدامه — بيوصلها أو يطلبها بطريقته، ولا مستني حد يلحقها؟',
      'When something he wants is out of reach — does he get it or ask for it his way, or wait for someone?',
      { ar: 'المبادرة', en: 'Initiative' },
      { arEx: 'زي علبة البسكوت على الرف — يعمل إيه؟', enEx: 'Like the biscuit tin on the shelf — what does he do?' },
    ),
    q('VQ5',
      'في اليوم — أكل، لبس، غسل إيد، دخول الحمام — بيقدر قد إيه لوحده؟',
      'Through the day — eating, dressing, washing, the toilet — how much can he do alone?',
      [
        { v: 'independent', label: 'بيعمل أغلبها لوحده' },
        { v: 'middle', label: 'بيعمل نصها' },
        { v: 'hands_on', label: 'محتاج مساعدة في أغلبها' },
        { v: 'not_yet', label: 'لسه بنعملها له / ماخدش فرصة' },
      ],
      [
        { v: 'independent', label: 'Most of it alone' },
        { v: 'middle', label: 'About half' },
        { v: 'hands_on', label: 'Needs help with most of it' },
        { v: 'not_yet', label: 'Still done for him / no chance yet' },
      ],
      { ar: 'الاستقلالية', en: 'Independence' },
      {
        followUps: [
          fu('VQ5', ['middle', 'hands_on', 'not_yet'], m('VQ5f',
            'محتاج مساعدة في إيه بالظبط؟',
            'Exactly which parts need help?',
            [
              { v: 'eat', ar: 'الأكل بالملقة والكوب', en: 'Eating with a spoon and cup' },
              { v: 'dress', ar: 'اللبس والخلع', en: 'Dressing and undressing' },
              { v: 'wash', ar: 'غسل الإيد والتجفيف', en: 'Washing hands and drying' },
              { v: 'toilet', ar: 'يقول أو يروح الحمام', en: 'Telling or going to the toilet' },
              { v: 'choose', ar: 'يختار بين اتنين', en: 'Choosing between two' },
            ],
            { ar: 'الحاجات اليومية', en: 'Daily parts' },
            {
              feeds: 'profile',
              followUps: [
                fu('VQ5f', ['eat', 'dress', 'wash', 'toilet', 'choose'], q('VQ5h',
                  'مين بيساعد غالبًا؟',
                  'Who usually helps?',
                  [
                    { v: 'himself', label: 'بيحاول لوحده الأول' },
                    { v: 'mama_baba', label: 'ماما أو بابا — تلميح أو تعديل بسيط' },
                    { v: 'other_person', label: 'حد تاني في البيت' },
                    { v: 'hand_help', label: 'مساعدة باليد لحد ما يخلص' },
                  ],
                  [
                    { v: 'himself', label: 'Tries alone first' },
                    { v: 'mama_baba', label: 'Mum or dad — a hint or small fix' },
                    { v: 'other_person', label: 'Someone else at home' },
                    { v: 'hand_help', label: 'Hands-on until finished' },
                  ],
                  { ar: 'مين بيساعد', en: 'The helper' },
                )),
              ],
            },
          )),
        ],
      }),
    q('VQ6',
      'بيتمشى ويتحرك كيف؟',
      'How does he walk and get around?',
      [
        { v: 'free', label: 'لوحده زي ما عايز' },
        { v: 'support', label: 'ماسك سور أو إيدك' },
        { v: 'device', label: 'كرسي متحرك أو وسيلة تانية' },
        { v: 'not_yet', label: 'لسه ماخدش فرصة يمشي' },
      ],
      [
        { v: 'free', label: 'On his own, as he likes' },
        { v: 'support', label: 'Holding the rail or your hand' },
        { v: 'device', label: 'A wheelchair or another way' },
        { v: 'not_yet', label: 'No walking chance yet' },
      ],
      { ar: 'الحركة', en: 'Mobility' },
      {
        followUps: [
          fu('VQ6', ['support', 'device', 'not_yet'], q('VQ6m',
            'إيده؟ بيشاور، يمسك ملقة أو قلم، يضغط على شاشة؟',
            'His hands? Pointing, holding a spoon or pen, pressing a screen?',
            [
              { v: 'hands_ok', label: 'كل ده سهل معاه' },
              { v: 'fine_hard', label: 'الشغل الدقيق أصعب' },
              { v: 'points_only', label: 'بيشاور وبس' },
              { v: 'own_way', label: 'بيستخدم طريقته أو جهاز' },
            ],
            [
              { v: 'hands_ok', label: 'All easy for him' },
              { v: 'fine_hard', label: 'Fine work is harder' },
              { v: 'points_only', label: 'Points only' },
              { v: 'own_way', label: 'His own way or a device' },
            ],
            { ar: 'الإيد والتحكم', en: 'Hands and control' },
          )),
        ],
      }),
    q('VQ13',
      'خد فرصة يتمرّن على حروف أو أرقام أو يقلّم قلم، في البيت أو في المدرسة؟',
      'Has he had a chance to practice letters, numbers, or a pencil, at home or at school?',
      [
        { v: 'practiced', label: 'أيوة، في البيت والمدرسة' },
        { v: 'home_only', label: 'في البيت بس' },
        { v: 'not_yet', label: 'لسه ماخدش فرصة' },
      ],
      [
        { v: 'practiced', label: 'Yes, at home and school' },
        { v: 'home_only', label: 'At home only' },
        { v: 'not_yet', label: 'No chance yet' },
      ],
      { ar: 'الحروف والأرقام', en: 'Letters and numbers' },
      { feeds: 'plan', ageMinMonths: 60 },
    ),
  ],
};

/* ── Block V-C · الناس والمشاعر ──────────────────────────────────────────── */
const BLOCK_C = {
  id: 'V-C', order: 3, icon: '❤️',
  titleAr: 'ناسه ومشاعره', titleEn: 'His people and his feelings',
  blurbAr: 'العيال حواليه، واللي بيضيق يومه، واللي بيرجّعه.', blurbEn: 'The kids around him, what makes the day hard, what brings him back.',
  items: [
    q('VQ7',
      'مع العيال والناس بيكون عامل إزاي؟',
      'Around other children and people, what is he like?',
      [
        { v: 'with_kids', label: 'بيلعب معاهم بطريقته' },
        { v: 'near_kids', label: 'بيقعد جنبهم ويلتحق لو شجعناه' },
        { v: 'alone_pref', label: 'بيفضل لوحده أحلى' },
        { v: 'avoids', label: 'بيتضيق أو يبعد لما العيال يقربوا' },
      ],
      [
        { v: 'with_kids', label: 'Plays with them, his own way' },
        { v: 'near_kids', label: 'Sits near them, joins if encouraged' },
        { v: 'alone_pref', label: 'Prefers being alone' },
        { v: 'avoids', label: 'Upset or walks off when kids come close' },
      ],
      { ar: 'الناس', en: 'People' },
    ),
    m('VQ8',
      'إيه اللي بيصعّب يومه؟ (علّمي كل اللي حصل في آخر شهر)',
      'What makes his day hard? (tick everything from the last month)',
      [
        { v: 'fuss', ar: 'عناد أو ضيق كبير', en: 'Refusing or big upset' },
        { v: 'fear_sensory', ar: 'خوف أو حساسية من أصوات وخامات', en: 'Fear or sensitivity to sounds and textures' },
        { v: 'self_care', ar: 'مش لاقي يطلّع اللي جواه فيؤذي نفسه', en: 'Struggles to get it out and hurts himself' },
        { v: 'sleep', ar: 'النوم مش ظابط', en: 'Sleep is unsettled' },
        { v: 'health', ar: 'صحة أو أدوية بتأثر على يومه', en: 'Health or medicines affecting his day' },
        { v: 'none', ar: 'مفيش حاجة من دي', en: 'None of these' },
      ],
      { ar: 'الصعوبات', en: 'Hard parts' },
      {
        feeds: 'profile',
        arEx: 'الأسئلة دي عشان نرتّب له اليوم على قد مايقدر، مش عشان نحاكم حاجة.',
        enEx: 'These help us shape his day, never to judge anything.',
      },
    ),
    m('VQ9',
      'وإيه اللي بيرجّعه لوضعه الطبيعي؟',
      'And what brings him back to himself?',
      [
        { v: 'hug', ar: 'حضن أو صوتنا بهدوء', en: 'A hug or our calm voice' },
        { v: 'quiet_space', ar: 'يخلي نفسه لوحده شوية', en: 'Being left alone a bit' },
        { v: 'music', ar: 'أنشودة أو حاجة بيحبها', en: 'A song or something he loves' },
        { v: 'object', ar: 'حاجة في إيده', en: 'Something to hold' },
        { v: 'food', ar: 'أكل أو لبس مفضل', en: 'Food or a favorite cloth' },
        { v: 'unknown', ar: 'لسه ماوصلناش لحاجة بتهدّي', en: 'Nothing has worked yet' },
      ],
      { ar: 'الرجوع', en: 'Coming back' },
      {
        feeds: 'profile',
        followUps: [
          fu('VQ9', ['unknown'], q('VQ9f',
            'غالبًا بيضيق قبل إيه؟',
            'What usually comes right before the upset?',
            [
              { v: 'before_noise', label: 'ضجة أو زحمة' },
              { v: 'before_change', label: 'تغيير في الروتين' },
              { v: 'before_demand', label: 'طلب تقيل عليه' },
              { v: 'before_tired', label: 'تعب أو قلة نوم' },
              { v: 'before_unexplained', label: 'مفيش سبب واضح' },
            ],
            [
              { v: 'before_noise', label: 'Noise or crowds' },
              { v: 'before_change', label: 'A routine change' },
              { v: 'before_demand', label: 'A heavy demand' },
              { v: 'before_tired', label: 'Tiredness' },
              { v: 'before_unexplained', label: 'No clear reason' },
            ],
            { ar: 'قبل الضيق', en: 'Before the upset' },
            { feeds: 'plan' },
          )),
        ],
      }),
  ],
};

/* ── Block V-D · عالمه واهتماماته ────────────────────────────────────────── */
const BLOCK_D = {
  id: 'V-D', order: 4, icon: '🌟',
  titleAr: 'عالمه واللي بيحبه', titleEn: 'His world and interests',
  blurbAr: 'الحاجات اللي بتنوّره واللي هنبني عليها الخطة.', blurbEn: 'What lights him up — the raw material of his plan.',
  items: [
    m('VQ10',
      'إيه أكتر الحاجات اللي بتشدّه؟ (اختاروا لحد ٥، وتقدّروا تضيفوا)',
      'What grabs him most? (pick up to 5, add your own)',
      [
        { v: 'animals', ar: 'حيوانات وطيور', en: 'Animals and birds' },
        { v: 'vehicles', ar: 'عربيات وأوتوبيس وطيارات', en: 'Cars, buses, planes' },
        { v: 'water', ar: 'مية ولعب بيها', en: 'Water and playing with it' },
        { v: 'music', ar: 'مزيكا وأناشيد', en: 'Music and songs' },
        { v: 'building', ar: 'مكعبات وتجميع', en: 'Blocks and building' },
        { v: 'characters', ar: 'شخصية بيحبها', en: 'A favorite character' },
        { v: 'outdoors', ar: 'الشارع والحديقة', en: 'Outside, the garden' },
        { v: 'balls', ar: 'كرة وركض', en: 'Balls and running' },
        { v: 'puzzles', ar: 'بازل وتجربة', en: 'Puzzles and trying things' },
      ],
      { ar: 'الاهتمامات', en: 'Interests' },
      { feeds: 'interests', maxSelect: 5, allowCustom: true },
    ),
    text('VQ10b',
      'حاجة واحدة بيعملها حلو أوي أو بتفخري بيه — احكيهالنا.',
      'مثلاً: بيرتّب الأحجايه لوحده، بيفتح الباب…',
      'One thing he does really well or makes you proud — tell us.',
      'For example: puts his toys away alone, opens the door…',
      { ar: 'نقطة قوة', en: 'A strength' },
      { feeds: 'plan' },
    ),
    q('VQ11',
      'أحسن وقت بيبان عليه تركيزه ورضاه؟',
      'When does he shine — best focus and mood?',
      [
        { v: 'morning', label: 'الصباح بدري' },
        { v: 'after_school', label: 'بعد المدرسة أو بعد القيلولة' },
        { v: 'evening', label: 'بالليل قبل النوم' },
        { v: 'varies', label: 'بيختلف يوم عن يوم' },
      ],
      [
        { v: 'morning', label: 'Early morning' },
        { v: 'after_school', label: 'After school or after a nap' },
        { v: 'evening', label: 'Evening before sleep' },
        { v: 'varies', label: 'Different every day' },
      ],
      { ar: 'الوقت', en: 'Timing' },
      { feeds: 'plan' },
    ),
    q('VQ12',
      'يومه بيعدّي فين أغلب الوقت؟',
      'Where does most of his day happen?',
      [
        { v: 'home', label: 'في البيت بس' },
        { v: 'kg', label: 'حضانة أو روضة' },
        { v: 'school', label: 'مدرسة — يوم كامل' },
        { v: 'school_therapy', label: 'مدرسة + جلسات أو مركز' },
      ],
      [
        { v: 'home', label: 'Home only' },
        { v: 'kg', label: 'Nursery or kindergarten' },
        { v: 'school', label: 'School — full days' },
        { v: 'school_therapy', label: 'School plus sessions or a center' },
      ],
      { ar: 'المكان', en: 'Setting' },
      { feeds: 'plan' },
    ),
    q('VPREF',
      'سؤال أخير ملوش علاقة بيه: IRIS يعرض عليك إزاي؟',
      'One last thing about the app, not about him: how should IRIS show things?',
      [
        { v: 'text', label: 'كلام مكتوب بس' },
        { v: 'audio', label: 'صوت مسموع بس' },
        { v: 'both', label: 'الاتنين مع بعض' },
      ],
      [
        { v: 'text', label: 'Written words only' },
        { v: 'audio', label: 'Spoken audio only' },
        { v: 'both', label: 'Both together' },
      ],
      { ar: 'تفضيل العرض', en: 'Display preference' },
      { feeds: 'prefs' },
    ),
  ],
};

const BLOCKS = [BLOCK_A, BLOCK_B, BLOCK_C, BLOCK_D];

export function getCaregiverBlocksV2() {
  return BLOCKS.map((b) => ({ ...b, items: b.items.map((it) => ({ ...it, block: b.id })) }));
}

/** The ids that trigger the calm care card (refinement §3). */
export const CARE_CARD_CODES = ['self_care'];
