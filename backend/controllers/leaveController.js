// Import Leave and User models
const Leave = require('../models/Leave');
const User = require('../models/User');

// @desc    Apply for a new leave
// @route   POST /api/leaves
// @access  Private (Employee)
exports.applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    // Validate inputs
    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({ success: false, message: 'Please fill in all leave application fields' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Verify start date is before end date
    if (start > end) {
      return res.status(400).json({ success: false, message: 'Start date cannot be after end date' });
    }

    // Create the leave request record
    const leave = await Leave.create({
      employee: req.user.id,
      leaveType,
      startDate: start,
      endDate: end,
      reason
    });

    if (global.io) {
      global.io.emit('leave_update');
    }

    res.status(201).json({
      success: true,
      message: 'Leave applied successfully! Sent to HR for approval.',
      leave
    });
  } catch (error) {
    console.error('Apply Leave Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error applying for leave' });
  }
};

// @desc    Get applied leaves history & current leave balances
// @route   GET /api/leaves
// @access  Private
exports.getLeaves = async (req, res) => {
  try {
    // Fetch all leaves of the employee, sorted by appliedAt date descending
    const history = await Leave.find({ employee: req.user.id }).sort({ appliedAt: -1 });

    // Define fixed allowed limits for each leave category
    const allowances = {
      Casual: 10,
      Sick: 10,
      Paid: 15,
      Unpaid: 99 // Unlimited or high fallback
    };

    // Calculate days used per leave type (only count 'Approved' leaves)
    const used = { Casual: 0, Sick: 0, Paid: 0, Unpaid: 0 };

    history.forEach(leave => {
      if (leave.status === 'Approved') {
        const diffTime = Math.abs(leave.endDate - leave.startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both start and end days
        
        if (used[leave.leaveType] !== undefined) {
          used[leave.leaveType] += diffDays;
        }
      }
    });

    // Compute remaining balances
    const balances = {
      Casual: Math.max(0, allowances.Casual - used.Casual),
      Sick: Math.max(0, allowances.Sick - used.Sick),
      Paid: Math.max(0, allowances.Paid - used.Paid),
      Unpaid: used.Unpaid // Used unpaid leaves
    };

    res.status(200).json({
      success: true,
      allowances,
      used,
      balances,
      history
    });
  } catch (error) {
    console.error('Fetch Leaves Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching leave records' });
  }
};

// @desc    Cancel a pending leave request
// @route   PUT /api/leaves/:id/cancel
// @access  Private (Employee)
exports.cancelLeave = async (req, res) => {
  try {
    const leaveId = req.params.id;

    // Find the leave record
    const leave = await Leave.findById(leaveId);
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave record not found' });
    }

    // Verify the leave belongs to the requesting employee
    if (leave.employee.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this leave' });
    }

    // Can only cancel leaves that are still pending approval
    if (leave.status !== 'Pending') {
      return res.status(400).json({ success: false, message: `Cannot cancel leave. Current status is ${leave.status}` });
    }

    // Set status to Cancelled
    leave.status = 'Cancelled';
    await leave.save();

    if (global.io) {
      global.io.emit('leave_update');
    }

    res.status(200).json({
      success: true,
      message: 'Leave application cancelled successfully',
      leave
    });
  } catch (error) {
    console.error('Cancel Leave Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error cancelling leave' });
  }
};

// @desc    Get all leave applications of employees in user's department (or all for admin)
// @route   GET /api/leaves/department
// @access  Private
exports.getDepartmentLeaves = async (req, res) => {
  try {
    // Return all leaves company-wide for any employee/manager/admin
    const empQuery = {};

    // Find all employees
    const employees = await User.find(empQuery).select('_id');
    const employeeIds = employees.map(emp => emp._id);

    // Find all leaves for these employees, sorted by appliedAt descending
    const leaves = await Leave.find({ employee: { $in: employeeIds } })
      .populate('employee', 'name email employeeDetails')
      .sort({ appliedAt: -1 });

    // Custom sort to make 'Pending' show up first
    leaves.sort((a, b) => {
      if (a.status === 'Pending' && b.status !== 'Pending') return -1;
      if (a.status !== 'Pending' && b.status === 'Pending') return 1;
      return 0; // maintain relative appliedAt order
    });

    res.status(200).json({
      success: true,
      count: leaves.length,
      leaves
    });
  } catch (error) {
    console.error('Fetch Department Leaves Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching department leaves' });
  }
};

// @desc    Update status of a leave request (Approve/Reject)
// @route   PUT /api/leaves/:id/status
// @access  Private (Manager/Admin)
exports.updateLeaveStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const leaveId = req.params.id;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid status (Approved or Rejected)' });
    }

    // Find leave and populate employee to check department
    const leave = await Leave.findById(leaveId).populate('employee');
    if (!leave) {
      return res.status(404).json({ success: false, message: 'Leave record not found' });
    }

    // Security check: Managers must belong to the same department. Admins bypass this check.
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin) {
      if (!req.user.employeeDetails || !req.user.employeeDetails.department) {
        return res.status(400).json({ success: false, message: 'Manager department not found' });
      }
      const department = req.user.employeeDetails.department;
      if (leave.employee.employeeDetails.department !== department) {
        return res.status(403).json({ success: false, message: 'Not authorized to manage leaves outside your department' });
      }
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({ success: false, message: `Cannot change status. Current status is ${leave.status}` });
    }

    leave.status = status;
    await leave.save();

    if (global.io) {
      global.io.emit('leave_update');
    }

    res.status(200).json({
      success: true,
      message: `Leave request has been ${status.toLowerCase()} successfully`,
      leave
    });
  } catch (error) {
    console.error('Update Leave Status Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating leave status' });
  }
};
