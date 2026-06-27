import { Router } from 'express';
import {
  calculateVisibilityScoreHandler,
  getVisibilityHistoryHandler,
  getVisibilityScoreHandler
} from '../controllers/visibility.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);
router.get('/:businessId', getVisibilityScoreHandler);
router.post('/:businessId/calculate', calculateVisibilityScoreHandler);
router.get('/:businessId/history', getVisibilityHistoryHandler);

export default router;