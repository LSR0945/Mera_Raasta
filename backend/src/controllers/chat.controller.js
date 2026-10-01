// ===== Multi-Provider AI Chat Controller =====
// Fallback chain: Gemini (primary, 5s fast-fail) → LLM7 (backup) → KiloCode → OVH → error
// (extra 2 tiers sirf reliability ke liye — sab keyless, agar LLM7 quota/rate-limit
//  kare toh bhi chat kabhi dead nahi hoti)
// Frontend ko SSE stream milta hai: data: {"chunk":"..."} + data: {"done":true}
// Request body: { message: string, chatHistory: [{role, content}] }
import { GoogleGenAI } from '@google/genai';

// ===== Config =====
const GEMINI_MODEL = process.env.GEMINI_MODEL_NAME || 'gemini-3.6-flash';
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
  'You are Mera Raasta AI — an expert Indian education and career guidance assistant. ' +
  'Help with career planning, exams (JEE/NEET/UPSC/SSC/GATE), coding, salary in Indian LPA, ' +
  'college admissions and motivation. Respond in the same language the user writes in ' +
  '(Hindi/Hinglish/English). Use markdown with **bold** and code blocks. Be concise and encouraging.';

// Gemini client — sirf key hone par banta hai (construction par koi network call nahi hoti)
const geminiAI = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

// Warm-up: server start par pehli Gemini request slow hoti hai (DNS/TLS handshake)
// — 5s timeout miss na ho, isliye 1.5s mein ek halka sa request bhej ke connection warm karte hain
if (geminiAI) {
  setTimeout(() => {
    geminiAI.models
      .generateContent({ model: GEMINI_MODEL, contents: 'hi', config: { maxOutputTokens: 4 } })
      .then(() => console.log('[Chat] Gemini connection warmed up'))
      .catch((e) => console.log('[Chat] Gemini warmup skipped:', String(e?.message || e).replace(/\s+/g, ' ').slice(0, 80)));
  }, 1500);
}

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

    // ===== Step 1: PRIMARY — Gemini (5 second fast-fail) =====
    let geminiAnswered = false;
    if (geminiAI) {
      try {
        // AbortController: 5s mein pehla chunk nahi aaya → abort → backup par jao
        const controller = new AbortController();
        const failTimer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

        const stream = await geminiAI.models.generateContentStream({
          model: GEMINI_MODEL,
          contents: toGeminiContents(String(message).trim(), history),
          config: {
            systemInstruction: SYSTEM_PROMPT,
            temperature: 0.7,
            abortSignal: controller.signal,
          },
        });

        for await (const chunk of stream) {
          clearTimeout(failTimer); // pehla chunk aa gaya — ab ruko mat
          const text = chunk?.text;
          if (text) {
            if (!geminiAnswered) console.log(`[Chat] Gemini answered (${GEMINI_MODEL})`);
            geminiAnswered = true;
            send(text);
          }
          if (closed) break;
        }
        clearTimeout(failTimer);
        if (geminiAnswered) return finish(); // Gemini ne poora jawab diya
        // Gemini ne empty diya → backup try karo (kuch bheja nahi, safe hai)
      } catch (err) {
        // fail / rate-limit / timeout — kuch bhi bheja nahi toh safe fallback
        if (!geminiAnswered) {
          const reason = err?.name === 'AbortError' || /abort/i.test(String(err?.message)) ? `timeout ${GEMINI_TIMEOUT_MS}ms` : String(err?.message || err).replace(/\s+/g, ' ').slice(0, 120);
          console.log(`[Chat] Gemini failed (${reason}) → switching to backup chain`);
        } else {
          // beech mein toota (partial bhej chuke the) — doosra AI chalana
          // text ko dobara shuru karta, isliye yahin graceful end
          console.log('[Chat] Gemini stream broke mid-way after partial answer — ending stream');
          return finish();
        }
      }
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
