/**
 * Home Tips — practical, everyday things a parent can do between sessions.
 *
 * WHAT THIS IS, AND IS NOT
 * These are ordinary parenting and everyday-learning activities, in plain language.
 * They are NOT therapy, NOT a treatment plan, and NOT tailored to any
 * diagnosis. Nothing here claims to improve a measured outcome, because the
 * project's own evidence review is explicit that no such evidence exists in
 * its corpus for this population:
 *   - 29_RESEARCH_GAPS_REGISTER.md §H: no error-correction method, prompting
 *     hierarchy, or reinforcement schedule exists anywhere in the corpus.
 *   - §F: not one session length, frequency, or repetition count is reported
 *     for any intervention delivered to a child with DS or WS, at any age.
 *   - 31_CLAIMS_WE_MUST_NOT_MAKE.md §I21: home-activity prompts and
 *     parent-coaching techniques may NEVER be cited as evidence that they
 *     improve learning — the source reports zero learning-outcome data.
 * So every duration below is labelled as a suggestion, not a prescription, and
 * the UI states plainly that these are practical ideas rather than therapy.
 *
 * The one thing that IS well supported and is reflected throughout: individual
 * responsiveness over diagnosis. Every tip tells the parent to follow the
 * child in front of them.
 */

export interface TipStep {
  ar: string;
  en: string;
}

export interface Tip {
  id: string;
  icon: string;
  titleAr: string;
  titleEn: string;
  summaryAr: string;
  summaryEn: string;
  /** A suggestion, never a prescription — see the note above. */
  minutesAr: string;
  minutesEn: string;
  steps: TipStep[];
}

export interface TipCategory {
  id: string;
  icon: string;
  nameAr: string;
  nameEn: string;
  color: string;
  tips: Tip[];
}

export const HOME_TIP_CATEGORIES: TipCategory[] = [
  {
    id: 'language',
    icon: '💬',
    nameAr: 'اللغة والكلام',
    nameEn: 'Language & Talking',
    color: ' ',
    tips: [
      {
        id: 'narrate-day',
        icon: '🗣️',
        titleAr: 'احكي اللي بتعمليه',
        titleEn: 'Narrate what you are doing',
        summaryAr: 'كلمات كتير من غير درس — وإنتي بتعملي أي حاجة عادية.',
        summaryEn: 'Lots of language exposure without it feeling like a lesson.',
        minutesAr: 'أي وقت في اليوم',
        minutesEn: 'Any time of day',
        steps: [
          { ar: 'وإنتي بتعملي حاجة عادية، قولي بصوت عالي إنتي بتعملي إيه: «بغسل التفاحة».', en: 'While doing an everyday task, say what you are doing out loud: "I am washing the apple."' },
          { ar: 'استخدمي جمل قصيرة وكلمات بسيطة.', en: 'Use short sentences and simple words.' },
          { ar: 'استني شوية بعد كل جملة، وسيبي مساحة يرد فيها بأي طريقة.', en: 'Pause after each sentence and leave space for any kind of response.' },
          { ar: 'أي رد يتحسب: كلمة، صوت، إشارة، أو نظرة.', en: 'Any response counts: a word, a sound, a gesture, or a look.' },
        ],
      },
      {
        id: 'choices',
        icon: '✌️',
        titleAr: 'اسأليه يختار من اتنين',
        titleEn: 'Offer a choice of two',
        summaryAr: 'طريقة سهلة يعبّر بيها من غير ما يحتاج جملة كاملة.',
        summaryEn: 'An easy way to express a preference without needing a full sentence.',
        minutesAr: 'لحظات قصيرة',
        minutesEn: 'Brief moments',
        steps: [
          { ar: 'امسكي حاجتين واسأليه: «تفاحة ولا موزة؟»', en: 'Hold up two things and ask: "Apple or banana?"' },
          { ar: 'سيبي الاتنين قدامه وهو بيختار — ما تشيليهمش.', en: 'Keep both visible while he chooses — do not take them away.' },
          { ar: 'اقبلي الإشارة أو النظرة زي الكلمة بالظبط.', en: 'Accept pointing or looking exactly as you would a word.' },
          { ar: 'كرري الاختيار بصوتك: «آه، تفاحة!»', en: 'Say the choice back: "Yes, apple!"' },
        ],
      },
    ],
  },
  {
    id: 'memory',
    icon: '🧠',
    nameAr: 'الذاكرة',
    nameEn: 'Memory',
    color: ' ',
    tips: [
      {
        id: 'keep-it-visible',
        icon: '👀',
        titleAr: 'سيبي الحاجة قدامه',
        titleEn: 'Keep the thing in sight',
        summaryAr: 'أسهل بكتير لما ما يضطرش يفتكر ويعمل في نفس الوقت.',
        summaryEn: 'Much easier when he does not have to remember and do at the same time.',
        minutesAr: 'في أي نشاط',
        minutesEn: 'In any activity',
        steps: [
          { ar: 'لو بتوريه شكل أو صورة، سيبيها قدامه وهو بينفّذ.', en: 'If you show a shape or picture, leave it visible while he works.' },
          { ar: 'ما تشيليش الصورة وتطلبي منه يفتكرها.', en: 'Do not take it away and ask him to recall it.' },
          { ar: 'لو الحاجة كبيرة، قسّميها لخطوة واحدة في المرة.', en: 'If a task is big, break it into one step at a time.' },
        ],
      },
      {
        id: 'same-routine',
        icon: '🔁',
        titleAr: 'كرّري نفس الترتيب',
        titleEn: 'Repeat the same order',
        summaryAr: 'التكرار المريح بيخلي الخطوة اللي جاية متوقعة.',
        summaryEn: 'Comfortable repetition makes the next step predictable.',
        minutesAr: 'كل يوم',
        minutesEn: 'Daily',
        steps: [
          { ar: 'اختاري روتين صغير (تجهيز الشنطة مثلاً) وخليه بنفس الترتيب كل مرة.', en: 'Pick a small routine (packing a bag) and keep the same order every time.' },
          { ar: 'سمّي كل خطوة وإنتي بتعمليها.', en: 'Name each step as you do it.' },
          { ar: 'بعد كام مرة، استني قبل الخطوة الأخيرة وشوفي هيكملها.', en: 'After a few times, pause before the last step and see if he completes it.' },
        ],
      },
    ],
  },
  {
    id: 'attention',
    icon: '🎯',
    nameAr: 'الانتباه',
    nameEn: 'Attention',
    color: ' ',
    tips: [
      {
        id: 'one-thing',
        icon: '🧹',
        titleAr: 'حاجة واحدة على الترابيزة',
        titleEn: 'One thing on the table',
        summaryAr: 'أقل مشتتات حوالين النشاط = تركيز أسهل.',
        summaryEn: 'Fewer distractions around the activity makes focusing easier.',
        minutesAr: 'قبل أي نشاط',
        minutesEn: 'Before any activity',
        steps: [
          { ar: 'شيلي أي حاجة تانية من على الترابيزة قبل ما تبدأوا.', en: 'Clear everything else off the table before you start.' },
          { ar: 'قلّلي الصوت والحركة في الأوضة لو تقدري.', en: 'Reduce noise and movement in the room if you can.' },
          { ar: 'ابدأي بحاجة واحدة بس قدامه.', en: 'Start with only one thing in front of him.' },
        ],
      },
      {
        id: 'warn-changes',
        icon: '⏳',
        titleAr: 'نبّهيه قبل ما تغيّري',
        titleEn: 'Give warning before a change',
        summaryAr: 'الانتقال المتوقع أسهل بكتير من المفاجئ.',
        summaryEn: 'A predicted transition is much easier than a sudden one.',
        minutesAr: 'عند كل انتقال',
        minutesEn: 'At every transition',
        steps: [
          { ar: 'قبل ما تخلصوا نشاط، قوليله: «كمان شوية هنخلص».', en: 'Before finishing, say: "We will finish in a little while."' },
          { ar: 'قوليله إيه اللي جاي: «بعدها هناكل».', en: 'Say what comes next: "After this, we eat."' },
          { ar: 'استخدمي نفس الكلمات كل مرة.', en: 'Use the same words every time.' },
        ],
      },
    ],
  },
  {
    id: 'routine',
    icon: '🌤️',
    nameAr: 'روتين التعلّم',
    nameEn: 'Learning Routine',
    color: ' ',
    tips: [
      {
        id: 'short-and-often',
        icon: '⏱️',
        titleAr: 'شوية قصيرة ومتكررة',
        titleEn: 'Short and often',
        summaryAr: 'مرات قصيرة كل يوم أريح من مرة طويلة في الأسبوع.',
        summaryEn: 'Short daily moments sit more comfortably than one long weekly session.',
        minutesAr: 'اقتراح: دقايق قليلة',
        minutesEn: 'Suggestion: a few minutes',
        steps: [
          { ar: 'اختاري وقت ثابت في اليوم يكون هو فيه مرتاح.', en: 'Pick a consistent time of day when he is comfortable.' },
          { ar: 'اقفلي وهو لسه مبسوط، مش لما يزهق.', en: 'Stop while he is still enjoying it, not after he tires.' },
          { ar: 'المدة دي اقتراح — الطفل نفسه هو اللي يحدد.', en: 'The length is only a suggestion — let the child set it.' },
        ],
      },
      {
        id: 'end-well',
        icon: '🌟',
        titleAr: 'اقفلي على حاجة حلوة',
        titleEn: 'Finish on a good note',
        summaryAr: 'آخر لحظة هي اللي بتفضل في باله.',
        summaryEn: 'The last moment is the one that stays with him.',
        minutesAr: 'آخر دقيقة',
        minutesEn: 'The final minute',
        steps: [
          { ar: 'خلّي آخر حاجة تعملوها حاجة هو بيعرفها كويس.', en: 'Make the last thing something he already does well.' },
          { ar: 'قوليله بالظبط عمل إيه كويس: «حطيت كل الشكل في مكانه».', en: 'Say exactly what he did well: "You put every shape in its place."' },
          { ar: 'لو الجلسة كانت صعبة، اقفلي بدري — ده مش فشل.', en: 'If the session was hard, finish early — that is not a failure.' },
        ],
      },
    ],
  },
  {
    id: 'story',
    icon: '📚',
    nameAr: 'وقت الحكاية',
    nameEn: 'Story Time',
    color: ' ',
    tips: [
      {
        id: 'look-dont-read',
        icon: '🖼️',
        titleAr: 'اتفرجوا قبل ما تقروا',
        titleEn: 'Look before you read',
        summaryAr: 'الصورة تكفي لحكاية كاملة.',
        summaryEn: 'The picture alone can carry the whole story.',
        minutesAr: 'وقت الحكاية',
        minutesEn: 'At story time',
        steps: [
          { ar: 'قبل الكلام، اتفرجوا على الصورة مع بعض.', en: 'Before any words, look at the picture together.' },
          { ar: 'اسأليه: «شايف إيه؟» واقبلي أي رد.', en: 'Ask: "What do you see?" and accept any answer.' },
          { ar: 'بعدين اقري الجملة القصيرة.', en: 'Then read the short sentence.' },
        ],
      },
      {
        id: 'same-story',
        icon: '🔖',
        titleAr: 'نفس الحكاية تاني وتالت',
        titleEn: 'The same story again',
        summaryAr: 'التكرار مش ملل — هو بيبني ألفة.',
        summaryEn: 'Repetition is not boredom — it builds familiarity.',
        minutesAr: 'كل ما يطلبها',
        minutesEn: 'Whenever he asks',
        steps: [
          { ar: 'لو طلب نفس الحكاية تاني، اقريها.', en: 'If he asks for the same story again, read it.' },
          { ar: 'استني قبل الجملة اللي بيعرفها وسيبيه يكملها.', en: 'Pause before a line he knows and let him finish it.' },
          { ar: 'كل مرة ممكن ياخد باله من حاجة جديدة في الصورة.', en: 'Each time he may notice something new in the picture.' },
        ],
      },
    ],
  },
  {
    id: 'play',
    icon: '🧩',
    nameAr: 'التعلّم باللعب',
    nameEn: 'Play-Based Learning',
    color: ' ',
    tips: [
      {
        id: 'follow-lead',
        icon: '🫱',
        titleAr: 'امشي وراه هو',
        titleEn: 'Follow his lead',
        summaryAr: 'ابدأي من اللي هو مهتم بيه دلوقتي.',
        summaryEn: 'Start from whatever he is interested in right now.',
        minutesAr: 'وقت اللعب',
        minutesEn: 'During play',
        steps: [
          { ar: 'شوفي هو ماسك إيه أو بيبص على إيه.', en: 'Notice what he is holding or looking at.' },
          { ar: 'العبي بنفس الحاجة جنبه.', en: 'Play with the same thing beside him.' },
          { ar: 'زوّدي كلمة واحدة على اللي بيعمله.', en: 'Add one word to what he is already doing.' },
        ],
      },
      {
        id: 'everyday-objects',
        icon: '🥄',
        titleAr: 'حاجات البيت العادية',
        titleEn: 'Ordinary household things',
        summaryAr: 'مش محتاجة ألعاب مخصوصة.',
        summaryEn: 'You do not need special toys.',
        minutesAr: 'أي وقت',
        minutesEn: 'Any time',
        steps: [
          { ar: 'استخدمي معالق وأكواب وعلب لفرز الألوان والأحجام.', en: 'Use spoons, cups, and boxes for sorting by colour and size.' },
          { ar: 'خلّي اللعبة قصيرة وسهلة.', en: 'Keep the game short and easy.' },
          { ar: 'خلّيه هو اللي يمسك ويحرّك بنفسه.', en: 'Let him hold and move things himself.' },
        ],
      },
    ],
  },
];
