// Import Express router
const express = require('express');
const router = express.Router();

// Import Salary controller methods
const {
  getSalarySlips,
  downloadPayslip
} = require('../controllers/salaryController');

// Import Auth protection middleware
const { protect } = require('../middleware/authMiddleware');

// All salary routes require authentication
router.get('/', protect, getSalarySlips);             // Get payslips history list
router.get('/:id/download', protect, downloadPayslip); // Download PDF file

// Export router
module.exports = router;
