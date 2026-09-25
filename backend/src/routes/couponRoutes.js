import express from 'express';
import { applyCoupon, getActiveCoupons } from '../controllers/couponController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getActiveCoupons);
router.post('/apply', protect, applyCoupon);

export default router;
