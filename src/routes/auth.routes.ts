import { Router } from 'express';
import { forgotPassword, login, logout, me, refresh, register, resetPassword, updateMe, verifyEmail } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { forgotPasswordSchema, loginSchema, refreshSchema, registerSchema, resetPasswordSchema, updateMeSchema } from '../validation/auth.validation';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshSchema), refresh);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.get('/verify-email', verifyEmail);
router.get('/me', requireAuth, me);
router.put('/me', requireAuth, validate(updateMeSchema), updateMe);
router.post('/logout', requireAuth, logout);

export default router;