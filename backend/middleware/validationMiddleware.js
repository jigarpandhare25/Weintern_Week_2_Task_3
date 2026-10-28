const { body, validationResult } = require('express-validator');

// Middleware to check validation results and return formatted response
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg
    }));

    return res.status(400).json({
      success: false,
      message: formattedErrors[0].message,
      errors: formattedErrors
    });
  }
  next();
};

// Validation rules for Registration
const validateRegister = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[^a-zA-Z0-9]/).withMessage('Password must contain at least one special character (!@#$%^&* etc.)'),

  body('fullName')
    .optional()
    .trim()
    .isLength({ max: 60 }).withMessage('Full name cannot exceed 60 characters'),

  handleValidationErrors
];

// Validation rules for Login
const validateLogin = [
  body('identifier')
    .trim()
    .notEmpty().withMessage('Email or username is required'),

  body('password')
    .notEmpty().withMessage('Password is required'),

  handleValidationErrors
];

// Validation rules for Updating Profile
const validateUpdateProfile = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ max: 60 }).withMessage('Full name cannot exceed 60 characters'),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Bio cannot exceed 200 characters'),

  handleValidationErrors
];

// Validation rules for Changing Password
const validateChangePassword = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),

  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters long')
    .matches(/[a-z]/).withMessage('New password must contain at least one lowercase letter')
    .matches(/[A-Z]/).withMessage('New password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('New password must contain at least one number')
    .matches(/[^a-zA-Z0-9]/).withMessage('New password must contain at least one special character'),

  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
  handleValidationErrors
};
