const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
/**
 * One dialect — two homes, one driver.
 *
 * The SQLite dialect runs on sqlite3-shim.js in every environment: a thin
 * sqlite3-compatible adapter over @libsql/client. That matters for two
 * reasons. (1) Serverless hosts like Vercel block native install scripts,
 * so the classic sqlite3 binary never gets built there — libsql ships a
 * prebuilt package that works. (2) storage accepts both plain file paths
 * (local dev, DB_PATH on a persistent volume) and libsql:// URLs (Turso
 * Cloud, where TURSO_DATABASE_URL + TURSO_AUTH_TOKEN hold the same SQLite
 * file remotely). Models, queries and migrations cannot tell the difference.
 */
/**
 * The installed Sequelize (v6) resolves dialect drivers through the abstract
 * connection manager's `_loadDialectModule('sqlite3')`. Swap that single seam
 * so the SQLite dialect loads sqlite3-shim.js (@libsql/client) instead of the
 * native sqlite3 binary — hosts that block native install scripts still get a
 * working, file-compatible driver, and Turso URLs become reachable.
 */
const AbstractConnectionManager = require('sequelize/lib/dialects/abstract/connection-manager');
AbstractConnectionManager.prototype._loadDialectModule = function (moduleName) {
  if (moduleName === 'sqlite3') return require('../sqlite3-shim');
  return require(moduleName);
};
const REMOTE = process.env.TURSO_DATABASE_URL;
let storage = REMOTE;
if (!storage) {
  storage = process.env.DB_PATH || path.join(__dirname, '..', 'database.sqlite');
  fs.mkdirSync(path.dirname(storage), { recursive: true });
}
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage, // file path locally, libsql:// URL for Turso
  logging: false, // Disable logging SQL queries to console
});
module.exports = sequelize;
