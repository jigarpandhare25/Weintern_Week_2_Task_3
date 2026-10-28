const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RevokedToken = require('../models/RevokedToken');

// Middleware to protect routes via JWT verification
const authenticate = async (req, res, next) => {
  try {
    let token;

    // 1. Check for token in Authorization Bearer header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } 
    // 2. Fallback to HttpOnly cookie if present
    else if (req.cookies && req.cookies.jwt_token) {
      token = req.cookies.jwt_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided. Please log in.'
      });
    }

    // 3. Check if token was revoked (user logged out)
    const isRevoked = await RevokedToken.findOne({ token });
    if (isRevoked) {
      return res.status(401).json({
        success: false,
        message: 'Session has been invalidated or logged out. Please log in again.'
      });
    }

    // 4. Verify token validity and expiration
    const secret = process.env.JWT_SECRET || 'fallback_secret_key_weintern_auth';
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Authentication token has expired. Please log in again.',
          isExpired: true
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid or malformed authentication token.'
      });
    }

    // 5. Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.'
      });
    }

    // Attach user and token context to request object
    req.user = user;
    req.token = token;
    req.tokenPayload = decoded;
    next();
  } catch (error) {
    console.error('[Auth Middleware Error]:', error);
    res.status(500).json({
      success: false,
      message: 'Internal authentication server error.'
    });
  }
};

// Middleware to restrict access based on user role (e.g. 'admin')
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user ? req.user.role : 'guest'}' does not have permission.`
      });
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorizeRoles
};
