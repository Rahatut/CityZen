const express = require('express');
const router = express.Router();
const moderationController = require('../controllers/moderationController');

// Admin routes for user moderation
// Add strike to a user (admin only)
router.post('/strike', moderationController.addStrike);

// Ban a user permanently (admin only)
router.post('/ban', moderationController.banUser);

// Unban a user (admin only)
router.post('/unban', moderationController.unbanUser);

// Get user moderation info (strikes, ban status)
router.get('/user/:citizenUid', moderationController.getUserModerationInfo);

// Get all banned users
router.get('/banned-users', moderationController.getBannedUsers);

// Get current user's own moderation info (citizen accessible)
router.get('/my-strikes/:citizenUid', moderationController.getMyModerationInfo);

module.exports = router;
