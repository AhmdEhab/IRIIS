const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
/**
 * DB_PATH lets a deployment put the SQLite file on a persistent disk
 * (Render/Railway mount /data; the default sandbox path stays unchanged).
 * The directory is created eagerly because sqlite opens lazily and a missing
 * folder otherwise surfaces as a confusing 500 on the first register.
 */
const storage = process.env.DB_PATH || path.join(__dirname, '..', 'database.sqlite');
fs.mkdirSync(path.dirname(storage), { recursive: true });
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage, // Database file location
    logging: false // Disable logging SQL queries to console
});
module.exports = sequelize;
