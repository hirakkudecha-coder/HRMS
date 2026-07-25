// Import Timesheet and User models
const Timesheet = require('../models/Timesheet');
const User = require('../models/User');

// @desc    Get all daily timesheets history of the logged-in employee
// @route   GET /api/timesheets
// @access  Private
exports.getTimesheetsHistory = async (req, res) => {
  try {
    const history = await Timesheet.find({ employee: req.user.id }).sort({ date: -1 });
    res.status(200).json({
      success: true,
      count: history.length,
      history
    });
  } catch (error) {
    console.error('Fetch Timesheet History Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching timesheet history' });
  }
};

// @desc    Get a daily timesheet for a specific date (format: YYYY-MM-DD)
// @route   GET /api/timesheets/date/:dateStr
// @access  Private
exports.getDailyTimesheet = async (req, res) => {
  try {
    const dateParam = req.params.dateStr;
    if (!dateParam) {
      return res.status(400).json({ success: false, message: 'Please provide a valid date parameter' });
    }

    let timesheet = await Timesheet.findOne({
      employee: req.user.id,
      date: dateParam
    });

    res.status(200).json({
      success: true,
      date: dateParam,
      timesheet
    });
  } catch (error) {
    console.error('Fetch Daily Timesheet Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching daily timesheet' });
  }
};

// @desc    Save/Update daily timesheet draft entries
// @route   POST /api/timesheets
// @access  Private
exports.saveTimesheetDraft = async (req, res) => {
  try {
    const { date, entries } = req.body;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Please provide a date' });
    }

    // Verify timesheet doesn't already exist in an immutable state (Submitted or Approved)
    let timesheet = await Timesheet.findOne({
      employee: req.user.id,
      date: date
    });

    if (timesheet && ['Submitted', 'Approved'].includes(timesheet.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot edit timesheet. Current status is ${timesheet.status}`
      });
    }

    const validatedEntries = (entries || []).map(entry => ({
      project: entry.project,
      description: entry.description,
      hours: Number(entry.hours) || 0
    }));

    if (timesheet) {
      // Update existing draft or rejected timesheet
      timesheet.entries = validatedEntries;
      if (timesheet.status === 'Rejected') {
        timesheet.status = 'Draft'; // Revert back to draft upon updates
      }
      await timesheet.save();
    } else {
      // Create new draft timesheet
      timesheet = await Timesheet.create({
        employee: req.user.id,
        date: date,
        entries: validatedEntries,
        status: 'Draft'
      });
    }

    if (global.io) {
      global.io.emit('timesheet_update');
    }

    res.status(200).json({
      success: true,
      message: 'Timesheet progress saved successfully as Draft',
      timesheet
    });
  } catch (error) {
    console.error('Save Timesheet Draft Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error saving timesheet draft' });
  }
};

// @desc    Submit daily timesheet for review
// @route   PUT /api/timesheets/:id/submit
// @access  Private
exports.submitTimesheet = async (req, res) => {
  try {
    const timesheetId = req.params.id;

    const timesheet = await Timesheet.findById(timesheetId);
    if (!timesheet) {
      return res.status(404).json({ success: false, message: 'Timesheet not found' });
    }

    // Verify ownership
    if (timesheet.employee.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to submit this timesheet' });
    }

    // Check status logic
    if (timesheet.status === 'Approved') {
      return res.status(400).json({ success: false, message: 'Timesheet has already been approved' });
    }

    timesheet.status = 'Submitted';
    await timesheet.save();

    if (global.io) {
      global.io.emit('timesheet_update');
    }

    res.status(200).json({
      success: true,
      message: 'Timesheet submitted successfully for manager approval',
      timesheet
    });
  } catch (error) {
    console.error('Submit Timesheet Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error submitting timesheet' });
  }
};

// @desc    Get submitted daily timesheets for manager's department (or all for admin)
// @route   GET /api/timesheets/department
// @access  Private (Manager/Admin)
exports.getDepartmentTimesheets = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const department = req.user.employeeDetails?.department;

    if (!isAdmin && !department) {
      return res.status(400).json({ success: false, message: 'Manager department not found' });
    }

    // Build employee query: admins query all, managers query department
    const empQuery = {};
    if (!isAdmin && department) {
      empQuery['employeeDetails.department'] = department;
    }

    const employees = await User.find(empQuery).select('_id');
    const employeeIds = employees.map(emp => emp._id);

    // Fetch timesheets for these employees
    const timesheets = await Timesheet.find({ employee: { $in: employeeIds } })
      .populate('employee', 'name email employeeDetails')
      .sort({ date: -1 });

    // Custom sort: show 'Submitted' timesheets at the top
    timesheets.sort((a, b) => {
      if (a.status === 'Submitted' && b.status !== 'Submitted') return -1;
      if (a.status !== 'Submitted' && b.status === 'Submitted') return 1;
      return 0;
    });

    res.status(200).json({
      success: true,
      count: timesheets.length,
      timesheets
    });
  } catch (error) {
    console.error('Fetch Department Timesheets Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching department timesheets' });
  }
};

// @desc    Approve or Reject a submitted daily timesheet
// @route   PUT /api/timesheets/:id/status
// @access  Private (Manager/Admin)
exports.updateTimesheetStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    const timesheetId = req.params.id;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid timesheet status. Please use Approved or Rejected' });
    }

    if (status === 'Rejected' && (!rejectionReason || !rejectionReason.trim())) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required when rejecting a timesheet' });
    }

    // Find timesheet and populate employee to verify department
    const timesheet = await Timesheet.findById(timesheetId).populate('employee');
    if (!timesheet) {
      return res.status(404).json({ success: false, message: 'Timesheet record not found' });
    }

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin) {
      if (!req.user.employeeDetails || !req.user.employeeDetails.department) {
        return res.status(400).json({ success: false, message: 'Manager department not found' });
      }
      const department = req.user.employeeDetails.department;
      if (timesheet.employee.employeeDetails.department !== department) {
        return res.status(403).json({ success: false, message: 'Not authorized to manage timesheets outside your department' });
      }
    }

    if (timesheet.status !== 'Submitted') {
      return res.status(400).json({ success: false, message: `Cannot update timesheet. Current status is ${timesheet.status}` });
    }

    timesheet.status = status;
    if (status === 'Rejected') {
      timesheet.rejectionReason = rejectionReason;
    } else {
      timesheet.rejectionReason = ''; // Clear out any previous rejection reason
    }

    await timesheet.save();

    if (global.io) {
      global.io.emit('timesheet_update');
    }

    res.status(200).json({
      success: true,
      message: `Timesheet has been ${status.toLowerCase()} successfully`,
      timesheet
    });
  } catch (error) {
    console.error('Update Timesheet Status Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating timesheet status' });
  }
};
