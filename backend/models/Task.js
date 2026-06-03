// Import mongoose to build schema
const mongoose = require('mongoose');

// Define the Task Schema
const TaskSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Links to the User model
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a task title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a task description'],
    trim: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['To Do', 'In Progress', 'Completed'],
    default: 'To Do'
  },
  deadline: {
    type: Date,
    required: [true, 'Please specify a deadline date']
  }
}, {
  timestamps: true // Automatically create 'createdAt' and 'updatedAt'
});

// Export the Task model
module.exports = mongoose.model('Task', TaskSchema);
