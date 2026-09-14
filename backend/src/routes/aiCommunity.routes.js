import { Router } from 'express';
import { chat } from '../controllers/aiCommunity.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.post('/ai/chat', authenticate, chat);
export default router;
