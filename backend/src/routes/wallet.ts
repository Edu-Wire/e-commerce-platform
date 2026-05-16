import { Router } from 'express';
import { authenticateCustomer } from '../middleware/auth';
import * as ctrl from '../controllers/walletController';

const router = Router();

router.use(authenticateCustomer);

router.get('/', ctrl.getWalletSummary);
router.get('/transactions', ctrl.getTransactions);
router.get('/export', ctrl.exportTransactions);
router.post('/deposit/demo', ctrl.demoDeposit);
router.post('/withdraw', ctrl.withdrawFunds);
router.get('/payment-methods', ctrl.getPaymentMethods);
router.post('/payment-methods', ctrl.addPaymentMethod);
router.delete('/payment-methods/:id', ctrl.deletePaymentMethod);

export default router;
