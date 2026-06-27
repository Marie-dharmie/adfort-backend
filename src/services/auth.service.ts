import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { createSessionId, signAccessToken, signRefreshToken, verifyRefreshToken } from './token.service';
import type { JwtPayload } from '../types/auth';

const sanitizeUser = <T extends { passwordHash: string }>(user: T) => {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
};

export const hashPassword = (password: string) => bcrypt.hash(password, 10);

export const comparePassword = (password: string, passwordHash: string) =>
  bcrypt.compare(password, passwordHash);

export const issueTokensForUser = async (user: { id: string; email: string; role: string }) => {
  const sessionId = createSessionId();
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    sessionId
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId: user.id,
      token: accessToken,
      refreshToken,
      expiresAt
    }
  });

  return { accessToken, refreshToken };
};

export const refreshUserTokens = async (refreshToken: string) => {
  const payload = verifyRefreshToken(refreshToken);
  const session = await prisma.session.findFirst({
    where: {
      refreshToken,
      userId: payload.userId,
      expiresAt: {
        gt: new Date()
      }
    }
  });

  if (!session) {
    throw new Error('Invalid refresh token');
  }

  await prisma.session.delete({ where: { id: session.id } });

  return issueTokensForUser({
    id: payload.userId,
    email: payload.email,
    role: payload.role
  });
};

export const sanitizeAuthUser = sanitizeUser;