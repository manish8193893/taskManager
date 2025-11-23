const express = require('express');
const { protect, adminOnly } = require('../middlewares/authMiddleware');
const { getAllTasks, getTaskById, createTask, updateTask, deleteTask, updateTaskStatus, getDashboardData, getUserDashboardData, updateTaskChecklist } = require('../controllers/taskController');

const router = express.Router();

// Task Management Routes
router.get("/dashboard-data", protect, getDashboardData); // Get dashboard data
router.get("/user-dashboard-data", protect, getUserDashboardData); // Get user dashboard data
router.get("/", protect, getAllTasks); // Get all tasks (admin only)
router.get("/:id", protect, getTaskById); // Get a specific task by ID
router.post("/", protect, adminOnly, createTask); // Create a new task (admin only)
router.put("/:id", protect, updateTask); // Update a task
router.delete("/:id", protect, adminOnly, deleteTask); // Delete a task (admin only)
router.put("/:id/status", protect, updateTaskStatus); // Update task status
router.put("/:id/todo", protect, updateTaskChecklist); // Update task checklist

module.exports = router;