/**
 * Minimal .env loader.
 *
 * WHY THIS EXISTS RATHER THAN `node --env-file`
 * ---------------------------------------------
 * The start script used `node --env-file-if-exists=.env`. That flag only
 * exists on Node 22.9+, and it resolves the path against the CURRENT WORKING
 * DIRECTORY. Both are silent failure modes:
 *
 *   - On an older Node the flag is not recognised and the process refuses to
 *     start at all ("bad option"), so the backend simply never comes up.
 *   - Started from the repository root rather than server/, the flag looks for
 *     ./.env, does not find it, and — because it is the "if-exists" variant —
 *     carries on with NO configuration and no warning. Narration then reports
 *     "not configured" and silently falls back to the browser voice, which
 *     looks exactly like a broken integration.
 *
 * This loader has neither problem: it runs on any Node, resolves the path
 * relative to THIS FILE, and says out loud what it found.
 *
 * It is deliberately small. It is not a general dotenv implementation: it
 * handles `KEY=value`, surrounding whitespace, `export ` prefixes, comments,
 * blank lines, and optional single/double quotes around the value. That covers
 * server/.env.example and anything shaped like it.
 *
 * It never overwrites a variable that is already set, so a real environment
 * variable (CI, a shell export, a hosting panel) always wins over the file.
 */
const fs = require('fs');
const path = require('path');

/** Names whose VALUES must never be printed. Only presence is ever logged. */
const SECRET = /KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL/i;

function parse(text) {
  const out = {};
  for (const rawLine of text.split(/\r?\n/)) {
    let line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.startsWith('export ')) line = line.slice(7).trim();

    const eq = line.indexOf('=');
    if (eq === -1) continue;

    // `KEY = value` and `KEY=value` must behave the same. A stray space around
    // the equals sign is the single most common way one of these files is
    // mistyped, and it should not be the difference between working and not.
    const key = line.slice(0, eq).trim();
    if (!key) continue;

    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length > 1) ||
      (value.startsWith("'") && value.endsWith("'") && value.length > 1)
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

/**
 * Load server/.env into process.env.
 * @returns {{loaded: boolean, file: string, names: string[]}}
 */
function loadEnv() {
  const file = path.join(__dirname, '.env');
  if (!fs.existsSync(file)) {
    console.log(`[env] no ${file} — using process environment only`);
    return { loaded: false, file, names: [] };
  }

  let parsed;
  try {
    parsed = parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    console.warn(`[env] could not read ${file}: ${err.message}`);
    return { loaded: false, file, names: [] };
  }

  const names = [];
  for (const [k, v] of Object.entries(parsed)) {
    if (process.env[k] === undefined) process.env[k] = v;
    names.push(k);
  }

  // Names only. A value is never logged, secret or not.
  console.log(`[env] loaded ${names.length} variable(s) from server/.env: ${names.join(', ')}`);
  const blank = names.filter((n) => !process.env[n]);
  if (blank.length) console.warn(`[env] WARNING — these are present but EMPTY: ${blank.join(', ')}`);
  void SECRET;

  return { loaded: true, file, names };
}

module.exports = { loadEnv, parse };
