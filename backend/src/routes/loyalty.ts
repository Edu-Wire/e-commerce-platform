import { Router } from 'express';
import { authenticateCustomer } from '../middleware/auth';
import * as ctrl from '../controllers/loyaltyController';

const router = Router();

router.use(authenticateCustomer);

router.get('/status', ctrl.getLoyaltyStatus);
router.post('/check-in', ctrl.dailyCheckIn);
router.post('/spin-wheel', ctrl.spinWheel);

export default router;
