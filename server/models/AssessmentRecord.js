/** Assessment + raw per-item evidence (doc 19 §1). Append-only by convention. */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AssessmentRecord = sequelize.define('AssessmentRecord', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  childId: { type: DataTypes.INTEGER, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'COMPLETE' },
  domain_scores: { type: DataTypes.TEXT, defaultValue: '{}' },
  data_quality_flags: { type: DataTypes.TEXT, defaultValue: '[]' },
  accommodations_used: { type: DataTypes.TEXT, defaultValue: '[]' },
  item_results: { type: DataTypes.TEXT, defaultValue: '{}' },
  interruption_count: { type: DataTypes.INTEGER, defaultValue: 0 },

  /**
   * Phase 5 — additive columns for the ladder assessment.
   *
   * Additive, with defaults, so every existing row stays valid and the nine
   * sub-measure assessments continue to read and write exactly as before.
   * A record written by the old flow simply leaves these at their defaults.
   */
  skill_estimates: { type: DataTypes.TEXT, defaultValue: '{}' },
  learning_priorities: { type: DataTypes.TEXT, defaultValue: '[]' },
  confidence: { type: DataTypes.TEXT, defaultValue: '{}' },
  assessment_kind: { type: DataTypes.STRING, defaultValue: 'SUB_MEASURE' }, // or 'LADDER' | 'CAREGIVER'

  rule_pack_version: { type: DataTypes.STRING, defaultValue: 'mvp-1.0.0' },
  is_synthetic: { type: DataTypes.BOOLEAN, defaultValue: false },

  /**
   * Caregiver flow — additive. Optional client-generated reference id used
   * for idempotent submission: a POST repeating (childId, assessment_kind,
   * clientRef) returns the stored record instead of inserting a duplicate.
   * Nullable with no default, so every pre-existing row (and every old
   * client that never sends one) stays NULL and behaves exactly as before.
   * Databases created before this column existed are upgraded by the
   * addClientRefColumns() ADD-COLUMN-ONLY migration in server.js — the same
   * pattern as emailVerified.
   */
  clientRef: { type: DataTypes.TEXT, allowNull: true },
  /**
   * Research framework — observation layer (latencies, breaks, startedAt,
   * helperUsed, audioAuto) sent TOP-LEVEL by the ladder client as
   * `observationMeta`. Persisted as an evidence sibling; deliberately NOT
   * exposed on GET /api/assessments (the 14-key response contract stays
   * byte-identical for every existing caller). Nullable, no default.
   */
  observationJson: { type: DataTypes.TEXT, allowNull: true },
});

module.exports = AssessmentRecord;
