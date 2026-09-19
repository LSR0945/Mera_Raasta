import { Router } from 'express';
import { chat, chatStream, clearHistory } from '../controllers/aiCommunity.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.post('/ai/chat', authenticate, chat);
router.post('/ai/chat/stream', authenticate, chatStream);
router.delete('/ai/chat/history', authenticate, clearHistory);
export default router;
