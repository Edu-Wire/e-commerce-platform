import { Router } from 'express';
import { requireMinRole } from '../../middleware/rbac';
import * as ctrl from '../../controllers/admin/auctionAdminController';

console.log('[Debug] Loading admin auctions routes file');

const router = Router();

// Staff can view products for auction, but only managers can update status
router.get('/products', requireMinRole('inventory_staff'), (req, res, next) => {
  console.log('[Debug] Hit /api/admin/auctions/products');
  return ctrl.getAuctionProducts(req, res);
});

router.put('/products/:id', requireMinRole('manager'), ctrl.updateProductAuctionStatus);
router.get('/running', requireMinRole('inventory_staff'), ctrl.getRunningAuctions);
router.get('/history', requireMinRole('inventory_staff'), ctrl.getClosedAuctions);
router.get('/:id/bidders', requireMinRole('inventory_staff'), ctrl.getAuctionBidders);
router.delete('/:id', requireMinRole('manager'), ctrl.deleteAuction);

export default router;
