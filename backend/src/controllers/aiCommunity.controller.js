import { GoogleGenerativeAI } from '@google/generative-ai';
import StudentProfile from '../models/StudentProfile.js';

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const genAI = GEMINI_KEY && GEMINI_KEY.length > 10
  ? new GoogleGenerativeAI(GEMINI_KEY)
  : null;

if (genAI) {
  console.log('Gemini AI initialized');
  console.log(`  Key: ${GEMINI_KEY.substring(0, 12)}...`);
} else {
  console.log('Gemini AI disabled — need valid key from aistudio.google.com/apikey');
}

const chatSessions = new Map();

const SYSTEM_INSTRUCTION = `You are MeraRaasta AI — a powerful, intelligent AI assistant for Indian students, built on Google Gemini technology.

CAPABILITIES — You can do ANYTHING:
- Answer ANY question on ANY topic — just like Google Gemini
- Write code in ANY programming language (Java, Python, JavaScript, C, C++, HTML, CSS, SQL, React, Node.js, etc.)
- Solve math problems step by step
- Explain science concepts (Physics, Chemistry, Biology)
- Help with career guidance specific to India
- Help with exam preparation (JEE, NEET, UPSC, Board exams, SSC, Banking)
- Write resumes, cover letters
- Give interview tips
- Discuss current events, history, geography
- Translate between Hindi, English, and other languages
- Tell jokes, share motivational quotes
- Give personal advice (study-life balance, stress management)
- Have casual conversations

LANGUAGE RULES:
- If user writes in Hindi (Devanagari script), respond in Hindi
- If user writes in English, respond in English
- If user writes in Hinglish, respond in Hinglish
- Match the user's tone and style

BEHAVIOR:
- Be like Google Gemini — give detailed, accurate, well-structured answers
- Use markdown formatting: **bold**, \`code\`, \`\`\`code blocks\`\`\`
- Use emojis naturally but don't overdo
- Give specific, actionable advice — not vague
- For code: always provide complete, working code with explanation
- For career questions: give India-specific advice with salary ranges in LPA
- If you don't know something, say so honestly — don't make up
- Be conversational, friendly, like a smart friend
- Give long, detailed answers when the question deserves it
- Never say "I can't do that" — you CAN do almost everything`;

function detectLanguage(text) {
  if (!text || !text.trim()) return 'en';
  const hindiChars = text.match(/[\u0900-\u097F]/g);
  if (hindiChars && hindiChars.length >= 2) return 'hi';
  return 'en';
}

function getChatSession(userId, profile) {
  if (chatSessions.has(userId)) return chatSessions.get(userId);
  if (!genAI) return null;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    const history = [];
    if (profile?.user?.name || profile?.educationLevel) {
      const info = [];
      if (profile.user?.name) info.push(`User's name: ${profile.user.name}`);
      if (profile.educationLevel) info.push(`Education level: ${profile.educationLevel}`);
      if (profile.interests?.length) info.push(`Interests: ${profile.interests.join(', ')}`);
      if (profile.skills?.length) {
        const skillNames = profile.skills.map(s => s.name || s);
        info.push(`Skills: ${skillNames.join(', ')}`);
      }
      history.push({ role: 'user', parts: [{ text: `[System: Student profile — ${info.join('. ')}]` }] });
      history.push({ role: 'model', parts: [{ text: `Got it! I know about ${profile.user?.name || 'the student'}. I'll give personalized advice based on their profile. How can I help?` }] });
    }

    const chat = model.startChat({ history });
    chatSessions.set(userId, chat);
    return chat;
  } catch (error) {
    console.error('Chat session error:', error.message);
    return null;
  }
}

async function getGeminiResponse(message, userId, profile) {
  if (!genAI) return null;

  try {
    const chat = getChatSession(userId, profile);
    if (!chat) return null;

    console.log(`[Gemini] User ${userId}: ${message.substring(0, 50)}...`);
    const result = await chat.sendMessage(message);
    const text = result.response.text();
    console.log(`[Gemini] Response OK (${text.length} chars)`);
    return text;
  } catch (error) {
    console.error(`[Gemini] FAILED:`, error.message);
    chatSessions.delete(userId);
    return null;
  }
}

async function* getGeminiStream(message, userId, profile) {
  if (!genAI) return;

  try {
    const chat = getChatSession(userId, profile);
    if (!chat) return;

    console.log(`[Gemini Stream] User ${userId}: ${message.substring(0, 50)}...`);
    const result = await chat.sendMessageStream(message);

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
    console.log(`[Gemini Stream] Complete`);
  } catch (error) {
    console.error(`[Gemini Stream] FAILED:`, error.message);
    chatSessions.delete(userId);
    yield '\n\n[Connection lost — please try again]';
  }
}

export const chat = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const userId = req.user._id.toString();

    let profile = null;
    try {
      profile = await StudentProfile.findOne({ user: req.user._id }).populate('user', 'name email');
    } catch (e) { /* skip */ }

    const userLang = detectLanguage(message);

    if (genAI) {
      const response = await getGeminiResponse(message, userId, profile);
      if (response) {
        return res.status(200).json({
          success: true,
          data: { response, language: userLang, isAI: true, timestamp: new Date().toISOString() }
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        response: getFallbackResponse(message, userLang),
        language: userLang,
        isAI: false,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('AI Chat error:', error.message);
    const { message: msg } = req.body || {};
    const userLang = detectLanguage(msg || 'hello');
    res.status(200).json({
      success: true,
      data: {
        response: getFallbackResponse(msg || 'hello', userLang),
        language: userLang,
        isAI: false,
        timestamp: new Date().toISOString()
      }
    });
  }
};

export const chatStream = async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const userId = req.user._id.toString();

    let profile = null;
    try {
      profile = await StudentProfile.findOne({ user: req.user._id }).populate('user', 'name email');
    } catch (e) { /* skip */ }

    const userLang = detectLanguage(message);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    if (genAI) {
      let fullResponse = '';
      try {
        for await (const chunk of getGeminiStream(message, userId, profile)) {
          fullResponse += chunk;
          res.write(`data: ${JSON.stringify({ chunk, done: false })}\n\n`);
        }
        res.write(`data: ${JSON.stringify({ chunk: '', done: true, isAI: true, language: userLang })}\n\n`);
        res.end();
        return;
      } catch (error) {
        console.error('[Stream] Error:', error.message);
      }
    }

    const fallback = getFallbackResponse(message, userLang);
    res.write(`data: ${JSON.stringify({ chunk: fallback, done: false })}\n\n`);
    res.write(`data: ${JSON.stringify({ chunk: '', done: true, isAI: false, language: userLang })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Stream error:', error.message);
    res.write(`data: ${JSON.stringify({ chunk: 'Error occurred', done: true, isAI: false })}\n\n`);
    res.end();
  }
};

export const clearHistory = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    chatSessions.delete(userId);
    res.status(200).json({ success: true, message: 'Chat history cleared' });
  } catch (error) { next(error); }
};

function getFallbackResponse(message, lang) {
  if (lang === 'hi') {
    return `Main MeraRaasta AI hoon! 🤖\n\nFilhal mera Gemini AI connection kaam nahi kar raha. Lekin main phir bhi help kar sakta hoon!\n\nMujhse pucho:\n🎯 Career guidance\n💻 Code likhwa lo\n📚 Padhai mein help\n🧮 Math solve\n😄 Jokes\n\nBas clear mein pucho! 💪`;
  }
  return `I'm MeraRaasta AI! 🤖\n\nMy Gemini AI connection is currently unavailable. But I can still help!\n\nAsk me about:\n🎯 Career guidance\n💻 Code in any language\n📚 Study help\n🧮 Math problems\n😄 Fun stuff\n\nJust ask clearly! 💪`;
}
