import { Router } from 'express';
import { publicLimiter } from '../middleware/rateLimiter';
import { chatWithAI } from '../controllers/aiController';

const router = Router();

router.post('/chat', publicLimiter, chatWithAI);

export default router;
