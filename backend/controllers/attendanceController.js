// Import Attendance model
const Attendance = require('../models/Attendance');

// Import User model to fetch employee region
const User = require('../models/User');

// Mapping of working regions to standard time zones
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

// @desc    Employee Check-In
// @route   POST /api/attendance/checkin
// @access  Private (Employee)
exports.checkIn = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const user = await User.findById(employeeId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const timeZone = regionTimeZones[user.employeeDetails?.region] || 'Asia/Kolkata';
    const todayStr = getTodayDateString(timeZone);

    // Check if employee has already checked in today in their local timezone calendar day
    const existingRecord = await Attendance.findOne({ employee: employeeId, date: todayStr });
    if (existingRecord) {
      return res.status(400).json({ success: false, message: 'You have already checked in today!' });
    }

    const checkInTime = new Date();
    
    const localTimeString = checkInTime.toLocaleTimeString('en-US', { timeZone, hour12: false });
    const [localHour, localMinute] = localTimeString.split(':').map(Number);

    // Prevent checking in before 09:00 AM local time
    if (localHour < 9) {
      return res.status(400).json({
        success: false,
        message: 'Shift starts at 09:00 AM. You cannot check in before 09:00 AM local time!'
      });
    }

    // Determine status: evaluate late check-in based on employee's local regional clock (if > 09:00 AM)
    let status = 'Present';
    if (localHour > 9 || (localHour === 9 && localMinute > 0)) {
      status = 'Late';
    }

    // Create the attendance record
    const attendance = await Attendance.create({
      employee: employeeId,
      date: todayStr,
      checkIn: checkInTime,
      status
    });

    if (global.io) {
      global.io.emit('attendance_update');
    }

    res.status(201).json({
      success: true,
      message: `Checked in successfully as ${status}`,
      attendance
    });
  } catch (error) {
    console.error('CheckIn Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during check-in' });
  }
};

// @desc    Employee Check-Out
// @route   POST /api/attendance/checkout
// @access  Private (Employee)
exports.checkOut = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const user = await User.findById(employeeId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const timeZone = regionTimeZones[user.employeeDetails?.region] || 'Asia/Kolkata';
    const todayStr = getTodayDateString(timeZone);

    // Find today's check-in record in their local timezone calendar day
    const attendance = await Attendance.findOne({ employee: employeeId, date: todayStr });
    if (!attendance) {
      return res.status(400).json({ success: false, message: 'You need to check-in first!' });
    }

    // Check if employee has already checked out
    if (attendance.checkOut) {
      return res.status(400).json({ success: false, message: 'You have already checked out today!' });
    }

    const checkOutTime = new Date();
    attendance.checkOut = checkOutTime;

    // Calculate worked hours (difference in milliseconds converted to decimal hours)
    const diffMs = checkOutTime.getTime() - attendance.checkIn.getTime();
    const hoursWorked = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    attendance.workHours = hoursWorked;

    // If worked hours are less than 4 hours, mark as Half Day
    if (hoursWorked < 4) {
      attendance.status = 'Half Day';
    }

    // Save changes
    await attendance.save();

    if (global.io) {
      global.io.emit('attendance_update');
    }

    res.status(200).json({
      success: true,
      message: 'Checked out successfully',
      attendance
    });
  } catch (error) {
    console.error('CheckOut Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error during check-out' });
  }
};

// @desc    Get today's check-in status for the logged-in employee
// @route   GET /api/attendance/today
// @access  Private
exports.getTodayStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const timeZone = regionTimeZones[user.employeeDetails?.region] || 'Asia/Kolkata';
    const todayStr = getTodayDateString(timeZone);
    const attendance = await Attendance.findOne({ employee: req.user.id, date: todayStr });

    res.status(200).json({
      success: true,
      checkedIn: !!attendance,
      checkedOut: !!(attendance && attendance.checkOut),
      record: attendance || null
    });
  } catch (error) {
    console.error('Fetch Today Attendance Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching daily status' });
  }
};

// @desc    Get attendance history logs for the employee
// @route   GET /api/attendance/history
// @access  Private
exports.getAttendanceHistory = async (req, res) => {
  try {
    // Find all records of the user, sorted by date descending (latest first)
    const history = await Attendance.find({ employee: req.user.id }).sort({ date: -1 });

    // Calculate quick attendance summary numbers
    const totalDays = history.length;
    const presentDays = history.filter(rec => rec.status === 'Present' || rec.status === 'Late').length;
    const lateDays = history.filter(rec => rec.status === 'Late').length;
    const halfDays = history.filter(rec => rec.status === 'Half Day').length;
    const totalHours = history.reduce((sum, rec) => sum + (rec.workHours || 0), 0).toFixed(1);

    res.status(200).json({
      success: true,
      summary: {
        totalDays,
        presentDays,
        lateDays,
        halfDays,
        totalHours
      },
      history
    });
  } catch (error) {
    console.error('Fetch Attendance History Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching attendance history' });
  }
};

// @desc    Get attendance logs for all employees in manager's department (or all for admin)
// @route   GET /api/attendance/department
// @access  Private (Manager/Admin)
exports.getDepartmentAttendance = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const department = req.user.employeeDetails?.department;

    if (!isAdmin && !department) {
      return res.status(400).json({ success: false, message: 'Manager department not found' });
    }

    // Build employee query: admins see all, managers see their department
    const empQuery = {};
    if (!isAdmin && department) {
      empQuery['employeeDetails.department'] = department;
    }

    // Find all employees matching the query
    const employees = await User.find(empQuery).select('_id name email employeeDetails');
    const employeeIds = employees.map(emp => emp._id);

    // Find all attendance records for these employees, sorted by date descending, checkIn descending
    const history = await Attendance.find({ employee: { $in: employeeIds } })
      .populate('employee', 'name email employeeDetails')
      .sort({ date: -1, checkIn: -1 });

    // Generate "today" records by matching each employee's todayDateString
    const todayRecords = [];
    
    // We map employeeId to their today's date string
    const employeeTodayStr = {};
    employees.forEach(emp => {
      const timeZone = regionTimeZones[emp.employeeDetails?.region] || 'Asia/Kolkata';
      employeeTodayStr[emp._id.toString()] = getTodayDateString(timeZone);
    });

    // Filter history to get today's check-ins
    history.forEach(record => {
      if (record.employee && record.employee._id) {
        const empIdStr = record.employee._id.toString();
        if (record.date === employeeTodayStr[empIdStr]) {
          todayRecords.push(record);
        }
      }
    });

    res.status(200).json({
      success: true,
      count: history.length,
      todayCount: todayRecords.length,
      today: todayRecords,
      history
    });
  } catch (error) {
    console.error('Fetch Department Attendance Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching department attendance logs' });
  }
};
