# IRIS Auth Flow Report — registration, sessions, email verification

Status: **implemented, tested (43/43), live on production** (2026-11-14).
Companion code: `server/server.js`, `server/lib/email.js`,
`src/App/components/EmailVerificationScreen.tsx`, `src/App/App.tsx`,
`src/App/contexts/AppContext.tsx`, `scripts/qa-auth-flow.mjs`.

## 1. The flow (product order)

```
register ──► forced first assessment ──► email verification ──► parent hub
                                                              ▲
returning login ──────────────────────────────────────────────┤
   (server decides where you resume — never the browser)
```

1. **Registration** (`POST /api/register`) creates the parent AND the child
   row atomically (the child is rolled back if creation fails). The response
   carries `{ token, user, child }` and `emailVerified: false`.
2. **Forced assessment.** A signed-in child profile without a completed
   LADDER record cannot reach the hub or child mode: the router renders
   `IrisLadderAssessment` in forced mode. Finishing it saves the record to
   the server, so it never repeats (tests included the exact save shape).
3. **Email verification.** After the first assessment — or on any login of
   an account that never finished it — the app shows `/verify`. The screen
   auto-sends a code, accepts six digits (keyboard + paste), supports
   resend with a 30s cooldown, and confirms against the server.
4. **Hub.** Verified accounts go straight to the parent hub. Visiting
   `/login`, `/register` or `/verify` while signed-in AND verified
   self-redirects to `/parent` — no repeated onboarding, no assessment
   restarts.

## 2. Server-side rules (source of truth)

- `Users.emailVerified` — added by an additive boot migration with
  `DEFAULT 1`, so every existing account keeps working. New registrations
  store `false`.
- `VerificationCodes` stores **only a SHA-256 hash** of the code, never the
  digits. Codes come from `crypto.randomInt` (6 digits), expire after
  15 minutes, allow 5 wrong attempts, and are consumed on success.
- Wrong code → `CODE_WRONG`; expired → `CODE_EXPIRED`; malformed →
  `CODE_INVALID`; comparison uses `timingSafeEqual`.
- `POST /api/verify/send` is honest: if no provider is configured it returns
  `sent:false, reason:'EMAIL_NOT_CONFIGURED'` — it never pretends. With a
  provider it returns `sent:true, via:'resend'|'smtp'`.
- `requireVerified` protects activity logging (`POST /api/sessions`).
  Assessment saving is intentionally allowed pre-verification because the
  product order is register → assess → verify.
- Ownership: `GET/POST /api/assessments`, `/api/decisions` and activity
  sessions verify the child belongs to the token's user; foreign ids answer
  404 (no existence leaks).
- Sessions: bearer tokens are hashed server-side rows with an 8-hour expiry (TOKEN_TTL_MS);
  logout deletes the row so old tokens die immediately; expiry surfaces as
  401 `SESSION_EXPIRED`.

## 3. Client-side guards (`App.tsx`)

Computed per render from **server-known state only** (`emailVerified:
boolean | null`; `null` = still loading, and the router refuses to jump
ahead of the truth):

- No token on a protected screen → `login`.
- Signed-in, `emailVerified === false`, on any app screen → `verify-email`,
  except while the very first assessment is pending (that comes first).
- Signed-in and verified on `login`/`register`/`verify-email` → `iris-parent`.
- When a guard rewrites the screen, the address bar follows via
  `replaceState` — so refresh keeps you exactly where the rules put you,
  and browser back can only replay auth screens into the same guards
  (after logout, back shows login, never stale app screens).
- `emailVerified` is fed exclusively by server responses: the login
  payload, the boot restore of `/api/users/:email`, `/api/verify/status`,
  and the confirm result. localStorage never carries the flag.

## 4. Email transport (`server/lib/email.js`)

First match wins:

| Mode | Trigger | Notes |
|---|---|---|
| `resend` | `RESEND_API_KEY` set | HTTPS API, no deps |
| `smtp` | `SMTP_HOST` + `SMTP_USER` + `SMTP_PASS` | nodemailer; port 465 secure / 587 STARTTLS |
| `none` | nothing set | honest `EMAIL_NOT_CONFIGURED` |

Currently live configuration (production, Vercel Secrets): **Gmail SMTP** —
`SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465`, `SMTP_USER=tabibigoo@gmail.com`,
`SMTP_PASS=<app password>`, `EMAIL_FROM=IRIS <tabibigoo@gmail.com>`,
`PUBLIC_APP_ORIGIN=https://iris-kohl-seven.vercel.app`.
The app email itself never contains secrets; the Gmail **app password** is
used instead of the account password and can be revoked any time from
Google Account → Security → App passwords.

To switch to Resend later: add `RESEND_API_KEY` (takes priority) or remove
the SMTP vars; nothing else changes.

### Template design

Built in `server/lib/email.js` (`buildVerificationEmail`) to the owner's
"Premium Playful Email" spec. Table-based, inline-styled, no JS/webfonts,
plain-text fallback, RTL/LTR aware. The **real IRIS logo** sits centered near
the top; the **verification code is the centerpiece** — one rounded box per
digit, cycling the exact brand tokens from `src/styles/iris.css` (blue →
coral → yellow → green → purple) as wash backgrounds with matching borders
and dark brand-ink digits for contrast. A few intentional soft shapes
decorate the corners; the mascot appears only as a small signature avatar.
Copy: "Let's Get Started!" + welcome + "YOUR VERIFICATION CODE" + a
**lifetime line that is rendered from the actual `CODE_TTL_MS` constant**
(never a hardcoded number) + "One little step towards a brighter learning
journey!" + "With care, The IRIS Team". The code shown is the real
dynamically-generated OTP passed in by the caller; no hashes, tokens, or
sample values ever appear. Verified live end-to-end: send → wrong code
rejected (`CODE_WRONG`) → correct code verifies → `emailVerified` true, with
OTP generation/hashing/expiry logic untouched.

---

## Durable data on serverless (added 2026-11-14)

**Problem.** Vercel's free instances keep the SQLite file only in `/tmp`,
which is wiped whenever an instance is recycled. Accounts, OTP rows and
assessments disappeared between cold starts — the root cause of "I can't
find the verification email" complaints: the resend on the verify screen
targeted an email the (empty) database no longer had an account for.

**Design — one authoritative snapshot in Vercel Blob (`server/lib/blobsync.js`).**

- Private store `iris-db`; the static RW token lives ONLY in the project
  environment (`BLOB_READ_WRITE_TOKEN`, Sensitive, production). It never
  appears in code, git, or this file.
- Activation: `VERCEL=1` (or an explicit `BLOB_SYNC=1`). Plain local dev
  keeps using its local file untouched, so QA sandboxes cannot poison the
  production snapshot.
- `boot` → `restore()` downloads `iris-db/snapshot.sqlite` (head() then a
  bearer fetch of the signed URL — @vercel/blob v2 has no `download()`)
  and writes it over the SQLite path BEFORE `sequelize.sync()` runs.
- `mutation` → every successful non-GET `/api` call marks the file dirty;
  uploads are debounced (400 ms) and always awaited before the next
  request starts. Critical routes (register, confirm) additionally
  `await flushNow()` BEFORE responding, because serverless functions may
  freeze the moment a response is sent.
- `identical bytes never re-upload` (md5 compare).

**Boot gate.** The Vercel handler can be invoked while the async
restore→sync chain is still running; an early request would open a fresh
empty `/tmp` file under the about-to-overwrite handle and return
`LOGIN_FAILED 500`. Every `/api` request now parks behind `bootReady`
until restore+sync+migrations complete.

**Accepted trade-off (documented):** concurrent cold instances converge
last-writer-wins on the single snapshot. For the current MVP traffic
(one parent per household, low rate) this is fine; the upgrade path is a
real Turso/Postgres URL (`TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` are
already honoured by `config/database.js`).

**Verified live (2026-11-14):** register → redeploy (new instances) →
`/api/health` reports `restored:"restored"` with a non-zero DB → login of
the same account returns 200 with `emailVerified` preserved, duplicate
register returns 409, and activity logging works on the restored child
row. Full OTP acceptance (real Gmail delivery, wrong/expired/resend/correct
via the deployed UI) is asserted by `scripts/e2e-prod-2.mjs` and
`scripts/qa-auth-flow.mjs` (47/47).

### Test-mode codes

`VERIFY_DEV_CODES=true` makes the send response also echo `devCode` and the
screen show the "test mode" chip. This flag is set **only on the local dev
server** and deliberately NOT on Vercel — production responses have been
verified to contain no `devCode` field.

## 5. Fixes found on the way

- **BigInt row ids:** `@libsql/client` returns `BigInt` for `lastInsertRowid`;
  the `sqlite3` shim now converts to `Number`. Without this,
  `Model.create(...).id` was `undefined` on every insert (silent data bug).
- **Logout URL:** `logoutUser` used `setCurrentScreen` (URL stayed stale);
  it now uses `navigateTo` so history and guards agree.
- **LoginScreen** no longer hard-routes unverified users to `/verify` — the
  guards decide, which preserves the assessment-first order.

## 6. Verification

`scripts/qa-auth-flow.mjs` (Playwright + direct API) — **43/43 pass**, run
against the live local server WITH the real Gmail SMTP provider:

- registration: success shape, duplicate 409, weak password 400, email
  normalisation, new accounts unverified
- login: correct/wrong/unknown, uniform 401, working token
- sessions: expiry honoured, logout revocation, re-login
- verification: send (real SMTP), cooldown 429, wrong/expired/right codes,
  status truth, verified gating of `/api/sessions`
- ownership: cross-user reads and writes all 404, owner paths 200/201
- browser: assessment-first on fresh logins, refresh persistence everywhere,
  `/verify` UI (six boxes, chip, resend, error text), verify → hub without
  ever returning to login, `/login` self-redirect when already verified,
  logout leaves the app, back-button cannot re-enter protected screens

Plus: engine suite 168/168, landing interaction battery green, production
smoke (`sent:true, via:smtp` + no devCode on live).
