import { Router } from 'express';
import { createBusinessHandler, getBusinessHandler, listBusinessesHandler, updateBusinessHandler } from '../controllers/business.controller';
import { upload } from '../config/upload';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { businessCreateSchema, businessUpdateSchema } from '../validation/business.validation';

const router = Router();

const uploadFields = upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]);

router.use(requireAuth);
router.post('/', uploadFields, validate(businessCreateSchema), createBusinessHandler);
router.get('/', listBusinessesHandler);
router.get('/:id', getBusinessHandler);
router.put('/:id', uploadFields, validate(businessUpdateSchema), updateBusinessHandler);

export default router;