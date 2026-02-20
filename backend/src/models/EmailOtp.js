// backend/src/models/EmailOtp.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EmailOtp = sequelize.define('EmailOtp', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: false,
  },
  otp: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  expires: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: 'email_otps',
  timestamps: false,
});

module.exports = EmailOtp;
