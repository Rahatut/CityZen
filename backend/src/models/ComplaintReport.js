const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ComplaintReport = sequelize.define('ComplaintReport', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    complaintId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reportedBy: {
      type: DataTypes.STRING,
      allowNull: false, // Firebase UID or User ID
    },
    reason: {
      type: DataTypes.ENUM(
        'harassment_threats',
        'hate_speech_discrimination',
        'nudity_sexual_content',
        'spam_scams',
        'fake_information_misinformation',
        'self_harm_suicide',
        'violence_graphic_content',
        'intellectual_property',
        'impersonation_fake_accounts',
        'child_safety',
        'other_violations'
      ),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'reviewed', 'resolved', 'dismissed'),
      defaultValue: 'pending',
    },
  }, {
    timestamps: true,
    tableName: 'ComplaintReports',
    indexes: [
      {
        unique: true,
        fields: ['complaintId', 'reportedBy']
      }
    ]
  });

module.exports = ComplaintReport;
