/**
 * IRIS — Parent Guidance Knowledge Base
 *
 * ── PROVENANCE RULES FOR THIS FILE ────────────────────────────────────────
 * Every entry is derived from the existing evidence documents (23–31) and
 * carries the tier that document assigned. Nothing here is invented.
 *
 *  - No medical, clinical, therapeutic, dietary, or medication advice.
 *  - No claim that any activity "improves" memory, attention, or language as
 *    a general capacity (forbidden by I10).
 *  - No diagnosis-derived guidance. Nothing here keys off Down syndrome or
 *    Williams syndrome as a rule for how to teach.
 *  - `evidence_tier` is the tier from the source document, NOT a claim that
 *    this specific wording was tested.
 *  - validation_status is RESEARCH_INFORMED_PROTOTYPE for every entry.
 *    specialist_review_status is NOT_REVIEWED. reviewed_by is null and must
 *    never be filled with an invented name.
 * ──────────────────────────────────────────────────────────────────────────
 */
import { VALIDATION, SPECIALIST_REVIEW } from '../spec.js';

const g = (o) => ({
  validation_status: VALIDATION.RESEARCH_INFORMED_PROTOTYPE,
  specialist_review_status: SPECIALIST_REVIEW.NOT_REVIEWED,
  reviewed_by: null,
  reviewed_at: null,
  specialist_notes: null,
  applicable_scope: 'Children using IRIS at home, general educational support. Not a treatment plan.',
  safety_note: null,
  ...o,
});

export const PARENT_GUIDANCE = [
  g({
    id: 'PG-RESPONSE-MODE',
    topic_ar: 'الإشارة واللمس دليل فهم صالح',
    topic_en: 'Pointing and touching are valid evidence of understanding',
    keywords: ['نطق', 'كلام', 'يتكلم', 'إشارة', 'لمس', 'فهم', 'speech', 'talking', 'pointing', 'understand'],
    guidance_ar: 'لا تنتظري الكلام لتعرفي أن طفلك فهم. الإشارة أو اللمس أو اختيار الصورة الصحيحة كلها أدلة صالحة على الفهم. صعوبة النطق قد تكون حركية-نطقية منفصلة تمامًا عن الفهم، لذلك الحكم على الفهم من الكلام وحده قد يقلّل من قدرة طفلك الحقيقية.',
    guidance_en: 'Do not wait for speech to know your child understood. Pointing, touching, or choosing the right picture are all valid evidence of understanding. Speech difficulty can be a separate motor-speech matter, so judging understanding from talking alone can underestimate what your child actually knows.',
    evidence_tier: 'STRONG',
    source: 'H10 (30_CLAIMS_WE_CAN_MAKE.md) — expressive language more affected than receptive; gesture used at rates comparable to typically developing children',
  }),
  g({
    id: 'PG-REDUCE-LOAD',
    topic_ar: 'قلّلي الحمل قبل أن تقلّلي التوقّعات',
    topic_en: 'Reduce the load before reducing expectations',
    keywords: ['صعب', 'يجد صعوبة', 'لا يستطيع', 'أخطأ', 'حمل', 'struggling', 'difficult', 'hard', 'failing'],
    guidance_ar: 'عندما يجد طفلك المهمة صعبة، جرّبي أولًا تقليل عدد العناصر أو تقسيم المهمة إلى خطوات أصغر أو إبقاء صورة مرجعية أمامه — قبل أن تفترضي أن المهمة أصعب من مستواه. هذا هو نفس الترتيب الذي يتبعه IRIS تلقائيًا: تخفيف الحمل أولًا، ثم تغيير طريقة العرض، ثم الرجوع خطوة.',
    guidance_en: 'When your child finds a task hard, first try reducing the number of items, breaking it into smaller steps, or keeping a reference picture in view — before assuming the task is beyond them. This is the same order IRIS follows automatically: reduce load first, then change how it is presented, then step back a level.',
    evidence_tier: 'STRONG',
    source: 'H9 + H16 (30_CLAIMS_WE_CAN_MAKE.md) — working memory strongly predicts achievement but WM training does not transfer, so the response is instructional load reduction. Mirrors R-PATH-005.',
  }),
  g({
    id: 'PG-NOT-MEMORY-TRAINING',
    topic_ar: 'هذه تمارين دعم، وليست «تقوية للذاكرة»',
    topic_en: 'These are support activities, not "memory training"',
    keywords: ['ذاكرة', 'تقوية', 'تحسين', 'تدريب', 'memory', 'training', 'improve', 'brain'],
    guidance_ar: 'أنشطة التذكّر في IRIS مصمّمة لتسهيل أداء المهمة نفسها (مثل إبقاء صور مرجعية أمام الطفل)، وليست وعدًا بزيادة قدرة الذاكرة بشكل عام. الأدلة الحالية من تحليلين مرجعيين مستقلّين لا تدعم انتقال أثر برامج «تدريب الذاكرة» إلى التحصيل الدراسي، ونحن لا نقدّم هذا الوعد.',
    guidance_en: 'The memory activities in IRIS are designed to make the task itself easier to do (for example keeping reference pictures visible). They are not a promise to increase memory capacity in general. Current evidence from two independent meta-analyses does not support memory-training programmes transferring to academic gains, and we do not make that claim.',
    evidence_tier: 'STRONG',
    source: 'H16 / I10 (30 & 31) — Sala & Gobet meta-analyses cited via S5',
    safety_note: 'This entry exists to prevent an overclaim. Do not rephrase it into a benefit promise.',
  }),
  g({
    id: 'PG-INDEPENDENCE',
    topic_ar: 'كيف تشجّعين الاستقلالية دون مساعدة زائدة',
    topic_en: 'Encouraging independence without over-helping',
    keywords: ['مساعدة', 'استقلال', 'وحده', 'بنفسه', 'أساعده', 'help', 'independence', 'alone', 'prompt'],
    guidance_ar: 'IRIS يقيس «الاستقلالية» بشكل منفصل عن «الإجابة الصحيحة»، لأن الطفل الذي يجيب صحيحًا بمساعدة كاملة في وضع مختلف عن الذي يجيب وحده. عمليًا: امنحي طفلك وقتًا أطول قبل التدخّل، وابدئي بأقل مساعدة ممكنة (إشارة أو تلميح) بدلًا من إعطاء الإجابة. ملاحظة مهمة: لا يوجد في الأدلة الحالية جدول محدّد ومُختبَر لكيفية سحب المساعدة تدريجيًا لهذه الفئة — الترتيب الذي نستخدمه هو اجتهاد هندسي يحتاج مراجعة مختص.',
    guidance_en: 'IRIS measures "independence" separately from "correct answer", because a child who answers correctly with full help is in a different position from one who answers alone. Practically: give your child longer before stepping in, and start with the smallest possible help (a gesture or a hint) rather than giving the answer. Important: the current evidence base contains no tested schedule for fading help for this group — the order we use is an engineering judgement that needs specialist review.',
    evidence_tier: 'ENGINEERING_ASSUMPTION',
    source: 'doc 29 §H — no prompting hierarchy or hint-fading schedule exists anywhere in the corpus; independence tracking is R-PROG-005',
  }),
  g({
    id: 'PG-CONCRETE-VOCAB',
    topic_ar: 'الكلمات المجرّدة تحتاج تدريسًا صريحًا',
    topic_en: 'Abstract words need to be taught explicitly',
    keywords: ['كلمات', 'مفردات', 'فوق', 'تحت', 'قبل', 'أكثر', 'vocabulary', 'words', 'before', 'under', 'more'],
    guidance_ar: 'الكلمات الملموسة (كرة، قطة، كوب) عادةً أسهل من الكلمات العلائقية (فوق، تحت، قبل، أكثر من). لا تفترضي أن طفلك يعرف الكلمات العلائقية لمجرّد أنه يعرف أسماء الأشياء — هذه الكلمات تحتاج أن تُدرَّس صراحةً وبأمثلة، لا أن تُستخدم داخل تعليمات مهمة أخرى وكأنها معروفة.',
    guidance_en: 'Concrete words (ball, cat, cup) are usually easier than relational words (above, under, before, more than). Do not assume your child knows relational words just because they know object names — these need to be taught explicitly with examples, not used inside instructions for another task as if already known.',
    evidence_tier: 'STRONG',
    source: 'H13 (30_CLAIMS_WE_CAN_MAKE.md) — concrete vs relational/conceptual vocabulary, S6/S7',
  }),
  g({
    id: 'PG-ENVIRONMENT',
    topic_ar: 'تقليل المشتتات وضبط الصوت',
    topic_en: 'Reducing distractions and managing sound',
    keywords: ['تشتت', 'مشتتات', 'صوت', 'ضوضاء', 'هدوء', 'مكان', 'distraction', 'noise', 'sound', 'quiet', 'environment'],
    guidance_ar: 'اجعلي الصوت اختياريًا وقابلًا للضبط، وتجنّبي الأصوات المفاجئة أو العالية، ووفّري بديلًا بصريًا للمحتوى الصوتي. اختاري مكانًا هادئًا وقلّلي ما يظهر على الطاولة أثناء الجلسة. هذا إجراء احترازي منخفض التكلفة ومناسب حتى لو لم تكن هناك حساسية سمعية.',
    guidance_en: 'Keep audio optional and adjustable, avoid sudden or loud sounds, and provide a visual equivalent for audio content. Choose a quiet spot and reduce what is visible on the table during a session. This is a low-cost precaution that is appropriate even if there is no sound sensitivity.',
    evidence_tier: 'STRONG',
    source: 'H15 (30_CLAIMS_WE_CAN_MAKE.md) — elevated ADHD/anxiety/sensory rates and frequently unrecognised hearing impairment; explicitly flagged as safe to apply as a default because the cost of the default is low',
  }),
  g({
    id: 'PG-FATIGUE',
    topic_ar: 'التعب الجسدي قد يبدو وكأنه رفض',
    topic_en: 'Physical tiredness can look like refusal',
    keywords: ['تعب', 'ملل', 'رفض', 'يتحرك', 'جلسة', 'راحة', 'tired', 'fatigue', 'refuse', 'break', 'restless'],
    guidance_ar: 'الجلوس لفترة طويلة قد يسبّب تعبًا جسديًا حقيقيًا يظهر على شكل تململ أو رفض أو تراجع في الأداء قرب نهاية الجلسة. إذا لاحظتِ تراجعًا في آخر الجلسة، اعتبريه إشارة محتملة للتعب تستحق إعادة المحاولة في وقت آخر، لا دليلًا على أن هذا هو سقف قدرة طفلك.',
    guidance_en: 'Sitting for a long stretch can cause genuine physical tiredness that shows up as restlessness, refusal, or a drop in performance near the end of a session. If you see a decline late in a session, treat it as a possible tiredness signal worth retrying at another time — not as evidence of your child\'s ceiling.',
    evidence_tier: 'MODERATE',
    source: 'H8 (30_CLAIMS_WE_CAN_MAKE.md) — hypotonia-linked fatigue producing task-avoidance that looks motivational but is physical',
  }),
  g({
    id: 'PG-SESSION-LENGTH',
    topic_ar: 'كم يجب أن تكون مدة الجلسة؟',
    topic_en: 'How long should a session be?',
    keywords: ['مدة', 'دقائق', 'كم وقت', 'طول الجلسة', 'يوميًا', 'duration', 'minutes', 'how long', 'daily'],
    guidance_ar: 'لا نعرف. لا يوجد في مجموعة الأدلة التي بنينا عليها IRIS أي مصدر يحدّد مدة جلسة، أو عدد تكرارات، أو جدول تباعد، لأي من الفئتين، في أي عمر. أي رقم نستخدمه في التطبيق هو افتراض هندسي محافظ وليس توصية علمية. المؤشّر العملي الأفضل حاليًا هو طفلك نفسه: أوقفي الجلسة عند أول علامة تعب حقيقي.',
    guidance_en: 'We do not know. No source in the evidence base behind IRIS specifies a session length, a repetition count, or a spacing schedule for either group, at any age. Any number in the app is a conservative engineering default, not a scientific recommendation. The best practical guide right now is your child: stop at the first sign of real tiredness.',
    evidence_tier: 'RESEARCH_GAP',
    source: 'doc 29 §F — total dosage gap across the whole corpus (~10,000 lines searched); S6 names optimum therapy intensity as an open research question',
    safety_note: 'This is a genuine research gap. Do not replace this answer with a number.',
  }),
  g({
    id: 'PG-PHONICS',
    topic_ar: 'تعليم أصوات الحروف',
    topic_en: 'Teaching letter sounds',
    keywords: ['قراءة', 'حروف', 'أصوات', 'فونكس', 'تهجئة', 'reading', 'letters', 'sounds', 'phonics', 'spelling'],
    guidance_ar: 'أقوى نتيجة في مجموعة الأدلة لدينا هي ارتباط التدريس الصوتي المنهجي (ربط الحرف بصوته، والدمج، والتقطيع، باستخدام حروف حقيقية) بنتائج قراءة أفضل. لكن يجب أن تُقال مع حدودها: هذه علاقة ارتباط من دراسة رصدية وليست إثباتًا للسببية؛ ولم تُختبر في متلازمة داون؛ وكانت عيّنة الدراسة في التاسعة من العمر؛ ولم تُختبر إطلاقًا على اللغة العربية ونظامها الكتابي المختلف. اسألي مختص لغة عربية أو صعوبات قراءة قبل بناء برنامج منزلي على هذا.',
    guidance_en: 'The strongest finding in our evidence base is an association between systematic phonics (linking letters to sounds, blending, segmenting, using real letters) and better reading outcomes. It must be stated with its limits: this is an association from an observational study, not proof of causation; it was not tested in Down syndrome; the study sample was age 9; and it has never been tested on Arabic and its different writing system. Ask an Arabic-language or reading-difficulties specialist before building a home programme on this.',
    evidence_tier: 'STRONG_AS_ASSOCIATION',
    source: 'H14 (30) + I7/I8 (31) — S4 observational, corroborated by an independent Cochrane meta-analysis for ID generally',
    safety_note: 'Never restate this as "phonics causes a reading gain" or extend it to Down syndrome.',
  }),
  g({
    id: 'PG-PERSON-FIRST',
    topic_ar: 'اللغة التي نستخدمها عن الطفل',
    topic_en: 'The language we use about the child',
    keywords: ['لغة', 'وصف', 'كلام عن الطفل', 'مصطلح', 'language', 'describe', 'terms', 'labels'],
    guidance_ar: 'استخدمي صيغة تضع الطفل أولًا: «طفل لديه متلازمة داون» وليس «طفل داون». وتجنّبي كلمات مثل «قصور» أو «إعاقة» كوصف للطفل نفسه. هذا معيار مهني وحقوقي متّفق عليه دوليًا — وليس ادعاءً بأنه يحسّن نتائج التعلّم، فهذان نوعان مختلفان من الادعاء ولا يجوز الخلط بينهما.',
    guidance_en: 'Use person-first phrasing: "a child with Down syndrome", not "a Down syndrome child". Avoid words that describe the child as a shortcoming. This is an internationally agreed professional and rights-based norm — it is not a claim that it improves learning outcomes; those are two different kinds of claim and must not be conflated.',
    evidence_tier: 'STRONG_AS_NORM',
    source: 'H17 (30) — CRPD-anchored, 174-country consensus; explicitly carries no learning-outcome evidence',
  }),
  g({
    id: 'PG-PROFILE-CHANGES',
    topic_ar: 'ملف طفلك ليس تصنيفًا ثابتًا',
    topic_en: "Your child's profile is not a fixed label",
    keywords: ['مستوى', 'تصنيف', 'ثابت', 'يتغير', 'إعادة تقييم', 'level', 'label', 'fixed', 'change', 'reassess'],
    guidance_ar: 'ما يعرضه IRIS هو صورة عن أداء طفلك في أنشطة محدّدة في يوم محدّد، وليس تصنيفًا دائمًا. النظام يعيد التقييم دوريًا، والمستوى يتغيّر بناءً على الأداء الملاحَظ وحده. لا يستخدم IRIS تشخيص طفلك لتحديد مستواه أو مساره في أي مرحلة.',
    guidance_en: "What IRIS shows is a picture of your child's performance on specific activities on a specific day, not a permanent classification. The system re-assesses periodically, and the level changes based on observed performance alone. IRIS never uses your child's diagnosis to set their level or their pathway.",
    evidence_tier: 'STRONG',
    source: 'H2 + H1 (30) — supports model, profile changeable and re-assessable; architectural commitment',
  }),
  g({
    id: 'PG-WHAT-IRIS-IS-NOT',
    topic_ar: 'ما الذي لا يفعله IRIS',
    topic_en: 'What IRIS does not do',
    keywords: ['تشخيص', 'ذكاء', 'اختبار', 'طبي', 'نتيجة', 'diagnose', 'iq', 'test', 'medical', 'score'],
    guidance_ar: 'IRIS لا يشخّص، ولا يقيس الذكاء، ولا يعطي درجة معيارية أو نسبة مئوية أو عمرًا مكافئًا. ما يقدّمه هو وصف لأداء طفلك في أنشطة تعليمية محدّدة، يُستخدم لاختيار المستوى المناسب للتدريب. أي قرار تشخيصي أو إكلينيكي يحتاج مختصًا مؤهّلًا.',
    guidance_en: 'IRIS does not diagnose, does not measure intelligence, and does not give a standard score, a percentile, or an age equivalent. What it provides is a description of how your child performed on specific educational activities, used to choose a suitable practice level. Any diagnostic or clinical decision needs a qualified professional.',
    evidence_tier: 'STRONG',
    source: 'H4 (30) + doc 11 §8 + doc 12 §6 — hard product boundary',
  }),
];

export const GUIDANCE_BY_ID = Object.fromEntries(PARENT_GUIDANCE.map((x) => [x.id, x]));

export const GUIDANCE_META = {
  total: PARENT_GUIDANCE.length,
  validation_status: VALIDATION.RESEARCH_INFORMED_PROTOTYPE,
  specialist_review_status: SPECIALIST_REVIEW.NOT_REVIEWED,
  note_en: 'Derived from evidence documents 23–31. Not specialist-reviewed. Contains no medical, clinical, or therapeutic advice.',
  note_ar: 'مستخلص من وثائق الأدلة 23–31. لم تتم مراجعته من مختص. لا يحتوي على أي نصيحة طبية أو إكلينيكية أو علاجية.',
};
