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
const { protect, requireActiveShift } = require('../middleware/authMiddleware');
const { uploadDocument: docUploader } = require('../middleware/uploadMiddleware');

// All document locker routes require authentication and an active shift check-in
router.use(protect);
router.use(requireActiveShift);

router.get('/', getDocuments);             // Get uploaded documents list
router.post('/', docUploader.single('document'), uploadDocument); // Upload a file
router.delete('/:id', deleteDocument);     // Delete file from server & DB

// Export router
module.exports = router;
