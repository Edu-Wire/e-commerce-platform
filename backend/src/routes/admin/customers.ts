import { Router } from 'express';
import { requireMinRole } from '../../middleware/rbac';
import * as ctrl from '../../controllers/admin/customerController';

const router = Router();

router.use(requireMinRole('viewer'));

router.get('/', ctrl.getAll);

export default router;
