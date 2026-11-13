/**
 * IRIS — home activity playbook.
 *
 * WHAT THIS IS
 * One concrete, doable-tonight activity per sub-measure, written for a parent
 * standing in their kitchen with no special materials. It exists because
 * "practise memory skills with your child" is not help — it is a category
 * name. A parent needs to know what to put on the table, what to say, how
 * long, what to watch, and what to change if it goes badly.
 *
 * HONESTY ABOUT WHERE THESE COME FROM  ── READ BEFORE ADDING ONE ──
 * The project's research corpus contains NO activity-level evidence: no study
 * in it prescribes a home task, a repetition count, or a session length for
 * either syndrome at any age (29_RESEARCH_GAPS_REGISTER.md §F). So every entry
 * here is tagged ENGINEERING_SUGGESTION and the chatbot discloses that in the
 * answer. These are sensible, low-cost, low-risk things to try — they are not
 * interventions, and nothing here may be described as one.
 *
 * ON THE DURATIONS
 * A number appears here ONLY as "about how long this little activity takes,
 * adjust it to your child". It is never an answer to "how long should my
 * child's sessions be?" — that question is a genuine research gap and is
 * answered, without a number, by PG-SESSION-LENGTH in guidance.js. Do not
 * copy a number from this file into that answer.
 *
 * WORDING RULES (doc 31 §I14)
 * Every line describes the ACTIVITY or the ATTEMPT, never the child. There is
 * no entry here that tells a parent their child is behind, weak, or unable.
 * The "when to adjust" text always offers an easier route first.
 */

/** Suggestions, not interventions. Surfaced to the parent, not hidden. */
export const PLAYBOOK_TIER = 'ENGINEERING_SUGGESTION';

const a = (o) => ({
  evidence_tier: PLAYBOOK_TIER,
  source:
    '29_RESEARCH_GAPS_REGISTER.md §F — no activity-level or session-length evidence exists in the corpus. This is a low-cost practical suggestion, not a researched intervention.',
  ...o,
});

export const PLAYBOOK = [
  a({
    id: 'PB-MEM-VISUAL',
    sub_measure: 'MEM.VISUAL_STM',
    goal_id: 'G-MEM-VISUAL',
    title_ar: 'إيه اللي اتغيّر؟',
    title_en: 'What changed?',
    means_ar:
      'الأنشطة دي بتدي الطفل فرصة يمسك الصورة في دماغه لثواني. مش تقوية للذاكرة — دي فرصة يتمرّن فيها على حاجة بيستخدمها كل يوم.',
    means_en:
      'This gives your child a chance to hold a picture in mind for a few seconds. It is not memory training — it is practice at something they use every day.',
    materials_ar: '٣ حاجات من البيت (كوباية، معلقة، لعبة) أو ٣ صور',
    materials_en: 'Three household objects (a cup, a spoon, a toy) or three pictures',
    steps_ar: [
      'حطي ٣ حاجات قدامه على الترابيزة وسيبيه يبصلهم شوية.',
      'قوليله "بص كويس"، وبعدين غطي حاجة واحدة بإيدك.',
      'اسأليه: "إيه اللي اتغيّر؟"',
      'لو جاوب صح، بدّلي الترتيب وكرري.',
    ],
    steps_en: [
      'Put three objects in front of them and let them look for a moment.',
      'Say "have a good look", then cover one with your hand.',
      'Ask: "What changed?"',
      'If they get it, change the order and go again.',
    ],
    duration_ar: 'حوالي ١٠ دقايق، أو أقل لو حسّيتي إنه خلص',
    duration_en: 'About 10 minutes — or less if they seem finished',
    watch_ar: 'شوفي بيبص على الحاجات قد إيه قبل ما يجاوب، ولو بيستنى إشارة منك.',
    watch_en: 'Notice how long they look before answering, and whether they wait for a cue from you.',
    easier_ar: 'ابدأي بحاجتين بس بدل ٣، وخلي الحاجات مختلفة عن بعض جدًا في الشكل واللون.',
    easier_en: 'Start with two objects instead of three, and pick things that look very different.',
    harder_ar: 'لو مرتاح معاها، زوّدي حاجة رابعة — واحدة واحدة، مش أكتر.',
    harder_en: 'If they are comfortable, add a fourth object — one at a time, no more.',
  }),

  a({
    id: 'PB-MEM-VERBAL',
    sub_measure: 'MEM.VERBAL_STM',
    goal_id: 'G-MEM-VERBAL',
    title_ar: 'هاتلي حاجتين',
    title_en: 'Bring me two things',
    means_ar:
      'إنه يمسك كلمتين مع بعض لحد ما ينفّذهم — دي حاجة بتفيد في التعليمات اليومية أكتر من أي تمرين.',
    means_en:
      'Holding two words together until they act on them. This helps with everyday instructions more than any exercise does.',
    materials_ar: 'حاجات موجودة في الأوضة',
    materials_en: 'Things already in the room',
    steps_ar: [
      'قوليله: "هاتلي الكوباية والمعلقة".',
      'استنّي شوية من غير ما تكرري على طول.',
      'لو جاب واحدة بس، اشكريه عليها وقوليله: "وكمان إيه؟"',
      'كرري بحاجات تانية.',
    ],
    steps_en: [
      'Say: "Bring me the cup and the spoon."',
      'Wait a moment before repeating.',
      'If they bring one, thank them for it and ask: "And what else?"',
      'Repeat with different things.',
    ],
    duration_ar: 'حوالي ٥ إلى ١٠ دقايق، متفرّقة على اليوم أحسن من مرة واحدة',
    duration_en: 'About 5–10 minutes, spread through the day rather than all at once',
    watch_ar: 'لاحظي هو بيجيب الحاجة الأولى ولا الأخيرة، ولو بيحتاج تكرار قبل ما يتحرك.',
    watch_en: 'Notice whether they fetch the first or the last item, and whether they need a repeat before moving.',
    easier_ar: 'ارجعي لحاجة واحدة، وسمّيها وهي قدامه.',
    easier_en: 'Go back to one item, and name it while it is in sight.',
    harder_ar: 'جربي تلات حاجات، أو حاجات من أوضة تانية.',
    harder_en: 'Try three items, or things from another room.',
  }),

  a({
    id: 'PB-LANG-VOCAB',
    sub_measure: 'LANG.RECEP_VOCAB',
    goal_id: 'G-LANG-VOCAB',
    title_ar: 'وريني فين',
    title_en: 'Show me where',
    means_ar:
      'الإشارة دليل فهم زيها زي الكلام بالظبط. النشاط ده بيدّي الطفل طريقة يوريكي بيها إنه فاهم من غير ما يضطر ينطق.',
    means_en:
      'Pointing is evidence of understanding just as speech is. This gives your child a way to show you they understood without having to say it.',
    materials_ar: 'كتاب صور، أو أي حاجات حواليكم',
    materials_en: 'A picture book, or whatever is around you',
    steps_ar: [
      'افتحي صفحة فيها كذا حاجة.',
      'قوليله: "وريني فين القطة؟"',
      'استنّي. لو مأشرش، أشّري إنتي وقولي الاسم، وبعدين اسأليه تاني.',
      'اختاري ٤ أو ٥ كلمات بس في المرة الواحدة.',
    ],
    steps_en: [
      'Open a page with several things on it.',
      'Say: "Show me where the cat is."',
      'Wait. If they do not point, point yourself and name it, then ask again.',
      'Stick to four or five words per go.',
    ],
    duration_ar: 'حوالي ١٠ دقايق، أو لحد ما تحسّي إنه سرح',
    duration_en: 'About 10 minutes, or until you feel their attention has gone',
    watch_ar: 'شوفي الكلمات اللي بيلاقيها بسرعة والكلمات اللي بيتردّد فيها — ده أنفع من عدد الإجابات الصح.',
    watch_en: 'Notice which words they find quickly and which they hesitate on — that tells you more than a score.',
    easier_ar: 'قلّلي الصور اللي على الصفحة، أو غطي نصها بورقة.',
    easier_en: 'Reduce how many pictures are on the page, or cover half with a sheet of paper.',
    harder_ar: 'جربي كلمات مش أسماء: "وريني اللي فوق"، "وريني اللي أكبر".',
    harder_en: 'Try words that are not object names: "show me the one on top", "show me the bigger one".',
  }),

  a({
    id: 'PB-LANG-INSTRUCTION',
    sub_measure: 'LANG.INSTRUCTION',
    goal_id: 'G-LANG-VOCAB',
    title_ar: 'خطوة واحدة الأول',
    title_en: 'One step first',
    means_ar:
      'التعليمات الطويلة ممكن تبقى صعبة مش لأن الطفل مش فاهم، لكن لأن الجملة نفسها فيها حاجات كتير مع بعض.',
    means_en:
      'A long instruction can be hard not because the child does not understand, but because the sentence itself carries several things at once.',
    materials_ar: 'أي حاجة بتعملوها عادي — ترتيب، أكل، لبس',
    materials_en: 'Anything you already do — tidying, eating, getting dressed',
    steps_ar: [
      'قسّمي الطلب لخطوة واحدة: "حطّ الكوباية في الحوض".',
      'لما يخلّصها، اشكريه وبعدين قولي الخطوة اللي بعدها.',
      'لما تحسّي إنه ماشي، اربطي خطوتين: "حطّ الكوباية وبعدين اقفل الصنبور".',
    ],
    steps_en: [
      'Break the request into one step: "Put the cup in the sink."',
      'When it is done, thank them, then give the next step.',
      'When that is going well, join two: "Put the cup in, then turn off the tap."',
    ],
    duration_ar: 'مش نشاط منفصل — جربيها في روتين اليوم العادي',
    duration_en: 'Not a separate activity — try it inside the ordinary routine',
    watch_ar: 'لاحظي هو بيقف عند أنهي خطوة، ولو الوقفة بتتكرر في نفس المكان.',
    watch_en: 'Notice which step they stop at, and whether the pause happens at the same place each time.',
    easier_ar: 'أشّري على الحاجة وإنتي بتقولي الطلب.',
    easier_en: 'Point at the object while you say the request.',
    harder_ar: 'شيلي الإشارة وسيبي الكلام لوحده.',
    harder_en: 'Drop the pointing and let the words carry it.',
  }),

  a({
    id: 'PB-LANG-PHON',
    sub_measure: 'LANG.PHON_AWARE',
    goal_id: 'G-LANG-PHON',
    title_ar: 'الكلمة دي بتبدأ بإيه؟',
    title_en: 'What does this word start with?',
    means_ar:
      'إن الطفل يسمع أول صوت في الكلمة حاجة منفصلة عن إنه يعرف شكل الحرف. الاتنين بيتبنوا مع بعض بالراحة.',
    means_en:
      'Hearing the first sound in a word is separate from knowing the letter shape. The two build together, slowly.',
    materials_ar: 'حاجات في البيت بأسماء قصيرة',
    materials_en: 'Household things with short names',
    steps_ar: [
      'امسكي حاجة وقولي اسمها بالراحة: "بـ ـاب".',
      'اسأليه: "بتبدأ بإيه؟"',
      'لو مجاوبش، قولي الصوت إنتي وخليه يعيده وراكي.',
      'اتنين أو تلات كلمات في المرة كفاية.',
    ],
    steps_en: [
      'Hold something and say its name slowly: "b-all".',
      'Ask: "What does it start with?"',
      'If no answer comes, say the sound yourself and let them copy it.',
      'Two or three words per go is plenty.',
    ],
    duration_ar: 'حوالي ٥ دقايق — قصيرة ومتكررة أحسن من طويلة',
    duration_en: 'About 5 minutes — short and repeated beats long',
    watch_ar: 'شوفي بيعيد الصوت وراكي بسهولة ولا لأ، ده أهم من إنه يجاوب صح لوحده.',
    watch_en: 'Notice whether they can copy the sound back easily — that matters more than answering alone.',
    easier_ar: 'استخدمي كلمة واحدة وكرريها على مدار اليوم بدل ما تسألي.',
    easier_en: 'Use one word and repeat it through the day instead of asking.',
    harder_ar: 'اسأليه عن آخر صوت في الكلمة بدل الأول.',
    harder_en: 'Ask about the last sound in the word instead of the first.',
  }),

  a({
    id: 'PB-ATT-SUSTAIN',
    sub_measure: 'ATT.SUSTAINED',
    goal_id: 'G-ATT-SUSTAIN',
    title_ar: 'نخلّص الحاجة دي مع بعض',
    title_en: 'Let us finish this one together',
    means_ar:
      'الاستمرار في حاجة لحد ما تخلص مهارة بتتبني بالوقت. النشاط القصير اللي بيخلص فعلاً أنفع من الطويل اللي بيتساب في نصه.',
    means_en:
      'Staying with something until it is done builds over time. A short activity that actually finishes helps more than a long one abandoned halfway.',
    materials_ar: 'بازل صغير، أو ترتيب ٥ حاجات، أو تلوين صورة واحدة',
    materials_en: 'A small puzzle, sorting five things, or colouring one picture',
    steps_ar: [
      'اختاري حاجة صغيرة ليها آخر واضح.',
      'قوليله قبل ما تبدأوا: "هنخلّص دي كلها مع بعض".',
      'اقعدي جنبه من غير ما تمسكي مكانه.',
      'لما تخلص، سمّي اللي حصل: "خلّصناها كلها".',
    ],
    steps_en: [
      'Pick something small with a clear end.',
      'Before you start, say: "We are going to finish this one together."',
      'Sit beside them without taking over.',
      'When it is done, name it: "We finished the whole thing."',
    ],
    duration_ar: 'ابدأي بحاجة بتخلص في ٥ دقايق، وزوّدي بالراحة',
    duration_en: 'Start with something that finishes in about 5 minutes, and build slowly',
    watch_ar: 'لاحظي هو بيسيب في أنهي لحظة — بعد أول صعوبة، ولا لما الحاجة تطول؟',
    watch_en: 'Notice when they leave it — after the first hard bit, or once it goes on a while?',
    easier_ar: 'صغّري الحاجة نفسها: بازل ٤ قطع بدل ٩.',
    easier_en: 'Make the thing itself smaller: a four-piece puzzle instead of nine.',
    harder_ar: 'زوّدي الحجم شوية، أو سيبيه يبدأ لوحده وإنتي جنبه.',
    harder_en: 'Increase the size a little, or let them start alone while you sit nearby.',
  }),

  a({
    id: 'PB-ATT-SELECTIVE',
    sub_measure: 'ATT.SELECTIVE',
    goal_id: 'G-ATT-SUSTAIN',
    title_ar: 'نهدّي المكان الأول',
    title_en: 'Quiet the room first',
    means_ar:
      'لما يكون فيه صوت أو حاجات كتير حوالين الطفل، المجهود بيروح في إنه يتجاهلهم بدل ما يروح في النشاط نفسه.',
    means_en:
      'When there is noise or clutter around, effort goes into ignoring it rather than into the activity itself.',
    materials_ar: 'مفيش — ده تغيير في المكان مش نشاط',
    materials_en: 'Nothing — this is a change to the room, not an activity',
    steps_ar: [
      'اقفلي التلفزيون والراديو خالص، مش بس توطّي الصوت.',
      'شيلي من على الترابيزة كل حاجة مش هتستخدموها.',
      'اقعدوا في نفس المكان كل مرة لو ينفع.',
      'ابدأوا النشاط بعد ما المكان يهدى بدقيقة.',
    ],
    steps_en: [
      'Turn the television and radio off completely, not just down.',
      'Clear everything off the table that you will not use.',
      'Sit in the same spot each time if you can.',
      'Start a minute after the room has settled.',
    ],
    duration_ar: 'دقيقة تحضير قبل أي نشاط',
    duration_en: 'One minute of setup before any activity',
    watch_ar: 'قارني بنفسك: نفس النشاط في مكان هادي وفي مكان فيه صوت — فيه فرق؟',
    watch_en: 'Compare for yourself: the same activity in a quiet room and a noisy one — is there a difference?',
    easier_ar: 'لو مش قادرة تهدّي البيت، جربي وقت تاني في اليوم بدل مكان تاني.',
    easier_en: 'If you cannot quiet the house, try a different time of day rather than a different room.',
    harder_ar: 'لو ماشي كويس في الهدوء، سيبي صوت خفيف في الخلفية بالراحة.',
    harder_en: 'If it goes well in quiet, allow a little background sound, gradually.',
  }),

  a({
    id: 'PB-VSP-MATCH',
    sub_measure: 'VSP.MATCHING',
    goal_id: 'G-VSP-MATCH',
    title_ar: 'لمّي اللي زي بعض',
    title_en: 'Put the same ones together',
    means_ar:
      'المطابقة بتيجي قبل التسمية. الطفل ممكن يعرف إن حاجتين زي بعض قبل ما يعرف يقول اسمهم بكتير.',
    means_en:
      'Matching comes before naming. A child can know two things are the same long before they can say what they are called.',
    materials_ar: 'جوارب، أزرار، معالق، أي حاجة ليها أزواج',
    materials_en: 'Socks, buttons, spoons — anything that comes in pairs',
    steps_ar: [
      'حطي ٤ حاجات قدامه: زوجين مختلفين.',
      'قوليله: "لمّي اللي زي بعض".',
      'لو وقف، حطي واحدة جنب اللي شبهها وقولي "دول زي بعض".',
      'زوّدي زوج تالت لما يبقى ماشي.',
    ],
    steps_en: [
      'Put four things in front of them: two different pairs.',
      'Say: "Put the same ones together."',
      'If they stall, place one beside its match and say "these are the same".',
      'Add a third pair once it is going well.',
    ],
    duration_ar: 'حوالي ١٠ دقايق',
    duration_en: 'About 10 minutes',
    watch_ar: 'شوفي بيطابق باللون ولا بالشكل — ده بيقولك هو بيبص على إيه.',
    watch_en: 'Notice whether they match by colour or by shape — that tells you what they are attending to.',
    easier_ar: 'خلي الزوجين مختلفين جدًا: أحمر كبير وأزرق صغير.',
    easier_en: 'Make the pairs very different: big red and small blue.',
    harder_ar: 'خلي الفرق أصغر: نفس اللون وشكلين قريبين.',
    harder_en: 'Make the difference smaller: same colour, two similar shapes.',
  }),

  a({
    id: 'PB-VSP-PATTERN',
    sub_measure: 'VSP.PATTERN',
    goal_id: 'G-VSP-MATCH',
    title_ar: 'إيه اللي جاي بعدها؟',
    title_en: 'What comes next?',
    means_ar:
      'إنه يشوف إن فيه ترتيب بيتكرر — دي بداية حاجات كتير جاية بعدين زي العدّ والقراءة.',
    means_en:
      'Seeing that an order repeats is the beginning of a lot of later things, counting and reading among them.',
    materials_ar: 'أزرار أو مكعبات بلونين',
    materials_en: 'Buttons or blocks in two colours',
    steps_ar: [
      'رصّي: أحمر، أزرق، أحمر، أزرق.',
      'اسأليه: "إيه اللي جاي بعدها؟"',
      'لو مجاوبش، كمّلي إنتي ورصّي من الأول وخليه يجرب.',
      'كرري بنفس النمط قبل ما تغيّريه.',
    ],
    steps_en: [
      'Lay out: red, blue, red, blue.',
      'Ask: "What comes next?"',
      'If nothing comes, finish it yourself, start again, and let them try.',
      'Repeat the same pattern before changing it.',
    ],
    duration_ar: 'حوالي ١٠ دقايق',
    duration_en: 'About 10 minutes',
    watch_ar: 'لاحظي لو بيقول اللون بصوت وهو بيرصّ — ده بيساعد كتير وميتمنعش.',
    watch_en: 'Notice if they say the colours aloud while laying them out — that helps, and should not be stopped.',
    easier_ar: 'خلي النمط لونين بس ومتكرر أربع مرات قدامه.',
    easier_en: 'Keep it to two colours, repeated four times where they can see it.',
    harder_ar: 'جربي تلات ألوان، أو نمط أحمر أحمر أزرق.',
    harder_en: 'Try three colours, or a red-red-blue pattern.',
  }),
];

export const PLAYBOOK_BY_SUB_MEASURE = Object.fromEntries(
  PLAYBOOK.map((p) => [p.sub_measure, p])
);

/** Find the activity that fits a sub-measure, or a goal if that is all we have. */
export function activityFor({ sub_measure, goal_id } = {}) {
  if (sub_measure && PLAYBOOK_BY_SUB_MEASURE[sub_measure]) {
    return PLAYBOOK_BY_SUB_MEASURE[sub_measure];
  }
  if (goal_id) return PLAYBOOK.find((p) => p.goal_id === goal_id) || null;
  return null;
}
