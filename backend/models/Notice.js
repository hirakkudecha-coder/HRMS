// Import mongoose to build schema
const mongoose = require('mongoose');

// Define the Notice Schema
const NoticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a notice title'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Please add notice content'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please specify a category'],
    trim: true
  },
  icon: {
    type: String,
    default: '📢'
  },
  postedDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Automatically create 'createdAt' and 'updatedAt'
});

// Export the Notice model
module.exports = mongoose.model('Notice', NoticeSchema);
