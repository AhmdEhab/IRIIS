/**
 * Child — separated from the parent account (doc 19 §1).
 *
 * `condition` is stored for ACCOMMODATION DEFAULTS ONLY (doc 11 §1).
 * No server route reads it for scoring, level, goal, or pathway.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Child = sequelize.define('Child', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  parentId: { type: DataTypes.INTEGER, allowNull: false },
  displayName: { type: DataTypes.STRING, allowNull: false },
  ageYears: { type: DataTypes.INTEGER, allowNull: true },
  /** Accommodation defaults only — never an input to any decision. */
  condition: { type: DataTypes.STRING, allowNull: true },
  accommodations: { type: DataTypes.TEXT, defaultValue: '[]' },
  is_synthetic: { type: DataTypes.BOOLEAN, defaultValue: false },
});

module.exports = Child;
