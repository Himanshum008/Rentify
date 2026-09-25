import express from 'express';
import {
  register,
  verifyEmail,
  resendVerificationEmail,
  login,
  getMe,
  updateProfile,
  toggleWishlist,
  getWishlist,
  submitIdVerification,
  forgotPassword,
  resetPassword,
  getUserReviews
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.get('/reviews', protect, getUserReviews);
router.get('/wishlist', protect, getWishlist);
router.post('/wishlist/:itemId', protect, toggleWishlist);
router.post('/verify-id', protect, submitIdVerification);

export default router;