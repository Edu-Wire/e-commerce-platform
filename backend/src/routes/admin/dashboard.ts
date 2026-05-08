import { Router } from 'express';
import { requireMinRole } from '../../middleware/rbac';
import { getStats } from '../../controllers/admin/dashboardController';

const router = Router();

router.get('/stats', requireMinRole('viewer'), getStats);

export default router;
