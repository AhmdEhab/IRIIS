# IRIS Phase 5 — Adaptive Assessment & Personalized Content: design blueprint

**Status: PROPOSAL. No implementation code has been written.**
Companion document: `ASSESSMENT_RESEARCH_MATRIX.md` (evidence).
Every claim below that rests on research cites a row ID from that matrix (A1, B5, D10…).

---

## 0. Summary of what changes, and the one thing I need you to decide

### 0.1 What exists today

The engine measures **nine sub-measures** — receptive vocabulary, instruction
following, phonological awareness, verbal STM, visual STM, sustained attention,
selective attention, visual matching, pattern completion — through nine fixed
tasks that every child takes in the same order. Each has a 4-step difficulty
ladder. Scoring produces a DPS per sub-measure, a profile of relative strengths
and support areas against the child's *own* mean, and six learning goals.

Three things about it matter for this phase:

1. **`ageYears` is stored on the `Child` model and read by nothing.** Not the
   assessment, not the profile, not goal selection, not the pathway. The brief's
   first requirement — "understands the child's age" — is currently unmet at the
   level of *the field is never read*.
2. **There is no literacy content and no numeracy at all.** `LANG.PHON_AWARE`
   measures initial-sound matching; there is no letter knowledge, no
   letter-sound correspondence, no decoding, no reading, no counting, no
   cardinality, no numerals, no comparison. Doc 13 excluded them from the MVP
   deliberately.
3. **Diagnosis-blindness is enforced by a build-breaking test.** `condition` is
   read in exactly one function, `accommodationDefaults()` in `journey.js`, and
   `TEST-PATH-BLIND` asserts that five different diagnoses with identical
   performance produce byte-identical scores, levels, goals, pathway decisions
   and next activities.

### 0.2 The collision

Your brief asks for:

> AGE + PROFILE + RESEARCH → Research-informed starting hypothesis

If "PROFILE" means the syndrome, then a syndrome value would influence where the
assessment starts — which items the child sees, and therefore what is measured.
That breaks the invariant above.

Your brief *also* says, twice and emphatically, that syndrome differences
"must NEVER become deterministic rules" and that observed performance must
dominate. So you have already seen the risk. What follows is what the evidence
says about how big that risk is, and three ways to resolve it.

### 0.3 What the research says about a syndrome prior

I went looking for the evidence that would justify one. It is weaker than the
popular summaries suggest, in four specific ways:

- **The best-known Williams syndrome claim does not survive review.** Brock's
  critical review (E1) concludes there is "little evidence that syntax,
  morphology, phonology, or pragmatics are any better than predicted by
  nonverbal ability". A prior of `WILLIAMS → language high` would encode a
  contested claim.
- **A group difference on one skill failed to transfer to the adjacent skill.**
  Nye et al. (D10) found children with Down syndrome counted to a median of 3
  versus 11 for matched controls — a large difference — yet **cardinality
  understanding did not differ between the groups**. A prior derived from the
  counting difference would have mis-set cardinality for about a third of them.
- **The within-group ranges swamp the between-group differences.** Word reading
  2–38 words among DS children who read at all (D1). Standard scores 40–112 in
  the WS reading study (E2). A documented case of a woman with Down syndrome
  fluent in three languages with normal verbal span (D6).
- **What the child was taught predicts more than the label.** In the WS study,
  systematic phonics instruction was worth ~16.71 points on the reading
  composite, *independent of IQ* (E2). GeneReviews says the same (E11).

Meanwhile the *cost* of getting placement wrong is asymmetric. Starting a child
too low is boring and mildly insulting. Starting them too low **because of their
diagnosis** is the precise harm this product exists to avoid, and it is
invisible — the child simply never sees the harder item, so the ceiling is never
discovered and the data confirms the prior.

### 0.4 Three options

| | Option A — **Blind placement** *(recommended)* | Option B — Decaying prior | Option C — Full prior |
|---|---|---|---|
| Syndrome affects starting rung | No | Yes, for the first session only | Yes, until overridden |
| Age affects starting rung | Yes — as a probe hint, downward-safe | Yes | Yes |
| Calibration finds the rung | Yes, always | Yes, blended with prior | Yes, blended |
| `TEST-PATH-BLIND` | **Passes unchanged** | Must be rewritten | Must be deleted |
| Two children, same performance, different diagnosis | Identical experience | Different day-1 items | Different items |
| Evidence support | E1, D10, D6, E2 all support this | Weak — the priors are noisy | Contradicted by E1 |
| Cost | ~90 extra seconds of calibration | — | — |

**My recommendation is Option A**, and the reason is not only ethical. The
calibration stage in §3 finds the child's rung empirically in about two minutes
(F5 says two minutes is a normal probe length). A prior only earns its place if
it beats two minutes of watching the child. Given ranges of 40–112 and 2–38,
it does not.

**Research still shapes everything** under Option A — it shapes the ladder
order, the item design, the Arabic dialect tagging, the accommodation defaults.
It just does not shape *this child's starting rung*, because for that we have
something better: the child.

**If you choose B or C, I will build it** — but I would want the prior's weight
and decay to be explicit constants in `spec.js`, tagged
`ENGINEERING_ASSUMPTION`, and I would want the parent summary to state that the
starting point was influenced by the diagnosis. You should see that trade-off
before choosing, which is why I have not just picked for you.

Everything below assumes Option A. Switching to B or C changes §4 only.

---

## 1. Architecture: what gets added, what gets left alone

```
                    EXISTING (untouched)                    NEW (Phase 5)
                    ────────────────────                    ─────────────
  Child ─────────►  accommodationDefaults()  ◄── the only place `condition` is read
    │
    │ ageYears ──────────────────────────────────────────►  entryHint()      ★ new
    │                                                        (downward-safe)
    ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │  STAGE 1  CALIBRATION  (~2–4 min, 8–10 items)                    ★  │
  │  Finds the entry rung on each ladder. Not scored as attainment.     │
  └─────────────────────────────────────────────────────────────────────┘
                                   │  entry rungs
                                   ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │  STAGE 2  ADAPTIVE PROBE  (~8–14 min)                            ★  │
  │  Per domain: climb / hold / step down / shift modality.             │
  │  Existing nine sub-measures  +  literacy ladder  +  numeracy ladder │
  └─────────────────────────────────────────────────────────────────────┘
                                   │  item results
                                   ▼
  scoreAssessment()   ── extended, same shape ──►  domain scores + confidence
  buildProfile()      ── extended, same shape ──►  strengths / developing
                                   │
                                   ▼
  ┌─────────────────────────────────────────────────────────────────────┐
  │  LEARNING PROFILE  ★  ladder position per strand + confidence       │
  └─────────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
            selectGoals()                  contentBlueprint()  ★ new
            (existing, extended)           goal + rung + format rotation
                    │                             │
                    └──────────────┬──────────────┘
                                   ▼
                          generateActivity()  (existing)
                                   ▼
                          child practises → session result
                                   ▼
                          decideNext()  (existing pathway cascade)
                                   ▼
                          updateSkillEstimate()  ★ new — the ledger
                                   └──────────► back into LEARNING PROFILE
```

**Untouched:** authentication, database schema (one additive column), the
ElevenLabs layer, Child Mode shell, the companion, the parent chatbot, the demo
directory, the pathway cascade R-PATH-001…011, the DPS formula, the
diagnosis-blindness contract.

**Extended, not replaced:** `assessment.js`, `profile.js`, `goals.js`,
`contentBank.js`, `templates.js`.

**New:** the two ladders, the calibration stage, the skill-estimate ledger, the
content blueprint, the parent snapshot.

---

## 2. The ladders

### 2.1 Literacy ladder — and where it departs from the brief

Your brief's ladder is a reasonable first sketch. The research contradicts it in
four places, and I have changed it accordingly rather than implementing a
sequence the evidence says is wrong.

| Rung | Name | Skills | Research |
|---|---|---|---|
| **L0** | Pre-literacy readiness | visual attention, match identical pictures, match identical symbols, follow a one-step instruction, identify familiar objects, basic auditory discrimination | Maps onto existing `VSP.MATCHING`, `LANG.INSTRUCTION` |
| **L1** | Letter awareness | letter is not a picture; match identical letters; **match across positional forms** (isolated/initial/medial/final); **dot-contrast discrimination** (ب ت ث, ج ح خ) | B1, B2, B3, B10 |
| **L2** | Letter names ⇄ | identify a letter by name; name a presented letter | A4 |
| **L3** | Letter sounds ⇄ | letter → sound; sound → letter; distinguish similar sounds | A4 |
| **L4** | Phonological awareness | **syllable → rhyme/onset-rime → phoneme**, and within each: **detect → blend → segment** | A2, A3, B4 |
| **L5** | Early decoding | blend sounds to a word; decode simple vowelised words; connect spoken to written word | A6, A9 |
| **L6** | Early reading | simple words, short phrases, familiar sentences, word–picture matching | A6 |
| **L7** | Reading comprehension | literal questions, sequence events, main idea, text–picture link | A7, A8 |
| **L8** | Functional reading | signs, labels, simple instructions, everyday words | F8 |
| **LC** | *Listening comprehension* — **parallel strand, all rungs** | understand a spoken sentence; answer a literal spoken question | **A7, A8** |

**The four departures, each with its reason:**

1. **L2 and L3 are parallel (⇄), not sequential.** Roberts et al. (A4) found no
   main effect of instructional order, that "letter sound learning was on a par
   with letter name learning", and that teaching names first "may actually have
   interfered with" sound learning. Gating sounds behind names would encode an
   assumption the only study to test it contradicts.

2. **Blending sits below segmentation inside L4.** The NRP meta-analysis (A3)
   found segmentation training d = 0.87 versus blending d = 0.61; Anthony &
   Francis (A2) report children blend before they segment.

3. **L5 decoding unlocks on *partial* letter-sound knowledge, not L3 mastery.**
   The WWC practice guide (A9) says decoding begins once "students know a few
   consonants and vowels". Requiring full alphabet mastery would strand children
   who are ready to decode with six letters.

4. **Listening comprehension is a parallel strand, not the top of the ladder.**
   Hogan et al. (A7): word recognition's unique contribution to comprehension
   falls from 27% to 2% of variance between grades 2 and 8 while listening
   comprehension's rises from 9% to 36%. A child at L1 can be assessed on LC and
   *should* be — for many children in IRIS's population it is where the signal
   is. Laws et al. found listening comprehension the key constraint on reading
   comprehension in DS readers.

**Non-linearity is allowed by design.** Kennedy & Flynn (D3) found only 1 of 9
children with DS showed rhyme awareness while several had *more advanced*
phoneme skills — the typical rhyme-before-phoneme order did not hold. The
ladder is therefore a **difficulty ordering for item selection**, not a
prerequisite chain. A child may be measured at L5 while L4-rhyme is unmeasured.

### 2.2 Arabic-specific rules

These are the rules that make this an Arabic instrument rather than a translated
English one.

| Rule | Content | Source |
|---|---|---|
| **AR-1 · Language split** | Instructions, companion speech and encouragement in **Egyptian Arabic**. All literacy target content in **vowelised MSA**. | B10 — this is exactly what the Egypt national EGRA did |
| **AR-2 · Positional forms** | Letter items sample **isolated, initial, medial and final** forms, tagged by form. Cross-form matching is its own L1 item type. | B1, B3, B10 |
| **AR-3 · Dot contrasts** | Confusion sets (ب ت ث · ج ح خ · د ذ · ر ز · س ش · ص ض · ط ظ · ع غ · ف ق) get dedicated items and a **dedicated error code**, not a generic "wrong". | B2 *(preprint — flagged)*, B9 |
| **AR-4 · Diacritics** | All child-facing literacy text fully vowelised at L1–L6. Unvowelised reading is **out of scope for Phase 5**. Diacritic errors get their own error code. | B9 (48% of Egyptian errors were diacritic/short-vowel), B10 |
| **AR-5 · Dialect distance tag** ⚠ | **Every phonological item carries `msa_only_phoneme: true \| false \| UNKNOWN`.** Failure on an MSA-only phoneme is reported as *dialect distance*, never as phonological weakness. | **B5** — the single most important Arabic rule |
| **AR-6 · Picture support** | PA items presented with pictures, not pure audio, and with low-floor entry items. | B11 — the only Egyptian source on PA in a cognitively atypical group |
| **AR-7 · Letters visible** | Phonological items show the letter alongside the sound wherever the rung allows. | A3 — PA instruction works better with letters than without |
| **AR-8 · Morphology** | Arabic needs a morphological-awareness domain (root-and-pattern; the **dual number** especially). **Deferred to Phase 6** — flagged, not built. | B8, B12 |

**⚠ AR-5 has a hole in it, and it is the biggest single gap in this phase.**
Saiegh-Haddad (B5) proves the effect exists using Palestinian data. Bergstrand
Othman (B6) explicitly warns that dialect distance varies by region and that
Palestinian parameters must not be imported. **No Egyptian phoneme-distance data
for children was retrievable.** So the tag will ship populated by a provisional
list marked `SPECIALIST_REVIEW_REQUIRED`, and I will not generate that list from
a language model and present it as fact. It needs an Egyptian speech-language
specialist. Until then every item defaults to `UNKNOWN`, which suppresses the
dialect claim in the parent summary rather than guessing it.

### 2.3 Numeracy ladder

| Rung | Name | Skills | Research |
|---|---|---|---|
| **N0** | Quantity awareness | same/different quantity, more/fewer, **subitizing 1–4 items** | C8 sets the 1–4 boundary |
| **N1** | Counting readiness | one-to-one correspondence, count small sets, stable order | C4 |
| **N1c** | **Cardinality — parallel to N1, not after it** | "give me three" | **C1, C2, D10** |
| **N2** | Numeral recognition | recognise numerals, numeral ⇄ quantity | C1 |
| **N3** | Number sense | compare quantities, more/less/equal, order small numbers | C5, C7 |
| **N4** | Number sequence | continue sequences, missing number, count forward/**backward** | C4 — advanced counting beats basic counting as a predictor |
| **N5** | Early operations | combine small quantities, take away, simple + and − | C5 |
| **N6** | Patterns | visual and numeric repeating patterns | C6 — independent predictive value |
| **N7** | Functional maths | money, time, everyday comparison | F8 — central to this population's actual curriculum |

**The departure from your brief:** cardinality (N1c) is **not** gated behind
counting. The 2023 cardinal-principle study (C1) found children who became
cardinal-principle knowers early could typically enumerate "up to about three or
four" items, with "diminishing returns for enumeration of larger collections".
Nye et al. (D10) found DS and TD children differed sharply on count length but
**not** on cardinality. Requiring a long count sequence before probing
cardinality would hide the skill in exactly the children IRIS serves.

**Two independent ladders.** Brigstocke et al. (D11) report arithmetic lagging
reading by about two years in DS with wide variation. Literacy position must
never be used to infer numeracy position or vice versa.

**Language-light by design.** Mervis & Klein-Tasman (E8) found relational and
quantitative vocabulary — *the vocabulary maths instructions are written in* — is
a clear weakness in WS while concrete vocabulary is not. A maths item that fails
may be failing on its wording. So numeracy items minimise relational language
**for every child**, and where relational language is unavoidable the item is
tagged so a failure can be attributed correctly.

### 2.4 Cognitive support domains

No new tasks. The existing nine sub-measures cover attention, memory, matching,
patterns, instruction following and receptive vocabulary. Phase 5 adds only
**reporting linkage**: `VSP.PATTERN` gets reported against numeracy too, because
Zippert & Clayback (C6) found patterning adds unique predictive variance to
numeracy after controlling for reasoning, working memory and spatial skill.

These remain **educational personalization inputs, never diagnostic**.

---

## 3. The assessment flow

### Stage 1 — Calibration (~2–4 minutes, 8–10 items)

**Purpose: find where to start. Not to score the child.**

Calibration results are recorded as `calibration: true` and **excluded from
attainment scores**, so a child is never penalised for the probe that found
their level.

Probe order, chosen by predictive yield (A1: alphabet knowledge and phonological
awareness are the top predictors, ahead of vocabulary):

| # | Probe | Ladder | Items |
|---|---|---|---|
| 1 | Match identical picture | L0 | 1 |
| 2 | Letter vs non-letter, then match identical letters | L1 | 2 |
| 3 | Letter name **or** letter sound (whichever the child offers first — A4) | L2/L3 | 2 |
| 4 | Syllable-level PA, with picture support (AR-6) | L4 | 1 |
| 5 | Subitizing 1–4 | N0 | 1 |
| 6 | Cardinality "give me three" | N1c | 1 |
| 7 | Numeral recognition | N2 | 1 |
| 8 | Listening comprehension — one spoken sentence | LC | 1 |

**Entry rule.** For each ladder, entry rung = the highest rung with a correct
response, minus one, floored at the ladder's base. Minus one because a single
correct item is thin evidence and starting slightly low costs one easy item,
whereas starting high risks a floor experience.

**Age's only role.** `ageYears` supplies an `entryHint` that may **lower** the
first calibration probe for a very young child (skip probes 7–8 under age 5) but
may **never raise** the entry rung. Age can save a young child from items they
have no chance at; it can never assert that a seven-year-old should be at L7.
That asymmetry is the whole point — it is the mechanism by which "age 7 ≠ grade
2 level" is enforced in code rather than in a comment.

### Stage 2 — Adaptive probe (~8–14 minutes)

Per ladder, from the entry rung:

```
  at rung R, present k items (k = 3, from the 4–5 minimum in F3)
      ≥ 2 correct  ────────────────►  climb to R+1
      1 correct    ────────────────►  hold at R, present a modality variant
      0 correct    ────────────────►  step down to R−1
                                       └─ if already at base: try the paired
                                          modality once, then stop this ladder
```

**Stopping.** A ladder stops when: it climbs to a rung with no items; **or** two
consecutive rungs score 0; **or** the ladder's item budget is spent; **or** the
whole-session budget is spent.

**Two honest notes on the numbers.** First, "two consecutive" is an engineering
choice, not a finding — the Springer reference chapter (F2) states plainly that
test publishers "do not publish details regarding the development of their basal
and ceiling rules", and published tests use 3, 5 and 6. IRIS's existing value of
2 is at the aggressive end. **I propose raising it to 3 for the new ladders and
flagging the existing 2 for specialist review.** Second, IRIS is a **rule-based
adaptive assessment, not a computerised adaptive test.** With ~50 uncalibrated
items there is no item response theory here (F1), and IRIS must never use the
words "ability estimate" or "standard error".

**Session budget.** Target 10–20 minutes total, built from ~2-minute probes (F5,
where 1–8 minutes and typically 2 is standard CBM practice). **This target is an
engineering and engagement decision, not an evidence-based one** — F6 found no
usable fatigue evidence, in a study where 6.5-hour paediatric assessments showed
no significant length–fatigue relationship. Anyone who claims IRIS's session
length is research-backed would be overstating it.

When the budget runs out mid-ladder, IRIS **relaxes the confidence label rather
than extending the session** — the policy PROMIS uses for young children (F3).

---

## 4. The personalization model

Not a clinical model, not a fake Bayesian one. **A ledger of observations with
an explicit, inspectable update rule.**

```
SkillEstimate(strand) = {
    rung:           integer position on the ladder
    evidence:       [ {rung, correct, total, supported, session_id, at} ]
    confidence:     HIGH | MEDIUM | LOW
    provenance:     CALIBRATED | OBSERVED | CARRIED_FORWARD
    last_moved_at:  timestamp
}
```

**Update rule after each session** (this is the whole model):

| Observation at the current rung | Move |
|---|---|
| 2 consecutive sessions ≥ 80% unsupported | rung + 1 |
| ≥ 50% and < 80% | hold; rotate the activity format |
| < 50% once | hold; add scaffold (existing `SIMPLIFY_SCAFFOLD`) |
| < 50% twice | shift modality (existing `MODALITY_SHIFT`) |
| < 50% three times | rung − 1 (existing `PREREQ_BACKSTEP`) |

This is deliberately the **existing pathway cascade** (R-PATH-005/006/007)
applied to a ladder rung instead of a goal level. It is already built, already
tested, and already produces the ordering the brief asks for — simplify before
level reduction.

**Where the prior lives, and how it dies.** Under Option A the only prior is
`entryHint(age)`, it is downward-safe, and it is **discarded the moment
calibration returns** — `provenance` moves `CALIBRATED → OBSERVED` on the first
real session. There is no decay curve to tune because there is nothing to decay.

**"Observed performance > generic assumptions" is therefore not a weighting; it
is a structural property.** The generic assumption never enters the estimate at
all.

**Supported vs unsupported is tracked separately.** Chapman (D9) found the DS
expressive-language deficit "disappears when a preview opportunity and picture
support is given". Nye et al. (D10) found both groups benefited similarly from
scaffolding. A single number hides what a parent most needs: what the child can
do *with* help. This reuses the existing `independence` term rather than adding
a concept.

---

## 5. Scoring — IRIS Learning Indicators

### 5.1 Shape

Reuses the existing DPS formula, unchanged:

```
Indicator = 100 × (0.50·accuracy + 0.30·depth + 0.20·independence)
```

where `depth` becomes **highest rung reached ÷ ladder height** rather than
`step ÷ 3`. The weights stay 0.5/0.3/0.2 and stay tagged
`ENGINEERING_ASSUMPTION` — nothing in the literature validates or replaces them,
so changing them would be substituting one guess for another.

### 5.2 Output shape

```
Literacy
  Letter recognition        82   confidence HIGH
  Letter sounds             61   confidence HIGH
  Phonological awareness    48   confidence MEDIUM   ⚠ 2 items were MSA-only phonemes
  Word recognition          —    not yet measured
  Listening comprehension   70   confidence MEDIUM

Numeracy
  Quantity recognition      88   confidence HIGH
  Counting                  74   confidence HIGH
  Cardinality               67   confidence MEDIUM
  Numeral recognition       52   confidence MEDIUM
  Comparison                —    not yet measured

Learning support
  Attention                 70   confidence HIGH
  Visual memory             64   confidence HIGH
  Sequencing                45   confidence LOW      ⚠ few items completed
```

**`—` is a first-class value.** "Not yet measured" is not zero and must never
render as zero, a gap in a chart, or an empty bar. The existing `notDetermined`
handling already does this correctly.

### 5.3 Confidence

Reuses the existing `computeConfidence`, extended with two conditions:

- **LOW** if fewer than 3 scoreable items at the reported rung; if rapid
  responding or high timeout rate; if the ladder stopped on budget rather than
  on a ceiling.
- **MEDIUM** if the session was interrupted; if 1–2 strands are undetermined; if
  a dialect-distance flag fired on ≥ 25% of phonological items.
- **HIGH** otherwise.

The thresholds are engineering assumptions and stay tagged as such (§8 of the
matrix).

### 5.4 The naming rule, unchanged

These are **IRIS Learning Indicators**. Not IQ, not percentiles, not age
equivalents, not standard scores. `BANNED_TERMS` in `spec.js` already blocks
`iq`, `percentile`, `age equivalent` in child- and parent-facing text; the
existing `PROFILE_DISCLAIMER` already says so in both languages. Phase 5 adds
one more banned phrase — **"reading age"** — and one required qualifier: any
Arabic phonological indicator carrying a dialect flag must render the flag next
to the number, never in a footnote.

---

## 6. Strengths and currently developing

Reuses `buildProfile()` unchanged: relative index against the child's **own**
mean, ±8 for classification, the flat-profile guard that refuses to manufacture
a strength when the profile is genuinely flat.

Renamed for the parent view only:

- `RELATIVE_STRENGTH` → **"Strengths"** / «نقاط القوة»
- `RELATIVE_SUPPORT_AREA` → **"Currently developing"** / «مهارات بتتطور دلوقتي»
- `NOT_DETERMINED` → **"Not measured yet"** / «لسه مقيسناهاش»

The word "deficit" is already banned. "Weakness" joins it.

**Next learning priorities** are the top 1–3 support areas that have a goal
attached, ordered by the existing `selectGoals()` logic. Unchanged.

---

## 7. Content generation

The existing contract holds: **the content engine chooses HOW to present the
next step, never WHAT the next step is.** `generateActivity()` receives a
constraint set and cannot see the diagnosis or the profile.

New in between: `contentBlueprint()`, which turns a learning profile into
constraint sets.

```
  Learning profile + rung + recent formats
        │
        ▼
  contentBlueprint()  →  [ {goal, rung, template, item_count, scaffolds, theme} ]
        │
        ▼
  generateActivity()  (existing, unchanged)
```

**Worked example.** Letter recognition 82, letter sounds 61, blending 35:

> Generate **letter-sound** work at the sound → letter rung, with the letter
> visible (A3), picture-supported (AR-6), rotating across formats, plus
> **blending** work one rung lower with maximum scaffold. Do **not** generate
> letter-recognition work — it is at 82 and the child would be practising what
> they already do.

**Format rotation.** Eight formats per goal, rotated by the existing
deterministic seed so repeats differ but stay reproducible: hear sound → choose
letter; see letter → choose sound; letter → picture; find the letter in a group;
match identical letters (across positional forms); memory game; story
interaction; real-life word. This prevents drilling and, per E3, **the sound-led
versus picture-led split is diagnostic of strategy**, not just variety — Laing
et al. found WS children reaching similar scores by a different route.

**Difficulty tiers** — FOUNDATION → GUIDED → PRACTICE → INDEPENDENT → CHALLENGE
— map onto the existing scaffold flags rather than becoming a new axis:

| Tier | Existing mechanism |
|---|---|
| FOUNDATION | `REDUCED_ITEMS` + hint always shown |
| GUIDED | hint on request |
| PRACTICE | default |
| INDEPENDENT | no hint offered |
| CHALLENGE | rung + 1, marked as a stretch, never scored against the current rung |

**Mastery is evidenced on new items.** Duffy & Wishart (D12) found errorlessly
learned discriminations were retained well but showed "little evidence of
transfer" to a second task. So mastery of a rung requires correct responses on
items the child has not seen — otherwise IRIS would measure recall of specific
items and call it skill.

---

## 8. Parent snapshot

```
لمحة عن تعلّم طفلك · YOUR CHILD'S LEARNING SNAPSHOT

نقاط القوة · Strengths
  ✓ التعرّف على الحروف المألوفة
  ✓ التعرّف على الكميات الصغيرة
  ✓ المطابقة البصرية

مهارات بتتطور دلوقتي · Currently developing
  • ربط الحرف بصوته
  • الترتيب والتسلسل
  • المقارنة بين الأعداد

الخطوة الجاية · Recommended next focus
  ١. أصوات الحروف
  ٢. مطابقة الأصوات البسيطة
  ٣. العد ومقارنة الكميات

التدريب المقترح · Suggested practice
  ١٠ دقايق في اليوم
  [ENGINEERING ASSUMPTION — no source in the matrix supplies a dosage. F-gaps]

اللي تلاحظيه · What to observe
  "هل الطفل بيتعرف على الحرف بسهولة لكن بيتلخبط لما يسمع الصوت؟"

ــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــــ
ده فحص تعليمي أوّلي من IRIS، مش تقييم طبي ولا نفسي…    [existing disclaimer]
```

Reuses the existing seven-part structure and Egyptian Arabic voice from the
Phase 4 parent assistant, and the existing observation/inference separation:
"لاحظنا…" for what happened, "ممكن نجرب…" for what to try. Never "طفلك عنده…".

**The 10-minutes-a-day figure is an engineering assumption** and will be tagged
as one. No source in the matrix supplies a dosage — D5 (the one RCT that would
have) could not be retrieved.

---

## 9. Worked example 1 — age 7, Down syndrome (mandatory)

The point of this example is that **the diagnosis does not appear anywhere in
the trace**. It is in the header because you asked for it; the engine never
reads it.

```
Child: 7 years old.  condition = DOWN_SYNDROME
  → accommodationDefaults() returns [EXTENDED_TIME, SIMPLIFIED_INSTRUCTION, AUDIO_REPEAT]
  → these change hint delay 8s→12s and timeout 20s→30s. Nothing else.
  → the assessment engine is never told the diagnosis.

  ageYears = 7  →  entryHint: no probes skipped (skip rule applies under age 5).
                   entryHint CANNOT raise a rung.  ← "age 7 ≠ grade 2" enforced here

CALIBRATION  (2 min 40 s, 10 items)
  match identical picture         ✓          → L0 secure
  letter vs non-letter            ✓          → L1 reachable
  match identical letters         ✓
  letter name  (ب)                ✓          → L2 reachable
  letter sound (/b/)              ✗          → L3 not yet
  syllable clap  (كِ-تَاب)          ✓          → L4-syllable reachable
  subitizing (3 dots)             ✓          → N0 secure
  cardinality  "هاتلي تلاتة"        ✓          → N1c reachable   ★
  numeral recognition (٤)         ✗          → N2 not yet
  listening: "الولد بيشرب لبن"      ✓          → LC reachable

  ENTRY RUNGS:  literacy L1   ·   numeracy N0   ·   LC probe on
  ★ cardinality succeeded even though numeral recognition failed.
    C1/D10 predict exactly this. A counting-gated ladder would have missed it.

ADAPTIVE PROBE  (11 min)
  L1  letters, incl. positional forms   3/3  →  climb
  L2  letter names                      2/3  →  climb
  L3  letter sounds                     1/3  →  hold, modality variant
      variant: sound → letter           2/3  →  climb   ★
  L4  syllable                          3/3  →  climb
  L4  rhyme                             0/3  →  step down
  L4  ⚠ 2 of 3 rhyme items used /q/ — flagged msa_only_phoneme=UNKNOWN
      → the phonological indicator carries a dialect-distance caveat
  L5  not reached — budget spent
  LC  listening comprehension           2/3

  N0  quantity / subitizing             3/3  →  climb
  N1  counting to 5                     2/3  →  climb
  N1c cardinality                       2/3  →  climb   (parallel strand)
  N2  numeral recognition               0/3  →  step down, stop
  ★ counting is ahead of numeral recognition. Two independent strands, as D11 predicts.

RESULT
  Letter recognition      84  HIGH
  Letter names            71  HIGH
  Letter sounds           58  MEDIUM   ← sound→letter worked, letter→sound did not
  Phonological awareness  46  MEDIUM   ⚠ dialect-distance caveat
  Word recognition        —   not measured
  Listening comprehension 66  MEDIUM

  Quantity recognition    88  HIGH
  Counting                74  HIGH
  Cardinality             69  MEDIUM
  Numeral recognition     —   not measured

  Strengths:            letter recognition, quantity recognition
  Currently developing: letter sounds, numeral recognition
  Next:                 1. letter sounds (sound→letter format first — it worked)
                        2. syllable-level phonological work
                        3. numeral ⇄ quantity matching

  NOT PRODUCED: no reading age, no grade level, no IQ, no percentile,
                no comparison to other 7-year-olds, no comparison to other
                children with Down syndrome.
```

**The diagnosis-blindness check.** Run the identical response pattern with
`condition = WILLIAMS_SYNDROME`, `AUTISM`, `FRAGILE_X` or `OTHER` and every
number above is byte-identical. Only the accommodation list differs. This is the
existing `TEST-PATH-BLIND` test, extended to the new ladders.

---

## 10. Worked example 2 — age 9, early foundation

The case the brief calls "one of the core reasons IRIS exists".

```
Child: 9 years old.  condition = OTHER

CALIBRATION
  match identical picture   ✓
  letter vs non-letter      ✗
  match identical letters   ✗
  syllable clap             ✗
  subitizing (2 dots)       ✓
  subitizing (4 dots)       ✗
  cardinality "هاتلي اتنين"   ✓
  listening: 1-step         ✓

  ENTRY RUNGS:  literacy L0   ·   numeracy N0   ·   LC on

  A nine-year-old placed at L0. The engine records this WITHOUT any
  contradiction flag, because there is none: age never set an expectation
  that this could fall short of. Nothing in the system says
  "9 years old should be at L6".

ADAPTIVE PROBE
  L0  visual attention, matching     3/3  →  climb
  L1  letter vs non-letter           1/3  →  hold, modality variant
      variant: match identical shapes then letters   2/3  →  climb
  L1  positional-form matching       0/3  →  step down, stop
  LC  listening comprehension        3/3  →  climb
  LC  two-step spoken instruction    2/3  →  climb   ★

  N0  quantity comparison            3/3  →  climb
  N1  one-to-one correspondence      2/3  →  climb
  N1c cardinality                    1/3  →  hold

RESULT
  Pre-literacy readiness   90  HIGH
  Letter awareness         41  MEDIUM
  Listening comprehension  81  HIGH    ★ the strongest indicator on the page
  Everything above L1      —   not measured

  Quantity awareness       86  HIGH
  Counting readiness       68  HIGH
  Cardinality              44  MEDIUM

  Strengths:            listening comprehension, quantity awareness
  Currently developing: letter awareness, cardinality

  ★ Listening comprehension at 81 while letter awareness sits at 41 is exactly
    the profile A7 describes and the profile a decoding-first assessment would
    have scored as a flat floor. Making LC a parallel strand rather than the
    top rung is what surfaced it. For this child it is the single most useful
    thing on the page: it says the language is there and the print is not.
```

---

## 11. Files that will change

### New files

| File | Purpose | Est. lines |
|---|---|---|
| `src/iris/ladders/literacy.js` | L0–L8 + LC, rung definitions, Arabic rules AR-1…AR-8 | ~260 |
| `src/iris/ladders/numeracy.js` | N0–N7 + N1c | ~200 |
| `src/iris/ladders/index.js` | shared rung helpers, ladder registry | ~80 |
| `src/iris/engines/calibration.js` | Stage 1: probe set, entry-rung rule, `entryHint(age)` | ~180 |
| `src/iris/engines/skillEstimate.js` | the ledger and its update rule | ~150 |
| `src/iris/content/blueprint.js` | profile → constraint sets, format rotation | ~170 |
| `src/iris/content/literacyBank.ar.js` | Arabic literacy items, all tagged | ~600 |
| `src/iris/content/numeracyBank.ar.js` | Arabic numeracy items | ~400 |
| `src/iris/parent/snapshot.js` | the parent snapshot composer | ~160 |
| `tests/iris.assessment5.test.js` | the 15 test areas below | ~700 |
| `qa-ladders.mjs` | ladder-integrity and honesty checks | ~200 |

### Modified

| File | Change | Risk |
|---|---|---|
| `src/iris/spec.js` | new tagged constants; `BANNED_TERMS += 'reading age'`; ladder config | Low — additive |
| `src/iris/engines/assessment.js` | `depth` from ladder height; calibration items excluded from scoring | **Medium** — touches DPS. Guarded by existing tests |
| `src/iris/engines/profile.js` | new strands in the profile; two confidence conditions | Low — additive |
| `src/iris/engines/goals.js` | goals for the new strands | Low — additive |
| `src/iris/journey.js` | wire calibration before the probe; pass `ageYears` to `entryHint` only | **Medium** — orchestration |
| `src/iris/content/templates.js` | new templates + modality pairs for letters/sounds/numerals | Low |
| `src/App/components/iris/...` | calibration screen; extended results screen | Medium — UI |
| `server/models/Child.js` | *(optional)* `instruction_history` column, parent-supplied per E2 | Low — additive |
| `tests/iris.test.js` | extend `TEST-PATH-BLIND` across the new ladders | **Must not weaken** |

### Explicitly untouched

`server/` auth and sessions · `server/routes/tts.js` and the whole ElevenLabs
layer · `src/App/audio/*` · `src/App/contexts/AudioContext.tsx` ·
`IrisBuddy` / `IrisCompanion` · `src/iris/parent/chatbot.js` and `playbook.js` ·
`src/App/data/*` (the Phase 7 demo layer) · `src/iris/engines/pathway.js`
(the cascade is reused as-is, not edited).

---

## 12. Tests

All 15 areas from the brief, plus three the brief does not name but the research
demands.

| # | Test | Asserts |
|---|---|---|
| 1 | Age routing | `entryHint` can lower a probe, **never raise a rung**; age 7 and age 4 with identical calibration answers get identical entry rungs |
| 2 | Profile routing | *(Option A)* five diagnoses, identical responses → identical rungs, scores, goals, content |
| 3 | Foundational calibration | Entry rung = highest correct − 1; calibration items excluded from attainment |
| 4 | Adaptive difficulty | ≥2/3 climbs, 1/3 holds with a variant, 0/3 steps down |
| 5 | Scoring | Indicator = 100×(0.5a+0.3d+0.2i); `depth` = rung ÷ ladder height |
| 6 | Domain scores | Every strand reported separately; no blended "reading score" |
| 7 | Confidence | LOW on <3 items, rapid responding, budget-stop; MEDIUM on ≥25% dialect flags |
| 8 | Skill-level routing | Cascade order: simplify → modality shift → backstep |
| 9 | Content selection | Blueprint never generates work for a strand above 80; never repeats a format twice running |
| 10 | Repeated updates | 2 sessions ≥80% climbs; 3 sessions <50% backsteps |
| 11 | Stopping | Stops on 2 empty rungs, on budget, on ladder top; **never exceeds the item budget** |
| 12 | Parent summary | No banned term; no reading age; disclaimer present; dialect caveat rendered beside the number |
| 13 | Down syndrome example | The §9 trace reproduces exactly |
| 14 | Williams syndrome example | Identical inputs → identical outputs to #13 |
| 15 | Age-7 foundational | A 7-year-old may sit at L0 with **no contradiction flag anywhere** |
| **16** ★ | **Cardinality not gated** | A child who counts to 3 and fails numeral recognition can still be measured at N1c (C1, D10) |
| **17** ★ | **Non-linear ladder** | A child may be measured at L5 with L4-rhyme unmeasured (D3) |
| **18** ★ | **Dialect honesty** | An MSA-only phoneme failure never lowers the phonological indicator without the caveat rendered (B5) |

Plus the existing suites, which must stay green: `npm test` (64),
`qa-journey` (42), `qa-demo-data` (34), `qa-security` (29), `qa-stories` (18),
`qa-a11y` (16), `qa-integration` (15), `qa-audio` (14), `qa-companion` (12),
`qa-resilience` (7), `npm run demo` diagnosis-blindness, `npm run build`.

---

## 13. Scope, staged

This is the largest phase so far — roughly 3,100 new lines, of which about 1,000
is the Arabic item bank. I would rather stage it than hand you one enormous
untested drop.

| Stage | Contents | Verifiable by |
|---|---|---|
| **5a** | Ladders, calibration engine, skill-estimate ledger, `entryHint`, tests 1–4, 15–17 | `npm test` + a headless calibration trace |
| **5b** | Scoring extension, confidence, profile strands, tests 5–8 | `npm test` + `npm run demo` blindness check |
| **5c** | Arabic literacy + numeracy item banks, dialect tagging, test 18 | `qa-ladders.mjs` |
| **5d** | Content blueprint, format rotation, tests 9–11 | `npm test` |
| **5e** | Calibration UI + results screen, parent snapshot, tests 12–14 | screenshots + `qa-a11y` |

Each stage ends green before the next starts.

---

## 14. What this will not be, stated plainly

So that nothing in a demo overstates it:

- **Not validated, not normed, not standardised.** There is no Arabic norming
  sample for any of this. B8 records that as of 2021 no standardised Arabic
  reading measure existed at all.
- **Not a computerised adaptive test.** ~50 uncalibrated items means no item
  response theory, no ability estimates, no standard errors (F1).
- **The session-length target is not evidence-based** (F6).
- **The dosage advice is not evidence-based** — no source supplies one.
- **The stop rule is a convention, not a finding** (F2).
- **The dialect-distance list will ship provisional** and needs an Egyptian
  speech-language specialist (B5, B6). I will not generate it and call it data.
- **There is no evidence at all on Arabic reading in Down syndrome.** Not thin —
  none was found to exist. Every Arabic decision here rests on typically
  developing Arabic children plus non-Arabic disability research, and that join
  is an assumption.

Every one of these is tagged in `spec.js` under the existing `VALIDATION`
vocabulary, so a specialist can find them without reading the code.

---

## 15. The decision I need before writing code

**Option A, B or C from §0.4.** My recommendation is **A** — research shapes the
ladder and the items identically for every child; calibration finds the rung;
the diagnosis reaches only the accommodation defaults, as it does today.

The argument is not primarily ethical. It is that the priors available are too
noisy to beat two minutes of watching the child, and the retrieved literature
says so four separate ways (E1, D10, D6, E2).

Tell me A, B or C and I will start with stage 5a.
