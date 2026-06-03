// Import Express router
const express = require('express');
const router = express.Router();

// Import Auth Controller methods
const {
  register,
  login,
  getMe,
  changePassword
} = require('../controllers/authController');

// Import authentication protection middleware
const { protect } = require('../middleware/authMiddleware');

// Route: Register new user (POST /api/auth/register)
router.post('/register', register);

// Route: Login (POST /api/auth/login)
router.post('/login', login);

// Route: Get current user profile (GET /api/auth/me) - Protected
router.get('/me', protect, getMe);

// Route: Change password (PUT /api/auth/password) - Protected
router.put('/password', protect, changePassword);

// Export router
module.exports = router;
