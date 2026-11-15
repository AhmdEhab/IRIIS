# IRIS av2 — Assessment Development Implementation Spec
**Date:** 2026-11-15 · **Status:** APPROVED FOR BUILD (implements `ASSESSMENT_DEV_DIRECTIVE.md` + `ASSESSMENT_FRAMEWORK.md` §6)
**rule_pack_version:** `av2-1.0.0` · **child instrument version:** `av2` · parent instrument stays `cv2` (with functional fixes P1–P4 below).

## 0. Non-negotiables
- Never a single number, never diagnosis, never a claimed validated instrument (validation badges stay honest: `RESEARCH_INFORMED_PROTOTYPE / NOT_REVIEWED`).
- cv1 records and current `phase5-1.0.0` ladder records must hydrate and render unchanged. Detection: `item_results.bankVersion ?? 'phase5-1.0.0'` for LADDER rows; caregiver `pick()` contract `{responses, scored}` unchanged.
- Opportunity ≠ inability: caregiver "لم يتعلم بعد" never becomes a child failure; it becomes `no_opportunity`.
- All strings IRIS-authored, Egyptian-friendly Arabic primary + English mirror.

## 1. Child observation model (av2 core)
Per presented item the UI records one observation object:

```js
{
  item_id, strand, rung, template_id,
  target_skill,            // from template metadata (stable id, e.g. 'letter-identify')
  mode,                    // 'single' | 'tap_each' | 'ordered' | 'listen_select'
  response,                // index/taps/order actually produced (sanitized, no PII)
  outcome,                 // one of the SIX below
  prompt_level,            // 0 none shown · 1 hint shown/replayed · 2 helper-assisted confirm
  accommodation,           // {audio_auto, target_size, wait_ms, helper_present, response_mode}
  completed,               // boolean — child engaged to an end state
  latency_ms,              // DATA QUALITY ONLY (never feeds scoring)
  at                       // ISO timestamp
}
```

Outcomes (exactly six, enums frozen):
1. `demonstrated_independent` — correct at prompt_level 0.
2. `demonstrated_with_support` — correct after hint (prompt_level ≥1) or helper confirmation.
3. `not_demonstrated` — presented with full accommodation support, answered incorrect twice.
4. `insufficient` — presented but child disengaged / no response after two open windows (NEVER treated as failure; engine counts it toward "needs more information", not accuracy).
5. `no_opportunity` — domain pre-gated from caregiver exposure answers; item not presented (logged at domain level).
6. `invalid_administration` — VISIT-level: <50% of a visit's items have `completed:true` OR app interruption mid-visit → the whole visit never updates estimates; child sees the retry-with-supports message ("مفيش مشكلة! نعمل حاجة تانية وبعدين نرجع"). Never "untestable".

Scoring semantics preserved: `indicators.js` accuracy/depth/independence formulas stay; `supported` becomes REAL (`independence = 1 − support_ratio` now moves). av2 visits supply `supported = count(demonstrated_with_support)`.

## 2. Domains (6) — mapping to strands
| Directive domain | Ladder home | av2 status |
|---|---|---|
| A Communication & Language | LITERACY/LISTENING track (receptive) + NEW `COMM` track: `COMM.EXPRESS_CHOICE` r0 (choose-with-confirmation game: "اختار لعبة — قول/أشر وأنا أدوس") + `COMM.LABEL` r1 (name-the-picture, accept ANY vocal via helper confirm; tap fallback) | NEW 2 strands, ~12 items |
| B Early literacy | existing LIT readiness/letters/sounds | retained |
| C Reading & comprehension | existing DECODING/WORD_READING/READ_COMP/FUNCTIONAL | retained |
| D Mathematics | existing NUM strands | retained |
| E Visual recognition & matching | NEW `VSP` ladder: `VSP.MATCH` r0 (identical picture), `VSP.DIFFERENCE` r1 (find the different one), `VSP.SORT` r2 (sort by color/kind), `VSP.PATTERN` r3 (extend the pattern — reuse NUM.PATTERN templates re-hosted under VSP semantics) | NEW ladder 4 strands ~16 items |
| F Memory & attention | NEW `MEM` ladder: `MEM.VISUAL_STM` r0 (what disappeared? 3→2 tiles), `MEM.SEQUENCE` r1 (do 2 steps in order shown+spoken), `MEM.MEDIAL` r2 (which came first?) + `ATT` observed WITHOUT its own tasks: engagement metrics (completed %, off-task pauses) tagged as `attention_observations` data-quality only, never an ATT score | NEW ladder 3 strands ~12 items |

Anti-rules enforced: COMM expressive items NEVER require vocal output (helper-confirm mode); VSP/MEM presence does not unlock or gate LIT/NUM (track independence, `independent_of` doctrine); no strand reads `condition` (structural, tested).

## 3. Opportunity gating (child entry)
At ladder INTRO, if caregiver profile exists:
- `scored.opportunityGates.LITERACY === 'not_yet'` (cv2 VQ13 not_yet / cv1 L7 gate) → LITERACY MAIN track is pre-closed: `no_opportunity` logged for the track; parent gets an explicit opt-in chip "نجرّب على أي حال" (default OFF).
- Same rule for NUMERACY via `opportunityGates.NUMERACY` (cv2 maps from VQ11/VQ13 math exposure; conservative: only clear 'not yet' gates).
- LISTENING/VSP/MEM/COMM always open (never academic-exposure-dependent).
- Gating writes NOTHING to child records except the `no_opportunity` domain entries (excluded from every difficulty/accuracy count).

## 4. Adaptive rules (unchanged engine + 2 additions)
- Existing calibration → probe walk unchanged (entry-minus-one, climb/partial/down, empty-rung stop, rescue).
- NEW: first `insufficient` in a strand → next probe re-attempts same rung with `paired_modality` (audio+visual) before stepping anywhere; second `insufficient` → strand marked `needs_more_information` and skipped (no repetition loop).
- NEW: `demonstrated_with_support` counts as 0.5 correct for CLIMB thresholds (partial credit) — climb requires the same ≥0.6 rule; floor/stop rules otherwise identical.
- Session: keep 3 items/visit; cap `ITEMS_PER_SESSION_UI = 15` presented max per sitting with offer-break-and-resume (was 12); target 8–15 min honest via items count, shown to parent as "٨–١٥ دقيقة حسب الطفل".

## 5. Breaks & resume
- Break button added to CALIBRATION phase too (currently PROBE-only).
- Server-side ladder draft: `POST/GET /api/ladder/draft` mirror of caregiver routes: `{childId, clientRef, status:'IN_PROGRESS'|'COMPLETE'|'INVALID', state:{phase, calIndex, calResponses, probeState, visitSeed, observations, startedAt, bankVersion:'av2'}}` capped 512 KB. UI flushes: on every observation (800 ms debounce) + `pagehide` + visit boundary (forced). Boot resume order: server draft (same clientRef family) > local > fresh. Completed LADDER record still clears drafts.
- `INVALID` status drafts never hydrate as resume points.

## 6. Child-visible progress & feedback
- "فاضل حوالي X أنشطة" chip stays; after each visit progress dots fill honestly (calibration + planned ~5 visits shown as ring segments).
- Feedback: praise stays correctness-free (effort/continuation). NEW: when `not_demonstrated`, no red/incorrect UI — card says "جميل إنك جربت! نكمّل لحاجة تانية" and moves on. When `insufficient`: "تمام، خلصنا دي — ممكن نرجعلها بعدين".
- DONE screen lists per-domain one-line observations with confidence words (تمت Independently/with support/needs another look/no-opportunity note) — no numbers.

## 7. Record envelope (LADDER POST)
```js
item_results = {
  bankVersion: 'av2',
  calibration: entry_rungs,            // same shape as today
  probe: [ visit ],                    // same shape + supported REAL + invalid_flag
  observations: [ obs objects ],       // full transparency log (W5)
  opportunityGates: {...},             // what was pre-closed and why (source: caregiver id)
  visitValidity: [ {visit, valid|low|invalid} ]
}
```
`domain_scores`, `skill_estimates`, `learning_priorities`, `confidence`, `data_quality_flags`, `accommodations_used`, `rule_pack_version:'av2-1.0.0'`, `observationMeta`, `clientRef` unchanged top-level. Server accepts ANY prior shape untouched; av2 validation = enum/shape checks on the new arrays only (ids not cross-checked server-side; bank stays client authority).

## 8. Two-track connection (Part 3)
`merge.js` gains `computeTrackDiscrepancies(caregiverScored, ladderSnapshot)`:
- Compare per shared skill family (communication C-domain vs LISTENING/COMM indicators; independence S-domain vs assistance patterns; learning exposure L/opportunity vs LIT/NUM entry states).
- Rule: `caregiver.does_independently` + ladder `not_demonstrated` → "At home it happens; on screen today we didn't catch it — that usually means the task format is the barrier, not the skill." And the reverse. `emerging`/`needs_more_information` → "worth re-checking", not conflict.
- Output: `discrepancies: [{family, parent, observed, note}]` — rendered as a dedicated "لوحت اختلافات" strip on First Plan (neutral tone) and in the snapshot; NEVER averaged; priority resolver unchanged (track-balanced) except discrepancies demote, not change, learning-side claims (confidence note only).
- Completion summary for the PARENT instrument (P2 below) also lists collected info + confidence + limitations.

## 9. Parent instrument functional fixes (cv2, P-list)
- **P1 autosave hardening:** per-answer immediate server draft POST with an offline retry queue (next-answer or online event), `pagehide` synchronous `sendBeacon` fallback. Never lose the last answer server-side.
- **P2 completion summary screen:** after submit, a "ملخص اللي جمعناه" screen — strengths block first (G5/interests), then each block answered-count + confidence word + limitation note, then CTA "يلا نبدأ تقييم [الاسم]" into the ladder. (Framework §5: strengths first.)
- **P3 estimated remaining:** honest "فضلت X أسئلة من حوالي Y" (counts proven) + "لو الطفل اتغيرت حالته دلوقتي… زر الرجوع دايماً متاح" — NO minutes promise (unvalidated). Question count updates dynamically as follow-ups fire (max cap displayed "حتى ١٥").
- **P4 review edit:** already exists (derived steps + jump-to-edit) — verify editing an upstream answer re-fires/removes follow-ups instantly (it does — regression test it) + review shows outcome chips in parent words.

## 10. Server changes
- `/api/ladder/draft` POST/GET (+DELETE) exactly mirroring caregiver draft semantics (auth+consent+ownership, size caps, latest-wins).
- `/api/assessments` POST: additive only — when `item_results.bankVersion === 'av2'`, validate enums (`outcome`, `mode`, visitValidity) and cap arrays (10k obs → 413); legacy records bypass all new checks. GET shape unchanged. `observationJson` stays write-only.

## 11. Tests & acceptance
- Unit (new `tests/iris.av2.test.js`): bank validate (new ladders pass `validateLadders`, ≥2 rungs/track), per-item target_skill coverage, six-outcome enum frozen, supported-real independence (indicator with 2 independent ≠ 2 with-support), insufficient→paired_modality→needs_more_information walk, opportunity gating excludes tracks + logs no_opportunity (never not_demonstrated), invalid visit does not mutate ledger, diagnosis-blind extended to VSP/MEM/COMM, envelopes hydrate BOTH phase5-1.0.0 and av2 records (journey.fromAssessmentRecord version branch), discrepancies computed without averaging (symmetry test), no composite numeric.
- Payload smoke updated: allowed top-level keys of `item_results` = calibration, probe (+av2 extras when bankVersion present).
- QA browser (`qa-av2.mjs`): fresh cv2 family → gates honored (not_yet hides LIT with opt-in) → COMM/VSP/MEM items render (single/tap-each/ordered/modes) → hint after first miss records `demonstrated_with_support` (assert POST body) → reload mid-run resumes from SERVER draft → invalid run (<3 items) persists nothing and offers retry → DONE per-domain summary → First Plan shows discrepancy strip → completed LADDER clears drafts; regression: phase5-1.0.0 legacy record renders plan exactly as today.

## 12. Deliverable mapping (directive Part 7)
(1) §2 · (2) bank + §2 · (3) §2 table · (4) §1/§4 · (5) cv2 blocks (unchanged structure) + P-list · (6) cv2 followUpFires (already) + P4 · (7) §10 · (8) §8 · (9) §11 results · (10) limitations doc.
