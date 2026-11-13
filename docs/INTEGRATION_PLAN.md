# IRIS — Integration & Enhancement Plan

**Date:** 2026-11-13 · **Branch:** `feature/iris-unification` · **Status:** Approved-for-execution plan, pre-implementation

Sources analyzed: Repo 1 `/home/ubuntu/iriss` (MAIN), Repo 2 `/home/ubuntu/repo2` (REFERENCE),
and `/home/ubuntu/repo2/Claude outputs/IRIS_HARDENING_source.zip` (extracted to `/home/ubuntu/analysis/hardening_src`).

---

## 1. Headline findings

1. **Repo 1 and Repo 2 are the same codebase at different stages.** ~25 src files differ; 9 core
   child screens (Letters, Numbers, Colors, ChildMode, Splash, ModeSelection, Transition…) are
   byte-identical. Repo 2 adds `src/iris/` (assessment engines, ladders, parent subsystem), a real
   audio pipeline, a hardened server, 19 new screens, tests (119 passing) and QA scripts.
2. **Repo 2/iriss-main is NOT the newest code.** The hardening zip is strictly newer: it fixes the
   `iris_token` vs `iris_auth_token` bug, threads a real `childId` (POST/GET `/api/children`),
   adds a Gemini-backed `/api/ai` generation layer, and contains the **fully implemented
   Phase-10 brand restyle** (measured: 761 → 0 off-palette colour utilities, 102 → 0 gradients,
   21 → 5 radii, WCAG AAA on 280 sampled nodes, 119/119 tests + 15/15 QA suites green).
3. **Repo 1's assessment is fabricated and must be deleted, not improved:** per-diagnosis score
   bonuses ("Scientific norming" comment with invented `baseLevel` 42–48), an `iqScore` field,
   calls to a Python AI service on `localhost:8000` that exists in neither repo (silent fallback
   every run), a dead analytics block, and an invisible progress counter. Repo 2's ladder engine
   is criterion-referenced, diagnosis-blind by construction, honest about "not measured", and tested.
4. **Repo 1's backend is a privacy defect:** plaintext passwords, unauthenticated email-keyed
   GET/PUT (IDOR), `GET /api/users` dumps every record, and the committed `server/database.sqlite`
   contains 6 real accounts' passwords + children's PII. Repo 2/zip server: bcrypt, hashed
   bearer tokens with TTL, ownership + consent gates, Child/AssessmentRecord/ActivitySession models.
5. **Audio:** Repo 2's ElevenLabs-proxy pipeline (server-side key, disk cache, warm queue, graceful
   browser-TTS fallback, Egyptian-Arabic phrase library, level-matched recorded cues, ducking,
   captions) is superior in every respect except first-utterance latency with no backend running.
   It ports with **zero changes to repo 1's 209 existing call sites** (interface is a superset).
6. **Repo 1 keeps one genuinely better mechanism:** `CognitiveEngine.evaluateAndAdapt()` — an
   adaptive loop that lowers animation intensity when a child's repeat-rate exceeds 0.4. Repo 2
   deleted it in favour of a static OS preference. We restore the **mechanism** (driven by
   observed performance, never by diagnosis, parent-lockable) inside repo 2's **governance** rules.
7. **Neither repo has a volume slider** (both expose `setVolume` with no consumer UI), no
   ErrorBoundary, and neither landing is a real marketing landing page. These are net-new work.

## 2. Source-selection decision

| Layer | Port from | Rationale |
|---|---|---|
| Server (auth, models, routes, loadEnv) | **hardening zip** | Only variant with Child-row wiring + token fix + `/api/ai` |
| `src/iris/` engines/ladders/parent/content | **hardening zip** (identical to repo2 + ladder demo fixes) | Tested, honest, diagnosis-blind |
| Audio system (`audio/`, `AudioContext`, sounds assets) | **hardening zip** | Superset interface, graceful no-key fallback |
| `components/iris/` + brand UI + restyled legacy screens | **hardening zip** (Phase-10 restyle) | Directly satisfies the child-UI redesign mandate with a verified, brand-accurate result |
| Landing page | **NEW work**, built on the zip's `IrisLanding` | Zip version is a 110-line entry screen, not the marketing page the brief demands |
| Legacy screens repo-1-only behaviour | keep where zip is silent | e.g. adaptive motion loop restored |

Repo 1 stays the foundation as required: same git history, same remote, same screen set
(extended, never reduced), incremental commits on `feature/iris-unification`.

## 3. Target architecture

```
iriss/                      (package renamed iris-mvp; repo2 .gitignore)
├── index.html              viewport fix (initial-scale 9.0 → 1.0)  [P0]
├── public/images/ + public/sounds/   (+ brand assets migrated)
├── server/                 zip's hardened Express: bcrypt+tokens+consent,
│   ├── routes/tts.js  routes/gemini.js(+guard)  loadEnv.js  .env.example
│   └── models/ User Post Booking Child AssessmentRecord ActivitySession Session
├── src/
│   ├── styles/             fonts.css(rebuilt) theme.css(rebranded,.dark deleted) iris.css(NEW)
│   ├── iris/               spec · ladders · engines · content · parent · demo · journey.js
│   └── App/
│       ├── config.ts  authMessages.ts  services/
│       ├── audio/ (voice · phrases · soundMap)   content/ (stories · homeTips)
│       ├── hooks/ (useReducedMotion)
│       ├── contexts/ AppContext(zip) AudioContext(zip) IrisContext(zip) LanguageContext
│       ├── components/     35 legacy screens (Phase-10 restyled)
│       │   └── iris/       19 screens + ui/ + ui/brand/
│       └── App.tsx         IrisProvider + iris routes + ChildShell + Child-row binding
├── tests/  scripts/  qa-*.mjs  docs/
```

## 4. Execution phases

- **P0 — Safety & hygiene.** Working branch (done). Untrack `node_modules/` (393 MB),
  `server/node_modules/` (43 MB), `dist/`, `server/database.sqlite`; replace `.gitignore`;
  delete empty `iris-platform/`; consolidate `guidlines/`→`docs/`, root `images/` check;
  viewport fix; package name/scripts regularization. *Decision R1 (below): the 6 legacy
  plaintext-password accounts are NOT migrated.*
- **P1 — Foundation port.** Zip → repo1: `config.ts`, `authMessages.ts`, `services/`, `styles/*`
  (iris.css, rebranded theme.css, rebuilt fonts.css), `hooks/useReducedMotion`.
  Check: `npm run build` green; tokens resolve.
- **P2 — Server + audio.** Zip's `server/` wholesale; `src/App/audio/*`; AudioContext swap;
  `public/sounds/*` + brand assets; `.env.example`; untrack sqlite; wire CORS_ORIGIN.
  Check: `npm run server` boots, `/api/health` ok, `/api/tts/status` reports unconfigured,
  register→login→token→PUT flow works, narration falls back to browser voice without keys.
- **P3 — IRIS subsystem graft.** `src/iris/*` + `IrisContext` + `components/iris/*` +
  AppContext(zip) + App.tsx routing (10 new screens, `iris-*`), provider order, ChildShell,
  startChild bridge, `logoutUser`, authMessages.
  Check: `node --test tests/*.test.js` 119/119; app boots; landing→parent→snapshot reachable.
- **P4 — Assessment integration.** Wire zip's ladder flow end-to-end: registration creates Child,
  childId threaded into `submitLadderVisit` (zip fix), assessment-saved rehydrate
  (`GET /api/assessments/:childId`), localStorage probe-resume (net-new, both repos lack it),
  hybrid result presentation (repo-2 honesty + repo-1 celebration/TTS), recommendations map
  learning-priorities → module ordering in `ChildModeScreen` (replacing static `moduleOrder`),
  `recordLadderPractice` after sessions. Delete repo-1 IQ/phantom-AI code paths.
- **P5 — Parent mode unification.** `iris-parent` hub becomes THE parent destination from login
  (legacy `parent-dashboard` retired as a section, not deleted route); snapshot/dashboard/tips/chat/
  community/specialists wired with real data where backend supports it; retire `AI_API_URL` calls;
  optionally enable zip's Gemini `/api/ai` for richer chat when `GEMINI_API_KEY` present (documented
  fallback otherwise); ParentSettings gains Quiet Mode / motion / volume / contrast access panel;
  restore adaptive-motion loop (performance-driven, parent-locked); fix RewardsScreen fabricated
  `1,250 IQ Points` + streak, English gender drift.
- **P6 — Child UI/UX completion.** Apply zip's Phase-10 restyle of all legacy screens; rebuild the
  child hub as one-action screen (duplicate recommended+all list removed, ≤5 tiles at 390 px);
  volume slider (missing in both repos); AudioControl + NarrationCaption across activities;
  ColorsScreen swatches re-derived from brand palette; emoji→BrandIcon in chrome (content emoji stay);
  `no repeat:Infinity` in child areas; ErrorBoundary.
- **P7 — Landing page (net-new build).** Marketing page at `landing`: Hero (headline, value prop,
  CTAs, illustrations + platform preview), About, How It Works (4 steps), Key Features, Why IRIS,
  For Parents, Final CTA, Footer. Brand system: warm ground, one dominant colour per section,
  drawn decor (blobs/dashed arcs/stars), Cairo/Baloo typography, bilingual AR/EN + RTL, subtle
  motion only, honesty disclaimer preserved. No gradients, no corporate dashboard look.
- **P8 — QA & delivery.** Build + boot both servers; browser-test every flow (auth incl. wrong
  password, assessment incl. resume, child activities ×audio, parent chat safety routing,
  community CRUD, bookings); console-error sweep; responsive matrix 360/390/820/1440 + RTL;
  port zip's `tests/` + relevant `qa-*.mjs`; README rewrite (setup, env vars, demo mode without
  keys); CHANGELOG-style summary; commit history clean; push branch.

## 5. Design system (summary — full spec in zip's PHASE10 docs)

- Tokens: brand fills `#1F67B1 #F45B63 #FECA34 #49B87A #8060B4` + ink/wash variants; ground
  `#FEF6EA`; coral = warning, never child-facing error; `ink-faint` banned from readable text.
- `--screen-accent` per screen: auth/progress=blue, child/play/rewards=yellow, assessment/tips=green,
  chat=purple, community=coral.
- Type: new `@theme` scale (display→label); Arabic: line-height 1.75, **never letter-spaced, never
  uppercase**; bidi-isolated numerals; Baloo 2 / Baloo Bhaijaan 2 display + Cairo body + real local
  fallbacks (CDN-offline safe).
- Motion: two gates — OS `prefers-reduced-motion` (CSS + hook for framer-motion) and the restored
  performance-driven adaptation; no infinite loops in child content; every motion state also
  carried by text/layout.
- A11y: 44 px floor enforced, focus ring tokenized, captions even when muted, `aria-pressed`
  controls with state in name, volume control finally existing, qa-a11y suite ported.

## 6. Fake/dead inventory to remove (not preserve)

Repo 1: `AI_API_URL` + phantom `/assessment|/recommendations|/parent-chat` calls;
`reconstructIrisProfile` (`iq_score = 40 + level*10`); `iqScore` field + IQ-labelled UI everywhere;
`typePerformance` dead loop; `opacity-0` progress counter; FamilyGuidance dead "Assistant" tab;
"View Activity" buttons without handlers; fabricated specialists w/ real booking POST; Rewards
hardcoded `1,250`/streak `5`; parent-gate password shown on screen (`Hint: Password is 1234` —
keep the gate, remove the hint, and label it clearly as a child-safety lock, not real security);
committed sqlite with plaintext passwords.
Repo 2/zip (fixed during port, not inherited): token-key mismatch, `childId=null`, no Child
creation, internal audit vocabulary leaking raw into parent screens (gate behind reviewer toggle).

## 7. Decisions

Owner-decided (defaults chosen if no answer; flagged items affect early phases):
- **D1 mascot**: canonical = Mascot A (already `IrisBuddy.tsx`); B for marketing. *(default: yes)*
- **D2 fonts**: add Baloo 2 / Baloo Bhaijaan 2 display faces. *(default: yes)*
- **D3 restyle scope**: all 20 legacy screens, not just the 5 reachable. *(default: all)*
- **D4 contrast target**: AAA 7:1 for child-facing text. *(default: yes)*
- **D5 legacy accounts**: discard the 6 plaintext-password accounts; fresh DB; users re-register.
  *(default: discard — migration of plaintext passwords is a privacy liability)*
- **D6 API keys**: ElevenLabs + Gemini keys — supplied by owner later, or run in documented
  browser-TTS / rule-based-chat fallback mode. *(default: fallback mode; interface ready)*
- **D7 booking**: keep demo specialists labelled (zip honesty) or hide the feature until real
  clinicians exist. *(default: keep labelled demo, booking disabled at data layer)*

## 8. Risks

- No tsconfig in either repo (esbuild transpile-only): type drift is silent at .js/.tsx boundaries.
- `sync({alter:true})` gated behind `DB_ALTER=true` in zip server — fresh DB bootstrap only (D5).
- Playwright QA scripts assume repo2 conventions (`localhost:5175`, `/opt/pw-browsers`); adjust.
- Phase-10 restyle touches 78 files: ported wholesale from zip, then regression-checked — not hand-merged.
- Zip server drops `POST /api/users` (410): repo-1 frontend must come from zip AppContext.
- Vite inlines any `VITE_*` secret — ElevenLabs/Gemini keys stay server-side only (qa-voice-tuning guards).
