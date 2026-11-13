# IRIS MVP — Implementation Handover

**Build date:** 22 August 2026
**Status:** demo-ready MVP. **Research-informed prototype — NOT clinically or educationally validated. No specialist has reviewed any content.**

---

## 0. The honesty statement (read this before the committee)

What you can truthfully say on Monday:

- IRIS decides a child's learning pathway from **their own measured performance**, never from their diagnosis — and this is **proven by a test that runs in front of you**, not asserted.
- The content is **research-informed prototype content based on the current evidence framework**.
- Every rule, threshold, and content item carries a visible label saying whether it is research-supported, an engineering assumption, or a research gap.

What you must **not** say:

- ❌ "The content is validated" — no specialist has reviewed it.
- ❌ "IRIS measures cognitive ability / IQ" — it produces no such construct.
- ❌ "Phonics causes a reading gain" — the evidence is an association, in Williams syndrome, at age 9, in English.
- ❌ "IRIS improves memory / attention" — WM training is documented **not** to transfer.

---

## 1. Files changed

### New — the specification engine layer (`src/iris/`)
| File | Implements |
|---|---|
| `src/iris/spec.js` | All constants + validation-status vocabulary, each tagged with its tier and source |
| `src/iris/engines/assessment.js` | Doc 11 — nine tasks, R-ASSESS-001…006, DPS, data-quality flags |
| `src/iris/engines/profile.js` | Doc 12 — R-PROFILE-001…008, intra-individual profile, confidence, levels |
| `src/iris/engines/goals.js` | Doc 13 — the six MVP goals, R-GOAL-001…007, mastery |
| `src/iris/engines/pathway.js` | Doc 14 — band classification, R-PATH-001…011, parent explanations |
| `src/iris/engines/progress.js` | Doc 16 — baseline, trend, level progress, re-assessment triggers |
| `src/iris/content/templates.js` | Doc 15 §3 — the 8 templates + declared modality pairs |
| `src/iris/content/contentBank.js` | Doc 15 §4 — 78 prototype items with full provenance metadata |
| `src/iris/content/validator.js` | Doc 15 §6 — the content gate |
| `src/iris/content/generator.js` | Doc 15 §1–2 — constraint-set → ActivityInstance |
| `src/iris/parent/guidance.js` | Parent guidance knowledge base (12 entries, each with tier + source) |
| `src/iris/parent/chatbot.js` | Rule-based + retrieval chatbot with safety routing |
| `src/iris/parent/explain.js` | Parent-facing text, banned-term guarded |
| `src/iris/demo/scenarios.js` | Scenarios A / B / C, all synthetic |
| `src/iris/journey.js` | Orchestrator — the only place `condition` is read |

### New — UI (`src/App/components/iris/`)
`IrisFlow.tsx` (shell) · `IrisAssessmentScreen.tsx` · `IrisActivityScreen.tsx` · `IrisParentDashboard.tsx` · `IrisParentChat.tsx` · `BlindnessDemoScreen.tsx` · `src/App/contexts/IrisContext.tsx` · `src/App/IrisRoot.tsx`

### Changed
| File | Change |
|---|---|
| `src/main.jsx` | Entry now mounts `IrisRoot` (IRIS flow default, legacy app still reachable) |
| `src/App/constants/syndromeRules.ts` | **Diagnosis→pedagogy table removed.** Single neutral default; `getRulesForCondition` ignores its argument |
| `src/App/utils/learningSequences.ts` | **Diagnosis→sequence map removed**, plus two misattributed citations |
| `src/App/logic/CognitiveEngine.ts` | Replaced by the engines; methods now throw with a pointer |
| `src/App/utils/syndromeHelpers.ts` | Now diagnosis-blind; `getFeedbackType` always multimodal |
| `src/App/components/AIAssessmentScreen.tsx` | **Fake IQ + diagnosis bonus removed.** Now a disabled stub explaining why |
| `src/App/contexts/AppContext.tsx` | `iqScore` removed; both IQ-fabrication paths deleted; dead `localhost:8000` calls neutralised |
| `src/App/components/ShadowMatchScreen.tsx` | `auditoryHook` branch removed |
| `server/server.js` | Rewritten — bcrypt, tokens, ownership checks, consent gate, new domain routes |
| `server/models/User.js` | Password column documented as a hash; consent fields added |
| `package.json` | `react`/`react-dom` promoted to real dependencies; `test` and `demo` scripts added |
| `.gitignore` | Now excludes `database.sqlite`, `dist`, `.env` |
| `index.html` | `initial-scale=9.0` → `1.0` |

### New — server models
`server/models/Child.js` · `server/models/AssessmentRecord.js` · `server/models/ActivitySession.js`

---

## 2. Files intentionally preserved

Reused as-is because they are good and conflict with nothing:

- `src/App/contexts/LanguageContext.tsx` — full ar/en dictionary with correct RTL
- `src/App/contexts/AudioContext.tsx` — TTS with an Arabic voice-preference chain
- `src/App/components/ui/**` — the 49-file shadcn kit
- `PlayfulBackground`, `SplashScreen`, `GlobalControls`, `TransitionScreen`
- All 14 content screens and 4 games — reachable via the legacy route, no longer driving pedagogy
- `MasterCurriculum.ts` — untouched
- Community feed / bookings — preserved and now authenticated (still out of MVP scope)
- **Every document in `research_deliverables/` — completely untouched.**

---

## 3. Files replaced / deprecated

None deleted. Five files were converted into documented shims that explain what
was removed and why: `syndromeRules.ts`, `learningSequences.ts`,
`CognitiveEngine.ts`, `syndromeHelpers.ts`, `AIAssessmentScreen.tsx`.

---

## 4. Tests added — `tests/iris.test.js` (55 tests)

Run with `npm test`.

| Group | Tests | Covers |
|---|---|---|
| Diagnosis blindness | 4 | **TEST-PATH-BLIND**, TEST-PROFILE-BLIND, source-level scans |
| Band classification | 3 | totality over 2,121 input pairs, exact cut-points |
| Determinism | 3 | decisions (×50), activity generation, DPS |
| Mastery | 4 | 2-consecutive-HIGH, incomplete, engagement exclusion, level scoping |
| Adaptation ordering | 8 | simplify-before-demote, modality partner, no-partner fallback, backstep, consolidate, engagement |
| Assessment / DPS | 5 | floor→null, insufficient→null, hints, no-IQ, R-ASSESS-006 |
| Profile | 4 | level bands, not-determined, flat guard, low-confidence reduction |
| Content | 11 | six goals only, template/item coverage, symmetry, approval gate, validator rejections |
| Parent safety | 7 | medical/diagnosis routing, honest fallback, tiers, no banned terms, no diagnosis in explanations |
| End-to-end | 6 | scenarios A/B/C, full journey traceability, synthetic labelling |

## 5. Test results

```
npm test        →  # tests 55   # pass 55   # fail 0
npm run build   →  ✓ built in 5.11s
npm run demo    →  Scenario C: IDENTICAL OUTCOMES ACROSS ALL 5 DIAGNOSES ✅ PASS
```

Browser walkthrough (headless Chromium, `node e2e.mjs`) — intake → assessment
(44 items) → profile → 3 sessions → parent dashboard → chatbot → committee demo.
No application errors. The only two console errors are `ERR_TUNNEL_CONNECTION_FAILED`
from the Google Fonts CDN, which is blocked in the build sandbox and will
resolve normally on your machine.

Server security smoke tests, all passing:

| Check | Expected | Result |
|---|---|---|
| `GET /api/users` (the open dump) | 410 removed | ✅ 410 |
| Unauthenticated user read | 401 | ✅ 401 |
| Register without consent | 403 | ✅ 403 |
| Login with wrong password | 401 | ✅ 401 |
| Authenticated read of own record | 200 | ✅ 200 |
| Authenticated read of **another** user | 403 | ✅ 403 |
| Password stored as bcrypt hash | yes | ✅ `$2a$12$…` 60 chars |
| Password present in any response | no | ✅ absent |

---

## 6. Demo scenarios and results

### Scenario A — successful progression
```
session 1: band=HIGH acc=100% → R-PATH-003b CONSOLIDATE_HIGH  L1→L1
session 2: band=HIGH acc=100% → R-PATH-003  ADVANCE_MASTERY   L1→L2
```
One HIGH consolidates; two consecutive HIGH sessions meet mastery and advance.

### Scenario B — struggling child
```
session 1: band=LOW acc=33% → R-PATH-002 HOLD_LOW_CONFIDENCE  L1→L1
session 2: band=LOW acc=33% → R-PATH-005 SIMPLIFY_SCAFFOLD    L1→L1
session 3: band=LOW acc=33% → R-PATH-006 MODALITY_SHIFT       [TPL-PICK_PICTURE → TPL-PICK_WORD]
session 4: band=LOW acc=33% → R-PATH-007 PREREQ_BACKSTEP
ordering check: simplify before level reduction = true
```

### Scenario C — diagnosis blindness (the headline)
Five diagnoses, identical performance:

| Diagnosis | Goal | Level | Pathway | Next activity | Accommodations |
|---|---|---|---|---|---|
| DOWN_SYNDROME | G-LANG-PHON | 1 | CONSOLIDATE→ADVANCE→CONSOLIDATE | `ACT-G-LANG-PHON-L2-…` | EXTENDED_TIME, SIMPLIFIED_INSTRUCTION, AUDIO_REPEAT |
| WILLIAMS_SYNDROME | G-LANG-PHON | 1 | *identical* | *identical* | EXTENDED_TIME, REDUCED_ANIMATION, MUTED_BACKGROUND_AUDIO |
| OTHER / FRAGILE_X / AUTISM | G-LANG-PHON | 1 | *identical* | *identical* | EXTENDED_TIME |

**Only the accommodations differ.** They affect timing and presentation, never
scoring or the pathway.

---

## 7. What is genuinely working

- Nine-task screening producing per-sub-measure DPS, with floor and
  insufficient-item handling that returns `null` ("not measured"), never zero.
- Intra-individual profile: relative strengths/support areas, flat-profile
  guard, confidence, level placement with low-confidence reduction.
- Goal selection across the six MVP goals with balanced support/strength pairing
  and the single prerequisite rule.
- Full adaptive pathway: all 11 rules, ordered, each producing a persisted,
  auditable decision with a fixed parent explanation.
- Content engine: 8 templates, 78 items, deterministic generation, validator
  that blocks constraint mismatches, unapproved items, banned terms, and any
  diagnosis name in child-facing text.
- Parent Mode: progress dashboard, per-goal status, decision explanations,
  session history, screening summary with the mandated disclaimer.
- Parent chatbot: 12-entry knowledge base, safety routing for
  medical / diagnosis / emergency / therapy-plan questions, honest fallback.
- Bilingual ar/en with correct RTL throughout; TTS on every prompt.
- Server: bcrypt auth, bearer tokens, ownership checks, consent gate, and
  tables for children, assessments, sessions, and decisions.

## 8. What is mocked or simplified

| Item | Status |
|---|---|
| Assessment task delivery | Simplified: touch-select recall items stand in for true sequence-presentation and 60-second timed detection. The **scoring** is the real doc 11 implementation. |
| Session persistence in the demo | The demo flow keeps state in React memory. Server routes for `/api/sessions` and `/api/assessments` exist and work but the demo does not require the backend to run. |
| Auth tokens | Signed, expiring, **in-memory**. Adequate for a local demo, not production. Restarting the server invalidates sessions. |
| AI service | **There is none, and none is faked.** The old `localhost:8000` calls are removed. The chatbot is rule-based retrieval by design, and says so on screen. |
| Content volume | 78 items — enough to demonstrate all 24 goal-levels without repetition in a demo, not a full corpus (doc 15 §4 asks for ~150). |
| Attention task | Rendered as discrete trials rather than a continuous timed run. |

## 9. What remains specialist-dependent

Nothing below has been validated. All of it is flagged in the UI and the data.

1. **Every numeric threshold**: band cut-points (0.50 / 0.80 / 0.70), mastery
   (2 sessions), DPS weights (0.50/0.30/0.20), ±8 discrepancy, level bands,
   adaptation cadence, engagement-flag thresholds.
2. **All 24 level ladders** — plausible sequencing, never calibrated.
3. **`G-ATT-SUSTAIN` in its entirety** — sits on a named research gap; no source
   supplies any attention duration or distractor level.
4. **Arabic phonics** — the phonics evidence is English-orthography only. This is
   the single most important question in `33_IRIS_SPECIALIST_REVIEW_PACK_AR.md`.
5. **`G-MEM-VISUAL`** — the DS "visual strength" premise is contested in the
   corpus; the WS justification is inferred, not tested for this paradigm.
6. **All 78 content items and all 12 guidance entries** — drafted, never reviewed.
7. **Parent-facing wording** — tone and appropriateness need a professional read.

---

## 10. Running the MVP locally

```bash
# 1. Frontend (this is all the demo needs)
npm install
npm run dev            # → http://localhost:5173

# 2. Verify before presenting
npm test               # 55 tests, must be 55 pass / 0 fail
npm run demo           # prints scenarios A/B/C, must end "✅ PASS"

# 3. Backend (optional — the demo runs without it)
cd server && npm install
DB_ALTER=true npm start        # first run only, creates tables
npm start                      # subsequent runs

# 4. Production build
npm run build && npm run preview
```

**The demo does not need the backend, the network, or any external service.**
If the venue Wi-Fi fails, everything still works.

**One caveat worth knowing:** if you tap answers faster than ~600 ms, R-PATH-010
flags the session as possible random tapping and skips the adaptation (by
design — a wrong guess must never cost a child a level). Answer at a natural
pace during the demo, or use the committee-demo screen, which is precomputed.

---

## 11. Arabic demo script — نص العرض للجنة

> **مدة العرض: ٧–٩ دقائق.** ابدئي من شاشة «عرض توضيحي للجنة» إن كان الوقت ضيقًا.

**١. الافتتاح (٤٥ ثانية)**

«IRIS تطبيق تدريب تعليمي للأطفال ذوي متلازمة داون ومتلازمة ويليامز حول عمر ٧ سنوات. الفكرة المحورية بسيطة: **النظام يقرر ماذا يقدّم للطفل بناءً على أداء الطفل نفسه، لا بناءً على تشخيصه.** هذا ليس شعارًا — سأثبته لكم بعد قليل باختبار يعمل أمامكم.»

**٢. لماذا هذا مهم (دقيقة)**

«الفكرة الشائعة أن متلازمة داون تعني «متعلّم بصري» وأن متلازمة ويليامز تعني «متعلّم لغوي». راجعنا اثني عشر مصدرًا علميًا، ووجدنا أن الادعاء الأول **مرفوض ثلاث مرات داخل الجداول التي تستشهد بها المصادر نفسها**، وأن الادعاء الثاني هو تحديدًا ما تصحّحه هذه الأدبيات. الأخطر: لو بنينا النظام على هذه الافتراضات، فالطفل الذي لا يطابق «النمط النموذجي» — وهم كثيرون — سيحصل على محتوى خاطئ من اليوم الأول.»

**٣. رحلة الطفل (٣ دقائق) — شاشة الدخول**

«أدخل اسم الطفل والتشخيص. لاحظوا التنبيه: **التشخيص هنا يُفعّل التسهيلات فقط** — وقت إضافي، إعادة الصوت، تقليل الحركة. لا يدخل في الدرجة ولا في اختيار الأسئلة ولا في المستوى.»

*ابدئي أنشطة التعرّف، أجيبي على ٤–٥ أسئلة بوتيرة طبيعية، ثم انتقلي.*

«هذه أنشطة تعرّف، وليست اختبار ذكاء. لا تنتج درجة ذكاء ولا نسبة مئوية ولا عمرًا مكافئًا — وهذا مكتوب صراحةً على الشاشة كتنبيه إلزامي.»

*عند شاشة النتيجة:* «النظام يقارن الطفل **بنفسه**، لا بأطفال آخرين، لأننا لا نملك عيّنة معيارية ولا يجوز أن ندّعي امتلاكها. ثم يختار هدفين: واحد من مجال يحتاج دعمًا، وواحد من مجال أقوى.»

*شغّلي جلسة تدريب، ثم عند شاشة النتيجة:* «لاحظوا: كل قرار يظهر مع **رقم القاعدة** التي أنتجته وسببها. لا يوجد تكيّف صامت في IRIS.»

**٤. وضع الوالدين (دقيقة ونصف)**

«الأم ترى: على ماذا يتدرّب طفلها، في أي مستوى، وكيف كان أداؤه — بلغة بسيطة. ولاحظوا الجملة: *«حقّق طفلك أداءً مرتفعًا في آخر جلستين، لذلك انتقلنا للمستوى التالي»* — السبب دائمًا **الأداء**، وليس التشخيص أبدًا.»

*افتحي «اسألي IRIS» واسألي: «هل أعطي طفلي دواء للتركيز؟»*

«هذا سؤال طبي. لاحظوا أن النظام **يرفض الإجابة** ويحيل لمختص. الشات بوت عندنا قائم على قاعدة معرفة معتمدة وليس نموذجًا توليديًا — وهذا قرار سلامة مقصود: لا يستطيع أن يخترع مرجعًا علميًا أو ادعاءً طبيًا، لأنه لا يملك إلا ما كُتب فيه.»

*اسألي: «كم يجب أن تكون مدة الجلسة؟»*

«وهنا الأهم: النظام يجيب **«لا نعرف»**. لا يوجد في مجموعة الأدلة كلها أي مصدر يحدّد مدة جلسة لأي من المتلازمتين في أي عمر. صنّفنا هذا كـ`RESEARCH_GAP` ورفضنا اختراع رقم.»

**٥. الإثبات — عمى التشخيص (٩٠ ثانية)**

*افتحي «عرض توضيحي للجنة» ← تبويب «ج».*

«هذا هو جوهر المشروع. شغّلنا المحرّكات الحقيقية خمس مرات: **نفس بيانات الأداء تمامًا، وتشخيص مختلف في كل مرة.** النتيجة: نفس الهدف، نفس المستوى، نفس قرارات المسار، نفس النشاط التالي. الفرق الوحيد هو عمود التسهيلات على اليسار.

وهذا ليس عرضًا مُعدًّا مسبقًا — إنه اختبار اسمه `TEST-PATH-BLIND` يعمل في كل مرة نبني فيها المشروع، وإذا فشل **يتوقف البناء بالكامل**. جعلنا هذا المبدأ خاصية تقنية قابلة للاختبار، لا وعدًا في مستند.»

**٦. الخاتمة والصدق العلمي (٤٥ ثانية)**

«ثلاث نقاط أريد أن أكون واضحة فيها:

أولًا، **المحتوى الحالي محتوى أوّلي مبني على إطار الأدلة، ولم يراجعه أي مختص بعد.** لم ندّعِ خلاف ذلك في أي مكان في التطبيق.

ثانيًا، كل رقم في النظام مُصنَّف: إما مدعوم بحثيًا، أو افتراض هندسي، أو فجوة بحثية — والتصنيف ظاهر في الواجهة نفسها. مثال: هدف الانتباه المستمر مكتوب أمامه `RESEARCH_GAP` لأنه لا يوجد دليل على المدد الزمنية.

ثالثًا، المرحلة التالية محدّدة وجاهزة: أعددنا حزمة مراجعة تخصصية كاملة بالعربية (٥٠ صفحة) لإرسالها للمختصين. المحتوى المعتمد سيدخل بنك المحتوى بحالة `APPROVED`، والنظام مبني أصلًا بحيث لا يُعرض على الطفل أي محتوى غير معتمد.

بنينا نظامًا يعرف حدوده. وهذا في مجال يتعامل مع أطفال ذوي إعاقة أهم من نظام يدّعي ما لا يستطيع إثباته.»

---

### أسئلة متوقّعة وإجابات قصيرة

**«هل جرّبتموه على أطفال حقيقيين؟»**
«لا. كل البيانات في العرض تركيبية ومُعلَّمة `is_synthetic`. التجريب على أطفال يحتاج موافقة أخلاقية ومراجعة مختصين — وهي المرحلة التالية.»

**«ما الذي يثبت أن النظام لا يستخدم التشخيص؟»**
«ثلاثة أشياء: دوال المحرّكات لا تستقبل التشخيص كوسيط أصلًا، واختبار آلي يفشل البناء إذا تسرّب، وسيناريو «ج» الذي رأيتموه.»

**«لماذا الشات بوت ليس ذكاءً اصطناعيًا توليديًا؟»**
«لأنه يخاطب أهل أطفال ذوي إعاقة. النموذج التوليدي قد يخترع مرجعًا أو ادعاءً طبيًا بطلاقة تامة. اخترنا الاسترجاع من قاعدة معرفة لأنه لا يستطيع أن يقول إلا ما راجعناه.»

**«كم استغرق هذا؟ وما المتبقّي؟»**
«المتبقّي واضح ومكتوب: مراجعة المختصين للعتبات والمحتوى، ثم توسيع بنك المحتوى، ثم تجريب مُشرَف عليه. لا يوجد شيء في النظام يدّعي أنه اجتاز هذه المراحل.»
