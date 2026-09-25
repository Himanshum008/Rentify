import express from 'express';
import {
  getItems,
  getItemById,
  createItem,
  getMyListings,
  updateItem,
  deleteItem,
  addReview,
  getItemAvailability,
  getSimilarItems,
  getPersonalizedRecommendations,
  toggleItemAvailability
} from '../controllers/itemController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getItems);
router.get('/recommendations/personalized', getPersonalizedRecommendations);
router.get('/my/listings', protect, getMyListings);
router.get('/:id', getItemById);
router.get('/:id/availability', getItemAvailability);
router.get('/:id/similar', getSimilarItems);
router.patch('/:id/toggle-availability', protect, toggleItemAvailability);
router.post('/', protect, createItem);
router.put('/:id', protect, updateItem);
router.delete('/:id', protect, deleteItem);
router.post('/:id/reviews', protect, addReview);

export default router;
