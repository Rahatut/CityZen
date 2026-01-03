// backend/src/config/database.js

// 1. Import necessary libraries using CommonJS
const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

// NOTE: Ensure you have 'sequelize' and 'pg' installed:
// npm install sequelize pg 

// 2. Initialize the Sequelize ORM instance using the DATABASE_URL
const sequelize = new Sequelize(
  process.env.DATABASE_URL, 
  {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false, // Set to true to see SQL queries if needed
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