const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const AuthorityCompany = require('./AuthorityCompany');
const Category = require('./Category');

const AuthorityCompanyCategory = sequelize.define('AuthorityCompanyCategory', {
  authorityCompanyId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: AuthorityCompany,
      key: 'id'
    }
  },
  categoryId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: Category,
      key: 'id'
    }
  }
});

module.exports = AuthorityCompanyCategory;