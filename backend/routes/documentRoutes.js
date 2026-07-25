// Import Express router
const express = require('express');
const router = express.Router();

// Import Document controller methods
const {
  getDocuments,
  uploadDocument,
  deleteDocument,
  getAllDocuments,
  verifyDocument
} = require('../controllers/documentController');

// Import Auth protection middleware and Multer document uploader middleware
const { protect, authorize, requireActiveShift } = require('../middleware/authMiddleware');
const { uploadDocument: docUploader } = require('../middleware/uploadMiddleware');

// All document locker routes require authentication and an active shift check-in
router.use(protect);
router.use(requireActiveShift);

router.get('/', getDocuments);             // Get uploaded documents list
router.post('/', docUploader.single('document'), uploadDocument); // Upload a file
router.delete('/:id', deleteDocument);     // Delete file from server & DB

// HR/Admin specific verification routes
router.get('/all', authorize('admin', 'hr'), getAllDocuments); // Get all uploaded docs globally
router.put('/:id/status', authorize('admin', 'hr'), verifyDocument); // Verify status of doc

// Export router
module.exports = router;
