import { Router } from 'express';
import {
  analyzeCompetitorsHandler,
  createCompetitorHandler,
  deleteCompetitorHandler,
  listCompetitorsHandler
} from '../controllers/competitor.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { competitorCreateSchema } from '../validation/competitor.validation';

const router = Router();

router.use(requireAuth);
router.get('/:businessId', listCompetitorsHandler);
router.post('/:businessId', validate(competitorCreateSchema), createCompetitorHandler);
router.get('/:businessId/analysis', analyzeCompetitorsHandler);
router.delete('/:id', deleteCompetitorHandler);

export default router;