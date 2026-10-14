/**
 * Role-Based Access Control (RBAC) middleware factory.
 * Enforces role restrictions on protected endpoints.
 *
 * @param {string[]} allowedRoles - Roles permitted to access the route
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required prior to role verification.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: This resource requires one of [${allowedRoles.join(', ')}] permissions.`
      });
    }

    next();
  };
};

const requireAdmin = requireRole('admin');

module.exports = {
  requireRole,
  requireAdmin
};
