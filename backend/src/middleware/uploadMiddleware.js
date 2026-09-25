import multer from 'multer';

// Configure memory storage so files are held in buffer and can be streamed to Cloudinary
const storage = multer.memoryStorage();

// Filter image file types
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPG, PNG, WEBP) are allowed!'), false);
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit per image
  },
  fileFilter
});

export default upload;
