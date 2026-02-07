const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const AuthorityCompany = require('./AuthorityCompany');


const Authority = sequelize.define('Authority', {
  authorityCompanyId: {
    type: DataTypes.INTEGER,
    allowNull: false, 
    references: {
      model: AuthorityCompany,
      key: 'id'
    }
  },
  department: {
    type: DataTypes.STRING, 
    allowNull: false
  }
});

module.exports = Authority;