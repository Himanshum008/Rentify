import express from 'express';
import {
  getAdminStats,
  getAdminUsers,
  verifyUserId,
  getAdminRentals
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect, adminOnly);

router.get('/stats', getAdminStats);
router.get('/users', getAdminUsers);
router.put('/users/:id/verify-id', verifyUserId);
router.get('/rentals', getAdminRentals);

export default router;
