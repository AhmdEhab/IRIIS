const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Persistent authentication sessions.
 *
 * WHY THIS MODEL EXISTS
 * Sessions used to live in a module-level `new Map()` inside server.js. User
 * rows persisted correctly in SQLite, but every token was lost the moment the
 * server restarted (a crash, a redeploy, or just `npm start` again during
 * development). The browser still held its token in localStorage, so the next
 * authenticated request came back 401 and the app behaved as though the
 * account did not exist — which is exactly the reported symptom
 * "registration and login do not consistently persist users or recognize them
 * afterward". The user record was never the problem; the session was.
 *
 * Storing sessions in the same SQLite database means a token issued before a
 * restart is still valid after it, for as long as its TTL allows.
 *
 * SECURITY NOTE
 * The column stores a SHA-256 hash of the token, not the token itself. The
 * raw token is returned to the client once at login and never persisted
 * server-side, so a leaked database file does not hand an attacker a set of
 * ready-to-use bearer tokens. Lookup hashes the presented token and compares.
 */
const Session = sequelize.define(
  'Session',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    /** SHA-256 of the bearer token. Never the token itself. */
    token_hash: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    /** Epoch milliseconds. Checked on every authenticated request. */
    expires_at: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
  },
  {
    indexes: [{ fields: ['token_hash'] }, { fields: ['email'] }],
  }
);

module.exports = Session;
