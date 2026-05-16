import { Router } from 'express';
import { authenticateCustomer } from '../middleware/auth';
import { createOrder, getOrder, getMyOrders, payAuctionOrder } from '../controllers/orderController';

const router = Router();

router.use(authenticateCustomer);

router.post('/', createOrder);
router.get('/my', getMyOrders);
router.post('/:id/pay', payAuctionOrder);
router.get('/:id', getOrder);

export default router;
