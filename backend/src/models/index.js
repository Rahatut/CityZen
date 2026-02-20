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
const AuthorityCompanyAreas = require('./AuthorityCompanyAreas');
const Upvote = require('./Upvote');
const ComplaintReport = require('./ComplaintReport');
const EmailOtp = require('./EmailOtp');

// --- Define Associations (One-to-One) ---

// A User HAS ONE role-specific profile
User.hasOne(Citizen, {
  foreignKey: {
    name: 'UserFirebaseUid',
    allowNull: false,
    unique: true
  },
  onDelete: 'CASCADE'
});
Citizen.belongsTo(User);


User.hasOne(Authority, {
  foreignKey: {
    name: 'UserFirebaseUid',
    allowNull: false,
    unique: true
  },
  onDelete: 'CASCADE'
});
Authority.belongsTo(User);

// Authority belongs to AuthorityCompany (department mapping)
Authority.belongsTo(AuthorityCompany, { foreignKey: 'authorityCompanyId' });
AuthorityCompany.hasMany(Authority, { foreignKey: 'authorityCompanyId' });

User.hasOne(Admin, {
  foreignKey: {
    name: 'UserFirebaseUid',
    allowNull: false,
    unique: true
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

// AuthorityCompanyAreas Associations
AuthorityCompany.hasMany(AuthorityCompanyAreas, { foreignKey: 'authorityCompanyId' });
AuthorityCompanyAreas.belongsTo(AuthorityCompany, { foreignKey: 'authorityCompanyId' });

// ComplaintAssignment to AuthorityCompany (for eager loading)
ComplaintAssignment.belongsTo(AuthorityCompany, { foreignKey: 'authorityCompanyId' });

// Upvote Associations
Complaint.hasMany(Upvote, { foreignKey: 'complaintId' });
Upvote.belongsTo(Complaint, { foreignKey: 'complaintId' });
Citizen.hasMany(Upvote, { foreignKey: 'citizenUid', sourceKey: 'UserFirebaseUid' });
Upvote.belongsTo(Citizen, { foreignKey: 'citizenUid', targetKey: 'UserFirebaseUid' });

// Complaint Report Associations
Complaint.hasMany(ComplaintReport, { foreignKey: 'complaintId', as: 'reports' });
ComplaintReport.belongsTo(Complaint, { foreignKey: 'complaintId' });

module.exports = {
  sequelize,
  User,
  Citizen,
  Authority,
  Admin,
  Complaint,
  Category,
  AuthorityCompany,
  ComplaintImages,
  ComplaintAssignment,
  AuthorityCompanyCategory,
  AuthorityCompanyAreas,
  Upvote,
  ComplaintReport,
  EmailOtp
};