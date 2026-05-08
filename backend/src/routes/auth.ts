import { Router } from 'express';
import { authLimiter } from '../middleware/rateLimiter';
import { authenticateCustomer, authenticateAdmin } from '../middleware/auth';
import * as ctrl from '../controllers/authController';

const router = Router();

router.post('/register', authLimiter, ctrl.register);
router.post('/login', authLimiter, ctrl.login);
router.post('/admin/login', authLimiter, ctrl.adminLogin);
router.get('/profile', authenticateCustomer, ctrl.getProfile);
router.get('/admin/profile', authenticateAdmin, ctrl.getAdminProfile);

export default router;
