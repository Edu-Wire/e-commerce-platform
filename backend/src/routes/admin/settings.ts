import { Router } from 'express';
import { requireMinRole } from '../../middleware/rbac';
import * as ctrl from '../../controllers/admin/settingsController';

const router = Router();

// Viewers can see settings, but only managers and above can update
router.get('/auction-duration', requireMinRole('viewer'), ctrl.getAuctionDuration);
router.put('/auction-duration', requireMinRole('manager'), ctrl.updateAuctionDuration);

router.get('/loser-template', requireMinRole('viewer'), ctrl.getLoserTemplate);
router.put('/loser-template', requireMinRole('manager'), ctrl.updateLoserTemplate);

export default router;
