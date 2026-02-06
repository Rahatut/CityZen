// backend/src/routes/complaintRoutes.js
const express = require('express');
const router = express.Router();
const complaintController = require('../controllers/complaintController');
const multer = require('multer'); // Import multer
const upload = multer({ storage: multer.memoryStorage() }); // Configure multer for memory storage

// Create complaint with images
router.post('/complaints', upload.array('images'), complaintController.createComplaint);
router.post('/complaints/check-duplicate', complaintController.checkDuplicateComplaints);

// Get all categories
router.get('/complaints/categories', complaintController.getCategories);
router.post('/complaints/categories', complaintController.createCategory);
router.delete('/complaints/categories/:id', complaintController.deleteCategory);
router.get('/complaints/recommend-authorities', complaintController.getRecommendedAuthorities);

// Departments (Authority companies)
router.get('/departments', complaintController.getDepartments);
router.post('/departments', complaintController.createDepartment);
router.delete('/departments/:id', complaintController.deleteDepartment);

// Admin KPIs
router.get('/admin/kpis', complaintController.getAdminKpis);
router.get('/admin/kpis/details', complaintController.getAdminKpiDetails);
router.get('/admin/moderation', complaintController.getModerationOverview);

// Get all complaints (with filtering and pagination)
router.get('/complaints', complaintController.getAllComplaints);

// Get complaints by citizen ID (placed before generic :id route to avoid conflicts)
router.get('/complaints/citizen/:citizenUid', complaintController.getComplaintsByCitizen);

// Get complaints assigned to authority company
router.get('/complaints/authority/:authorityCompanyId', complaintController.getComplaintsByAuthority);

// Get reported complaints (Admin) - must be before :id route
router.get('/complaints/reports', complaintController.getReportedComplaints);

// Update report status (Admin)
router.patch('/complaints/reports/:id', complaintController.updateReportStatus);

// Get appeals (Admin)
router.get('/complaints/appeals', complaintController.getAppeals);

// Update appeal status (Admin)
router.patch('/complaints/appeals/:id', complaintController.updateAppealStatus);

// Get complaint by ID
router.get('/complaints/:id', complaintController.getComplaintById);

// Update complaint status (with optional proof images)
router.patch('/complaints/:id/status', upload.array('images'), complaintController.updateComplaintStatus);

// Rate complaint
router.post('/complaints/:id/rate', complaintController.rateComplaint);

// Appeal complaint (with optional proof images)
router.post('/complaints/:id/appeal', upload.array('images'), complaintController.appealComplaint);

// Upvote complaint
router.post('/complaints/:id/upvote', complaintController.upvoteComplaint);

// Report complaint
router.post('/complaints/:id/report', complaintController.reportComplaint);

// Delete complaint
router.delete('/complaints/:id', complaintController.deleteComplaint);

module.exports = router;