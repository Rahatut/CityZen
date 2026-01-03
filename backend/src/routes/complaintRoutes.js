// backend/src/routes/complaintRoutes.js
const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const multer = require('multer'); // Import multer
const upload = multer({ storage: multer.memoryStorage() }); // Configure multer for memory storage

// Create complaint with images
router.post('/complaints', upload.array('images'), complaintController.createComplaint);

// Get all categories
router.get('/complaints/categories', complaintController.getCategories);
router.get('/complaints/recommend-authorities', complaintController.getRecommendedAuthorities);

// Get all complaints (with filtering and pagination)
router.get('/complaints', complaintController.getAllComplaints);

// Get complaint by ID
router.get('/complaints/:id', complaintController.getComplaintById);

// Get complaints by citizen ID
router.get('/complaints/citizen/:citizenUid', complaintController.getComplaintsByCitizen);

// Update complaint status
router.patch('/complaints/:id/status', complaintController.updateComplaintStatus);

// Delete complaint
router.delete('/complaints/:id', complaintController.deleteComplaint);

module.exports = router;