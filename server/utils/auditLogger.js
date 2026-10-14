const AuditLog = require('../models/AuditLog');

/**
 * Creates an immutable audit log entry for security and compliance tracking.
 *
 * @param {object} params
 * @param {string|mongoose.Types.ObjectId} params.userId - Initiating user ID
 * @param {string} params.action - One of view, create, edit, share, revoke, delete, login, register, status_change, role_change
 * @param {string|mongoose.Types.ObjectId} [params.credentialId] - Affected credential (if any)
 * @param {string} [params.credentialTitle] - Title snapshot for posterity
 * @param {import('express').Request} [params.req] - Express request object for IP resolution
 * @param {string} [params.details] - Additional contextual info
 */
const logAuditEvent = async ({
  userId,
  action,
  credentialId = null,
  credentialTitle = '',
  req = null,
  details = ''
}) => {
  try {
    let ipAddress = '127.0.0.1';
    if (req) {
      ipAddress =
        req.headers['x-forwarded-for']?.split(',')[0].trim() ||
        req.socket?.remoteAddress ||
        req.ip ||
        '127.0.0.1';
    }

    await AuditLog.create({
      userId,
      action,
      credentialId,
      credentialTitle,
      ipAddress,
      details,
      timestamp: new Date()
    });
  } catch (err) {
    // Audit failure shouldn't crash the main user request, but must be logged to stderr
    console.error(`[Audit Log Failure] Failed to record event "${action}":`, err.message);
  }
};

module.exports = {
  logAuditEvent
};
