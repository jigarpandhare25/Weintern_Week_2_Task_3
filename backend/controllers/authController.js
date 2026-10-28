const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RevokedToken = require('../models/RevokedToken');

// Helper to generate token, set HttpOnly cookie, and send standard response
const sendTokenResponse = (user, statusCode, res, message) => {
  const token = user.generateAuthToken();

  const cookieOptions = {
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    httpOnly: true, // Prevents client-side script access (XSS mitigation)
    secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
    sameSite: 'lax' // CSRF mitigation
  };

  res
    .status(statusCode)
    .cookie('jwt_token', token, cookieOptions)
    .json({
      success: true,
      message,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        bio: user.bio,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { username, email, password, fullName, role } = req.body;

    // Check if user already exists with given email or username
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
        errors: [{ field: 'email', message: 'Email is already registered' }]
      });
    }

    const existingUsername = await User.findOne({ username: username.toLowerCase() });
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: 'This username is already taken. Please choose another.',
        errors: [{ field: 'username', message: 'Username is already taken' }]
      });
    }

    // Create user record (Password hashing handled automatically by User model pre-save hook)
    const user = await User.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      fullName: fullName ? fullName.trim() : '',
      role: role === 'admin' ? 'admin' : 'user'
    });

    sendTokenResponse(user, 201, res, 'User account registered successfully.');
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user and get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;

    const cleanIdentifier = identifier.trim().toLowerCase();

    // Find user by email or username, explicitly selecting the password field
    const user = await User.findOne({
      $or: [{ email: cleanIdentifier }, { username: cleanIdentifier }]
    }).select('+password');

    // Generic error message prevents username/email harvesting
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password.'
      });
    }

    // Verify candidate password with bcrypt
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password.'
      });
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res, 'Login successful.');
  } catch (error) {
    next(error);
  }
};

// @desc    Log user out / Invalidate session token
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  try {
    let token = req.token;

    // Fallback check if token is in header/cookies
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (!token && req.cookies && req.cookies.jwt_token) {
      token = req.cookies.jwt_token;
    }

    if (token) {
      try {
        const decoded = jwt.decode(token);
        const expiresAt = decoded && decoded.exp 
          ? new Date(decoded.exp * 1000) 
          : new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Record token in blacklist so it can never be reused
        await RevokedToken.findOneAndUpdate(
          { token },
          {
            token,
            userId: req.user ? req.user._id : decoded.id,
            expiresAt
          },
          { upsert: true }
        );
      } catch (tokenErr) {
        console.warn('[Logout Token Revocation Warning]:', tokenErr.message);
      }
    }

    // Clear the HttpOnly cookie
    res.clearCookie('jwt_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    res.status(200).json({
      success: true,
      message: 'Successfully logged out and session revoked.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently logged in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user
  });
};

module.exports = {
  register,
  login,
  logout,
  getMe
};
