# IRIS — cv2 Final Draft (post-refinement) — awaiting go-ahead

Date: 2026-11-14 · Supersedes §3 of `PARENT_ASSESSMENT_SHORT_PROPOSAL.md` after the five
refinements. Production untouched; cv1 records honored (§final req 5).

## How the five refinements were addressed

1. **Communication overlap removed** — Q1+Q3 merged into ONE intelligent expressive
   question. Its vocabulary follow-up fires ONLY when the parent picks a spoken-words
   answer; gesture/picture/AAC answers skip speech-level questions entirely. Expressive
   and receptive stay as two distinct dimensions in the profile (Q1 vs Q2).
2. **Movement split from sensory/access** — the combined Q7 becomes Mobility (core) +
   two *conditional* follow-ups: hand-use/fine-motor (fires when mobility needs support
   or the child communicates by touch/device) and vision/hearing (fires only when
   expressive AND receptive answers are unclear). A child who walks fine is never
   assumed to have no access needs — access is probed, not inferred.
3. **Sensitive responses** — self-injury reworded neutrally («مش لاقي طريقة يطلّع بيها
   اللي جواه فيؤذي نفسه»). Selecting it (or aggression that worries the parent) shows a
   calm one-card guidance note immediately: thanks the parent, points to the child's
   existing doctor/specialist, states plainly that IRIS neither diagnoses nor recommends
   treatment, and marks the plan to take the finding into account. Safety chips never
   feed any score — they set a `care` flag the plan reads.
4. **Interface preference out of the instrument** — old Q13 removed from the assessment.
   Display preference (text/voice/both) moves to a separate 2-chip onboarding step
   between the questionnaire and the ladder, and is editable forever in Parent Settings
   → «تفضيلات العرض». Default is both; nothing about it touches the child's profile.
5. **Completion time honesty** — 2.5 min is a **target, not a proven figure**. The
   intro card will promise only «أقل من ١٥ سؤال» (count is verifiable), never minutes.
   A measurement harness ships with cv2 (see §6) and a real-parent study protocol is
   defined for validation.

## 6. The final question list (12 core + 1 age-conditional + 6 rare follow-ups)

Every question: one screen, ≤5 short chips, read-aloud kept, and
«لسه ماخدش فرصة» embedded in ability scales (opportunity-first preserved).

### Core

**Q1 — إزاي بيقول اللي عايزه أو اللي جواه؟ (expressive channel)**
- كلام/كلمات → **fires Q1f** · words
- جُمل صغيرة → sentences *(also fires Q1f)*
- يشير / يشد إيدك / إيماءات → gesture
- لوحة صور أو إشارات أو جهاز → aac
- أنا بفهم طريقته بس هو ما بيوضّحش → hard_to_read
- لسه ماوضحش / ماخدش فرصة → not_yet
  Maps cv1: C2, C5, C6(gate), C7, C9(gate) · feeds: expressive

**Q1f (only if words/sentences) — كلامه وصل لإيه؟ (vocabulary & formation)**
- جُمل اتنين تلات كلمات → `sentences_plus`
- كلمات كتير → `many_words`
- كلمات قليلة → `few_words`
- أصوات شبه كلام → `sounds`
  Maps: C5, C6 · feeds: expressive_level

**Q2 — بيفهم الكلام اللي حواليه قد إيه؟ (receptive)**
- بيفهم كل حاجة تقريبًا → independent
- بيفهم أوي خصوصًا مع إيماءة → little_help
- بيفهم حاجات معينة بس → hands_on
- بيفهم الروتين بس → routine_only
- لسه واضحش / ماخدش فرصة → not_yet
  *(Q2 ∈ {routine_only, not_yet} + Q1 ∈ {hard_to_read, not_yet} → fires Q6f senses)*
  Maps: C1, C3, C8 · feeds: receptive

**Q3 — في اللعب والأنشطة الجديدة (learning & problem solving)**
- يكمّل لوحده → independent · بتلميح → little_help · خطوة بخطوة → hands_on · ماخدش فرصة → not_yet *(fires Q3f)*
**Q3f (rare, one-tap +skip) — تحبوا نبدأ بلعبتين تقابل/فرز؟** تسجيل فرصة تعلّم.
  Maps: L2, L3, L4 · feeds: learning

**Q4 — لما يحتاج حاجة مش قدامه (initiative)**
- يوصلها أو يطلبها بطريقته → independent · يطلب ويساعدوه → little_help · يستنى حد يعملها → hands_on · ماخدش فرصة → not_yet
  Maps: L5, L1, L6 · feeds: learning + self-reliance

**Q5 — في الحاجات اليومية لوحده قد إيه؟ (daily independence)**
- أغلبها لوحده → independent
- نصها → middle → **fires Q5f**
- أغلبها بمساعدة → hands_on → **fires Q5f**
- لسه بنعملها له / ماخدش فرصة → not_yet → **fires Q5f**
**Q5f — محتاج مساعدة في إيه بالظبط؟ (multi + one helper row)**
  أكل · لبس · غسل إيد · حمام · يختار بين اتنين + «مين بيساعد»: هو نفسه / ماما أو بابا / حد تاني / مساعدة باليد
  Maps: S1–S6 + the collapsed triplet rows · feeds: selfcare (confidence: medium — stated honestly in the plan)

**Q6 — بيتمشى ويتحرك كيف؟ (mobility)**
- لوحده زي ما عايز → free
- ماسك سور أو إيد → support
- كرسي متحرك أو وسيلة تانية → device → **fires Q6m**
- لسه ماخدش فرصة → not_yet → **fires Q6m**
**Q6m — إيده: بيشاور، يمسك ملقة أو قلم، يضغط شاشة؟ (fine motor & access)**
- كله سهل → hands_ok · الشغل الدقيق أصعب → fine_hard · بيشاور وبس → points_only · بيستخدم طريقته/جهاز → own_way
**Q6s — (fires only if communication unclear) عينه أو ودانه محتاجة ترتيب خاص؟**
- لأ → nothing · ترتيب في العين → vision · في الودن → hearing · الاتنين → both · مش متأكد/ة → unsure
  Maps: M1, M2, M3, M4, H1, H2, H7-lite · feeds: mobility + access

**Q7 — مع العيال والناس (social & play)**
- بيلعب معاهم → with_kids · جنبهم ومع تشجيع → near_kids · لوحده أحسن → alone_pref · يتضايق/يبعد → avoids
  Maps: P1, P2, P3, P5 · feeds: social

**Q8 — إيه اللي بيصعّب يومه؟ (multi, sensitive)**
- عناد أو ضيق كبير → fuss · خوف أو حساسية من أصوات/خامات → sensory_no · **مش لاقي يطلّع اللي جواه فيؤذي نفسه → self_care** · النوم مش ظابط → sleep · صحة أو أدوية بتأثر → health · مفيش حاجة → none
  ⚠ `self_care` or fuss+worried → calm guidance card (no diagnosis, no treatment advice, "كمّلوا معانا وهناخد ده في حسابنا في الخطة، والأفضل تسألوا الدكتور اللي متابع معاكم"). Sets meta `care_flags`, never a score.
  Maps: P7, H3, H5, H6 (as chips) · feeds: emotional + health context

**Q9 — إيه اللي بيرجّعه لوضعه الطبيعي؟ (soothing, multi)**
- حضن أو صوتنا بهدّي → hugs · بيخلّي نفسه لوحده → space · حاجة بيحبها → favorite · أكل/لبس → food_clothes · لسه ماوصلناش → unknown *(with Q8 worry → fires Q8/Q9 distress follow-up: «وقت الضيق بيعمل إيه ومين بيرضّاه؟» 2 chips + 2 chips)*
  Maps: P6, G2, G3, P7a · feeds: emotional

**Q10 — حاجات بيحبها + حاجة بيعملها حلو (one screen, 2 fields)**
- up to 5 interest chips (+ custom) · opentext strength
  Maps: G1, G5 · feeds: interests, plan

**Q11 — أحسن وقت عنده + يومه بيعدّي فين (2 chip rows)**
- وقت: الصبح/بعد المدرسة/آخر النهار/أي وقت · مكان: البيت/حضانة/مدرسة/مدرسة+جلسات
  Maps: G4, X2 · feeds: plan, environment

**Q12 — (≥5 سنوات بس) تمرّن على حروف/أرقام/قلم؟**
- في البيت والمدرسة/بيت/ماخدش فرصة
  Maps: L7 · feeds: plan (starting levels)

**Review + optional free note** — «لو تحبي تضيفي حاجة (تقارير سابقة، رعاية طبية…) اكتب هنا» replaces X3/X4/H7 as *voluntary context*, and the submit-time measurement lands here.

### Totals
Typical path: **12 questions** (+Q12 if ≥5y; typical follow-ups 1–2) → **13–15 screens**; worst case 18. Within 10–15 core ✓

## 7. Updated mapping → support profile (strands the First Plan reads)

| Profile dimension | cv2 source | cv1 legacy codes emitted by the adapter |
|---|---|---|
| expressive | Q1, Q1f | C2.v, C5.v, C6.v, C7.v, C9.v |
| receptive | Q2 | C1.v(+gate), C3.v(+gate), C8.v |
| learning / cognition support | Q3, Q3f, Q4 | L2.gate+L2.v, L3.gate+L3.v, L4.v, L5.v, L1.v |
| self-care (medium confidence) | Q5, Q5f | S1–S6.v + triplet t/f for chosen rows |
| mobility | Q6 | M1.v, M2.v |
| fine motor & access | Q6m, Q6s | M3.v, M4.v, H1.v, H2.v |
| social / play | Q7 | P1.v, P2.v, P3.v, P5.v |
| emotional & behavioral | Q8, Q9 (+Q9f) | P7.v(multi), P6.v, H3.v, H5.v, H6.v |
| interests & strengths | Q10 | G1.v, G5.note |
| routines & environment | Q11, Q12 | G4.v, X2.v, L7.v |
| care flags (not scored) | Q8 self_care | meta.care_flags |
| display preference | out of instrument | stored as user setting only |

## 8. Validation harness (proves §5 honestly)

- On every answer the screen stamps `answeredAt`; on submit `meta.durationMs`,
  per-question time, and follow-up fire rates are POSTed with the record
  (no personal data beyond item ids).
- Draft rows already give abandonment (IN_PROGRESS that never completes).
- The review screen shows skipped/blank blocks → "questions skipped" is visible.
- "Questions misunderstood" + first-plan usefulness are measured in the
  **real-parent study**: 6–10 sessions (2–3 min target check), think-aloud,
  and a checklist "does the plan reflect what you told us" before the
  2.5-minute figure is ever shown to users.

## 9. Preserved guarantees
cv1 records untouched and never re-asked (bankVersion gate). No composite,
score or IQ anywhere (tests assert). Ownership checks, drafts, kind-tagged
storage, forced sequence and First Plan integration stay exactly as shipped.
