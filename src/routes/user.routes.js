import express from 'express';
import {
  getProfile,
  updateProfile,
  updateAvatar,
  changePassword,
  deleteAccount,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', getProfile);

/**
 * @route   PATCH /api/users/me
 * @desc    Update user profile
 * @access  Private
 */
router.patch('/me', updateProfile);

/**
 * @route   PATCH /api/users/me/avatar
 * @desc    Update user avatar
 * @access  Private
 */
router.patch('/me/avatar', updateAvatar);

/**
 * @route   PATCH /api/users/me/password
 * @desc    Change password
 * @access  Private
 */
router.patch('/me/password', changePassword);

/**
 * @route   DELETE /api/users/me
 * @desc    Delete user account
 * @access  Private
 */
router.delete('/me', deleteAccount);

export default router;
