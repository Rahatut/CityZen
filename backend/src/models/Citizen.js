const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Citizen = sequelize.define('Citizen', {
  ward: {
    type: DataTypes.STRING, 
    allowNull: false
  },
  strikes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  isBanned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  bannedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  banReason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

module.exports = Citizen;