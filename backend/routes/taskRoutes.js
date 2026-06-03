// Import Express router
const express = require('express');
const router = express.Router();

// Import Task controller methods
const {
  getTasks,
  updateTaskStatus,
  delegateTask,
  getDepartmentTasks
} = require('../controllers/taskController');

// Import Auth protection and Role authorization middlewares
const { protect, authorize } = require('../middleware/authMiddleware');

// Department Manager / Admin task routes
router.post('/delegate', protect, authorize('manager', 'admin'), delegateTask);
router.get('/department', protect, authorize('manager', 'admin'), getDepartmentTasks);

// All task routes require authentication
router.get('/', protect, getTasks);          // Get assigned tasks
router.put('/:id', protect, updateTaskStatus); // Update task workflow status

// Export router
module.exports = router;
