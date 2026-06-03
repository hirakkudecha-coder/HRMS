// Import Express router
const express = require('express');
const router = express.Router();

// Import Attendance controller methods
const {
  checkIn,
  checkOut,
  getTodayStatus,
  getAttendanceHistory,
  getDepartmentAttendance
} = require('../controllers/attendanceController');

// Import Auth protection and Role authorization middlewares
const { protect, authorize } = require('../middleware/authMiddleware');

// Department Manager / Admin attendance routes
router.get('/department', protect, authorize('manager', 'admin'), getDepartmentAttendance);

// All attendance routes require the user to be logged in
router.post('/checkin', protect, checkIn);
router.post('/checkout', protect, checkOut);
router.get('/today', protect, getTodayStatus);
router.get('/history', protect, getAttendanceHistory);

// Export router
module.exports = router;
