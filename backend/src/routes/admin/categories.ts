import { Router } from 'express';
import { requireMinRole } from '../../middleware/rbac';
import * as ctrl from '../../controllers/admin/categoryAdminController';

const router = Router();

router.get('/', ctrl.getAll);
router.get('/tree', ctrl.getTree);
router.post('/', requireMinRole('manager'), ctrl.create);
router.put('/:id', requireMinRole('manager'), ctrl.update);
router.delete('/:id', requireMinRole('manager'), ctrl.deleteOne);
router.get('/:id/spec-templates', ctrl.getSpecTemplates);
router.put('/:id/spec-templates', requireMinRole('manager'), ctrl.upsertSpecTemplates);

export default router;
