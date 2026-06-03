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
const { protect, authorize } = require('../middleware/authMiddleware');
const { uploadAvatar: avatarUploader } = require('../middleware/uploadMiddleware');

// Route: Update profile contact/skills (PUT /api/employee/profile) - Protected
router.put('/profile', protect, updateProfile);

// Route: Upload profile image (POST /api/employee/avatar) - Protected
// Intercept with Multer's single-file uploader expecting fieldname 'avatar'
router.post('/avatar', protect, avatarUploader.single('avatar'), uploadAvatar);

// Route: Get all department employees (GET /api/employee/department) - Private (Manager/Admin)
router.get('/department', protect, authorize('manager', 'admin'), getDepartmentEmployees);

// Export router
module.exports = router;
