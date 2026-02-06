const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');


const Authority = sequelize.define('Authority', {
  authorityCompanyId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Allow null for legacy users, but should be set for new signups
    references: {
      model: 'authoritycompanies',
      key: 'id'
    }
  },
  department: {
    type: DataTypes.STRING, 
    allowNull: false
  },
  ward: {
    type: DataTypes.STRING, 
    allowNull: false
  }
});

module.exports = Authority;