const AuditLog = require('../models/AuditLog');

/**
 * Utility to log administrative operations
 * @param {string} actorId - User ID of the action taker
 * @param {string} action - Action identifier (e.g. ROLE_CHANGE)
 * @param {string} details - Detailed descriptive message
 * @param {Object} req - Express request object (optional, used to parse IP)
 */
const logAudit = async (actorId, action, details, req = null) => {
  try {
    let ip = '';
    if (req) {
      ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    }
    await AuditLog.create({
      actor: actorId,
      action,
      details,
      ipAddress: ip
    });
  } catch (err) {
    console.error('Audit Logging Failed:', err.message);
  }
};

module.exports = { logAudit };
