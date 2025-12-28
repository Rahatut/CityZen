// backend/src/routes/complaintRoutes.js
const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const multer = require('multer'); // Import multer
const upload = multer({ storage: multer.memoryStorage() }); // Configure multer for memory storage

// POST /api/complaints - with image upload
router.post('/complaints', upload.array('images'), complaintController.createComplaint);
router.get('/complaints/categories', complaintController.getCategories);
router.get('/complaints/recommend-authorities', complaintController.getRecommendedAuthorities);

module.exports = router;