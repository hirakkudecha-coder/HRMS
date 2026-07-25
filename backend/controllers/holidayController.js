const Holiday = require('../models/Holiday');

// @desc    Get all corporate holidays
// @route   GET /api/holidays
// @access  Private
exports.getHolidays = async (req, res) => {
  try {
    const holidays = await Holiday.find().sort({ date: 1 });

    res.status(200).json({
      success: true,
      count: holidays.length,
      holidays
    });
  } catch (error) {
    console.error('Fetch Holidays Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching holidays' });
  }
};
