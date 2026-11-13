/** Session result + the PathwayDecision that followed it (doc 19 §1, R-PATH-011). */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ActivitySession = sequelize.define('ActivitySession', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  childId: { type: DataTypes.INTEGER, allowNull: false },
  goal_id: { type: DataTypes.STRING, allowNull: false },
  level: { type: DataTypes.INTEGER, allowNull: false },
  template_id: { type: DataTypes.STRING },
  accuracy: { type: DataTypes.FLOAT },
  independence: { type: DataTypes.FLOAT },
  band: { type: DataTypes.STRING },
  completion_status: { type: DataTypes.STRING, defaultValue: 'COMPLETE' },
  engagement_flag: { type: DataTypes.BOOLEAN, defaultValue: false },
  total_hints: { type: DataTypes.INTEGER, defaultValue: 0 },
  item_results: { type: DataTypes.TEXT, defaultValue: '[]' },
  /** The auditable decision — no silent adaptation (R-PATH-011). */
  decision_rule_id: { type: DataTypes.STRING },
  decision_reason_code: { type: DataTypes.STRING },
  decision_payload: { type: DataTypes.TEXT, defaultValue: '{}' },
  rule_pack_version: { type: DataTypes.STRING, defaultValue: 'mvp-1.0.0' },
  is_synthetic: { type: DataTypes.BOOLEAN, defaultValue: false },
});

module.exports = ActivitySession;
