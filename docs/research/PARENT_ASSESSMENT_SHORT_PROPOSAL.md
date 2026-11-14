# IRIS — Parent Assessment: Length Audit & Short-Version Proposal

Status: **PROPOSAL — production untouched, awaiting approval** (§5)
Date: 2026-11-14 · Bank audited: `cv1` (54 base items + 18 follow-ups) · Tooling: `scripts/audit-bank.mjs`, `scripts/simulate-parent-experience.mjs`

---

## 1. Audit of the actual parent experience

We did not count the bank; we replayed the implemented `buildSteps()` logic
(age visibility, opportunity gates, conditional follow-ups) in a simulator
against the real bank, for 6 age groups × 3 answer profiles.

**Why the real number is higher than "54 base":** 12 items are
`gate_ability` — each renders a **separate gate screen first** (13 gate
steps incl. the opportunity chip), then the ability screen. A "supported"
answer additionally opens the **support triplet** — 3 extra chip rows
(who helps / how often / how much time) inside that screen.

| Age | Min path (everything "no chance" / never) | Typical path | Max path (all probes fire) |
|---|---|---|---|
| 2–8 y | **53 questions** (13 gates + 40) | **≈74 answers** + ~23 triplet sub-rows = ~97 taps | **82 answers** + 25 triplets ≈ 107 taps |
| 9–14 y | **54 questions** | **≈76 answers** + ~24 triplets | **84 answers** + 26 triplets |

Age visibility removes almost nothing: only 1 item is age-gated in the whole
bank. Conditional follow-ups can add 0 → 18 questions depending on answers.

**Realistic completion time (measured model: 7 s/read+decide+tap per
question, 8 s per triplet, 4 s per block intro, +35 s chrome):**

| Path | Time |
|---|---|
| Minimum (all "no chance") | ~7 min |
| **Typical parent** | **~13 min** |
| Maximum (every probe) | ~16–18 min |

**Conclusion: the user's concern is confirmed.** The implementation is not
a 10–15-question instrument; it is effectively a 53–84-question one. The
"10–14 minutes" promise on the intro card was honest but is far from the
2–3 minute target.

---

## 2. Design principles for the short version

1. **One screen per domain.** The 4-level ability scale becomes the whole
   question; **"لسه ماخدش الفرصة" (hasn't had the chance) becomes a visible
   option inside every scale** instead of a separate gate screen — the
   opportunity-first principle survives with zero extra screens.
2. **The triplet collapses into ONE consolidated support question** ("where
   does he still need help?") that multi-selects domains — replacing up to
   25 triplet sub-rows with one screen.
3. **Auto-derived questions are removed**: who is answering (X4) and
   languages around the child (X1) come from registration + app language;
   the child's assent (X7) moves to child mode where the child actually
   taps it.
4. **Repeated signals merge**: "understands more than he can say" (C8)
   folds into the comprehension scale; soothing (P6) merges with what
   disrupts the day (P7/H3/H5/H6) into a two-field screen.
5. Arabic stays Egyptian-conversational; **3–5 short choices max** per question.

---

## 3. The proposed short assessment (cv2) — 13 core + 1 age-conditional + up to 4 follow-ups

Progress label: **سؤال ٣ من ١٤**. Single blue card, chips as answers,
read-aloud kept. All codes are the existing `v` codes so scoring maps 1:1.

### Core questions

**Q1 — إزاي بيقول اللي عايزه؟ (Communication — expressive)**
maps: C2 + C5 + C7 + C3
- كلام أو أصوات شبه كلام → `words` *(was C5)*
- يشير أو يحرك إيده أو جسمه → `gesture` *(C2/C3)*
- لوحة صور أو جهاز → `aac` *(C2/C9)*
- أنا فاهم طريقته وهو ما بيوضحش كتير → `hard_to_read` *(C7)*
- لسه ماوضحش / ماخدش فرصة → `not_yet` *(C2)*

**Q2 — بيفهم الكلام اللي حواليه قد إيه؟ (Communication — receptive)**
maps: C1 + C3 + C8
- بيفهم كل حاجة تقريبًا → `independent`
- بيفهم أوي، وخصوصًا لو مصحوب بإيماءة → `little_help` *(keeps C8 signal)*
- بيفهم حاجات معينة بس → `hands_on`
- بيفهم الروتين بس (وقت الأكل، وقت النوم) → `routine_only`
- لسه واضحش / ماخدش فرصة → `not_yet`

**Q3 — لو معاه كلمات، بيجمعها؟ (Expressive language level)** maps: C6 + C5
- كلمات وجُمل صغيرة → `sentences`
- كلمات كتير نسبيًا → `many_words`
- أصوات وشيل كلام قليل → `few_words`
- لسه كلامش، وبيوصل بطرق تانية → `no_words` → **opens F1**

**Q4 — في اللعب والأنشطة الجديدة (Learning & problem solving)** maps: L2 + L3 + L4
- يكمّل لوحده → `independent`
- بتلميح بس منهنا → `little_help`
- لازم حد يعمله خطوة خطوة → `hands_on`
- لسه ماخدش فرصة → `not_yet` → **opens F4**

**Q5 — لما يحتاج حاجة مش قدامه (Initiative)** maps: L5 + L1 + L6
- يوصلها أو يطلبها بطريقته → `independent`
- يطلب ويساعدوه → `little_help`
- يستنى حد يلحقها له → `hands_on`
- لسه ماخدش فرصة → `not_yet`

**Q6 — في الحاجات اليومية لوحده قد إيه؟ (Daily independence)** maps: S1 + S2 + S3 + S4
- يعمل أغلبها لوحده → `independent` → *(no follow-up)*
- يعمل نصها → `middle` → **opens F2**
- محتاج مساعدة في أغلبها → `hands_on` → **opens F2**
- لسه بنعملها له / ماخدش فرصة → `not_yet` → **opens F2**

**Q7 — الحركة وإيداه (Movement & access)** maps: M1 + M2 + M3 + M4 + H1 + H2
- بيتحرك كويس وبيستخدم إيده زي الملقة والقلم → `free`
- حركة الإيد أصعب من المشي → `hands_hard`
- المشي محتاج مسك أو كرسي متحرك → `walk_hard`
- الاتنين محتاجين ترتيب معاهم → `both_hard`
- بيوصل بطريقته هو لكل حاجة → `own_way` *(access-first framing)*

**Q8 — مع العيال والناس (Social & play)** maps: P1 + P2 + P3 + P5
- بيلعب مع عيال وتاني → `with_kids`
- يقعد جنبهم ويلتحق لما نتشجعه → `near_kids`
- يفضل لوحده أحسن → `alone_pref`
- يتضايق أو يهرب منهم → `avoids`

**Q9 — إيه اللي بيوقّع اليوم؟ (Emotional/behavioral + health + sensory — one multi)** maps: P7 + H3 + H5 + H6
Multi-select, chips: عناد أو ضيق شديد · خوف أو حساسية أصوات/خامات · بيؤذي نفسه · النوم مش ظابط · صحة أو أدوية بتأثر · مفيش أي حاجة *(none of these wins)* → picking calming items **opens F3**

**Q10 — إيه اللي بيرجّعه لوضعه الطبيعي؟ (Soothing — interests-fed)** maps: P6 + G2 + G3
Multi: حضن أو هدوء صوتنا · ياخد هو نفسه لوحده · حاجة بيحبها (أغنية/فيديو/ لعبة) · أكل أو لبس · لسه ماوصلناش لحاجة بتهدّي → **opens F3**

**Q11 — حاجاته اللي بيحبها واللي بيعملها حلو (Interests & strengths — one screen, two fields)** maps: G1 + G5
Field A: up to 5 interest chips (+free add). Field B: one strength in your words (opentext).

**Q12 — اليوم بتاعه بيبان إمتى؟ (Timing & setting)** maps: G4 + X2
Row 1 (when does he shine): الصبح · بعد المدرسة · آخر النهار · أي وقت
Row 2 (where his day happens): البيت بس · حضانة/روضة · مدرسة · مدرسة + جلسات

**Q13 — IRIS يعرض عليك إزاي (Interface + comfort)** maps: X5 + X6
- كلام مكتوب · صوت مسموع · الاتنين — one tap, plus the existing "مش وقت دلوقتي — كمّل بعدين" exit preserved.

**Q14 — (only if age ≥ 5y) تجربة الحروف والأرقام (Pre-academic exposure)** maps: L7 + X2-followup
- بتمرّن في البيت/المدرسة · فرصة قليلة · لسه مابتحاوليش · ماخدش فرصة → feeds starting ladder level.

### Conditional follow-ups (max 4, each ONE screen)

| Fires when | Question | Replaces |
|---|---|---|
| Q3 = no_words | **F1**: عندك في البيت أو المدرسة وسيلة تواصل (لوحة صور/إشارات/جهاز)؟ | C9 (+ its 3 probes) |
| Q6 ≤ middle | **F2**: محتاج مساعدة في إيه بالظبط؟ multi: أكل · لبس · غسل إيد · حمام · يختار بين اتنين — وتحت كل اختيار: "مين بيساعد" chips | 5 gated items + up to 15 triplet rows |
| Q9 ≠ مفيش AND Q10 = ماوصلناش | **F3**: وقت الضيق الشديد بيعمل إيه، ومين بيطقّاه؟ short 2-field | P7a + its triplet |
| Q4 = not_yet | **F4** (gentle, optional-skip): "مفيش مشكلة — تحب تجربوا معانا لعبتين تقابل فيهم حاجات؟ (سجّلنا المقترح وهنبدا بيهم)" | the missing learning-opportunity context |

### Not asked anymore (auto or moved)

| Removed | Why safe |
|---|---|
| X1 languages | Derived from registration country + app language |
| X4 who answers | Derived from the account; editable in settings |
| X7 child assent | Child-mode first screen — the child answers, not the parent |
| H1/H2 vision/hearing as separate items | Folded into Q7 own_way/access framing; IRIS always offers text+voice+big pictures by default |
| H7 last check-up, X3 prior reports, X5 details | Kept as **one optional free note on the review step** — context, never gates anything |
| The 12 gate screens | "ماخدش فرصة" is now an in-scale option — same data, zero screens |

---

## 4. Comparison

| | Current (cv1) | Proposed (cv2) |
|---|---|---|
| Bank size | 72 nodes | 14 core + 4 conditional |
| Questions actually answered — typical | **~74 (+~23 triplet rows ≈ 97 inputs)** | **13–14 (+0–4 follow-ups ≈ 14–18)** |
| Minimum / maximum | 53 / 84 | 13 / 18 |
| Screens with sub-rows (triplets) | up to 25 | 1 (F2 grouped) |
| Realistic time | **~13 min** (range 7–18) | **~2.5 min** (1.5–3) |
| Opportunity-first preserved | gate screens | in-scale option ✔ |
| Domains covered | 10/10 | **10/10** ✔ (see map below) |

**Domain coverage of the short form:** Communication Q1–Q3 · Daily independence Q6+F2 · Social Q8 · Play & participation Q8/Q4(interest-fed) · Learning support Q4, Q5, Q14 · Movement & accessibility Q7 · Emotional & behavioral Q9, Q10, F3 · Parent-child interaction Q10, Q12 · Learning opportunities Q12, Q14, F4 · Interests & strengths Q11.

**Information deferred (not lost):** per-activity support *frequency and
duration* (triplet f/tm rows) collapses to "who helps" inside F2 — strand
intensities become **medium confidence instead of high** for self-care; the
plan labels this honestly. Repeats of an activity across contexts (gate
logic nuance) is lost for learning (Q4 single observation) — acceptable
because the ladder itself measures ability directly; the family file's job
is the *environment*, which the short form keeps intact.

**Scoring compatibility:** every cv2 code maps to existing cv1 v-codes via a
static table (`cv2 → {legacyId: v}`), so `scoreCaregiverProfile` runs
unchanged behind an adapter; records are stamped `bankVersion:'cv2'` and the
kind-tagged storage already separates them. cv1 drafts of existing families
remain valid; families who already completed cv1 are NOT re-asked.

## 5. What implementation would touch (after approval)

1. `src/iris/caregiver/bank.js` → new `cv2` assembly (14+4 items), mapping table kept next to it.
2. `scoring.js` → cv2 adapter (code→legacy mapping + confidence downgrade for self-care strands).
3. `CaregiverProfileScreen.tsx` → no architecture change (steps already data-driven); intro card text updates to "١٣–١٤ سؤال، دقيقتين ونص".
4. First Plan → shows `cv2` confidence honestly.
5. QA: `qa-family-flow.mjs` rewritten to the short chain + a cv1-regression case (old families skip re-asking).

— end of proposal —
