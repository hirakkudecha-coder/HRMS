// Import Express router
const express = require('express');
const router = express.Router();

// Import Salary controller methods
const {
  getSalarySlips,
  downloadPayslip
} = require('../controllers/salaryController');

// Import Auth protection middleware
const { protect, requireActiveShift } = require('../middleware/authMiddleware');

// All salary routes require authentication (exempt from shift blocker to allow viewing/downloading payslips)
router.use(protect);

router.get('/', getSalarySlips);             // Get payslips history list
router.get('/:id/download', downloadPayslip); // Download PDF file

// Export router
module.exports = router;
