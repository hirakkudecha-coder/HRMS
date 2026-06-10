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
const { protect, authorize, requireActiveShift } = require('../middleware/authMiddleware');

// All admin routes require authentication, admin role, and active shift check-in
router.use(protect);
router.use(authorize('admin', 'hr'));
router.use(requireActiveShift);

router.get('/overview', getAdminOverview);
router.post('/employees', createEmployee);
router.put('/employees/:id', updateEmployee);
router.delete('/employees/:id', deleteEmployee);

// Export router
module.exports = router;
