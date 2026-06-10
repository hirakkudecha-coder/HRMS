// Import Mongoose models and the PDF Generator helper
const Salary = require('../models/Salary');
const User = require('../models/User');
const { generatePayslipPdf } = require('../utils/payslipGenerator');

// @desc    Get all salary slips for the employee
// @route   GET /api/salary
// @access  Private
exports.getSalarySlips = async (req, res) => {
  try {
    // Fetch all salary documents of the employee, sorted by paymentDate descending
    const slips = await Salary.find({ employee: req.user.id }).sort({ paymentDate: -1 });

    res.status(200).json({
      success: true,
      count: slips.length,
      slips
    });
  } catch (error) {
    console.error('Fetch Salary Slips Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching salary slips' });
  }
};

// @desc    Download a specific salary payslip as a PDF
// @route   GET /api/salary/:id/download
// @access  Private
exports.downloadPayslip = async (req, res) => {
  try {
    const salaryId = req.params.id;

    // Find the salary slip in database
    const salary = await Salary.findById(salaryId);
    if (!salary) {
      return res.status(404).json({ success: false, message: 'Payslip record not found' });
    }

    // Verify ownership: the salary record must belong to the requesting employee, or the requester must be admin/finance
    if (salary.employee.toString() !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'finance') {
      return res.status(403).json({ success: false, message: 'Not authorized to download this payslip' });
    }

    // Retrieve full employee details to print on the PDF
    const employee = await User.findById(req.user.id);

    // Format a file name (e.g. payslip-May_2026.pdf)
    const sanitizedMonth = salary.month.replace(' ', '_');
    const fileName = `payslip-${sanitizedMonth}.pdf`;

    // Configure response headers so the browser triggers a file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

    // Call PDF generator to draw and stream the PDF directly into the response
    generatePayslipPdf(res, salary, employee);
  } catch (error) {
    console.error('Download Payslip Error:', error.message);
    // If headers haven't been sent yet, we can send a JSON error
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Server error generating payslip PDF' });
    }
  }
};
