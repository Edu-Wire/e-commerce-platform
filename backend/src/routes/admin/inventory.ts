import { Router } from 'express';
import { requireMinRole } from '../../middleware/rbac';
import * as ctrl from '../../controllers/admin/inventoryController';

const router = Router();

router.get('/', requireMinRole('inventory_staff'), ctrl.getInventory);
router.patch('/:id/stock', requireMinRole('inventory_staff'), ctrl.updateStock);
router.get('/export', requireMinRole('inventory_staff'), ctrl.exportCSV);

export default router;
