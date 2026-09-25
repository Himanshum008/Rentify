import { uploadToCloudinary } from '../config/cloudinary.js';

// @desc    Upload single or multiple images to Cloudinary
// @route   POST /api/upload
// @access  Private
const uploadImages = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      if (req.file) {
        req.files = [req.file];
      } else {
        return res.status(400).json({
          success: false,
          message: 'No image files uploaded'
        });
      }
    }

    const uploadPromises = req.files.map((file) =>
      uploadToCloudinary(file.buffer, 'rentify/items')
    );

    const results = await Promise.all(uploadPromises);
    const urls = results.map((result) => result.secure_url);

    res.status(200).json({
      success: true,
      urls,
      url: urls[0] // convenient helper for single photo upload
    });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Image upload failed'
    });
  }
};

export {
  uploadImages
};

export default {
  uploadImages
};
