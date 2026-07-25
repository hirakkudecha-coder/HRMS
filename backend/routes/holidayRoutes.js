const express = require('express');
const router = express.Router();
const { getHolidays } = require('../controllers/holidayController');
const { protect } = require('../middleware/authMiddleware');

// Fetch list of corporate holidays
router.get('/', protect, getHolidays);

module.exports = router;
