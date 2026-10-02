// ===== Multi-Provider AI Chat Controller =====
// Fallback chain: Gemini (primary, 5s fast-fail) → LLM7 (backup) → KiloCode → OVH → error
// (extra 2 tiers sirf reliability ke liye — sab keyless, agar LLM7 quota/rate-limit
//  kare toh bhi chat kabhi dead nahi hoti)
// Frontend ko SSE stream milta hai: data: {"chunk":"..."} + data: {"done":true}
// Request body: { message: string, chatHistory: [{role, content}] }
import { geminiStreamAttempt, hasUsableGeminiKey } from '../utils/geminiPool.js';

// ===== Config =====
const GEMINI_TIMEOUT_MS = 5000; // 5 second fast-fail — fail/rate-limit/timeout → turant backup
const MAX_HISTORY = 8; // context memory — last 8 messages yaad rakhte hain

// Backup providers — OpenAI-compatible SSE endpoints (pehla LLM7, phir extra tiers)
const BACKUP_PROVIDERS = [
  {
    label: 'LLM7',
    url: 'https://api.llm7.io/v1/chat/completions',
    model: process.env.LLM7_MODEL_NAME || 'mistral-Nemo-Instruct-2407',
    apiKey: process.env.LLM7_API_KEY || '', // keyless bhi chalta hai (quota hota hai)
  },
  {
    label: 'KiloCode',
    url: 'https://api.kilo.ai/api/gateway/chat/completions',
    model: 'kilo-auto/free',
    apiKey: '',
  },
  {
    label: 'OVH',
    url: 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions',
    model: 'Mistral-7B-Instruct-v0.3',
    apiKey: '',
  },
];

const SYSTEM_PROMPT =
  'You are a highly advanced, ultra-intelligent AI Career Coach (Mera Raasta AI), powered directly by Google\u2019s premium Gemini model.\n\n' +
  'Strict Operational Rules:\n' +
  '- Act exactly like the official ChatGPT or Gemini chat interface. You possess the deep knowledge and logical reasoning of a world-class career counselor and expert coder.\n' +
  '- Provide 100% dynamic, real-time generated responses. Under NO circumstances give pre-written or placeholder text — every answer must be freshly generated for THIS exact question.\n' +
  '- Answer EVERY question well: career guidance, Indian exams (JEE/NEET/UPSC/SSC/GATE), coding, technical and conceptual questions (e.g. "What is Java language?"), general knowledge, science, math, salary in Indian LPA, college admissions, skill development, life advice, motivation, and casual conversation.\n' +
  '- For technical, coding, or conceptual questions: provide exhaustive, accurate, high-quality explanations with perfect Markdown formatting — **bold**, lists, and fenced ``` code blocks.\n' +
  '- Maintain strict context awareness: the chatHistory below shows what the user ACTUALLY said — always trust it for follow-up questions.\n' +
  '- Keep the conversation highly professional, interactive, and natural. Speak in the exact language the user uses (Hindi, English, or Hinglish).\n' +
  '- Never say you cannot help — always give a real, complete answer. Add emojis naturally. Be concise but complete and accurate.';

// Gemini client/warm-up sab src/utils/geminiPool.js mein hai (multi-key pool,
// model rotation, 429 auto-block, auto-resume, warm-up) — yahan nahi dohrana.

// ===== Context memory converters =====
// Frontend chatHistory → Gemini format (assistant = "model")
function toGeminiContents(message, chatHistory) {
  const contents = [];
  for (const m of chatHistory) {
    if (!m?.content) continue;
    contents.push({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content).slice(0, 4000) }],
    });
  }
  contents.push({ role: 'user', parts: [{ text: message }] });
  return contents;
}

// Frontend chatHistory → OpenAI messages format (system prompt aage)
function toOpenAIMessages(message, chatHistory) {
  const messages = [{ role: 'system', content: SYSTEM_PROMPT }];
  for (const m of chatHistory) {
    if (!m?.content) continue;
    messages.push({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content).slice(0, 4000),
    });
  }
  messages.push({ role: 'user', content: message });
  return messages;
}

// ===== Backup provider — OpenAI-compatible SSE stream padho, har chunk send() =====
async function streamBackup(provider, messages, send, isClosed) {
  const headers = { 'Content-Type': 'application/json' };
  if (provider.apiKey) headers.Authorization = `Bearer ${provider.apiKey}`;

  const resp = await fetch(provider.url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ model: provider.model, messages, stream: true }),
    signal: AbortSignal.timeout(20000), // 20s connect timeout
  });
  if (!resp.ok || !resp.body) {
    // 429 ka retry_after body mein hota hai — short message ke liye print kar do
    let detail = `HTTP ${resp.status}`;
    try {
      const errJson = await resp.json();
      detail += ` ${errJson?.error?.message || ''}`.slice(0, 100);
    } catch {}
    throw new Error(`${provider.label} ${detail}`);
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done || isClosed()) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // adhura last line agle round mein
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const json = JSON.parse(payload);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) send(delta);
      } catch {}
    }
  }
}

// ===== POST /api/chat — streaming chat route ka controller =====
export const chatStream = async (req, res) => {
  // SSE headers lagao
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  let closed = false;
  res.on('close', () => { closed = true; });
  const send = (chunk) => { if (!closed) res.write(`data: ${JSON.stringify({ chunk })}\n\n`); };
  const finish = () => {
    if (!closed) {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    }
  };

  try {
    const { message, chatHistory = [] } = req.body || {};
    if (!message || !String(message).trim()) {
      res.statusCode = 400;
      res.write(`data: ${JSON.stringify({ error: 'Message is required' })}\n\n`);
      return finish();
    }
    const history = Array.isArray(chatHistory) ? chatHistory.slice(-MAX_HISTORY) : [];

    // ===== Step 1: PRIMARY — Gemini (pool: multi-key + model rotation, 5s budget) =====
    if (hasUsableGeminiKey()) {
      let firstChunk = true;
      const r = await geminiStreamAttempt({
        contents: toGeminiContents(String(message).trim(), history),
        config: { systemInstruction: SYSTEM_PROMPT, temperature: 0.7 },
        timeoutMs: GEMINI_TIMEOUT_MS, // 5 second fast-fail (requirement)
        onChunk: (text) => {
          if (firstChunk) { firstChunk = false; console.log('[Chat] Gemini answered (pool)'); }
          send(text);
        },
      });
      if (r.ok) return finish(); // Gemini ne jawab diya (partial ho toh bhi safe)
      console.log('[Chat] Gemini unavailable (quota/cooldown) → switching to backup chain');
    }

    // ===== Step 2+: BACKUP chain — LLM7 → KiloCode → OVH (jo pehle chale, wahi) =====
    const messages = toOpenAIMessages(String(message).trim(), history);
    for (const provider of BACKUP_PROVIDERS) {
      try {
        await streamBackup(provider, messages, send, () => closed);
        return finish();
      } catch (err) {
        // agla provider try karo (rate-limit/quota/fail — koi farak nahi)
        console.log(`[Chat] ${provider.label} failed:`, String(err?.message || err).replace(/\s+/g, ' ').slice(0, 130));
      }
    }
    // Poori chain fail — graceful error message
    send('⚠️ AI is temporarily unavailable. Please try again in a moment.');
    return finish();
  } catch (error) {
    console.error('[Chat] Unexpected error:', error);
    send('⚠️ Something went wrong. Please try again.');
    return finish();
  }
};
