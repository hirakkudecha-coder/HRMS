// Import mongoose to build schema
const mongoose = require('mongoose');

// Define the Leave Schema
const LeaveSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Links to the User model
    required: true
  },
  leaveType: {
    type: String,
    enum: ['Casual', 'Sick', 'Paid', 'Unpaid'],
    required: [true, 'Please specify the type of leave']
  },
  startDate: {
    type: Date,
    required: [true, 'Please add a start date']
  },
  endDate: {
    type: Date,
    required: [true, 'Please add an end date']
  },
  reason: {
    type: String,
    required: [true, 'Please add a reason for the leave'],
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
    default: 'Pending'
  },
  appliedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Automatically create 'createdAt' and 'updatedAt'
});

// Export the Leave model
module.exports = mongoose.model('Leave', LeaveSchema);
