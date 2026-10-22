const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  getAdminHealth,
  getAdminDashboard,
  getAdminAudit
} = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');

// All admin routes strictly enforce JWT authentication + Admin role RBAC
router.use(authenticateToken);
router.use(requireAdmin);

// Dashboard overview
router.get('/dashboard', getAdminDashboard);

// Organisation health (Zero-knowledge: counts and scores only, no passwords)
router.get('/health', getAdminHealth);

// User management
router.get('/users', getAllUsers);
router.patch('/users/:id/status', updateUserStatus);
router.patch('/users/:id/role', updateUserRole);

// Audit logs with filters and CSV export
router.get('/audit', getAdminAudit);

module.exports = router;
