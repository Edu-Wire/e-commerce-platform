import { Router } from 'express';
import { authenticateAdmin } from '../../middleware/auth';
import categoryRoutes from './categories';
import productRoutes from './products';
import userRoutes from './users';
import dashboardRoutes from './dashboard';
import inventoryRoutes from './inventory';
import orderRoutes from './orders';
import settingsRoutes from './settings';
import auctionRoutes from './auctions';

const router = Router();

// All admin routes require authentication
router.use(authenticateAdmin);

router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/users', userRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/orders', orderRoutes);
router.use('/settings', settingsRoutes);
router.use('/auctions', auctionRoutes);

// Direct route to avoid 404 issues with nested routers
import { updateAuctionStatus } from '../../controllers/admin/inventoryController';
import { requireMinRole } from '../../middleware/rbac';
router.patch('/inventory/auction/:id', requireMinRole('manager'), updateAuctionStatus);

export default router;
