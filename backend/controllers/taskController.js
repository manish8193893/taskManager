const Task = require('../models/Task');

// @desc   Get all tasks (Admin: all, User: only assigned tasks)
// @route  GET /api/tasks
// @access Private/Admin
const getAllTasks = async (req, res) => {
    try {
        const { status } = req.query;
        let filter = {};

        if (status) {
            filter.status = status;
        }

        let tasks;

        if (req.user.role === 'admin') {
            tasks = await Task.find(filter).populate('assignedTo', 'name email profileImageUrl');
        } else {
            tasks = await Task.find({ ...filter, assignedTo: req.user._id }).populate('assignedTo', 'name email profileImageUrl');
        }

        // Add completed todoChecklist count to each task
        tasks = await Promise.all(tasks.map(async (task) => {
            const completedCount = (task.todoChecklist || []).filter(item => item.completed).length;
            // include both keys to keep compatibility with frontend naming
            return { ...task._doc, completedChecklistCount: completedCount, completedTodoCount: completedCount };
        }));

        // Status summary counts
        const allTasks = await Task.countDocuments(req.user.role === 'admin' ? {} : { assignedTo: req.user._id });
        const pendingTasks = await Task.countDocuments({ ...filter, status: 'Pending', ...(req.user.role !== 'admin' && { assignedTo: req.user._id }) });
        const inProgressTasks = await Task.countDocuments({ ...filter, status: 'In-Progress', ...(req.user.role !== 'admin' && { assignedTo: req.user._id }) });
        const completedTasks = await Task.countDocuments({ ...filter, status: 'Completed', ...(req.user.role !== 'admin' && { assignedTo: req.user._id }) });

        res.json({
            tasks,
            statusSummary: {
                all: allTasks,
                pending: pendingTasks,
                inProgress: inProgressTasks,
                completed: completedTasks
            }
        });

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc   Get task by ID
// @route  GET /api/tasks/:id
// @access Private
const getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id).populate('assignedTo', 'name email profileImageUrl');

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.json(task);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc   Create a new task
// @route  POST /api/tasks
// @access Private/Adminl
const createTask = async (req, res) => {
    try {
        const { title, description, priority, dueDate, assignedTo, attachments, todoChecklist } = req.body;

        if (!Array.isArray(assignedTo)) {
            return res.status(400).json({ message: 'assignedTo must be an array of user IDs' });
        }

        const task = await Task.create({
            title,
            description,
            priority,
            dueDate,
            assignedTo,
            createdBy: req.user.id,
            attachments,
            todoChecklist
        });

        res.status(201).json({ message: 'Task created successfully', task });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc   Update a task
// @route  PUT /api/tasks/:id
// @access Private
const updateTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        task.title = req.body.title || task.title;
        task.description = req.body.description || task.description;
        task.priority = req.body.priority || task.priority;
        task.dueDate = req.body.dueDate || task.dueDate;
        task.attachments = req.body.attachments || task.attachments;
        task.todoChecklist = req.body.todoChecklist || task.todoChecklist;

        if (req.body.assignedTo) {
            if (!Array.isArray(req.body.assignedTo)) {
                return res.status(400).json({ message: 'assignedTo must be an array of user IDs' });
            }
            task.assignedTo = req.body.assignedTo;
        }

        const updateTask = await task.save();
        res.json({ message: 'Task updated successfully', updateTask });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc   Delete a task(Admin only)
// @route  DELETE /api/tasks/:id
// @access Private/Admin
const deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        await task.deleteOne();
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc   Update task status
// @route  PUT /api/tasks/:id/status
// @access Private
const updateTaskStatus = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const isAssigned = task.assignedTo.some(userId => userId.toString() === req.user._id.toString());
        if (!isAssigned && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this task status' });
        }
        task.status = req.body.status || task.status;
        if (task.status === 'Completed') {
            task.todoChecklist.forEach(item => item.completed = true);
            task.progress = 100;
        }
        const updatedTask = await task.save();
        res.json({ message: 'Task status updated successfully', updatedTask });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc   Update task checklist
// @route  PUT /api/tasks/:id/todo
// @access Private
const updateTaskChecklist = async (req, res) => {
    try {
        // 1. Destructure the updated todoChecklist from the request body
        const { todoChecklist } = req.body;

        // 2. Validate the input (Crucial check added)
        if (!Array.isArray(todoChecklist)) {
            return res.status(400).json({ message: 'Invalid input: todoChecklist must be an array' });
        }

        // 3. Find the task
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        // 4. Authorization check
        // Assuming req.user._id is the MongoDB ObjectId for the authenticated user
        const isAssigned = task.assignedTo.some(id => id.equals(req.user._id)); // Use .some and .equals for Mongoose ObjectIds
        const isAdmin = req.user.role === 'admin';

        if (!isAssigned && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to update this task checklist' });
        }

        // 5. Update the checklist
        task.todoChecklist = todoChecklist;

        // 6. Auto-update progress and status
        const completedCount = task.todoChecklist.filter(item => item.completed).length;
        const totalItems = task.todoChecklist.length;

        task.progress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

        // Determine Status
        if (task.progress === 100) {
            task.status = 'Completed';
        } else if (task.progress > 0) {
            task.status = 'In-Progress';
        } else {
            // This covers task.progress === 0
            task.status = 'Pending';
        }

        // 7. Save the task
        await task.save();

        // 8. Fetch and return the updated task with populated fields
        const updatedTask = await Task.findById(req.params.id).populate('assignedTo', 'name email profileImageUrl');
        res.json({ message: 'Task checklist updated successfully', task: updatedTask });

    } catch (error) {
        // Log the error for server-side debugging
        console.error("Error updating task checklist:", error);

        // Differentiate between Mongoose/validation errors and generic server errors
        if (error.name === 'CastError' || error.name === 'ValidationError') {
            return res.status(400).json({ message: `Invalid data: ${error.message}` });
        }

        res.status(500).json({ message: 'Server Error', details: error.message });
    }
};

// @desc   Get dashboard data (Admin)
// @route  GET /api/tasks/dashboard-data
// @access Private/Admin
const getDashboardData = async (req, res) => {
    try {
        // Fetch Statistics
        const totalTasks = await Task.countDocuments();
        const pendingTasks = await Task.countDocuments({ status: 'Pending' });
        const completedTasks = await Task.countDocuments({ status: 'Completed' });
        const overdueTasks = await Task.countDocuments({ dueDate: { $lt: new Date() }, status: { $ne: 'Completed' } });

        // Ensure all possible statuses are included (use model values)
        const taskStatuses = ['Pending', 'In-Progress', 'Completed'];
        const taskDistributionRaw = await Task.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // helper to normalize status strings for robust matching (handles spaces, hyphens, underscores and case)
        const normalize = (s) => String(s || '').toLowerCase().replace(/[-_\s]+/g, '');

        const taskDistribution = taskStatuses.reduce((acc, status) => {
            // key without spaces/hyphens for client-side usage
            const formattedKey = status.replace(/[^a-zA-Z0-9]/g, '');
            const count = taskDistributionRaw.find(item => normalize(item._id) === normalize(status))?.count || 0;
            acc[formattedKey] = count;
            return acc;
        }, {});

        taskDistribution["All"] = totalTasks; // Add total count to taskDistribution

        // ensure all priority  levels are included
        const taskPriorities = ['Low', 'Medium', 'High'];
        const taskPriorityLevelsRaw = await Task.aggregate([
            {
                $group: {
                    _id: '$priority',
                    count: { $sum: 1 }
                }
            }
        ]);

        const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
            acc[priority] = taskPriorityLevelsRaw.find(item => item._id === priority)?.count || 0;
            return acc;
        }, {});

        // Fetch Recent 10 Tasks
        const recentTasks = await Task.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select('title status priority dueDate createdAt');

        res.status(200).json({
            statistics: {
                totalTasks,
                pendingTasks,
                completedTasks,
                overdueTasks
            },
            charts: {
                taskDistribution,
                taskPriorityLevels
            },
            recentTasks,
        })

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc   Get user dashboard data
// @route  GET /api/tasks/user-dashboard-data
// @access Private
const getUserDashboardData = async (req, res) => {

    try {
        const userId = req.user._id;

        // Fetch staticts for user specific task
        const totalTasks = await Task.countDocuments({ assignedTo: userId });
        const pendingTasks = await Task.countDocuments({ assignedTo: userId, status: 'Pending' });
        const completedTasks = await Task.countDocuments({ assignedTo: userId, status: 'Completed' });
        const overdueTasks = await Task.countDocuments({ assignedTo: userId, dueDate: { $lt: new Date() }, status: { $ne: 'Completed' } });

        // Task distribution by status (use model values and robust matching)
        const taskStatuses = ['Pending', 'In-Progress', 'Completed'];
        const taskDistributionRaw = await Task.aggregate([
            { $match: { assignedTo: userId } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]);

        // helper to normalize status strings for robust matching (handles spaces, hyphens, underscores and case)
        const normalize = (s) => String(s || '').toLowerCase().replace(/[-_\s]+/g, '');

        const taskDistribution = taskStatuses.reduce((acc, status) => {
            const formattedKey = status.replace(/[^a-zA-Z0-9]/g, '');
            const count = taskDistributionRaw.find(item => normalize(item._id) === normalize(status))?.count || 0;
            acc[formattedKey] = count;
            return acc;
        }, {});

        taskDistribution["All"] = totalTasks; // Add total count taskDistribution
        // task distribution by priority
        const taskPriorities = ['Low', 'Medium', 'High'];
        const taskPriorityLevelsRaw = await Task.aggregate([
            { $match: { assignedTo: userId } },
            {
                $group: {
                    _id: '$priority',
                    count: { $sum: 1 }
                }
            }
        ]);
        const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
            acc[priority] = taskPriorityLevelsRaw.find(item => item._id === priority)?.count || 0;
            return acc;
        }, {});

        // Fetch recent 10 tasks for the user
        const recentTasks = await Task.find({ assignedTo: userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('title status priority dueDate createdAt');

        res.status(200).json({
            statistics: {
                totalTasks,
                pendingTasks,
                completedTasks,
                overdueTasks
            },
            charts: {
                taskDistribution,
                taskPriorityLevels
            },
            recentTasks,
        })

    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    getAllTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    updateTaskChecklist,
    getDashboardData,
    getUserDashboardData,
};