const Credential = require('../../database/models/Credential');
const SharedAccess = require('../../database/models/SharedAccess');
const { encryptPassword, decryptPassword, generateSecurePassword } = require('../utils/crypto');
const { evaluatePassword } = require('../utils/passwordHealth');
const { logAuditEvent } = require('../utils/auditLogger');
const { isCompanyEmail, companyEmailError } = require('../utils/companyConfig');

/**
 * Helper to check user's access rights to a specific credential.
 * Returns { credential, accessLevel: 'owner' | 'edit' | 'view' | null, sharedRecord }
 */
const resolveAccess = async (credentialId, userId) => {
  const credential = await Credential.findById(credentialId);
  if (!credential) {
    return { credential: null, accessLevel: null, sharedRecord: null };
  }

  if (credential.ownerId.toString() === userId.toString()) {
    return { credential, accessLevel: 'owner', sharedRecord: null };
  }

  const shared = await SharedAccess.findOne({
    credentialId,
    sharedWith: userId
  });

  if (shared) {
    return { credential, accessLevel: shared.permission, sharedRecord: shared };
  }

  return { credential, accessLevel: null, sharedRecord: null };
};

/**
 * @route   GET /api/credentials
 * @desc    Get all credentials accessible to user (owned + shared)
 * @access  Private (Employee/Admin for their own credentials)
 */
const getCredentials = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. Fetch credentials owned by user
    const ownedCredentials = await Credential.find({ ownerId: userId })
      .sort({ updatedAt: -1 })
      .lean();

    // 2. Fetch credentials shared with user
    const sharedAccessList = await SharedAccess.find({ sharedWith: userId })
      .populate({
        path: 'credentialId',
        select: '-encryptedPassword -iv -authTag'
      })
      .populate('sharedBy', 'name email')
      .lean();

    // Format owned credentials with sharing summary
    const formattedOwned = await Promise.all(
      ownedCredentials.map(async (cred) => {
        const shares = await SharedAccess.find({ credentialId: cred._id })
          .populate('sharedWith', 'name email')
          .lean();

        // Strip raw crypto attributes
        delete cred.encryptedPassword;
        delete cred.iv;
        delete cred.authTag;

        return {
          ...cred,
          accessLevel: 'owner',
          isOwner: true,
          sharedWith: shares.map((s) => ({
            userId: s.sharedWith?._id,
            name: s.sharedWith?.name,
            email: s.sharedWith?.email,
            permission: s.permission,
            sharedAt: s.createdAt
          }))
        };
      })
    );

    // Format shared credentials
    const formattedShared = sharedAccessList
      .filter((s) => s.credentialId != null) // Guard against dangling references
      .map((s) => {
        const cred = s.credentialId;
        return {
          ...cred,
          accessLevel: s.permission, // 'view' or 'edit'
          isOwner: false,
          sharedBy: {
            id: s.sharedBy?._id,
            name: s.sharedBy?.name,
            email: s.sharedBy?.email
          },
          sharedAt: s.createdAt
        };
      });

    const allAccessible = [...formattedOwned, ...formattedShared];

    res.status(200).json({
      success: true,
      count: allAccessible.length,
      credentials: allAccessible
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/credentials
 * @desc    Create a new encrypted credential
 * @access  Private
 */
const createCredential = async (req, res, next) => {
  try {
    const { title, username, password, url } = req.body;
 
    if (!username || !isCompanyEmail(username)) {
      return res.status(400).json({
        success: false,
        message: `Username must be a valid company email (e.g. name@company.com). ${companyEmailError()}`
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to store credentials.'
      });
    }

    // 1. Calculate password strength
    const health = evaluatePassword(password, [req.user.name, req.user.email, title, username]);

    // 2. Encrypt with AES-256-GCM (fresh IV and auth tag)
    const { encryptedPassword, iv, authTag } = encryptPassword(password);

    // 3. Save to database
    const credential = await Credential.create({
      ownerId: req.user._id,
      title: title.trim(),
      username: username.trim(),
      url: (url || '').trim(),
      encryptedPassword,
      iv,
      authTag,
      strengthScore: health.score,
      lastUpdated: new Date()
    });

    // 4. Audit log entry
    await logAuditEvent({
      userId: req.user._id,
      action: 'create',
      credentialId: credential._id,
      credentialTitle: credential.title,
      req,
      details: `Created credential "${credential.title}" with strength score ${health.score}/4`
    });

    const responseObj = credential.toJSON();
    responseObj.accessLevel = 'owner';
    responseObj.isOwner = true;
    responseObj.sharedWith = [];

    res.status(201).json({
      success: true,
      message: 'Credential encrypted and saved successfully.',
      credential: responseObj
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/credentials/:id
 * @desc    Get single credential metadata & share details
 * @access  Private (Owner or Shared User)
 */
const getCredentialById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { credential, accessLevel } = await resolveAccess(id, req.user._id);

    if (!credential || !accessLevel) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found or access denied.'
      });
    }

    const shares = await SharedAccess.find({ credentialId: credential._id })
      .populate('sharedWith', 'name email')
      .populate('sharedBy', 'name email')
      .lean();

    const responseObj = credential.toJSON();
    responseObj.accessLevel = accessLevel;
    responseObj.isOwner = accessLevel === 'owner';
    responseObj.sharedWith = shares.map((s) => ({
      userId: s.sharedWith?._id,
      name: s.sharedWith?.name,
      email: s.sharedWith?.email,
      permission: s.permission,
      sharedAt: s.createdAt
    }));

    res.status(200).json({
      success: true,
      credential: responseObj
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/credentials/:id/reveal
 * @desc    Decrypt and reveal credential password on demand (writes audit log)
 * @access  Private (Owner or Shared with view/edit)
 */
const revealPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { credential, accessLevel } = await resolveAccess(id, req.user._id);

    if (!credential || !accessLevel) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found or you lack permission to view this password.'
      });
    }

    // Admins cannot view passwords unless they are the owner or explicitly shared
    // Note: resolveAccess already checks ownership and sharedAccess, preventing arbitrary admin reads.

    // Decrypt on-demand using AES-256-GCM
    const decryptedPassword = decryptPassword(
      credential.encryptedPassword,
      credential.iv,
      credential.authTag
    );

    // Audit log entry for password view/reveal
    await logAuditEvent({
      userId: req.user._id,
      action: 'view',
      credentialId: credential._id,
      credentialTitle: credential.title,
      req,
      details: `Revealed password for "${credential.title}" (Access: ${accessLevel})`
    });

    res.status(200).json({
      success: true,
      password: decryptedPassword,
      strengthScore: credential.strengthScore
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/credentials/:id
 * @desc    Update credential fields (title, username, url, password)
 * @access  Private (Owner or Shared with 'edit' permission)
 */
const updateCredential = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, username, password, url } = req.body;

    const { credential, accessLevel } = await resolveAccess(id, req.user._id);

    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found'
      });
    }

    if (accessLevel !== 'owner' && accessLevel !== 'edit') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You have view-only access to this credential.'
      });
    }

    if (title !== undefined) credential.title = title.trim();
    if (username !== undefined) {
      if (!isCompanyEmail(username)) {
        return res.status(400).json({
          success: false,
          message: `Username must be a valid company email (e.g. name@company.com). ${companyEmailError()}`
        });
      }
      credential.username = username.trim();
    }
    if (url !== undefined) credential.url = url.trim();

    // If password changed, re-encrypt with fresh IV and recalculate score
    let passwordUpdated = false;
    if (password) {
      const health = evaluatePassword(password, [
        req.user.name,
        req.user.email,
        credential.title,
        credential.username
      ]);
      const enc = encryptPassword(password);
      credential.encryptedPassword = enc.encryptedPassword;
      credential.iv = enc.iv;
      credential.authTag = enc.authTag;
      credential.strengthScore = health.score;
      passwordUpdated = true;
    }

    credential.lastUpdated = new Date();
    await credential.save();

    // Audit log
    await logAuditEvent({
      userId: req.user._id,
      action: 'edit',
      credentialId: credential._id,
      credentialTitle: credential.title,
      req,
      details: `Updated credential "${credential.title}". Password updated: ${passwordUpdated}`
    });

    const responseObj = credential.toJSON();
    responseObj.accessLevel = accessLevel;
    responseObj.isOwner = accessLevel === 'owner';

    res.status(200).json({
      success: true,
      message: 'Credential updated successfully.',
      credential: responseObj
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/credentials/:id
 * @desc    Delete credential and purge all shared access links
 * @access  Private (Owner only)
 */
const deleteCredential = async (req, res, next) => {
  try {
    const { id } = req.params;
    const credential = await Credential.findById(id);

    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Credential not found.'
      });
    }

    // Only owner can delete credential
    if (credential.ownerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Only the credential owner can delete it.'
      });
    }

    const titleSnapshot = credential.title;

    // 1. Delete associated SharedAccess links
    await SharedAccess.deleteMany({ credentialId: credential._id });

    // 2. Delete the credential itself
    await Credential.findByIdAndDelete(credential._id);

    // 3. Audit log
    await logAuditEvent({
      userId: req.user._id,
      action: 'delete',
      credentialId: credential._id,
      credentialTitle: titleSnapshot,
      req,
      details: `Deleted credential "${titleSnapshot}" and revoked all shared access links`
    });

    res.status(200).json({
      success: true,
      message: 'Credential deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/credentials/generate
 * @desc    Generate cryptographically strong password
 * @access  Private
 */
const generatePassword = async (req, res, next) => {
  try {
    const { length, uppercase, lowercase, numbers, symbols } = req.body;
    const generated = generateSecurePassword({
      length: Number(length) || 16,
      uppercase: uppercase !== false,
      lowercase: lowercase !== false,
      numbers: numbers !== false,
      symbols: symbols !== false
    });

    const health = evaluatePassword(generated);

    res.status(200).json({
      success: true,
      password: generated,
      score: health.score,
      label: health.label,
      crackTimeDisplay: health.crackTimeDisplay
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCredentials,
  createCredential,
  getCredentialById,
  revealPassword,
  updateCredential,
  deleteCredential,
  generatePassword
};
