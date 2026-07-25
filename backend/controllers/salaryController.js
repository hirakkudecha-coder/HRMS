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
    const employee = await User.findById(salary.employee);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Associated employee not found' });
    }

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
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: 'Server error generating payslip PDF' });
    }
  }
};

// @desc    Process and generate monthly salary slips for all employees
// @route   POST /api/salary/process
// @access  Private (Admin/Finance only)
exports.processMonthlyPayroll = async (req, res) => {
  try {
    const { month } = req.body;
    if (!month) {
      return res.status(400).json({ success: false, message: 'Please specify the salary month' });
    }

    const User = require('../models/User');
    const employeesList = await User.find({ role: { $ne: 'admin' } });

    const roleSalaryDefaults = {
      'manager': { gross: 150000, basic: 75000, hra: 37500, education: 2000, nps: 7500, lunch: 3000, lta: 5000, shift: 5000, special: 15000 },
      'employee': { gross: 100000, basic: 50000, hra: 25000, education: 2000, nps: 5000, lunch: 2000, lta: 3000, shift: 3000, special: 10000 },
      'finance': { gross: 60000, basic: 30000, hra: 15000, education: 1000, nps: 3000, lunch: 1500, lta: 2000, shift: 1500, special: 6000 },
      'hr': { gross: 50000, basic: 25000, hra: 12500, education: 1000, nps: 2500, lunch: 1500, lta: 2000, shift: 1500, special: 4000 }
    };

    let processedCount = 0;
    const errors = [];

    for (const emp of employeesList) {
      try {
        let config = roleSalaryDefaults[emp.role] || roleSalaryDefaults['employee'];
        
        if (emp.email === 'amit@apex.com') {
          config = { gross: 80000, basic: 40000, hra: 20000, education: 1000, nps: 4000, lunch: 2000, lta: 2500, shift: 2000, special: 8500 };
        }

        const pfVal = Math.round(config.basic * 0.12);
        const ptVal = 200;
        const grossDeductionsVal = pfVal + ptVal;
        const netSalaryVal = config.gross - grossDeductionsVal;

        await Salary.findOneAndUpdate(
          { employee: emp._id, month },
          {
            employee: emp._id,
            month,
            basicSalary: config.basic,
            hra: config.hra,
            educationAllowance: config.education,
            npsAdhocPay: config.nps,
            lunchAllowance: config.lunch,
            monthlyLTA: config.lta,
            shiftAllowance: config.shift,
            adhocAllowance: config.special,
            grossEarnings: config.gross,
            pf: pfVal,
            professionalTax: ptVal,
            grossDeductions: grossDeductionsVal,
            netSalary: netSalaryVal,
            paidDays: 30,
            paymentStatus: 'Paid',
            paymentDate: new Date()
          },
          { upsert: true, new: true }
        );

        processedCount++;
      } catch (err) {
        errors.push({ email: emp.email, message: err.message });
      }
    }

    const { logAudit } = require('../utils/logger');
    await logAudit(req.user.id, 'PAYROLL_PROCESSED', `Processed payroll for month ${month} (${processedCount} slips created/updated)`, req);

    res.status(200).json({
      success: true,
      message: `Successfully processed payroll for ${processedCount} employees`,
      processedCount,
      errors
    });
  } catch (error) {
    console.error('Process Payroll Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error processing payroll' });
  }
};

// @desc    Get all salary records globally (HR/Admin/Finance view)
// @route   GET /api/salary/all
// @access  Private (Admin/Finance only)
exports.getAllSalaries = async (req, res) => {
  try {
    const salaries = await Salary.find({})
      .populate('employee', 'name email role employeeDetails')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, salaries });
  } catch (error) {
    console.error('Get All Salaries Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching salary slips ledger' });
  }
};
