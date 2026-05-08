import { Router } from 'express';
import { publicLimiter } from '../middleware/rateLimiter';
import { getTree } from '../controllers/categoryController';

const router = Router();

router.get('/', publicLimiter, getTree);

export default router;
