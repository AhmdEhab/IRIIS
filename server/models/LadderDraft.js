/**
 * LadderDraft — resumable autosave for the CHILD-facing ladder run (spec §5).
 *
 * Deliberately NOT a `kind` column on CaregiverDrafts: that table has no kind
 * column, and adding one means a migration this build is not allowed to write.
 * A brand-new table is created WHOLE by sequelize.sync() — the exact same
 * route CaregiverDraft itself took (see its file header) — so server.js needs
 * only `require('./models/LadderDraft')` and no ADD COLUMN step.
 *
 * ONE ACTIVE DRAFT PER CHILD: the routes upsert by childId, latest write
 * wins, mirroring the caregiver semantics exactly (auth + consent +
 * childBelongsToUser + 512 KB cap + 413 DRAFT_TOO_LARGE). The durable record
 * is still a normal AssessmentRecord (kind 'LADDER') via POST /assessments;
 * this table is resume scratch space only. `status:'INVALID'` drafts are
 * stored but never hydrate as resume points — that decision lives client-side
 * (spec §5), the server just keeps what it is told.
 *
 * No owner email column on purpose: ownership is derived through the Child
 * row in every route (auth spec §5 / childBelongsToUser).
 *
 * Table: 'LadderDrafts' (Sequelize default pluralisation).
 * createdAt/updatedAt come from Sequelize's default timestamps; updatedAt is
 * the autosave stamp returned by GET /api/ladder/draft.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LadderDraft = sequelize.define('LadderDraft', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  childId: { type: DataTypes.INTEGER, allowNull: false },
  /** Client-generated reference for the ladder run this draft belongs to. */
  clientRef: { type: DataTypes.TEXT, allowNull: true },
  /** 'IN_PROGRESS' | 'COMPLETE' | 'INVALID' — the route normalises anything else to IN_PROGRESS. */
  status: { type: DataTypes.STRING, defaultValue: 'IN_PROGRESS' },
  /** Which child instrument wrote the state; 'av2' from the first UI lane on. */
  bankVersion: { type: DataTypes.STRING, defaultValue: 'av2' },
  /** Serialised run state { phase, calIndex, calResponses, probeState, visitSeed,
   *  observations, startedAt, bankVersion } — TEXT like every JSON column here,
   *  parsed back on read. */
  stateJson: { type: DataTypes.TEXT, defaultValue: '{}' },
}, {
  // Index-only, not unique — same race tolerance as CaregiverDraft: reads
  // order by id DESC so the newest row always wins.
  indexes: [{ fields: ['childId'] }],
});

module.exports = LadderDraft;
