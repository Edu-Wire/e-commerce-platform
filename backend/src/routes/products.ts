import { Router } from 'express';
import { publicLimiter } from '../middleware/rateLimiter';
import { getProducts, getProductBySlug, getSuggestedProducts, searchProductsByImage } from '../controllers/productController';
import { uploadImages } from '../middleware/upload';

const router = Router();

router.get('/', publicLimiter, getProducts);
router.get('/suggestions', publicLimiter, getSuggestedProducts);
router.post('/search-by-image', publicLimiter, uploadImages.single('image'), searchProductsByImage);
router.get('/:slug', publicLimiter, getProductBySlug);

export default router;
