import { GoogleGenerativeAI } from '@google/generative-ai';
import StudentProfile from '../models/StudentProfile.js';
import Career from '../models/Career.js';

const genAI = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10 && !process.env.GEMINI_API_KEY.includes('placeholder')
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

if (genAI) console.log('✅ Gemini AI enabled');
else console.log('⚠️  Gemini AI disabled — using smart fallback responses');

const conversationHistory = new Map();

const SYSTEM_PROMPT = `You are "MeraRaasta AI" — a friendly, expert Indian career guidance AI counselor.

Your capabilities:
- Career guidance (Indian job market, streams after 10th/12th, college recommendations)
- Skill development (coding, soft skills, certifications)
- Education planning (courses, colleges, scholarships in India)
- Resume building and interview preparation
- Study tips and exam preparation
- Government schemes for students (scholarships, reservations)
- Parent guidance (how to support children's career choices)

Language Rules:
- If user writes in Hindi (Devanagari script), respond entirely in Hindi
- If user writes in English, respond in English
- If user writes in Hinglish (mixed Hindi-English), respond in Hinglish naturally
- Always match the user's language style

Response Rules:
- Be warm, encouraging, and use simple language an Indian student can understand
- Give specific, actionable advice — not generic
- Use emojis naturally but don't overdo
- Keep responses concise (3-5 paragraphs max) unless asked for detail
- Reference Indian context: IITs, NITs, AIIMS, CBSE, JEE, NEET, UPSC, state boards, etc.
- If asked about non-career topics, politely redirect to career/education guidance
- Never make up facts — say "I'm not sure" if unsure
- Be motivational when students feel lost or confused about their future`;

function detectLanguage(text) {
  if (!text || !text.trim()) return 'en';
  const hindiChars = text.match(/[\u0900-\u097F]/g);
  if (hindiChars && hindiChars.length >= 3) return 'hi';
  return 'en';
}

async function getGeminiResponse(message, history, profile, lang) {
  if (!genAI) return null;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_PROMPT,
    });

    let contextInfo = '';
    if (profile) {
      const parts = [];
      if (profile.user?.name) parts.push(`Name: ${profile.user.name}`);
      if (profile.educationLevel) parts.push(`Education: ${profile.educationLevel}`);
      if (profile.interests?.length) parts.push(`Interests: ${Array.isArray(profile.interests) ? profile.interests.join(', ') : ''}`);
      if (profile.skills?.length) {
        const skillNames = profile.skills.map(s => typeof s === 'object' ? s.name : s).filter(Boolean);
        if (skillNames.length) parts.push(`Skills: ${skillNames.join(', ')}`);
      }
      if (profile.careerGoals) {
        const goals = profile.careerGoals;
        const goalText = typeof goals === 'object'
          ? [goals.shortTerm, goals.longTerm, goals.dreamJob].filter(Boolean).join(', ')
          : String(goals);
        if (goalText) parts.push(`Career Goals: ${goalText}`);
      }
      if (parts.length) contextInfo = `\n\nUser Profile: ${parts.join(' | ')}`;
    }

    const chatHistory = (history || []).slice(-8).map(msg => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: `I am a student seeking career guidance.${contextInfo}` }] },
        { role: 'model', parts: [{ text: 'Namaste! I am MeraRaasta AI, your career guidance counselor. I will help you with careers, education, skills, and more. Feel free to ask me anything in Hindi, English, or Hinglish!' }] },
        ...chatHistory
      ],
      generationConfig: {
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 1024,
      },
    });

    const result = await chat.sendMessage(message);
    const response = result.response;
    const text = response.text();
    if (text && text.trim().length > 0) return text;
    return null;
  } catch (error) {
    console.error('Gemini error:', error.message?.substring(0, 200));
    return null;
  }
}

function getSmartFallback(message, profile, lang) {
  const name = profile?.user?.name || '';
  const interests = Array.isArray(profile?.interests) ? profile.interests : [];
  const level = profile?.educationLevel || '';

  const responses = {
    en: {
      greeting: name
        ? `Hey ${name}! 👋 Welcome to MeraRaasta AI Career Coach.\n\nI'm here to help you with:\n🎯 Career guidance & planning\n📚 Education & courses\n💼 Resume & interview tips\n🧠 Skill development\n🗺️ Learning roadmap\n\nWhat would you like to know? Just ask me anything about your career future!`
        : `Hey there! 👋 Welcome to MeraRaasta AI Career Coach.\n\nI'm here to help you with:\n🎯 Career guidance & planning\n📚 Education & courses\n💼 Resume & interview tips\n🧠 Skill development\n🗺️ Learning roadmap\n\nWhat would you like to know? Just ask me anything about your career future!`,
      career: `Great question about careers! 🎯\n\nHere are the top career paths in India right now:\n\n🔥 High Demand (2025-26):\n1. AI/ML Engineer — ₹8-25 LPA\n2. Full Stack Developer — ₹6-18 LPA\n3. Data Scientist — ₹7-20 LPA\n4. Cloud Architect — ₹10-30 LPA\n5. Cyber Security Expert — ₹8-22 LPA\n\n💼 Traditional but Stable:\n1. Doctor (MBBS) — Government + Private\n2. Government Jobs (SSC, UPSC, Banking)\n3. Engineer (IIT/NIT preferred)\n4. Chartered Accountant\n\n${level ? `Since you're at ${level} level, ` : ''}${interests.length ? `and interested in ${interests.join(', ')}, ` : ''}I can suggest a detailed roadmap.\n\nWhich field interests you the most?`,
      skill: `Let's talk about skills! 🧠\n\nMost In-Demand Skills in 2025-26:\n\n💻 Tech Skills:\n• Python / JavaScript — Start with these\n• React / Node.js — Web development\n• SQL — Database management\n• Cloud (AWS/Azure) — High paying\n\n🤝 Soft Skills:\n• Communication — #1 most requested\n• Problem solving — Critical for interviews\n• Team leadership — For management roles\n\n📝 Quick Action Plan:\n1. Pick ONE tech skill to learn first\n2. Spend 1 hour daily on practice\n3. Build 2-3 projects for portfolio\n4. Get certified (Google, Microsoft free certs)\n\nWant me to suggest specific courses?`,
      resume: `Resume tips that work! 📄\n\nThe Formula:\n1. Header — Name, Phone, Email, LinkedIn\n2. Summary — 2 lines about what you bring\n3. Education — Degree, College, Year, CGPA\n4. Skills — Technical + Tools\n5. Projects — 2-3 with results (use numbers!)\n\nPro Tips:\n✅ Use action verbs: "Built", "Led", "Improved"\n✅ Quantify: "Increased efficiency by 30%"\n✅ 1 page for freshers, 2 pages max for experienced\n❌ Don't include photo unless asked\n\nWant me to review your resume? Tell me your background!`,
      interview: `Interview preparation guide! 🎤\n\nBefore Interview:\n1. Research the company (website, recent news)\n2. Prepare "Tell me about yourself" (2 min story)\n3. Know your resume inside out\n\nCommon Questions:\n• "Why this company?" — Show you researched\n• "Strengths/Weaknesses" — Be honest but strategic\n• "5 years plan?" — Show ambition\n\nSTAR Method:\n• S — Situation (set the scene)\n• T — Task (what was needed)\n• A — Action (what YOU did)\n• R — Result (outcome + learning)\n\nDay Before:\n✅ Sleep well, dress professionally\n✅ Arrive 15 min early\n✅ Smile and be confident!\n\nYou've got this! 💪`,
      study: `Study tips that work! 📖\n\nThe 90-Minute Block Method:\n1. Study 25 min → Break 5 min (Pomodoro)\n2. After 4 blocks → Long break 20 min\n3. Do 3-4 blocks per day = 3 hours focused study\n\nMemory Techniques:\n• Spaced repetition — Revise after 1 day, 3 days, 7 days\n• Active recall — Close book, write what you remember\n• Mind maps — Visual connections\n• Teaching someone — Best way to learn\n\nFree Resources:\n📚 NPTEL — IIT courses (free)\n📚 Khan Academy — All subjects\n📚 Unacademy — Competitive exams\n📚 YouTube — Unlimited learning\n\nWhat subject or exam are you preparing for?`,
      default: `Interesting question! 🤔\n\nI'm your AI Career Coach and I can help with:\n\n🎯 Career Guidance — Which stream, college, job\n📚 Education — Courses, certifications, scholarships\n💼 Job Prep — Resume, interview, aptitude\n🧠 Skills — What to learn, how to learn\n🗺️ Planning — Step-by-step career roadmap\n\nAsk me anything! For example:\n• "What should I do after 12th PCM?"\n• "How to prepare for JEE?"\n• "Best courses for data science?"\n• "How to write a resume for freshers?"\n\nI'm here to help! 😊`,
    },
    hi: {
      greeting: name
        ? `नमस्ते ${name}! 👋 MeraRaasta AI Career Coach में आपका स्वागत है।\n\nमैं आपकी इन चीजों में मदद कर सकता हूँ:\n🎯 करियर मार्गदर्शन और योजना\n📚 शिक्षा और कोर्स\n💼 Resume और Interview tips\n🧠 कौशल विकास\n🗺️ सीखने का रोडमैप\n\nआप क्या जानना चाहेंगे? अपने करियर के बारे में कुछ भी पूछें!`
        : `नमस्ते! 👋 MeraRaasta AI Career Coach में आपका स्वागत है।\n\nमैं आपकी इन चीजों में मदद कर सकता हूँ:\n🎯 करियर मार्गदर्शन और योजना\n📚 शिक्षा और कोर्स\n💼 Resume और Interview tips\n🧠 कौशल विकास\n🗺️ सीखने का रोडमैप\n\nआप क्या जानना चाहेंगे? अपने करियर के बारे में कुछ भी पूछें!`,
      career: `करियर के बारे में बहुत अच्छा सवाल! 🎯\n\nभारत में इन क्षेत्रों में सबसे ज़्यादा अवसर हैं:\n\n🔥 उच्च मांग (2025-26):\n1. AI/ML Engineer — ₹8-25 LPA\n2. Full Stack Developer — ₹6-18 LPA\n3. Data Scientist — ₹7-20 LPA\n4. Cloud Architect — ₹10-30 LPA\n5. Cyber Security Expert — ₹8-22 LPA\n\n💼 पारंपरिक लेकिन स्थिर:\n1. डॉक्टर (MBBS)\n2. सरकारी नौकरी (SSC, UPSC, Banking)\n3. इंजीनियर (IIT/NIT)\n4. Chartered Accountant\n\n${level ? 'आपके ' + level + ' स्तर' : 'आपकी प्रोफ़ाइल'}${interests.length ? ' और ' + interests.join(', ') + ' में रुचि' : ''} के आधार पर, मैं विस्तृत रोडमैप दे सकता हूँ।\n\nकिस क्षेत्र में रुचि है?`,
      skill: `कौशल विकास की बात करते हैं! 🧠\n\n2025-26 में सबसे ज़्यादा मांग वाले कौशल:\n\n💻 तकनीकी कौशल:\n• Python / JavaScript — इनसे शुरू करें\n• React / Node.js — वेब डेवलपमेंट\n• SQL — डेटाबेस मैनेजमेंट\n• Cloud (AWS/Azure) — ज़्यादा पैसे\n\n🤝 सॉफ्ट स्किल्स:\n• Communication — सबसे ज़रूरी\n• Problem solving — Interview के लिए\n• Team leadership — मैनेजमेंट के लिए\n\n📝 क्विक एक्शन प्लान:\n1. पहले एक tech skill चुनें\n2. रोज़ 1 घंटा practice करें\n3. 2-3 projects बनाएं\n4. Google/Microsoft से free certification लें\n\nक्या specific courses suggest करने हैं?`,
      resume: `Resume tips जो काम करती हैं! 📄\n\nफॉर्मूला:\n1. Header — नाम, फ़ोन, Email, LinkedIn\n2. Summary — 2 लाइन क्या दे सकते हो\n3. Education — Degree, College, Year, CGPA\n4. Skills — Technical + Tools\n5. Projects — 2-3 results के साथ (numbers डालें!)\n\nPro Tips:\n✅ Action verbs use करें: "Built", "Led", "Improved"\n✅ Numbers डालें: "30% efficiency बढ़ाई"\n✅ Freshers के लिए 1 page\n❌ Photo मत डालें जब तक ना कहें\n\nResume review करवाना चाहेंगे? अपनी background बताएं!`,
      interview: `Interview की तैयारी गाइड! 🎤\n\nInterview से पहले:\n1. Company के बारे में जानें\n2. "Tell me about yourself" तैयार करें (2 min)\n3. Resume अच्छे से जानें\n\nCommon Questions:\n• "Why this company?" — Research दिखाएं\n• "Strengths/Weaknesses" — सच्चे रहें\n• "5 years में कहाँ देखते हैं?" — Ambition दिखाएं\n\nSTAR Method:\n• S — Situation\n• T — Task\n• A — Action (आपने क्या किया)\n• R — Result\n\nएक दिन पहले:\n✅ अच्छी नींद लें, professional कपड़े पहनें\n✅ 15 min पहले पहुंचें\n✅ Smile करें और confident रहें!\n\nआप कर सकते हैं! 💪`,
      study: `पढ़ाई के tips जो काम करते हैं! 📖\n\n90-Minute Block Method:\n1. 25 min पढ़ो → 5 min break (Pomodoro)\n2. 4 blocks के बाद → 20 min लंबा break\n3. रोज़ 3-4 blocks = 3 घंटे focused study\n\nयाद रखने के techniques:\n• Spaced repetition — 1 दिन, 3 दिन, 7 दिन बाद revise\n• Active recall — किताब बंद करके लिखो\n• Mind maps — Visual connections बनाओ\n• किसी को पढ़ाओ — सबसे अच्छा तरीका\n\nFree Resources:\n📚 NPTEL — IIT courses (free)\n📚 Khan Academy — सभी विषय\n📚 Unacademy — Competitive exams\n📚 YouTube — असीमित सीखना\n\nकिस विषय या exam की तैयारी कर रहे हैं?`,
      default: `बहुत अच्छा सवाल! 🤔\n\nमैं आपका AI Career Coach हूँ और मैं इन चीजों में मदद कर सकता हूँ:\n\n🎯 करियर मार्गदर्शन — कौन सी stream, college, job\n📚 शिक्षा — कोर्स, certification, छात्रवृत्ति\n💼 नौकरी की तैयारी — Resume, interview\n🧠 कौशल — क्या सीखें, कैसे सीखें\n🗺️ योजना — Step-by-step career roadmap\n\nकुछ भी पूछें! जैसे:\n• "12th PCM के बाद क्या करूँ?"\n• "JEE की तैयारी कैसे करूँ?"\n• "Data science के लिए best courses?"\n\nमैं यहाँ हूँ! 😊`,
    }
  };

  function detectTopic(msg) {
    const l = msg.toLowerCase();
    if (l.match(/^(hi|hello|hey|namaste|नमस्ते|sup|how are you|kaisa hai|kaise ho|क्या हाल|good morning|good evening)/)) return 'greeting';
    if (l.match(/\b(career|करियर|job|नौकरी|profession|क्षेत्र|field|become|बनना|after 12th|12th ke baad|after 10th|10th ke baad|what should i|kya karna|kya karun|best career|future)/)) return 'career';
    if (l.match(/\b(skill|कौशल|learn|सीख|course|कोर्स|coding|programming|python|javascript|tech|तकनीक|certification)/)) return 'skill';
    if (l.match(/\b(resume|cv|बायोडाटा|portfolio|biodata)/)) return 'resume';
    if (l.match(/\b(interview|इंटरव्यू|placement|नौकरी मिले|job interview|how to prepare)/)) return 'interview';
    if (l.match(/\b(study|पढ़|exam|परीक्षा|test|quiz|padhai|padhaai|पढ़ाई|jee|neet|upsc|board|cbse|icse)/)) return 'study';
    return 'default';
  }

  const topic = detectTopic(message);
  const langKey = lang === 'hi' ? 'hi' : 'en';
  return responses[langKey][topic] || responses[langKey].default;
}

export const chat = async (req, res, next) => {
  try {
    const { message, type } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const userId = req.user._id.toString();

    let profile = null;
    try {
      profile = await StudentProfile.findOne({ user: req.user._id }).populate('user', 'name email');
    } catch (e) {
      console.log('Profile fetch failed (non-critical):', e.message);
    }

    if (!conversationHistory.has(userId)) {
      conversationHistory.set(userId, []);
    }
    const history = conversationHistory.get(userId);

    const userLang = detectLanguage(message);

    let response = null;
    let isAI = false;

    if (genAI) {
      response = await getGeminiResponse(message, history, profile, userLang);
      if (response) isAI = true;
    }

    if (!response) {
      response = getSmartFallback(message, profile, userLang);
    }

    history.push({ role: 'user', content: message });
    history.push({ role: 'ai', content: response });

    if (history.length > 20) {
      conversationHistory.set(userId, history.slice(-20));
    }

    res.status(200).json({
      success: true,
      data: {
        response,
        language: userLang,
        isAI,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('AI Chat error:', error.message);
    try {
      const fallbackResponse = getSmartFallback(message || 'hello', null, 'en');
      res.status(200).json({
        success: true,
        data: { response: fallbackResponse, language: 'en', isAI: false, timestamp: new Date().toISOString() }
      });
    } catch {
      next(error);
    }
  }
};

export const clearHistory = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    conversationHistory.delete(userId);
    res.status(200).json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    next(error);
  }
};