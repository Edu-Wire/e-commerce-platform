import { Router } from 'express';
import { authenticateCustomer } from '../middleware/auth';
import { getMyNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController';

const router = Router();

router.use(authenticateCustomer);

router.get('/', getMyNotifications);
router.post('/mark-all-read', markAllAsRead);
router.post('/:id/read', markAsRead);

export default router;
