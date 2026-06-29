import { Router } from 'express';
import { uploadImage, uploadImages, deleteImage } from '../controllers/uploadController';
import { protect, adminOnly } from '../middleware/auth';
import { uploadMiddleware } from '../middleware/upload';

const router = Router();

router.post(
  '/image',
  protect,
  adminOnly,
  uploadMiddleware.single('image'),
  uploadImage
);

router.post(
  '/images',
  protect,
  adminOnly,
  uploadMiddleware.array('images', 5),
  uploadImages
);

router.delete('/image', protect, adminOnly, deleteImage);

export default router;
