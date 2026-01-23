const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Upvote = sequelize.define('Upvote', {
    citizenUid: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true,
    },
    complaintId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
    }
}, {
    tableName: 'Upvotes',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['citizenUid', 'complaintId'],
        },
    ],
});

module.exports = Upvote;
