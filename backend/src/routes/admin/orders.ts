import { Router } from 'express';
import { requireMinRole } from '../../middleware/rbac';
import * as ctrl from '../../controllers/admin/orderAdminController';

const router = Router();

router.get('/', requireMinRole('viewer'), ctrl.getAll);
router.get('/:id', requireMinRole('viewer'), ctrl.getById);
router.patch('/:id/status', requireMinRole('manager'), ctrl.updateStatus);

export default router;
