// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

console.log('authRoutes loaded');

// 1. SIGNUP: POST /api/auth/users
router.post('/users', authController.registerProfile);

// EMAIL OTP: POST /api/auth/send-email-otp
router.post('/send-email-otp', authController.sendEmailOtp);

// 2. LOGIN: GET /api/auth/users/:firebaseUid (NEW ROUTE)
// Fetches the user's profile and role using the UID from successful Firebase login.
router.get('/users/:firebaseUid', authController.getProfileByUid); 

module.exports = router;