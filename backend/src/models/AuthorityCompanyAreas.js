const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const AuthorityCompany = require('./AuthorityCompany');

const AuthorityCompanyAreas = sequelize.define('AuthorityCompanyAreas', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  authorityCompanyId: {
    type: DataTypes.INTEGER,
    references: {
      model: AuthorityCompany,
      key: 'id'
    },
    allowNull: false 
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  latitude: {
    type: DataTypes.DECIMAL(8, 6),
    allowNull: false,
  },
  longitude: {
    type: DataTypes.DECIMAL(9, 6),
    allowNull: false,
  },
  radius: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
  }
}, {
  timestamps: false
});

module.exports = AuthorityCompanyAreas;