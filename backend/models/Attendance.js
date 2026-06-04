// Import mongoose to build schema
const mongoose = require('mongoose');

// Define the Attendance Schema
const AttendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Links to the User model
    required: true
  },
  date: {
    type: String, // Stored as "YYYY-MM-DD" for easy daily queries
    required: true
  },
  checkIn: {
    type: Date, // Timestamp for check in
    required: true
  },
  checkOut: {
    type: Date // Timestamp for check out
  },
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'Half Day'],
    default: 'Present'
  },
  workHours: {
    type: Number, // Number of hours worked today
    default: 0
  },
  breaks: [
    {
      breakIn: {
        type: Date,
        required: true
      },
      breakOut: {
        type: Date
      }
    }
  ],
  totalBreakDuration: {
    type: Number, // Total break time in hours
    default: 0
  }
}, {
  timestamps: true // Automatically create 'createdAt' and 'updatedAt' fields
});

// Create a compound index so an employee cannot have more than one record per day
AttendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

// Export the Attendance model
module.exports = mongoose.model('Attendance', AttendanceSchema);
