const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const {
  register,
  login,
  logout,
  getMe
} = require('../controllers/authController');

const {
  validateRegister,
  validateLogin
} = require('../middleware/validationMiddleware');

const { authenticate } = require('../middleware/authMiddleware');

// Rate limiting for auth endpoints (prevents brute-force credential stuffing)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes.'
  }
});

// Authentication Routes
router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);

module.exports = router;
