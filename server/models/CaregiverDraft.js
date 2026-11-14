/**
 * CaregiverDraft — resumable autosave for the caregiver assessment flow.
 *
 * ONE ACTIVE DRAFT PER CHILD: the routes upsert by childId (latest write
 * wins), so this table is scratch space for "continue where I left off",
 * not an append-only history. The durable submission is still a normal
 * AssessmentRecord (kind 'CAREGIVER') created via POST /api/assessments;
 * on COMPLETE the client posts both.
 *
 * No owner email column on purpose: ownership is derived through the Child
 * row in every route (auth spec §5 / childBelongsToUser), so a denormalised
 * email here could only ever drift or leak.
 *
 * Table: 'CaregiverDrafts' (Sequelize default pluralisation). Created whole
 * by sequelize.sync() like every other model — a table this new needs no
 * ADD COLUMN migration, only the additive clientRef column on
 * AssessmentRecords gets that treatment (see server.js).
 * createdAt/updatedAt DATE columns come from Sequelize's default timestamps;
 * updatedAt doubles as the autosave stamp returned by GET /api/caregiver/draft.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CaregiverDraft = sequelize.define('CaregiverDraft', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  childId: { type: DataTypes.INTEGER, allowNull: false },
  /** Client-generated reference for the questionnaire run this draft belongs to. */
  clientRef: { type: DataTypes.TEXT, allowNull: true },
  /** 'IN_PROGRESS' | 'COMPLETE' — the route normalises anything else to IN_PROGRESS. */
  status: { type: DataTypes.STRING, defaultValue: 'IN_PROGRESS' },
  /** Serialised answers object — TEXT like every JSON column here, parsed back on read. */
  responsesJson: { type: DataTypes.TEXT, defaultValue: '{}' },
}, {
  // Index-only, not unique: upserts are find-then-write at the application
  // level, and a rare race leaving two rows must not turn the next autosave
  // into a 400. Reads order by id DESC, so the newest row always wins.
  indexes: [{ fields: ['childId'] }],
});

module.exports = CaregiverDraft;
