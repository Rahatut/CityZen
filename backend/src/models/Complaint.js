const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Complaint = sequelize.define('Complaint', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  citizenUid: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  categoryId: {
    type: DataTypes.INTEGER, 
    allowNull: false, 
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  latitude: {
    type: DataTypes.DECIMAL(8,6),
    allowNull: false,
  },
  longitude: {
    type: DataTypes.DECIMAL(9,6),
    allowNull: false,
  },
  currentStatus: {
    type: DataTypes.ENUM('pending','accepted','resolved','appealed','completed'),
    allowNull: false
  }
});

module.exports = Complaint;