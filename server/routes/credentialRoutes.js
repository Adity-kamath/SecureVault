const express = require('express');
const router = express.Router();
const {
  getCredentials,
  createCredential,
  getCredentialById,
  revealPassword,
  updateCredential,
  deleteCredential,
  generatePassword
} = require('../controllers/credentialController');
const {
  shareCredential,
  revokeShare,
  getCredentialShares,
  getActiveColleagues
} = require('../controllers/shareController');
const { authenticateToken } = require('../middleware/auth');
const {
  credentialValidation,
  credentialUpdateValidation,
  shareValidation
} = require('../middleware/validate');

// All credential routes require authentication
router.use(authenticateToken);

// Colleagues list for sharing dropdown (placed before /:id)
router.get('/colleagues/active', getActiveColleagues);

// List and create
router.get('/', getCredentials);
router.post('/', credentialValidation, createCredential);

// Password generator
router.post('/generate', generatePassword);

// Sharing endpoints
router.get('/:id/share', getCredentialShares);
router.post('/:id/share', shareValidation, shareCredential);
router.delete('/:id/share/:userId', revokeShare);

// Individual credential operations
router.get('/:id', getCredentialById);
router.get('/:id/reveal', revealPassword);
router.put('/:id', credentialUpdateValidation, updateCredential);
router.delete('/:id', deleteCredential);

module.exports = router;
