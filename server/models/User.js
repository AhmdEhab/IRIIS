const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    age: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    /**
     * SECURITY: stores a bcrypt HASH, never a plaintext password.
     * The length validator was removed because a hash is always 60 chars;
     * password length is validated before hashing, inside the route.
     */
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    /** Consent gate — doc 20 requires it on every mutating endpoint. */
    consent_mvp_use: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    consent_at: {
        type: DataTypes.STRING,
        allowNull: true
    },
    gender: {
        type: DataTypes.STRING,
        allowNull: true
    },
    dateOfBirth: {
        type: DataTypes.STRING,
        allowNull: true
    },
    country: {
        type: DataTypes.STRING,
        allowNull: true
    },
    city: {
        type: DataTypes.STRING,
        allowNull: true
    },
    // Additional fields for child profile
    motherName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    motherJob: {
        type: DataTypes.STRING,
        allowNull: true
    },
    fatherName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    fatherJob: {
        type: DataTypes.STRING,
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    condition: {
        type: DataTypes.STRING,
        allowNull: true
    },
    moduleProgress: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: '{}'
    },
    earnedBadges: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: '["explorer", "beginner"]'
    },
    assessmentResult: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: 'null'
    },
    activities: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: '[]'
    },
    dailyTimeSpent: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: '{}'
    }
});

module.exports = User;
