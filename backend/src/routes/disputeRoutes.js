import express from 'express';
import {
  fileDispute,
  getMyDisputes,
  getDisputeById,
  resolveDispute
} from '../controllers/disputeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', fileDispute);
router.get('/my-disputes', getMyDisputes);
router.get('/:id', getDisputeById);
router.put('/:id/resolve', resolveDispute);

export default router;
