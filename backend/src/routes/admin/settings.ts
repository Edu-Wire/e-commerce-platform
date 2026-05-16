import { Router } from 'express';
import { requireMinRole } from '../../middleware/rbac';
import * as ctrl from '../../controllers/admin/settingsController';

const router = Router();

// Viewers can see settings, but only managers and above can update
router.get('/auction-duration', requireMinRole('viewer'), ctrl.getAuctionDuration);
router.put('/auction-duration', requireMinRole('manager'), ctrl.updateAuctionDuration);

export default router;
