require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const reportRoutes = require("./routes/reportRoutes");

const app = express();

// Middleware to handle CORS
app.use(
    cors({
        origin: process.env.CLIENT_URL || "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
)

// Middleware to parse JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// connect to the database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/reports', reportRoutes);

// Server upload folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Simple error handler to return cleaner errors for multer and other issues
app.use((err, req, res, next) => {
    console.error(err);
    if (err && err.name === 'MulterError') {
        return res.status(400).json({ message: err.message });
    }
    if (err && err.message && err.message.includes('Invalid file type')) {
        return res.status(400).json({ message: err.message });
    }
    // fallback
    if (res.headersSent) return next(err);
    res.status(500).json({ message: 'Server error', error: err ? err.message : 'unknown' });
});

// Start the server
const PORT = process.env.PORT;
app.listen(PORT, () => { console.log(`Server is running on port ${PORT}`); });