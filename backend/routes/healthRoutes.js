const express = require('express');
const router = express.Router();
const { getMyHealth } = require('../controllers/healthController');
const { authenticateToken } = require('../middleware/auth');

// Employee password health evaluation
router.get('/me', authenticateToken, getMyHealth);

module.exports = router;
