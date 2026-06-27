import { Router } from 'express';
import {
  createReviewHandler,
  generateReviewAiResponseHandler,
  getReviewQrCodeHandler,
  getReviewRequestTemplateHandler,
  getReviewStatsHandler,
  listReviewsHandler
} from '../controllers/review.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { reviewCreateSchema, reviewRequestTemplateSchema } from '../validation/review.validation';

const router = Router();

router.post('/:businessId', validate(reviewCreateSchema), createReviewHandler);
router.use(requireAuth);
router.get('/:businessId', listReviewsHandler);
router.get('/:businessId/stats', getReviewStatsHandler);
router.get('/:businessId/qr-code', getReviewQrCodeHandler);
router.post('/:businessId/request-template', validate(reviewRequestTemplateSchema), getReviewRequestTemplateHandler);
router.post('/:id/ai-response', generateReviewAiResponseHandler);

export default router;