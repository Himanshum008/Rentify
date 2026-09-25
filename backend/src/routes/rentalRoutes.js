import express from 'express';
import {
  createRental,
  getMyRentals,
  updateRentalStatus,
  signAgreement,
  uploadConditionPhotos,
  updateChecklists,
  requestExtension,
  respondExtension,
  getOwnerAnalytics,
  returnEarly,
  confirmReturn
} from '../controllers/rentalController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createRental);
router.get('/my', getMyRentals);
router.get('/owner/analytics', getOwnerAnalytics);
router.put('/:id/status', updateRentalStatus);
router.post('/:id/return-early', returnEarly);
router.post('/:id/confirm-return', confirmReturn);
router.post('/:id/sign-agreement', signAgreement);
router.post('/:id/condition-photos', uploadConditionPhotos);
router.put('/:id/checklists', updateChecklists);
router.post('/:id/request-extension', requestExtension);
router.put('/:id/respond-extension', respondExtension);

export default router;
