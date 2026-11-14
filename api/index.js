/**
 * Vercel serverless entry (.cjs because the root package.json is type:module;
 *
 * the Express server itself is CommonJS.)
 *
 * The whole Express app — routes, auth, static SPA fallback included — is
 * imported from server/server.js, which exports the app without binding a
 * port when it is required rather than run directly. Vercel's rewrite sends
 * every /api/* request here with the original path preserved, so Express
 * routes stay exactly as they are during local `npm run server` too.
 */
module.exports = require('../server/server.js');
