const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  firebaseUid: {
    type: DataTypes.STRING, 
    primaryKey: true, 
    allowNull: false, 
    unique: true
  },
  email: {
    type: DataTypes.STRING, 
    allowNull: false, 
    unique: true
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  fullName: {
    type: DataTypes.STRING, 
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('citizen', 'authority', 'admin'), 
    allowNull: false
  }
});

module.exports = User;