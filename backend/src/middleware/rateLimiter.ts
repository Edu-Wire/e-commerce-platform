import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

const isDev = env.nodeEnv === 'development';

// No-op middleware for development to bypass rate limits entirely
const bypassDev = (req: Request, res: Response, next: NextFunction) => next();

export const publicLimiter = isDev ? bypassDev : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later' },
});

export const authLimiter = isDev ? bypassDev : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many authentication attempts, please try again later' },
});

export const uploadLimiter = isDev ? bypassDev : rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many upload requests, please try again in an hour' },
});
