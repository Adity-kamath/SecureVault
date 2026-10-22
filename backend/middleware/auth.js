const jwt = require('jsonwebtoken');
const User = require('../../database/models/User');

/**
 * Authentication middleware to verify JWT token and attach active user to request.
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authorization token provided.'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Malformed token.'
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'sv_jwt_sec_9f482a6e03c411ea8a60aa000400fe67ba8921dc8f7e2a9b'
    );

    const user = await User.findById(decoded.id).select('-masterPasswordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Session invalid. User account does not exist.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact an administrator.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid or forged authentication token.'
    });
  }
};

module.exports = {
  authenticateToken
};
