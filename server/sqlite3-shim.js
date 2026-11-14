/**
 * Minimal sqlite3-compatible shim over @libsql/client.
 * Sequelize's SQLite dialect only needs: Database(path), .run/.all/.get with
 * (sql,[params],cb), .close, .configure, and an EventEmitter for errors.
 */
const { createClient } = require('@libsql/client');
const { EventEmitter } = require('events');
class Database extends EventEmitter {
  constructor(path, mode, cb) {
    super();
    this.client = typeof path === 'string' && (path.startsWith('libsql://') || path.startsWith('http'))
      ? createClient({ url: path, authToken: process.env.TURSO_AUTH_TOKEN })
      : createClient({ url: 'file:' + path });
    if (typeof mode === 'function') mode = null;
    if (typeof cb === 'function') queueMicrotask(() => cb.call(this));
  }
  _norm(sql, params, cb) {
    if (Array.isArray(sql)) { cb = params; params = sql[1]; sql = sql[0]; }
    if (typeof params === 'function') { cb = params; params = []; }
    return [sql, params || [], cb || function () {}];
  }
  run(...a) {
    const [sql, params, cb] = this._norm(...a);
    this.client.execute({ sql, args: params }).then(r => {
      /**
       * @libsql reports row ids as BigInt; the sqlite3 API contract
       * (and Sequelize's getInsertIdField → "lastID") expects a Number,
       * and BigInt never ==  a number literal. Normalise here so
       * Model.create() instances carry a usable id — the shim's earlier
       * version made Child.parentId silently null after create.
       */
      const lastID = r.lastInsertRowid === null ? null : Number(r.lastInsertRowid);
      cb.call({ stmt: r, lastID, changes: r.rowsAffected }, null, lastID, r.rowsAffected);
    }).catch(e => cb.call({ stmt: null }, e));
  }
  all(...a) {
    const [sql, params, cb] = this._norm(...a);
    this.client.execute({ sql, args: params }).then(r => cb.call(this, null, r.rows.map(o => ({ ...o })))).catch(e => cb.call(this, e));
  }
  get(...a) {
    const [sql, params, cb] = this._norm(...a);
    this.client.execute({ sql, args: params }).then(r => cb.call(this, null, r.rows[0] ? { ...r.rows[0] } : undefined)).catch(e => cb.call(this, e));
  }
  close(cb) { this.client.close?.(); if (cb) queueMicrotask(cb); }
  /** Sequelize's pool serialises mutations; libsql is already linearised per
   *  connection, so run the callback synchronously. */
  serialize(fn) { if (fn) fn(); }
  parallelize(fn) { if (fn) fn(); }
  configure() {}
}
module.exports = { Database, verbose() { return module.exports; } };
