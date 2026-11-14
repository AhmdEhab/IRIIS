# IRIS Assessment Framework — Proposed (v1, research-informed)

**Status:** PROPOSAL — for approval before implementation · **Date:** 2026-11-14
**Evidence base:** `RESEARCH_SYNTHESIS.md` · **Citations per decision:** `RESEARCH_MAP.md`
**Language policy:** all items ship in simple Egyptian-friendly Arabic (primary) + English mirror; audio read-aloud on every item; every string IRIS-authored (no instrument items copied).

---

## 0. Principles (binding)

1. **Never a single number.** Outputs are domain-state profiles + confidence statements. No composite "score", no IQ-like value, no severity, no age-equivalent, no percentile headline.
2. **Never a diagnosis.** IRIS describes learning and support patterns and refers out. Fixed disclaimer on every result surface (Arabic + English).
3. **Two tracks, shown together.** The caregiver functional profile and the child's learning ladder can disagree for the same child — that is normal and informative; both are displayed, divergence is described, never averaged.
4. **Habitual performance, recent window.** Caregiver items anchor to "the last few weeks, in a normal day" and name setting + person + help given.
5. **Opportunity is not inability.** "Hasn't had the chance" is a first-class answer, excluded from any difficulty count, logged as an unmet opportunity.
6. **Met needs are not learning levers.** Personalisation keys off *unmet* support needs.
7. **Condition labels inform accommodation defaults only** — never ability expectations, entry points, or content order. Syndrome profiles are testable hypotheses.
8. **Uncertainty is visible.** Every result carries confidence (HIGH/MEDIUM/LOW) derived from completeness, informant count and modality coverage — expressed in words parents understand, never misread as probability of the number itself.
9. **The output is a plan.** The profile ends in a weekly learning arrangement (settings, activities, supports) + what to re-check and when.
10. **Nothing "untestable".** A failed/truncated measurement says "we couldn't measure this today — try again with these settings", never a low estimate.
11. **Evidence honesty.** Every domain/claim is tagged RESEARCH-INFORMED (prototype) until professionally reviewed; product-level claims stay at "descriptive" evidence level.

---

## 1. Architecture

```
register → verify email → ①  Family Profile (caregiver questionnaire, resumable)
        → ② Learning Ladder (child-facing adaptive probes)
        → ③ First Plan screen (weekly arrangement, strengths-first)
        → hub (child mode + parent mode)
```

- **① Family Profile** — new instrument. ~58 scored items + conditional follow-ups, 8 blocks, 10–14 minutes, auto-saved server-side (`status: IN_PROGRESS → COMPLETE`), back-and-edit allowed.
- **② Learning Ladder** — existing engine, retained with the fixes of §6.
- **③ Profile merge** — `buildFamilyLearningProfile(caregiver, ladder, context)` produces:
  - Functional track: 7 domain states + support-intensity triplet per supported area + unmet-need list + strengths/interests.
  - Learning track: existing strand indicators/tiers/priorities (unchanged semantics).
  - Access & engagement settings: sensory, motor, response modes, session pacing, reinforcers, language supports, caregiver-role settings.
  - Context notes: language exposure, schooling/opportunity, health & routine flags, respondent record.
  - Confidence + divergence notes between tracks.
- **Persistence:** `AssessmentRecord` rows gain `assessment_kind: 'CAREGIVER' | 'LADDER'`, `status: 'IN_PROGRESS' | 'COMPLETE'`, `client_ref` idempotency key. Consumers filter by kind (hydration already filters LADDER — extended to exclude CAREGIVER). Ownership checks unchanged.

---

## 2. Instrument ① — Family Profile: domain definitions

Response grammar used throughout:

- **GATE** (does this situation occur at all for your child? yes / not yet an opportunity) — CANS/SIS-C precedent + ICF `.99` logic.
- **ABILITY (4+1)**: `independently` · `with a little help (talking, pointing, showing)` · `with hands-on help` · `does not do it yet` · *(plus the gate path)* `hasn't had the chance` — WG short-set anchors (no/some/a lot/unable) merged with support levels; 5 states total counting the opportunity gate.
- **SUPPORT TRIPLET** (asked only for areas needing support; 5-level, adapted from SIS/SIS-C 0–4 type/frequency/time):
  - Type: none → supervision/prompting → partial physical → full physical
  - Frequency: never → rarely → sometimes → most times → always
  - Daily time: minutes → <15 min → 15–30 → 30–60 → most of the day
- **MET/UNMET** (CANDID logic): "handled on our own / someone helps us / nobody is helping with this yet".

Every scored item = one observable behaviour, one example anchor shown inline, one idea. Follow-up probes implement the interview logic (Frontiers/Fletcher: probe *what kind of help makes it happen*).

### Block A — Communication & language (C)
**Measures:** receptive language, expressive language (vocal, gestural, AAC), understanding daily instructions, use of the child's usual language.
**Why:** communication is absent from every child support-needs instrument yet essential (IJERPH A1); WG/ICF domains; expressive language gates everything else; UNICEF: ask about communication incl. AAC.
**Interprets as:** instruction-comprehension load, response modes for the ladder, audio-first needs, text-free rendering.

| ID | Item (EN — AR ships in build) | Format |
|---|---|---|
| C1 | Understands simple daily instructions in the language she/he hears most at home ("come", "give me", "sit down") | GATE+ABILITY (ex: no gesture/modeling needed?) |
| C2 | Makes her/his wants known in any way — words, pointing, sounds, leading your hand, or a device | ABILITY (modes multi-select) |
| C3 | Answers yes/no questions in any way (nod, shake, vocal, press) | GATE+ABILITY |
| C4 | Points to show you something interesting ("look!") | Frequency 5-level |
| C5 | Uses single words or word-like sounds for common things | Ability-with-context |
| C6 | Combines two words ("more juice") when she/he speaks | GATE+ABILITY |
| C7 | You can usually tell what she/he wants even without words (a familiar adult could) | ABILITY |
| C8 | Understands more than she/he can express — much more? (probe of divergence) | Descriptive 3-level |
| C9 | Uses gestures or a communication device/symbol board at home or school | GATE+which+when |
| FOLLOW-UPS | If C2 hands-on: "What helps most — showing, pointing, giving the start of the word, waiting quietly?" → prompt-level record | Probe |

### Block B — Learning & everyday problem-solving (L)
**Measures:** learning from routine, matching/sorting/sequencing in daily life, early pre-literacy/numeracy *behaviours* (not skills), following a familiar activity sequence. (ICF d1/d2: general tasks & demands; never body-function ratings.)
| ID | Item | Format |
|---|---|---|
| L1 | Learns a new daily routine (handwashing steps, dressing order) after practice | ABILITY+tries estimate |
| L2 | Matches things that go together (sock-sock, cup-saucer) or sorts toys by one feature | GATE+ABILITY |
| L3 | Completes a familiar 3-step activity without being reminded each step | GATE+ABILITY |
| L4 | Shows she/he knows what comes next in a familiar story/song (pauses, fills in) | Frequency |
| L5 | Uses simple problem-solving to reach something wanted (pull a cloth, ask for help, climb) | ABILITY(3-option cause style) |
| L6 | Handles a small change in a familiar routine without a big reaction | 4-level |
| L7 | Has had any chance to practise early letters/numbers/writing at home or school? | Opportunity gate — excluded from difficulty counts |

### Block C — Daily life & self-care (S)
**Measures:** feeding, dressing, toileting hygiene, choosing, safe habits — SIS-C "home", WG self-care, ICF d5. The most parent-reliable reporting area.
| ID | Item | Format |
|---|---|---|
| S1 | Eats with a spoon/fork and drinks from a cup with little spill help | ABILITY |
| S2 | Wears most clothes with help only for tricky steps (buttons, back zip) | GATE+ABILITY |
| S3 | Tells you (any way) about needing the toilet / is in a set toilet routine | GATE+describe |
| S4 | Washes and dries hands with prompts only | ABILITY |
| S5 | Chooses between two familiar things (snack, game) in any way | GATE+ABILITY |
| S6 | Handles small money/phone tasks or asks for help with them *(age-scaled; <7 gated)* | Opportunity+ABILITY |
| TRIPLET | For every supported item: type/frequency/time | Intensity profile |

### Block D — Movement & access (M)
**Measures:** walking/stairs/balance; hand use for pencils, buttons, tablets; sitting comfort. (WG mobility; ICF d4/b7-8; DS low-tone caution; std-accom access skills.)
| ID | Item | Format |
|---|---|---|
| M1 | Walks and climbs stairs (with or without holding rail/hand) | ABILITY+equipment |
| M2 | Runs or moves fast in play, or gets around in her/his own way | GATE+ABILITY |
| M3 | Holds/uses a spoon, turns pages, makes marks with a tool | ABILITY |
| M4 | Uses a tablet/phone screen well: taps, drags, or her/his best way | ABILITY+preferred-mode |
| M5 | Sits comfortably at a table for 10+ minutes (support/posture needed?) | 4-level+describe |
| FOLLOW-UPS | If M4 limited: which response ways work — big targets, a helper tapping together, one-at-a-time choices? → feeds input settings | Probe |

### Block E — People, play & feelings (P)
**Measures:** joint engagement, play with others, sharing attention, waiting turns, recognising feelings, coping/frustration. (WG relationships/playing; SIS-C social; ICF d7/d9; exceptional *behavioural support* belongs here as support, not conduct.)
| ID | Item | Format |
|---|---|---|
| P1 | Plays next to or with other children, in her/his way | GATE+describe |
| P2 | Shares something she/he likes by showing/giving/pointing | Frequency |
| P3 | Waits for a turn in a simple game with reminders | ABILITY |
| P4 | Notices when someone is sad/hurt (looks, stops, brings help, or none of these — descriptive) | Multi-observed-choice |
| P5 | Handles "stop / wait / it's someone else's" with support | 4-level |
| P6 | When frustrated, what usually calms her/him (named options + free text) → soothing profile | Observational |
| P7 | Any behaviour that worries you or makes learning hard (open pick-list + "none" default, non-judgmental) | Support-needs gate, never scored as compliance |
| P7a | If flagged: what helps, what tends to start it (setting events) | Probe |

### Block F — Health, senses, routines & comfort (H)
**Measures:** vision/hearing **with correction**, sleep, eating issues, seizures/medical supports, medication effects on alertness, sensory likes/aversions. (SIS exceptional *medical*; WG even-with-glasses; std-accom sensory; UNICEF health screening→referral.)
| ID | Item | Format |
|---|---|---|
| H1 | Vision works okay for screens/pictures — *even with glasses if she/he wears them?* | WG-anchored 4-level |
| H2 | Hearing works okay for instructions — *even with aids if used?* | WG-anchored 4-level |
| H3 | Sleep: how many hours, night waking, does she/he wake rested? | Structured fields → session-timing advice |
| H4 | Eats a wide range of textures, or food is a challenge? | Gate+describe |
| H5 | Any ongoing medical care/therapy/medication that changes good-time-of-day? | Free pick+note |
| H6 | Sounds/textures/movement she/he loves or avoids (checklist, sensory likes AND dislikes) | Sensory profile |
| H7 | Has a hearing/vision/health check been done in the last year? → gentle referral nudge if no | Record + referral, not scoring |

### Block G — Interests, strengths & what works (G)
**Measures:** favourite activities/topics; what reliably motivates; how she/he shows being done/needs a break; best learning conditions. (std-accom reinforcers list; ICF self-report best for recreation; Schalock strengths coexist; I-CAN qualitative goals.)
| ID | Item | Format |
|---|---|---|
| G1 | Top interests (choose up to 5 from themed chips + add-your-own: animals, vehicles, water, music, building, characters, outdoors…) | Reinforcer pool |
| G2 | What makes a hard moment okay (hug, move, music, quiet space, humour…) | Engagement toolkit |
| G3 | How she/he says "I'm done / I need a break" (any signal — parents record it) | Signal record → break button setup |
| G4 | Best time of day for focused activity | Scheduling setting |
| G5 | One thing she/he does remarkably well or that makes you proud | Strengths card (always shown first in results) |
| G6 | What are your hopes for the next 3 months? (goals, free text, 2 max) | I-CAN goals block → First Plan anchors |

### Block H — About your child's world (context, unscored but decisive)
**Measures:** language exposure (home language/dialect vs school language, age of Arabic-MSA exposure to the extent known), schooling/attendance/therapy history, prior support that worked, respondent identity (broad definition incl. grandparents/siblings/carer — UNICEF pp.112-113), preferred formats (UNICEF p.32), "is today a good day?" (std-accom), consent + child assent (asked with a simple yes-to-child screen).

| ID | Item |
|---|---|
| X1 | Languages heard at home / spoken by child / language at school — and which the child understands best |
| X2 | School/kindergarten? hours/day; therapy? hours/week |
| X3 | Any assessment report done before (speech/psychology/medical)? optional upload/summary chips |
| X4 | Who is answering, and how many weeks have they known the child's daily routine? |
| X5 | Preferred format: plain text / audio / both (applied to the whole app) |
| X6 | Quick check: "Is today a calm enough time? You can pause and continue anytime." (autosave message) |
| X7 | "Your child's turn comes later — a short, fun activity time. Ready?" (assent screen shown to child, picture-led) |

---

## 3. Scoring & interpretation methodology

**Weights:** within a block, items are equally weighted except that GATE-failed items don't count (see null rules). No cross-block weights, no composite ever computed.

**Per-domain state (deterministic rule table, descriptive only):**
- `does_independently`: ≥75% of eligible answered items rated independently/typical, none rated hands-on.
- `does_with_support`: majority with a-little-help or hands-on.
- `emerging`: mixed across contexts incl. some independent.
- `unmet_need`: any item rated hands-on-or-below **AND** met/unmet question says "nobody is helping with this yet" — or a P7/H flag without an existing plan. Only these feed learning priorities as *gaps*.
- `not_yet_opportunity`: gate says chance-not-given → recorded as opportunity gap, excluded from difficulty; shown to parent as "a chance to try".
- `needs_more_information`: <50% of a block answered → never shown as a weakness.

**Support-intensity profile:** triplet aggregates per life-area, shown as small strip charts (type/frequency/time), never summed.

**Confidence (caregiver side):** counts answered %, recall-window adherence (answered in one sitting vs weeks apart), single vs dual informant. LOW confidence domains print "we need to know more" instead of a state.

**Uncertainty in parent copy (Fletcher CI rule):** never "your child has a 95% probability…"; instead "based on what you've told us so far; here's what would help us be surer".

**Divergence rules:**
- Functional-vs-learning tracks may disagree (Frontiers): the merged profile always shows both strips side by side with a neutral note: "Children often do daily-life things more independently than school-style tasks — or the other way around. Both are part of the picture."
- Parent-vs-teacher on the same 12 short items: differences listed, never averaged (IJERPH A7).
- Normative drift: reported support needs typically *decrease* as children grow; downward drift is not by itself credited as IRIS learning gain; growth claims use within-child ladder curves only (IJERPH A8).

**Never:** IQ/cognitive level/severity/mental-age vocabulary (banned list extended to Arabic), percentile headlines, discrepancy-based claims (Fletcher PSW), eligibility/resource-allocation framing (AAIDD gated instruments doctrine; ICF eligibility uses disclaimed).

**Arabic banned terms (extended governance):** معدل ذكاء، درجة ذكاء، تخلف عقلي، إعاقة ذهنية شديدة/طفيفة as child descriptors، معاق، مسكين، مريض، غير قابل للتعلم/مش هيتعلم؛ English: IQ score, mental age, severity level, retarded, untestable, suffering, victim, wheelchair-bound, "normal child".

---

## 4. Results & personalisation wiring (answers → results → profile → recommendations)

| Profile output | Where it goes | Effect on IRIS |
|---|---|---|
| C-block receptive levels | Ladder item rendering | audio-only instructions length tier; 1-step vs 2-step; icon load; response-mode default |
| C-block expressive/AAC | Ladder + child UI | accept tap/point/scan/dwell/parent-assisted confirmation; no vocal-required items unless C2 indicates vocal |
| L7 + ladder tiers | contentBlueprint | early-literacy module priority; NOT entry difficulty (opportunity ≠ inability) |
| S-block + triplet | Home Life cards + weekly plan | self-care practice activities scheduled; unmet items become family goals in First Plan |
| M-block | Input settings | target size (accessibility standard, not research), response mode, no precision-drag tasks, seated-session length cap (M5) |
| P-block | Session design | turn-taking games, sharing goals; P6 soothing profile wires break-card; P7 → support conditions screen, never conduct score |
| H-block sensory | UI defaults | mute-by-default, reduced-motion, no ticking timers, clutter-lite layouts; H1/H2 nudge: "check glasses/hearing aid before screen work" |
| H3 sleep/good-time | Scheduling | session reminders at G4 best time; "short sessions" if sleep poor |
| G1 interests | Reinforcer pool + content themes | rewards use chosen themes; ladder item text embeds interests where templates allow |
| G5 + G6 | First Plan + snapshots | strengths shown first; hopes anchor "what we're aiming for" lines |
| X-block context | Everywhere as caveats | language note on literacy reads ("if school language differs from home language, early school-task patterns need re-checking"); accommodation ledger written with every ladder observation |
| Ladder strands/indicators | Existing plan + practice loop | unchanged |
| Both tracks | Priority resolver | NEW rule: top-3 priorities drawn across functional-unmet and learning-developing, track-balanced; rung bias fix (audit W7) keeps a high-rung weak strand eligible |

**First Plan output contract (AAIDD 24-7 style, scaled down):** a weekly arrangement card — "3 short sessions this week (when), these 2 learning activities (what), with this support (how, from parents), what to watch, when IRIS will ask again". Editable, exportable.

**Module order rule (fixes audit W8):** child-home module order = f(learningPriorities ∪ unmet-functional needs ∪ interests), never f(condition). Condition only pre-sets accommodation defaults (unchanged sanctioned touchpoint) and is labelled demo-removal per earlier D7 decision.

---

## 5. Parent experience & accessibility requirements (spec §9, as implemented)

- One item per screen, progress bar "sؤال ١٢ من ٥٨" with a completed-dots map; autosave every answer (local + server draft); "continue later" lands exactly where left off (cross-device after login, not device-local only — fixes audit W3 for the questionnaire).
- All items read aloud (audio icon) + optional auto-read for low-literacy homes (X5); example anchor line inside each item card; back-arrow always available; editing an answer re-runs follow-ups.
- RTL/LTR exact (Arabic defaults RTL with Latin numerals where required per earlier numeral decision); ≥4.5:1 contrast; 48px+ touch targets; no timed elements anywhere; calm palette (existing brand).
- Tone: supportive, non-judgmental; each difficult item is preceded by normalising microcopy ("children grow in their own order — we're mapping where things stand now"); P7 asks without blame words; completion screen leads with G5 strengths + what the child did independently before anything else (std-accom reporting).
- Stigma guard: no export or share shows any "flagged for extra support" framing (UNICEF p.68d); family record export = the family's own data (AAIDD DABS local-record precedent; IRIS keeps cloud copy minimal + deletable via account tools).

---

## 6. Instrument ② — Learning Ladder: retained engine + mandated fixes

Engine semantics unchanged (calibration → adaptive probe → indicators/tiers → priorities; diagnosis-blind; null≠0; determinism; single finalise funnel). Fixes, mapped to audit W#:

| Fix | Addresses |
|---|---|
| Record `supported` (prompt/hint actually used) and hint availability in assessment mode; independence becomes real in indicators | W1 |
| Log response latency + interruption events as data-quality only (never ability) | W13 |
| Child-visible progress ("٣ أنشطة باقية") + explicit "all done" screens; no silent discontinue feel; per-session item cap with optional 2-day split; break button wired to G3 signal | std-accom §2/§12, W14 |
| Effort & engagement reinforcement (praise animation, no correctness-only rewards) | std-accom §11 |
| Accommodation state (audio on, response mode, extra wait, helper used) written into each observation record; comparability flag when presentation changes mid-profile | std-accom §17-18 |
| Validity classification per visit: valid / low performance / **invalid administration** → invalid visits never write estimates; retry-with-settings message replaces silent truncation | W4, W20 |
| Server-side IN_PROGRESS drafts + client_ref idempotency; startDailySession routes on ladder existence, not legacy flag; GET filters by kind | W2, W3, W17 |
| Per-item transparency log (item id + correctness + latency) stored; "why this result" explainer on snapshot | W5 |
| Confidence rules made reachable (modality diversity possible at clean rungs) | W6 |
| Priority resolver track-balanced + consumes functional-unmet too | W7 (+§4) |
| Quilt of legacy condition-driven moduleOrder removed; IQ-shaped client fields deleted; assessmentResult.level rendering removed | W8, W9 |
| Watch-for strings authored per domain incl. all new caregiver domains; validation-status badge ("research-informed, awaiting specialist review") shown honestly in snapshot | W10, W11 |
| Gate order fixed: verify before assessment completion loop; unverified parents can pause/continue, no 403 dead-ends | W12 |
| domain_scores persisted as true domain rollup (3 domains) + strand map stored under its own column | W18 |

---

## 7. Re-measurement cadence

- Full Family Profile: on transitions (new school year, entry to IRIS, big health/behaviour change) and otherwise **once per year**; parent hub shows "last taken …" + short Annual-Review style pulse check ("has anything changed in important ways? 3 questions") in between (AAIDD Annual Review Protocol).
- Ladder: entry + refresh when ≥4 weeks of practice or plan stalls; practice keeps feeding the ledger (existing loop).
- Item versioning: rule_pack_version stamps every record; profiles are never compared across incompatible item versions (Frontiers Vineland-2/-3 lesson).

---

## 8. Validation plan (what ships before "reviewed")

1. Content validity: this pack + qualified child-development specialist review (currently NOT_REVIEWED — surfaced honestly in UI, mirroring existing validation_status fields).
2. Pilot (IRIS beta families, n≥40): per-domain internal consistency (target α ≥ 0.80, informational), same-informant test-retest 2–4 weeks, parent-vs-teacher subset agreement reported as agreement, interviewer-vs-self mode equivalence on 15 items, Arabic cognitive interviews with 8 parents (register/idiom check — nothing here is translatable off English originals).
3. Item bank versioning + rule-pack updates as pilot data accumulate; nothing crosses to "clinically validated" — that language stays out permanently.

## 9. Deliverable mapping to the 12-section spec

§1 studied (synthesis §1-3) · §2 existing analyzed (synthesis §4 + EXISTING_ASSESSMENT.md) · §3 framework (here §2) · §4 questions (here §2 blocks A-H) · §5 age/individual differences (opportunity gating, age-scaled items, no-syndrome-stereotype rule §0.7) · §6 scoring without invented cutoffs (§3) · §7 personalization wiring (§4) · §8 traceability (`RESEARCH_MAP.md`) · §9 parent experience (§5) · §10 technical (contracts §1/§6 — implementation phase) · §11 validation (§8 + testing report at build) · §12 deliverables (this trio, then code + report).
