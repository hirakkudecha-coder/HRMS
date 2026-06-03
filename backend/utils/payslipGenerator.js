// Import PDFKit to generate PDF documents
const PDFDocument = require('pdfkit');

/**
 * Dynamically generates a beautiful PDF payslip in Indian Rupees and streams it to the client
 * @param {Object} res - Express response object
 * @param {Object} salary - Salary slip Mongoose model object
 * @param {Object} employee - Employee/User Mongoose model object
 */
const generatePayslipPdf = (res, salary, employee) => {
  // Initialize a new A4 PDF document with standard page margins
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  // Pipe the PDF document directly into the Express HTTP response stream
  doc.pipe(res);

  // --- Header Brand Section ---
  doc
    .fillColor('#020617') // Slate dark background color for modern theme
    .rect(0, 0, 595.28, 120) // Draw background banner at the top of A4
    .fill();

  doc
    .fillColor('#ffffff')
    .fontSize(24)
    .font('Helvetica-Bold')
    .text('APEX HR SYSTEMS', 50, 40)
    .fontSize(10)
    .font('Helvetica')
    .text('123 Tech Corridor, Sector V, Salt Lake', 50, 70)
    .text('Phone: +91 33 555 0199 | Support: hr@apex.in', 50, 85);

  doc
    .fillColor('#ffffff')
    .fontSize(16)
    .font('Helvetica-Bold')
    .text('OFFICIAL PAYSLIP', 400, 45, { align: 'right' })
    .fontSize(11)
    .font('Helvetica')
    .text(`Month: ${salary.month}`, 400, 70, { align: 'right' });

  // Reset text color to dark slate for body content
  doc.fillColor('#334155');

  // --- Employee Information Section ---
  doc
    .fontSize(13)
    .font('Helvetica-Bold')
    .text('Employee & Job Information', 50, 145);

  // Horizontal divider line
  doc
    .moveTo(50, 160)
    .lineTo(545, 160)
    .stroke('#e2e8f0');

  // Col 1: Employee details
  doc
    .fontSize(9.5)
    .font('Helvetica-Bold').text('Employee Name:', 50, 175)
    .font('Helvetica').text(employee.name, 150, 175)
    
    .font('Helvetica-Bold').text('Employee ID:', 50, 193)
    .font('Helvetica').text(employee.employeeDetails.employeeId || 'N/A', 150, 193)
    
    .font('Helvetica-Bold').text('Department:', 50, 211)
    .font('Helvetica').text(employee.employeeDetails.department, 150, 211);

  // Col 2: Job & Payment status details
  doc
    .fontSize(9.5)
    .font('Helvetica-Bold').text('Designation:', 300, 175)
    .font('Helvetica').text(employee.employeeDetails.designation, 400, 175)
    
    .font('Helvetica-Bold').text('Email ID:', 300, 193)
    .font('Helvetica').text(employee.email, 400, 193)
    
    .font('Helvetica-Bold').text('Payment Status:', 300, 211)
    .font('Helvetica').fillColor(salary.paymentStatus === 'Paid' ? '#10b981' : '#f59e0b').text(salary.paymentStatus, 400, 211);

  doc.fillColor('#334155'); // Reset text color

  // --- Itemized Pay Heads Breakdown Table ---
  doc
    .fontSize(13)
    .font('Helvetica-Bold')
    .text('Itemized Salary Breakdown (Indian Rupees)', 50, 245);

  // Horizontal divider line
  doc
    .moveTo(50, 260)
    .lineTo(545, 260)
    .stroke('#e2e8f0');

  // Table Headers (Fixed with bounding box widths to prevent right-align overlaps)
  doc
    .fontSize(9.5)
    .font('Helvetica-Bold')
    .text('Pay Heads Description', 60, 272)
    .text('Earnings (INR)', 320, 272, { width: 100, align: 'right' })
    .text('Deductions (INR)', 445, 272, { width: 100, align: 'right' });

  // Header Divider
  doc
    .moveTo(50, 287)
    .lineTo(545, 287)
    .stroke('#cbd5e1');

  // Start rendering table rows dynamically
  let y = 297;
  const rowHeight = 18;

  // Earnings Rows
  const earnings = [
    { label: 'Basic Salary', val: salary.basicSalary },
    { label: 'H.R.A (House Rent Allowance)', val: salary.hra },
    { label: 'Adhoc Allowance', val: salary.adhocAllowance },
    { label: 'Education Allowance', val: salary.educationAllowance },
    { label: 'NPS Adhoc Pay', val: salary.npsAdhocPay },
    { label: 'Lunch Allowance', val: salary.lunchAllowance },
    { label: 'Monthly LTA (Leave Travel Allowance)', val: salary.monthlyLTA },
    { label: 'Shift Allowance', val: salary.shiftAllowance }
  ];

  doc.font('Helvetica');
  earnings.forEach((item) => {
    doc
      .text(item.label, 60, y)
      .text(`Rs. ${item.val.toLocaleString('en-IN')}`, 320, y, { width: 100, align: 'right' })
      .text('--', 445, y, { width: 100, align: 'right' });
    y += rowHeight;
  });

  // Gross Earnings Row
  doc
    .moveTo(50, y + 2)
    .lineTo(545, y + 2)
    .stroke('#e2e8f0');
  y += 8;

  doc
    .font('Helvetica-Bold')
    .text('Gross Earnings', 60, y)
    .text(`Rs. ${salary.grossEarnings.toLocaleString('en-IN')}`, 320, y, { width: 100, align: 'right' })
    .text('--', 445, y, { width: 100, align: 'right' });
  
  y += rowHeight + 10;

  // Deductions Rows
  const deductions = [
    { label: 'P.F. (Provident Fund)', val: salary.pf },
    { label: 'Professional Tax', val: salary.professionalTax }
  ];

  doc.font('Helvetica');
  deductions.forEach((item) => {
    doc
      .text(item.label, 60, y)
      .text('--', 320, y, { width: 100, align: 'right' })
      .text(`Rs. ${item.val.toLocaleString('en-IN')}`, 445, y, { width: 100, align: 'right' });
    y += rowHeight;
  });

  // Gross Deductions Row
  doc
    .moveTo(50, y + 2)
    .lineTo(545, y + 2)
    .stroke('#e2e8f0');
  y += 8;

  doc
    .font('Helvetica-Bold')
    .text('Gross Deductions', 60, y)
    .text('--', 320, y, { width: 100, align: 'right' })
    .text(`Rs. ${salary.grossDeductions.toLocaleString('en-IN')}`, 445, y, { width: 100, align: 'right' });

  y += rowHeight + 12;

  // Calculate CTC = Gross Earnings + Employer PF (12% of Basic Salary)
  const employerPF = Math.round(salary.basicSalary * 0.12);
  const monthlyCTC = salary.grossEarnings + employerPF;
  const annualCTC = monthlyCTC * 12;

  // --- NET SALARY Summary Box ---
  doc
    .fillColor('#f1f5f9')
    .rect(50, y, 495, 40)
    .fill();

  doc
    .fillColor('#020617')
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('NET SALARY (Take-home Pay):', 65, y + 12)
    .fontSize(13)
    .text(`Rs. ${salary.netSalary.toLocaleString('en-IN')}`, 260, y + 11, { align: 'right', width: 270 });

  y += 50;

  // --- Annual CTC Box (same style as NET SALARY box) ---
  doc
    .fillColor('#f1f5f9')
    .rect(50, y, 495, 40)
    .fill();

  doc
    .fillColor('#020617')
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('ANNUAL CTC:', 65, y + 12)
    .fontSize(13)
    .text(`Rs. ${annualCTC.toLocaleString('en-IN')}`, 260, y + 11, { align: 'right', width: 270 });

  y += 50;

  // --- Paid Days info row ---
  doc
    .fillColor('#475569')
    .fontSize(9)
    .font('Helvetica-Bold')
    .text(`Paid Days: ${salary.paidDays} Days  |  Payment Date: ${new Date(salary.paymentDate).toLocaleDateString('en-IN')}  |  Status: ${salary.paymentStatus}`, 50, y + 6);

  // --- Signature & Footer ---
  doc
    .fillColor('#64748b')
    .fontSize(8.5)
    .font('Helvetica')
    .text('This is an electronically generated salary payslip receipt. No physical signature is required.', 50, 745, { align: 'center' });

  doc
    .moveTo(100, 690)
    .lineTo(220, 690)
    .stroke('#cbd5e1')
    .text('HR Representative Sign', 100, 698, { align: 'left' });

  doc
    .moveTo(375, 690)
    .lineTo(495, 690)
    .stroke('#cbd5e1')
    .text('Employee Signature Acknowledgement', 320, 698, { align: 'right' });

  // Finalize PDF rendering and close the stream
  doc.end();
};

// Export payslip drawer
module.exports = { generatePayslipPdf };

