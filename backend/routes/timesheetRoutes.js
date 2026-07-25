const express = require('express');
const router = express.Router();

// Import controllers
const {
  getTimesheetsHistory,
  getDailyTimesheet,
  saveTimesheetDraft,
  submitTimesheet,
  getDepartmentTimesheets,
  updateTimesheetStatus
} = require('../controllers/timesheetController');

// Import authentication protection middleware
const { protect, authorize, requireActiveShift } = require('../middleware/authMiddleware');

// All timesheet routes require authentication and an active shift check-in
router.use(protect);
router.use(requireActiveShift);

// Employee routes
router.get('/', getTimesheetsHistory);              // Get personal history
router.get('/date/:dateStr', getDailyTimesheet);     // Get timesheet for a specific calendar date
router.post('/', saveTimesheetDraft);               // Save timesheet draft
router.put('/:id/submit', submitTimesheet);         // Submit daily timesheet

// Manager & Admin routes
router.get('/department', getDepartmentTimesheets);  // Get department timesheets
router.put('/:id/status', authorize('manager', 'admin'), updateTimesheetStatus); // Approve/Reject timesheet

module.exports = router;
