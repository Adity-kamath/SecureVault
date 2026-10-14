const Credential = require('../models/Credential');
const SharedAccess = require('../models/SharedAccess');
const User = require('../models/User');
const { logAuditEvent } = require('../utils/auditLogger');

/**
 * @route   POST /api/credentials/:id/share
 * @desc    Share a credential with a named employee with 'view' or 'edit' permission
 * @access  Private (Owner only)
 */
const shareCredential = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sharedWith, permission = 'view' } = req.body;

    if (!sharedWith) {
      return res.status(400).json({
        success: false,
        message: 'Recipient user ID (sharedWith) is required'
      });
    }

    if (!['view', 'edit'].includes(permission)) {
      return res.status(400).json({
        success: false,
        message: 'Permission must be either "view" or "edit"'
      });
    }

    // 1. Validate credential existence and verify current user is owner
    const credential = await Credential.findById(id);
    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found'
      });
    }

    if (credential.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the credential owner can share it with colleagues'
      });
    }

    // 2. Prevent self-sharing
    if (sharedWith.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot share a credential with yourself'
      });
    }

    // 3. Verify recipient employee exists and is active
    const recipient = await User.findById(sharedWith);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient employee not found'
      });
    }

    if (!recipient.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Cannot share credentials with a deactivated employee account'
      });
    }

    // 4. Create or update existing SharedAccess link
    let sharedAccess = await SharedAccess.findOne({
      credentialId: credential._id,
      sharedWith: recipient._id
    });

    const isUpdate = !!sharedAccess;

    if (sharedAccess) {
      sharedAccess.permission = permission;
      await sharedAccess.save();
    } else {
      sharedAccess = await SharedAccess.create({
        credentialId: credential._id,
        sharedWith: recipient._id,
        sharedBy: req.user._id,
        permission
      });
    }

    // 5. Audit log entry
    await logAuditEvent({
      userId: req.user._id,
      action: 'share',
      credentialId: credential._id,
      credentialTitle: credential.title,
      req,
      details: `${isUpdate ? 'Updated permission to' : 'Shared with'} ${recipient.name} (${recipient.email}) with "${permission}" access`
    });

    // Retrieve full updated sharing list for UI reactivity
    const allShares = await SharedAccess.find({ credentialId: credential._id })
      .populate('sharedWith', 'name email role')
      .lean();

    res.status(200).json({
      success: true,
      message: `Credential successfully shared with ${recipient.name} (${permission} permission).`,
      sharedAccess: {
        id: sharedAccess._id,
        credentialId: credential._id,
        sharedWith: {
          id: recipient._id,
          name: recipient.name,
          email: recipient.email
        },
        permission: sharedAccess.permission,
        createdAt: sharedAccess.createdAt
      },
      currentShares: allShares.map((s) => ({
        userId: s.sharedWith?._id,
        name: s.sharedWith?.name,
        email: s.sharedWith?.email,
        permission: s.permission,
        sharedAt: s.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/credentials/:id/share/:userId
 * @desc    Revoke shared access for a specific employee
 * @access  Private (Owner only)
 */
const revokeShare = async (req, res, next) => {
  try {
    const { id, userId } = req.params;

    // 1. Verify credential existence and ownership
    const credential = await Credential.findById(id);
    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found'
      });
    }

    if (credential.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the credential owner can revoke sharing'
      });
    }

    // 2. Find and delete the SharedAccess link
    const sharedRecord = await SharedAccess.findOneAndDelete({
      credentialId: credential._id,
      sharedWith: userId
    }).populate('sharedWith', 'name email');

    if (!sharedRecord) {
      return res.status(404).json({
        success: false,
        message: 'This credential was not shared with the specified employee'
      });
    }

    const recipientName = sharedRecord.sharedWith?.name || 'Colleague';
    const recipientEmail = sharedRecord.sharedWith?.email || userId;

    // 3. Audit log entry
    await logAuditEvent({
      userId: req.user._id,
      action: 'revoke',
      credentialId: credential._id,
      credentialTitle: credential.title,
      req,
      details: `Revoked access for ${recipientName} (${recipientEmail})`
    });

    res.status(200).json({
      success: true,
      message: `Revoked access for ${recipientName}. The credential itself remains intact.`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/credentials/:id/share
 * @desc    Get all employees with access to this credential
 * @access  Private (Owner or Shared User)
 */
const getCredentialShares = async (req, res, next) => {
  try {
    const { id } = req.params;

    const shares = await SharedAccess.find({ credentialId: id })
      .populate('sharedWith', 'name email')
      .populate('sharedBy', 'name email')
      .lean();

    res.status(200).json({
      success: true,
      count: shares.length,
      shares: shares.map((s) => ({
        id: s._id,
        userId: s.sharedWith?._id,
        name: s.sharedWith?.name,
        email: s.sharedWith?.email,
        permission: s.permission,
        sharedBy: s.sharedBy?.name,
        createdAt: s.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/credentials/colleagues/active
 * @desc    Get active colleagues list to populate the Share Dialog
 * @access  Private
 */
const getActiveColleagues = async (req, res, next) => {
  try {
    const colleagues = await User.find({
      _id: { $ne: req.user._id },
      isActive: true
    })
      .select('name email role')
      .sort({ name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      colleagues: colleagues.map((c) => ({
        id: c._id,
        name: c.name,
        email: c.email,
        role: c.role
      }))
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  shareCredential,
  revokeShare,
  getCredentialShares,
  getActiveColleagues
};
