# IRIS av2 — Assessment Development: Implementation Report
**Deliverable 10 of ASSESSMENT_DEV_DIRECTIVE.md** · Built on the approved contract `docs/research/AV2_IMPLEMENTATION_SPEC.md` · Repo: `AhmdEhab/IRIIS` branch `feature/iris-unification`.
**Status legend:** ✅ implemented & tested · 🟡 partial · ⛔ deliberately not done.

---

## 1) Child assessment — what the redesign is
The instrument remains a **learning ladder** (probe the child directly, diagnosis-blind, no single score). av2 widens it from 3 tracks to **six domains** and replaces the raw correct/incorrect ledger with a **six-outcome observation model** (spec §1): every presented item records `demonstrated_independent / demonstrated_with_support / not_demonstrated / insufficient / no_opportunity / invalid_administration` plus prompt level, accommodation snapshot, response mode, completion flag and latency (data-quality only — never ability).

| Domain | Ladder home | Items | Status |
|---|---|---|---|
| A Communication & language | LITERACY/LISTENING (receptive) + **new COMM track** (`COMM.EXPRESS_CHOICE`, `COMM.LABEL` — tap/point/AAC/helper-confirmed only; `vocal_required:false` is a structural default on every template) | ~12 new | ✅ |
| B Early literacy | existing 9 letter/sound strands | 93 | ✅ kept |
| C Reading & comprehension | DECODING / WORD_READING / READ_COMP / FUNCTIONAL, never unlocked by letter knowledge (soft hint only) | 29 | ✅ kept |
| D Mathematics | existing 9 NUM strands, cardinality parallel to counting | 70 | ✅ kept |
| E Visual recognition | **new VSP ladder**: MATCH r0 · DIFFERENCE r1 · SORT r2 · PATTERN r3 (`independent_of LIT.READINESS/NUM.PATTERN`) | ~18 new | ✅ |
| F Memory & attention | **new MEM ladder**: VISUAL_STM (what disappeared) · SEQUENCE (two steps shown+spoken) · MEDIAL (which came first). Attention is observed, not tested — `ATTENTION_POLICY {scored:false}` records engagement as data-quality only | ~12 new | ✅ |

Bank total grew **237 → 279 deterministic items**; every item now carries a stable `target_skill` id via `TARGET_SKILL_BY_TEMPLATE`. `validateLadders()` green; 37 strands.

### Adaptive rules (unchanged where sound, extended where mandated)
- Entry: calibration probes (age-capped, downward-safe) → entry rung = highest correct − 1. 🟡 Calibration keeps correctness semantics (spec was silent; documented decision).
- Walk: climb/hold/partial/down + modality pairs + rescue — untouched. New: tracks absent from calibration (VSP/MEM/COMM) **open at base rung** through a registry union, so new domains are probed without touching calibrated skills.
- New: first `insufficient` → same-rung **paired-modality retry** (audio+visual) before any step; second fully-insufficient visit → strand `NEEDS_MORE_INFORMATION`, stop reason `INSUFFICIENT_INFORMATION` — no repetition loops, no silence.
- `supported` is now **real** (W1 closed): a first miss offers the existing hint once (no red X, gentle Arabic copy), retry-correct ⇒ `demonstrated_with_support`; independence term `1 − support_ratio` finally moves. Partial credit 0.5 applies to climb math only; legacy records (supported=0) reproduce byte-identically.
- Second miss ⇒ `not_demonstrated` + «جميل إنك جربت! نكمّل لحاجة تانية» — never a failure screen. A calm «مش عارف؟ خلينا نكمّل» chip appears after long dwell (12 s, no sound, no countdown) ⇒ `insufficient`.
- Session: 3 items/visit, ~15-item UI cap with offer-break-and-resume; **break chip now exists in calibration too** (was probe-only). Target "8–15 minutes depending on the child" is stated as a target only.

### Validity (W4/W20 closed)
Per visit: `valid / low_performance / invalid_administration` (<50% completed ⇒ invalid). Invalid visits **never reach the engine** — one gentle retry of the same visit with supports, then a forced no-score skip. A run with <3 presented items persists nothing. DONE screen shows per-domain one-liners in words («واضح / محتاج نظرة تانية / ماخدش فرصة») — no numbers.

### Opportunity gating (never score an untaught skill)
At ladder INTRO, if the caregiver said the child has **not yet had letters/numbers** (cv2 `VQ13='not_yet'`, cv1 `L7='not_yet_chance'` or L-block `not_yet_opportunity`), the LITERACY-MAIN and NUMERACY tracks start **closed**: «قالوا لسه ماخدش فرصة — لو تحبوا نجرّب على أي حال، دوس هنا». Closed tracks log domain-level `no_opportunity` rows, contribute nothing to difficulty counts, and can be opened by one tap (explicit opt-in). Conservative rule: VQ13 wording covers letters *and* numbers, so it gates both; NUMERACY-only evidence does not exist in cv2 and nothing was invented.

## 2) Parent assessment (cv2) — functional requirements
The approved cv2 questionnaire (13±1 core questions, ≤15 with follow-ups, opportunity embedded in every scale, calm self-care card) gained its operational layer:
- **Autosave (P1, W3 closed harder than before):** every answer writes localStorage synchronously **and** posts the server draft immediately (in-flight coalescing); failures fall into a retry queue drained on the next answer and on `online`; `pagehide`/hidden flush via `sendBeacon` to `/api/caregiver/draft/beacon` (token-in-body, header-free transport). Save chip has an honest third tone «بينبعت…».
- **Completion recap (P2):** after submit, «ملخص اللي جمعناه» — **strengths first** («حاجات ظهرت — قبل أي حاجة تانية»), then per-block what was collected with parent-word states and confidence words (واضح/محتاج تأكيد/مش كافي), including the honest cv2 limitation that self-care and movement cap at MEDIUM. Handoff to the child ladder happens only via «يلا نبدأ تقييم <الاسم>».
- **Progress & honesty (P3):** «فضلت X أسئلة» over the derived step list (dynamic as follow-ups fire, cap «حتى ١٥» for cv2) + «لو أي إجابة اتغيّرت، الأسئلة اللي بعدها هتتعدّل تلقائيًا». No minutes promise anywhere — time stays an internal metric (`metrics.durationSeconds`, probes fired, care card shown).
- Navigation/review/section-intros/validation already existed (audit verdict EXISTS) and are regression-covered: editing an upstream answer re-derives downstream steps including removal of stale follow-ups; review jumps back per item.
- **Resume across devices:** drafts merge newest-wins (server vs local stamps), cv1-era drafts still resume on cv1 and score on cv1 (proven in QA), completed cv1 families are never re-run.

## 3) Two tracks, connected but never averaged (Part 3)
`merge.js` now computes **per-family discrepancies** (`computeTrackDiscrepancies`): communication (home words vs screen tasks), learning exposure (opportunity gates vs ladder entry states), support patterns (who helps at home vs prompted trials). Rendered on First Plan as **«لوحت الصورة في مكانين»** only when entries exist, each with a neutral note, e.g. «في البيت الحاجة دي بتتحصل لوحدها، وعلى الشاشة النهارده ماظهارش — ده في الغالب شكل المهمة على الشاشة هو اللي مختلف، مش المهارة نفسها. مفيش تعارض، الاتنين معلومة.» The static divergence sentence remains as fallback. Priority resolution stays track-balanced (top-3 interleaved, ≤2 per track); discrepancies demote confidence, never rewrite claims. ⛔ No numeric agreement statistic — nothing to average, nothing invented.

## 4) Storage, versioning, and the server contract
- **Child runs:** POST `/api/assessments` `item_results = { bankVersion:'av2', calibration, probe(+supported real, +insufficient, +invalid_flag), observations[], opportunityGates{}, visitValidity[{visit, valid}], caregiverRef }`, `rule_pack_version:'av2-1.0.0'`. `GET /assessments/:id?kind=LADDER` rehydrates av2 ledgers (`fromAssessmentRecord` version branch); **phase5-1.0.0 and sub-measure records bypass every new code path byte-for-byte** (tests + QA assert this).
- **Drafts:** new `LadderDraft` model + `/api/ladder/draft` POST/GET/beacon mirroring caregiver semantics exactly (auth, consent, ownership 404, 512 KB cap, latest-wins, status IN_PROGRESS|COMPLETE|INVALID). INVALID drafts never hydrate. On successful completion the draft is marked COMPLETE (never deleted) and local keys clear. Resume order: server (≤14 days fresh) > localStorage > fresh — a true second device picks up mid-calibration runs (QA-proven).
- **Validation:** the av2 branch validates only the NEW arrays (six-outcome enum 400 `BAD_OBSERVATION_OUTCOME`, visitValidity both spellings, ≤10k observations 413). The bank remains client authority; the server stores, never invents.
- Caregiver records keep the `{responses, scored}` contract, so all P57-era families hydrate unchanged.

## 5) Test & QA results (this build)
- Unit: **233/233 passing** (`npm test`) — incl. new `tests/iris.av2.test.js` (six-outcome freeze, supported ≠ independent, insufficient never in accuracy, NMI walk, invalid visits immutable to the ledger, gates cv1+cv2 mappings + absent→open, dual-envelope hydration, VSP/MEM/COMM diagnosis-blind, target_skill coverage), `tests/iris.discrepancy.test.js`, `tests/iris.parentDraft.test.js`.
- Payload smoke: legacy branch byte-identical; av2 branch key-set asserted.
- Browser batteries (local): `qa-av2` **28/28** (gating chips + full av2 envelope from a real run incl. COMM/VSP/MEM probes + no LIT/NUM while gated + draft COMPLETE lifecycle + second-device resume + server enum 400/200 + legacy bypass + beacon auth + discrepancy strip), `qa-cv2-flow` **35/35** (adds 4 recap-screen assertions; cv1-draft resume still scores cv1), `qa-family-flow` **16/16** (forced chain cv2→ladder→plan intact), plus auth/navigation/landing suites. Exact final numbers land in this section after the final battery; production smoke follows deployment below.
- One real defect was found and fixed during QA: the boot-resume effect marked itself "tried" before the child row was bound, permanently skipping server-draft resume (fixed: effect retries on `childDbId`; plus the draft-null envelope is now explicitly rejected).

## 6) What is NOT claimed (limitations)
- ⛔ **No validation claims.** All new items carry `RESEARCH_INFORMED_PROTOTYPE / NOT_REVIEWED`; the UI badges stay honest. Internal consistency, test-retest, Arabic cognitive interviews and the n≥40 pilot (framework §8) remain future work; the av2 record now carries the `metrics`/observations needed to run those analyses.
- 🟡 Rung placements for the new strands are ENGINEERING_ASSUMPTION (flagged per item), pending specialist review.
- 🟡 Scan/dwell access modes are recorded (`response_mode` in accommodations) but no dedicated scanning UI exists — target-size and helper-confirm paths are the shipped accommodations.
- 🟡 Attention is engagement-metadata only, by design (no ATT score); a real attention measure needs specialist-authored items.
- 🟡 Calibration treats supported/insufficient conservatively (only independent-correct raises entry hint); revisit after pilot data.
- 🟡 Cross-version comparability: av2 records are never compared against phase5-1.0.0 estimates (rule_pack_version separation) — trend charts stay within one instrument version.
- Discrepancy families cover communication/learning/support today; social-behaviour vs observed play is a planned third family awaiting ladder-side observation points.

## 7) Mapping to the framework's mandated fixes (§6 audit)
W1 supported-real ✅ · W13 latency/interruption recorded, never scored ✅ · W14 child-visible progress + breaks + cap-15 + retry ✅ · std-accom §17-18 accommodation ledger per observation ✅ · W4/W20 per-visit validity + retry message ✅ · W2/W3/W17 server drafts + clientRef idempotency + kind filtering ✅ (child runs now included) · W5 per-item transparency log ✅ ("why this result" explainer text on snapshot 🟡 — the data exists, the sentence set awaits review) · W6 modality diversity reachable at clean rungs ✅ (paired-modality retry) · W7 track-balanced priorities consuming functional-unmet ✅ (P57) · W8/W9 quilt already removed (P56) ✅ · W10/W11 badges honest, new strings authored ✅ · W12 gate order ✅ · W18 domain rollup column — 🟡 strand map + domainSummary unchanged; true 3-domain persistence stays as planned.

---
*Deployed: commit `4b2d3008` → GitHub `feature/iris-unification` → Vercel production `https://iris-kohl-seven.vercel.app/` (build Ready in 40s).*

**Production smoke (live):** new bundle `index-D-PVFcJq.js` carries `av2-1.0.0` + VSP/MEM/COMM strand ids; lazy chunks contain «ملخص اللي جمعناه», «لوحت الصورة في مكانين», the gating chip and the helper-confirm button; `/api/ladder/draft` + beacon respond 401 unauthenticated (routes live, protected); `/api/health` reports `blobsync.active:true, restored:"restored", dirty:false` — SQLite-on-Blob durability survived the redeploy. Full registration flow runs against real SMTP in production (QA verified it locally with dev codes; the email template itself was production-verified in earlier phases).
