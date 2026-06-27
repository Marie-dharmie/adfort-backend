import { Router } from 'express';
import {
  deleteAiConversation,
  deleteGeneratedContent,
  exportGeneratedContent,
  getAiConversation,
  listAiConversations,
  listGeneratedContent,
  postAiChat,
  postGenerateContent,
  updateGeneratedContent
} from '../controllers/ai.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  aiChatSchema,
  generateContentSchema,
  updateGeneratedContentSchema
} from '../validation/ai.validation';

const router = Router();

router.use(requireAuth);

router.post('/chat', validate(aiChatSchema), postAiChat);
router.get('/conversations', listAiConversations);
router.get('/conversations/:id', getAiConversation);
router.delete('/conversations/:id', deleteAiConversation);

router.post('/content/generate', validate(generateContentSchema), postGenerateContent);
router.get('/content', listGeneratedContent);
router.put('/content/:id', validate(updateGeneratedContentSchema), updateGeneratedContent);
router.delete('/content/:id', deleteGeneratedContent);
router.post('/content/:id/export', exportGeneratedContent);

export default router;
