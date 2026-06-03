// Import Express router
const express = require('express');
const router = express.Router();

// Import Admin controller methods
const {
  getAdminOverview,
  createEmployee,
  updateEmployee,
  deleteEmployee
} = require('../controllers/adminController');

// Import Auth protection and Role authorization middlewares
const { protect, authorize } = require('../middleware/authMiddleware');

// All admin routes require authentication AND admin role
router.get('/overview', protect, authorize('admin'), getAdminOverview);
router.post('/employees', protect, authorize('admin'), createEmployee);
router.put('/employees/:id', protect, authorize('admin'), updateEmployee);
router.delete('/employees/:id', protect, authorize('admin'), deleteEmployee);

// Export router
module.exports = router;
