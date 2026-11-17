# IRIS — Research Framework: Implementation Report

Date: 2026-11-14 · Branch `feature/iris-unification` @ P57 · Live: https://iris-kohl-seven.vercel.app

## What was built (in the approved flow order)

REGISTER → VERIFY EMAIL (OTP) → FAMILY FILE (caregiver questionnaire) →
LADDER ASSESSMENT → FIRST PLAN → PARENT HUB → CHILD MODE.

Every protected screen is gated: a family that has not completed the
earlier stages is walked straight into the next one — they cannot reach
the hub, the snapshot or child mode without the assessment evidence.

### 1. Family File (caregiver questionnaire)
- 72 items from `src/iris/caregiver/bank.js` in themed blocks with
  intro cards, a quick-review step, bilingual copy, read-aloud,
  age-visibility and support-triplet follow-ups, per the framework.
- One flat step list (block intro → items → review); suspension is
  always available (home chip) — every answer is autosaved.
- Persistence: local mirror (per-answer) + server draft
  (`POST /api/caregiver/draft`) with 800 ms debounced IN_PROGRESS
  autosave and a final COMPLETE on submit. A late in-flight autosave
  can no longer clobber the COMPLETE write (race fixed with a
  submitted-flag + timer cancel).
- Scoring engine `src/iris/caregiver/scoring.js` produces the support
  profile (strands, intensities, priorities) — never a score, IQ,
  composite or total; the QA suite asserts those keys do not exist.

### 2. Ladder assessment (existing engine, new chrome)
- Predictable pacing and kid-friendly breaks: a session cap asks
  «يلا نكمّل ولا بريك طويل؟», a ✋ break chip is always visible, and
  mid-run progress is drafted server-side.
- Listen items play the bank's recorded Arabic clip (TTS fallback),
  letter items no longer show shape glyphs as distractors.
- Results are saved as `assessment_kind='LADDER'` records.

### 3. First Plan (`خطة الأسبوع`)
- Rendered right after the ladder (forced route `ladder-plan`): what
  IRIS read from the family file + ladder, this week's focus areas,
  starting levels, home ideas, and honest low-confidence notes.
- Primary CTA enters child mode; the parent path returns to the hub.

### 4. Kind-filtered API
- `GET /api/assessments/:childId?kind=LADDER|CAREGIVER` — legacy rows
  default to LADDER; CAREGIVER rows only answer framework questions.
- Draft upsert per child (`id DESC` newest wins), child-ownership
  guards on every write (`childBelongsToUser`).

## QA evidence (real Chromium, local stack)
`node scripts/qa-family-flow.mjs` → **16/16**:
register → OTP → FORCED family profile → full 72-item completion →
FORCED ladder (tap-count and break-overlay aware player) → done →
FIRST PLAN → hub → family-profile view → reload past gates →
CAREGIVER record + no-score envelope + LADDER filter + draft COMPLETE.

Regression: `qa-auth-flow.mjs` 47/47 (BB seeded past the family file
to model a fully onboarded returning user), engine tests 179/179,
landing interaction suite green.

Production (Vercel + blob-persisted SQLite): register sends a real
OTP email; draft POST/GET and kind filters verified live.

## Key files
- `src/iris/caregiver/{bank,scoring,merge}.js`, `tests/iris.caregiver.test.mjs`
- `src/App/components/CaregiverProfileScreen.tsx` (+ caregiver-profile.css)
- `src/App/components/iris/IrisFirstPlan.tsx`, `IrisFamilyProfile.tsx`
- `server/server.js` — `/api/caregiver/draft`, kind filter, observation storage
- `src/App/App.tsx` — `assessmentGate()` + `firstAssessmentPending` routing
- `docs/research/ASSESSMENT_FRAMEWORK.md` — the design this implements

## Known limits (documented, not hidden)
- The framework is a support-planning instrument, not a diagnosis; the
  UI says so in the family's language on the plan and hub.
- Question count is adaptive (age visibility), so the review counts
  answered blocks rather than forcing all 72.
- On the free hosting tier the DB is snapshot-synced; very recent
  writes can take seconds to mirror.


---

# cv2 Implementation — the short Family File (November 2026)

This section supersedes the cv1 questionnaire for NEW families. cv1 remains fully intact for records and in-progress drafts already collected under it.

## What shipped
- `src/iris/caregiver/bankV2.js` — the cv2 bank exactly as approved in `PARENT_ASSESSMENT_CV2_FINAL_DRAFT.md`: 4 conversational blocks (V-A communication, V-B learning/independence/mobility, V-C people/feelings, V-D world/interests), 13 always-on questions + VQ13 (pre-academic, only age ≥ 60 months) + a final display-preference question, all in Egyptian-conversational Arabic with English mirrors. No gates, no triplets: the opportunity option is visible inside every scale, and support detail collapsed into two nested follow-ups (VQ5f parts → VQ5h helper).
- `src/iris/caregiver/scoringV2.js` — an adapter that maps every cv2 answer to the legacy cv1 codes it stands for and runs the UNCHANGED cv1 scoring engine. Results are re-stamped `bankVersion: 'cv2'` with honest completeness (core answered / core shown, probes counted separately), care flags, and timing metrics. S/M domain confidence is capped at MEDIUM by design — cv2 asks shallower probes there.
- Care card: ticking «مش لاقي يطلّع اللي جواه فيؤذي نفسه» (VQ8) inserts a calm, nonjudgmental card right after the answer. It states that nothing is scored or judged, recommends talking to the clinician already following the child if the concern recurs or escalates, and continues the flow with one press. It is stored as a descriptive `careFlags` metadata value — never a score.
- Display preference moved OUT of the child profile: the last Family File question is a UI preference (text/audio/both, default both); it is persisted in `iris_display_pref`, re-editable in Parent Settings under its own plate that states explicitly it never changes the family file, and it gates auto-narration in child activities. It contributes nothing to ability states.
- Question counter counts CORE questions only — conditional probes display as «سؤال متابعة» and never inflate the denominator, so the on-screen promise «١٥ سؤال قصير على الأكثر» holds on every path (the maximum reachable is exactly 15).
- Timing promise: the intro no longer claims minutes (validation evidence pending); the engine records `durationSeconds`, probes shown and care-card shown per submission as anonymised metrics alongside the existing no-PII payloads.

## cv1 compatibility guarantees (verified in QA)
- Families with a COMPLETED cv1 profile are never re-asked (the gate reads the stored record, version-agnostic).
- In-progress cv1 drafts resume on the cv1 bank: the draft's stamp wins; un-stamped drafts are inferred by response-key shape (`VQ…`/`VPREF` vs legacy `C1…X6`) — no server schema change was needed.
- Submitting a resumed cv1 draft scores and stamps as `cv1` (regression-tested end to end).
- The 13-14 question cv2 walk produces the same downstream contract (domain states, access settings, interests, plans) that the ladder, First Plan and personalization already consume.

## QA evidence (local stack, deterministic scripts)
- `scripts/qa-cv2-flow.mjs` — 31/31: forced cv2 intro; every conditional probe fires on its condition and NOT on unmet ones (speech probe suppressed for non-verbal channel; senses probe via AND-condition; nested parts+helper probes; opportunity follow-up); care card shown and calm; age gate hides VQ13 at 3 years; preference is last; denominator never > 15; scored record proves cv2 stamp, careFlags, metrics, honest completeness, no score keys, S/M confidence capped; preference stored outside assessment; cv1-era draft resumes and submits as cv1.
- `scripts/qa-family-flow.mjs` — 16/16 on cv2: full chain registration → Family File → forced ladder → First Plan → hub → family view → reload hydration → API kind/idempotency proofs.
- `scripts/qa-auth-flow.mjs` — 47/47 auth/verification/gate scenarios.
- Engine unit tests: `tests/iris.caregiverV2.test.js` (9) + full suite 188/188; `npm run build` clean.

## Validation plan (timing claim)
2–3 minutes remains a TARGET, not a proven figure. Every cv2 submission now carries `metrics.durationSeconds` + probe counts. After ≥ 20 real family sessions, median wall time will be computed; only then may a minutes claim appear in copy (refinement 5 of the approved draft).

---

## P61 — Onboarding-Gate Integrity Fix (2026-11-15)

**المنشأ:** بلاغ مستخدم — حساب جديد على الإنتاج دخل التطبيق مباشرة بدون ملف العائلة (cv2) وبدون تقييم الطفل.

**الأسباب الجذرية (ثلاثة متراكبة):**
1. **تداخل بيانات الأجهزة المشتركة:** مرايا localStorage (ملف العائلة، مسودّة التدرّج، النجوم…) كانت مفهرسة برقم الطفل فقط بلا وسم حساب — جهاز فيه بقايا جلسات اختبار سابقة يستطيع حساب جديد أن يرث منه "إكمال" البوابات.
2. **بوابة أضعف مما يجب:** `caregiverChecked` وحده كان يفتح اللوحة؛ لم يكن مطلوباً وجود سجل فعلي `scored`.
3. **علّق SMTP في الإنتاج:** `/api/register` كان ينتظر رسالة التحقق بلا أي مهلة؛ انقطاع Gmail↔Vercel يجمّد الطلب لدقائق بينما الحساب يُنشأ فعلاً — فيبدو التسجيل "مكسورًا" ويلجأ المستخدم لتسجيل الدخول بحالة جهاز ملوثة.

**الإصلاحات:**
- `iris_owner_email`: وسم هوية على الجهاز؛ حارس تزامن في أول render + `ensureOwnerBoundary()` قبل أي token في registerUser/loginUser — أي تبديل هوية يمحو المفاتيح الحسابية (ملف الطفل/العائلة/المسودّات/النجوم/الأفاتار/تغذية المراحل) مع إبقاء تفضيلات الجهاز (لغة/حركة/صوت/عرض). وسم `owner` لكل قيد عائلة، و`caregiverForChild` يرفض قيد الحساب الآخر. الوسم يبقى بعد الخروج (الدليل على الملكية).
- البوابة الآن `caregiverChecked && caregiver?.scored` معًا.
- مهلات nodemailer صارمة (5s اتصال/تحية، 8s socket): التسجيل يرد خلال ثوانٍ ويصريح بالفشل مع زر إعادة الإرسال — لا تعليق بعد اليوم.
- فحوص دائمة: `scripts/qa-account-switch.mjs` (عائلتان، جهاز واحد — B تُجبَر على ملف العائلة وتُمحى مرايا A) و`scripts/vis-p61-prod.mjs` (برهان الإنتاج بلقطة شاشة).

**التحقق على الإنتاج (بعد النشر index-DIhuilLW.js):**
- register جديد: **201 خلال 4.2 ث، verification.sent=true عبر SMTP الحقيقي**.
- محاكاة حالة المستخدم (مرآة عائلة مزوّرة تحت id الطفل نفسه + owner غريب): **تمحوها البوابة عند الإقلاع، والشاشة الظاهرة = تأكيد البريد — لا اللوحة**. PASS/PASS.
- البطارية الكاملة المحلية: unit 233/233، auth 47/47، cv2 35/35، family 16/16، av2 28/28، nav 27/27، account-switch PASS.

**توافق cv1:** السجلات المكتملة على السيرفر لا تتأثر إطلاقًا — المحو يمسح المرايا المحلية فقط، والمياهرة تعيد-load من السيرفر لحسابها الشرعي.

---

## P70 — توحيد صوت التطبيق كله (١٧ نوفمبر ٢٠٢٦)

**الطلب:** صوت التطبيق بالكامل يبقى نفس صوت البنت اللي بتسأل الطفل في التقييم.

**التنفيذ:**
- نفس الصوت بالظبط: `ar-eg-tutor-11` (اللي اتسجلت بيه أسئلة الطفل من P45)، نفس الأسلوب "دافئ ومتمهل".
- مسح كامل لكل نص عربي منطوق في التطبيق: ٢٦٧ نص أسئلة/تلميحات الطفل + ١٧ عبارة واجهة (تهاني، فواصل، شاشات) + ١٥ سؤال ملف العيلة = **٢٩٩ عبارة**، سُجّل منها **٢٩٨** (سؤال تفضيل العرض VPREF اتشيل من الملف أصلًا — بقى في الإعدادات بس، وده المطلوب رقم ٥ في cv2).
- خط أنابيب قابل للتكرار بالكامل: `scripts/collect-speech-strings.mjs` → توليد على ١٣ دفعة → `p70-aligncut2.mjs` (محاذاة على نص Whisper حرف-بحرف مع قفز الأرقام و"لوك" على فواصل الصمت) → `p70-verify.mjs` (تفريغ صوتي لكل مقطع والتأكد إنه بيقول النص الصح) → إصلاح ٢٧ مقطع فرديًا `p70-solo-ingest.mjs` → `p70-manifest.mjs` (يولّد `fileClips.generated.ts` ويدمجه في جدول المقاطع).
- **٢٧ مقطعًا** اتولّدوا كل واحد لوحده بعد ما التحقق كشف بهم دمج/صمت، واتأكد منهم تاني بالتفريغ — الكل سليم.
- إصلاح تاعور مهم: الإيموجي في نصوص الطفل (🐶 ⚽ …) كان بيطير من النص المنطوق فـ**سؤالين ذاكرة مختلفين يتحدوا في مقطع واحد**؛ الآن `speechText.js` **يقرأ الإيموجي ككلمة** ("الكلب"، "الكورة"…) قبل التنضيف، وبنفس المنطق وقت التشغيل — فكل مفتاح مطابق تمامًا.
- التغطية وقت التشغيل متضمَّنة: كل نص بيمر على `speak()` بيمر على نفس دالة التنضيف — اختبار آلي `p70-coverage.mjs` بيثبت إن مفاتيح البنك/ملف العيلة كلها موجودة في الجدول.

**التحقق:**
- حزمة av2 الحيّة بتأكد إن الطفل وقت التقييم الفعلي بيسمع **مقاطع mp3 مسجلة فعلية** (٥ مقاطع مميزة في جلسة واحدة) مش صوت متصفح.
- npm test ٢٦٨/٢٦٨، بناء الإنتاج سليم، والتسجيل الصوتي لكل مقطع معمول بالتفريغ الآلي.

**حدود صريحة:** التحقق هنا آلي (تطابق نص-كلام). فحص مستمع بشري عيّنة عشوائية ٢٠ مقطع يفضل الخطوة الجاية وقت اختبار الأهالي الحقيقي، وده مسجل في خطة الـvalidation زي ما اتفق.

### حالة النشر (P70)
- الكوميت `03e7d522` متدفع على `feature/iris-unification` ومنشور على الإنتاج `https://iris-kohl-seven.vercel.app/` (deploy `iris-l1ji3u28g`) — المقاطع الجديدة (src340 مثالًا) تُخدَم 200 من الرابط الرسمي، وجدول المفاتيح مضمَّن في حزمة الإنتاج، و`/api/health` سليم.

---

## P71 — توحيد صوت التطبيق بالكامل (2026-11-17)

### الهدف
أي كلمة يُنطق بها التطبيق (عربية) تخرج بنفس صوت البنت المصرية المستخدمة في أسئلة تقييم الطفل
(`ar-eg-tutor-11`)، بدل خليط TTS المتصفح وأصوات أخرى.

### التنفيذ
- حصاد كل نصوص المنطوقة من كل الشاشات (بنك cv2، السلالم، الأنشطة، القصص، الأغاني،
  المهارات الحياتية، الشارّة، الرسائل، الشارات، الأدلة الإرشادية) عبر `scripts/p71-collect.mjs`.
- توليد دفعات كلام بنفس الصوت، ثم قصّها لمقاطع لكل عبارة:
  - `aligncut` (محاذاة رموز Whisper + صمت) → 389 مقطع دفعة.
  - `islands` (حدود صمت + تحقق رأس الكلمة ≥85%) لقوائم الكلمات b09/b10 → 50 مقطع.
  - 20 مقطعًا فرديًا regenerate للعبارات المركبة التي شردت فيها المحاذاة.
- التحقق: ASR عكسي لكل مقطع مع مصنّف يتحمّل تحريف Whisper للأصوات المفردة،
  وفحص مدة مقابل طول النص. التغطية النهائية: 687/688 مفتاح (المفقود واحد = سؤال VPREF
  المحذوف من ملف الأسرة حسب القرار السابق، وهو مقصود).
- وقت التشغيل: `AudioContext` يعطي الأولوية للمشغّل الملفي عبر `fileClips` (687 مدخلًا)،
  مع `cleanSpeechText` موحّد (إيموجي تُقرأ ككلمات، نقاط تُزال)، و`speakParts` للتسلسلات.
- الصوت الناتج مطابق لصوت أسئلة التقييم لأنه نفس Voice ID ونفس النموذج.

### دفعة P71b — حادثة تلويث Snapshot الإنتاجي (موثّقة للشفافية)
- السبب: بيئة QA ورثت `BLOB_SYNC=1` + توكن Blob فارتبطت بمفتاح الإنتاج الافتراضي.
- الأثر: حسابات اختبار QA (13 حسابًا) تسرّبت لنسخة الإنتاج + فشل جزئي لاختبارات المتصفح وقتها.
  لم تُفقد أي بيانات حقيقية: جُرفت حسابات QA وحدها، وبقيت 11 عائلة حقيقية ببياناتها وسِجلاتها.
- العلاج: تنظيف الـ snapshot وإعادة رفعه + حارس برمجي في `blobsync.js` يمنع أي عملية غير-Vercel
  من ربط مفتاح الإنتاج الافتراضي (يستلزم BLOB_SNAPSHOT_KEY صريحًا لاختبارات التعدّد).
- القاعدة الجديدة: كل إقلاع خادم محلي يتم بـ `env -u BLOB_SYNC -u BLOB_READ_WRITE_TOKEN`.
