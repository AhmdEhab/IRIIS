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
