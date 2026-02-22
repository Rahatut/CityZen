// backend/src/config/database.js

// 1. Import necessary libraries using CommonJS
const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// NOTE: Ensure you have 'sequelize' and 'pg' installed:
// npm install sequelize pg 

// 2. Initialize the Sequelize ORM instance using the DATABASE_URL
const sequelize = new Sequelize(
  process.env.DATABASE_URL, 
  {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false, // Set to true to see SQL queries if needed
    pool: {
      // Defaults are explicit to avoid the very small Sequelize implicit defaults under load.
      max: toInt(process.env.DB_POOL_MAX, 10),
      min: toInt(process.env.DB_POOL_MIN, 0),
      acquire: toInt(process.env.DB_POOL_ACQUIRE_MS, 60000),
      idle: toInt(process.env.DB_POOL_IDLE_MS, 10000),
      evict: toInt(process.env.DB_POOL_EVICT_MS, 1000),
    },
    // Required for secure connections to services like Supabase
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Prevents errors with self-signed certificates
      },
    },
  }
);

// 3. EXPORT THE SEQUELIZE INSTANCE
module.exports = sequelize;
