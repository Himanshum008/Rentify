import express from 'express';
const router = express.Router();
import {
  listingAssistant,
  suggestPrice,
  analyzeImage,
  riskAssessment
} from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

router.use(protect);

router.post('/listing-assistant', listingAssistant);
router.post('/suggest-price', suggestPrice);
router.post('/analyze-image', analyzeImage);
router.post('/risk-assessment', riskAssessment);

export default router;
