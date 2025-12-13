const sequelize = require('../config/database');
const User = require('./User');
const Citizen = require('./Citizen');
const Authority = require('./Authority');
const Admin = require('./Admin');
const Complaint = require('./Complaint');
const Category = require('./Category');

// --- Define Associations (One-to-One) ---

// A User HAS ONE role-specific profile
User.hasOne(Citizen, {
  foreignKey: {
    name: 'UserFirebaseUid',
    allowNull: false
  },
  onDelete: 'CASCADE' 
});
Citizen.belongsTo(User);

User.hasOne(Authority, {
  foreignKey: {
    name: 'UserFirebaseUid',
    allowNull: false
  },
  onDelete: 'CASCADE'
});
Authority.belongsTo(User);

User.hasOne(Admin, {
  foreignKey: {
    name: 'UserFirebaseUid',
    allowNull: false
  },
  onDelete: 'CASCADE'
});
Admin.belongsTo(User);

// A Category has many Complaints
Category.hasMany(Complaint, {
  foreignKey: 'categoryId'
});

// A Complaint belongs to one Category
Complaint.belongsTo(Category, {
  foreignKey: 'categoryId'
});


module.exports = {
  sequelize,
  User,
  Citizen,
  Authority,
  Admin,
  Complaint,
  Category
};