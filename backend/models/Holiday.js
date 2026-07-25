const mongoose = require('mongoose');

const HolidaySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a holiday name'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Please add a holiday date']
  },
  description: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Holiday', HolidaySchema);
