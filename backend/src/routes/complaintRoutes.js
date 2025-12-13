// backend/src/routes/complaintRoutes.js
const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');

// POST /api/complaints
router.post('/complaints', complaintController.createComplaint);
router.get('/complaints/categories', complaintController.getCategories);

module.exports = router;