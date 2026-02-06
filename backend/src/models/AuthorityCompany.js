const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuthorityCompany = sequelize.define('AuthorityCompany', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  tableName: 'authoritycompanies',
  timestamps: false
});

module.exports = AuthorityCompany;