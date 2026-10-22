const { body, param, validationResult } = require('express-validator');

/**
 * Interceptor to evaluate validation errors and return structured 400 response.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg);
    return res.status(400).json({
      success: false,
      message: errorMessages.join('; '),
      errors: errors.array()
    });
  }
  next();
};

const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters long'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('A valid email address is required'),
  body('masterPassword')
    .isLength({ min: 8 })
    .withMessage('Master password must be at least 8 characters long'),
  body('role')
    .optional()
    .isIn(['employee', 'admin'])
    .withMessage('Role must be employee or admin'),
  handleValidationErrors
];

const { isCompanyEmail, companyEmailError } = require('../utils/companyConfig');

const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('A valid email address is required')
    .custom((value) => {
      if (!isCompanyEmail(value)) {
        throw new Error(companyEmailError());
      }
      return true;
    }),
  body('masterPassword')
    .notEmpty()
    .withMessage('Master password is required'),
  handleValidationErrors
];

const credentialValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Credential title is required'),
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username or account ID is required'),
  body('password')
    .notEmpty()
    .withMessage('Password value is required for encryption'),
  body('url')
    .optional()
    .trim(),
  handleValidationErrors
];

const credentialUpdateValidation = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Credential title cannot be empty'),
  body('username')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Username cannot be empty'),
  body('password')
    .optional()
    .notEmpty()
    .withMessage('Password cannot be empty if provided'),
  body('url')
    .optional()
    .trim(),
  handleValidationErrors
];

const shareValidation = [
  body('sharedWith')
    .isMongoId()
    .withMessage('A valid recipient employee ID is required'),
  body('permission')
    .optional()
    .isIn(['view', 'edit'])
    .withMessage('Permission must be either "view" or "edit"'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  registerValidation,
  loginValidation,
  credentialValidation,
  credentialUpdateValidation,
  shareValidation
};
