import { Router } from 'express';
import {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  addReview,
  getCategories,
} from '../controllers/productController';
import { protect, adminOnly } from '../middleware/auth';

const router = Router();

// static routes must come before /:id
router.get('/categories', getCategories);

router.get('/',    getProducts);
router.post('/',   protect, adminOnly, createProduct);

router.get('/:id',    getProduct);
router.put('/:id',    protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);

router.post('/:id/reviews', protect, addReview);

export default router;
