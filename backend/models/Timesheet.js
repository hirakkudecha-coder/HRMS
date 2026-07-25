const mongoose = require('mongoose');

// Define the Timesheet Schema
const TimesheetSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Links to the User model
    required: true
  },
  date: {
    type: String, // format: YYYY-MM-DD
    required: true
  },
  entries: [
    {
      project: {
        type: String,
        required: [true, 'Please add a project name'],
        trim: true
      },
      description: {
        type: String,
        required: [true, 'Please add a description of the work done'],
        trim: true
      },
      hours: {
        type: Number,
        required: [true, 'Please add the hours worked today'],
        min: [0, 'Hours cannot be negative'],
        max: [24, 'Hours cannot exceed 24 per day']
      }
    }
  ],
  totalHours: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Draft', 'Submitted', 'Approved', 'Rejected'],
    default: 'Draft'
  },
  rejectionReason: {
    type: String,
    default: ''
  }
}, {
  timestamps: true // Automatically create 'createdAt' and 'updatedAt'
});

// Compound index to ensure only one timesheet document exists per employee per calendar date
TimesheetSchema.index({ employee: 1, date: 1 }, { unique: true });

// Middleware: Auto-calculate totalHours based on daily entries before saving
TimesheetSchema.pre('save', function(next) {
  let sum = 0;
  if (this.entries && this.entries.length > 0) {
    this.entries.forEach(entry => {
      if (entry.hours) {
        sum += entry.hours;
      }
    });
  }
  this.totalHours = sum;
  next();
});

// Export the Timesheet model
module.exports = mongoose.model('Timesheet', TimesheetSchema);
