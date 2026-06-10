// Import Express router
const express = require('express');
const router = express.Router();

// Import Employee controller methods
const {
  updateProfile,
  uploadAvatar,
  getDepartmentEmployees
} = require('../controllers/employeeController');

// Import Auth protection middleware and Multer image upload middleware
const { protect, authorize, requireActiveShift } = require('../middleware/authMiddleware');
const { uploadAvatar: avatarUploader } = require('../middleware/uploadMiddleware');

// All employee routes require authentication and an active shift check-in
router.use(protect);
router.use(requireActiveShift);

// Route: Update profile contact/skills (PUT /api/employee/profile)
router.put('/profile', updateProfile);

// Route: Upload profile image (POST /api/employee/avatar)
// Intercept with Multer's single-file uploader expecting fieldname 'avatar'
router.post('/avatar', avatarUploader.single('avatar'), uploadAvatar);

// Route: Get all department employees (GET /api/employee/department) - Private (Manager/Admin)
router.get('/department', authorize('manager', 'admin', 'hr'), getDepartmentEmployees);

// Export router
module.exports = router;
