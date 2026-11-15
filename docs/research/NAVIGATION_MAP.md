# IRIS — Navigation Map & Overhaul Plan (November 2026)

Produced from the three parallel audits (routing, screens, motion/performance) BEFORE any modification, as required.

## 1. User journeys (target state)

```
LANDING (/) → REGISTER (/register) → VERIFY (/verify) → FAMILY FILE (/caregiver, forced)
    → LADDER (/assessment, forced, child assent) → FIRST PLAN (/plan) → PARENT HUB (/parent)
        → SNAPSHOT /snapshot · PROGRESS /progress · TIPS /tips · CHAT /chat
        → COMMUNITY /community · SPECIALISTS /specialists · FAMILY /family · SETTINGS /settings
        → CHILD MODE /play → activities /play/<id> · games /play/games(+memory/balloon/shadow)
                                        rewards /play/rewards
RETURNING: /parent hydrates → skips every completed gate (never re-asks)
```

## 2. Route table (after the overhaul — every screen addressable)

| screen | path | audience | entry | exits | gate |
|---|---|---|---|---|---|
| marketing | / | both | boot, logout, Home pill | login, register, /play door | public |
| login | /login | parent | landing, guard | hub, register, landing | auth-aware |
| registration | /register | parent | landing, login | verify (transition, now history-safe) | signed-in rewrites |
| verify-email | /verify | parent | register, gate | hub | absolute precedence |
| caregiver-profile | /caregiver | parent | gate, family edit | family-profile | PROTECTED + gate |
| ladder-plan | /plan | parent | ladder finish, hub | hub, family | PROTECTED + gate |
| iris-parent | /parent | parent | login/verify/hub-backs | subscreens, /play, marketing | PROTECTED + gate |
| iris-snapshot | /snapshot | parent | hub, ladder exits | hub, practice, assessment | PROTECTED + gate |
| iris-progress | /progress | parent | hub | hub, chat, play | PROTECTED + gate |
| iris-tips | /tips | parent | hub | hub | PROTECTED + gate |
| iris-parent-chat | /chat | parent | hub, progress | hub | PROTECTED + gate |
| iris-community | /community | parent | hub | hub | PROTECTED + gate |
| iris-specialists | /specialists | parent | hub | hub | PROTECTED + gate |
| iris-family-profile | /family | parent | hub, plan, caregiver | hub, caregiver, snapshot, retake | PROTECTED + gate |
| parent-settings | /settings | parent | hub | hub | PROTECTED + gate |
| iris-ladder-assessment | /assessment | child | gate, snapshot retake | snapshot / plan | PROTECTED + gate |
| iris-ladder-practice | /practice | child | snapshot, daily start | snapshot | PROTECTED |
| child-mode | /play | child | hub | activities, hub (hold-to-exit parent gate) | PROTECTED + gate |
| activities ×15 | /play/<id> | child | child home | /play | PROTECTED |
| games-hub | /play/games | child | child home | /play | PROTECTED |
| memory/balloon/shadow | /play/games/<id> | child | games hub | /play/games | PROTECTED |
| rewards | /play/rewards | child | child home | /play | PROTECTED |
| transition | none (transient) | both | register, daily start | destination (URL replaced at start) | — |

## 3. History contract (new)

- `navigateTo` pushes a URL for EVERY screen (previously only 9 of ~40).
- `startTransition` replaces the address to the destination path when it begins, completes by state only, and its timer is cancelled on any popstate/`navigateTo` — no blind yank.
- `popstate` normalizes: valid state → screen; known path → screen; unknown → canonical screen for the current guard, `replaceState` fixes the bar (no more URL≠screen).
- Direct URLs boot through `PATH_SCREENS` → guards apply (unauth → /login; unverified → /verify; incomplete onboarding → first unfinished gate).
- Refresh preserves state that has persistence (drafts, ladder probe/cal, server records) and now also preserves the screen itself; language and stars became persisted.

## 4. Audit findings by severity (fixed in this overhaul)

P1 broken: back skips ~35 screens; startTransition timer redirects after user left; /register re-asks signed-in-unverified; emailVerified can stay null forever (no boot re-check); hub flash before hydration; forced family-file suspend loops into itself; ladder assessment/practice have no in-run exit; zero-item practice dead-ends (1/0 with no controls); calIndex>probes white-screen; logout from Progress lands on /login not landing; First Plan H1 prints a literal \u2019 escape; clickable-but-"closed" hub cards; silent Save button; invisible validation errors (speech-only); selected answer painted green (=success) in ladder cards; child can exit Child Mode with one tap; Rewards badge references withdrawn "AI test"; fabricated "Most Played/New" chips; dead lock branches; unlabelled settings inputs; unescaped modal semantics (reset dialog, KidOverlay); text-white on wash (invisible child text) across activity screens; physical right/left offsets wrong in RTL; legacy orphan cluster ships in bundle.

P2 states: community/specialists no catch + blank while loading; empty category feeds; unreachable "no sessions" branch; verify "checking" never renders; chat thinking never paints; save results audio-only.

Perf: 1,185 kB eager JS single chunk (motion 426 kB raw, banks 224 kB, zero route-splitting); font @import chains behind CSS; 32 width/height CSS animations incl. layout-triggering progress bars; provider values recreated every render (43+46+20 consumers fan out on any tick).

## 5. Motion system (shared, GPU-friendly)

- `src/App/motion/tokens.ts`: durations FAST .12 / MED .2 / SLOW .32; easings: standard [0.2,0.8,0.2,1] + decel [0.05,0.7,0.1,1]; one spring preset reserved for celebration/pop. Variants: fadeIn, popIn, pageEnter (RTL-aware translateX), pageExit, stagger list.
- Page transition = fade + slight inline-axis slide + soft scale on dialogs/cards; transform+opacity only; durations ≤ 320 ms so navigation never feels slower.
- `prefers-reduced-motion`: OS MQ + in-app calm now BOTH zero the 32 CSS keyframe decorations via `[data-motion='low']` mirror block; width-progress bars converted to `transform:scaleX` (origin flips for RTL); accordion → grid-rows; AudioContext fades → WebAudio ramps.
- Lively: springs only where joyful (stars, pops, completion). Nothing essential is conveyed by animation alone.

## 6. Design-system unification

- One funnel look: registration adopts brand Button/Field/Surface (already used by login).
- One back semantics: Home pill = hub; chevron = previous (TopBar/BackButton everywhere; the 8 variants removed).
- One selection pill vocabulary for chip groups reuses cp-chip visuals already brand-consistent; wash surfaces get ink text; focus rings unified to the global :focus-visible rule.
- Language control: single ChromeActions pill (flag-emoji variants removed).
- Orphan legacy screens (mode-selection, ai-assessment, parent-dashboard, child-mode legacy, family-guidance, splash, teaching-demo route, legacy community route) are UN-ROUTED and excluded from the bundle; source files kept on disk pending owner decision.

## 7. Verification contract

`scripts/qa-navigation.mjs` walks: every route by URL, browser back/forward chain, F5 per route (state + gate preserved), direct-URL gate matrix (unauth/unverified/onboarding-incomplete), dead-end sweep (each screen must expose back/home), console-error watch, mobile+desktop screenshots. Existing suites (units, cv2, family, auth, landing) must stay green.

## IMPLEMENTED (P59, 2026-11-15)
Status: shipped and green. Everything mapped above is live in dev; the audit
recommendations were executed as follows:
- URL is now real state: SCREEN_PATHS + pushState on navigateTo, popstate
  back/forward replay, replaceState self-heal on every sync, unknown paths
  rewritten to `/`. All PROTECTED screens deep-link and F5 correctly;
  signed-out deep links rewrite to `/login`.
- Legacy dead ids retired; `/settings` promoted to first-class.
- Ancestor-gated screens (ladder, practice, caregiver, plan, family file)
  resolve through the guard chain instead of silently landing on the hub.
- Route components are per-screen `React.lazy` chunks behind one Suspense
  boundary + ErrorBoundary; the 1.1MB monolith split into a 638kB core
  (206kB gzip) with three.js (833kB) only in the lazy 3D-viewer chunk.
- Shared page transition (motion/tokens.ts): opacity + 14px inline-axis
  slide, RTL-aware via `--iris-dir-x`; opacity-only `pageVariantsCalm` for
  reduced motion / calm mode.
- IMPORTANT platform lesson (fixed during integration): motion v12 leaves an
  identity transform on the animated wrapper (WAAPI forwards-fill, or a stuck
  `initial` under prefers-reduced-motion). ANY transform — even the identity
  matrix — silently becomes the containing block for every `position:fixed`
  descendant, which pushed the grown-up gate and kid overlays ~960px below
  the fold. Countermeasures shipped: MotionConfig `transformTemplate` strips
  pure-identity transforms; reduced motion never touches transform; and ALL
  viewport-fixed dialogs (ParentGate, KidOverlay break/cap, IrisCelebration,
  TransitionScreen, ParentChatModal, settings reset modal) are portaled to
  `document.body` with an explicit token scope (`.lc-token-scope`).
Verification: build ✓ · 188 engine tests ✓ · qa-navigation 27/27 ✓ ·
qa-cv2-flow 31/31 ✓ · qa-family-flow 16/16 ✓ · qa-auth-flow 47/47 ✓ ·
qa-landing-interactions (incl. axe WCAG 2.0 AA, both widths, both languages) ✓.
Evidence: /home/ubuntu/iris-delivery/navigation/*.png
