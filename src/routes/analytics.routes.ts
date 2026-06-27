import { Router } from 'express';
import {
  getAnalyticsOverviewHandler,
  getCampaignPerformanceHandler,
  getEngagementHandler,
  getReviewsTrendHandler,
  getVisibilityTrendHandler,
  ingestAnalyticsHandler
} from '../controllers/analytics.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { analyticsIngestSchema } from '../validation/analytics.validation';

const router = Router();

router.use(requireAuth);

router.post('/:businessId', validate(analyticsIngestSchema), ingestAnalyticsHandler);
router.get('/:businessId/overview', getAnalyticsOverviewHandler);
router.get('/:businessId/visibility-trend', getVisibilityTrendHandler);
router.get('/:businessId/reviews-trend', getReviewsTrendHandler);
router.get('/:businessId/campaigns', getCampaignPerformanceHandler);
router.get('/:businessId/engagement', getEngagementHandler);

export default router;