import { Router } from 'express';
import { authenticateAdmin } from '../../middleware/auth';
import categoryRoutes from './categories';
import productRoutes from './products';
import userRoutes from './users';
import dashboardRoutes from './dashboard';
import inventoryRoutes from './inventory';
import orderRoutes from './orders';

const router = Router();

// All admin routes require authentication
router.use(authenticateAdmin);

router.use('/categories', categoryRoutes);
router.use('/products', productRoutes);
router.use('/users', userRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/orders', orderRoutes);

export default router;
