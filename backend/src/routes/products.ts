import { Router } from 'express';
import { publicLimiter } from '../middleware/rateLimiter';
import { getProducts, getProductBySlug } from '../controllers/productController';

const router = Router();

router.get('/', publicLimiter, getProducts);
router.get('/:slug', publicLimiter, getProductBySlug);

export default router;
