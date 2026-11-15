# PARENT + SERVER + MERGE lane — working notes (av2 build, 2026-11-15)

Owned files only: `src/App/components/CaregiverProfileScreen.tsx`, `src/iris/caregiver/merge.js`,
`src/App/components/iris/IrisFirstPlan.tsx`, `src/App/components/iris/IrisFamilyProfile.tsx` (minor wiring),
`server/server.js`, `server/lib/draftValidators.js` (new), `server/models/LadderDraft.js` (new),
`scripts/smoke-assessment-payload.mjs`, `tests/iris.discrepancy.test.js`, `tests/iris.parentDraft.test.js`.

## Facts collected
- `npm test` = `node --test tests/*.test.js`; baseline **188 passing**.
- Auth token localStorage key: **`iris_auth_token`** (`AUTH_TOKEN_KEY` + `readAuthToken()` in `src/App/config.ts`).
- Caregiver draft client today: DRAFT_KEY `iris_caregiver_draft_v1`; `postDraft(status)` POSTs
  `${API_URL}/caregiver/draft` body `{childId, clientRef, responses, status, bankVersion, updatedAt}`
  with `authHeaders()`; debounced 800 ms; saveState `'idle'|'local'|'server'|'offline'`.
- Server caregiver draft: `POST /api/caregiver/draft` (requireAuth, requireConsent, childBelongsToUser,
  512 KB cap → 413 DRAFT_TOO_LARGE, status normalized COMPLETE else IN_PROGRESS, upsert CaregiverDraft
  by childId, order id DESC) → `{ok:true,id,updatedAt}`; `GET /api/caregiver/draft?childId` → `{ok,draft:{clientRef,status,responses,updatedAt}}`.
- `CaregiverDraft` table has NO `kind` column, so ladder drafts CANNOT reuse it without a migration →
  new `LadderDraft` model (created whole by `sequelize.sync()`, same as CaregiverDraft was).
- Sibling UI lane already posts `${API_URL}/ladder/draft` `{childId, clientRef, status, bankVersion:'av2', state, updatedAt}`
  and beacons `${API_URL}/ladder/draft/beacon?token=…` with a Blob `application/json`
  `{childId, clientRef, status:'IN_PROGRESS', bankVersion:'av2', state}` → beacon token must be read from
  **body.token → query.token → Authorization header**.
- Outcome enums (`src/App/components/iris/ladderObservations.js`): demonstrated_independent,
  demonstrated_with_support, not_demonstrated, insufficient, no_opportunity, invalid_administration.
  visitValidity real values: `valid | low_performance | invalid_administration` (spec text says valid|low|invalid →
  accept both spellings). Modes: single|tap_each|ordered|listen_select.
- `finaliseLadderAssessment` (engine lane) still emits legacy `{calibration, probe}` item_results;
  av2 extras are added by the UI at POST time (`item_results.bankVersion==='av2'`).
- cv2 scored shape (scoringV2 adapter): domainStates C/L/S/M/P/H {state, confidence, answered, eligible…},
  strengths[], interests[], completeness{answered,total,probesAnswered,perBlock}, careFlags[], guidanceNotes[],
  accessSettings, context. **S and M confidence are force-capped to MEDIUM by the adapter** (the limitation note in P2).
- State vocabulary lives in `IrisFamilyProfile.tsx` STATE_LABELS (بيعمله لوحده / بيعمله بمساعدة / لسه بيشوف طريقه /
  محتاج دعم… / ماخدش فرصة يعملها لحد دلوقتي / لسه بنجمع معلومات كفاية).
- qa-cv2-flow.mjs greps the page for `يلا نبدأ` after submit → the P2 CTA keeps that string.

## Decisions
- P1: per-answer flush (no silent loss) + in-flight coalescing + single-slot retry queue drained on the next
  answer and on `online`; `pagehide`/`visibilitychange:hidden` → `sendBeacon` with a JSON Blob (token in body).
  Third chip tone `pending` (inline amber style — caregiver-profile.css is NOT owned).
- P2: `phase 'summary'` between successful submit and `onComplete`; scored kept in a ref; single CTA
  `يلا نبدأ تقييم <name>` → onComplete. Fresh-completion path only.
- P3: header shows `فضلت X أسئلة` (unanswered question steps, dynamic) + `حتى ١٥` cap for cv2 +
  microcopy `لو أي إجابة اتغيّرت، الأسئلة اللي بعدها هتتعدّل تلقائيًا`. No minutes anywhere.
- §8: `computeTrackDiscrepancies(caregiverScored, ladderSnapshot, caregiverRef?)` in merge.js;
  categorical states only, never numeric; attached as `profile.discrepancies` (array, possibly empty);
  canonical label maps exported from merge.js and reused by the screen + First Plan strip.
- §10: ladder draft POST/GET/beacon mirroring caregiver (no DELETE — caregiver has none);
  av2 enum/size checks ONLY when `item_results.bankVersion === 'av2'`.
