// Import Notice model
const Notice = require('../models/Notice');

// @desc    Get all notices
// @route   GET /api/notices
// @access  Private
exports.getNotices = async (req, res) => {
  try {
    // Find all notices, sorted by postedDate in descending order (latest first)
    const notices = await Notice.find().sort({ postedDate: -1 });

    res.status(200).json({
      success: true,
      count: notices.length,
      notices
    });
  } catch (error) {
    console.error('Fetch Notices Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error fetching notices' });
  }
};

// @desc    Create a new company notice
// @route   POST /api/notices
// @access  Private (Admin only)
exports.createNotice = async (req, res) => {
  try {
    const { title, content, category, icon } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({ success: false, message: 'Title, content, and category are required' });
    }

    const notice = await Notice.create({
      title: title.trim(),
      content: content.trim(),
      category: category.trim(),
      icon: icon || '📢',
      postedDate: new Date()
    });

    if (global.io) {
      global.io.emit('notice_update');
    }

    res.status(201).json({
      success: true,
      message: 'Notice posted successfully',
      notice
    });
  } catch (error) {
    console.error('Create Notice Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error creating notice' });
  }
};

// @desc    Delete a notice by ID
// @route   DELETE /api/notices/:id
// @access  Private (Admin only)
exports.deleteNotice = async (req, res) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    await Notice.findByIdAndDelete(req.params.id);

    if (global.io) {
      global.io.emit('notice_update');
    }

    res.status(200).json({
      success: true,
      message: 'Notice deleted successfully'
    });
  } catch (error) {
    console.error('Delete Notice Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error deleting notice' });
  }
};
