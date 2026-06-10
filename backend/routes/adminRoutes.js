// Import Express router
const express = require('express');
const router = express.Router();

// Import Admin controller methods
const {
  getAdminOverview,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  updateEmployeeRole,
  getSettings,
  updateSettings,
  getAuditLogs
} = require('../controllers/adminController');

// Import Auth protection and Role authorization middlewares
const { protect, authorize, requireActiveShift } = require('../middleware/authMiddleware');

// All admin routes require authentication and active shift check-in
router.use(protect);
router.use(requireActiveShift);

// Overview is accessible by both Admin and HR
router.get('/overview', authorize('admin', 'hr'), getAdminOverview);

// Employee modifications are accessible by Admin and HR
router.post('/employees', authorize('admin', 'hr'), createEmployee);
router.put('/employees/:id', authorize('admin', 'hr'), updateEmployee);
router.delete('/employees/:id', authorize('admin', 'hr'), deleteEmployee);

// Advanced administrative actions are restricted to Admin role only
router.put('/employees/:id/role', authorize('admin'), updateEmployeeRole);
router.get('/settings', authorize('admin', 'hr'), getSettings);
router.put('/settings', authorize('admin'), updateSettings);
router.get('/audit-logs', authorize('admin'), getAuditLogs);

// Export router
module.exports = router;
