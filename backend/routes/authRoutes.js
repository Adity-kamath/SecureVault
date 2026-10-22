const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { registerValidation, loginValidation } = require('../middleware/validate');
const { authenticateToken } = require('../middleware/auth');

// Public authentication routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Protected profile route
router.get('/me', authenticateToken, getMe);

module.exports = router;
