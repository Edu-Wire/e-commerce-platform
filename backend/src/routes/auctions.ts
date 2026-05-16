import { Router } from 'express';
import * as ctrl from '../controllers/auctionController';
import { authenticateCustomer, optionalCustomerAuth } from '../middleware/auth';

const router = Router();

router.get('/active', optionalCustomerAuth, ctrl.getActiveAuction);
router.get('/upcoming', ctrl.getUpcomingAuctions);
router.get('/won', authenticateCustomer, ctrl.getWonAuctions);
router.get('/winning', authenticateCustomer, ctrl.getWinningDashboard);
router.get('/pending-payments', authenticateCustomer, ctrl.getPendingPayments);
router.get('/my-bids', authenticateCustomer, ctrl.getMyBids);
router.get('/activity', ctrl.getRecentActivity);
router.get('/:id', ctrl.getAuctionDetails);
router.post('/bid', authenticateCustomer, ctrl.placeBid);

export default router;
