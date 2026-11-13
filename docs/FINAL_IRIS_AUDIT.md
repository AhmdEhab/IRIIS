# FINAL IRIS AUDIT — pre-DemoDay verification

**Date:** 6 September 2026
**Method:** code-path tracing + real browser journeys against a running frontend and backend, not documentation review.

---

## 0. How to read this

A requirement is marked **✅ COMPLETE** only where the actual code path was traced *and* the behaviour was observed at runtime. Where only one of those was possible, it is marked ⚠️ or 🔍 and the reason is stated.

Three requirements were found **implemented but not connected** and were fixed during this audit. They are listed in §2 with what was wrong and how it was verified afterwards. Nothing was marked COMPLETE on the strength of a passing test alone.

| Symbol | Meaning |
|---|---|
| ✅ | Verified working end to end |
| ⚠️ | Works, with a stated limitation |
| ❌ | Not present |
| 🐛 | Present but broken *(none remain — all found were fixed)* |
| 🔍 | Cannot be verified from this environment |

---

## 1. Requirements checklist

### Brand identity & UI

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1.1 | IRIS palette (blue, coral, yellow, green, purple) | ✅ | `src/styles/iris.css` `@theme` tokens; observed on every screenshot |
| 1.2 | Warm-white / cream ground | ✅ | `--color-ground: #fef6ea`; observed |
| 1.3 | Rounded cards, organic shapes | ✅ | `Surface`, `Blob`, `DashedArc` in `ui/brand/` |
| 1.4 | Stars / sparkles / dots / rays | ✅ | `ui/brand/Decor.tsx` — 7 primitives, all in use |
| 1.5 | Consistency across screens | ✅ | Every IRIS screen composes the same `Surface`/`SectionHeader`/`Pill` |
| 1.6 | Warm, playful, hopeful — not clinical | ✅ | Observed on 6 screenshots, Arabic and English, mobile and desktop |
| 1.7 | Child-friendly hierarchy | ✅ | Large tap targets, one question per screen, no dense text in Child Mode |
| 1.8 | Legacy screens visually integrated | ⚠️ | Legacy activity screens are wrapped in `ChildShell` so the avatar and stars persist, but their internals predate the brand system. Not a regression; a known cosmetic seam |

### Child companion

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 2.1 | Companion exists | ✅ | `IrisBuddy.tsx`, 9 moods, brand petals |
| 2.2 | Visually integrated | ✅ | `qa-companion` 12/12 |
| 2.3 | Behaviour connected, not decorative | ✅ | `IrisCompanion` maps moments → mood + line |
| 2.4 | Honours reduced motion | ✅ | `qa-companion`: "0 moving" under `prefers-reduced-motion` |
| 2.5 | Companion appears during the new ladder assessment | ❌ | **Not present.** The ladder assessment and practice screens do not render the companion. Non-blocking (the screens are warm without it) but it is an inconsistency — see §4 |

### Child Mode journey

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 3.1 | Landing → profile → assessment | ✅ | Browser journey, `verify-phase9.mjs` |
| 3.2 | Assessment → feedback → scoring | ✅ | 70 items answered, completion screen reached |
| 3.3 | Scoring → results | ✅ | Snapshot rendered with real indicators |
| 3.4 | Results → personalized content | ✅ | Plan rendered from the child's own priorities |
| 3.5 | Content → next activity (**loop closes**) | ✅ | **Fixed in this audit.** 4 practice rounds, estimate advanced each round |
| 3.6 | No dead ends | ✅ | Every route reachable; legacy orphan cluster confirmed unreachable |
| 3.7 | Refresh / state persistence | ⚠️ | In-memory only. A refresh mid-assessment restarts it. The completed assessment persists server-side; the in-progress one does not. See §4 |
| 3.8 | Error states | ✅ | `qa-resilience` 7/7; TTS failure verified degrading to browser voice |

### Parent Mode

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 4.1 | Dashboard | ✅ | `IrisParentHome` — 6 sections, screenshot verified in Arabic |
| 4.2 | Learning snapshot (strengths / developing / priorities) | ✅ | Observed with real data |
| 4.3 | Progress over sessions | ✅ | `IrisParentDashboard` (legacy goal loop) |
| 4.4 | Recommendations | ✅ | Priorities + suggested practice |
| 4.5 | Guidance / home tips | ✅ | `IrisHomeTips` |
| 4.6 | Support assistant | ✅ | **Fixed in this audit** — see §2.2 |
| 4.7 | Community | ⚠️ | Demo-only by design, labelled «قريبًا». `qa-demo-data` 34/34 |
| 4.8 | Specialists | ⚠️ | Demo-only by design, labelled. No fabricated practitioners |
| 4.9 | Feels useful, not placeholder cards | ✅ | The snapshot and the chatbot both carry the child's own observations |

### Parent Support Assistant

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 5.1 | Uses child profile / assessment / performance | ✅ | **Fixed in this audit.** Verified in-browser: real strengths, floors and confidence quoted back |
| 5.2 | Actionable, specific, empathetic | ✅ | Seven-part answer observed: observed → meaning → today → activity → duration → watch → adjust |
| 5.3 | Grounded, never invented | ✅ | With no child data the assistant returns `FALLBACK_NO_ANSWER`, not a fabricated plan |
| 5.4 | No diagnosis, no medical claims | ✅ | Safety routes intercept; `tests/iris.test.js` covers 64 cases including the regex boundaries |
| 5.5 | No deterministic syndrome claims | ✅ | The diagnosis is not in the chatbot's context object at all |
| 5.6 | Numeracy home activities | ❌ | The playbook has nine activities, none numeracy. When the top priority is numeracy the assistant correctly says it has no approved answer rather than inventing one. **Honest, but a content gap** — see §4 |

### Assessment

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 6.1 | Age used in initialization | ✅ | **Fixed in this audit** — see §2.1 |
| 6.2 | Age is downward-safe only | ✅ | `entryRungsFrom()` takes no age; asserted structurally by test |
| 6.3 | Foundational calibration before advancement | ✅ | 10 probes, entry = highest correct − 1 |
| 6.4 | Age 7 not assumed to be at grade level | ✅ | Journey B: age 7 + foundational answers → entry rung ≤ 1, no contradiction flag |
| 6.5 | Literacy ladder exists and is used | ✅ | L0–L8 + listening track, 17 strands, exercised in every run |
| 6.6 | Numeracy ladder exists and is used | ✅ | N0–N7 + cardinality, 9 strands |
| 6.7 | Other domains represented | ✅ | Listening comprehension as a parallel track; attention/memory via the original nine sub-measures |
| 6.8 | Performance affects next task | ✅ | `qa-ladders` scenarios B/C/D/E |
| 6.9 | Can move down to foundation | ✅ | Scenario C: descends below entry |
| 6.10 | Can move up on mastery | ✅ | Scenario B: climbs 3+ rungs |
| 6.11 | Support required is considered | ✅ | `independence` term; `supported` tracked separately |
| 6.12 | Repeated observations update the estimate | ✅ | 4 practice rounds in-browser |
| 6.13 | Not a fixed sequence | ✅ | Three different response traces produce three different lengths |
| 6.14 | Syndrome research used as design input | ✅ | 57 findings in `ASSESSMENT_RESEARCH_MATRIX.md`, each cited by a strand |
| 6.15 | Observed performance overrides assumptions | ✅ | There is no syndrome prior to override — placement is blind by construction |
| 6.16 | Never implies "syndrome X → cannot do Y" | ✅ | Five diagnoses, identical responses → byte-identical output |

### Arabic literacy

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 7.1 | Letter recognition, names, sounds | ✅ | 3 separate strands; both sound→letter and letter→sound measured independently |
| 7.2 | Visually similar letters (dot contrasts) | ✅ | All 9 confusion sets, own error code |
| 7.3 | Positional letter forms | ✅ | Isolated / initial / medial / final sampled |
| 7.4 | Diacritics | ✅ | All literacy targets fully vowelised; asserted by test |
| 7.5 | Phonological awareness, blending, segmentation | ✅ | 4 strands in the researched difficulty order |
| 7.6 | Word recognition, simple reading, comprehension | ✅ | L5–L8 |
| 7.7 | Egyptian Arabic spoken, MSA written | ✅ | Instructions colloquial, targets MSA — the Egypt EGRA precedent |
| 7.8 | Dialect-distance handling | ⚠️ | Implemented and annotation-only, but the phoneme list is **provisional** and needs an Egyptian specialist. See §4 |
| 7.9 | Not a translated English test | ✅ | Items generated from an Arabic letter table with forms, dots and dialect tags |

### Numeracy

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 8.1 | Quantity → counting → numerals → sense → sequence → operations → patterns → functional | ✅ | N0–N7 |
| 8.2 | Subitizing bounded by evidence | ✅ | Capped at 4 items; asserted by test |
| 8.3 | Cardinality independent of counting | ✅ | Parallel rung; scenario I |
| 8.4 | Identifies the actual starting point | ✅ | Calibration entry rungs observed differing by trace |
| 8.5 | Eastern Arabic numerals | ✅ | Asserted by test; observed on screen (٢ ٣) |

### Activity variety

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 9.1 | Multiple interaction types | ✅ | 3 response shapes implemented: single-select, tap-each, ordered-select. 33 templates |
| 9.2 | Same skill via different formats | ✅ | Declared modality pairs; rotation asserted by test |
| 9.3 | Not repetitive | ⚠️ | 24 of 28 strands have only one template, so rotation is limited for those. Tracked by a test rather than hidden. See §4 |

### Scoring & indicators

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 10.1 | Domain-level, not one percentage | ✅ | 13–14 strand indicators per run; no overall score exists |
| 10.2 | Confidence reported | ✅ | Per strand + overall |
| 10.3 | Support required reflected | ✅ | `independence` in the formula, `support_ratio` reported |
| 10.4 | Strengths / developing / priorities | ✅ | Observed on screen |
| 10.5 | Results consumed by the next stage | ✅ | Blueprint reads indicators; tier derived from them |
| 10.6 | "Not measured" is not zero | ✅ | Renders `—`; asserted by test and observed |

### Personalization pipeline

| # | Step | Status | Real code path |
|---|---|---|---|
| 11.1 | Child profile → age | ✅ | `AppContext.childProfile.age` → `startChild(…, age)` → `IrisContext.childAgeYears` |
| 11.2 | Age → calibration | ✅ | `ladderCalibrationProbes({ageYears})` → `capProbes()` |
| 11.3 | Calibration → entry rungs | ✅ | `runCalibration()` → `entryRungsFrom()` |
| 11.4 | Entry → adaptive probe | ✅ | `startProbe` → `nextProbe`/`recordProbe` driven by the UI |
| 11.5 | Probe → indicators | ✅ | `finaliseLadderAssessment()` → `scoreProbe()` |
| 11.6 | Indicators → priorities | ✅ | `strandProfile()` → `learningPriorities()` |
| 11.7 | Priorities → content plan | ✅ | `contentBlueprint()` → `materialise()` |
| 11.8 | Plan → activity difficulty | ✅ | `tierFor()` → `OPTIONS_PER_TIER` + scaffold flags |
| 11.9 | Practice → new observation | ✅ | **Fixed in this audit** — `IrisLadderPractice` → `recordLadderPractice()` |
| 11.10 | Observation → updated estimate | ✅ | `updateEstimate()`; observed advancing over 4 rounds |
| 11.11 | Updated estimate → re-plan | ✅ | `planLadderContent` re-runs on every practice result |
| 11.12 | Reassessment | ⚠️ | The assessment can be re-run manually. There is no automatic reassessment trigger wired for the ladder (the legacy loop has one). See §4 |

### Research integration

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 12.1 | Research matrix exists | ✅ | 57 findings, gaps preserved |
| 12.2 | Research shapes the ladders | ✅ | Every strand cites matrix row IDs; asserted by test |
| 12.3 | Research shapes item design | ✅ | Dot contrasts (B2), letters-with-sounds (A3), picture support (B11) |
| 12.4 | Research shapes routing | ✅ | Blending before segmentation (A3); cardinality ungated (C1/D10); names ∥ sounds (A4) |
| 12.5 | Research shapes accommodations | ✅ | WS muted audio (E9) — the permitted diagnosis channel |
| 12.6 | Not documentation-only | ✅ | Removing any cited finding would change engine behaviour, not just a comment |
| 12.7 | Documented but unimplemented | ⚠️ | **Morphological awareness** (B8/B12) is documented as a required fourth Arabic domain and explicitly deferred, not built. Flagged in `LITERACY_META.deferred` |

### Database / backend

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 13.1 | API routes | ✅ | 16 endpoints |
| 13.2 | Assessment persistence | ✅ | POST 201, reload identical, verified against the live API |
| 13.3 | Additive migration for old databases | ✅ | Verified: 4 columns added on boot to a pre-existing table |
| 13.4 | Legacy assessments still work | ✅ | Both kinds coexist: `SUB_MEASURE,LADDER` |
| 13.5 | Session / progress persistence | ✅ | `qa-security` covers survival across restart |
| 13.6 | Practice-session persistence | ❌ | **Practice results update the in-memory ledger but are not POSTed to the backend.** A page reload loses them. See §3 |
| 13.7 | Error handling | ✅ | Cache-write failure no longer discards good audio (fixed in Phase 8) |

### Auth / security

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 14.1 | No secrets committed | ✅ | `.env` gitignored at any depth; no key pattern in source |
| 14.2 | ElevenLabs key never in frontend | ✅ | No key, no `xi-api-key`, no `ELEVENLABS_API_KEY` in the built bundle |
| 14.3 | No secret logged | ✅ | 3 log statements, none interpolate the key |
| 14.4 | `/status` exposes shape only | ✅ | Key length and trim flag only |
| 14.5 | Input validation | ✅ | `qa-security` 29/29 — short password, malformed email, missing consent all rejected |
| 14.6 | Auth boundaries | ✅ | `requireAuth` / `requireSelf` / `requireConsent`; token dead after logout |
| 14.7 | CORS | ⚠️ | `origin: true` reflects any origin. Lower risk because auth is Bearer-token, not cookie-based, but it should be pinned before any public deployment. See §4 |
| 14.8 | No hardcoded production credentials | ✅ | The only hardcoded secret is the demo parent PIN `1234`, in an unreachable legacy screen |

### Voice / audio

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 15.1 | Full pipeline frontend → proxy → ElevenLabs → playback | ⚠️→🔍 | Verified through a mock upstream: correct voice per language, correct settings, paced text, cache miss→hit. **The real ElevenLabs call cannot be made from this container** |
| 15.2 | Arabic and English voices routed separately | ✅ | `VOICEAR` / `VOICEEN` observed in the captured request bodies |
| 15.3 | Delivery calm, slower, non-theatrical | ✅ | stability 0.68/0.62, speed 0.90/0.94, style 0 |
| 15.4 | Caching | ✅ | miss→hit observed; settings in the cache key |
| 15.5 | Browser fallback | ✅ | Verified: with the upstream down every line returned `fallback:true` and the app spoke |
| 15.6 | Prewarm concurrency protection | ✅ | `WARM_CONCURRENCY = 2`, live line first |
| 15.7 | No overlapping audio | ✅ | `qa-audio` 14/14 with `HTMLAudioElement.prototype.play` instrumentation |
| 15.8 | Egyptian Arabic quality | 🔍 | **Cannot be judged automatically.** Requires listening — `node scripts/check-voice.mjs` on a machine with the key |

### Existing features (regression)

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 16.1 | Stories | ✅ | `qa-stories` 18/18 |
| 16.2 | Games / activities | ✅ | `qa-journey` 42/42 |
| 16.3 | Navigation | ✅ | All routes reachable; 0 page errors across journeys |
| 16.4 | Audio | ✅ | `qa-audio` 14/14 |
| 16.5 | Legacy goal loop | ✅ | 119 unit tests including the original 64 |
| 16.6 | Diagnosis-blindness | ✅ | `npm run demo` — identical across 5 diagnoses |

### Responsive / states

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 17.1 | No horizontal overflow | ✅ | 0px at 360/390/820/1440 |
| 17.2 | No clipped text / unusable controls | ✅ | **Fixed in this audit** — header ran under the fixed controls on mobile |
| 17.3 | Arabic renders correctly | ✅ | RTL screenshot verified; bidi isolation on mixed-script lines |
| 17.4 | Loading / empty states | ✅ | Snapshot and practice both have real empty states with a way forward |
| 17.5 | Graceful failure | ✅ | Save failure surfaced to the parent, not swallowed |

---

## 2. Bugs found and fixed during this audit

### 2.1 Age was collected but never reached the engine 🐛→✅

`RegistrationScreen` collects an age and `AppContext.childProfile.age` holds it, but all three `startChild()` call sites dropped it. `childAgeYears` was therefore always `null` in the running app and the age hint never applied — the requirement "age is used in assessment initialization" was met in the engine and unmet in the product.

Behaviour was *safe* (a null age means no probes are skipped, which is the conservative default), which is why no test caught it.

**Fixed:** age threaded through `App.tsx`, `IrisFlow.tsx` and the `prefillAge` prop.

### 2.2 The parent assistant could not see the assessment 🐛→✅

`IrisParentChat` passed `{assignments, lastDecision, snapshots, profile, sessions}` — the *legacy* sub-measure profile. A parent whose child had just completed a full ladder assessment got `FALLBACK_NO_ANSWER`, which the brief rules out explicitly.

**Fixed:** a `ladder` context block (strengths, developing, floors, priorities, confidence) is passed and consumed additively. A strand→activity mapping was added **only where a genuine counterpart exists**; numeracy is deliberately absent because the playbook has no numeracy activity and pointing at the nearest one would be fabricating advice.

Verified in-browser. Before: `FALLBACK_NO_ANSWER`. After:

> *In the getting-to-know activities, what went best was Following a two-step instruction and Understanding a spoken sentence.*
> *On Dot-contrast discrimination and Positional letter forms we tried and no answer came out right, so that is a good place to start practising.*

With no child data it still returns `FALLBACK_NO_ANSWER` — it does not fabricate.

A second defect surfaced while verifying: floors appeared in both the "still building" and "we tried it" sentences, naming the same skills twice. Also fixed.

### 2.3 The content plan was displayed but not playable — the loop never closed 🐛→✅

**The most serious finding.** `recordLadderPractice()` and the blueprint existed and were unit-tested, but **no component in the app ever called them.** The snapshot listed "what he will work on" and there was no route from that list into an activity. Every child's skill estimate was frozen after the assessment.

**Fixed:** added `IrisLadderPractice`, routed at `iris-ladder-practice`, reachable from the snapshot. The shared item renderer was extracted to `ui/LadderItemCard.tsx` so the assessment and practice screens cannot drift apart.

Verified in-browser over four practice rounds — the estimate advanced in each.

### 2.4 Decorative blob rendered grey 🐛→✅

Brand blue at 0.09 opacity desaturates against the cream ground. Caught by looking at the screenshot, not the hex value. Changed to coral.

### 2.5 Page heading ran under the fixed controls on mobile 🐛→✅

`GlobalControls` is `fixed top-4 right-4`; in RTL the heading starts at the same corner and was overlapped at 390px. Added `pt-20 sm:pt-6` clearance to the four IRIS screens.

### 2.6 A source file was binary 🐛→✅

`src/App/audio/voice.ts` used a literal NUL byte as a cache-key separator, so git showed no diffs for it and `grep` skipped it. Replaced with a space (provably unambiguous — `lang` is always two characters).

---

## 3. Critical blockers

**None.**

The one issue that came close is listed below as high-priority-but-not-blocking, with the reasoning stated so you can disagree.

### Practice results are not persisted to the backend (13.6)

Practice updates the in-memory ledger and re-plans correctly, but no `POST` writes it. A page refresh loses the practice history; the completed assessment survives because it *is* POSTed.

**Why this is not a demo blocker:** a demo runs in one session, the loop demonstrably closes within that session, and nothing incorrect is shown — the data is simply not durable across a reload.

**Why it matters after DemoDay:** without it, "progress over time" cannot be real. This is the first thing to build next.

---

## 4. Non-critical issues

| Issue | Impact | Recommendation |
|---|---|---|
| **Dialect-distance list is provisional** (7.8) | Arabic phonological caveats rest on descriptive Cairene phonology, not validated child data | Needs an Egyptian speech-language specialist. Annotation-only, so it cannot distort a score |
| **No numeracy home activity** (5.6) | The assistant declines rather than advising when numeracy is the top priority | Add 3–4 numeracy activities to the playbook |
| **24 of 28 strands have one template** (9.3) | Limited format rotation on those strands | Add second formats to the highest-traffic strands |
| **Companion absent from the new screens** (2.5) | Visual inconsistency between old and new child screens | Add `IrisCompanion` to assessment and practice |
| **In-progress assessment not resumable** (3.7) | A refresh mid-assessment restarts it | Persist probe state, or warn before leaving |
| **No automatic ladder reassessment trigger** (11.12) | Priorities only refresh when the assessment is re-run manually | Wire the existing `reassessmentTriggers` to the ladder |
| **CORS reflects any origin** (14.7) | Low — Bearer-token auth, not cookies | Pin `CORS_ORIGIN` before public deployment |
| **Morphological awareness deferred** (12.7) | A documented Arabic domain is not built | Explicitly deferred, already flagged in code |
| **Legacy screens visually dated** (1.8) | Cosmetic seam | Out of scope; they work |
| **Legacy orphan cluster on disk** | `ChildModeScreen`, `ModeSelectionScreen`, `ParentDashboardScreen` etc. are unreachable but present | Harmless; deleting is a separate decision |

---

## 5. Verified working flows

Each of these was **executed in a real browser** against a running Vite frontend and Express backend, not simulated.

| Journey | Result |
|---|---|
| **A — New child** | register → login → Parent Mode → snapshot → assessment → 70 items → results. 0 page errors |
| **B — Age 7, foundational** | Age 7 with foundational answers → entry rung ≤ 1 → foundational tiers → no contradiction flag |
| **C — Strong performer** | Climbs 3+ rungs above entry; explores 4+ numeracy rungs |
| **D — Struggling performer** | Descends below entry, stops early (24 items not 60), every activity scaffolded, no punitive language |
| **E — Parent** | Snapshot with real indicators → chatbot answering with the child's own observations |
| **F — Voice** | Correct voice per language, tuned settings, paced text, cache miss→hit, fallback on upstream failure. **Against a mock upstream** — the real API is unreachable from here |
| **Loop closure** | 4 practice rounds; skill estimate advanced in each |
| **Diagnosis-blindness** | 5 diagnoses, identical responses → byte-identical academic output |
| **Persistence** | POST 201 → reload → identical; legacy and ladder assessments coexist |
| **Responsive** | 0px overflow at 360 / 390 / 820 / 1440 |

---

## 6. Test results

```
npm test                     119/119   (64 legacy + 55 Phase 5)
npm run build                clean, ~4s
npm run demo                 IDENTICAL OUTCOMES ACROSS ALL 5 DIAGNOSES: PASS

node qa-voice-tuning.mjs      67/67  (1 skipped: live ElevenLabs)
node qa-ladders.mjs           54/54
node qa-journey.mjs           42/42
node qa-demo-data.mjs         34/34
node qa-security.mjs          29/29
node qa-tts.mjs               19/19
node qa-voice.mjs             19/19
node qa-stories.mjs           18/18
node qa-a11y.mjs              16/16
node qa-integration.mjs       15/15
node qa-audio.mjs             14/14
node qa-companion.mjs         12/12
node qa-demo-visual.mjs       10/10
node qa-resilience.mjs          7/7
                             ──────
                             475 automated checks, 0 failures
```

Browser journeys: `node verify-phase9.mjs`, `node verify-phase9b.mjs`, `node shot-p9.mjs`.

**No test was weakened, skipped or deleted.** Three test *assertions* were corrected during the audit because they were checking the wrong thing (a substring match on `DOWN` inside `STEP_DOWN`; the word "indicator", which is the approved public term; and "the plan's names must change after practice", which would have asserted a bug). Each correction is documented at the assertion.

**`node scripts/check-voice.mjs` was run and correctly refused to proceed:** no `ELEVENLABS_API_KEY` exists in this container. It must be run on the machine holding the real key.

---

## 7. Requirements summary

| | Count |
|---|---|
| ✅ Complete | **78** |
| ⚠️ Partially complete | **11** |
| ❌ Missing | **4** |
| 🐛 Broken | **0** *(6 found, 6 fixed)* |
| 🔍 Not verifiable here | **2** |
| **Total** | **95** |

The four missing items: practice-session persistence (13.6), numeracy home activities (5.6), companion on the new screens (2.5), morphological awareness (12.7 — explicitly deferred, not forgotten).

---

## 8. What this product is not

Stated here so nothing in a demo overstates it:

- **Not validated, not normed, not standardised.** No Arabic norming sample exists for any of this content.
- **Not a computerised adaptive test.** No item response theory, no ability estimates, no standard errors — the item bank is uncalibrated.
- **Not diagnostic.** No IQ, no percentiles, no age equivalents, no reading ages. Enforced by `BANNED_TERMS` and by tests.
- **The session-length target and the practice dosage are engineering choices**, not evidence-based ones.
- **There is no research at all on Arabic reading in Down syndrome.** Not thin — none was found to exist. Every Arabic decision joins typically-developing Arabic research to non-Arabic disability research, and that join is an assumption.

---

## 9. Final demo readiness

# 🟡 READY WITH KNOWN NON-BLOCKING ISSUES

Every core flow works end to end in a real browser: assessment, adaptive routing, scoring, personalized content, practice, loop closure, parent snapshot, contextual assistant, voice with fallback, persistence, security. 475 automated checks pass. Diagnosis-blindness holds. No critical blocker remains.

It is **not 🟢** for two honest reasons:

1. **Practice results do not survive a page reload.** The loop closes within a session and nothing incorrect is displayed, but "progress over time" is not yet durable.
2. **The real ElevenLabs call has never been verified from this environment.** Everything up to the API boundary is proven against a mock; the last hop needs `node scripts/check-voice.mjs` on your machine — and how the Arabic actually *sounds* can only be judged by listening.

Both are known, bounded and stated. Neither will break a demo. Calling this 🟢 would mean claiming verification I have not performed.

### Before you demo

1. Run `npm run server`, then `node qa-voice-tuning.mjs` and `node scripts/check-voice.mjs` on the machine with the key.
2. **Listen** to `voice-tuning-output/` — MSA, Egyptian conversational, Egyptian correction, English.
3. Do one full run yourself: Parent Mode → Learning Snapshot → assessment → practice. It takes about ten minutes and it is the demo.
4. Rotate the ElevenLabs key if it was ever pasted into a chat transcript.
