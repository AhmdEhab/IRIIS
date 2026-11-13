/**
 * IRIS story content — scenes, not paragraphs.
 *
 * WHY THE SHAPE IS LIKE THIS
 * Each story used to be one long paragraph rendered as a wall of text with a
 * read-aloud button; a child who cannot yet read got nothing from the screen.
 * Every story is now a short sequence of SCENES, where each scene is one
 * illustration plus one short sentence, so the story is followable visually.
 *
 * ILLUSTRATIONS
 * Scenes were, in an earlier pass, composed from emoji. That did not work: the
 * glyphs share no horizon, no light source and no drawing style, and the
 * "character" changes shape depending on which emoji font the device uses.
 * Scenes are now composed from the drawn vector art in ui/StoryArt.tsx — the
 * SAME character component in every scene of a story, so Bandaq stays Bandaq.
 * A scene is described here as data (which backdrop, which pieces, where), and
 * the art itself lives in one place.
 *
 * TEXT
 * Arabic is Egyptian conversational — this is a story told aloud to a child,
 * not a literary text. One short sentence per scene, no exceptions: it has to
 * sit comfortably under the picture at a large size.
 *
 * THE CLOSING QUESTION
 * Every story ends with a single two-choice recall question about something
 * visible in the scenes. It is a comprehension moment for the child, NOT an
 * assessment item: it is never scored, never timed, and nothing about it
 * reaches the adaptive engine — no goal, level, pathway or difficulty. Adding
 * scoring here would be inventing a pathway the validated engine does not have.
 */

/** Which drawn pieces a scene places, and where, in the 400x250 stage. */
export interface ScenePiece {
  /** Key into the art registry in IrisStoryPlayer. */
  art: string;
  x: number;
  y: number;
  scale?: number;
  flip?: boolean;
  /** Optional prop passed to the art component (e.g. a colour). */
  variant?: string;
  /** Set on the ONE element per story a child is invited to tap. */
  tapId?: string;
}

export interface StoryScene {
  /** One short sentence. Short enough to read at a glance. */
  ar: string;
  en: string;
  backdrop: 'meadow' | 'forest' | 'night' | 'garden' | 'rainy' | 'sunny';
  pieces: ScenePiece[];
  /** When present, this scene invites a tap before Next becomes the focus. */
  tap?: {
    ar: string;
    en: string;
    /** The tapId that counts as "found it". */
    target: string;
    /** Warm confirmation once found. */
    foundAr: string;
    foundEn: string;
  };
}

export interface StoryQuestion {
  ar: string;
  en: string;
  options: { ar: string; en: string; art: string; variant?: string }[];
  correct: number;
}

export interface Story {
  id: string;
  titleAr: string;
  titleEn: string;
  /** Art key for the cover, drawn rather than an emoji. */
  coverArt: string;
  /** A brand wash class for the cover band. Was a pink→magenta gradient —
   *  neither colour is in the IRIS palette (audit defect D3). */
  color: string;
  scenes: StoryScene[];
  question: StoryQuestion;
}

export const STORIES: Story[] = [
  {
    id: 'bunny',
    titleAr: 'الأرنب بندق',
    titleEn: 'Bandaq the Bunny',
    coverArt: 'bunny',
    color: 'bg-brand-purple-wash',
    scenes: [
      {
        ar: 'بندق أرنب صغير بيحب الجنينة.',
        en: 'Bandaq is a little bunny who loves the meadow.',
        backdrop: 'meadow',
        pieces: [
          { art: 'sun', x: 340, y: 50, scale: 1 },
          { art: 'tree', x: 60, y: 150, scale: 0.9 },
          { art: 'bunny', x: 210, y: 165, scale: 1.05 },
          { art: 'flower', x: 300, y: 205, scale: 1, variant: '#F0ABFC' },
          { art: 'flower', x: 135, y: 212, scale: 0.9, variant: '#FDE047' },
        ],
      },
      {
        ar: 'بندق لقى جزرة كبيرة أوي!',
        en: 'Bandaq found a giant carrot!',
        backdrop: 'meadow',
        pieces: [
          { art: 'sun', x: 340, y: 50 },
          { art: 'bunny', x: 130, y: 168, scale: 1 },
          { art: 'carrotBig', x: 265, y: 150, scale: 1 },
        ],
        // The one light interaction in this story: find the carrot.
        tap: {
          ar: 'تقدر تلاقي الجزرة الكبيرة؟',
          en: 'Can you find the giant carrot?',
          target: 'carrot',
          foundAr: 'لقيتها! جزرة كبيرة أوي 🥕',
          foundEn: 'You found it! What a big carrot 🥕',
        },
      },
      {
        ar: 'شدّ الجزرة، بس هي تقيلة.',
        en: 'He pulled the carrot, but it was too heavy.',
        backdrop: 'meadow',
        pieces: [
          { art: 'bunny', x: 150, y: 168, scale: 1 },
          { art: 'carrotBig', x: 255, y: 150 },
          { art: 'sparkle', x: 120, y: 110, scale: 0.8, variant: '#93C5FD' },
          { art: 'sparkle', x: 185, y: 100, scale: 0.6, variant: '#93C5FD' },
        ],
      },
      {
        ar: 'نادى أصحابه الأرانب يساعدوه.',
        en: 'He called his bunny friends to help.',
        backdrop: 'meadow',
        pieces: [
          { art: 'bunny', x: 120, y: 170, scale: 0.85 },
          { art: 'bunny', x: 195, y: 172, scale: 0.85 },
          { art: 'bunny', x: 268, y: 170, scale: 0.85, flip: true },
          { art: 'carrotBig', x: 340, y: 155, scale: 0.85 },
        ],
      },
      {
        ar: 'شدّوا مع بعض، وطلعت الجزرة!',
        en: 'They pulled together, and out it came!',
        backdrop: 'sunny',
        pieces: [
          { art: 'bunny', x: 110, y: 172, scale: 0.85 },
          { art: 'bunny', x: 185, y: 174, scale: 0.85 },
          { art: 'bunny', x: 258, y: 172, scale: 0.85 },
          { art: 'carrotBig', x: 330, y: 130, scale: 1 },
          { art: 'sparkle', x: 300, y: 60 },
          { art: 'sparkle', x: 360, y: 80, scale: 0.7 },
        ],
      },
    ],
    question: {
      ar: 'مين ساعد بندق؟',
      en: 'Who helped Bandaq?',
      options: [
        { ar: 'أصحابه', en: 'His friends', art: 'bunny' },
        { ar: 'الوردة', en: 'A rose', art: 'rose' },
      ],
      correct: 0,
    },
  },

  {
    id: 'lion',
    titleAr: 'الأسد الطيب',
    titleEn: 'The Kind Lion',
    coverArt: 'lion',
    color: 'bg-brand-yellow-wash',
    scenes: [
      {
        ar: 'سيمبا أسد كبير وطيب.',
        en: 'Simba is a big, kind lion.',
        backdrop: 'sunny',
        pieces: [
          { art: 'sun', x: 340, y: 48 },
          { art: 'tree', x: 70, y: 150, scale: 0.95 },
          { art: 'lion', x: 220, y: 160, scale: 1.05 },
        ],
      },
      {
        ar: 'شاف عصفور صغير وقع من عشّه.',
        en: 'He saw a little bird fall from its nest.',
        backdrop: 'forest',
        pieces: [
          { art: 'tree', x: 320, y: 140, scale: 1 },
          { art: 'nest', x: 320, y: 96, scale: 0.8 },
          { art: 'lion', x: 130, y: 162, scale: 0.95 },
          { art: 'bird', x: 232, y: 196, scale: 1 },
        ],
        tap: {
          ar: 'فين العصفور الصغير؟',
          en: 'Where is the little bird?',
          target: 'bird',
          foundAr: 'أيوه! ده العصفور 🐦',
          foundEn: "Yes! There's the bird 🐦",
        },
      },
      {
        ar: 'سيمبا ما زأرش، قرّب بالراحة.',
        en: "Simba didn't roar. He came closer gently.",
        backdrop: 'forest',
        pieces: [
          { art: 'lion', x: 170, y: 162, scale: 1 },
          { art: 'bird', x: 258, y: 194, scale: 1 },
          { art: 'flower', x: 90, y: 210, scale: 0.9, variant: '#FDA4AF' },
        ],
      },
      {
        ar: 'شال العصفور على ضهره.',
        en: 'He carried the bird on his back.',
        backdrop: 'forest',
        pieces: [
          { art: 'tree', x: 340, y: 145, scale: 0.9 },
          { art: 'lion', x: 180, y: 165, scale: 1.05 },
          { art: 'bird', x: 205, y: 128, scale: 0.75 },
        ],
      },
      {
        ar: 'رجّعه لعشّه بأمان.',
        en: 'He returned it safely to its nest.',
        backdrop: 'sunny',
        pieces: [
          { art: 'tree', x: 300, y: 140, scale: 1.05 },
          { art: 'nest', x: 300, y: 92, scale: 0.85 },
          { art: 'bird', x: 300, y: 78, scale: 0.7 },
          { art: 'lion', x: 140, y: 168, scale: 0.95 },
          { art: 'sparkle', x: 240, y: 60, scale: 0.8 },
        ],
      },
    ],
    question: {
      ar: 'سيمبا عمل إيه للعصفور؟',
      en: 'What did Simba do for the bird?',
      options: [
        { ar: 'رجّعه لعشّه', en: 'Took it home', art: 'nest' },
        { ar: 'ساب الجزرة', en: 'Left a carrot', art: 'carrot' },
      ],
      correct: 0,
    },
  },

  {
    id: 'stars',
    titleAr: 'مغامرة لولو',
    titleEn: "Lulu's Adventure",
    coverArt: 'star',
    color: 'bg-brand-blue-wash',
    scenes: [
      {
        ar: 'لولو نجمة صغيرة بتلمع في السما.',
        en: 'Lulu is a little star shining in the sky.',
        backdrop: 'night',
        pieces: [
          { art: 'moon', x: 330, y: 60 },
          { art: 'star', x: 190, y: 110, scale: 1.1 },
        ],
      },
      {
        ar: 'لولو نزلت الأرض تشوف الورد.',
        en: 'Lulu came down to see the flowers.',
        backdrop: 'garden',
        pieces: [
          { art: 'star', x: 200, y: 95, scale: 0.95 },
          { art: 'flower', x: 105, y: 205, scale: 1.1, variant: '#F0ABFC' },
          { art: 'flower', x: 300, y: 208, scale: 1.1, variant: '#FDE047' },
          { art: 'rose', x: 205, y: 190, scale: 0.8 },
        ],
      },
      {
        ar: 'قعدت على وردة حمرا.',
        en: 'She sat on a red rose.',
        backdrop: 'garden',
        pieces: [
          { art: 'rose', x: 210, y: 165, scale: 1.25 },
          { art: 'star', x: 210, y: 118, scale: 0.62 },
          { art: 'flower', x: 90, y: 210, scale: 0.9, variant: '#A7F3D0' },
        ],
        tap: {
          ar: 'دوس على الوردة الحمرا',
          en: 'Tap the red rose',
          target: 'rose',
          foundAr: 'أيوه! دي الوردة الحمرا 🌹',
          foundEn: "That's the red rose 🌹",
        },
      },
      {
        ar: 'اتكلموا مع بعض لحد الفجر.',
        en: 'They talked together until dawn.',
        backdrop: 'sunny',
        pieces: [
          { art: 'sun', x: 340, y: 55 },
          { art: 'rose', x: 210, y: 165, scale: 1.2 },
          { art: 'star', x: 210, y: 120, scale: 0.6 },
          { art: 'sparkle', x: 140, y: 90, scale: 0.7 },
        ],
      },
      {
        ar: 'ومن ساعتها، لولو بتلمع لها كل ليلة.',
        en: 'Since then, Lulu shines for her every night.',
        backdrop: 'night',
        pieces: [
          { art: 'moon', x: 340, y: 55 },
          { art: 'star', x: 190, y: 90, scale: 0.95 },
          { art: 'rose', x: 190, y: 195, scale: 1 },
          { art: 'sparkle', x: 120, y: 70, scale: 0.7 },
          { art: 'sparkle', x: 265, y: 60, scale: 0.55 },
        ],
      },
    ],
    question: {
      ar: 'لولو قعدت على إيه؟',
      en: 'What did Lulu sit on?',
      options: [
        { ar: 'وردة', en: 'A rose', art: 'rose' },
        { ar: 'شجرة', en: 'A tree', art: 'tree' },
      ],
      correct: 0,
    },
  },

  {
    id: 'rainbow',
    titleAr: 'ألوان السعادة',
    titleEn: 'Colors of Happiness',
    coverArt: 'rainbow',
    color: 'bg-brand-coral-wash',
    scenes: [
      {
        ar: 'بعد المطر، الألوان اتجمعت في السما.',
        en: 'After the rain, the colors gathered in the sky.',
        backdrop: 'rainy',
        pieces: [
          { art: 'cloud', x: 110, y: 60, scale: 1 },
          { art: 'cloud', x: 300, y: 48, scale: 0.85 },
          { art: 'colorBlob', x: 170, y: 130, scale: 0.8, variant: '#F87171' },
          { art: 'colorBlob', x: 215, y: 135, scale: 0.8, variant: '#38BDF8' },
          { art: 'colorBlob', x: 258, y: 128, scale: 0.8, variant: '#FDE047' },
        ],
      },
      {
        ar: 'كل لون قال: أنا الأحلى!',
        en: 'Each color said: "I am the best!"',
        backdrop: 'rainy',
        pieces: [
          { art: 'colorBlob', x: 120, y: 130, scale: 1.15, variant: '#F87171' },
          { art: 'colorBlob', x: 205, y: 118, scale: 1.15, variant: '#38BDF8' },
          { art: 'colorBlob', x: 288, y: 132, scale: 1.15, variant: '#FDE047' },
        ],
      },
      {
        ar: 'الشمس قالت: الجمال لما تكونوا مع بعض.',
        en: 'The sun said: beauty comes from being together.',
        backdrop: 'sunny',
        pieces: [
          { art: 'sun', x: 200, y: 80, scale: 1.35 },
          { art: 'colorBlob', x: 110, y: 165, scale: 0.85, variant: '#F87171' },
          { art: 'colorBlob', x: 200, y: 172, scale: 0.85, variant: '#38BDF8' },
          { art: 'colorBlob', x: 290, y: 165, scale: 0.85, variant: '#FDE047' },
        ],
      },
      {
        ar: 'الألوان اتجمعت وعملت قوس قزح.',
        en: 'The colors joined and made a rainbow.',
        backdrop: 'sunny',
        pieces: [
          { art: 'rainbow', x: 200, y: 130, scale: 1.15 },
          { art: 'cloud', x: 70, y: 170, scale: 0.7 },
          { art: 'cloud', x: 330, y: 170, scale: 0.7 },
        ],
      },
      {
        ar: 'وكل اللي شافه ابتسم.',
        en: 'And everyone who saw it smiled.',
        backdrop: 'sunny',
        pieces: [
          { art: 'rainbow', x: 200, y: 110, scale: 1 },
          { art: 'happyFace', x: 120, y: 200, scale: 1 },
          { art: 'happyFace', x: 200, y: 205, scale: 1 },
          { art: 'happyFace', x: 280, y: 200, scale: 1 },
        ],
      },
    ],
    question: {
      ar: 'الألوان عملت إيه لما اتجمعت؟',
      en: 'What did the colors make together?',
      options: [
        { ar: 'قوس قزح', en: 'A rainbow', art: 'rainbow' },
        { ar: 'سحابة', en: 'A cloud', art: 'cloud' },
      ],
      correct: 0,
    },
  },
];
