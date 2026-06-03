// Import User model
const User = require('../models/User');

// @desc    Update employee profile (skills, phone, contact)
// @route   PUT /api/employee/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { phone, skills } = req.body;

    // Find the user profile in database
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update phone number and skills inside employeeDetails
    if (phone !== undefined) {
      user.employeeDetails.phone = phone;
    }
    if (skills !== undefined) {
      // Split and clean skills array if sent as string, or keep array if sent as array
      if (Array.isArray(skills)) {
        user.employeeDetails.skills = skills;
      } else {
        user.employeeDetails.skills = skills.split(',').map(skill => skill.trim()).filter(Boolean);
      }
    }

    // Save changes to database
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update Profile Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
};

// @desc    Upload profile image (Avatar)
// @route   POST /api/employee/avatar
// @access  Private
exports.uploadAvatar = async (req, res) => {
  try {
    // If no file was sent by multer
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file' });
    }

    // Generate local URL for file access (e.g. "/uploads/avatar-12345.png")
    const imageUrl = `/uploads/${req.file.filename}`;

    // Update user's avatar path in MongoDB
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.employeeDetails.profileImage = imageUrl;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile image uploaded successfully',
      profileImage: imageUrl,
      user
    });
  } catch (error) {
    console.error('Upload Avatar Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error uploading profile image' });
  }
};

// @desc    Get all employees in the logged-in manager's department (or all for admin)
// @route   GET /api/employee/department
// @access  Private (Manager/Admin)
exports.getDepartmentEmployees = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const department = req.user.employeeDetails?.department;

    // Admin with no department sees all employees; manager must have a department
    if (!isAdmin && !department) {
      return res.status(400).json({ success: false, message: 'Manager department not found' });
    }

    // Build query: admins see all employees and managers, managers see their department
    const query = isAdmin 
      ? { role: { $in: ['employee', 'manager'] } }
      : { role: 'employee' };
    if (!isAdmin && department) {
      query['employeeDetails.department'] = department;
    }

    const employees = await User.find(query).select('-password').sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: employees.length,
      department: department || 'All Departments',
      employees
    });
  } catch (error) {
    console.error('Fetch Department Employees Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching department employees' });
  }
};
