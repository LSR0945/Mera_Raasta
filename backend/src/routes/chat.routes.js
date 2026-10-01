// ===== AI Chat Route =====
// POST /api/chat — { message, chatHistory } bhejo, SSE stream wapas milega
// (chunk-by-chunk data: {"chunk":"..."} lines + data: {"done":true} at the end)
import express from 'express';
import { chatStream } from '../controllers/chat.controller.js';

const router = express.Router();

router.post('/', chatStream);

export default router;
