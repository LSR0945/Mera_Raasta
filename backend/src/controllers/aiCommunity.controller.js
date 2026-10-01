import StudentProfile from '../models/StudentProfile.js';
import { logActivity } from './activity.controller.js';
import { GoogleGenAI } from '@google/genai';

const conversationHistory = new Map();

// ===== Gemini (official @google/genai SDK) — user ki AQ key, auto-retry =====
// Naya key (AQ.Ab8RN6Iq...) chal raha hai confirmed — model rotation + 5 min
// retry ka support fallback safety ke liye banaya hua hai.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
// SDK sirf key hone par banta hai (construction par koi network call nahi hoti)
const geminiAI = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;
let geminiStatus = { available: false, checkedAt: 0, model: null };
const GEMINI_RETRY_INTERVAL = 5 * 60 * 1000; // 5 min mein retry
// Har retry par ek naya model rotate hota hai — confirmed working models pehle
const GEMINI_MODELS = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-3.7-flash'];

// Warm-up: server start par pehli Gemini request slow hoti hai (DNS/TLS handshake)
// — timeouts miss na hon, isliye 1.5s mein connection warm kar lete hain
if (geminiAI) {
  setTimeout(() => {
    geminiAI.models
      .generateContent({ model: GEMINI_MODELS[0], contents: 'hi', config: { maxOutputTokens: 4 } })
      .then(() => console.log('[Gemini] Connection warmed up'))
      .catch((e) => console.log('[Gemini] Warmup skipped:', String(e?.message || e).replace(/\s+/g, ' ').slice(0, 80)));
  }, 1500);
}
let geminiModelIdx = 0;

function geminiShouldTry() {
  if (!GEMINI_API_KEY) return false;
  const now = Date.now();
  if (geminiStatus.available) return true; // working model cached hai
  if (now - geminiStatus.checkedAt < GEMINI_RETRY_INTERVAL) return false; // abhi retry mat karo
  return true; // retry ka time ho gaya
}

function currentGeminiModel() {
  if (geminiStatus.available && geminiStatus.model) return geminiStatus.model;
  return GEMINI_MODELS[geminiModelIdx % GEMINI_MODELS.length];
}

function markGeminiFailed(httpStatus) {
  geminiModelIdx++; // agle retry par agla model
  geminiStatus = { available: false, checkedAt: Date.now(), model: null };
  if (httpStatus) {
    console.log(`[Gemini] HTTP ${httpStatus} — key abhi bhi rejected (Google ka AQ bug). Will retry in 5 min with next model.`);
  }
}

// SDK error ke andar se HTTP status nikalo (401/403 = key rejected)
function geminiErrStatus(err) {
  const msg = String(err?.message || err || '');
  const m = msg.match(/"code"\s*:\s*(\d{3})/) || msg.match(/\b(?:HTTP\s*|status\s*:?\s*)(4\d\d|5\d\d)\b/);
  if (m) return Number(m[1]);
  if (/\b40[0-9]\b/.test(msg)) return 401;
  if (/\b50[0-9]\b/.test(msg)) return 503;
  return null;
}

// SDK call ko timeout mein wrap karo (fallback fast rahe)
function withTimeout(promise, ms) {
  let timer;
  const t = new Promise((_, rej) => { timer = setTimeout(() => rej(new Error('gemini timeout ' + ms + 'ms')), ms); });
  return Promise.race([promise, t]).finally(() => clearTimeout(timer));
}

// Gemini request params — per-user history + same system prompt (free AI jaisa)
function buildGeminiParams(message, userId, lang, profile) {
  const contents = [];
  try {
    const hist = getHistory(userId).slice(-8);
    for (const h of hist) {
      contents.push({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: String(h.content).slice(0, 2000) }] });
    }
  } catch {}
  contents.push({ role: 'user', parts: [{ text: message }] });
  return {
    contents,
    config: {
      systemInstruction: buildSystemPrompt(lang, profile),
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  };
}

// Non-streaming Gemini call (official SDK)
async function tryGeminiAPI(message, userId, lang, profile) {
  if (!geminiShouldTry()) return null;
  const model = currentGeminiModel();
  try {
    const params = buildGeminiParams(message, userId, lang, profile);
    const res = await withTimeout(geminiAI.models.generateContent({ model, ...params }), 6000);
    const text = res?.text; // SDK ka convenience getter — candidates se text nikalta hai
    if (text) {
      geminiStatus = { available: true, checkedAt: Date.now(), model };
      console.log(`[Gemini] WORKING via official SDK (${model})! Real Gemini response use ho raha hai.`);
      return text;
    }
    markGeminiFailed(null);
    return null;
  } catch (err) {
    const status = geminiErrStatus(err);
    if (!status || status >= 500) {
      console.log('[Gemini] Error:', String(err?.message || err).replace(/\s+/g, ' ').slice(0, 100), '— fallback use hoga.');
    }
    markGeminiFailed(status && status < 500 ? status : null);
    return null;
  }
}

// Streaming Gemini call (official SDK — generateContentStream, token-by-token)
async function streamGeminiAPI(message, userId, lang, profile, onChunk) {
  if (!geminiShouldTry()) return false;
  const model = currentGeminiModel();
  try {
    const params = buildGeminiParams(message, userId, lang, profile);
    const stream = await withTimeout(geminiAI.models.generateContentStream({ model, ...params }), 8000);
    let gotAny = false;
    for await (const chunk of stream) {
      const t = chunk?.text;
      if (t) { gotAny = true; onChunk(t); }
    }
    if (gotAny) {
      geminiStatus = { available: true, checkedAt: Date.now(), model };
      console.log(`[Gemini] Stream WORKING via official SDK (${model})!`);
      return true;
    }
    markGeminiFailed(null);
    return false;
  } catch (err) {
    const status = geminiErrStatus(err);
    if (!status || status >= 500) {
      console.log('[Gemini] Stream error:', String(err?.message || err).replace(/\s+/g, ' ').slice(0, 100), '— fallback use hoga.');
    }
    markGeminiFailed(status && status < 500 ? status : null);
    return false;
  }
}

// ===== Free AI — multi-provider chain (bina kisi API key ke REAL AI) =====
// Gemini AQ key abhi Google ke bug se 401 deta hai. Isliye 3 free AI providers
// automatic use hote hain — ek down ho toh doosra TURANT jawab deta hai.
// Offline mode sirf tab aata hai jab TEENO providers ek saath down hon.
const FREE_AI_PROVIDERS = [
  { name: 'KiloCode', url: 'https://api.kilo.ai/api/gateway/chat/completions', model: 'kilo-auto/free', timeoutMs: 18000, failedUntil: 0 },
  { name: 'LLM7', url: 'https://api.llm7.io/v1/chat/completions', model: 'mistral-Nemo-Instruct-2407', timeoutMs: 20000, failedUntil: 0 },
  { name: 'OVH', url: 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions', model: 'Mistral-7B-Instruct-v0.3', timeoutMs: 15000, failedUntil: 0 },
];
// Providers par ek time par ek hi request jaye (429 rate limit se bachne ke liye)
let freeAISerial = Promise.resolve();
function enqueueFreeAI(fn) {
  const run = freeAISerial.then(fn, fn);
  freeAISerial = run.then(() => {}, () => {});
  return run;
}
// Jo provider abhi cooldown mein nahi hai
function availableProviders() {
  const now = Date.now();
  return FREE_AI_PROVIDERS.filter(p => now >= p.failedUntil);
}

function buildSystemPrompt(lang, profile) {
  const langName = lang === 'hi' ? 'Hindi' : lang === 'hinglish' ? 'Hinglish (Hindi written in English script)' : 'English';
  let profileLine = '';
  try {
    if (profile) {
      const bits = [];
      if (profile.user?.name) bits.push(profile.user.name);
      if (profile.educationLevel) bits.push('studying ' + profile.educationLevel);
      if (profile.stream) bits.push('stream ' + profile.stream);
      if (profile.interests?.length) bits.push('interests: ' + profile.interests.slice(0, 8).join(', '));
      if (profile.careerGoals?.dreamJob) bits.push('dream job: ' + profile.careerGoals.dreamJob);
      if (bits.length) profileLine = `\nStudent background info (use only to personalize answers): ${bits.join('; ')}.`;
    }
  } catch {}
  return `You are Mera Raasta AI — a friendly, smart Indian education and career guidance assistant, similar to Google Gemini. You answer EVERY question well: general knowledge, science, math, coding, career advice, Indian exams (JEE/NEET/UPSC/SSC/GATE), college choices, life advice, definitions, and casual conversation.
Language: Always respond in ${langName}.${profileLine}
IMPORTANT: The conversation history below shows what the user ACTUALLY said — when the user asks about something they told you earlier, always trust the conversation history over the background info above.
Style: Use markdown (**bold**, lists, code blocks). Be concise but complete and accurate. Add emojis naturally. Never say you cannot help — always give a real answer.`;
}

function buildMessages(message, userId, lang, profile) {
  const messages = [{ role: 'system', content: buildSystemPrompt(lang, profile) }];
  try {
    const hist = getHistory(userId).slice(-8);
    for (const h of hist) {
      if (h.content) messages.push({ role: h.role === 'user' ? 'user' : 'assistant', content: String(h.content).slice(0, 1500) });
    }
  } catch {}
  messages.push({ role: 'user', content: message });
  return messages;
}

function markProviderFailure(provider, err) {
  // 429 = rate limit (8s cooldown); baaki errors (timeout/network) = 12s.
  // Sirf YEH provider cool hota hai — race mein baaki providers already chal rahe hain.
  const cooldown = err?.status === 429 ? 8000 : 12000;
  provider.failedUntil = Date.now() + cooldown;
  console.log(`[FreeAI:${provider.name}] ${err.message} — ${cooldown / 1000}s cooldown.`);
}

// Agar SAB providers cooldown mein hain toh sabse jaldi expire hone wale ka wait (max 6s)
async function waitForCoolingProviders() {
  const now = Date.now();
  const soonest = Math.min(...FREE_AI_PROVIDERS.map(p => p.failedUntil));
  if (soonest > now && soonest - now <= 6000) {
    await new Promise(r => setTimeout(r, soonest - now + 200));
    return true;
  }
  return false;
}

// Non-streaming RACE: providers EK SAATH call hote hain, pehla complete jawab
// jeet jata hai aur baaki abort ho jate hain. Ek provider slow/429 ho toh
// koi na koi provider turant jawab deta hai.
function raceAnswer(msgs, providers) {
  return new Promise((resolve) => {
    if (!providers.length) return resolve(null);
    let settled = false;
    let pending = providers.length;
    const aborters = [];
    const finish = (val) => {
      if (settled) return;
      settled = true;
      for (const c of aborters) { try { c.abort(); } catch {} }
      resolve(val);
    };
    for (const p of providers) {
      (async () => {
        const controller = new AbortController();
        aborters.push(controller);
        const timer = setTimeout(() => controller.abort(), p.timeoutMs);
        try {
          const resp = await fetch(p.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: p.model, messages: msgs }),
            signal: controller.signal,
          });
          if (!resp.ok) { const e = new Error(`HTTP ${resp.status}`); e.status = resp.status; throw e; }
          const data = await resp.json();
          clearTimeout(timer);
          const text = data?.choices?.[0]?.message?.content;
          if (text && text.trim()) {
            console.log(`[FreeAI] Real AI answer via ${p.name} (race won).`);
            finish(text);
            return;
          }
          throw new Error('empty response');
        } catch (err) {
          clearTimeout(timer);
          if (!settled) markProviderFailure(p, err);
        } finally {
          pending--;
          if (pending === 0 && !settled) finish(null);
        }
      })();
    }
  });
}

// Non-streaming: race chalao; sab fail ho toh 2s baad DOBARA (force) —
// 429 burst aksar 2-3 second mein clear ho jata hai. Offline bahut kam hi dikhega.
async function tryFreeAI(message, userId, lang, profile) {
  if (availableProviders().length === 0) {
    if (!(await waitForCoolingProviders())) { /* force retry neeche handle karega */ }
  }
  return await enqueueFreeAI(async () => {
    const msgs = buildMessages(message, userId, lang, profile);
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, 2000));
      // Attempt 0: available providers; retries: SAB providers (cooldown ignore)
      const providers = attempt === 0 && availableProviders().length
        ? availableProviders()
        : FREE_AI_PROVIDERS;
      const text = await raceAnswer(msgs, providers);
      if (text) return text;
    }
    return null; // teeno attempts fail → offline fallback
  });
}

// Streaming RACE: providers ka stream ek saath chalu — pehla provider jo pehla
// token de wahi winner; sirf uske chunks client ko jaate hain, baaki abort.
// Agar kisi ne pehla chunk nahi bheja (sab fail) toh false return hota hai.
function raceStreamOnce(msgs, providers, onChunk) {
  return new Promise((resolve) => {
    if (!providers.length) return resolve(false);
    let winner = null;
    let settled = false;
    let pending = providers.length;
    const aborters = [];
    const finish = (val) => {
      if (settled) return;
      settled = true;
      for (const c of aborters) { try { c.abort(); } catch {} }
      resolve(val);
    };
    for (const p of providers) {
      (async () => {
        const controller = new AbortController();
        aborters.push(controller);
        const headerTimer = setTimeout(() => controller.abort(), p.timeoutMs);
        let gotAny = false;
        try {
          const resp = await fetch(p.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: p.model, stream: true, messages: msgs }),
            signal: controller.signal,
          });
          if (!resp.ok) { const e = new Error(`HTTP ${resp.status}`); e.status = resp.status; throw e; }
          clearTimeout(headerTimer);
          const reader = resp.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          while (true) {
            // First chunk tak 20s, uske baad har read par 25s idle timeout
            const idleMs = gotAny ? 25000 : 20000;
            let rdTimer;
            const idle = new Promise((_, rej) => { rdTimer = setTimeout(() => rej(new Error(gotAny ? 'stream idle timeout' : 'no first chunk')), idleMs); });
            let rd;
            try {
              rd = await Promise.race([reader.read(), idle]);
            } finally {
              clearTimeout(rdTimer);
            }
            const { done, value } = rd;
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); // last incomplete line ko agle chunk mein complete karo
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data:')) continue;
              const payload = trimmed.slice(5).trim();
              if (payload === '[DONE]') continue;
              try {
                const json = JSON.parse(payload);
                const delta = json?.choices?.[0]?.delta?.content;
                if (delta) {
                  if (!winner) {
                    winner = p; // pehla token dene wala provider jeet gaya
                    console.log(`[FreeAI] Stream race won by ${p.name}.`);
                  }
                  if (winner === p && !settled) {
                    gotAny = true;
                    onChunk(delta);
                  }
                }
              } catch {}
            }
            if (settled && winner !== p) return; // koi aur jeet chuka hai — band karo
          }
          if (winner === p && gotAny) {
            console.log(`[FreeAI] Stream complete via ${p.name}.`);
            finish(true);
          } else if (!winner && !gotAny) {
            markProviderFailure(p, new Error('empty stream'));
          }
        } catch (err) {
          if (winner === p && gotAny) {
            // Winner ke beech mein connection toota — bheje hue chunks accept karo
            console.log(`[FreeAI] Partial stream from ${p.name} accepted.`);
            finish(true);
          } else if (!winner) {
            markProviderFailure(p, err);
          }
          // Agar koi aur winner hai toh yeh error ignore (loser tha)
        } finally {
          clearTimeout(headerTimer);
          pending--;
          if (pending === 0 && !settled) finish(false);
        }
      })();
    }
  });
}

// Streaming: race + sab fail hone par 2s baad force retry (chunks tab tak nahi
// gaye the, isliye retry safe hai) — pehla chunk aaye tab tak offline nahi dikhta.
async function streamFreeAI(message, userId, lang, profile, onChunk) {
  if (availableProviders().length === 0) {
    await waitForCoolingProviders(); // force retry neeche handle karega
  }
  return await enqueueFreeAI(async () => {
    const msgs = buildMessages(message, userId, lang, profile);
    for (let attempt = 0; attempt < 3; attempt++) {
      if (attempt > 0) await new Promise(r => setTimeout(r, 2000));
      const providers = attempt === 0 && availableProviders().length
        ? availableProviders()
        : FREE_AI_PROVIDERS;
      const ok = await raceStreamOnce(msgs, providers, onChunk);
      if (ok) return true;
    }
    return false; // teeno attempts fail → offline fallback
  });
}

function detectLanguage(text) {
  if (!text || !text.trim()) return 'en';
  const hindiChars = text.match(/[\u0900-\u097F]/g);
  const latinChars = text.match(/[a-zA-Z]/g);
  const hc = hindiChars ? hindiChars.length : 0;
  const lc = latinChars ? latinChars.length : 0;
  if (hc >= 3 && lc < 5) return 'hi';
  if (hc > 0 && lc > 0) return 'hinglish';
  if (hc > lc * 0.3) return 'hinglish';
  return 'en';
}
function detectTopic(message) {
  const m = message.toLowerCase();
  if (/^(hi|hello|hey|namaste|namaskar|good morning|good evening|good afternoon|good night|kaise ho|how are you|bye|thank|thanks|dhanyavad|ok|okay|theek hai|accha|ji|haan|nahi|yes|no|sure|help|help me|help karo|meri help|mujhe help|bachao)/i.test(m)) return 'conversation';
  if (/\b(joke|funny|comedy|hasa|hasao|mazak|masti|humour|humor|witty)\b/i.test(m)) return 'joke';
  if (/\b(motivat|inspir|success|fail|failure|never give up|hard work|dream|goal|stress|stressed|depress|depressed|anxiety|anxious|worried|sad|sadness|hopeless|tension|pressure|upset|unhappy|crying|cry|lonely|alone|scared|afraid|fear|panic|overwhelmed|burnout|burn out|mann nahi lag|mann nahin lag|padhai ka mann|energy nahi|give up chhod)\b/i.test(m)) return 'motivation';
  if (/\b(recipe|cook|food|dish|meal|biryani|pizza|burger|chai|coffee|pakora|samosa|dosa|idli|paratha|roti|rice|dal|curry|paneer|chicken|noodles)\b/i.test(m)) return 'recipe';
  if (/\b(java|python|javascript|typescript|c\+\+|cpp|c#|ruby|php|swift|kotlin|dart|golang|rust|sql|mysql|html|css|react|angular|vue|next\.?js|node\.?js|express|django|flask|spring|laravel)\b/i.test(m)) return 'programming';
  if (/\b(code|program|function|class|loop|array|print|return|import|export|def |int |void |static |public |private|api|endpoint|route|component|query|database)\b/i.test(m) && /\b(write|create|build|make|code|program|implement|develop|design|show|tell|how to|write a|create a)\b/i.test(m)) return 'programming';
  if (/\b(math|maths|calculate|solve|equation|algebra|geometry|trigonometry|calculus|derivative|integral|matrix|probability|statistics|factorial|quadratic|linear|arithmetic|percentage|fraction|decimal|ratio|lcm|hcf|gcd|prime|square root|pythagoras)\b/i.test(m)) return 'math';
  if (/\d+\s*[+\-*/^%]\s*\d+/.test(m)) return 'math';
  if (/\b(physics|chemistry|biology|science|atom|molecule|cell|force|energy|velocity|acceleration|gravity|electricity|magnetism|chemical|reaction|periodic table|newton|quantum|electron|proton|neutron|photosynthesis|genetics|dna|rna|protein|ecology|thermodynamics|optics)\b/i.test(m)) return 'science';
  if (/\b(career|job|salary|placement|interview|resume|cv|internship|fresher|company|mnc|startup|google|amazon|tcs|infosys|wipro|iit|nit|bits|iim|aiims|gate|cat exam|gmat|gre|ielts|toefl|bsc|msc|bca|mca|mba|engineering|doctor|lawyer)\b/i.test(m)) return 'career';
  if (/\b(exam|preparation|syllabus|mock test|previous year|question paper|jee|neet|upsc|ssc|banking|ibps|rrb|nta|cbse|icse|board exam|competitive|entrance|gate|clat|nda|cds|cgl|chsl|railway|ctet|ugc net|bitsat|viteee)\b/i.test(m)) return 'exam';
  return 'general';
}
function detectProgrammingLanguage(message) {
  const m = message.toLowerCase();
  if (/\b(python|py)\b/i.test(m)) return 'Python';
  if (/\b(java(?!script))\b/i.test(m)) return 'Java';
  if (/\b(javascript|js|node\.?js|nodejs)\b/i.test(m)) return 'JavaScript';
  if (/\b(typescript|ts)\b/i.test(m)) return 'TypeScript';
  if (/\b(\bc\b|c language)\b/i.test(m)) return 'C';
  if (/\b(c\+\+|cpp|c plus plus)\b/i.test(m)) return 'C++';
  if (/\b(c#|c sharp|csharp)\b/i.test(m)) return 'C#';
  if (/\b(php)\b/i.test(m)) return 'PHP';
  if (/\b(ruby|rails)\b/i.test(m)) return 'Ruby';
  if (/\b(swift)\b/i.test(m)) return 'Swift';
  if (/\b(kotlin|kt)\b/i.test(m)) return 'Kotlin';
  if (/\b(dart|flutter)\b/i.test(m)) return 'Dart';
  if (/\b(golang|go language)\b/i.test(m)) return 'Go';
  if (/\b(rust)\b/i.test(m)) return 'Rust';
  if (/\b(sql|mysql|postgresql|database query)\b/i.test(m)) return 'SQL';
  if (/\b(html|html5|webpage|web page)\b/i.test(m)) return 'HTML';
  if (/\b(css|css3|styling|style sheet)\b/i.test(m)) return 'CSS';
  if (/\b(react|reactjs|react\.js|jsx)\b/i.test(m)) return 'React';
  if (/\b(angular|angularjs)\b/i.test(m)) return 'Angular';
  if (/\b(vue|vuejs)\b/i.test(m)) return 'Vue';
  if (/\b(next\.?js|nextjs)\b/i.test(m)) return 'Next.js';
  if (/\b(django)\b/i.test(m)) return 'Django';
  if (/\b(flask)\b/i.test(m)) return 'Flask';
  if (/\b(spring boot|springboot|spring)\b/i.test(m)) return 'Spring Boot';
  if (/\b(laravel)\b/i.test(m)) return 'Laravel';
  if (/\b(system\.out|public static void main|Scanner|ArrayList|HashMap)\b/i.test(m)) return 'Java';
  if (/\b(def |print\(|input\(|if __name__|from \w+ import|self\.|class \w+:)\b/i.test(m)) return 'Python';
  if (/\b(console\.log|document\.|window\.|fetch\(|\.then\(|addEventListener|querySelector)\b/i.test(m)) return 'JavaScript';
  if (/\b(printf|scanf|#include|malloc|free|struct |int main|char \*)\b/i.test(m)) return 'C';
  if (/\b(cout|cin|std::|iostream|vector<|map<|endl|namespace)\b/i.test(m)) return 'C++';
  return null;
}
function detectCodeTask(message) {
  const m = message.toLowerCase();
  if (/\b(hello world)\b/i.test(m)) return 'helloWorld';
  if (/\b(calculator|calc)\b/i.test(m)) return 'calculator';
  if (/\b(factorial|fact)\b/i.test(m)) return 'factorial';
  if (/\b(fibonacci|fib)\b/i.test(m)) return 'fibonacci';
  if (/\b(palindrome)\b/i.test(m)) return 'palindrome';
  if (/\b(reverse|reversing)\b/i.test(m)) return 'reverse';
  if (/\b(sort|sorting|bubble sort|quick sort|merge sort)\b/i.test(m)) return 'sort';
  if (/\b(search|binary search|linear search)\b/i.test(m)) return 'search';
  if (/\b(linked list|linkedlist)\b/i.test(m)) return 'linkedList';
  if (/\b(binary tree|bst|binary search tree)\b/i.test(m)) return 'binaryTree';
  if (/\b(stack|push|pop)\b/i.test(m)) return 'stack';
  if (/\b(queue|enqueue|dequeue)\b/i.test(m)) return 'queue';
  if (/\b(graph|bfs|dfs|dijkstra)\b/i.test(m)) return 'graph';
  if (/\b(file|read file|write file|file handling)\b/i.test(m)) return 'fileHandling';
  if (/\b(database|db|crud)\b/i.test(m)) return 'database';
  if (/\b(api|rest api|restful|endpoint)\b/i.test(m)) return 'api';
  if (/\b(todolist|to-do|todo list|task list)\b/i.test(m)) return 'todoApp';
  if (/\b(game|tic tac toe|snake|quiz)\b/i.test(m)) return 'game';
  if (/\b(password|password generator)\b/i.test(m)) return 'passwordGen';
  if (/\b(bmi|body mass)\b/i.test(m)) return 'bmi';
  if (/\b(sum of array|array sum|sum array)\b/i.test(m)) return 'arraySum';
  if (/\b(max|min|largest|smallest|maximum|minimum)\b/i.test(m)) return 'maxMin';
  if (/\bprime|prime number|is prime\b/i.test(m)) return 'prime';
  if (/\b(oop|object oriented|inheritance|polymorphism|encapsulation|abstraction)\b/i.test(m)) return 'oop';
  if (/\b(recursion|recursive)\b/i.test(m)) return 'recursion';
  if (/\b(array|matrix|2d array)\b/i.test(m)) return 'array';
  if (/\b(string|reverse string|anagram)\b/i.test(m)) return 'string';
  if (/\b(loop|for loop|while loop|do while)\b/i.test(m)) return 'loop';
  if (/\b(condition|if else|switch|ternary)\b/i.test(m)) return 'condition';
  if (/\b(function|method|arrow function)\b/i.test(m)) return 'function';
  if (/\b(login|signup|sign up|register)\b/i.test(m)) return 'auth';
  if (/\b(hook|usestate|useeffect|react hook)\b/i.test(m)) return 'reactHook';
  if (/\b(state|redux|context api)\b/i.test(m)) return 'stateManagement';
  if (/\b(routing|react router)\b/i.test(m)) return 'routing';
  if (/\b(tailwind|styled component)\b/i.test(m)) return 'styling';
  if (/\b(animation|transition|framer motion)\b/i.test(m)) return 'animation';
  if (/\b(middleware)\b/i.test(m)) return 'middleware';
  if (/\b(pagination)\b/i.test(m)) return 'pagination';
  if (/\b(upload|multer|file upload)\b/i.test(m)) return 'upload';
  if (/\b(jwt|json web token|token)\b/i.test(m)) return 'auth';
  if (/\b(bcrypt|hash|password hash)\b/i.test(m)) return 'hash';
  if (/\b(chart|graph|visualization|chartjs)\b/i.test(m)) return 'chart';
  if (/\b(payment|razorpay|stripe|paytm)\b/i.test(m)) return 'payment';
  if (/\b(shopping|ecommerce|e-commerce|cart)\b/i.test(m)) return 'ecommerce';
  if (/\b(blog|article|cms)\b/i.test(m)) return 'blog';
  if (/\b(note|note app|memo)\b/i.test(m)) return 'noteApp';
  if (/\b(resume|cv|portfolio)\b/i.test(m)) return 'portfolio';
  if (/\b(websocket|socket|real time|chat app)\b/i.test(m)) return 'websocket';
  if (/\b(email|nodemailer|sendgrid|smtp)\b/i.test(m)) return 'email';
  if (/\b(deploy|docker|kubernetes)\b/i.test(m)) return 'deploy';
  if (/\b(test|unit test|testing|jest|mocha)\b/i.test(m)) return 'test';
  if (/\b(debug|error|exception|try catch)\b/i.test(m)) return 'debug';
  if (/\b(security|xss|sql injection)\b/i.test(m)) return 'security';
  if (/\b(variable|constant|declaration)\b/i.test(m)) return 'variable';
  if (/\b(comment|documentation)\b/i.test(m)) return 'comment';
  if (/\b(package|module|import|require)\b/i.test(m)) return 'module';
  if (/\b(form|input|validation)\b/i.test(m)) return 'form';
  if (/\b(page|webpage|landing|website)\b/i.test(m)) return 'webpage';
  if (/\b(app|application|mobile app)\b/i.test(m)) return 'app';
  if (/\b(git|github|version control|commit)\b/i.test(m)) return 'git';
  if (/\b(dashboard|admin panel)\b/i.test(m)) return 'dashboard';
  if (/\b(notification|alert|toast)\b/i.test(m)) return 'notification';
  if (/\b(table|data table)\b/i.test(m)) return 'table';
  if (/\b(weather|forecast)\b/i.test(m)) return 'weather';
  if (/\b(social media|post|feed)\b/i.test(m)) return 'socialMedia';
  if (/\b(map|location|geolocation)\b/i.test(m)) return 'map';
  if (/\b(movie|stream|video|youtube)\b/i.test(m)) return 'streaming';
  if (/\b(otp|verify)\b/i.test(m)) return 'otp';
  if (/\b(reset password|forgot password)\b/i.test(m)) return 'resetPassword';
  if (/\b(profile|user profile|account)\b/i.test(m)) return 'profile';
  return 'generalCode';
}
function getHistory(userId) {
  // ObjectId har request mein naya instance hota hai — Map key ke liye
  // hamesha string use karo warna purani history kabhi nahi milegi
  const key = String(userId);
  if (!conversationHistory.has(key)) conversationHistory.set(key, []);
  return conversationHistory.get(key);
}

function addToHistory(userId, role, content) {
  const hist = getHistory(String(userId));
  hist.push({ role, content, timestamp: Date.now() });
  if (hist.length > 20) hist.splice(0, hist.length - 20);
}

function getRecentContext(userId) {
  const hist = getHistory(userId);
  return hist.slice(-10).map(h => h.content).join('\n');
}

function generateCodeResponse(message, lang) {
  const detected = detectProgrammingLanguage(message);
  const langName = detected || 'Python';
  const task = detectCodeTask(message);
  const hi = lang === 'hi';
  const hn = lang === 'hinglish';
  const prefix = hi ? 'Ye raha aapka code:\n\n' : hn ? 'Ye raha aapka code:\n\n' : 'Here is your code:\n\n';

  const pyTasks = {
    helloWorld: prefix + `**Python Hello World:**\n\n` + '```' + `python\nprint("Hello, World!")\nprint("Welcome to Python!")\n` + '```' + `\n\n**Output:**\n` + '```' + `\nHello, World!\nWelcome to Python!\n` + '```' + `\n\n` + '`' + `print()` + '`' + ` function output dikhata hai. Python bahut simple aur powerful language hai! 🐍`,
    calculator: prefix + `**Python Calculator:**\n\n` + '```' + `python\ndef add(a, b): return a + b\ndef subtract(a, b): return a - b\ndef multiply(a, b): return a * b\ndef divide(a, b): return a / b if b != 0 else "Error!"\n\nprint("1.Add 2.Subtract 3.Multiply 4.Divide")\nchoice = input("Choose: ")\nnum1 = float(input("First: "))\nnum2 = float(input("Second: "))\n\nops = {'1': add, '2': subtract, '3': multiply, '4': divide}\nif choice in ops:\n    print(f"Result: {ops[choice](num1, num2)}")\nelse:\n    print("Invalid!")\n` + '```' + `\n\nYeh calculator **4 operations** support karta hai! 🧮`,
    factorial: prefix + `**Python Factorial:**\n\n` + '```' + `python\ndef factorial(n):\n    if n <= 1: return 1\n    return n * factorial(n - 1)\n\nnum = int(input("Enter number: "))\nprint(f"{num}! = {factorial(num)}")\n` + '```' + `\n\n**Output:** ` + '`' + `5! = 120` + '`' + `\n\n5! = 5 × 4 × 3 × 2 × 1 = **120** 🎯`,
    fibonacci: prefix + `**Python Fibonacci:**\n\n` + '```' + `python\ndef fibonacci(n):\n    a, b = 0, 1\n    for _ in range(n):\n        print(a, end=" ")\n        a, b = b, a + b\n    print()\n\nfibonacci(10)\n` + '```' + `\n\n**Output:** ` + '`' + `0 1 1 2 3 5 8 13 21 34` + '`' + `\n\nHar number pichle do ka sum hai! 📈`,
    palindrome: prefix + `**Python Palindrome:**\n\n` + '```' + `python\ndef is_palindrome(s):\n    s = s.lower().replace(" ", "")\n    return s == s[::-1]\n\nword = input("Enter word: ")\nif is_palindrome(word):\n    print(f"'{word}' is a palindrome!")\nelse:\n    print(f"'{word}' is not palindrome")\n` + '```' + `\n\n**Output:** ` + '`' + `racecar is palindrome` + '`' + ` 🔄`,
    sort: prefix + `**Python Sorting:**\n\n` + '```' + `python\ndef bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]\n    return arr\n\nnumbers = [64, 34, 25, 12, 22, 11, 90]\nprint(f"Sorted: {bubble_sort(numbers.copy())}")\nprint(f"Built-in: {sorted(numbers)}")\n` + '```' + `\n\n**Output:** ` + '`' + `[11, 12, 22, 25, 34, 64, 90]` + '`' + ` 📊`,
    oop: prefix + `**Python OOP:**\n\n` + '```' + `python\nclass Student:\n    def __init__(self, name, age, grade):\n        self.name = name\n        self.age = age\n        self.grade = grade\n\n    def display(self):\n        print(f"Name: {self.name}, Age: {self.age}, Grade: {self.grade}")\n\n    def is_passed(self):\n        return self.grade >= 60\n\nclass GraduateStudent(Student):\n    def __init__(self, name, age, grade, thesis):\n        super().__init__(name, age, grade)\n        self.thesis = thesis\n\nstudent1 = Student("Rahul", 20, 85)\nstudent1.display()\ngrad = GraduateStudent("Priya", 24, 90, "AI in Education")\ngrad.display()\n` + '```' + `\n\n**OOP Concepts:** Class, Object, Inheritance, Encapsulation, Polymorphism 🏗️`,
    array: prefix + `**Python List/Array:**\n\n` + '```' + `python\nnumbers = [10, 20, 30, 40, 50]\nnumbers.append(60)\nnumbers.insert(2, 25)\nprint(f"After add: {numbers}")\nnumbers.remove(30)\nprint(f"After remove: {numbers}")\nprint(f"Slice [1:4]: {numbers[1:4]}")\nnumbers.sort(reverse=True)\nprint(f"Sorted desc: {numbers}")\n\nmatrix = [[1,2,3],[4,5,6],[7,8,9]]\nfor row in matrix: print(row)\n` + '```' + `\n\nLists Python ka versatile data structure hai! 📋`,
    string: prefix + `**Python Strings:**\n\n` + '```' + `python\ns = "Hello, World!"\nprint(f"Upper: {s.upper()}")\nprint(f"Lower: {s.lower()}")\nprint(f"Reversed: {s[::-1]}")\nprint(f"Find World: {s.find('World')}")\nprint(f"Replace: {s.replace('World', 'Python')}")\nwords = s.split(", ")\nprint(f"Split: {words}")\n` + '```' + `\n\nStrings Python mein immutable hain! 🔤`,
    loop: prefix + `**Python Loops:**\n\n` + '```' + `python\nprint("For Loop:")\nfor i in range(1, 6):\n    print(f"  {i} x 5 = {i*5}")\n\nprint("While Loop:")\ncount = 5\nwhile count > 0:\n    print(f"  {count}")\n    count -= 1\n\nfruits = ["apple", "banana", "cherry"]\nfor i, f in enumerate(fruits):\n    print(f"  {i+1}. {f}")\n` + '```' + `\n\nLoops tab use hote hain jab kaam baar baar karna ho! 🔄`,
    condition: prefix + `**Python Conditions:**\n\n` + '```' + `python\nage = 18\nif age >= 18:\n    print("You can vote!")\nelif age >= 16:\n    print("You can drive!")\nelse:\n    print("You are a minor!")\n\nmarks = 85\ngrade = "A+" if marks >= 90 else "A" if marks >= 80 else "B"\nprint(f"Grade: {grade}")\n\nnum = 10\nprint(f"{num} is {'Even' if num%2==0 else 'Odd'}")\n` + '```' + `\n\nConditions se program decision leta hai! 🤔`,
    function: prefix + `**Python Functions:**\n\n` + '```' + `python\ndef greet(name):\n    return f"Hello, {name}!"\n\ndef power(base, exp=2):\n    return base ** exp\n\nsquare = lambda x: x ** 2\n\nprint(greet("Rahul"))\nprint(f"3^2 = {power(3)}")\nprint(f"Square of 5 = {square(5)}")\n` + '```' + `\n\nFunctions code ko reusable banate hain! ♻️`,
    recursion: prefix + `**Python Recursion:**\n\n` + '```' + `python\ndef factorial(n):\n    if n <= 1: return 1\n    return n * factorial(n-1)\n\ndef fibonacci(n):\n    if n <= 0: return 0\n    if n == 1: return 1\n    return fibonacci(n-1) + fibonacci(n-2)\n\ndef power(base, exp):\n    if exp == 0: return 1\n    return base * power(base, exp-1)\n\nprint(f"5! = {factorial(5)}")\nfor i in range(8): print(f"fib({i})={fibonacci(i)}", end=" ")\nprint(f"\\n2^10 = {power(2, 10)}")\n` + '```' + `\n\nRecursion mein function khud ko call karta hai! 🔄`,
    generalCode: prefix + `**Python Utility Program:**\n\n` + '```' + `python\nfrom datetime import datetime\nimport random\n\ndef greet(name):\n    h = datetime.now().hour\n    if h < 12: return f"Good Morning, {name}!"\n    elif h < 17: return f"Good Afternoon, {name}!"\n    elif h < 21: return f"Good Evening, {name}!"\n    else: return f"Good Night, {name}!"\n\ndef factorial(n):\n    return 1 if n <= 1 else n * factorial(n-1)\n\ndef is_prime(n):\n    if n < 2: return False\n    for i in range(2, int(n**0.5)+1):\n        if n % i == 0: return False\n    return True\n\ndef reverse_string(s): return s[::-1]\n\nprint(greet("Student"))\nprint(f"10! = {factorial(10)}")\nprint(f"17 is {'prime' if is_prime(17) else 'not prime'}")\nprint(f"Reversed: {reverse_string('Hello')}")\n` + '```' + `\n\nYeh **complete utility program** hai! 🐍`
  };

  const javaTasks = {
    helloWorld: prefix + `**Java Hello World:**\n\n` + '```' + `java\npublic class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n        System.out.println("Welcome to Java!");\n    }\n}\n` + '```' + `\n\n**Output:** ` + '`' + `Hello, World!` + '`' + `\n\nJava strongly-typed OOP language hai! ☕`,
    calculator: prefix + `**Java Calculator:**\n\n` + '```' + `java\nimport java.util.Scanner;\n\npublic class Calculator {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        System.out.println("1.Add 2.Sub 3.Mul 4.Div");\n        int ch = sc.nextInt();\n        double a = sc.nextDouble(), b = sc.nextDouble();\n        switch(ch) {\n            case 1: System.out.println("Result: " + (a+b)); break;\n            case 2: System.out.println("Result: " + (a-b)); break;\n            case 3: System.out.println("Result: " + (a*b)); break;\n            case 4: if(b!=0) System.out.println("Result: " + (a/b)); else System.out.println("Error!"); break;\n            default: System.out.println("Invalid!");\n        }\n        sc.close();\n    }\n}\n` + '```' + `\n\nJava mein **switch-case** bahut powerful hai! 🧮`,
    factorial: prefix + `**Java Factorial:**\n\n` + '```' + `java\nimport java.util.Scanner;\n\npublic class Factorial {\n    public static long factorial(int n) {\n        if (n <= 1) return 1;\n        return n * factorial(n - 1);\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        System.out.print("Enter number: ");\n        int n = sc.nextInt();\n        System.out.println(n + "! = " + factorial(n));\n        sc.close();\n    }\n}\n` + '```' + `\n\n**Output:** ` + '`' + `5! = 120` + '`' + ` 🎯`,
    fibonacci: prefix + `**Java Fibonacci:**\n\n` + '```' + `java\npublic class Fibonacci {\n    public static void main(String[] args) {\n        int a = 0, b = 1;\n        System.out.print("Fibonacci: ");\n        for (int i = 0; i < 10; i++) {\n            System.out.print(a + " ");\n            int temp = a + b;\n            a = b;\n            b = temp;\n        }\n        System.out.println();\n    }\n}\n` + '```' + `\n\n**Output:** ` + '`' + `0 1 1 2 3 5 8 13 21 34` + '`' + ` 📈`,
    oop: prefix + `**Java OOP:**\n\n` + '```' + `java\npublic class Student {\n    private String name;\n    private int age;\n\n    public Student(String name, int age) {\n        this.name = name;\n        this.age = age;\n    }\n\n    public void display() {\n        System.out.println("Name: " + name + ", Age: " + age);\n    }\n\n    public static void main(String[] args) {\n        Student s = new Student("Rahul", 20);\n        s.display();\n    }\n}\n` + '```' + `\n\nJava mein **encapsulation** ke liye private fields + getters/setters use karte hain! 🏗️`,
    array: prefix + `**Java Arrays & ArrayList:**\n\n` + '```' + `java\nimport java.util.*;\n\npublic class ArrayDemo {\n    public static void main(String[] args) {\n        int[] arr = {10, 20, 30, 40, 50};\n        System.out.println("Array: " + Arrays.toString(arr));\n\n        ArrayList<Integer> list = new ArrayList<>();\n        list.add(100);\n        list.add(200);\n        list.add(1, 150);\n        System.out.println("ArrayList: " + list);\n        list.remove(0);\n        Collections.sort(list);\n        System.out.println("Sorted: " + list);\n    }\n}\n` + '```' + `\n\nJava mein **ArrayList** dynamic hota hai! 📋`,
    generalCode: prefix + `**Java Utility Class:**\n\n` + '```' + `java\nimport java.util.*;\n\npublic class Utils {\n    static int factorial(int n) { return n <= 1 ? 1 : n * factorial(n-1); }\n    static boolean isPrime(int n) {\n        if (n < 2) return false;\n        for (int i = 2; i*i <= n; i++)\n            if (n % i == 0) return false;\n        return true;\n    }\n    static String reverse(String s) {\n        return new StringBuilder(s).reverse().toString();\n    }\n    public static void main(String[] args) {\n        System.out.println("5! = " + factorial(5));\n        System.out.println("17 prime? " + isPrime(17));\n        System.out.println("Reversed: " + reverse("Hello"));\n    }\n}\n` + '```' + `\n\nYeh **Java utility class** hai! ☕`
  };

  const jsTasks = {
    helloWorld: prefix + `**JavaScript Hello World:**\n\n` + '```' + `javascript\nconsole.log("Hello, World!");\nconsole.log("Welcome to JavaScript!");\n` + '```' + `\n\n**Output:**\n` + '```' + `\nHello, World!\nWelcome to JavaScript!\n` + '```' + `\n\nJavaScript web ka king hai! 🌐`,
    calculator: prefix + `**JavaScript Calculator:**\n\n` + '```' + `javascript\nfunction calculator(a, b, op) {\n    switch(op) {\n        case '+': return a + b;\n        case '-': return a - b;\n        case '*': return a * b;\n        case '/': return b !== 0 ? a / b : "Error!";\n        default: return "Invalid operator";\n    }\n}\n\nconsole.log(calculator(10, 5, '+')); // 15\nconsole.log(calculator(10, 5, '-')); // 5\nconsole.log(calculator(10, 5, '*')); // 50\nconsole.log(calculator(10, 5, '/')); // 2\n` + '```' + `\n\nJavaScript mein functions first-class citizens hain! 🧮`,
    factorial: prefix + `**JavaScript Factorial:**\n\n` + '```' + `javascript\nfunction factorial(n) {\n    if (n <= 1) return 1;\n    return n * factorial(n - 1);\n}\n\nconst factorialIterative = n => {\n    let result = 1;\n    for (let i = 2; i <= n; i++) result *= i;\n    return result;\n};\n\nconsole.log(factorial(5));       // 120\nconsole.log(factorialIterative(10)); // 3628800\n` + '```' + `\n\n**Output:** ` + '`' + `5! = 120` + '`' + ` 🎯`,
    fibonacci: prefix + `**JavaScript Fibonacci:**\n\n` + '```' + `javascript\nfunction fibonacci(n) {\n    let a = 0, b = 1;\n    const result = [];\n    for (let i = 0; i < n; i++) {\n        result.push(a);\n        [a, b] = [b, a + b];\n    }\n    return result;\n}\n\nconsole.log(fibonacci(10));\n// [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]\n` + '```' + `\n\n**ES6 destructuring** se swap karte hain! 📈`,
    oop: prefix + `**JavaScript Classes (ES6):**\n\n` + '```' + `javascript\nclass Student {\n    constructor(name, age) {\n        this.name = name;\n        this.age = age;\n    }\n\n    display() {\n        console.log(\`Name: \${this.name}, Age: \${this.age}\`);\n    }\n}\n\nclass GradStudent extends Student {\n    constructor(name, age, thesis) {\n        super(name, age);\n        this.thesis = thesis;\n    }\n\n    display() {\n        super.display();\n        console.log(\`Thesis: \${this.thesis}\`);\n    }\n}\n\nconst s1 = new Student("Rahul", 20);\ns1.display();\nconst g1 = new GradStudent("Priya", 24, "AI");\ng1.display();\n` + '```' + `\n\nJavaScript ES6+ mein **class** keyword se OOP hota hai! 🏗️`,
    generalCode: prefix + `**JavaScript Utility:**\n\n` + '```' + `javascript\nconst Utils = {\n    factorial: n => n <= 1 ? 1 : n * Utils.factorial(n-1),\n    fibonacci: n => {\n        let [a, b] = [0, 1];\n        return Array.from({length: n}, () => { [a, b] = [b, a+b]; return a - b + a; });\n    },\n    isPrime: n => {\n        if (n < 2) return false;\n        for (let i = 2; i*i <= n; i++)\n            if (n % i === 0) return false;\n        return true;\n    },\n    reverse: s => s.split('').reverse().join(''),\n    flatten: arr => arr.flat(Infinity),\n    shuffle: arr => arr.sort(() => Math.random() - 0.5)\n};\n\nconsole.log(Utils.factorial(5));     // 120\nconsole.log(Utils.fibonacci(8));     // [0,1,1,2,3,5,8,13]\nconsole.log(Utils.isPrime(17));      // true\nconsole.log(Utils.reverse("Hello")); // olleH\nconsole.log(Utils.shuffle([1,2,3,4,5]));\n` + '```' + `\n\nYeh **modern JavaScript** hai! 🌐`
  };

  const cTasks = {
    helloWorld: prefix + `**C Hello World:**\n\n` + '```' + `c\n#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\n");\n    printf("Welcome to C Programming!\n");\n    return 0;\n}\n` + '```' + `\n\n**Output:** ` + '`' + `Hello, World!` + '`' + `\n\nC language sabki mool language hai! 💾`,
    calculator: prefix + `**C Calculator:**\n\n` + '```' + `c\n#include <stdio.h>\n\nint main() {\n    char op;\n    float a, b;\n    printf("Enter expression (5 + 3): ");\n    scanf("%f %c %f", &a, &op, &b);\n    switch(op) {\n        case '+': printf("Result: %.2f\n", a+b); break;\n        case '-': printf("Result: %.2f\n", a-b); break;\n        case '*': printf("Result: %.2f\n", a*b); break;\n        case '/': printf("Result: %.2f\n", b!=0?a/b:0); break;\n        default: printf("Invalid operator!\n");\n    }\n    return 0;\n}\n` + '```' + `\n\nC mein **switch-case** fast hota hai! 🧮`,
    factorial: prefix + `**C Factorial:**\n\n` + '```' + `c\n#include <stdio.h>\n\nlong factorial(int n) {\n    if (n <= 1) return 1;\n    return n * factorial(n - 1);\n}\n\nint main() {\n    int n;\n    printf("Enter number: ");\n    scanf("%d", &n);\n    printf("%d! = %ld\n", n, factorial(n));\n    return 0;\n}\n` + '```' + `\n\n**Output:** ` + '`' + `5! = 120` + '`' + ` 🎯`,
    fibonacci: prefix + `**C Fibonacci:**\n\n` + '```' + `c\n#include <stdio.h>\n\nint main() {\n    int a = 0, b = 1, n, temp;\n    printf("How many terms: ");\n    scanf("%d", &n);\n    printf("Fibonacci: ");\n    for (int i = 0; i < n; i++) {\n        printf("%d ", a);\n        temp = a + b;\n        a = b;\n        b = temp;\n    }\n    printf("\n");\n    return 0;\n}\n` + '```' + `\n\n**Output:** ` + '`' + `0 1 1 2 3 5 8 13 21 34` + '`' + ` 📈`,
    generalCode: prefix + `**C Utility Program:**\n\n` + '```' + `c\n#include <stdio.h>\n#include <math.h>\n\nlong factorial(int n) { return n<=1?1:n*factorial(n-1); }\nint isPrime(int n) {\n    if(n<2) return 0;\n    for(int i=2;i*i<=n;i++) if(n%i==0) return 0;\n    return 1;\n}\n\nint main() {\n    printf("5! = %ld\n", factorial(5));\n    printf("17 is %s\n", isPrime(17)?"prime":"not prime");\n    printf("sqrt(144) = %.0f\n", sqrt(144));\n    printf("pow(2,10) = %.0f\n", pow(2,10));\n    return 0;\n}\n` + '```' + `\n\nC mein **math.h** library powerful hai! 💾`
  };

  const cppTasks = {
    helloWorld: prefix + `**C++ Hello World:**\n\n` + '```' + `cpp\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    cout << "Welcome to C++!" << endl;\n    return 0;\n}\n` + '```' + `\n\nC++ mein **cout** aur **endl** use hota hai! ⚡`,
    calculator: prefix + `**C++ Calculator:**\n\n` + '```' + `cpp\n#include <iostream>\nusing namespace std;\n\nint main() {\n    double a, b;\n    char op;\n    cout << "Enter (a op b): ";\n    cin >> a >> op >> b;\n    switch(op) {\n        case '+': cout << "Result: " << a+b << endl; break;\n        case '-': cout << "Result: " << a-b << endl; break;\n        case '*': cout << "Result: " << a*b << endl; break;\n        case '/': cout << "Result: " << (b!=0?a/b:0) << endl; break;\n        default: cout << "Invalid!" << endl;\n    }\n    return 0;\n}\n` + '```' + `\n\nC++ fast aur powerful hai! 🧮`,
    generalCode: prefix + `**C++ Utility:**\n\n` + '```' + `cpp\n#include <iostream>\n#include <vector>\n#include <algorithm>\n#include <string>\nusing namespace std;\n\nint main() {\n    vector<int> nums = {5, 2, 8, 1, 9, 3};\n    sort(nums.begin(), nums.end());\n    cout << "Sorted: ";\n    for(int n : nums) cout << n << " ";\n    cout << endl;\n    string s = "Hello";\n    reverse(s.begin(), s.end());\n    cout << "Reversed: " << s << endl;\n    cout << "Max: " << *max_element(nums.begin(), nums.end()) << endl;\n    cout << "Min: " << *min_element(nums.begin(), nums.end()) << endl;\n    return 0;\n}\n` + '```' + `\n\nC++ STL (**vector, sort, algorithm**) bahut useful hai! ⚡`
  };

  const htmlTasks = {
    helloWorld: prefix + `**HTML Hello World:**\n\n` + '```' + `html\n<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Hello World</title>\n    <style>\n        body {\n            display: flex; justify-content: center; align-items: center;\n            min-height: 100vh;\n            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n            font-family: Arial, sans-serif;\n        }\n        h1 { color: white; font-size: 3rem; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); }\n    </style>\n</head>\n<body>\n    <h1>Hello, World!</h1>\n</body>\n</html>\n` + '```' + `\n\nYeh ek **beautiful styled** HTML page hai! 🎨`,
    generalCode: prefix + `**HTML Complete Page:**\n\n` + '```' + `html\n<!DOCTYPE html>\n<html lang="en">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>My Website</title>\n    <style>\n        * { margin: 0; padding: 0; box-sizing: border-box; }\n        body { font-family: Arial, sans-serif; }\n        header { background: #333; color: white; padding: 20px; text-align: center; }\n        nav { background: #555; padding: 10px; }\n        nav a { color: white; margin: 0 15px; text-decoration: none; }\n        main { padding: 20px; max-width: 800px; margin: 0 auto; }\n        .card { background: #f4f4f4; border-radius: 8px; padding: 20px; margin: 10px 0; }\n        footer { background: #333; color: white; text-align: center; padding: 10px; }\n    </style>\n</head>\n<body>\n    <header><h1>My Website</h1></header>\n    <nav>\n        <a href="#home">Home</a>\n        <a href="#about">About</a>\n        <a href="#contact">Contact</a>\n    </nav>\n    <main>\n        <div class="card">\n            <h2>Welcome!</h2>\n            <p>This is a responsive HTML page.</p>\n        </div>\n    </main>\n    <footer><p>&copy; 2024 My Website</p></footer>\n</body>\n</html>\n` + '```' + `\n\nYeh **complete webpage** hai! 🌐`
  };

  const cssTasks = {
    generalCode: prefix + `**CSS Complete Stylesheet:**\n\n` + '```' + `css\n:root {\n    --primary: #3498db;\n    --secondary: #2ecc71;\n    --dark: #2c3e50;\n    --light: #ecf0f1;\n    --danger: #e74c3c;\n}\n\n* { margin: 0; padding: 0; box-sizing: border-box; }\n\nbody {\n    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;\n    background: var(--light);\n    color: var(--dark);\n    line-height: 1.6;\n}\n\n.container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }\n\n.btn {\n    padding: 10px 24px;\n    border: none;\n    border-radius: 6px;\n    cursor: pointer;\n    font-size: 16px;\n    transition: all 0.3s ease;\n}\n\n.btn-primary { background: var(--primary); color: white; }\n.btn-primary:hover { background: #2980b9; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }\n\n.card {\n    background: white;\n    border-radius: 12px;\n    padding: 24px;\n    margin: 16px 0;\n    box-shadow: 0 2px 8px rgba(0,0,0,0.1);\n    transition: transform 0.3s ease;\n}\n\n.card:hover { transform: translateY(-4px); }\n\n@media (max-width: 768px) {\n    .container { padding: 0 12px; }\n    .btn { padding: 8px 16px; font-size: 14px; }\n}\n` + '```' + `\n\nYeh **modern CSS** hai variables, flexbox aur responsive design ke saath! 🎨`
  };

  const sqlTasks = {
    generalCode: prefix + `**SQL Queries:**\n\n` + '```' + `sql\n-- Create table\nCREATE TABLE students (\n    id INT PRIMARY KEY AUTO_INCREMENT,\n    name VARCHAR(100) NOT NULL,\n    email VARCHAR(100) UNIQUE,\n    age INT,\n    grade VARCHAR(10),\n    enrollment_date DATE DEFAULT CURRENT_DATE\n);\n\n-- Insert data\nINSERT INTO students (name, email, age, grade) VALUES\n('Rahul', 'rahul@email.com', 20, 'A'),\n('Priya', 'priya@email.com', 22, 'A+'),\n('Amit', 'amit@email.com', 19, 'B'),\n('Sneha', 'sneha@email.com', 21, 'A');\n\n-- Select queries\nSELECT * FROM students WHERE grade = 'A';\nSELECT name, age FROM students ORDER BY age DESC;\nSELECT grade, COUNT(*) as count FROM students GROUP BY grade;\nSELECT * FROM students WHERE age > 20 AND grade LIKE 'A%';\n\n-- Update and Delete\nUPDATE students SET grade = 'A+' WHERE name = 'Rahul';\nDELETE FROM students WHERE id = 3;\n\n-- Join example\nSELECT s.name, c.course_name\nFROM students s\nINNER JOIN enrollments e ON s.id = e.student_id\nINNER JOIN courses c ON e.course_id = c.id;\n` + '```' + `\n\nSQL data manage karne ki best language hai! 🗄️`
  };

  const langMap = {
    'Python': pyTasks,
    'Java': javaTasks,
    'JavaScript': jsTasks,
    'C': cTasks,
    'C++': cppTasks,
    'HTML': htmlTasks,
    'CSS': cssTasks,
    'SQL': sqlTasks,
    'React': jsTasks,
    'Node.js': jsTasks,
    'Next.js': jsTasks,
    'Angular': jsTasks,
    'Vue': jsTasks,
    'TypeScript': jsTasks,
    'PHP': jsTasks,
    'Ruby': jsTasks,
    'Swift': jsTasks,
    'Kotlin': jsTasks,
    'Dart': jsTasks,
    'Go': jsTasks,
    'Rust': jsTasks,
    'Django': pyTasks,
    'Flask': pyTasks,
    'Spring Boot': javaTasks,
    'Laravel': jsTasks,
    'C#': jsTasks,
  };

  const tasks = langMap[langName] || pyTasks;
  return tasks[task] || tasks.generalCode || prefix + 'Yeh raha aapka **' + langName + '** code:\n\n```' + langName.toLowerCase() + '\n// Your code here\n```\n\nAap kya specific code chahte hain? More details dein! 💻';
}

function solveMath(message) {
  const m = message.toLowerCase();
  const hi = /\u0900/.test(message);

  let match;
  match = message.match(/(\d+\.?\d*)\s*\+\s*(\d+\.?\d*)/);
  if (match) {
    const a = parseFloat(match[1]), b = parseFloat(match[2]);
    const result = a + b;
    return hi
      ? `**${a} + ${b} = ${result}**\n\n**Steps:**\n${a} + ${b} = ${result}\n\nAddition (Jod) mein dono numbers ko saath mein rakhte hain! ➕`
      : `**${a} + ${b} = ${result}**\n\n**Steps:**\n${a} + ${b} = ${result}\n\nIn addition, we combine both numbers together! ➕`;
  }

  match = message.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
  if (match) {
    const a = parseFloat(match[1]), b = parseFloat(match[2]);
    const result = a - b;
    return hi
      ? `**${a} - ${b} = ${result}**\n\n**Steps:**\n${a} - ${b} = ${result}\n\nSubtraction (Ghatana) mein ek number se doosra ghataate hain! ➖`
      : `**${a} - ${b} = ${result}**\n\n**Steps:**\n${a} - ${b} = ${result}\n\nIn subtraction, we subtract the second number from the first! ➖`;
  }

  match = message.match(/(\d+\.?\d*)\s*\*\s*(\d+\.?\d*)/);
  if (!match) match = message.match(/(\d+\.?\d*)\s*x\s*(\d+\.?\d*)/i);
  if (match) {
    const a = parseFloat(match[1]), b = parseFloat(match[2]);
    const result = a * b;
    return hi
      ? `**${a} \u00d7 ${b} = ${result}**\n\n**Steps:**\n${a} \u00d7 ${b} = ${result}\n\nMultiplication (Guna) mein ek number ko doosre se guna karte hain! ✖️`
      : `**${a} \u00d7 ${b} = ${result}**\n\n**Steps:**\n${a} \u00d7 ${b} = ${result}\n\nIn multiplication, we multiply both numbers! ✖️`;
  }

  match = message.match(/(\d+\.?\d*)\s*\/\s*(\d+\.?\d*)/);
  if (match) {
    const a = parseFloat(match[1]), b = parseFloat(match[2]);
    if (b === 0) return '**Error:** Division by zero is undefined! \u00f7\n\nKisi bhi number ko zero se divide nahi kar sakte! ⚠️';
    const result = (a / b).toFixed(4).replace(/\.?0+$/, '');
    return hi
      ? `**${a} \u00f7 ${b} = ${result}**\n\n**Steps:**\n${a} \u00f7 ${b} = ${result}\n\nDivision (Bhag) mein ek number ko doosre se bhaag dete hain! ➗`
      : `**${a} \u00f7 ${b} = ${result}**\n\n**Steps:**\n${a} \u00f7 ${b} = ${result}\n\nIn division, we divide the first number by the second! ➗`;
  }

  match = message.match(/(\d+\.?\d*)\s*\^\s*(\d+\.?\d*)/);
  if (!match) match = message.match(/(\d+\.?\d*)\s*\*\*\s*(\d+\.?\d*)/);
  if (match) {
    const a = parseFloat(match[1]), b = parseFloat(match[2]);
    const result = Math.pow(a, b);
    return `**${a}^${b} = ${result}**\n\n**Steps:**\n${a} multiplied by itself ${b} times = ${result}\n\nPowers exponents kehte hain! 🔢`;
  }

  match = message.match(/(\d+\.?\d*)%\s*of\s*(\d+\.?\d*)/i);
  if (!match) match = message.match(/(\d+\.?\d*)%\s*(\d+\.?\d*)/);
  if (match) {
    const p = parseFloat(match[1]), n = parseFloat(match[2]);
    const result = (p / 100) * n;
    return hi
      ? `**${p}% of ${n} = ${result}**\n\n**Steps:**\n${p}% = ${p}/100 = ${p/100}\n${p/100} \u00d7 ${n} = ${result}\n\nPercentage ka matlab hai per 100! 📊`
      : `**${p}% of ${n} = ${result}**\n\n**Steps:**\n${p}% = ${p}/100 = ${p/100}\n${p/100} \u00d7 ${n} = ${result}\n\nPercentage means per hundred! 📊`;
  }

  if (/square root|√|sqrt/i.test(m)) {
    match = message.match(/(\d+\.?\d*)/);
    if (match) {
      const n = parseFloat(match[1]);
      const result = Math.sqrt(n);
      const isPerf = Number.isInteger(result);
      return `**\u221a${n} = ${isPerf ? result : result.toFixed(4)}**\n\n**Steps:**\n\u221a${n} = ${isPerf ? result : result.toFixed(4)}${isPerf ? ' (Perfect square!)' : ''}\n\nSquare root woh number hai jo khud se multiply karne par original number de! 📐`;
    }
  }

  if (/lcm|least common multiple/i.test(m)) {
    match = message.match(/(\d+)\s*and\s*(\d+)/);
    if (match) {
      const a = parseInt(match[1]), b = parseInt(match[2]);
      const gcd = (x, y) => y === 0 ? x : gcd(y, x % y);
      const lcmResult = (a * b) / gcd(a, b);
      return `**LCM of ${a} and ${b} = ${lcmResult}**\n\n**Steps:**\nGCD(${a}, ${b}) = ${gcd(a, b)}\nLCM = (${a} \u00d7 ${b}) / GCD = ${a*b} / ${gcd(a, b)} = ${lcmResult}\n\nLCM is the smallest number divisible by both! 🔢`;
    }
  }

  if (/hcf|gcd|highest common factor/i.test(m)) {
    match = message.match(/(\d+)\s*and\s*(\d+)/);
    if (match) {
      let a = parseInt(match[1]), b = parseInt(match[2]);
      const origA = a, origB = b;
      while (b !== 0) { [a, b] = [b, a % b]; }
      return `**HCF/GCD of ${origA} and ${origB} = ${a}**\n\n**Steps (Euclidean Algorithm):**\nGCD(${origA}, ${origB}):\n  ${origA} = ${origB} \u00d7 ${Math.floor(origA/origB)} + ${origA%origB}\n  ${origB} = ${origA%origB} \u00d7 ${Math.floor(origB/(origA%origB))} + ${origB%(origA%origB)}\n  GCD = ${a}\n\nHCF is the largest number that divides both! 🔢`;
    }
  }

  if (/\bprime|is prime|prime number/i.test(m)) {
    match = message.match(/(\d+)/);
    if (match) {
      const n = parseInt(match[1]);
      if (n < 2) return `**${n} is NOT a prime number**\n\nNumbers less than 2 are not prime! ⚠️`;
      let isPrime = true;
      for (let i = 2; i * i <= n; i++) { if (n % i === 0) { isPrime = false; break; } }
      return isPrime
        ? `**${n} IS a prime number! ✅**\n\n**Proof:** Divisible only by 1 and ${n}.\nChecked divisors: 2 to ${Math.floor(Math.sqrt(n))} - none divide ${n}!\n\nPrime numbers have exactly 2 factors! 🔢`
        : `**${n} is NOT a prime number ❌**\n\n**Why?** ${n} is divisible by ` + Array.from({length: n-1}, (_, i) => i+2).find(i => n % i === 0) + `.\nPrime numbers have exactly 2 factors (1 and themselves)! 🔢`;
    }
  }

  if (/factorial|fact/i.test(m)) {
    match = message.match(/(\d+)/);
    if (match) {
      let n = parseInt(match[1]);
      if (n > 20) return `**${n}!** is too large to compute! (Maximum practical: 20!)\n\n20! = 2,432,902,008,176,640,000 ⚠️`;
      let result = 1;
      const steps = [];
      for (let i = 1; i <= n; i++) { result *= i; steps.push(i === 1 ? '1' : `${i} \u00d7 ${i-1}! = ${result}`); }
      return `**${n}! = ${result.toLocaleString()}**\n\n**Steps:**\n${steps.join('\n')}\n\nFactorial mein 1 se n tak sab numbers ka product hota hai! 🎯`;
    }
  }

  if (/area|square/i.test(m) && /square|side/i.test(m)) {
    match = message.match(/(\d+\.?\d*)/);
    if (match) {
      const side = parseFloat(match[1]);
      return `**Area of Square (side = ${side})**\n\nFormula: Area = side\u00b2\nArea = ${side}\u00b2 = ${side * side}\n\nPerimeter = 4 \u00d7 side = ${4 * side}\n\nSquare mein char sides equal hoti hain! 📐`;
    }
  }

  if (/area.*rectangle|rectangle.*area/i.test(m)) {
    match = message.match(/(\d+\.?\d+)\s*(?:x|\u00d7|\*)\s*(\d+\.?\d+)/);
    if (match) {
      const l = parseFloat(match[1]), w = parseFloat(match[2]);
      return `**Area of Rectangle (${l} \u00d7 ${w})**\n\nFormula: Area = length \u00d7 width\nArea = ${l} \u00d7 ${w} = ${l * w}\n\nPerimeter = 2 \u00d7 (${l} + ${w}) = ${2 * (l + w)}\n\nRectangle mein opposite sides equal hoti hain! 📐`;
    }
  }

  if (/pythagoras|hypotenuse/i.test(m)) {
    match = message.match(/(\d+\.?\d+)\s*and\s*(\d+\.?\d+)/);
    if (match) {
      const a = parseFloat(match[1]), b = parseFloat(match[2]);
      const c = Math.sqrt(a*a + b*b).toFixed(4);
      return `**Pythagorean Theorem**\n\nFormula: a\u00b2 + b\u00b2 = c\u00b2\n\nGiven: a = ${a}, b = ${b}\n${a}\u00b2 + ${b}\u00b2 = ${a*a} + ${b*b} = ${a*a + b*b}\nc = \u221a${a*a + b*b} = ${c}\n\n**Hypotenuse = ${c}** 📐`;
    }
  }

  if (/quadratic|roots.*equation/i.test(m)) {
    match = message.match(/x[\u00b22]\s*[+\-]\s*(\d+)\s*x\s*[+\-]\s*(\d+)/);
    if (match) {
      const a = 1, b = parseInt(match[1]), c = parseInt(match[2]);
      const disc = b*b - 4*a*c;
      if (disc > 0) {
        const r1 = (-b + Math.sqrt(disc)) / (2*a);
        const r2 = (-b - Math.sqrt(disc)) / (2*a);
        return `**Quadratic Equation: x\u00b2 + ${b}x + ${c} = 0**\n\n**Using Quadratic Formula:**\nx = (-b \u00b1 \u221a(b\u00b2 - 4ac)) / 2a\n\n**Steps:**\na = ${a}, b = ${b}, c = ${c}\nDiscriminant = ${b}\u00b2 - 4(${a})(${c}) = ${disc}\n\u221a${disc} = ${Math.sqrt(disc).toFixed(4)}\n\n**Root 1:** (-${b} + ${Math.sqrt(disc).toFixed(4)}) / 2 = **${r1.toFixed(4)}**\n**Root 2:** (-${b} - ${Math.sqrt(disc).toFixed(4)}) / 2 = **${r2.toFixed(4)}** 🎯`;
      } else if (disc === 0) {
        const r = -b / (2*a);
        return `**Quadratic Equation: x\u00b2 + ${b}x + ${c} = 0**\n\nDiscriminant = 0 (Equal roots!)\n**Root = ${r}** (repeated) 🎯`;
      } else {
        return `**Quadratic Equation: x\u00b2 + ${b}x + ${c} = 0**\n\nDiscriminant = ${disc} (Negative!)\n**No real roots!** Complex roots exist. ⚠️`;
      }
    }
  }

  match = message.match(/(\d+\.?\d*)\s*\/\s*(\d+\.?\d*)/);
  if (match) {
    const a = parseFloat(match[1]), b = parseFloat(match[2]);
    if (b === 0) return '**Error:** Division by zero! ⚠️';
    const result = (a / b).toFixed(4).replace(/\.?0+$/, '');
    return `**${a} / ${b} = ${result}**\n\n**Steps:**\n${a} / ${b} = ${result} ➗`;
  }

  return hi
    ? `Maine aapka math problem samajh nahi paya. Kripya clearly likhen:\n\n**Examples:**\n- \`5 + 3\`\n- \`10 - 4\`\n- \`6 * 7\`\n- \`20 / 4\`\n- \`5^3\` (power)\n- \`50% of 200\` (percentage)\n- \`square root of 144\`\n- \`is 17 prime\`\n- \`LCM of 12 and 18\`\n- \`factorial of 10\`\n- \`area of square with side 5\`\n- \`Pythagoras 3 and 4\` 🧮`
    : `I couldn't understand your math problem. Please write clearly:\n\n**Examples:**\n- \`5 + 3\`\n- \`10 - 4\`\n- \`6 * 7\`\n- \`20 / 4\`\n- \`5^3\` (power)\n- \`50% of 200\` (percentage)\n- \`square root of 144\`\n- \`is 17 prime\`\n- \`LCM of 12 and 18\`\n- \`factorial of 10\`\n- \`area of square with side 5\`\n- \`Pythagoras 3 and 4\` 🧮`;
}

function getScienceResponse(message, lang) {
  const m = message.toLowerCase();
  const hi = lang === 'hi';

  const topics = {
    physics: {
      'newton': `**Newton's Laws of Motion**\n\n**First Law (Inertia):**\n物体静止则静止，运动则继续运动，除非受到外力。\nExample: Bus suddenly rukne par passenger aage jhukte hain!\n\n**Second Law (F = ma):**\nForce = Mass × Acceleration\nF = ma\nExample: Zyada mass = zyada force chahiye!\n\n**Third Law:**\nEvery action has equal and opposite reaction\nExample: Rocket launch - gas neeche, rocket upar! 🚀`,
      'gravity': `**Gravity (Gurutvakarshan)**\n\n**Newton's Law of Gravitation:**\nF = G(m1 × m2) / r²\n\n- G = 6.674 × 10⁻¹¹ N⋅m²/kg²\n- Earth's gravity = 9.8 m/s²\n- Moon's gravity = 1.62 m/s²\n\n**Key Facts:**\n- Gravity makes things fall down\n- Heavier objects fall at same speed (ignoring air resistance)\n- Escape velocity from Earth = 11.2 km/s\n- Gravitational force keeps planets in orbit 🌍`,
      'energy': `**Energy (Urja)**\n\n**Types of Energy:**\n1. **Kinetic Energy (Gatij Urja):** KE = ½mv²\n2. **Potential Energy (Sthitij Urja):** PE = mgh\n3. **Thermal Energy (Ushma)**\n4. **Chemical Energy (Rasaynik Urja)**\n5. **Electrical Energy (Vidyut Urja)**\n6. **Nuclear Energy (Parmanu Urja)**\n\n**Law of Conservation:**\nEnergy can neither be created nor destroyed, only transformed!\n\n**Units:**\n- Joule (J) = SI unit\n- 1 kcal = 4184 J\n- 1 kWh = 3.6 × 10⁶ J ⚡`,
      'electricity': `**Electricity (Vidyut)**\n\n**Ohm's Law:** V = IR\n- V = Voltage (Volt), I = Current (Ampere), R = Resistance (Ohm)\n\n**Key Formulas:**\n- Power P = VI = I²R = V²/R\n- Resistance R = ρL/A\n- Series: R_total = R1 + R2 + R3\n- Parallel: 1/R_total = 1/R1 + 1/R2 + 1/R3\n\n**Current Types:**\n- DC (Direct Current) - Battery\n- AC (Alternating Current) - Home supply\n- AC frequency in India = 50 Hz ⚡`,
      'optics': `**Optics (Prakash Vigyan)**\n\n**Reflection:**\n- Angle of incidence = Angle of reflection\n- Mirror formula: 1/v + 1/u = 1/f\n\n**Refraction:**\n- Snell's Law: n₁sinθ₁ = n₂sinθ₂\n- Refractive index n = c/v\n\n**Types of Lenses:**\n- Convex (Converging) - Magnifying glass\n- Concave (Diverging) - Spectacles for myopia\n\n**Rainbow:**\nWhite light → Dispersion → VIBGYOR\nViolet, Indigo, Blue, Green, Yellow, Orange, Red 🌈`,
    },
    chemistry: {
      'atom': `**Atomic Structure (Parmanu Sanrachna)**\n\n**Subatomic Particles:**\n| Particle | Charge | Mass |\n|----------|--------|------|\n| Proton   | +1     | 1 amu |\n| Neutron  | 0      | 1 amu |\n| Electron | -1     | 0.0005 amu |\n\n**Electronic Configuration:**\n- Shell: K(2), L(8), M(18), N(32)\n- Subshells: s(2), p(6), d(10), f(14)\n- Aufbau principle: 1s² 2s² 2p⁶ 3s²...\n\n**Atomic Number (Z)** = Protons\n**Mass Number (A)** = Protons + Neutrons\n**Isotopes:** Same Z, different A 🔬`,
      'periodic table': `**Periodic Table (Avartani Sarini)**\n\n**Groups:**\n- Group 1: Alkali Metals (Li, Na, K, Rb, Cs, Fr)\n- Group 2: Alkaline Earth (Be, Mg, Ca, Sr, Ba, Ra)\n- Group 17: Halogens (F, Cl, Br, I, At)\n- Group 18: Noble Gases (He, Ne, Ar, Kr, Xe, Rn)\n\n**Periodic Trends:**\n- Atomic radius ↓ across period\n- Ionization energy ↑ across period\n- Electronegativity ↑ across period (F = 4.0, highest)\n- Metallic character ↓ across period 📊`,
      'chemical reaction': `**Chemical Reactions (Rasaynik Abhikriya)**\n\n**Types:**\n1. Combination: A + B → AB\n2. Decomposition: AB → A + B\n3. Displacement: A + BC → AC + B\n4. Double Displacement: AB + CD → AD + CB\n\n**Balancing Example:**\n2H₂ + O₂ → 2H₂O\n\n**pH Scale:**\n- 0-3: Strong Acid (HCl, H₂SO₄)\n- 4-6: Weak Acid\n- 7: Neutral (Water)\n- 8-10: Weak Base\n- 11-14: Strong Base (NaOH) 🧪`,
    },
    biology: {
      'cell': `**Cell (Koshika)**\n\n**Prokaryotic vs Eukaryotic:**\n| Feature | Prokaryotic | Eukaryotic |\n|---------|-------------|------------|\n| Nucleus | No | Yes |\n| DNA | Circular | Linear |\n| Organelles | Few | Many |\n| Size | 0.1-5 μm | 10-100 μm |\n\n**Cell Organelles:**\n- Nucleus: DNA storage, control center\n- Mitochondria: Powerhouse (ATP production)\n- Ribosomes: Protein synthesis\n- Endoplasmic Reticulum: Transport system\n- Golgi Apparatus: Packaging & shipping\n- Lysosomes: Digestion (suicide bags)\n- Chloroplast: Photosynthesis (plants only) 🧬`,
      'photosynthesis': `**Photosynthesis (Prakash Samvay)**\n\n**Equation:**\n6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂\n\n**Two Stages:**\n1. **Light Reaction (Thylakoid):**\n   - Water splitting (photolysis)\n   - ATP + NADPH produced\n   - O₂ released\n\n2. **Calvin Cycle (Stroma):**\n   - CO₂ fixation by RuBisCO\n   - Glucose formed\n   - Uses ATP + NADPH\n\n**Factors:**\n- Light intensity\n- CO₂ concentration\n- Temperature (optimum 25-35°C) 🌿`,
      'dna': `**DNA (Deoxyribonucleic Acid)**\n\n**Structure:**\n- Double helix (Watson & Crick, 1953)\n- Bases: A-T, G-C (Chargaff's rule)\n- Sugar-phosphate backbone\n\n**Central Dogma:**\nDNA → (Transcription) → mRNA → (Translation) → Protein\n\n**Key Facts:**\n- Human genome: ~3 billion base pairs\n- ~20,000-25,000 genes\n- DNA replication: Semi-conservative\n- 99.9% DNA identical between humans\n- Mutations can be harmful or beneficial 🧬`,
      'heart': `**Human Heart (Hriday)**\n\n**Structure:**\n- 4 chambers: 2 Atria + 2 Ventricles\n- Size: Fist-sized\n- Beats: ~72 times/minute\n- Pumps: ~5 liters blood/minute\n\n**Blood Flow:**\nBody → SVC/IVC → Right Atrium → Right Ventricle\n→ Pulmonary Artery → Lungs → Pulmonary Vein\n→ Left Atrium → Left Ventricle → Aorta → Body\n\n**Heartbeat Phases:**\n- Systole (contraction)\n- Diastole (relaxation)\n- BP: 120/80 mmHg (normal) ❤️`,
    }
  };

  for (const [field, fieldTopics] of Object.entries(topics)) {
    for (const [key, response] of Object.entries(fieldTopics)) {
      if (m.includes(key)) return response;
    }
  }

  if (/(physics|physics|vayigyanik)/i.test(m)) {
    return `**Physics (भौतिक विज्ञान)**\n\nPhysics matter aur energy ke beech ke relations study karta hai!\n\n**Major Topics:**\n1. **Mechanics** - Motion, Force, Energy\n2. **Thermodynamics** - Heat, Temperature\n3. **Electromagnetism** - Electricity, Magnetism\n4. **Optics** - Light, Lenses\n5. **Modern Physics** - Quantum, Relativity\n\n**Key Formulas:**\n- F = ma (Newton's 2nd Law)\n- KE = ½mv²\n- PE = mgh\n- V = IR (Ohm's Law)\n- E = mc² (Einstein)\n\nKoi specific topic puchhen! 🔬`;
  }

  if (/(chemistry|rasayn)/i.test(m)) {
    return `**Chemistry (रसायन विज्ञान)**\n\nChemistry padta hai matter ke composition aur changes ko!\n\n**Major Topics:**\n1. **Organic Chemistry** - Carbon compounds\n2. **Inorganic Chemistry** - Metals, Minerals\n3. **Physical Chemistry** - Thermodynamics, Kinetics\n\n**Key Concepts:**\n- Atomic structure\n- Periodic table\n- Chemical bonding\n- Stoichiometry\n- Acids, Bases, Salts\n\nKoi specific reaction ya topic puchhen! 🧪`;
  }

  if (/(biology|jeev vigyan)/i.test(m)) {
    return `**Biology (जीव विज्ञान)**\n\nBiology living organisms ke study hai!\n\n**Major Topics:**\n1. **Cell Biology** - Cell structure & function\n2. **Genetics** - DNA, Heredity\n3. **Ecology** - Environment, Ecosystems\n4. **Human Biology** - Body systems\n5. **Botany** - Plant biology\n6. **Zoology** - Animal biology\n\n**NCERT Important Chapters:**\n- Class 11: Cell Biology, Plant Kingdom\n- Class 12: Genetics, Evolution, Ecology\n\nKoi specific topic puchhen! 🧬`;
  }

  return hi
    ? `Mujhe is science topic ke baare mein detail mein samajh nahi aaya. Kripya specific topic batayein:\n- Physics: Newton, Gravity, Energy, Electricity, Optics\n- Chemistry: Atom, Periodic Table, Chemical Reactions\n- Biology: Cell, Photosynthesis, DNA, Heart\n🔬`
    : `I need more details about this science topic. Please specify:\n- Physics: Newton, Gravity, Energy, Electricity, Optics\n- Chemistry: Atom, Periodic Table, Chemical Reactions\n- Biology: Cell, Photosynthesis, DNA, Heart\n🔬`;
}

function getCareerResponse(message, profile, lang) {
  const m = message.toLowerCase();
  const hi = lang === 'hi';
  const name = profile?.user?.name || (hi ? 'Dost' : 'Friend');

  if (/\b(iit|iits|indian institute of technology)\b/i.test(m)) {
    return `**IITs (Indian Institutes of Technology)**\n\n**Top IITs (NIRF 2024):**\n1. IIT Madras - NIRF #1\n2. IIT Bombay - NIRF #2\n3. IIT Delhi - NIRF #3\n4. IIT Kanpur - NIRF #4\n5. IIT Kharagpur - NIRF #5\n\n**Admission:** JEE Advanced (top 2.5 lakh from JEE Main)\n**Fee:** ₹2-3 lakh/year (after subsidy)\n\n**Average Salary (2024):**\n- IIT Bombay: ₹21.82 LPA\n- IIT Delhi: ₹18.56 LPA\n- IIT Madras: ₹17.01 LPA\n- IIT Kanpur: ₹16.42 LPA\n\n**Placement Rate:** 85-95%\n**Highest Package:** ₹2-3 Cr (international)\n\n${name}, IIT ka dream hai toh **JEE preparation** se shuru karo! 💪`;
  }

  if (/\b(nit|nits|national institute of technology)\b/i.test(m)) {
    return `**NITs (National Institutes of Technology)**\n\n**Top NITs:**\n1. NIT Trichy\n2. NIT Warangal\n3. NIT Surathkal\n4. NIT Calicut\n5. NIT Rourkela\n\n**Admission:** JEE Main (top percentile)\n**Fee:** ₹1.5-2.5 lakh/year\n\n**Average Salary:**\n- Top NITs: ₹12-18 LPA\n- Mid NITs: ₹8-12 LPA\n- Lower NITs: ₹5-8 LPA\n\n**Placement Rate:** 80-90%\n\nNIT mein bhi great opportunities hain! 🎯`;
  }

  if (/\b(bits|bits pilani|bitsat)\b/i.test(m)) {
    return `**BITS (Birla Institute of Technology & Science)**\n\n**Campuses:**\n- BITS Pilani (Main)\n- BITS Goa\n- BITS Hyderabad\n\n**Admission:** BITSAT (online exam)\n- Cutoff: 300+ marks\n\n**Fee:** ₹4.5 lakh/year\n\n**Average Salary:**\n- BITS Pilani: ₹15-20 LPA\n- BITS Goa: ₹12-16 LPA\n- BITS Hyderabad: ₹10-14 LPA\n\n**Top Recruiters:** Google, Microsoft, Amazon, Goldman Sachs\n\nBITS ka dual degree program bahut popular hai! 🌟`;
  }

  if (/\b(iim|iims|cat exam|cat preparation)\b/i.test(m)) {
    return `**IIMs (Indian Institutes of Management)**\n\n**Top IIMs:**\n1. IIM Ahmedabad\n2. IIM Bangalore\n3. IIM Calcutta\n4. IIM Lucknow\n5. IIM Indore\n\n**Admission:** CAT Exam\n- Quant, DILR, VARC\n- Cutoff: 95-99+ percentile\n\n**Fee:** ₹15-25 lakh (2 years)\n\n**Average Salary:**\n- IIM Ahmedabad: ₹34.36 LPA\n- IIM Bangalore: ₹33.82 LPA\n- IIM Calcutta: ₹31.20 LPA\n\n**Top Recruiters:** McKinsey, BCG, Bain, Goldman Sachs\n\nMBA ke baad consulting, finance, marketing mein top roles! 💼`;
  }

  if (/\b(upsc|ias|ips|civil services)\b/i.test(m)) {
    return `**UPSC Civil Services (IAS/IPS)**\n\n**Services:**\n- IAS (Indian Administrative Service)\n- IPS (Indian Police Service)\n- IFS (Indian Foreign Service)\n\n**Exam Pattern:**\n1. Prelims: 2 papers (General Studies + CSAT) - Objective\n2. Mains: 9 papers - Descriptive\n3. Interview: Personality Test\n\n**Syllabus Highlights:**\n- Indian History, Geography, Polity\n- Economy, Environment, Science\n- Ethics, Essay\n\n**Preparation Time:** 12-18 months\n**Success Rate:** ~0.1% (1000 from 10 lakh applicants)\n\n**Salary:**\n- IAS: ₹56,100/month (Level 10) + Allowances\n- After 10 years: ₹1,18,500/month\n\n**Age Limit:** 21-32 years (General)\n\nDedication aur consistent preparation chahiye! 🏛️`;
  }

  if (/\b(gate exam|gate preparation|gate)\b/i.test(m) && !/\b(gate way)\b/i.test(m)) {
    return `**GATE (Graduate Aptitude Test in Engineering)**\n\n**Eligibility:** B.Tech/B.E. students (3rd year onwards)\n\n**Papers:** 30 papers (CS, ME, CE, EE, ECE, etc.)\n\n**Pattern:**\n- General Aptitude: 15 marks\n- Subject: 85 marks\n- Total: 100 marks\n\n**Score Validity:** 3 years\n\n**Uses:**\n1. M.Tech admission (IITs, NITs)\n2. PSUs recruitment (ONGC, IOCL, NTPC, BHEL)\n3. Research fellowship\n\n**Top PSU Salaries through GATE:**\n- IOCL: ₹12-15 LPA\n- ONGC: ₹12-18 LPA\n- NTPC: ₹10-14 LPA\n\n**Preparation:** 6-8 months focused study 📚`;
  }

  if (/\b(salary|package|lpa|how much|earn|income|paise)\b/i.test(m)) {
    return `**Indian Tech Salary Ranges (2024)**\n\n**Freshers (0-2 years):**\n| Company Type | Salary Range |\n|-------------|--------------|\n| FAANG (Google, Amazon, etc.) | ₹15-45 LPA |\n| Top Product (Flipkart, Razorpay) | ₹12-25 LPA |\n| Good IT (TCS Digital, Infosys) | ₹6-12 LPA |\n| Service Companies (TCS, Wipro) | ₹3.5-6 LPA |\n| Startups (Early stage) | ₹5-15 LPA |\n| MNCs (IBM, Accenture) | ₹4-8 LPA |\n\n**After 5 years:**\n- FAANG: ₹30-80 LPA\n- Product: ₹20-40 LPA\n- Service: ₹8-15 LPA\n\n**After 10 years:**\n- Engineering Manager: ₹40-100 LPA\n- Director: ₹60-150 LPA\n- VP: ₹1-3 Cr\n\n**Non-tech salaries:**\n- MBA (IIM): ₹15-35 LPA\n- IAS: ₹56,100/month starting\n- Doctor: ₹8-20 LPA\n- Lawyer: ₹5-15 LPA\n\n${name}, skills badhao, salary automatically badhegi! 📈`;
  }

  if (/\b(google|faang|big tech|product company)\b/i.test(m)) {
    return `**FAANG/Product Company Preparation**\n\n**Companies & Salaries:**\n| Company | Fresher LPA |\n|---------|------------|\n| Google | ₹30-45 LPA |\n| Microsoft | ₹25-40 LPA |\n| Amazon | ₹25-45 LPA |\n| Meta (Facebook) | ₹30-50 LPA |\n| Apple | ₹30-45 LPA |\n\n**How to Get In:**\n1. **DSA Mastery** - Arrays, Trees, Graphs, DP\n2. **System Design** (for experienced)\n3. **Projects** - Open source, Hackathons\n4. **Competitive Programming** - LeetCode, Codeforces\n\n**Interview Process:**\n1. Online Assessment (OA)\n2. 2-3 Technical Rounds\n3. System Design Round\n4. Behavioral Round (LP at Amazon)\n\n**Preparation Time:** 6-12 months dedicated 🎯`;
  }

  if (/\b(tcs|infosys|wipro|cts|tech mahindra|service company|service based)\b/i.test(m)) {
    return `**Service-Based Companies (TCS, Infosys, etc.)**\n\n**Salaries:**\n| Company | Fresher Package |\n|---------|----------------|\n| TCS Ninja | ₹3.36 LPA |\n| TCS Digital | ₹7 LPA |\n| Infosys (InfyTQ) | ₹6.25 LPA |\n| Wipro Turbo | ₹6.5 LPA |\n| CTS | ₹4 LPA |\n| Tech Mahindra | ₹3.5 LPA |\n\n**How to Get Selected:**\n1. Campus placement\n2. Off-campus drive\n3. Referral\n\n**Tips:**\n- Clear aptitude round\n- Basic coding (patterns, strings)\n- Good communication skills\n\n${name}, ye starting point ho sakta hai - baad mein switch karo product company mein! 🚀`;
  }

  if (/\b(fresher|fresher salary|first job|starting salary|no experience)\b/i.test(m)) {
    return `**Fresher Job Guide for ${name}**\n\n**Salary Ranges (2024):**\n| Role | Salary |\n|------|--------|\n| Software Developer (Product) | ₹8-20 LPA |\n| Software Developer (Service) | ₹3-6 LPA |\n| Data Analyst | ₹5-10 LPA |\n| Web Developer | ₹4-8 LPA |\n| UI/UX Designer | ₹5-10 LPA |\n| QA Engineer | ₹4-8 LPA |\n| DevOps Engineer | ₹6-12 LPA |\n\n**How to Stand Out:**\n1. **Projects** - Build 3-5 strong projects\n2. **Internships** - At least 1-2 internships\n3. **GitHub** - Active contributions\n4. **Skills** - React/Django/ML etc.\n5. **Resume** - ATS-friendly format\n\n**Job Portals:**\n- LinkedIn, Naukri.com, AngelList\n- Company career pages\n- Referrals (best option!)\n\n${name}, consistency is key! 💪`;
  }

  if (/\b(bsc|bachelor of science|bsc csa|bsc it)\b/i.test(m)) {
    return `**B.Sc (Bachelor of Science)**\n\n**Popular B.Sc Programs:**\n- B.Sc Computer Science\n- B.Sc IT\n- B.Sc Mathematics\n- B.Sc Physics\n- B.Sc Chemistry\n- B.Sc Data Science (new!)\n\n**Career Options after B.Sc:**\n1. **M.Sc** - Higher studies\n2. **MCA** - Master of Computer Applications\n3. **Government Jobs** - SSC, Banking, Railway\n4. **Teaching** - After B.Ed\n5. **IT Jobs** - After skill courses\n\n**Salary:**\n- Government: ₹25,000-45,000/month\n- IT (after MCA): ₹4-8 LPA\n- Teaching: ₹3-8 LPA\n\nB.Sc ke baath **MCA ya skill development** best option hai! 📚`;
  }

  if (/\b(mca|master of computer application)\b/i.test(m)) {
    return `**MCA (Master of Computer Applications)**\n\n**Duration:** 3 years (or 2 years lateral entry)\n\n**Eligibility:** B.Sc IT/CS or equivalent\n\n**Syllabus Highlights:**\n- Programming (Java, Python, C++)\n- Data Structures & Algorithms\n- DBMS, OS, Computer Networks\n- Web Development\n- Cloud Computing\n\n**Career Options:**\n- Software Developer: ₹4-12 LPA\n- Web Developer: ₹4-8 LPA\n- Data Analyst: ₹5-10 LPA\n- Systems Engineer: ₹5-9 LPA\n\n**Top Recruiters:**\nInfosys, TCS, Wipro, Cognizant, HCL\n\nMCA ke baath **DSA aur projects** focus karo! 🎯`;
  }

  if (/\b(mba|master of business administration)\b/i.test(m)) {
    return `**MBA (Master of Business Administration)**\n\n**Top Entrance Exams:**\n1. CAT (IIMs)\n2. XAT (XLRI)\n3. GMAT (ISB, abroad)\n4. SNAP (Symbiosis)\n5. CMAT (AICTE colleges)\n\n**Top B-Schools & Packages:**\n| College | Avg Package |\n|---------|------------|\n| IIM Ahmedabad | ₹34.36 LPA |\n| IIM Bangalore | ₹33.82 LPA |\n| IIM Calcutta | ₹31.20 LPA |\n| XLRI Jamshedpur | ₹29.00 LPA |\n| ISB Hyderabad | ₹34.00 LPA |\n\n**Specializations:**\n- Finance: ₹15-40 LPA\n- Marketing: ₹10-25 LPA\n- Consulting: ₹20-45 LPA\n- Operations: ₹12-25 LPA\n\n**Preparation:** 12-15 months 📈`;
  }

  return hi
    ? `**Career Guidance for ${name}**\n\n**Popular Career Paths in India:**\n1. 💻 **Software Engineering** - ₹4-45 LPA\n2. 📊 **Data Science/AI** - ₹6-30 LPA\n3. 💼 **MBA/Management** - ₹10-35 LPA\n4. 🏛️ **Civil Services (IAS/IPS)** - ₹56K/month + perks\n5. 🏥 **Medicine (Doctor)** - ₹8-25 LPA\n6. ⚖️ **Law** - ₹5-20 LPA\n7. 📐 **Engineering (Core)** - ₹4-12 LPA\n8. 🎓 **Teaching/Research** - ₹4-15 LPA\n\n**How can I help?**\n- Specific company ke baare mein pucho\n- Salary details chahiye?\n- Exam preparation help?\n- Skill development plan?\n\nKya jaanna hai ${name}? 🎯`
    : `**Career Guidance for ${name}**\n\n**Popular Career Paths in India:**\n1. 💻 Software Engineering - ₹4-45 LPA\n2. 📊 Data Science/AI - ₹6-30 LPA\n3. 💼 MBA/Management - ₹10-35 LPA\n4. 🏛️ Civil Services (IAS/IPS) - ₹56K/month + perks\n5. 🏥 Medicine (Doctor) - ₹8-25 LPA\n6. ⚖️ Law - ₹5-20 LPA\n7. 📐 Engineering (Core) - ₹4-12 LPA\n8. 🎓 Teaching/Research - ₹4-15 LPA\n\n**What do you want to know?**\n- About a specific company\n- Salary details\n- Exam preparation\n- Skill development plan\n\nAsk me anything, ${name}! 🎯`;
}

function getExamResponse(message, lang) {
  const m = message.toLowerCase();
  const hi = lang === 'hi';

  if (/\b(jee|jee main|jee advanced)\b/i.test(m)) {
    return `**JEE (Joint Entrance Examination)**\n\n**JEE Main:**\n- Conducted by: NTA\n- Frequency: 2 times/year\n- Papers: Physics, Chemistry, Math\n- Questions: 90 (attempt 75)\n- Total: 300 marks\n- Duration: 3 hours\n\n**JEE Advanced:**\n- For top 2.5 lakh from JEE Main\n- Papers: 2 (6 hours total)\n- Difficulty: Very High\n\n**Important Topics (High Weightage):**\n- **Physics:** Mechanics, Electrostatics, Optics, Modern Physics\n- **Chemistry:** Organic (GOC, Reactions), Physical (Mole, Equilibrium)\n- **Math:** Calculus, Algebra, Coordinate Geometry, Vectors\n\n**Preparation Tips:**\n1. NCERT first, then reference books\n2. Solve previous year papers\n3. Mock tests weekly\n4. Focus on weak areas\n\n**Books:**\n- Physics: HC Verma, DC Pandey\n- Chemistry: NCERT + MS Chouhan (Organic)\n- Math: Cengage, RD Sharma 📚`;
  }

  if (/\b(neet|neet exam|neet preparation)\b/i.test(m)) {
    return `**NEET (National Eligibility cum Entrance Test)**\n\n**Conducted by:** NTA\n**Frequency:** Once a year\n**Mode:** Offline (OMR)\n\n**Pattern:**\n- Physics: 45 questions (180 marks)\n- Chemistry: 45 questions (180 marks)\n- Biology: 90 questions (360 marks)\n- Total: 180 questions, 720 marks\n- Duration: 3 hours 20 minutes\n\n**Marking:**\n- Correct: +4\n- Wrong: -1\n- Unattempted: 0\n\n**Important Topics:**\n- **Biology:** Genetics, Ecology, Cell Biology, Human Physiology\n- **Chemistry:** Organic Chemistry, Biomolecules, Chemistry in Everyday Life\n- **Physics:** Mechanics, Thermodynamics, Optics\n\n**Preparation Tips:**\n1. NCERT Biology is Bible! (Read 10+ times)\n2. NCERT Chemistry for Inorganic\n3. Practice MCQs daily\n4. Mock tests every week\n\n**Books:**\n- Biology: NCERT + Trueman's\n- Physics: DC Pandey\n- Chemistry: NCERT + MS Chouhan 📚`;
  }

  if (/\b(upsc|upsc exam|upsc preparation|civil services exam)\b/i.test(m)) {
    return `**UPSC Civil Services Examination**\n\n**Three Stages:**\n1. **Prelims** (June)\n   - GS Paper 1: 100 questions, 200 marks\n   - CSAT Paper 2: 80 questions, 200 marks (qualifying)\n   - Negative marking: 1/3\n\n2. **Mains** (September)\n   - 9 papers, 1750 marks (GS: 7 papers, 1 optional, 1 essay)\n   - Duration: 5 days\n\n3. **Interview** (March)\n   - 275 marks\n   - Personality test\n\n**Syllabus Coverage:**\n- Indian History & Culture\n- Geography (India + World)\n- Indian Polity & Governance\n- Economy\n- Science & Technology\n- Environment & Ecology\n- Ethics & Aptitude\n\n**Preparation Strategy:**\n1. Start with NCERTs (6th-12th)\n2. Standard books: Laxmikanth (Polity), Spectrum (History)\n3. Current affairs daily (The Hindu/Indian Express)\n4. Answer writing practice\n5. Mock tests for Prelims & Mains\n\n**Timeline:** 12-18 months dedicated preparation 🏛️`;
  }

  if (/\b(ssc|ssc cgl|ssc chsl|ssc exam)\b/i.test(m)) {
    return `**SSC (Staff Selection Commission) Exams**\n\n**SSC CGL (Combined Graduate Level):**\n- Posts: Income Tax Inspector, CBI Sub-Inspector, Auditor, etc.\n- **Tier 1:** 100 questions, 200 marks (GK, Reasoning, Math, English)\n- **Tier 2:** 4 papers, 600 marks\n- **Salary:** ₹25,500-81,100/month\n\n**SSC CHSL (Combined Higher Secondary Level):**\n- Posts: LDC, DEO, Postal Assistant\n- **Tier 1:** 100 questions, 200 marks\n- **Salary:** ₹19,900-63,200/month\n\n**Preparation Tips:**\n1. Previous year papers (2018-2024)\n2. Reasoning: Practice puzzles daily\n3. Math: Arithmetic + Advanced\n4. GK: Current affairs + Static GK\n5. English: Grammar + Vocabulary\n\n**Books:**\n- Kiran's SSC Mathematics\n- SP Bakshi (English)\n- Lucent's GK 📚`;
  }

  if (/\b(banking|ibps|ibps po|ibps clerk|sbi po|sbi clerk)\b/i.test(m)) {
    return `**Banking Exams (IBPS, SBI)**\n\n**IBPS PO:**\n- Probationary Officer\n- **Prelims:** 100 questions, 100 marks (1 hour)\n- **Mains:** 155 questions, 200 marks (3.5 hours)\n- **Salary:** ₹36,000-64,000/month\n\n**IBPS Clerk:**\n- **Prelims:** 100 questions, 100 marks\n- **Mains:** 190 questions, 200 marks\n- **Salary:** ₹19,900-47,920/month\n\n**SBI PO:**\n- **Salary:** ₹36,000-64,000/month\n- Higher prestige than IBPS\n\n**Preparation Tips:**\n1. **Reasoning:** Puzzles, Seating Arrangement, Syllogism\n2. **Quant:** Speed Math, DI, Word Problems\n3. **English:** Reading Comprehension, Error Spotting\n4. **GA:** Banking awareness, Current affairs\n5. **Computer:** Basic computer knowledge\n\n**Daily Routine:**\n- 2 hours: Quant practice\n- 1.5 hours: Reasoning\n- 1 hour: English\n- 30 min: Current affairs 🏦`;
  }

  if (/\b(board exam|cbse|icse|10th|12th|board preparation)\b/i.test(m)) {
    return `**Board Exam Preparation (CBSE/ICSE)**\n\n**Strategy for 90%+ Marks:**\n\n**Phase 1 (April-September):**\n- Complete NCERT thoroughly\n- Make short notes\n- Solve back exercises\n\n**Phase 2 (October-December):**\n- Sample papers\n- Previous year questions\n- Focus on weak chapters\n\n**Phase 3 (January-March):**\n- 5+ sample papers per subject\n- Revision from short notes\n- Time management practice\n\n**Subject-wise Tips:**\n- **Math:** Practice daily, RD Sharma + NCERT\n- **Science:** NCERT is enough for 95%+\n- **English:** Practice writing, read literature\n- **Social Science:** Map work + timeline\n\n**Important:**\n- NCERT is the BIBLE for boards\n- Solve 10 previous year papers\n- Wake up early, study 6-8 hours daily\n- Don't ignore any subject\n\n**Target: 95%+ is achievable! 🎯**`;
  }

  if (/\b(gate|gate exam)\b/i.test(m)) {
    return `**GATE (Graduate Aptitude Test in Engineering)**\n\n**Eligibility:** B.Tech/B.E. (3rd year onwards)\n**Papers:** 30 disciplines\n\n**Pattern:**\n- Total: 100 marks\n- General Aptitude: 15 marks\n- Subject: 85 marks\n- Duration: 3 hours\n- Negative marking: 1/3 for MCQ\n\n**Uses:**\n1. M.Tech admission (IITs, NITs)\n2. PSU recruitment (ONGC, IOCL, NTPC)\n3. Research fellowship\n\n**Preparation (6-8 months):**\n1. Complete syllabus (2-3 months)\n2. Previous year papers (2 months)\n3. Mock tests (2 months)\n4. Revision (1 month)\n\n**PSU Salaries through GATE:**\n- ONGC: ₹12-18 LPA\n- IOCL: ₹12-15 LPA\n- NTPC: ₹10-14 LPA\n- BHEL: ₹10-14 LPA 📚`;
  }

  return hi
    ? `**Exam Preparation Guide**\n\nMujhe batayein kis exam ki taiyari kar rahe hain:\n\n🎯 **Competitive Exams:**\n- JEE (Engineering)\n- NEET (Medical)\n- UPSC (Civil Services)\n- GATE (Higher Studies/PSU)\n\n📝 **Other Exams:**\n- SSC CGL/CHSL\n- Banking (IBPS/SBI)\n- Board Exams (CBSE/ICSE)\n- CAT (MBA)\n- CLAT (Law)\n\nKis exam ke liye help chahiye? 📚`
    : `**Exam Preparation Guide**\n\nTell me which exam you're preparing for:\n\n🎯 **Competitive Exams:**\n- JEE (Engineering)\n- NEET (Medical)\n- UPSC (Civil Services)\n- GATE (Higher Studies/PSU)\n\n📝 **Other Exams:**\n- SSC CGL/CHSL\n- Banking (IBPS/SBI)\n- Board Exams (CBSE/ICSE)\n- CAT (MBA)\n- CLAT (Law)\n\nWhich exam do you need help with? 📚`;
}

// ===== Basic conversation response =====
function getConversationResponse(message, lang) {
  const m = message.toLowerCase().trim();
  const hi = lang === 'hi';
  const hn = lang === 'hinglish';

  if (/^(hi|hello|hey|namaste|namaskar)/i.test(m)) {
    if (hi) return '**Namaste!** \uD83D\uDE4F\n\nMain aapka AI Career Coach hoon. Main aapki career guidance, skill development, aur education ke baare mein madad kar sakta hoon.\n\nKya jaanna hai aapko?';
    if (hn) return '**Namaste!** \uD83D\uDE4F\n\nMain aapka AI Career Coach hoon. Aapko career guidance, skill development, education ke baare mein help kar sakta hoon.\n\nKya puchna hai?';
    return '**Hello!** \uD83D\uDC4B\n\nI\'m your AI Career Coach. I can help you with:\n- Career guidance & planning\n- Skill development\n- Education & exams\n- Salary expectations\n- Job preparation\n\nWhat would you like to know?';
  }

  if (/^(good morning)/i.test(m)) {
    return hi ? '**Suprabhat!** \u2600\uFE0F\n\nUmeed hai aapka din accha ho! Main aapki career guidance mein madad ke liye hoon.\n\nAaj kya jaanna chahte hain?' : '**Good Morning!** \u2600\uFE0F\n\nHope you are having a great day! I am here to help with career guidance.\n\nWhat would you like to know today?';
  }

  if (/^(good evening)/i.test(m)) {
    return hi ? '**Shubh Sandhya!** \uD83C\uDF06\n\nAaj ka din kaisa raha? Main aapka career coach hoon.\n\nKuch jaanna hai?' : '**Good Evening!** \uD83C\uDF06\n\nHow was your day? I am your career coach.\n\nAnything you would like to know?';
  }

  if (/^(good night)/i.test(m)) {
    return hi ? '**Shubh Ratri!** \uD83C\uDF19\n\nAaram se so jaiye! Kal fir milte hain career guidance ke liye.' : '**Good Night!** \uD83C\uDF19\n\nSleep well! Let us continue career guidance tomorrow.';
  }

  if (/\b(thank|thanks|dhanyavad|shukriya)\b/i.test(m)) {
    return hi ? '**Swagat hai!** \uD83D\uDE0A\n\nAapki madad karke mujhe khushi hui! Kuch aur jaanna ho toh zaroor pucho.' : '**You are welcome!** \uD83D\uDE0A\n\nHappy to help! Feel free to ask anything else.';
  }

  if (/\b(bye|alvida|goodbye|see you|phir milenge)\b/i.test(m)) {
    return hi ? '**Alvida!** \uD83D\uDC4B\n\nMilte hain fir! Apna khayal rakho aur career ke baare mein sochte raho!' : '**Goodbye!** \uD83D\uDC4B\n\nSee you later! Keep thinking about your career!';
  }

  if (/\b(kaise ho|how are you|kya haal|kya chal|kaisa hai)\b/i.test(m)) {
    if (hi) return '**Main bilkul theek hoon!** \uD83D\uDE0A\n\nAap batayein, aapki career planning kaisi chal rahi hai? Kuch help chahiye?';
    if (hn) return '**Main badhiya hoon!** \uD83D\uDE0A\n\nAap batao, career planning kaisi chal rahi hai?';
    return '**I am doing great, thanks for asking!** \uD83D\uDE0A\n\nHow can I help you with your career today?';
  }

  if (/\b(who are you|tum kaun ho|aap kaun|your name|tumhara naam)\b/i.test(m)) {
    return hi ? '**Mera naam Mera Raasta AI Coach hai!** \uD83E\uDD16\n\nMain ek AI-powered career guidance assistant hoon. Main Indian students ko career decisions mein madad karta hoon - coding, exams, jobs, skills, sab kuch!' : '**I am Mera Raasta AI Coach!** \uD83E\uDD16\n\nI am an AI-powered career guidance assistant helping Indian students with career decisions, coding, exams, jobs, skills, and more!';
  }

  return hi ? 'Haan, main sun raha hoon! \uD83C\uDFAF\n\nAap mujhse ye puch sakte hain:\n- Career guidance\n- Coding programs\n- Exam preparation\n- Salary expectations\n- Skill development\n\nKya jaanna hai aapko?' : 'I am listening! \uD83C\uDFAF\n\nYou can ask me about:\n- Career guidance\n- Coding programs\n- Exam preparation\n- Salary expectations\n- Skill development\n\nWhat would you like to know?';
}

// ===== Joke response =====
function getJokeResponse(lang) {
  const hiJokes = [
    '**Programmer joke** \uD83D\uDE04\n\nProgrammer ki biwi: Mujhe ek naya dress chahiye!\nProgrammer: Error 404: Budget not found!',
    '**Coding joke** \uD83D\uDE04\n\nEk programmer ne apni gf ko propose kiya:\nI love you more than my code!\nGf: Toh mujhe delete kar do!',
    '**Student joke** \uD83D\uDE04\n\nTeacher: Tum homework kyun nahi kiya?\nStudent: Mere paas internet nahi tha!\nTeacher: Toh phone mein Google Lens kyun hai?',
    '**IT joke** \uD83D\uDE04\n\nClient: Yeh website simple hai na?\nDeveloper: Haan, sirf 47 languages, 23 frameworks, aur 1000+ lines!',
  ];
  const enJokes = [
    '**Coding Joke** \uD83D\uDE04\n\nWhy do programmers prefer dark mode?\nBecause light attracts bugs!',
    '**Dev Joke** \uD83D\uDE04\n\nA programmer\'s wife tells him: Go to the store and buy bread. If they have eggs, buy a dozen.\nHe comes home with 12 loaves.',
    '**Student Joke** \uD83D\uDE04\n\nTeacher: What is the Binary System?\nStudent: That\'s when you have only two options - Do it or Don\'t!',
    '**IT Joke** \uD83D\uDE04\n\n99 little bugs in the code,\n99 little bugs.\nFix one bug,\nCompile again,\n127 little bugs in the code!',
  ];
  const arr = lang === 'hi' || lang === 'hinglish' ? hiJokes : enJokes;
  return arr[Math.floor(Math.random() * arr.length)];
}

// ===== Motivation response =====
function getMotivationResponse(message, lang) {
  const m = message.toLowerCase();
  const hi = lang === 'hi';

  if (/fail|failure|haar|not selected|rejected/i.test(m)) {
    return hi ? '**Haarna Matt!** \uD83D\uDCAA\n\n*Haar ek sabaak hai, ek haar ek kadam hai aage badhne ki taraf!*\n\n**Famous Failures:**\n- **Abdul Kalam:** Scientist reject hua, baad mein President bana!\n- **Sachin Tendulkar:** First selection reject hua!\n- **SRK:** Gareebi se aaya, Bollywood ka King bana!\n- **Elon Musk:** SpaceX pehle 3 baar fail hua!\n\nHaar ek mauka hai kuch naya seekhne ka!' : '**Do not Give Up!** \uD83D\uDCAA\n\n*Failure is not the opposite of success; it is part of success!*\n\n**Famous Failures:**\n- **Abdul Kalam:** Rejected as scientist, became President!\n- **Sachin Tendulkar:** Failed first selection!\n- **SRK:** Came from poverty, became Bollywood King!\n- **Elon Musk:** SpaceX failed 3 times first!\n\nEvery failure is a chance to learn something new!';
  }

  if (/stress|stressed|depress|depressed|anxiety|anxious|worried|sad|sadness|tension|pressure|pareshan|upset|unhappy|cry|crying|lonely|alone|scared|afraid|fear|panic|overwhelmed|burnout|hopeless|mann nahi lag/i.test(m)) {
    return hi ? '**Main aapke saath hoon!** \uD83D\uDC95\n\nTension mat lo, har mushkil ka hal hota hai.\n\n**Kya karein:**\n1. Deep breathing karo - 4 sec saans lo, 4 sec roko, 4 sec chhodo\n2. Exercise karo - 30 min walk bhi bahut helpful hai\n3. Doston se baat karo\n4. Apna kaam chhota chhota mein divide karo\n5. Sleep proper lo - kam se kam 7 ghante\n\n**Yaad rakho:** Depression serious hai. Agar bahut zyada ho, toh counselor se baat karo. Yeh kamzori nahi hai, taakat hai!' : '**I am here for you!** \uD83D\uDC95\n\nDo not worry, every difficulty has a solution.\n\n**What to do:**\n1. Deep breathing - 4 sec inhale, 4 sec hold, 4 sec exhale\n2. Exercise - even 30 min walk helps\n3. Talk to friends\n4. Break your work into small tasks\n5. Sleep properly - at least 7 hours\n\n**Remember:** Depression is serious. If it is too much, talk to a counselor. It is not weakness, it is strength!';
  }

  if (/hard work|mehnat|kathin|struggle|mushkil/i.test(m)) {
    return hi ? '**Mehnat rang laati hai!** \uD83D\uDD25\n\n*\"Mehnat itni khamoshi se karo ki safalta shor macha de!\"*\n\n**Success Mantra:**\n1. Roz 2-3 ghante apne goal ke liye do\n2. Chhote chhote targets banao\n3. Consistency rakho - roz karo, chhodna mat\n4. Aas paas ke logon se inspiration lo\n5. Haar mat mano - 100 baar gir ke uthna hai\n\n**India ke heroes:**\n- Narayana Murthy - 6000 Rs se Infosys banaya\n- Dhirubhai Ambani - petrol pump se Reliance banaya\n- APJ Abdul Kalam - garib se President tak' : '**Hard Work Pays Off!** \uD83D\uDD25\n\n*Work so hard in silence that success makes the noise!*\n\n**Success Mantra:**\n1. Give 2-3 hours daily to your goal\n2. Make small targets\n3. Stay consistent - do it daily, never quit\n4. Get inspiration from people around you\n5. Never give up - fall 100 times, rise 101\n\n**Indian Heroes:**\n- Narayana Murthy - built Infosys from 6000 Rs\n- Dhirubhai Ambani - built Reliance from petrol pump\n- APJ Abdul Kalam - from poor background to President';
  }

  return hi ? '**Aap bahut kuch kar sakte ho!** \u2B50\n\n*Duniya mein koi bhi cheez impossible nahi hai, bas zaroorat hai iraade ki!*\n\n**Tips:**\n1. Apna goal likho - paper pe likhne se power aati hai\n2. Daily 1 ghanta skill develop karo\n3. Acche logon se milo\n4. Negativity se door raho\n5. Apne aap pe bharosa rakho\n\nKoi specific problem hai? Mujhe batayo, hum mil ke solve karenge!' : '**You Can Do Anything!** \u2B50\n\n*Nothing is impossible in this world, you just need the willpower!*\n\n**Tips:**\n1. Write down your goal - writing gives power\n2. Develop 1 skill daily\n3. Meet positive people\n4. Stay away from negativity\n5. Believe in yourself\n\nGot a specific problem? Tell me, we will solve it together!';
}

// ===== Recipe / food response =====
function getRecipeResponse(message, lang) {
  const m = message.toLowerCase();
  const hi = lang === 'hi';

  if (/biryani/i.test(m)) {
    return hi ? '**Chicken Biryani Recipe** \uD83C\uDF5A\n\n**Samagri:**\n- 500g basmati chawal\n- 500g chicken\n- 2 pyaaz (barik kata hua)\n- 2 tamatar\n- 1 cup dahi\n- Biryani masala\n- Haldi, mirch, namak\n- Kewra, ittar\n\n**Vidhi:**\n1. Chicken ko dahi aur masale mein 1 ghanta marinate karo\n2. Chawal ko 80% ubaal lo\n3. Pyaaz ko golden brown fry karo\n4. Ek handi mein layers lagao - chicken, chawal, pyaaz\n5. Dum pe 20-25 min pakao\n6. Kewra water chhidak do\n\nTayyar hai aapki delicious Biryani!' : '**Chicken Biryani Recipe** \uD83C\uDF5A\n\n**Ingredients:**\n- 500g basmati rice\n- 500g chicken\n- 2 onions (finely sliced)\n- 2 tomatoes\n- 1 cup curd\n- Biryani masala\n- Turmeric, chili, salt\n- Kewra water\n\n**Steps:**\n1. Marinate chicken with curd and masala for 1 hour\n2. Parboil rice to 80%\n3. Fry onions till golden brown\n4. Layer in handi - chicken, rice, onions\n5. Dum cook for 20-25 min\n6. Sprinkle kewra water\n\nYour delicious Biryani is ready!';
  }

  if (/chai|tea/i.test(m)) {
    return hi ? '**Perfect Chai Recipe** \u2615\n\n**Samagri:**\n- 1 cup paani\n- 1 cup doodh\n- 2 chammach patti\n- Cheeni (swaad anusar)\n- Adrak (optional)\n- Elaichi (optional)\n\n**Vidhi:**\n1. Paani ubaal lo\n2. Patti daal do\n3. 2 min ubaalne do\n4. Doodh daal do\n5. Cheeni daal do\n6. 2-3 min ubaalne do\n7. Chhan lo aur piyo!\n\nGaram garam chai ka maza lo!' : '**Perfect Chai Recipe** \u2615\n\n**Ingredients:**\n- 1 cup water\n- 1 cup milk\n- 2 tsp tea leaves\n- Sugar (to taste)\n- Ginger (optional)\n- Cardamom (optional)\n\n**Steps:**\n1. Boil water\n2. Add tea leaves\n3. Boil for 2 min\n4. Add milk\n5. Add sugar\n6. Boil for 2-3 min\n7. Strain and enjoy!\n\nEnjoy your hot chai!';
  }

  return hi ? '**Indian Khana** \uD83C\uDF5B\n\nAapko kis dish ke baare mein jaanna hai?\n\n- **Biryani** - Hyderabadi style\n- **Chai** - Perfect masala chai\n- **Paneer Butter Masala** - Restaurant style\n- **Dal Makhani** - creamy dal\n- **Samosa** - crispy snack\n- **Dosa** - South Indian favorite\n\nKoi bhi dish batao, recipe de dunga!' : '**Indian Food** \uD83C\uDF5B\n\nWhich dish would you like to know about?\n\n- **Biryani** - Hyderabadi style\n- **Chai** - Perfect masala chai\n- **Paneer Butter Masala** - Restaurant style\n- **Dal Makhani** - Creamy dal\n- **Samosa** - Crispy snack\n- **Dosa** - South Indian favorite\n\nTell me any dish, I will give you the recipe!';
}

// ===== General fallback response (tab use hota hai jab dono AI down ho) =====
function getGeneralResponse(message, lang) {
  const hi = lang === 'hi';
  const q = String(message || '').slice(0, 80);
  return hi ? `**Aapka sawaal:** "${q}"\n\nAbhi AI thoda busy hai, isliye main offline mode mein hoon \uD83D\uDE0A\n\nThodi der baad try karo — tab tak yeh puch sakte ho:\n\n\uD83C\uDFAF **Career Guidance** - 10th/12th/graduation ke baad kya?\n\uD83D\uDCBB **Coding** - Python, Java, C++ programs\n\uD83D\uDCB0 **Salary** - India mein kitna milta hai?\n\uD83D\uDCDD **Exams** - JEE, NEET, UPSC, GATE\n\uD83E\uDDE0 **Skills** - Job ke liye kya seekhein?\n\uD83C\uDFAF **Motivation** - Mann nahi lag raha\n\n*Sawaal ka jawab AI chalu hote hi mil jayega!*` : `**You asked:** "${q}"\n\nOur AI is briefly busy right now, so I am in offline mode \uD83D\uDE0A\n\nPlease try again in a moment — meanwhile you can ask:\n\n\uD83C\uDFAF **Career Guidance** - What after 10th/12th/graduation?\n\uD83D\uDCBB **Coding** - Python, Java, C++ programs\n\uD83D\uDCB0 **Salary** - How much in India?\n\uD83D\uDCDD **Exams** - JEE, NEET, UPSC, GATE\n\uD83E\uDDE0 **Skills** - What to learn for jobs?\n\uD83C\uDFAF **Motivation** - Feeling down\n\n*You will get the AI answer as soon as it is back!*`;
}

// ===== Generate response based on topic =====
// Order: 1) Real Gemini (key fix hone par) → 2) Instant exact handlers
// (greeting/code/math) → 3) Real Free AI (koi bhi sawaal) → 4) Offline fallback
async function generateResponse(message, profile, lang, userId) {
  // Step 1: Real Gemini API (jab Google AQ key bug fix karega, yeh chalega)
  const geminiReply = await tryGeminiAPI(message, userId, lang, profile);
  if (geminiReply) return geminiReply;

  const topic = detectTopic(message);

  // Step 2: Instant reliable handlers — greetings, jokes, motivation, recipes,
  // code aur simple math yahan exact aur fast milte hain
  if (topic === 'conversation') return getConversationResponse(message, lang);
  if (topic === 'joke') return getJokeResponse(lang);
  if (topic === 'motivation') return getMotivationResponse(message, lang);
  if (topic === 'recipe') return getRecipeResponse(message, lang);
  if (topic === 'programming') return generateCodeResponse(message, lang);
  if (/\d\s*[+\-*/^%]\s*\d/.test(message) || topic === 'math') {
    const mathAns = solveMath(message);
    if (mathAns) return mathAns;
  }

  // Step 3: Real AI — science, career, exam, general ya koi bhi doosra sawaal
  const aiReply = await tryFreeAI(message, userId, lang, profile);
  if (aiReply) return aiReply;

  // Step 4: Offline keyword fallback (jab dono AI na chalein)
  switch (topic) {
    case 'science':
      return getScienceResponse(message, lang);
    case 'career':
      return getCareerResponse(message, profile, lang);
    case 'exam':
      return getExamResponse(message, lang);
    default:
      return getGeneralResponse(message, lang);
  }
}

// ===== chat (non-streaming) =====
export const chat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const lang = detectLanguage(message);
    let profile = null;
    try {
      profile = await StudentProfile.findOne({ user: req.user._id }).populate('user', 'name email');
    } catch {}

    const response = await generateResponse(message, profile, lang, req.user._id);
    addToHistory(req.user._id, 'user', message);
    addToHistory(req.user._id, 'assistant', response);

    return res.status(200).json({ success: true, data: { response } });
  } catch (error) {
    console.error('AI Chat error:', error);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

// ===== chatStream (SSE) — real-time streaming like real Gemini =====
export const chatStream = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const lang = detectLanguage(message);
    const userId = req.user._id;
    let profile = null;
    try {
      profile = await StudentProfile.findOne({ user: userId }).populate('user', 'name email');
    } catch {}

    // Pehle se bana hua response bhejne ke liye helper (chunk-by-chunk typing effect)
    const sendFull = async (fullResponse) => {
      addToHistory(userId, 'user', message);
      addToHistory(userId, 'assistant', fullResponse);
      const chunkSize = 15;
      for (let i = 0; i < fullResponse.length; i += chunkSize) {
        res.write(`data: ${JSON.stringify({ chunk: fullResponse.slice(i, i + chunkSize) })}\n\n`);
        await new Promise(r => setTimeout(r, 20));
      }
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    };

    // Step 1: Real Gemini STREAMING (key fix hone par — token-by-token, bilkul Google jaisa)
    let geminiFull = '';
    const geminiStreamed = await streamGeminiAPI(message, userId, lang, profile, (chunk) => {
      geminiFull += chunk;
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    });
    if (geminiStreamed && geminiFull.trim()) {
      addToHistory(userId, 'user', message);
      addToHistory(userId, 'assistant', geminiFull);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      return res.end();
    }

    const topic = detectTopic(message);

    // Step 2: Instant handlers — greeting, joke, motivation, recipe, code, math
    let instant = null;
    if (topic === 'conversation') instant = getConversationResponse(message, lang);
    else if (topic === 'joke') instant = getJokeResponse(lang);
    else if (topic === 'motivation') instant = getMotivationResponse(message, lang);
    else if (topic === 'recipe') instant = getRecipeResponse(message, lang);
    else if (topic === 'programming') instant = generateCodeResponse(message, lang);
    else if (/\d\s*[+\-*/^%]\s*\d/.test(message) || topic === 'math') instant = solveMath(message);
    if (instant) return await sendFull(instant);

    // Step 3: Real AI streaming — har token turant stream hota hai (Gemini jaisa)
    let fullAI = '';
    const streamed = await streamFreeAI(message, userId, lang, profile, (chunk) => {
      fullAI += chunk;
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    });

    if (streamed && fullAI.trim()) {
      addToHistory(userId, 'user', message);
      addToHistory(userId, 'assistant', fullAI);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      return res.end();
    }

    // Step 4: Offline fallback (jab AI down ho)
    let fallback;
    switch (topic) {
      case 'science': fallback = getScienceResponse(message, lang); break;
      case 'career': fallback = getCareerResponse(message, profile, lang); break;
      case 'exam': fallback = getExamResponse(message, lang); break;
      default: fallback = getGeneralResponse(message, lang);
    }
    return await sendFull(fallback);
  } catch (error) {
    console.error('AI Stream error:', error);
    try {
      res.write(`data: ${JSON.stringify({ chunk: 'Sorry, something went wrong. Please try again.' })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch {}
  }
};

// ===== clearHistory =====
export const clearHistory = async (req, res) => {
  try {
    conversationHistory.delete(String(req.user._id));
    return res.status(200).json({ success: true, message: 'History cleared' });
  } catch (error) {
    console.error('Clear history error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
