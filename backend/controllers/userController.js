const User = require('../models/User');

// @desc    Get protected dashboard statistics and session details
// @route   GET /api/protected/dashboard
// @access  Private
const getDashboardData = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const tokenExp = req.tokenPayload ? new Date(req.tokenPayload.exp * 1000) : null;
    const tokenIat = req.tokenPayload ? new Date(req.tokenPayload.iat * 1000) : null;

    res.status(200).json({
      success: true,
      message: 'Access granted to protected dashboard resources.',
      data: {
        user: req.user,
        session: {
          authenticated: true,
          authMethod: req.headers.authorization ? 'Bearer Token (Header)' : 'HttpOnly Cookie',
          issuedAt: tokenIat,
          expiresAt: tokenExp,
          remainingSeconds: tokenExp ? Math.max(0, Math.floor((tokenExp - Date.now()) / 1000)) : null
        },
        systemStats: {
          totalRegisteredUsers: totalUsers,
          serverTime: new Date(),
          uptime: `${Math.floor(process.uptime())} seconds`,
          nodeVersion: process.version,
          environment: process.env.NODE_ENV || 'development'
        },
        securityInsights: [
          { status: 'secure', label: 'Password Encryption', detail: 'bcrypt (12 salt rounds)' },
          { status: 'secure', label: 'Session Integrity', detail: 'JWT with cryptographic signature' },
          { status: 'secure', label: 'Transport Security', detail: 'HttpOnly cookie + Bearer header support' },
          { status: 'secure', label: 'Token Revocation', detail: 'Server-side blacklist on logout' }
        ]
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update authenticated user profile
// @route   PUT /api/protected/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { fullName, bio } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (fullName !== undefined) user.fullName = fullName.trim();
    if (bio !== undefined) user.bio = bio.trim();

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change user password
// @route   POST /api/protected/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password provided is incorrect.',
        errors: [{ field: 'currentPassword', message: 'Incorrect current password' }]
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from your current password.',
        errors: [{ field: 'newPassword', message: 'Must be different from current password' }]
      });
    }

    user.password = newPassword;
    await user.save(); // pre-save hook will hash the new password

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user list (Admin only)
// @route   GET /api/protected/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}, 'username email fullName role createdAt lastLogin');
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardData,
  updateProfile,
  changePassword,
  getAllUsers
};
