import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from '../controllers/cartController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/',              getCart);
router.post('/',             addToCart);
router.delete('/',           clearCart);           // exact before /:productId
router.put('/:productId',    updateCartItem);
router.delete('/:productId', removeFromCart);

export default router;
