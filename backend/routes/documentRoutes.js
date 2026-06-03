// Import Express router
const express = require('express');
const router = express.Router();

// Import Document controller methods
const {
  getDocuments,
  uploadDocument,
  deleteDocument
} = require('../controllers/documentController');

// Import Auth protection middleware and Multer document uploader middleware
const { protect } = require('../middleware/authMiddleware');
const { uploadDocument: docUploader } = require('../middleware/uploadMiddleware');

// All document locker routes require authentication
router.get('/', protect, getDocuments);             // Get uploaded documents list
router.post('/', protect, docUploader.single('document'), uploadDocument); // Upload a file
router.delete('/:id', protect, deleteDocument);     // Delete file from server & DB

// Export router
module.exports = router;
