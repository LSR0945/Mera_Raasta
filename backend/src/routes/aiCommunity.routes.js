import { Router } from 'express';
import { chat, chatStream, clearHistory, getChatHistory } from '../controllers/aiCommunity.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.post('/ai/chat', authenticate, chat);
router.post('/ai/chat/stream', authenticate, chatStream);
router.get('/ai/chat/history', authenticate, getChatHistory);
router.delete('/ai/chat/history', authenticate, clearHistory);
export default router;
