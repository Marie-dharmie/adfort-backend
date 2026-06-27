import { Router } from 'express';
import {
  deleteAdminUserHandler,
  getAdminAiUsageHandler,
  getAdminBusinessesHandler,
  getAdminStatsHandler,
  getAdminUsersHandler,
  putAdminUserRoleHandler
} from '../controllers/admin.controller';
import { requireAdmin } from '../middleware/admin.middleware';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/businesses', getAdminBusinessesHandler);
router.get('/users', getAdminUsersHandler);
router.get('/stats', getAdminStatsHandler);
router.put('/users/:id/role', putAdminUserRoleHandler);
router.delete('/users/:id', deleteAdminUserHandler);
router.get('/ai-usage', getAdminAiUsageHandler);

export default router;