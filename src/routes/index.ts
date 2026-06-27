import { Router } from 'express';
import adminRoutes from './admin.routes';
import analyticsRoutes from './analytics.routes';
import aiRoutes from './ai.routes';
import authRoutes from './auth.routes';
import businessRoutes from './business.routes';
import competitorRoutes from './competitor.routes';
import industryRoutes from './industry.routes';
import reviewRoutes from './review.routes';
import seoRoutes from './seo.routes';
import visibilityRoutes from './visibility.routes';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/ai', aiRoutes);
router.use('/businesses', businessRoutes);
router.use('/industry', industryRoutes);
router.use('/reviews', reviewRoutes);
router.use('/seo', seoRoutes);
router.use('/competitors', competitorRoutes);
router.use('/visibility', visibilityRoutes);

export default router;