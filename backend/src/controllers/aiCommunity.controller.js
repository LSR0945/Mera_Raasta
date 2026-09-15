import { GoogleGenerativeAI } from '@google/generative-ai';
import StudentProfile from '../models/StudentProfile.js';
import Career from '../models/Career.js';

const genAI = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'AIzaSyA-placeholder-replace-with-real-key'
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const conversationHistory = new Map();

const SYSTEM_PROMPT_EN = `You are "MeraRaasta AI" — a friendly, expert Indian career guidance AI counselor for students, parents, and mentors. You help with:

- Career guidance (Indian job market, streams after 10th/12th, college recommendations)
- Skill development (coding, soft skills, certifications)
- Education planning (courses, colleges, scholarships in India)
- Resume building and interview preparation
- Study tips and exam preparation
- Government schemes for students (scholarships, reservations)
- Parent guidance (how to support children's career choices)

Rules:
- Be warm, encouraging, and use simple language a Indian student can understand
- Mix Hindi and English naturally (Hinglish) when the user writes in Hinglish
- If user writes in pure Hindi (Devanagari script), respond in Hindi
- If user writes in English, respond in English
- Give specific, actionable advice — not generic
- Use emojis naturally but don't overdo
- Keep responses concise (3-5 paragraphs max) unless asked for detail
- Reference Indian context: IITs, NITs, AIIMS, state boards, CBSE, JEE, NEET, UPSC, etc.
- If asked about non-career topics, gently redirect to career/education guidance
- Never make up facts — say "I'm not sure about that, but..." if unsure
- Be motivational when students feel lost or confused about their future`;

const SYSTEM_PROMPT_HI = `तुम "MeraRaasta AI" हो — एक दोस्ताना और विशेषज्ञ भारतीय करियर मार्गदर्शन AI काउंसलर। तुम छात्रों, अभिभावकों और मेंटरों की मदद करते हो।

तुम्हारी विशेषताएं:
- करियर मार्गदर्शन (भारतीय नौकरी बाजार, 10th/12th के बाद स्ट्रीम, कॉलेज सुझाव)
- कौशल विकास (कोडिंग, सॉफ्ट स्किल्स, सर्टिफिकेशन)
- शिक्षा योजना (कोर्स, कॉलेज, छात्रवृत्ति)
- Resume बनाना और Interview की तैयारी
- पढ़ाई के टिप्स और परीक्षा की तैयारी
- सरकारी योजनाएं (छात्रवृत्ति, आरक्षण)

नियम:
- गर्मजोशी से बात करो, आसान भाषा में
- IIT, NIT, AIIMS, CBSE, JEE, NEET, UPSC जैसे भारतीय संदर्भों का उपयोग करो
- अगर यूजर हिंदी में लिखे तो हिंदी में जवाब दो
- अगर यूजर अंग्रेजी में लिखे तो अंग्रेजी में जवाब दो
- अगर Hinglish में लिखे तो Hinglish में जवाब दो
- Specific और actionable advice दो — generic मत बोलो
- Response छोटा रखो (3-5 पैराग्राफ) जब तक detail न मांगे
- Motivational रहो जब छात्र confused हो`;

function detectLanguage(text) {
  const hindiChars = text.match(/[\u0900-\u097F]/g);
  if (hindiChars && hindiChars.length > text.length * 0.15) return 'hi';
  const hinglish = text.match(/\b(kya|hai|hain|main|mein|aap|tum|yeh|yah|acha|thik|nahi|haan|ji|bhai|dost|yaar|pagal|samajh|batao|bolo|sun|dekh|kar|ho|gi|ga|ge|na|raha|rahi|rahe)\b/gi);
  if (hinglish && hinglish.length >= 2) return 'hinglish';
  return 'en';
}

async function getGeminiResponse(message, history, profile, lang) {
  if (!genAI) return null;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const systemPrompt = lang === 'hi' ? SYSTEM_PROMPT_HI : SYSTEM_PROMPT_EN;

    let contextInfo = '';
    if (profile) {
      contextInfo = `\n\nUser Profile: Name: ${profile.user?.name || 'Student'}, Education: ${profile.educationLevel || 'Not specified'}, Interests: ${profile.interests?.join(', ') || 'Not specified'}, Skills: ${profile.skills?.join(', ') || 'Not specified'}, Career Goals: ${profile.careerGoals?.join(', ') || 'Not specified'}`;
    }

    const chatHistory = (history || []).map(msg => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt + contextInfo }] },
        { role: 'model', parts: [{ text: 'Understood! I am MeraRaasta AI, ready to help with career guidance. I will respond in the same language the user uses.' }] },
        ...chatHistory.slice(-10)
      ],
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 1024,
      },
    });

    const result = await chat.sendMessage(message);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error.message);
    return null;
  }
}

function getSmartFallback(message, profile, lang) {
  const lower = message.toLowerCase();
  const name = profile?.user?.name || '';
  const interests = profile?.interests || [];
  const level = profile?.educationLevel || '';

  const smartResponses = {
    en: {
      greeting: `Hey${name ? ' ' + name : ''}! 👋 Welcome to MeraRaasta AI Career Coach.\n\nI'm here to help you with:\n🎯 Career guidance & planning\n📚 Education & courses\n💼 Resume & interview tips\n🧠 Skill development\n🗺️ Learning roadmap\n\nWhat would you like to know? Just ask me anything about your career future!`,
      career: `Great question about careers! 🎯\n\nBased on${level ? ' your ' + level + ' level' : ' your profile'}${interests.length ? ' and interests in ' + interests.join(', ') : ''}, here are the top career paths in India right now:\n\n**🔥 High Demand (2025-26):**\n1. AI/ML Engineer — ₹8-25 LPA\n2. Full Stack Developer — ₹6-18 LPA\n3. Data Scientist — ₹7-20 LPA\n4. Cloud Architect — ₹10-30 LPA\n5. Cyber Security Expert — ₹8-22 LPA\n\n**💼 Traditional but Stable:**\n1. Doctor (MBBS) — Government + Private\n2. Government Jobs (SSC, UPSC, Banking)\n3. Engineer (IIT/NIT preferred)\n4. Chartered Accountant\n\nWhich field interests you? I can give you a detailed roadmap!`,
      skill: `Let's talk about skills! 🧠\n\n**Most In-Demand Skills in 2025-26:**\n\n**💻 Tech Skills:**\n• Python / JavaScript — Start with these\n• React / Node.js — Web development\n• SQL — Database management\n• Cloud (AWS/Azure) — High paying\n\n**🤝 Soft Skills:**\n• Communication — #1 most requested\n• Problem solving — Critical for interviews\n• Team leadership — For management roles\n• English proficiency — Opens global doors\n\n**📝 Quick Action Plan:**\n1. Pick ONE tech skill to learn first\n2. Spend 1 hour daily on practice\n3. Build 2-3 projects for portfolio\n4. Get certified (Google, Microsoft free certs)\n\nWant me to suggest specific courses based on your interests?`,
      resume: `Resume tips that actually work! 📄\n\n**The Formula:**\n1. **Header** — Name, Phone, Email, LinkedIn\n2. **Summary** — 2 lines about what you bring\n3. **Education** — Degree, College, Year, CGPA\n4. **Skills** — Technical + Tools\n5. **Projects** — 2-3 with results (use numbers!)\n6. **Experience** — Internships, Part-time\n\n**Pro Tips:**\n✅ Use action verbs: "Built", "Led", "Improved"\n✅ Quantify: "Increased efficiency by 30%"\n✅ 1 page for freshers, 2 pages max for experienced\n❌ Don't use "References available on request"\n❌ Don't include photo unless asked\n\nWant me to review your resume? Tell me your background!`,
      interview: `Interview preparation guide! 🎤\n\n**Before Interview:**\n1. Research the company (website, recent news)\n2. Prepare "Tell me about yourself" (2 min story)\n3. Know your resume inside out\n4. Have 3 questions ready to ask them\n\n**Common Questions:**\n• "Why this company?" — Show you researched\n• "Strengths/Weaknesses" — Be honest but strategic\n• "Where do you see yourself in 5 years?" — Show ambition\n• "Salary expectation?" — Research market rate\n\n**STAR Method for Behavioral Questions:**\n• S — Situation (set the scene)\n• T — Task (what was needed)\n• A — Action (what YOU did)\n• R — Result (outcome + learning)\n\n**Day Before:**\n✅ Sleep well, dress professionally\n✅ Arrive 15 min early\n✅ Carry extra copies of resume\n✅ Smile and be confident!\n\nYou've got this! 💪`,
      study: `Study tips that actually work! 📖\n\n**The 90-Minute Block Method:**\n1. Study 25 min → Break 5 min (Pomodoro)\n2. After 4 blocks → Long break 20 min\n3. Do 3-4 blocks per day = 3 hours focused study\n\n**Memory Techniques:**\n• Spaced repetition — Revise after 1 day, 3 days, 7 days\n• Active recall — Close book, write what you remember\n• Mind maps — Visual connections between topics\n• Teaching someone — Best way to learn\n\n**Free Resources:**\n📚 NPTEL — IIT courses (free)\n📚 Khan Academy — All subjects\n📚 Unacademy — Competitive exams\n📚 YouTube — Unlimited learning\n\n**Exam Strategy:**\n1. Previous year papers — Must do!\n2. Mock tests weekly\n3. Focus on weak areas\n4. Don't panic in exam hall\n\nWhat subject or exam are you preparing for?`,
      default: `Interesting question! 🤔\n\nI'm your AI Career Coach and I can help you with:\n\n🎯 **Career Guidance** — Which stream, which college, which job\n📚 **Education** — Courses, certifications, scholarships\n💼 **Job Preparation** — Resume, interview, aptitude\n🧠 **Skills** — What to learn, how to learn\n🗺️ **Planning** — Step-by-step career roadmap\n💰 **Finance** — Education loans, scholarships\n\nJust ask me anything! For example:\n• "What should I do after 12th PCM?"\n• "How to prepare for JEE?"\n• "Best courses for data science?"\n• "How to write a resume for freshers?"\n\nI'm here to help! 😊`,
    },
    hi: {
      greeting: `नमस्ते${name ? ' ' + name : ''}! 👋 MeraRaasta AI Career Coach में आपका स्वागत है।\n\nमैं आपकी इन चीजों में मदद कर सकता हूँ:\n🎯 करियर मार्गदर्शन और योजना\n📚 शिक्षा और कोर्स\n💼 Resume और Interview के tips\n🧠 कौशल विकास\n🗺️ सीखने का रोडमैप\n\nआप क्या जानना चाहेंगे? अपने करियर के बारे में कुछ भी पूछें!`,
      career: `करियर के बारे में बहुत अच्छा सवाल! 🎯\n\n${level ? 'आपके ' + level + ' स्तर' : 'आपकी प्रोफ़ाइल'}${interests.length ? ' और ' + interests.join(', ') + ' में रुचि' : ''} के आधार पर, भारत में इन क्षेत्रों में सबसे ज़्यादा अवसर हैं:\n\n**🔥 उच्च मांग (2025-26):**\n1. AI/ML Engineer — ₹8-25 LPA\n2. Full Stack Developer — ₹6-18 LPA\n3. Data Scientist — ₹7-20 LPA\n4. Cloud Architect — ₹10-30 LPA\n5. Cyber Security Expert — ₹8-22 LPA\n\n**💼 पारंपरिक लेकिन स्थिर:**\n1. डॉक्टर (MBBS) — सरकारी + प्राइवेट\n2. सरकारी नौकरी (SSC, UPSC, Banking)\n3. इंजीनियर (IIT/NIT पसंदीदा)\n4. Chartered Accountant\n\nकिस क्षेत्र में रुचि है? मैं विस्तृत रोडमैप दे सकता हूँ!`,
      skill: `कौशल विकास की बात करते हैं! 🧠\n\n**2025-26 में सबसे ज़्यादा मांग वाले कौशल:**\n\n**💻 तकनीकी कौशल:**\n• Python / JavaScript — इनसे शुरू करें\n• React / Node.js — वेब डेवलपमेंट\n• SQL — डेटाबेस मैनेजमेंट\n• Cloud (AWS/Azure) — ज़्यादा पैसे\n\n**🤝 सॉफ्ट स्किल्स:**\n• Communication — सबसे ज़रूरी\n• Problem solving — Interview के लिए\n• Team leadership — मैनेजमेंट के लिए\n• English — ग्लोबल दरवाजे खोलती है\n\n**📝 क्विक एक्शन प्लान:**\n1. पहले एक tech skill चुनें\n2. रोज़ 1 घंटा practice करें\n3. 2-3 projects बनाएं\n4. Google/Microsoft से free certification लें\n\nक्या आपको specific courses suggest करने हैं?`,
      resume: `Resume tips जो सच में काम करती हैं! 📄\n\n**फॉर्मूला:**\n1. **Header** — नाम, फ़ोन, Email, LinkedIn\n2. **Summary** — 2 लाइन क्या दे सकते हो\n3. **Education** — Degree, College, Year, CGPA\n4. **Skills** — Technical + Tools\n5. **Projects** — 2-3 results के साथ (numbers डालें!)\n6. **Experience** — Internship, Part-time\n\n**Pro Tips:**\n✅ Action verbs use करें: "Built", "Led", "Improved"\n✅ Numbers डालें: "30% efficiency बढ़ाई"\n✅ Freshers के लिए 1 page\n❌ "References available on request" मत लिखें\n\nक्या आप resume review करवाना चाहेंगे?`,
      interview: `Interview की तैयारी गाइड! 🎤\n\n**Interview से पहले:**\n1. Company के बारे में जानें\n2. "Tell me about yourself" तैयार करें (2 min)\n3. Resume अच्छे से जानें\n4. 3 सवाल तैयार रखें\n\n**Common Questions:**\n• "Why this company?" — Research दिखाएं\n• "Strengths/Weaknesses" — सच्चे रहें\n• "5 years में कहाँ देखते हैं?" — Ambition दिखाएं\n\n**STAR Method:**\n• S — Situation\n• T — Task\n• A — Action (आपने क्या किया)\n• R — Result\n\n**एक दिन पहले:**\n✅ अच्छी नींद लें, professional कपड़े पहनें\n✅ 15 min पहले पहुंचें\n✅ Resume की extra copies ले जाएं\n✅ Smile करें और confident रहें!\n\nआप कर सकते हैं! 💪`,
      study: `पढ़ाई के tips जो सच में काम करते हैं! 📖\n\n**90-Minute Block Method:**\n1. 25 min पढ़ो → 5 min break (Pomodoro)\n2. 4 blocks के बाद → 20 min लंबा break\n3. रोज़ 3-4 blocks = 3 घंटे focused study\n\n**याद रखने के techniques:**\n• Spaced repetition — 1 दिन, 3 दिन, 7 दिन बाद revise\n• Active recall — किताब बंद करके लिखो\n• Mind maps — Visual connections बनाओ\n• किसी को पढ़ाओ — सबसे अच्छा तरीका\n\n**Free Resources:**\n📚 NPTEL — IIT courses (free)\n📚 Khan Academy — सभी विषय\n📚 Unacademy — Competitive exams\n📚 YouTube — असीमित सीखना\n\nकिस विषय या exam की तैयारी कर रहे हैं?`,
      default: `बहुत अच्छा सवाल! 🤔\n\nमैं आपका AI Career Coach हूँ और मैं इन चीजों में मदद कर सकता हूँ:\n\n🎯 **करियर मार्गदर्शन** — कौन सी stream, कौन सा college, कौन सी job\n📚 **शिक्षा** — कोर्स, certification, छात्रवृत्ति\n💼 **नौकरी की तैयारी** — Resume, interview, aptitude\n🧠 **कौशल** — क्या सीखें, कैसे सीखें\n🗺️ **योजना** — Step-by-step करियर रोडमैप\n💰 **Finance** — Education loan, छात्रवृत्ति\n\nकुछ भी पूछें! जैसे:\n• "12th PCM के बाद क्या करूँ?"\n• "JEE की तैयारी कैसे करूँ?"\n• "Data science के लिए best courses?"\n• "Freshers के लिए resume कैसे बनाएं?"\n\nमैं यहाँ हूँ! 😊`,
    }
  };

  function detectTopic(msg) {
    const l = msg.toLowerCase();
    if (l.match(/\b(hi|hello|hey|namaste|नमस्ते|sup|how are you|kaisa hai|kaise ho|क्या हाल)\b/)) return 'greeting';
    if (l.match(/\b(career|करियर|job|नौकरी|profession|क्षेत्र|field|become|बनना|after 12th|12th ke baad|after 10th|10th ke baad|what should i|kya karna|kya karun)\b/)) return 'career';
    if (l.match(/\b(skill|कौशल|learn|सीख|course|कोर्स|coding|programming|python|javascript|tech|तकनीक)\b/)) return 'skill';
    if (l.match(/\b(resume|cv|बायोडाटा|portfolio|biodata)\b/)) return 'resume';
    if (l.match(/\b(interview|इंटरव्यू|placement|नौकरी मिले|job interview|how to prepare)\b/)) return 'interview';
    if (l.match(/\b(study|पढ़|exam|परीक्षा|test|quiz|padhai|padhaai|पढ़ाई|jee|neet|upsc|board|cbse|icse)\b/)) return 'study';
    return 'default';
  }

  const topic = detectTopic(message);
  const responses = lang === 'hi' ? smartResponses.hi : smartResponses.en;
  return responses[topic] || responses.default;
}

export const chat = async (req, res, next) => {
  try {
    const { message, type } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const userId = req.user._id.toString();
    const profile = await StudentProfile.findOne({ user: req.user._id }).populate('user', 'name email');
    const careers = await Career.find().limit(10).select('title category salary');

    if (!conversationHistory.has(userId)) {
      conversationHistory.set(userId, []);
    }
    const history = conversationHistory.get(userId);

    const userLang = detectLanguage(message);

    let response = await getGeminiResponse(message, history, profile, userLang);

    if (!response) {
      response = getSmartFallback(message, profile, userLang);
    }

    history.push({ role: 'user', content: message, lang: userLang });
    history.push({ role: 'ai', content: response, lang: userLang });

    if (history.length > 20) {
      conversationHistory.set(userId, history.slice(-20));
    }

    res.status(200).json({
      success: true,
      data: {
        response,
        language: userLang,
        isAI: !!genAI,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) { next(error); }
};

export const clearHistory = async (req, res, next) => {
  try {
    const userId = req.user._id.toString();
    conversationHistory.delete(userId);
    res.status(200).json({ success: true, message: 'Chat history cleared' });
  } catch (error) { next(error); }
};