import { Router } from 'express';
import { requireMinRole } from '../../middleware/rbac';
import { getReportData } from '../../controllers/admin/reportsController';

const router = Router();

router.get('/:type', requireMinRole('viewer'), getReportData);

export default router;
