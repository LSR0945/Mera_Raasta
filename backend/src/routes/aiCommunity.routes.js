import { Router } from 'express';
import {
  chat,
  chatStream,
  clearHistory,
  getChatHistory,
  listSessions,
  createSession,
  getSessionMessages,
  deleteSession,
} from '../controllers/aiCommunity.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
router.post('/ai/chat', authenticate, chat);
router.post('/ai/chat/stream', authenticate, chatStream);
router.get('/ai/chat/history', authenticate, getChatHistory);
router.delete('/ai/chat/history', authenticate, clearHistory);

// ChatGPT jaisa multi-chat: sidebar list, naya chat, purana chat kholo, delete
router.get('/ai/chat/sessions', authenticate, listSessions);
router.post('/ai/chat/sessions', authenticate, createSession);
router.get('/ai/chat/sessions/:id', authenticate, getSessionMessages);
router.delete('/ai/chat/sessions/:id', authenticate, deleteSession);

export default router;
