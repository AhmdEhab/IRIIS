const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
/**
 * One dialect — two homes.
 *
 * Local dev (and the old file-based deployments) keep plain SQLite on disk:
 * DB_PATH can move the file onto a persistent volume. When TURSO_DATABASE_URL
 * is set — the shape a serverless host like Vercel forces on you, where the
 * filesystem is read-only — the same SQLite dialect talks to Turso (a hosted
 * libSQL/SQLite) through sqlite3-shim.js, a thin sqlite3-compatible adapter
 * over @libsql/client. Models, queries and migrations do not know the
 * difference; nothing else in the server changes.
 */
const REMOTE = process.env.TURSO_DATABASE_URL;
let sequelize;
if (REMOTE) {
  const { SqliteConnectionManager } = require('sequelize/lib/dialects/sqlite/connection-manager');
  SqliteConnectionManager.prototype._loadLibrary = function () {
    return require('../sqlite3-shim');
  };
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: REMOTE, // the shim turns libsql:// URLs into a Turso client
    logging: false,
  });
} else {
  const storage = process.env.DB_PATH || path.join(__dirname, '..', 'database.sqlite');
  fs.mkdirSync(path.dirname(storage), { recursive: true });
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage, // Database file location
    logging: false,
  });
}
module.exports = sequelize;
