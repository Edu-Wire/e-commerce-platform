import { Router } from 'express';
import { publicLimiter } from '../middleware/rateLimiter';
import { authenticateCustomer } from '../middleware/auth';
import {
  getProducts,
  getProductBySlug,
  getSuggestedProducts,
  getProductReviews,
  createProductReview,
  updateProductReview,
  deleteProductReview
} from '../controllers/productController';

const router = Router();

router.get('/', publicLimiter, getProducts);
router.get('/suggestions', publicLimiter, getSuggestedProducts);
router.get('/:slug', publicLimiter, getProductBySlug);
router.get('/:id/reviews', publicLimiter, getProductReviews);
router.post('/:id/reviews', authenticateCustomer, createProductReview);
router.put('/:id/reviews', authenticateCustomer, updateProductReview);
router.delete('/:id/reviews', authenticateCustomer, deleteProductReview);

export default router;
