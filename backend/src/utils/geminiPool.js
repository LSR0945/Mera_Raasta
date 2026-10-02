// ===== Gemini HAR HAAL MEIN chalane ka pool =====
// Kya karta hai:
// 1. MULTIPLE keys support — GEMINI_API_KEY + GEMINI_API_KEYS_EXTRA (comma list).
//    Ek key ka quota khatam ho toh doosri key se jawab aata rahega.
// 2. Model rotation — gemini-3.6-flash → gemini-flash-latest (jo available ho).
// 3. 429 quota tracking — key ko turant block (retry window ke liye) taaki
//    har request par bekaar 429 na lage; window khatam hote hi key AUTO resume.
// 4. 5 second budget (caller ke hisaab se) — sab combos isi budget mein try hote hain.
// 5. Warm-up — server start par connection garam (pehli request fast).
// Jab tak EK BHI key/model available hai → Gemini jawab dega. Warna caller
// apni fallback chain (LLM7/KiloCode/OVH) chalata hai — chat kabhi dead nahi.
import { GoogleGenAI } from '@google/genai';

// Models — env wala sabse pehle, phir confirmed working models
const GEMINI_MODELS = [...new Set([
  (process.env.GEMINI_MODEL_NAME || '').trim(),
  'gemini-3.6-flash',
  'gemini-flash-latest',
].filter(Boolean))];

// Sab keys — single + comma-separated extras (AI Studio se free keys bana sakte ho)
const ALL_KEYS = [...new Set([
  (process.env.GEMINI_API_KEY || '').trim(),
  ...((process.env.GEMINI_API_KEYS_EXTRA || '').split(',').map(s => s.trim()).filter(Boolean)),
])];

const QUOTA_BLOCK_DEFAULT_MS = 5 * 60 * 1000;  // retry window na pata ho toh 5 min
const QUOTA_BLOCK_MAX_MS = 15 * 60 * 1000;     // zyada se zyada 15 min

// Har key ka apna client + state
const keyPool = ALL_KEYS.map((key) => ({
  key,
  client: new GoogleGenAI({ apiKey: key }),
  blockedUntil: 0,
  modelIdx: 0,
}));

let roundRobin = 0;
// Non-quota failure (timeout/5xx/network) ke baad 60s skip — taaki har request
// par slow Gemini na try hota rahe; success hone par khud clear ho jaata hai
let softCooldownUntil = 0;

export function hasUsableGeminiKey() {
  const now = Date.now();
  if (now < softCooldownUntil) return false;
  return keyPool.some(k => now >= k.blockedUntil);
}

function usableKeys() {
  const now = Date.now();
  return keyPool.filter(k => now >= k.blockedUntil);
}

// Agla (key, model) combo chuno — keys ke beech round-robin
function nextCombo() {
  const usable = usableKeys();
  if (!usable.length) return null;
  const state = usable[roundRobin++ % usable.length];
  const model = GEMINI_MODELS[state.modelIdx % GEMINI_MODELS.length];
  return { state, model };
}

// Error ko classify karo (quota / auth / model-missing / abort / server)
function classifyErr(err) {
  const msg = String(err?.message || err || '');
  const codeMatch = msg.match(/"code"\s*:\s*(\d{3})/) || msg.match(/\b(4\d\d|5\d\d)\b/);
  const code = codeMatch ? Number(codeMatch[1]) : null;
  const isQuota = /quota|RESOURCE_EXHAUSTED|rate limit|429/i.test(msg);
  const isAbort = err?.name === 'AbortError' || /abort|timeout/i.test(msg);
  // Google kabhi kabhi "retry after 42s" likhta hai
  const retryMatch = msg.match(/retry after (\d+)\s*s/i) || msg.match(/"retryDelay":"PT?(\d+)S?/i);
  return { code, isQuota, isAbort, retrySec: retryMatch ? Number(retryMatch[1]) : null, msg };
}

// Failure ke baad key ka state update karo
function reportFailure(state, info) {
  if (info.isQuota) {
    const blockMs = info.retrySec
      ? Math.min(info.retrySec * 1000, QUOTA_BLOCK_MAX_MS)
      : QUOTA_BLOCK_DEFAULT_MS;
    state.blockedUntil = Date.now() + blockMs;
    console.log(`[Gemini] Quota/rate-limit — key ${Math.round(blockMs / 60000)} min block (${usableKeys().length}/${keyPool.length} keys ab usable)`);
  } else if (info.code === 404) {
    state.modelIdx++; // model exist nahi karta — agla model
    console.log(`[Gemini] Model 404 — rotating to next model`);
  } else if (info.code === 401 || info.code === 403) {
    state.blockedUntil = Date.now() + QUOTA_BLOCK_MAX_MS;
    console.log(`[Gemini] Key rejected (HTTP ${info.code}) — 15 min block`);
  } else if (!info.isQuota) {
    // timeout / 5xx / network — 60s soft cooldown (fallback chain turant chalegi)
    softCooldownUntil = Math.max(softCooldownUntil, Date.now() + 60000);
  }
}

// ===== Streaming attempt — budget ke andar sab combos, onChunk se token bhejo =====
// Returns { ok: boolean, model?: string, keyIndex?: number }
export async function geminiStreamAttempt({ contents, config, timeoutMs = 5000, onChunk }) {
  const deadline = Date.now() + timeoutMs;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (deadline - Date.now() < 700) break; // bacha hua budget bahut kam
    const combo = nextCombo();
    if (!combo) break; // koi key available nahi (sab blocked)
    let sent = 0;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), Math.max(deadline - Date.now(), 300));
      try {
        const stream = await combo.state.client.models.generateContentStream({
          model: combo.model,
          contents,
          config: { ...config, abortSignal: controller.signal },
        });
        for await (const chunk of stream) {
          if (sent === 0) clearTimeout(timer); // pehla chunk aa gaya — ab ruko mat
          const t = chunk?.text;
          if (t) { sent++; onChunk(t); }
        }
      } finally {
        clearTimeout(timer);
      }
      if (sent > 0) {
        softCooldownUntil = 0; // success — cooldown clear
        console.log(`[Gemini] Stream answered via ${combo.model} (key #${keyPool.indexOf(combo.state) + 1}, ${sent} chunks)`);
        return { ok: true, model: combo.model };
      }
      // empty response — agla combo try karo
    } catch (err) {
      const info = classifyErr(err);
      if (sent > 0) {
        // partial already stream ho chuka — caller ko success maanna chahiye
        console.log(`[Gemini] Stream broke mid-answer after ${sent} chunks — accepting partial`);
        return { ok: true, model: combo.model, partial: true };
      }
      reportFailure(combo.state, info);
      if (info.isAbort && deadline - Date.now() < 300) break; // budget khatam
    }
  }
  return { ok: false };
}

// ===== Non-streaming attempt (returns { ok, text }) =====
export async function geminiCompleteAttempt({ contents, config, timeoutMs = 6000 }) {
  const deadline = Date.now() + timeoutMs;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (deadline - Date.now() < 500) break;
    const combo = nextCombo();
    if (!combo) break;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), Math.max(deadline - Date.now(), 300));
      let res;
      try {
        res = await combo.state.client.models.generateContent({
          model: combo.model,
          contents,
          config: { ...config, abortSignal: controller.signal },
        });
      } finally {
        clearTimeout(timer);
      }
      const text = res?.text;
      if (text) {
        softCooldownUntil = 0; // success — cooldown clear
        console.log(`[Gemini] Answered via ${combo.model} (key #${keyPool.indexOf(combo.state) + 1})`);
        return { ok: true, text, model: combo.model };
      }
    } catch (err) {
      reportFailure(combo.state, classifyErr(err));
    }
  }
  return { ok: false };
}

// ===== Warm-up — server start par DNS/TLS connection garam =====
// (pehli real request 5s budget miss na kare)
if (keyPool.length) {
  setTimeout(() => {
    const combo = nextCombo();
    if (!combo) return;
    combo.state.client.models
      .generateContent({ model: combo.model, contents: 'hi', config: { maxOutputTokens: 4 } })
      .then(() => console.log(`[Gemini] Connection warmed up (${combo.model})`))
      .catch((e) => console.log('[Gemini] Warmup skipped:', String(e?.message || e).replace(/\s+/g, ' ').slice(0, 80)));
  }, 1500);
}
