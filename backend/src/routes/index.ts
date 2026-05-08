import { Router } from 'express';
import authRoutes from './auth';
import categoryRoutes from './categories';
import productRoutes from './products';
import orderRoutes from './orders';
import adminRoutes from './admin/index';

const router = Router();

router.use('/api/auth', authRoutes);
router.use('/api/categories', categoryRoutes);
router.use('/api/products', productRoutes);
router.use('/api/orders', orderRoutes);
router.use('/api/admin', adminRoutes);

export default router;
