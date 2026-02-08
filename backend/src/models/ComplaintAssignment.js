const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Complaint = require('./Complaint');
const AuthorityCompany = require('./AuthorityCompany');

const ComplaintAssignment = sequelize.define('ComplaintAssignment', {
  complaintId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: Complaint,
      key: 'id'
    }
  },
  authorityCompanyId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: AuthorityCompany,
      key: 'id'
    }
  }
});

module.exports = ComplaintAssignment;
