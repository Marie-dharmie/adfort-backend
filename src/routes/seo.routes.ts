import { Router } from 'express';
import {
  analyzeSeoHandler,
  getSeoChecklistHandler,
  getSeoKeywordsHandler,
  getSeoRecommendationsHandler
} from '../controllers/seo.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.use(requireAuth);
router.get('/:businessId/keywords', getSeoKeywordsHandler);
router.get('/:businessId/recommendations', getSeoRecommendationsHandler);
router.get('/:businessId/checklist', getSeoChecklistHandler);
router.post('/:businessId/analyze', analyzeSeoHandler);

export default router;