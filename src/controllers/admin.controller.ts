import { UserRole } from '@prisma/client';
import type { Request, Response } from 'express';
import {
  deleteUserById,
  getAiUsageStats,
  getPlatformStats,
  listAllBusinesses,
  listAllUsers,
  updateUserRole
} from '../services/admin.service';

const parseNumber = (value: unknown, fallback: number) => {
  const parsed = typeof value === 'string' ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const getAdminBusinessesHandler = async (req: Request, res: Response) => {
  const result = await listAllBusinesses({
    page: parseNumber(req.query.page, 1),
    limit: parseNumber(req.query.limit, 20),
    search: typeof req.query.search === 'string' ? req.query.search : undefined
  });

  return res.json(result);
};

export const getAdminUsersHandler = async (req: Request, res: Response) => {
  const result = await listAllUsers({
    page: parseNumber(req.query.page, 1),
    limit: parseNumber(req.query.limit, 20),
    search: typeof req.query.search === 'string' ? req.query.search : undefined
  });

  return res.json(result);
};

export const getAdminStatsHandler = async (_req: Request, res: Response) => {
  const result = await getPlatformStats();
  return res.json(result);
};

export const putAdminUserRoleHandler = async (req: Request, res: Response) => {
  const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const role = typeof req.body.role === 'string' ? req.body.role : '';

  if (!Object.values(UserRole).includes(role as UserRole)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  const updated = await updateUserRole(userId, role as UserRole);
  return res.json(updated);
};

export const deleteAdminUserHandler = async (req: Request, res: Response) => {
  const userId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await deleteUserById(userId);
  return res.json({ message: 'User deleted' });
};

export const getAdminAiUsageHandler = async (_req: Request, res: Response) => {
  const result = await getAiUsageStats();
  return res.json(result);
};