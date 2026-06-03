// Import multer for file handling and path for resolving extensions
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure 'uploads' directory exists before configuring storage
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up storage engine
const storage = multer.diskStorage({
  // Specify where to save the files on the server
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  // Generate a unique filename using timestamp and field name
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filter for Avatar Images (Only allow JPG, JPEG, and PNG)
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  // Check extension and mime type
  const extMatch = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeMatch = allowedTypes.test(file.mimetype);

  if (extMatch && mimeMatch) {
    cb(null, true); // Accept file
  } else {
    cb(new Error('Only JPG, JPEG, and PNG image files are allowed!'), false); // Reject file
  }
};

// Filter for Documents (Allow PDF, DOC, DOCX, and images)
const docFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|jpeg|jpg|png/;
  const extMatch = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeMatch = allowedTypes.test(file.mimetype) || file.mimetype === 'application/msword' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  if (extMatch || mimeMatch) {
    cb(null, true); // Accept file
  } else {
    cb(new Error('Only PDF, DOC, DOCX, and image files are allowed!'), false); // Reject file
  }
};

// Initialize multer upload middleware instances
const uploadAvatar = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // Limit avatar files to 2MB
});

const uploadDocument = multer({
  storage: storage,
  fileFilter: docFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Limit documents to 5MB
});

// Export the upload utilities
module.exports = { uploadAvatar, uploadDocument };
