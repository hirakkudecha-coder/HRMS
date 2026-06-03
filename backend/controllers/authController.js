// Import User model and jsonwebtoken to sign tokens
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper function to create JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id }, 
    process.env.JWT_SECRET || 'hrms_jwt_secret_key_2026_super_secure_auth_token_secret', 
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// @desc    Register a new user (Admin only, or initial setup)
// @route   POST /api/auth/register
// @access  Public (for initial setup) / Private (Admin)
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, employeeId, department, designation, phone, skills } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    // Check if employee ID already exists (if provided)
    if (employeeId) {
      const idExists = await User.findOne({ 'employeeDetails.employeeId': employeeId });
      if (idExists) {
        return res.status(400).json({ success: false, message: 'Employee ID already exists' });
      }
    }

    // Create standard employee details object
    const employeeDetails = {
      employeeId: employeeId || 'EMP' + Math.floor(1000 + Math.random() * 9000), // Auto-generate if not provided
      department: department || 'General',
      designation: designation || 'Associate',
      phone: phone || '',
      skills: skills || [],
      joiningDate: new Date()
    };

    // Create the User record in database
    const user = await User.create({
      name,
      email,
      password, // Password is automatically encrypted via Mongoose pre-save hook
      role: role || 'employee',
      employeeDetails
    });

    // Send successful response with signed token
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeDetails: user.employeeDetails
      }
    });
  } catch (error) {
    console.error('Registration Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during registration', error: error.message });
  }
};

// @desc    Authenticate user & return JWT token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email and password inputs
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Check if user exists (proactively fetch password because Mongoose has select: false)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Return success response with user data and token
    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeDetails: user.employeeDetails
      }
    });
  } catch (error) {
    console.error('Login Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during login', error: error.message });
  }
};

// @desc    Get current logged in user details
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    // req.user was set by 'protect' middleware
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Fetch Profile Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching user profile' });
  }
};

// @desc    Change logged in user password
// @route   PUT /api/auth/password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new passwords' });
    }

    // Retrieve user and select password
    const user = await User.findById(req.user.id).select('+password');

    // Check if current password is correct
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    // Assign new password (will be automatically hashed by User schema pre-save hook)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change Password Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error changing password' });
  }
};
