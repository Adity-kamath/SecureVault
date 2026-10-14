const crypto = require('crypto');
const User = require('../models/User');
const Credential = require('../models/Credential');
const SharedAccess = require('../models/SharedAccess');
const AuditLog = require('../models/AuditLog');
const { decryptPassword } = require('../utils/crypto');
const { logAuditEvent } = require('../utils/auditLogger');

/**
 * @route   GET /api/admin/users
 * @desc    Get all employees and admins with credential count and active status
 * @access  Private (Admin only)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select('-masterPasswordHash')
      .sort({ createdAt: -1 });

    const userStats = await Promise.all(
      users.map(async (u) => {
        const credentialCount = await Credential.countDocuments({ ownerId: u._id });
        const sharedAccessCount = await SharedAccess.countDocuments({ sharedWith: u._id });

        return {
          id: u._id,
          name: u.name,
          email: u.email,
          role: u.role,
          isActive: u.isActive,
          createdAt: u.createdAt,
          credentialsCount: credentialCount,
          sharedAccessCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: userStats.length,
      users: userStats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/admin/users/:id/status
 * @desc    Activate or deactivate user. Deactivating revokes all shared access.
 * @access  Private (Admin only)
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive boolean flag is required'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found'
      });
    }

    if (user._id.toString() === req.user._id.toString() && !isActive) {
      return res.status(400).json({
        success: false,
        message: 'Admins cannot deactivate their own account.'
      });
    }

    user.isActive = isActive;
    await user.save();

    let revokedSharesCount = 0;
    if (!isActive) {
      const result = await SharedAccess.deleteMany({ sharedWith: user._id });
      revokedSharesCount = result.deletedCount;
    }

    await logAuditEvent({
      userId: req.user._id,
      action: 'status_change',
      req,
      details: `${isActive ? 'Activated' : 'Deactivated'} user ${user.email}. Revoked ${revokedSharesCount} shared access grants.`
    });

    res.status(200).json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      },
      revokedSharesCount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/admin/users/:id/role
 * @desc    Change user role (employee <-> admin)
 * @access  Private (Admin only)
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['employee', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be either "employee" or "admin"'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found'
      });
    }

    const previousRole = user.role;
    user.role = role;
    await user.save();

    await logAuditEvent({
      userId: req.user._id,
      action: 'role_change',
      req,
      details: `Changed role of ${user.email} from ${previousRole} to ${role}`
    });

    res.status(200).json({
      success: true,
      message: `User role changed to ${role}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper to compute org health metrics safely.
 * NOTE: Admins NEVER receive credential passwords or plain text values.
 * Only aggregate counts and percentages are returned.
 */
const computeOrgHealthMetrics = async () => {
  const credentials = await Credential.find().lean();
  const totalEmployees = await User.countDocuments({ isActive: true });

  if (credentials.length === 0) {
    return {
      totalEmployees,
      totalCredentials: 0,
      overallHealthScore: 100,
      needAttentionCount: 0,
      weakCount: 0,
      reusedCount: 0,
      oldCount: 0,
      distribution: {
        veryWeak: 0,
        weak: 0,
        fair: 0,
        strong: 0,
        veryStrong: 0
      }
    };
  }

  const now = Date.now();
  const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

  const hashes = new Map();
  let weakCount = 0;
  let oldCount = 0;
  const distribution = {
    veryWeak: 0,
    weak: 0,
    fair: 0,
    strong: 0,
    veryStrong: 0
  };

  const labels = ['veryWeak', 'weak', 'fair', 'strong', 'veryStrong'];

  for (const cred of credentials) {
    // Tally distribution
    const score = Math.max(0, Math.min(4, cred.strengthScore || 0));
    distribution[labels[score]]++;

    if (score < 3) weakCount++;

    const updated = new Date(cred.lastUpdated || cred.updatedAt || cred.createdAt).getTime();
    if (now - updated > NINETY_DAYS_MS) {
      oldCount++;
    }

    // Hash without exposing password
    try {
      const dec = decryptPassword(cred.encryptedPassword, cred.iv, cred.authTag);
      const hash = crypto.createHash('sha256').update(dec).digest('hex');
      hashes.set(hash, (hashes.get(hash) || 0) + 1);
    } catch {
      // Ignore decryption failure for stats
    }
  }

  let reusedCount = 0;
  for (const count of hashes.values()) {
    if (count > 1) {
      reusedCount += count;
    }
  }

  // Calculate Org Health Score (0-100)
  // Base from average strength score (0-4 => 0-100)
  const avgStrength = credentials.reduce((sum, c) => sum + (c.strengthScore || 0), 0) / credentials.length;
  let overallHealthScore = Math.round(avgStrength * 25);

  // Penalize for reuse and aging
  const reuseRatio = reusedCount / credentials.length;
  const oldRatio = oldCount / credentials.length;
  overallHealthScore = Math.max(10, Math.round(overallHealthScore - (reuseRatio * 25) - (oldRatio * 15)));

  const needAttentionCount = Math.min(
    credentials.length,
    weakCount + Math.floor(reusedCount / 2) + oldCount
  );

  return {
    totalEmployees,
    totalCredentials: credentials.length,
    overallHealthScore,
    needAttentionCount,
    weakCount,
    reusedCount,
    oldCount,
    distribution
  };
};

/**
 * @route   GET /api/admin/health
 * @desc    Get organisation-wide health statistics (Zero-knowledge: NO passwords or titles)
 * @access  Private (Admin only)
 */
const getAdminHealth = async (req, res, next) => {
  try {
    const metrics = await computeOrgHealthMetrics();
    res.status(200).json({
      success: true,
      metrics
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get dashboard totals, risk categories, and live activity feed
 * @access  Private (Admin only)
 */
const getAdminDashboard = async (req, res, next) => {
  try {
    const metrics = await computeOrgHealthMetrics();

    // Recent 10 audit logs with populated user
    const recentActivity = await AuditLog.find()
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    res.status(200).json({
      success: true,
      dashboard: {
        stats: {
          employees: metrics.totalEmployees,
          credentials: metrics.totalCredentials,
          orgHealthScore: metrics.overallHealthScore,
          needAttention: metrics.needAttentionCount
        },
        issues: {
          weak: metrics.weakCount,
          reused: metrics.reusedCount,
          old: metrics.oldCount
        },
        recentActivity: recentActivity.map((log) => ({
          id: log._id,
          user: {
            id: log.userId?._id,
            name: log.userId?.name || 'Unknown User',
            email: log.userId?.email || 'N/A',
            role: log.userId?.role || 'employee'
          },
          action: log.action,
          credentialTitle: log.credentialTitle || '—',
          timestamp: log.timestamp,
          ipAddress: log.ipAddress,
          details: log.details
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/admin/audit
 * @desc    Get filterable audit logs (by user, action, date range) with CSV export
 * @access  Private (Admin only)
 */
const getAdminAudit = async (req, res, next) => {
  try {
    const { user, action, dateRange, export: exportFormat } = req.query;

    const query = {};

    // Filter by User
    if (user && user !== 'all') {
      query.userId = user;
    }

    // Filter by Action
    if (action && action !== 'all') {
      query.action = action.toLowerCase();
    }

    // Filter by Date Range
    if (dateRange && dateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();
      if (dateRange === '7d' || dateRange === 'Last 7 days') {
        startDate.setDate(now.getDate() - 7);
      } else if (dateRange === '30d' || dateRange === 'Last 30 days') {
        startDate.setDate(now.getDate() - 30);
      } else if (dateRange === '90d' || dateRange === 'Last 90 days') {
        startDate.setDate(now.getDate() - 90);
      }
      query.timestamp = { $gte: startDate };
    }

    const logs = await AuditLog.find(query)
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 })
      .limit(exportFormat === 'csv' ? 2000 : 200)
      .lean();

    // If export=csv requested, generate and stream CSV attachment
    if (exportFormat === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="securevault-audit-log.csv"');

      const headers = ['Timestamp', 'User Name', 'User Email', 'Action', 'Credential', 'IP Address', 'Details'];
      const rows = logs.map((log) => [
        `"${new Date(log.timestamp).toISOString()}"`,
        `"${log.userId?.name || 'Unknown'}"`,
        `"${log.userId?.email || 'Unknown'}"`,
        `"${log.action.toUpperCase()}"`,
        `"${(log.credentialTitle || '').replace(/"/g, '""')}"`,
        `"${log.ipAddress || ''}"`,
        `"${(log.details || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      return res.send(csvContent);
    }

    res.status(200).json({
      success: true,
      count: logs.length,
      logs: logs.map((log) => ({
        id: log._id,
        user: {
          id: log.userId?._id,
          name: log.userId?.name || 'Unknown User',
          email: log.userId?.email || 'N/A',
          role: log.userId?.role || 'employee'
        },
        action: log.action,
        credentialTitle: log.credentialTitle || '—',
        timestamp: log.timestamp,
        ipAddress: log.ipAddress,
        details: log.details
      }))
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  getAdminHealth,
  getAdminDashboard,
  getAdminAudit
};
