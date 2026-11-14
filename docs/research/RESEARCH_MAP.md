# IRIS Research-to-Assessment Traceability Map

**Rule:** no fabricated citations. Every page/section reference below is carried from the verified per-document analyses (`/home/ubuntu/analysis/research/*.md`), which quote-checked page numbers against the supplied PDFs. Where a source gives no page (or where the step is our reasoning), the adoption category says so.

**Adoption categories**
- **DIRECT** — the source explicitly states this; IRIS applies it as stated.
- **ADAPTED** — source-supported concept, transformed for IRIS (digital, Arabic-first, app context). The transformation itself needs pilot validation.
- **NEEDS-VALIDATION** — extrapolation or analogy; no direct evidence; must be flagged in UI/docs and studied locally.
- **PRODUCT** — design decision, not a scientific claim.

**Source short names:** `ICF-manual` (WHO ICF "How to use" exposure draft 2013) · `Frontiers-2023` (Mattie et al., Front Psychol 14:1084576) · `IJERPH-2020` (Verdugo et al., systematic review) · `IDD-journal` (Schalock, Luckasson & Tassé 2021 ms) · `AAIDD-catalog` (2025–26 publications catalogue) · `UNICEF-HI-2017` (Disability-Inclusive in Humanitarian Action: Education) · `Fletcher-Miciak` (2024 narrative review, nihms-1958689) · `DS-2025` (Van Herwegen et al. review) · `std-accom` (Thompson et al. 2018, Contemp School Psych 22:443–457) · `audit` (internal code audit).

---

## A. Global architecture

| Component | Source (doc, page/§) | Relevant finding | How applied | Category |
|---|---|---|---|---|
| Two-track profile (functional + learning), shown side by side, never collapsed | Frontiers-2023 pp.4–5 | r=0.40, CCC=0.38 between caregiver adaptive report and child cognitive testing; per-child discord both directions while group means agree | Profile model = `caregiverTrack` + `learningTrack`; explicit neutral divergence note in UI | DIRECT |
| No composite ability score, ever | ICF-manual §"no linear inference across domains"; IJERPH-2020 (CTCM/correlated-traits fits; 1-D models poor); AAIDD-catalog p.20 ("profile of the pattern and intensity"); IDD-journal | Composites misrepresent heterogeneous profiles; field instruments report profiles | Scoring rule §3: per-domain states only; `no composite` invariant test added | DIRECT |
| Caregiver as standard informant for daily-functioning; structured-interview logic | IJERPH-2020 (SIS-C = structured interview with informal caregivers, ages 5–16); AAIDD-catalog p.20/p.17 (DABS "respondents who know the person well"); Frontiers-2023 p.2 (informant report captures everyday contexts; minimal child burden) | Caregiver report is the sanctioned method for adaptive/support constructs, not a diluted test | Family Profile block design; parent-completed by default | DIRECT |
| Probe-follow-ups instead of flat checklist | Frontiers-2023 p.5 (Vineland semi-structured interview allowed examiners to probe "usually or only sometimes") | Checklist-only formats increase responder bias | Conditional follow-up items (C2a, M4a, P7a, triplet prompts) | DIRECT concept; ADAPTED as self-administered digital probes (NEEDS-VALIDATION for mode equivalence) |
| Habitual performance, recent anchor | Frontiers-2023 p.5 (caregiver interpretation vs elicitation; usual performance); std-accom p.13 (caregiver as consultant on capability-vs-prompt) | Parent report reflects what usually happens | Item stem template "في الأيام العادية، آخر كام أسبوع"; X-block respondent familiarity question | ADAPTED |
| Plan, not verdict | AAIDD-catalog pp.8/19 (understand person → support needs → plan → evaluate; "24-7" weekly schedule with settings/activities/supports); IDD-journal (assessment feeds support planning, plans built jointly) | The chain must terminate in an actionable plan | First Plan screen: weekly arrangement card + outcome recheck hook | ADAPTED (scaled to home-learning week) |
| Re-measurement expected; support needs change | AAIDD-catalog p.19 (SIS-A Annual Review Protocol: intensity "might have changed in important ways"); IJERPH-2020 (needs decrease from 5–10 to 11–16 cohort) | Profiles are snapshots; drift must not be misread | Annual cadence + 3-question pulse check; drift-not-gain rule (§3) | DIRECT |
| Item/instrument versioning | Frontiers-2023 pp.3/5 (Vineland-2 vs -3 cross-version score shift, Farmer et al. 2020) | Changing items invalidates old-vs-new comparison | `rule_pack_version` stamp; cross-version comparison forbidden in snapshot | ADAPTED |
| Never diagnose; clinical instruments are gated | AAIDD-catalog pp.2/17–18/20 ("specialized training… only sold to qualified users"; DABS "used to determine a diagnosis"); UNICEF-HI-2017 (recognition → referral, never diagnosis in-programme) | Look-alike diagnostic instruments mislead families | IRIS wording doctrine: descriptive profile, no levels; referral nudges only (H7, X-block) | DIRECT |

## B. Family Profile — domains & items

| Component | Source | Finding | How applied | Category |
|---|---|---|---|---|
| Domain backbone (communication, self-care, mobility, relationships incl. playing, school participation/learning, health & safety) | UNICEF-HI-2017 pp.54–55/88/92 (WG Child Functioning Module 2–17: seeing, hearing, walking, communication, understanding, learning, self-care, seeing-others, playing, behaviour); ICF-manual (body functions/structures never rated; activities are; "playing in the school yard" life situation) | Functional-not-medical data standard; its Annex B rubric ranks ICF-based functional definitions above diagnosis-based ones | Blocks A–H map onto WG/ICF activity areas; no body-function ratings anywhere | DIRECT (domains); items themselves IRIS-authored (IJERPH publishes no wording) |
| Communication domain added beyond support-needs instruments | IJERPH-2020 (named gap: communication absent from child support-needs measures yet essential); C-block | Construct must be covered for learning design | Block C | DIRECT (gap identified); ADAPTED (item set) |
| Play & peer items | UNICEF-HI-2017 (WG "playing"); ICF-manual (recreation: self-report most meaningful) | Play is a functioning domain, not filler | P1–P3 items; child-mode framing unchanged | DIRECT concept; NEEDS-VALIDATION for item content |
| Support-intensity triplet at 5 levels | IJERPH-2020 (SIS/SIS-C type×frequency×time, 0–4; warns a 4-level never–always format is *unattested*; 3/5/7/8-point families exist) | Attested child-aged intensity format | Triplet retained 5-level with parent-friendly Arabic anchors | ADAPTED (anchors our own) |
| Gate-then-rate (presence → level) | IJERPH-2020 (CANS gate pattern); ICF-manual (`.99 not applicable` for never-occurring activities) | Don't force ratings of activities absent from the child's life | GATE fields precede ability fields; gated items excluded from difficulty math | DIRECT |
| Opportunity ≠ inability ("hasn't had the chance") | ICF-manual (rationale of `.99`/never-encountered activities); std-accom p.9 (underestimates may reflect access/opportunity, not ability); UNICEF (opportunity framing) | Low-stimulation environments must not read as low capability | `not_yet_opportunity` state; shown to parents as "a chance to try"; drives recommendations not deficit counts | DIRECT concept; NEEDS-VALIDATION as explicit response option (untested in any instrument) |
| Met / unmet / being-helped question | IJERPH-2020 (CANDID: only instrument pairing met vs unmet needs; unmet = actionable) | Personalisation should key on unmet needs | Per-supported-area met/unmet follow-up; only unmet becomes learning-priority gap | ADAPTED |
| Behaviour framed as support conditions, never conduct score | AAIDD-catalog pp.7/15 (problem behaviour as possible trauma response; positive behaviour support; "challenging behaviour" register); std-accom Table 3 (breaks not after escape) | Scoring behaviour as compliance harms and biases | P7 pick-list with "nothing that worries me" default; P7a antecedent/helps probe; no behaviour number | DIRECT |
| Health/senses with correction ("even if wearing glasses/hearing aid") | UNICEF-HI-2017 (WG seeing/hearing items include even-with-correction clause); std-accom p.7 (glasses/hearing aids before testing) | Ability reported with usual aids | H1/H2 wording | DIRECT |
| Sleep / good-day / timing questions | std-accom pp.6–7 (ask sleep/meal/toilet/illness-medication; reschedule) | Access-skill confounds | H3/H5; G4 best-time-of-day → scheduling | ADAPTED (light version) |
| Sensory likes/aversions → UI defaults | std-accom Table 3 (muffle timers/buzzers; reduce clutter; fidget; SI "mixed evidence") | Construct-irrelevant barriers | H6 profile → mute-by-default, reduced motion, no countdowns; SI warm-up kept out of claims | DIRECT (barrier removal); sensory-therapy claims excluded per source honesty note |
| Interests → reinforcers | std-accom p.6/p.13 (preferred foods/items from caregivers used as reinforcement; survey ahead) | Reinforcement is the best-evidenced accommodation class (Duckworth et al. 2011 PNAS meta, cited p.3) | G1 reinforcer pool feeds rewards + content themes | DIRECT |
| Strengths & hopes block | std-accom p.8 (report strengths, preferences, likes first); IDD-journal (limitations coexist with strengths); IJERPH-2020 (I-CAN: "I can / goals / supports we need") | Strengths-first is standards language, not decoration | G5/G6; completion screen and First Plan lead with strengths | DIRECT (rules); ADAPTED (placement) |
| Informant record (broad caregiver definition), preferred format, assent | UNICEF-HI-2017 pp.112–113 (caregivers incl. grandparents/siblings/providers), p.32 (preferred format), p.97 (ask the child too); std-accom p.1 (consent and assent in funded-project ethics) | Who answers is data; children are respondents | X4/X5/X7 screens; ladder = "asking the child" half | DIRECT |
| Language & schooling context | Fletcher-Miciak p.15 (language-of-instruction confound; "no clear criteria" separating difficulty from exposure); UNICEF ("usual customary language"); IDD-journal (contexts incl. language first-class) | Interpretation caveat before personalisation | X1 feeds literacy-profile caveats + ladder audio-language defaults; diglossia handling flagged IRIS-side | DIRECT (record confound); NEEDS-VALIDATION (MSA/dialect specifics — zero evidence in pack) |
| ~58 items / 10–14 min budget | std-accom p.5 (30–60 min IQ burden critique; "constructs of interest must be prioritized"); Frontiers-2023 p.5 (item budget short by design) | Long questionnaires collapse completion | Item count and single-sitting design | PRODUCT (budget number ours); ADAPTED (short-by-design principle) |

## C. Scoring & interpretation

| Component | Source | Finding | How applied | Category |
|---|---|---|---|---|
| Descriptive bands with explicit rule table; invented cutoffs forbidden | Spec §6 + ICF-manual (generic 0–4 qualifiers never operationalised → don't fake them); Frontiers (no norm transplant) | Transparent description beats pseudo-validation | §3 state rules are deterministic counts, shown as words only; confidence in words | ADAPTED; PRODUCT (exact thresholds) |
| Never report an IQ/level/severity/age-equivalent/percentile headline | Frontiers-2023 pp.2/5 (IQ deficit-framing, floor effects; parents prefer no-single-number); IDD-journal §2.3; UNICEF Annex B (rejects medical-diagnosis data standard); AAIDD (severity vocabulary absent from current catalogue) | Field consensus + consent logic | Banned-terms list (EN+AR); UI copy tests enforce | DIRECT |
| Confidence = completeness/informant/mode quality; uncertainty in words, never fake CIs | Fletcher-Miciak pp.8–9 (use ranges/CI, not bright lines; informal reports carry bias; no numeric CI on questionnaire answers) | Show fragility without pretending psychometrics | Words-only confidence; "we need to know more" for <50% blocks | ADAPTED |
| Discrepancy between informants surfaced, never averaged | IJERPH-2020 (SIS-C interrater r≈0.30–0.98; recommend reporting disagreement) | Averaging destroys the unreliable half | Parent-vs-teacher mode displays both columns | DIRECT (rule); ADAPTED (subset implementation) |
| Invalid administration ≠ low performance | std-accom pp.2/8/10/14 (validity evaluation; ban "untestable"; model's stated payoff) | A bad run must not write an estimate | Visit validity classification; retry-with-settings flow | DIRECT |
| No strength-weakness discrepancy claims | Fletcher-Miciak (PSW models: excessive false positives) | Don't rebuild PSW in disguised form | Profile describes patterns; no "unexpected underachievement" language | DIRECT |
| Outcome claims withheld | IJERPH-2020 (no digital parent-questionnaire validation synthesised); Fletcher-Miciak (informal-assessment→outcomes under-researched); DS-2025 authors ("premature to draw practical conclusions") | Honesty tier | Validation-status badge on every result; claims capped at "research-informed" | DIRECT (limits); PRODUCT (badge UI) |

## D. Personalisation wiring

| Component | Source | Finding | How applied | Category |
|---|---|---|---|---|
| Functional report weights ABOVE cognitive testing when ability measurement is suspect (young age, language, severity) | Fletcher-Miciak pp.20–21 | "Weight the functional evidence more" when the cognitive estimate is shaky | Merge rule: caregiver profile owns access settings + opportunity caveats; ladder owns school-skill entry points; conflicts resolved to functional side for accommodations | ADAPTED |
| Accommodation ledger recorded with every observation; comparability flag on presentation changes | std-accom pp.7/9/Table 2 | Standards mandate recording what was changed and whether it preserves the construct | `accommodation` object on ladder observations + snapshot note | DIRECT |
| Target-skill vs access-demand tagging on ladder items | std-accom pp.4–5 (worked digit-span example: cueing=preserves, re-presenting stimulus=changes) | So relaxation choices are principled | Metadata on ladder content; hint policy follows it (audio cue OK; repeating a *sound-discrimination* stimulus changes the target — engine marks incomparable) | ADAPTED |
| Condition label → accommodation defaults ONLY; never content order/expectations | DS-2025 (phenotype guides materials, but "variability not verdicts"; half have low outcomes); audit W8 (legacy moduleOrder is the forbidden coupling now); Frontiers 4.9 | Priors are testable hypotheses | Module order = f(profile), condition only seeds sensory/motor defaults; source-scan tests extended | DIRECT (prohibition); PRODUCT (replacement formula) |
| Adult-mediated positioning of the app | DS-2025 (1:1 adult-delivered worked; pure drill null group results — n=2 computerised studies) | Screen ≠ replacement | Child mode prompts parent co-play; sessions short; copy never markets unsupervised use | ADAPTED; NEEDS-VALIDATION (IRIS effect unproven) |
| Phonics always paired with meaningful reading; math components separated (quantity vs naming) | DS-2025 (holistic+phonics worked; GraphoGame alone null; rote counting did not transfer, quantity manipulation did) | Drill-only recommendations invalid | Literacy plan bundles letter-work with story/word context; number priorities distinguish quantity vs naming strands | ADAPTED (existing content already partly aligned; mapping rules new) |
| Entry point = measured current skill, not label | DS-2025 (Goetz expected-work-range ≥5 practice rule) | Select by demonstrated readiness | Ladder tier → rung selection unchanged+enforced; caregiver data never sets entry difficulty | DIRECT (rule); PRODUCT (already implemented) |
| Priorities balanced across tracks & rungs | audit W7 (rung bias); ICF-manual (no cross-domain inference) | Weakness at higher rungs stays eligible | Resolver v2: track-balanced top-3 | PRODUCT + DIRECT (constraint) |

## E. Ladder experience fixes (child-facing)

| Component | Source | Finding | How applied | Category |
|---|---|---|---|---|
| Visible progress + explicit end; no hidden stop | std-accom p.2 | Ceilings-as-stop-points destroy predictability → stress | "3 أنشطة باقية" chip + done screen | DIRECT |
| Teaching items to procedure-understanding, never scored | std-accom pp.10–11 (teach until the testing *procedure* is understood; teaching scored content = modification) | Familiarity ≠ practice of the target | Calibration phase labelled teaching; results excluded from scoring | ADAPTED (already calibration; semantics made explicit) |
| Generous untimed windows; no countdown UI | std-accom Table 3 + p.24 carve-out | Speed only counts if it's the target; it never is here | Response windows non-punitive; timers removed from ladder UI | DIRECT |
| Self-correction allowed; late/changed taps not penalised | std-accom p.11 (FXS: wait to record, allow change of mind) | Impulsivity/artifact contamination | Undo window + re-tap neutral | DIRECT (rule) / PRODUCT (window length) |
| Breaks predictable, child-requestable, never after refusal | std-accom Table 3 + p.24 (break after positive behaviour, not escape; break card) | Classic error most apps make | Break button wired to G3 signals; scheduling respects H3 | DIRECT |
| Effort + engagement reinforcement | std-accom p.3 (Duckworth 2011 PNAS meta: motivation accommodations raise performance in below-average-IQ examinees) | Best-evidenced single class | Praise-on-engagement layer | DIRECT |
| Multiple response modes incl. helper-assisted confirm, scan-one-by-one | std-accom Table 3 (point-instead-of-verbalise; touch-scan; examiner-manipulates-on-instruction) | Access skill ≠ target skill | Mode settings from M/C blocks; parent-assist toggle | ADAPTED |
| Echo/self-stim not accepted as answers; non-vocal confirmation preferred for minimally verbal | std-accom p.13 | Recorded response must be a response | Vocal-answer path gated on C2 evidence | DIRECT |
| Fatigue guard: short sessions, optional multi-day split, resume server-side | std-accom p.24/p.13; audit W14 | Feasibility is validity | Session caps + IN_PROGRESS drafts | DIRECT (rule) / PRODUCT (caps) |
| "Couldn't measure today" never "low ability"; no untestable state | std-accom pp.2/10/14 | Label harm | Invalid-run copy | DIRECT |
| Floor keeps discriminating at the bottom (prompt-level detail) | std-accom pp.9–10 (SS=1 flooring common; deviation-score rationale) | Bottom of range must stay gradable | Ladder floor records prompt-level qualitative detail even when score floors | ADAPTED |

## F. Parent UX / accessibility / ethics

| Component | Source | Finding | How applied | Category |
|---|---|---|---|---|
| One item/screen, autosave-resume, back-edit, progress, plain language, audio every item | std-accom pp.8–9 (family-friendly, multiple modes of representation incl. visuals/concrete examples; AERA 10.11 understandable language); UNICEF p.32 (preferred format) | Standards-mandated reporting/administration qualities | §5 UX list; read-aloud + example anchors mandatory | DIRECT |
| Normalising microcopy; emotional-load staging | std-accom p.8 (results can trigger emotional response; private first look, pair low with next step); spec §9 | Disclosure engineering | Calm framing lines; strengths-first completion; next-step beside every gap | ADAPTED |
| No third-party "flagged" exposure; family data export & deletion | UNICEF p.68d (targeted-support labelling stigma); AAIDD-catalog p.17 (DABS platform stores/transmits nothing — precedent for family-owned records) | Data dignity | Share/export shows strengths+plan only; account deletion path; cloud retention minimised | ADAPTED (cloud model ≠ DABS local; disclosed) |
| Arabic-first authoring, register tested with parents | IJERPH-2020 (no Arabic/MENA country in 86 studies); AAIDD-catalog pp.5/18/20 (no Arabic edition of manual/SIS; instruments USA-only); Frontiers-2023 (culture-currency lesson; don't translate-and-assume) | Nothing to localise off-the-shelf; construct-align, self-author, pilot locally | All items original; pilot includes 8-parent cognitive-interview register check | NEEDS-VALIDATION (explicitly IRIS frontier) |
| Age band 4–10 with thin evidence below 5 | IJERPH-2020 (child samples 5–16; nothing under 5; DABS 4–21 nearest); AAIDD (support-needs instrument starts at 5) | Frontiers of the field stated plainly | 4-year-old items flagged in pilot strata; copy avoids "typical" claims under 5 | NEEDS-VALIDATION |
| Product copy never implies standardisation | ICF-manual; spec §6; AAIDD gating | Honesty | Claims audit + banned-phrase CI test on copy files | PRODUCT |

## G. Count & red flags

- DIRECT ≈ 34 · ADAPTED ≈ 27 · NEEDS-VALIDATION ≈ 9 · PRODUCT ≈ 9 (some rows carry two tags; primary tag counted).
- Sources used *against* their own limits: none — ICF draft provenance, AAIDD-catalogue weakness, and Frontiers pilot-data limits are disclosed in RESEARCH_SYNTHESIS §1 and reflected in categories above.
- Not sourced from this pack at all (external standards, honestly labelled): numeric touch-target sizes (accessibility standards), any MSA/dialect policy, all IRIS item wording, the 58-item budget, UI specifics.
