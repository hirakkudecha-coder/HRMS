// Import Express router
const express = require('express');
const router = express.Router();

// Import Notice controller methods
const { getNotices, createNotice, deleteNotice } = require('../controllers/noticeController');

// Import Auth protection and Role authorization middlewares
const { protect, authorize } = require('../middleware/authMiddleware');

// All notice routes require authentication
router.get('/', protect, getNotices);                            // Get notices list (all roles)
router.post('/', protect, authorize('admin', 'hr'), createNotice);    // Create notice (admin and hr)
router.delete('/:id', protect, authorize('admin', 'hr'), deleteNotice); // Delete notice (admin and hr)

// Export router
module.exports = router;

