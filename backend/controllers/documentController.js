// Import Document model, file system modules to clean files on delete
const Document = require('../models/Document');
const fs = require('fs');
const path = require('path');

// @desc    Get all documents for the logged-in employee
// @route   GET /api/documents
// @access  Private
exports.getDocuments = async (req, res) => {
  try {
    // Find all files belonging to the employee, latest uploaded first
    const documents = await Document.find({ employee: req.user.id }).sort({ uploadedAt: -1 });

    res.status(200).json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    console.error('Fetch Documents Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching documents list' });
  }
};

// @desc    Upload a new employee document
// @route   POST /api/documents
// @access  Private
exports.uploadDocument = async (req, res) => {
  try {
    const { title } = req.body;

    // Check if title is supplied
    if (!title) {
      // If a file was uploaded by multer, clean it up before returning error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ success: false, message: 'Please add a title for this document' });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a document file' });
    }

    // Generate local path url (e.g. "/uploads/document-12345.pdf")
    const fileUrl = `/uploads/${req.file.filename}`;

    // Create the document record in MongoDB
    const document = await Document.create({
      employee: req.user.id,
      title: title.trim(),
      fileUrl,
      fileType: req.file.mimetype
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      document
    });
  } catch (error) {
    console.error('Upload Document Error:', error.message);
    // If a file was saved by multer, clean it up upon server error
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Cleanup Upload Error:', err.message);
      }
    }
    res.status(500).json({ success: false, message: 'Server error uploading document' });
  }
};

// @desc    Delete a document from database and server storage
// @route   DELETE /api/documents/:id
// @access  Private
exports.deleteDocument = async (req, res) => {
  try {
    const docId = req.params.id;

    // Find the document record in database
    const document = await Document.findById(docId);
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Verify ownership: employee can only delete their own documents
    if (document.employee.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this document' });
    }

    // Resolve physical path on the server
    const fileName = path.basename(document.fileUrl);
    const filePath = path.join(__dirname, '../uploads', fileName);

    // Physically delete file from disk if it exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete record from MongoDB
    await Document.findByIdAndDelete(docId);

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete Document Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error deleting document' });
  }
};
