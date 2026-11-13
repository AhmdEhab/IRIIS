/**
 * DEMO parent community.
 *
 * ══════════════════════════════════════════════════════════════════════════
 *  THE HARD RULE: NOTHING HERE MAY READ AS A REAL PARENT SAYING A REAL THING.
 * ══════════════════════════════════════════════════════════════════════════
 *
 * The old CommunitySessionsScreen carried three fabricated testimonials —
 * "My son just learned to tie his shoes!", 45 likes — which is an outcome
 * claim attributed to an invented family. That is worse than a fake product
 * review, because a parent of a disabled child reads it as evidence that the
 * app works. This file shows the SHAPE of a community without inventing one.
 *
 * FIVE RULES, ENFORCED BY qa-demo-data.mjs
 *
 *  1. AUTHORS ARE LABELS, NOT PEOPLE. "Demo Parent 1", never "Mona from Giza".
 *  2. NO OUTCOME CLAIMS. No post may say a child gained, improved, learned, or
 *     was helped by IRIS. Posts are questions and shared situations only.
 *  3. NO MEDICAL CONTENT in any post, answer, or comment.
 *  4. THE "SPECIALIST-STYLE ANSWER" IS NOT ADVICE FROM A SPECIALIST. It is
 *     illustrative general text showing the shape such an answer would take,
 *     attributed to a demo label, and marked as illustrative in the UI.
 *  5. REACTION COUNTS ARE OBVIOUSLY SYNTHETIC AND SMALL. A three-figure like
 *     count is social proof; a single-digit placeholder is a layout example.
 *
 * Every record carries `is_demo: true`. Real posts, when they exist, must come
 * from the authenticated /api/posts endpoint — see directory.ts.
 */

export type PostKind =
  /** A parent asking something. */
  | 'QUESTION'
  /** A parent describing a situation, without claiming an outcome. */
  | 'SHARE'
  /** A short practical tip, general and non-medical. */
  | 'TIP';

export interface CommunityCategory {
  id: string;
  icon: string;
  name_ar: string;
  name_en: string;
  blurb_ar: string;
  blurb_en: string;
  tone: 'blue' | 'purple' | 'green' | 'yellow' | 'coral';
}

export interface CommunityComment {
  id: string;
  author_ar: string;
  author_en: string;
  /** True when the comment illustrates how a specialist might reply. */
  from_specialist: boolean;
  body_ar: string;
  body_en: string;
  is_demo: boolean;
}

export interface CommunityPost {
  id: string;
  category_id: string;
  kind: PostKind;
  author_ar: string;
  author_en: string;
  title_ar: string;
  title_en: string;
  body_ar: string;
  body_en: string;
  /** Deliberately single-digit. See rule 5. */
  reactions: number;
  comments: CommunityComment[];
  is_demo: boolean;
}

export const COMMUNITY_CATEGORIES: CommunityCategory[] = [
  {
    id: 'CAT-DAILY',
    icon: '🍽️',
    name_ar: 'روتين اليوم',
    name_en: 'Everyday routines',
    blurb_ar: 'الأكل، اللبس، النوم، والخروج من البيت.',
    blurb_en: 'Meals, dressing, sleep, and getting out of the house.',
    tone: 'yellow',
  },
  {
    id: 'CAT-SCHOOL',
    icon: '🎒',
    name_ar: 'المدرسة',
    name_en: 'School',
    blurb_ar: 'التواصل مع المدرسة والدعم جوّه الفصل.',
    blurb_en: 'Working with the school and support in the classroom.',
    tone: 'blue',
  },
  {
    id: 'CAT-TALK',
    icon: '🗣️',
    name_ar: 'التواصل والكلام',
    name_en: 'Talking & communication',
    blurb_ar: 'طرق التواصل المختلفة، مش الكلام بس.',
    blurb_en: 'All the ways of communicating, not only speech.',
    tone: 'green',
  },
  {
    id: 'CAT-PLAY',
    icon: '🧩',
    name_ar: 'اللعب والأنشطة',
    name_en: 'Play & activities',
    blurb_ar: 'أفكار ألعاب بسيطة من غير أدوات.',
    blurb_en: 'Simple play ideas that need nothing special.',
    tone: 'purple',
  },
  {
    id: 'CAT-FAMILY',
    icon: '💬',
    name_ar: 'الأهل وبعضهم',
    name_en: 'Parents together',
    blurb_ar: 'مساحة نتكلم فيها عن اللي بنمرّ بيه.',
    blurb_en: 'A space to talk about what we are going through.',
    tone: 'coral',
  },
];

const post = (o: Omit<CommunityPost, 'is_demo'>): CommunityPost => ({ is_demo: true, ...o });
const comment = (o: Omit<CommunityComment, 'is_demo'>): CommunityComment => ({ is_demo: true, ...o });

export const MOCK_POSTS: CommunityPost[] = [
  post({
    id: 'DEMO-POST-1',
    category_id: 'CAT-TALK',
    kind: 'QUESTION',
    author_ar: 'ولي أمر تجريبي ١',
    author_en: 'Demo Parent 1',
    title_ar: 'بيفهمني بس مش بيرد بكلام — أعمل إيه؟',
    title_en: 'He understands me but does not answer in words — what do I do?',
    body_ar:
      'ابني بينفّذ اللي بقوله عليه، لكن لما أسأله سؤال بيبص وميردّش. حاسة إني مش عارفة أوصله.',
    body_en:
      'My son does what I ask, but when I ask him a question he looks at me and does not answer. I feel like I am not reaching him.',
    reactions: 4,
    comments: [
      comment({
        id: 'DEMO-C-1',
        author_ar: 'ولي أمر تجريبي ٢',
        author_en: 'Demo Parent 2',
        from_specialist: false,
        body_ar: 'عندي نفس الموقف بالظبط. بقيت أسأل أسئلة يختار منها بدل الأسئلة المفتوحة.',
        body_en: 'Exactly the same here. I started asking questions with two choices instead of open ones.',
      }),
      comment({
        id: 'DEMO-C-2',
        author_ar: 'رد توضيحي بأسلوب مختص',
        author_en: 'Illustrative specialist-style reply',
        from_specialist: true,
        body_ar:
          'الإشارة أو اختيار الصورة دليل فهم زيها زي الكلام. إن الطفل ينفّذ الطلب معناه إنه فهم، حتى لو مردّش بصوت.',
        body_en:
          'Pointing or choosing a picture is evidence of understanding, just as speech is. Acting on a request shows understanding even when no words come back.',
      }),
    ],
  }),
  post({
    id: 'DEMO-POST-2',
    category_id: 'CAT-DAILY',
    kind: 'QUESTION',
    author_ar: 'ولي أمر تجريبي ٣',
    author_en: 'Demo Parent 3',
    title_ar: 'وقت الأكل بيبقى معركة كل يوم',
    title_en: 'Mealtimes turn into a battle every day',
    body_ar: 'بنقعد على السفرة ويقوم بعد دقيقتين. مش عارفة أخليه يقعد من غير ما الجو يتوتر.',
    body_en: 'We sit at the table and he gets up after two minutes. I cannot get him to stay without it becoming tense.',
    reactions: 6,
    comments: [
      comment({
        id: 'DEMO-C-3',
        author_ar: 'ولي أمر تجريبي ٤',
        author_en: 'Demo Parent 4',
        from_specialist: false,
        body_ar: 'اللي ظبط معانا إننا قصّرنا وقت السفرة نفسه بدل ما نحاول نطوّله.',
        body_en: 'What worked for us was making the meal shorter rather than trying to stretch it.',
      }),
    ],
  }),
  post({
    id: 'DEMO-POST-3',
    category_id: 'CAT-PLAY',
    kind: 'TIP',
    author_ar: 'ولي أمر تجريبي ٥',
    author_en: 'Demo Parent 5',
    title_ar: 'لعبة بجوارب من غير أي تحضير',
    title_en: 'A sock game that needs no preparation',
    body_ar:
      'وإحنا بنطوي الغسيل، بحط أربع جوارب — جوزين — وأقوله "لمّي اللي زي بعض". بيبقى وقت لطيف ومش محتاج حاجة.',
    body_en:
      'While folding laundry I put out four socks — two pairs — and say "put the same ones together". It is a nice moment and needs nothing.',
    reactions: 8,
    comments: [],
  }),
  post({
    id: 'DEMO-POST-4',
    category_id: 'CAT-SCHOOL',
    kind: 'SHARE',
    author_ar: 'ولي أمر تجريبي ٦',
    author_en: 'Demo Parent 6',
    title_ar: 'إزاي أشرح احتياجات ابني للمدرّسة؟',
    title_en: 'How do I explain my son\'s needs to his teacher?',
    body_ar:
      'عندي مقابلة مع المدرّسة الأسبوع الجاي. مش عارفة أبدأ منين ولا إيه أهم حاجة أقولها.',
    body_en:
      'I have a meeting with his teacher next week. I do not know where to start or what matters most to say.',
    reactions: 5,
    comments: [
      comment({
        id: 'DEMO-C-4',
        author_ar: 'رد توضيحي بأسلوب مختص',
        author_en: 'Illustrative specialist-style reply',
        from_specialist: true,
        body_ar:
          'حاجة عملية: اكتبي تلات حاجات بس — حاجة بتساعده، حاجة بتصعّب عليه، وحاجة بتهدّيه. ورقة واحدة أنفع من تقرير طويل.',
        body_en:
          'One practical thing: write down just three items — something that helps him, something that makes things harder, and something that settles him. One page lands better than a long report.',
      }),
    ],
  }),
  post({
    id: 'DEMO-POST-5',
    category_id: 'CAT-FAMILY',
    kind: 'SHARE',
    author_ar: 'ولي أمر تجريبي ٧',
    author_en: 'Demo Parent 7',
    title_ar: 'في أيام بحس فيها إني تعبانة، وده طبيعي',
    title_en: 'Some days I am worn out, and that is normal',
    body_ar: 'مش كل يوم بيبقى فيه تقدّم، وأنا اتعلمت إن ده مش معناه إني بعمل حاجة غلط.',
    body_en: 'Not every day has progress in it, and I have learned that does not mean I am doing something wrong.',
    reactions: 9,
    comments: [],
  }),
];

/** Short, general, non-medical tips shown alongside the feed. */
export const COMMUNITY_TIPS: { id: string; ar: string; en: string; is_demo: boolean }[] = [
  { id: 'DEMO-TIP-1', ar: 'النشاط القصير اللي بيخلص أنفع من الطويل اللي بيتساب في نصه.', en: 'A short activity that finishes helps more than a long one abandoned halfway.', is_demo: true },
  { id: 'DEMO-TIP-2', ar: 'قفل التلفزيون خالص أنفع من إنك توطّي الصوت.', en: 'Turning the television off completely helps more than turning it down.', is_demo: true },
  { id: 'DEMO-TIP-3', ar: 'الإشارة والاختيار دليل فهم، مش بديل ناقص للكلام.', en: 'Pointing and choosing are evidence of understanding, not a lesser substitute for speech.', is_demo: true },
];
