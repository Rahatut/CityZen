const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ComplaintImages = sequelize.define('ComplaintImages', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  complaintId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  imageURL: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  processedImageURL: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  type: {
    type: DataTypes.ENUM('initial', 'progress', 'resolution', 'appeal'),
    defaultValue: 'initial',
    allowNull: false
  }
});

module.exports = ComplaintImages;