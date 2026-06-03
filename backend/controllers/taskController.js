// Import Task and User models
const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Get all tasks assigned to the logged-in employee
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    // Find all tasks assigned to this employee, sorted by deadline (earliest first)
    const tasks = await Task.find({ employee: req.user.id }).sort({ deadline: 1 });

    // Calculate quick counts for dashboard
    const todoTasks = tasks.filter(task => task.status === 'To Do').length;
    const inProgressTasks = tasks.filter(task => task.status === 'In Progress').length;
    const completedTasks = tasks.filter(task => task.status === 'Completed').length;

    res.status(200).json({
      success: true,
      counts: {
        total: tasks.length,
        todo: todoTasks,
        inProgress: inProgressTasks,
        completed: completedTasks
      },
      tasks
    });
  } catch (error) {
    console.error('Fetch Tasks Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching assigned tasks' });
  }
};

// @desc    Update a task's status (To Do -> In Progress -> Completed)
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTaskStatus = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { status } = req.body;

    // Validate inputs
    const allowedStatuses = ['To Do', 'In Progress', 'Completed'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid task status' });
    }

    // Find the task in database
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Check authorization: verify the task is assigned to the current employee
    if (task.employee.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this task' });
    }

    // Update status
    task.status = status;
    await task.save();

    if (global.io) {
      global.io.emit('task_update');
    }

    res.status(200).json({
      success: true,
      message: `Task status updated to '${status}'`,
      task
    });
  } catch (error) {
    console.error('Update Task Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error updating task status' });
  }
};

// @desc    Delegate/Assign a new task to a department employee
// @route   POST /api/tasks/delegate
// @access  Private (Manager/Admin)
exports.delegateTask = async (req, res) => {
  try {
    const { employeeId, title, description, priority, deadline } = req.body;

    if (!employeeId || !title || !description || !deadline) {
      return res.status(400).json({ success: false, message: 'Please provide all required task details (employeeId, title, description, deadline)' });
    }

    const isAdmin = req.user.role === 'admin';

    // Find the target employee
    const targetEmployee = await User.findById(employeeId);
    if (!targetEmployee) {
      return res.status(404).json({ success: false, message: 'Target employee not found' });
    }

    // Managers: verify department match. Admins: bypass department check
    if (!isAdmin) {
      if (!req.user.employeeDetails || !req.user.employeeDetails.department) {
        return res.status(400).json({ success: false, message: 'Manager department not found' });
      }
      const department = req.user.employeeDetails.department;
      if (targetEmployee.employeeDetails.department !== department) {
        return res.status(403).json({ success: false, message: 'Not authorized to delegate tasks outside your department' });
      }
    }

    // Create the task
    const task = await Task.create({
      employee: employeeId,
      title,
      description,
      priority: priority || 'Medium',
      deadline: new Date(deadline),
      status: 'To Do'
    });

    if (global.io) {
      global.io.emit('task_update');
    }

    res.status(201).json({
      success: true,
      message: 'Task delegated successfully',
      task
    });
  } catch (error) {
    console.error('Delegate Task Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error delegating task' });
  }
};

// @desc    Get all tasks assigned to employees in the manager's department (or all for admin)
// @route   GET /api/tasks/department
// @access  Private (Manager/Admin)
exports.getDepartmentTasks = async (req, res) => {
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

    // Find relevant employees
    const employees = await User.find(empQuery).select('_id');
    const employeeIds = employees.map(emp => emp._id);

    // Fetch all tasks for these employees
    const tasks = await Task.find({ employee: { $in: employeeIds } })
      .populate('employee', 'name email employeeDetails')
      .sort({ deadline: 1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    console.error('Fetch Department Tasks Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching department tasks' });
  }
};
