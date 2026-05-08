import { Router } from 'express';
import { authenticateCustomer } from '../middleware/auth';
import { createOrder, getOrder, getMyOrders } from '../controllers/orderController';

const router = Router();

router.use(authenticateCustomer);

router.post('/', createOrder);
router.get('/my', getMyOrders);
router.get('/:id', getOrder);

export default router;
