const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ensure uploads directory exists (absolute path)
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// configure storage for uploaded files (use absolute path)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

// file filter to allow only images
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        // pass a clear error so the global error handler can return JSON
        cb(new Error('Invalid file type. Only JPEG, PNG and JPG are allowed.'));
    }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;