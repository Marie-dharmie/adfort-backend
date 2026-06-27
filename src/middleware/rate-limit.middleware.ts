import type { NextFunction, Request, Response } from 'express';

const requestStore = new Map<string, { count: number; resetAt: number }>();

export const simpleRateLimit = (limit = 100, windowMs = 15 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const current = requestStore.get(key);

    if (!current || current.resetAt < now) {
      requestStore.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (current.count >= limit) {
      return res.status(429).json({ message: 'Too many requests' });
    }

    current.count += 1;
    requestStore.set(key, current);
    return next();
  };
};