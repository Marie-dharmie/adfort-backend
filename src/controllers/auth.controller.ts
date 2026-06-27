import type { Request, Response } from 'express';
import { prisma } from '../config/database';
import { comparePassword, hashPassword, issueTokensForUser, refreshUserTokens, sanitizeAuthUser } from '../services/auth.service';
import { v4 as uuidv4 } from 'uuid';
import { sendPasswordResetEmail, sendVerificationEmail } from '../services/email.service';
import { verifyAccessToken } from '../services/token.service';

export const register = async (req: Request, res: Response) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: req.body.email }
  });

  if (existingUser) {
    return res.status(409).json({ message: 'Email already in use' });
  }

  const passwordHash = await hashPassword(req.body.password);
  const verificationToken = uuidv4();
  const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const user = await prisma.user.create({
    data: {
      email: req.body.email,
      passwordHash,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      role: req.body.role ?? 'OWNER',
      emailVerificationToken: verificationToken,
      emailVerificationExpiry: verificationExpiry
    }
  });

  await sendVerificationEmail(user.email, verificationToken, user.firstName);

  const tokens = await issueTokensForUser(user);

  return res.status(201).json({
    user: sanitizeAuthUser(user),
    ...tokens
  });
};

export const login = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { email: req.body.email }
  });

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isValid = await comparePassword(req.body.password, user.passwordHash);

  if (!isValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const tokens = await issueTokensForUser(user);

  return res.json({
    user: sanitizeAuthUser(user),
    ...tokens
  });
};

export const refresh = async (req: Request, res: Response) => {
  const tokens = await refreshUserTokens(req.body.refreshToken);
  return res.json(tokens);
};

export const forgotPassword = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { email: req.body.email }
  });

  if (!user) {
    return res.json({ message: 'If the account exists, a reset token has been generated' });
  }

  const resetToken = uuidv4();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: resetToken,
      passwordResetExpiry: expiresAt
    }
  });

  await sendPasswordResetEmail(user.email, resetToken, user.firstName);

  return res.json({
    message: 'If the account exists, a password reset email has been sent'
  });
};

export const resetPassword = async (req: Request, res: Response) => {
  const user = await prisma.user.findFirst({
    where: {
      passwordResetToken: req.body.token,
      passwordResetExpiry: {
        gt: new Date()
      }
    }
  });

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired reset token' });
  }

  const passwordHash = await hashPassword(req.body.password);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiry: null
    }
  });

  return res.json({ message: 'Password reset successful' });
};

export const verifyEmail = async (req: Request, res: Response) => {
  const token = typeof req.query.token === 'string' ? req.query.token : '';

  if (!token) {
    return res.status(400).json({ message: 'Verification token is required' });
  }

  const user = await prisma.user.findFirst({
    where: {
      emailVerificationToken: token,
      emailVerificationExpiry: {
        gt: new Date()
      }
    }
  });

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired verification token' });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiry: null
    }
  });

  return res.json({ message: 'Email verified successfully' });
};

export const me = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  return res.json({
    user: sanitizeAuthUser(req.user)
  });
};

export const updateMe = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const data: { firstName?: string; lastName?: string } = {};

  if (typeof req.body.firstName === 'string') {
    data.firstName = req.body.firstName;
  }

  if (typeof req.body.lastName === 'string') {
    data.lastName = req.body.lastName;
  }

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data
  });

  return res.json({ user: sanitizeAuthUser(updated) });
};

export const logout = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Best-effort session revocation: derive the session from the access token.
  try {
    const authorization = req.headers.authorization;

    if (authorization?.startsWith('Bearer ')) {
      const token = authorization.slice(7);
      const payload = verifyAccessToken(token);

      await prisma.session.deleteMany({
        where: {
          userId: payload.userId,
          token
        }
      });
    }
  } catch {
    // Token verification or deletion may fail; logout still succeeds from the client's perspective.
  }

  return res.json({ message: 'Logged out successfully' });
};