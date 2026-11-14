const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
/**
 * One pending 6-digit email-verification code per row.
 *
 * SECURITY: the column stores a SHA-256 hash of the code, exactly like the
 * Session table stores hashes of bearer tokens — a database leak can never
 * be replayed as codes. Attempts are counted so guessing is capped, expiry
 * is checked on every compare, and confirming marks the row used rather
 * than deleting it, which keeps an audit trail of when each email was
 * verified.
 */
const VerificationCode = sequelize.define(
  'VerificationCode',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    code_hash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    /** Epoch milliseconds; a code lives 15 minutes. */
    expires_at: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    /** Wrong tries so far; the row is destroyed after MAX_ATTEMPTS. */
    attempts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    /** Epoch ms of successful confirmation. Null while pending. */
    used_at: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
  },
  {
    indexes: [{ fields: ['userId'] }, { fields: ['code_hash'] }],
  }
);
module.exports = VerificationCode;
