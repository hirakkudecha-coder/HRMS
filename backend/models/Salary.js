// Import mongoose to build schema
const mongoose = require('mongoose');

// Define the Salary Schema
const SalarySchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Links to the User model
    required: true
  },
  month: {
    type: String, // Format: "Month YYYY" (e.g., "May 2026")
    required: [true, 'Please specify the salary month']
  },
  // --- EARNINGS ---
  basicSalary: {
    type: Number,
    required: [true, 'Please add a basic salary'],
    default: 0
  },
  hra: {
    type: Number,
    default: 0 // House Rent Allowance
  },
  adhocAllowance: {
    type: Number,
    default: 0 // Special/Adhoc allowance
  },
  educationAllowance: {
    type: Number,
    default: 0 // Education allowance
  },
  npsAdhocPay: {
    type: Number,
    default: 0 // NPS contribution or adhoc pay
  },
  lunchAllowance: {
    type: Number,
    default: 0 // Lunch allowance
  },
  monthlyLTA: {
    type: Number,
    default: 0 // Leave Travel Allowance
  },
  shiftAllowance: {
    type: Number,
    default: 0 // Shift premium pay
  },
  grossEarnings: {
    type: Number,
    required: true,
    default: 0 // Sum of all earnings
  },
  // --- DEDUCTIONS ---
  pf: {
    type: Number,
    default: 0 // Provident Fund
  },
  professionalTax: {
    type: Number,
    default: 0 // Professional Tax (PT)
  },
  grossDeductions: {
    type: Number,
    required: true,
    default: 0 // Sum of all deductions
  },
  // --- FINAL aggregates ---
  netSalary: {
    type: Number,
    required: true,
    default: 0 // grossEarnings - grossDeductions
  },
  paidDays: {
    type: Number,
    required: [true, 'Please specify paid days for the month'],
    default: 30 // Actual worked/paid days in the month
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Pending'],
    default: 'Paid'
  },
  paymentDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Automatically create 'createdAt' and 'updatedAt'
});

// Enforce unique salary records for each employee per month
SalarySchema.index({ employee: 1, month: 1 }, { unique: true });

// Export the Salary model
module.exports = mongoose.model('Salary', SalarySchema);
