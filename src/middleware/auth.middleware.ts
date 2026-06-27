import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/database';
import { verifyAccessToken } from '../services/token.service';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing or invalid authorization header' });
    }

    const token = authorization.slice(7);
    const payload = verifyAccessToken(token);

    // Confirm the session is still active (i.e. the user has not logged out).
    // Uses both userId and the exact token so concurrent sessions on other
    // devices are not affected by a logout elsewhere.
    const session = await prisma.session.findFirst({
      where: { userId: payload.userId, token },
      select: { id: true }
    });

    if (!session) {
      return res.status(401).json({ message: 'Session expired or revoked' });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};