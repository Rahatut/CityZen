// Email OTP 2FA
const { sendEmailOTP, verifyEmailOTP } = require('../utils/emailOtp');

// Send OTP to email for 2FA
exports.sendEmailOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required.' });
  try {
    await sendEmailOTP(email);
    res.json({ message: 'OTP sent to email.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to send OTP.' });
  }
};
// backend/src/controllers/authController.js
const { User, Citizen, Authority, Admin, sequelize } = require('../models');

// Read the secret key from the backend/.env file
const ADMIN_CODE_SECRET = process.env.ADMIN_CODE_SECRET;

// 1. SIGNUP Logic (Existing)
const { verifyFirebasePhoneToken } = require('../utils/firebaseVerify');
exports.registerProfile = async (req, res) => {
  // Use a transaction to prevent partial data creation
  const t = await sequelize.transaction();
  try {
    console.log('RegisterProfile payload:', req.body);
    const { firebaseUid, email, phoneNumber, fullName, role, ward, department, authorityCompanyId, adminCode, firebaseIdToken, twoFAMethod, otp } = req.body;

    if (!firebaseUid || !email || !fullName || !role) {
      return res.status(400).json({ message: 'Missing core identity fields.' });
    }

    if (twoFAMethod === 'phone') {
      if (!phoneNumber || !firebaseIdToken) {
        return res.status(400).json({ message: 'Phone number and Firebase ID token required for phone 2FA.' });
      }
      // Verify Firebase ID token and phone number
      let verified;
      try {
        verified = await verifyFirebasePhoneToken(firebaseIdToken);
      } catch (err) {
        return res.status(400).json({ message: 'Phone number not verified with Firebase.' });
      }
      if (verified.phone_number !== phoneNumber) {
        return res.status(400).json({ message: 'Phone number does not match verified Firebase phone.' });
      }
    } else if (twoFAMethod === 'email') {
      if (!otp) {
        return res.status(400).json({ message: 'OTP required for email 2FA.' });
      }
      if (!verifyEmailOTP(email, otp)) {
        return res.status(400).json({ message: 'Invalid or expired email OTP.' });
      }
    } else {
      return res.status(400).json({ message: 'Invalid 2FA method.' });
    }

    // 1. Create the base User
    const user = await User.create({ firebaseUid, email, phoneNumber, fullName, role }, { transaction: t });

    // 2. Create role-specific profile based on the role submitted from the form
    if (role === 'citizen') {
      await Citizen.create({ UserFirebaseUid: firebaseUid }, { transaction: t });
    } else if (role === 'authority') {
      if (!authorityCompanyId) throw new Error('Authority signup requires Department selection.');
      await Authority.create({ UserFirebaseUid: firebaseUid, authorityCompanyId, department }, { transaction: t });
    } else if (role === 'admin') {
      await Admin.create({ UserFirebaseUid: firebaseUid }, { transaction: t });
    }

    // Commit the transaction
    await t.commit();
    res.status(201).json({ message: 'Profile created successfully', user });
  } catch (error) {
    await t.rollback();
    console.error('Registration Error:', error);
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