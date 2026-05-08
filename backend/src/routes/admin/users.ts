import { Router } from 'express';
import { requireRole } from '../../middleware/rbac';
import * as ctrl from '../../controllers/admin/userController';

const router = Router();

router.use(requireRole('owner'));

router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.post('/:id/reset-password', ctrl.resetPassword);

export default router;
