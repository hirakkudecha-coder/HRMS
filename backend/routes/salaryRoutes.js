// Import Express router
const express = require('express');
const router = express.Router();

// Import Salary controller methods
const {
  getSalarySlips,
  downloadPayslip,
  processMonthlyPayroll,
  getAllSalaries
} = require('../controllers/salaryController');

// Import Auth protection and Role authorization middlewares
const { protect, authorize, requireActiveShift } = require('../middleware/authMiddleware');

// All salary routes require authentication (exempt from shift blocker to allow viewing/downloading payslips)
router.use(protect);

router.get('/', getSalarySlips);             // Get personal payslips history list
router.get('/:id/download', downloadPayslip); // Download PDF file

// Finance & Admin specific payroll routes
router.get('/all', authorize('admin', 'finance'), getAllSalaries); // Get all salary slips globally
router.post('/process', authorize('admin', 'finance'), processMonthlyPayroll); // Batch run payroll

// Export router
module.exports = router;
