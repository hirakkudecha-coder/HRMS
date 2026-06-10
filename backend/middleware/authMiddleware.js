// Import jwt to verify tokens and User model to find user details
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes (checks if user is logged in with valid token)
const protect = async (req, res, next) => {
  let token;

  // Check if token exists in the Authorization header and starts with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from Bearer string
      token = req.headers.authorization.split(' ')[1];

      // Decode and verify the token using JWT_SECRET
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hrms_jwt_secret_key_2026_super_secure_auth_token_secret');

      // Fetch the user from the database (exclude password field) and attach to request
      req.user = await User.findById(decoded.id).select('-password');
      
      // If user is not found, return authorization error
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      // Proceed to the next middleware or controller
      next();
    } catch (error) {
      // If token verification fails (expired or tempered)
      console.error('JWT Verification Error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  // If no token is provided in headers
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

// Middleware to authorize specific roles (e.g. admin only)
const authorize = (...roles) => {
  return (req, res, next) => {
    // Check if the user's role is allowed
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user ? req.user.role : 'none'}' is not authorized to access this resource`
      });
    }
    // Proceed to next middleware or controller
    next();
  };
};

// Region timezone lookup mapping
const regionTimeZones = {
  'India': 'Asia/Kolkata',
  'USA': 'America/New_York',
  'UK': 'Europe/London',
  'Russia': 'Europe/Moscow'
};

// Helper function to get today's date in local YYYY-MM-DD format based on employee time zone
const getTodayDateString = (timeZone = 'Asia/Kolkata') => {
  const options = { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' };
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const [{ value: month },,{ value: day },,{ value: year }] = formatter.formatToParts(new Date());
  return `${year}-${month}-${day}`;
};

// Middleware to verify if the user has started their shift today
const requireActiveShift = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authorized, please log in' });
    }

    // Bypass active shift requirement for admin, hr, and finance roles
    if (['admin', 'hr', 'finance'].includes(req.user.role)) {
      return next();
    }

    const Attendance = require('../models/Attendance');
    const timeZone = regionTimeZones[req.user.employeeDetails?.region] || 'Asia/Kolkata';
    const todayStr = getTodayDateString(timeZone);

    const record = await Attendance.findOne({ employee: req.user.id, date: todayStr });

    if (!record || !record.checkIn) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: You must check in for your daily shift first to access this resource!'
      });
    }

    next();
  } catch (error) {
    console.error('requireActiveShift Middleware Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during shift validation' });
  }
};

// Export all middlewares
module.exports = { protect, authorize, requireActiveShift };
