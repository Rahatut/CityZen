const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ComplaintAssignment = sequelize.define('ComplaintAssignment', {
  complaintId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'Complaints', // table name
      key: 'id'
    }
  },
  authorityCompanyId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'AuthorityCompanies', // table name
      key: 'id'
    }
  }
});

module.exports = ComplaintAssignment;
