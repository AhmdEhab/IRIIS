# IRIS narration voice — setup

IRIS speaks through ElevenLabs. One Arabic voice, one English voice, chosen
automatically from whatever language the app is currently in.

You need to do three things once. It takes about two minutes.

---

## 1. Get your API key

1. Sign in at <https://elevenlabs.io>
2. Click your profile icon (top right) → **API Keys**
3. Create a key and copy it

## 2. Choose your two voices

Every ElevenLabs voice has an ID — a short string like `21m00Tcm4TlvDq8ikWAM`.

The easy way to find yours:

```bash
npm run server            # start the backend
```

then open <http://localhost:5000/api/tts/voices> in a browser. It lists every
voice on your account with its `voice_id`. (This needs the key from step 1 to
be set first, so you may prefer to do step 3, then come back and confirm.)

You can also read the ID out of the voice's URL in the ElevenLabs dashboard.

Pick **one Arabic female voice** and **one English female voice**.

## 3. Put them in `server/.env`

Copy the template and fill in the three values:

```bash
cp server/.env.example server/.env
```

```ini
ELEVENLABS_API_KEY=sk-your-key-here
ELEVENLABS_VOICE_AR=your-arabic-voice-id
ELEVENLABS_VOICE_EN=your-english-voice-id
```

Restart the backend. That is the whole setup.

```bash
npm run server
```

Check it worked — <http://localhost:5000/api/tts/status> should say:

```json
{ "configured": true, "hasKey": true, "hasArabicVoice": true, "hasEnglishVoice": true }
```

---

## How the voice is chosen

Nothing in the app picks a voice. Every narration call already passes the
current language, and the server maps it:

| App language | Voice used            |
| ------------ | --------------------- |
| Arabic       | `ELEVENLABS_VOICE_AR` |
| English      | `ELEVENLABS_VOICE_EN` |

Switching language in IRIS switches the voice with it, everywhere — Child Mode,
instructions, encouragement, activities, stories, results.

## If something is not configured

IRIS never goes silent. If the key is missing, a voice ID is blank, the network
is down, or ElevenLabs returns an error, narration falls back to the browser's
built-in speech synthesis — the voice IRIS used before. The app behaves
identically otherwise, and the on-screen captions are unaffected.

This is also what makes the app safe to demo on a machine with no internet.

## Cost and caching

Each distinct line is synthesised **once** and then cached:

- on the server, in `server/.tts-cache/`, keyed by the text, voice and model
- in the browser, for the lifetime of the page

So a line a child hears fifty times is billed once. Delete
`server/.tts-cache/` if you change voices and want everything re-synthesised
with the new voice.

The shared phrase library ("well done", "let's try again", and so on) is
pre-synthesised the first time each language is used, so the first encouragement
a child hears does not wait on a network round trip.

## Security

The key lives in `server/.env` and is read only by the backend. It is never
sent to the browser and never appears in the built bundle — there is a check
for this in the QA suite. Do not move these values into a `VITE_`-prefixed
variable: anything with that prefix is inlined into the public JavaScript.

Keep `server/.env` out of git. `.gitignore` already covers it.

## If narration is not working — run this first

```bash
node scripts/check-voice.mjs
```

It walks the whole path in order and stops at the first thing that is actually
broken: `.env` loading → is the key accepted → do the two voice IDs exist →
real Arabic and English synthesis → the same two lines through the IRIS
backend. It never prints the key.

It also writes `scripts/voice-check-output/arabic.mp3` and `english.mp3`.
**Play them.** An HTTP 200 only proves bytes arrived; listening is the only way
to confirm the Arabic voice really speaks Arabic and that the two are not
swapped.

`GET /api/tts/status` also now reports `lastError`, naming the last upstream
failure (for example `UPSTREAM_401` for a rejected key).

## Troubleshooting

| Symptom                             | Cause                              | Fix                                                     |
| ----------------------------------- | ---------------------------------- | ------------------------------------------------------- |
| Old robotic voice still             | Not configured, or backend not restarted | Run `node scripts/check-voice.mjs`; restart `npm run server` |
| `status` says `hasKey: false`       | `server/.env` not found or key line empty | The backend logs an `[env]` line at startup saying what it loaded |
| `lastError: UPSTREAM_401`           | ElevenLabs rejected the key        | Create a fresh key in the ElevenLabs dashboard           |
| `lastError: UPSTREAM_429`           | Rate / concurrency limit           | Wait a moment; warming is capped at 2 parallel requests  |
| Arabic speaks in the English voice  | The two IDs are swapped            | Swap `ELEVENLABS_VOICE_AR` and `ELEVENLABS_VOICE_EN`    |
| Silence                             | Audio muted in the app             | Unmute with the speaker control                          |
| First line is slow, rest are instant | Normal — first synthesis, then cached | Nothing; warm it by running through once before a demo |
| Voice changed but audio didn't      | Old clips still cached             | Delete `server/.tts-cache/`                              |

## Tests

```bash
node qa-tts.mjs      # route: voice-per-language, caching, every failure mode
node qa-voice.mjs    # browser: no overlap, mute, navigation, fallback
```

`qa-tts.mjs` mocks ElevenLabs, so both run without a key and without network.
