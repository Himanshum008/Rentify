import express from 'express';
import {
  getRazorpayKey,
  createPaymentOrder,
  verifyPayment,
  refundDeposit,
  handlePaymentFailed
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route to get Razorpay public key
router.get('/key', getRazorpayKey);

// Protected payment processing routes
router.post('/create-order', protect, createPaymentOrder);
router.post('/verify-payment', protect, verifyPayment);
router.post('/refund-deposit', protect, refundDeposit);
router.post('/payment-failed', protect, handlePaymentFailed);

export default router;
