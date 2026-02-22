// backend/src/controllers/authController.js
const { User, Citizen, Authority, Admin, sequelize } = require('../models');

// Read the secret key from the backend/.env file
const ADMIN_CODE_SECRET = process.env.ADMIN_CODE_SECRET;

// 1. SIGNUP Logic (Existing)
exports.registerProfile = async (req, res) => {
  // Use a transaction to prevent partial data creation
  const t = await sequelize.transaction();
  try {
    const { firebaseUid, email, fullName, role, ward, department, authorityCompanyId, adminCode } = req.body;

    if (!firebaseUid || !email || !fullName || !role) {
      await t.rollback();
      return res.status(400).json({ message: 'Missing core identity fields.' });
    }

    // 1. Create the base User
    const user = await User.create({ firebaseUid, email, fullName, role }, { transaction: t });

    // 2. Create role-specific profile based on the role submitted from the form
    if (role === 'citizen') {
      // ward is optional/removed
      await Citizen.create({ UserFirebaseUid: firebaseUid }, { transaction: t });
    } else if (role === 'authority') {
      if (!authorityCompanyId) throw new Error('Authority signup requires Department selection.');
      // Optionally, department name can be stored for display, but authorityCompanyId is the main mapping
      await Authority.create({ UserFirebaseUid: firebaseUid, authorityCompanyId, department }, { transaction: t });
    } else if (role === 'admin') {
      // Allow admin signup with any provided code
      await Admin.create({ UserFirebaseUid: firebaseUid }, { transaction: t });
    }

    // Commit the transaction
    await t.commit();
    res.status(201).json({ message: 'Profile created successfully', user });
  } catch (error) {
    // Rollback if any step failed (e.g., missing data, invalid Admin code, DB error)
    await t.rollback();

    console.error('Registration Error:', error.message);

    // Send a 400 status with a specific error message back to the frontend
    res.status(400).json({ message: `Profile creation failed: ${error.message}` });
  }
};

// 2. LOGIN Logic (NEW)
exports.getProfileByUid = async (req, res) => {
  try {
    const { firebaseUid } = req.params;

    // Find the user in the PostgreSQL database using the UID obtained from Firebase login

    const user = await User.findOne({
      where: { firebaseUid },
      attributes: ['firebaseUid', 'email', 'fullName', 'role', 'createdAt'],
      include: [
        { model: Citizen, required: false },
        {
          model: Authority,
          required: false,
          include: [
            {
              model: sequelize.models.AuthorityCompany,
              attributes: ['id', 'name', 'description'],
              required: false
            }
          ]
        },
        { model: Admin, required: false }
      ]
    });

    if (!user) {
      return res.status(404).json({ message: 'User profile not found in database.' });
    }

    // Return the user object (containing the role, fullName, etc.)
    res.json(user);
  } catch (error) {
    console.error('Fetch Profile Error:', error.message);
    // Returning a 500 error is fine, but make sure the error message is clear for debugging
    res.status(500).json({ message: 'Server error while fetching profile. Check database connection or column names.' });
  }
};
