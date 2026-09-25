import express from 'express';
import upload from '../middleware/uploadMiddleware.js';
import { uploadImages } from '../controllers/uploadController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Accept multiple files with field name "images" (up to 10 photos) or single file with "image"
router.post('/', protect, upload.array('images', 10), uploadImages);

export default router;
