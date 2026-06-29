import { Router } from 'express';
import {
  createPaymentIntent,
  createOrder,
  getMyOrders,
  getOrder,
  getAllOrders,
  updateOrderStatus,
} from '../controllers/orderController';
import { protect, adminOnly } from '../middleware/auth';

const router = Router();

// static routes before /:id
router.post('/payment-intent',  protect, createPaymentIntent);
router.get('/my-orders',        protect, getMyOrders);
router.get('/admin/all',        protect, adminOnly, getAllOrders);

router.post('/',                protect, createOrder);
router.get('/:id',              protect, getOrder);
router.put('/:id/status',       protect, adminOnly, updateOrderStatus);

export default router;
