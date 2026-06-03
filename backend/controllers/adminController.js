// Import required models
const User = require('../models/User');
const Leave = require('../models/Leave');
const Task = require('../models/Task');
const Attendance = require('../models/Attendance');
const Notice = require('../models/Notice');
const Salary = require('../models/Salary');

// Mapping of working regions to standard time zones (mirrors attendanceController)
const regionTimeZones = {
  'India': 'Asia/Kolkata',
  'USA': 'America/New_York',
  'UK': 'Europe/London',
  'Russia': 'Europe/Moscow'
};

const getTodayDateString = (timeZone = 'Asia/Kolkata') => {
  const options = { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' };
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const [{ value: month },,{ value: day },,{ value: year }] = formatter.formatToParts(new Date());
  return `${year}-${month}-${day}`;
};

// @desc    Get system-wide admin overview stats
// @route   GET /api/admin/overview
// @access  Private (Admin only)
exports.getAdminOverview = async (req, res) => {
  try {
    // Count all users by role
    const totalEmployees = await User.countDocuments({ role: 'employee' });
    const totalManagers = await User.countDocuments({ role: 'manager' });

    // Count pending leaves
    const pendingLeaves = await Leave.countDocuments({ status: 'Pending' });
    const approvedLeaves = await Leave.countDocuments({ status: 'Approved' });

    // Task completion stats
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'Completed' });
    const inProgressTasks = await Task.countDocuments({ status: 'In Progress' });
    const todoTasks = await Task.countDocuments({ status: 'To Do' });

    // Today's attendance count — get all employees with their timezone
    const allEmployees = await User.find({ role: { $in: ['employee', 'manager'] } }).select('_id employeeDetails');
    const employeeTodayStrs = {};
    allEmployees.forEach(emp => {
      const tz = regionTimeZones[emp.employeeDetails?.region] || 'Asia/Kolkata';
      employeeTodayStrs[emp._id.toString()] = getTodayDateString(tz);
    });

    // Fetch today's attendance for any employee whose today-string matches
    const allTodayAttendance = await Attendance.find({
      employee: { $in: allEmployees.map(e => e._id) }
    }).select('employee date checkOut');

    let presentToday = 0;
    let checkedOutToday = 0;
    allTodayAttendance.forEach(rec => {
      const empId = rec.employee.toString();
      if (rec.date === employeeTodayStrs[empId]) {
        presentToday++;
        if (rec.checkOut) checkedOutToday++;
      }
    });

    // Department breakdown: count employees per department
    const deptBreakdown = await User.aggregate([
      { $match: { role: 'employee' } },
      { $group: { _id: '$employeeDetails.department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Recent notices (last 5)
    const recentNotices = await Notice.find().sort({ postedDate: -1 }).limit(5);

    // Recent leaves (last 5 with employee name)
    const recentLeaves = await Leave.find()
      .populate('employee', 'name employeeDetails')
      .sort({ appliedAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats: {
        totalEmployees,
        totalManagers,
        pendingLeaves,
        approvedLeaves,
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        presentToday,
        checkedOutToday,
        totalWorkforce: totalEmployees + totalManagers
      },
      deptBreakdown,
      recentNotices,
      recentLeaves
    });
  } catch (error) {
    console.error('Admin Overview Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching admin overview' });
  }
};

// @desc    Create a new employee / manager account
// @route   POST /api/admin/employees
// @access  Private (Admin only)
exports.createEmployee = async (req, res) => {
  try {
    const { name, email, password, role, department, designation, phone, region, employeeId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    // Check for duplicate email
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || 'employee',
      employeeDetails: {
        employeeId: employeeId || undefined,
        department: department || 'General',
        designation: designation || 'Associate',
        phone: phone || '',
        region: region || 'India',
        joiningDate: new Date()
      }
    });

    // Remove password from response
    const userResponse = newUser.toObject();
    delete userResponse.password;

    if (global.io) {
      global.io.emit('employee_update');
    }

    res.status(201).json({
      success: true,
      message: `New ${newUser.role} account created successfully`,
      user: userResponse
    });
  } catch (error) {
    console.error('Create Employee Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error creating employee' });
  }
};

// @desc    Update an employee's details (role, department, designation, etc.)
// @route   PUT /api/admin/employees/:id
// @access  Private (Admin only)
exports.updateEmployee = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, role, department, designation, phone, region } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Prevent modifying admin account
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot modify admin account via this endpoint' });
    }

    // Apply updates
    if (name) user.name = name.trim();
    if (role && ['employee', 'manager'].includes(role)) user.role = role;
    if (department) user.employeeDetails.department = department;
    if (designation) user.employeeDetails.designation = designation;
    if (phone) user.employeeDetails.phone = phone;
    if (region && ['India', 'USA', 'UK', 'Russia'].includes(region)) user.employeeDetails.region = region;

    await user.save();

    if (global.io) {
      global.io.emit('employee_update');
    }

    res.status(200).json({
      success: true,
      message: 'Employee details updated successfully',
      user
    });
  } catch (error) {
    console.error('Update Employee Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating employee' });
  }
};

// @desc    Delete an employee account (and all associated records)
// @route   DELETE /api/admin/employees/:id
// @access  Private (Admin only)
exports.deleteEmployee = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Prevent self-deletion or deleting another admin
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot delete an admin account' });
    }

    // Cascade delete all related records
    await Promise.all([
      Attendance.deleteMany({ employee: userId }),
      Leave.deleteMany({ employee: userId }),
      Task.deleteMany({ employee: userId }),
      Salary.deleteMany({ employee: userId }),
    ]);

    await User.findByIdAndDelete(userId);

    if (global.io) {
      global.io.emit('employee_update');
    }

    res.status(200).json({
      success: true,
      message: `Employee "${user.name}" and all associated records deleted successfully`
    });
  } catch (error) {
    console.error('Delete Employee Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error deleting employee' });
  }
};
