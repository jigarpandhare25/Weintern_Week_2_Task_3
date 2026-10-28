const express = require('express');
const router = express.Router();

const {
  getDashboardData,
  updateProfile,
  changePassword,
  getAllUsers
} = require('../controllers/userController');

const {
  validateUpdateProfile,
  validateChangePassword
} = require('../middleware/validationMiddleware');

const { authenticate, authorizeRoles } = require('../middleware/authMiddleware');

// All routes in this router require authentication
router.use(authenticate);

// Protected resource routes
router.get('/dashboard', getDashboardData);
router.put('/profile', validateUpdateProfile, updateProfile);
router.post('/change-password', validateChangePassword, changePassword);

// Role-based protected route (Admin only)
router.get('/admin/users', authorizeRoles('admin'), getAllUsers);

module.exports = router;
