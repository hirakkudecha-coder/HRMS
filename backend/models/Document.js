// Import mongoose to build schema
const mongoose = require('mongoose');

// Define the Document Schema
const DocumentSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Links to the User model
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a document title'],
    trim: true
  },
  fileUrl: {
    type: String, // Path of the file on the server (e.g., "/uploads/docs-xxx.pdf")
    required: [true, 'Please upload a document file']
  },
  fileType: {
    type: String, // e.g. "application/pdf", "image/png"
    default: ''
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  verificationNotes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true // Automatically create 'createdAt' and 'updatedAt'
});

// Export the Document model
module.exports = mongoose.model('Document', DocumentSchema);
