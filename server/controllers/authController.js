const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logAuditEvent } = require('../utils/auditLogger');
const { evaluatePassword } = require('../utils/passwordHealth');

/**
 * Generate JWT containing user ID and role
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      email: user.email
    },
    process.env.JWT_SECRET || 'sv_jwt_sec_9f482a6e03c411ea8a60aa000400fe67ba8921dc8f7e2a9b',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h'
    }
  );
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new employee/admin account
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, masterPassword, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Evaluate master password health
    const health = evaluatePassword(masterPassword, [name, email]);
    if (health.score < 2) {
      return res.status(400).json({
        success: false,
        message: 'Master password is too weak. Please include symbols, mixed case, and numbers.',
        feedback: health
      });
    }

    // Hash master password with salt using bcrypt
    const masterPasswordHash = await User.hashPassword(masterPassword);

    const user = await User.create({
      name,
      email,
      masterPasswordHash,
      role: role && ['employee', 'admin'].includes(role) ? role : 'employee',
      isActive: true
    });

    const token = generateToken(user);

    // Audit log
    await logAuditEvent({
      userId: user._id,
      action: 'register',
      req,
      details: `Account registered with role ${user.role}`
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & issue JWT
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, masterPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or master password.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated by an administrator.'
      });
    }

    const isMatch = await user.comparePassword(masterPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or master password.'
      });
    }

    const token = generateToken(user);

    // Audit log
    await logAuditEvent({
      userId: user._id,
      action: 'login',
      req,
      details: 'User authenticated successfully'
    });

    res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get currently logged in user profile
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        isActive: req.user.isActive,
        createdAt: req.user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe
};
