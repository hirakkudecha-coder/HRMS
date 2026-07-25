// Import Express router
const express = require('express');
const router = express.Router();

// Import Leave controller methods
const {
  applyLeave,
  getLeaves,
  cancelLeave,
  getDepartmentLeaves,
  updateLeaveStatus
} = require('../controllers/leaveController');

// Import Auth protection and Role authorization middlewares
const { protect, authorize } = require('../middleware/authMiddleware');

// All leave routes require authentication
router.post('/', protect, applyLeave); // Apply for leave
router.get('/', protect, getLeaves);   // Get leaves history & balances

// Department Manager / Admin leave routes
router.get('/department', protect, getDepartmentLeaves);
router.put('/:id/status', protect, authorize('manager', 'admin'), updateLeaveStatus);

router.put('/:id/cancel', protect, cancelLeave); // Cancel a leave request

// Export router
module.exports = router;
