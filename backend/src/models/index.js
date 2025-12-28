const sequelize = require('../config/database');
const User = require('./User');
const Citizen = require('./Citizen');
const Authority = require('./Authority');
const Admin = require('./Admin');
const Complaint = require('./Complaint');
const Category = require('./Category');
const AuthorityCompany = require('./AuthorityCompany');
const ComplaintImages = require('./ComplaintImages');
const ComplaintAssignment = require('./ComplaintAssignment');
const AuthorityCompanyCategory = require('./AuthorityCompanyCategory');

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

// A Complaint has many ComplaintImages
Complaint.hasMany(ComplaintImages, {
  foreignKey: 'complaintId',
  as: 'images' // Alias for when fetching associated images
});

// A ComplaintImage belongs to one Complaint
ComplaintImages.belongsTo(Complaint, {
  foreignKey: 'complaintId'
});

// Many-to-many relationship between AuthorityCompany and Category
AuthorityCompany.belongsToMany(Category, { 
  through: AuthorityCompanyCategory,
  foreignKey: 'authorityCompanyId',
  otherKey: 'categoryId'
});
Category.belongsToMany(AuthorityCompany, {
  through: AuthorityCompanyCategory,
  foreignKey: 'categoryId',
  otherKey: 'authorityCompanyId'
});

// Many-to-many relationship between Complaint and AuthorityCompany
Complaint.belongsToMany(AuthorityCompany, {
  through: ComplaintAssignment,
  foreignKey: 'complaintId',
  otherKey: 'authorityCompanyId'
});
AuthorityCompany.belongsToMany(Complaint, {
  through: ComplaintAssignment,
  foreignKey: 'authorityCompanyId',
  otherKey: 'complaintId'
});


module.exports = {
  sequelize,
  User,
  Citizen,
  Authority,
  Admin,
  Complaint,
  ComplaintImages,
  AuthorityCompany,
  Category,
  AuthorityCompanyCategory,
  ComplaintAssignment
};