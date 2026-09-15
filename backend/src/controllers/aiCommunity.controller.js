import { GoogleGenerativeAI } from '@google/generative-ai';
import StudentProfile from '../models/StudentProfile.js';

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
- You can also answer general questions, have casual conversations, write code, etc.

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
- If asked about non-career topics, answer helpfully and naturally
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
      if (profile.interests?.length) {
        const interests = Array.isArray(profile.interests) ? profile.interests.join(', ') : '';
        if (interests) parts.push(`Interests: ${interests}`);
      }
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

/* ═══════════════════════════════════════════════════════════════
   INTELLIGENT CONVERSATION ENGINE — Feels like real AI
   ═══════════════════════════════════════════════════════════════ */

const greetings = [
  (n) => `Hey${n ? ' ' + n : ''}! 👋 Kaise ho? Main hoon MeraRaasta AI — tera career bestie! 😎\n\nMujhse pooch sakte ho:\n🎯 Career ke baare mein\n📚 Padhai ke tips\n💼 Resume aur Interview\n🧠 Skills kaise badhayein\n\nYa bas aise hi baat karo, main hoon na! 😄`,
  (n) => `Hi${n ? ' ' + n : ''}! 🙏 Welcome back!\n\nMain tera AI career coach hoon. Bata kya jaanna hai?\n\n🎯 Career options\n📚 College & courses\n💼 Job preparation\n🧠 Skill development\n\nYa kuch bhi pooch — main help karunga! 💪`,
  (n) => `Hello${n ? ' ' + n : ''}! 😊\n\nKya haal hai? Main MeraRaasta AI hoon.\n\nCareer ho, padhai ho, ya kuch bhi — main yahan hoon teri help ke liye!\n\nBata kya poochna hai? 🤔`,
];

const nameResponses = [
  (n) => `Mera naam hai **MeraRaasta AI**! 🤖\n\nMain ek AI career counselor hoon — tera dost, guide, aur mentor sab ek saath!\n\n${n ? `Aur tu ${n} hai na? Mujhe pata hai! ` : ''}Bata, kya poochna hai? 😊`,
  (n) => `Main **MeraRaasta AI** hoon! 🎯\n\nLog mujhe "Career Coach" bhi kehte hain.\n\n${n ? `${n}, ` : ''}main tere career ke sawalon ka jawab deta hoon — aur haan, main Hindi, English, aur Hinglish sab samajhta hoon! 😄`,
  (n) => `Mera naam **MeraRaasta AI** hai! 🙏\n\nMain ek artificial intelligence hoon jo specially Indian students ke liye banaaya gaya hai.\n\n${n ? `Aur ${n} — tera naam toh mujhe already pata hai! ` : ''}Chal, kuch interesting pooch! 🚀`,
];

const selfIntro = [
  `Main **MeraRaasta AI** hoon! 🤖✨\n\nMain kya hoon:\n• Ek AI-powered career counselor\n• Indian students ke liye specially banaaya gaya\n• Hindi, English, Hinglish — sab mein baat karta hoon\n\nMain kya kar sakta hoon:\n🎯 Career guidance — konsa stream, konsa college\n📚 Study tips — JEE, NEET, Board exams\n💼 Resume & Interview — job lagane mein madad\n🧠 Skills — kya seekhein, kaise seekhein\n🗺️ Roadmap — step-by-step career plan\n\nAur haan, main free hoon! 😄 Kuch bhi pooch!`,
  `Hey! Main **MeraRaasta AI** hoon! 🎯\n\nMujhe banaya gaya hai Indian students ki career guidance ke liye.\n\nMere paas hai:\n✅ Career advice (IIT, NIT, Medical, Govt jobs)\n✅ Study tips aur exam strategies\n✅ Resume writing tips\n✅ Interview preparation\n✅ Skill development plans\n\nAur sabse achhi baat — main Hindi, English, ya Hinglish mein jawab deta hoon!\n\nChal, kuch pooch! 💪`,
];

const codeResponses = {
  java: `Yeh lo Java ka Hello World program! ☕\n\n\`\`\`java\npublic class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n\`\`\`\n\n**Kaise kaam karta hai:**\n1. \`public class HelloWorld\` — ek class banaaya\n2. \`public static void main(String[] args)\` — main method (program yahan se start hota hai)\n3. \`System.out.println("Hello, World!")\` — screen pe print karta hai\n\n**Kaise chalayein:**\n1. File save karo \`HelloWorld.java\` naam se\n2. Terminal mein: \`javac HelloWorld.java\` (compile)\n3. Phir: \`java HelloWorld\` (run)\n\nAur kuch seekhna hai Java mein? 🚀`,

  python: `Yeh lo Python ka Hello World! 🐍\n\n\`\`\`python\nprint("Hello, World!")\n\`\`\`\n\nBas! Ek line mein ho gaya! 😄\n\nPython itna easy hai na — isliye beginners ke liye best hai.\n\n**Kaise chalayein:**\n1. File save karo \`hello.py\` naam se\n2. Terminal mein: \`python hello.py\`\n\nPython seekho — Data Science, AI, Web Development sab mein kaam aata hai! 💪`,

  javascript: `Yeh lo JavaScript ka Hello World! 🌐\n\n\`\`\`javascript\nconsole.log("Hello, World!");\n\`\`\`\n\nBrowser console mein ya Node.js mein chala sakte ho.\n\n**Browser mein:**\n1. Right click → Inspect → Console\n2. Yeh code paste karo\n\n**Node.js mein:**\n1. File save karo \`hello.js\`\n2. Terminal: \`node hello.js\`\n\nJavaScript seekho — Web Development, React, Node.js sab mein use hota hai! 🚀`,

  c: `Yeh lo C language ka Hello World! 💾\n\n\`\`\`c\n#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}\n\`\`\`\n\n**Kaise kaam karta hai:**\n1. \`#include <stdio.h>\` — standard input/output library\n2. \`printf()\` — screen pe print karta hai\n3. \`return 0\` — program successfully结束\n\nC language foundation hai — isse seekh ke C++, Java, Python sab easy hoga! 💪`,
};

function detectTopic(msg) {
  const l = msg.toLowerCase().trim();

  // Name / Identity — check FIRST (specific)
  if (l.match(/\b(tera naam|tumhara naam|your name|naam kya|who are you|kaun ho|kya ho tum|tu kaun|name batao|apna naam)\b/)) return 'name';
  if (l.match(/\b(my name is|mera naam|main .* hoon|I am |I'm )\b/)) return 'myname';

  // Code requests — check BEFORE greeting (because "hello world" starts with "hello")
  if (l.match(/\b(code|program|likh|print|coding)\b/) && l.match(/\b(java|python|javascript|js|c\+\+|c language|php|ruby|swift|kotlin)\b/)) return 'code';
  if (l.match(/\b(hello world|hello.*world|first code|pehla code|basic code|start.*code)\b/)) return 'code_generic';
  if (l.match(/\b(code|program|likh kar de|bana ke de|write.*code|coding.*help|code.*help)\b/)) return 'code_generic';

  // Learning requests — "java seekni hai", "python seekhna hai", "coding kaise seekhe"
  if (l.match(/\b(java|python|javascript|js|c\+\+|c language|php|ruby|swift|kotlin|coding|programming|web development|data science|ai|machine learning)\b.*\b(seekh|seekni|seekna|seekhna|seekhe|seekhunga|sikhna|sikh|learn|kaise|kaise milega|kahan se|where|how)\b/)) return 'skill';
  if (l.match(/\b(seekh|seekni|seekna|seekhna|seekhe|seekhunga|sikhna|sikh|learn)\b.*\b(java|python|javascript|js|c\+\+|c language|coding|programming|web development|data science|ai|machine learning)\b/)) return 'skill';
  if (l.match(/\b(kya seekhu|kya seekhe|kaise seekhe|what to learn|konsa course|which course|course batao|course suggest)\b/)) return 'skill';

  // Greeting — only if message is SHORT and starts with greeting word (no other specific keywords)
  if (l.match(/^(hi|hello|hey|namaste|नमस्ते|namaskar|sup|yo|helloji|heyji)\b/) && l.length < 30) return 'greeting';
  if (l.match(/^(good morning|good evening|good night|good afternoon)\b/)) return 'greeting';

  // How are you
  if (l.match(/\b(kaise ho|kaisa hai|kya haal|how are you|how.*you|what.*up|kya chal raha)\b/)) return 'howareyou';

  // Career
  if (l.match(/\b(career|करियर|job|नौकरी|profession|क्षेत्र|field|become|बनना|after 12th|12th ke baad|after 10th|10th ke baad|what should i|kya karna|kya karun|best career|future|مستقبل)\b/)) return 'career';

  // Skills
  if (l.match(/\b(skill|कौशल|learn|सीख|course|कोर्स|coding|programming|python|javascript|tech|तकनीक|certification|seekhna|kaise seekhe|kya seekhu)\b/)) return 'skill';

  // Resume
  if (l.match(/\b(resume|cv|बायोडाटा|portfolio|biodata|resume.*banao|resume.*tips)\b/)) return 'resume';

  // Interview
  if (l.match(/\b(interview|इंटरव्यू|placement|नौकरी मिले|job interview|how to prepare|interview.*tips|interview.*prepare)\b/)) return 'interview';

  // Study
  if (l.match(/\b(study|पढ़|exam|परीक्षा|test|quiz|padhai|padhaai|पढ़ाई|jee|neet|upsc|board|cbse|icse|padhna|kaise padhe)\b/)) return 'study';

  // College
  if (l.match(/\b(college|कॉलेज|university|विश्वविद्यालय|iit|nit|aiims|bits|admission|admission.*kaise|college.*konsa)\b/)) return 'college';

  // Government jobs
  if (l.match(/\b(government job|govt job|sarkari naukri|सरकारी नौकरी|ssc|upsc|banking|ibps|rrb|railway)\b/)) return 'govtjob';

  // Salary
  if (l.match(/\b(salary|पैसा|income|कमाई|paisa|paise|kitna kamata|earn|earning|lpa|package)\b/)) return 'salary';

  // Motivation
  if (l.match(/\b(motivation|मोटिवेशन|inspire|प्रेरित|confused|परेशान|demotivated|thak|haar|surrender|give up|nahi ho raha|kuch nahi hota|loser)\b/)) return 'motivation';

  // Thanks
  if (l.match(/\b(thanks|thank you|shukriya|धन्यवाद|bahut achha|great|awesome|amazing|perfect|best|wah|zabardast)\b/)) return 'thanks';

  // Age / Personal
  if (l.match(/\b(age|umr|kitne saal|how old|birthday|janamdin)\b/)) return 'age';

  // Joke / Fun
  if (l.match(/\b(joke|mazak|hasaao|funny|comedy|humor|mazaak)\b/)) return 'joke';

  // Weather / Time
  if (l.match(/\b(weather|mausam|time|samay|kitne baje|date|din)\b/)) return 'datetime';

  // Diet / Health
  if (l.match(/\b(diet|health|fitness|exercise|workout|yoga|food|khana|pet)\b/)) return 'health';

  // Relationship / Love
  if (l.match(/\b(love|relationship|gf|bf|crush|pyaar|ishq|date|romantic)\b/)) return 'love';

  // Money / Scholarship
  if (l.match(/\b(scholarship|छात्रवृत्ति|fee|fees|paisa|loan|education loan|financial)\b/)) return 'scholarship';

  // Frustrated / Complaints
  if (l.match(/\b(ulta pulta|galat|wrong|kya bata raha|kya bol raha|nahi samajh|nonsense|bakwas|faltu|bekar)\b/)) return 'frustrated';

  return 'default';
}

function getSmartFallback(message, profile, lang) {
  const name = profile?.user?.name || '';
  const interests = Array.isArray(profile?.interests) ? profile.interests : [];
  const level = profile?.educationLevel || '';
  const topic = detectTopic(message);

  if (lang === 'hi') {
    return getHindiResponse(topic, name, interests, level, message);
  }
  return getEnglishResponse(topic, name, interests, level, message);
}

function getEnglishResponse(topic, name, interests, level, message) {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  switch (topic) {
    case 'greeting': return pick(greetings)(name);
    case 'name': return pick(nameResponses)(name);
    case 'myname': {
      const n = message.replace(/.*(?:my name is|i am|i'm)\s*/i, '').trim();
      return n
        ? `Hey ${n}! 🎉 Nice to meet you!\n\nI'm MeraRaasta AI — your personal career coach.\n\n${name ? `I already know you're ${name}! ` : ''}Tell me ${n}, what are you studying right now? I can suggest the best career path for you! 🚀`
        : pick(selfIntro);
    }
    case 'howareyou': return pick([
      `I'm doing great! 😄 Thanks for asking!\n\nMain hamesha ready hoon teri help ke liye.\n\nTu bata — kya chal raha hai life mein? Koi career confusion hai kya? 🤔`,
      `Awesome! 🎉 Main bilkul fit hoon — teri help ke liye hamesha ready!\n\nTu bata, kaise hai? Kuch poochna hai kya? 💪`,
      `Sab badhiya hai! 😊\n\nMain tera AI career coach hoon — hamesha online, hamesha ready!\n\nBata kya haal hai? Koi exam aa raha hai kya? 📚`,
    ]);
    case 'code': {
      const lang_match = message.match(/java|python|javascript|js|c\+\+|c language|php|ruby|swift|kotlin/i);
      const lang_name = lang_match ? lang_match[0].toLowerCase() : 'java';
      if (lang_name === 'javascript' || lang_name === 'js') return codeResponses.javascript;
      if (lang_name === 'python') return codeResponses.python;
      if (lang_name === 'c' || lang_name === 'c language' || lang_name === 'c++') return codeResponses.c;
      return codeResponses.java;
    }
    case 'code_generic': return pick([
      `Sure! Kaun si language mein code chahiye? 🤔\n\nMain ye sab likh sakta hoon:\n☕ **Java** — "Hello World" ya kuch bhi\n🐍 **Python** — Simple aur powerful\n🌐 **JavaScript** — Web development ke liye\n💾 **C/C++** — Foundation language\n\nBas bata kaun si language! 💻`,
      `Haan bilkul! 🚀\n\nMujhe bata:\n1. Kaun si language? (Java, Python, JavaScript, C)\n2. Kya karna hai? (Hello World, Calculator, Game, etc.)\n\nMain turant code likh ke dunga! 💪`,
    ]);
    case 'career': return pick([
      `Great question! 🎯\n\n${level ? `Since you're at ${level} level, ` : ''}here are the hottest careers in India (2025-26):\n\n🔥 **High Salary (₹8-30 LPA):**\n1. AI/ML Engineer\n2. Full Stack Developer\n3. Data Scientist\n4. Cloud Architect\n5. Cyber Security Expert\n\n💼 **Stable & Respectable:**\n1. Doctor (MBBS)\n2. IAS/IPS (UPSC)\n3. Bank PO (IBPS)\n4. Chartered Accountant\n\n${interests.length ? `Since you're interested in ${interests.join(', ')}, I'd suggest exploring that area first!` : 'Which field excites you the most?'}`,
      `Yeh dekho — 2025-26 mein sabse zyada demand: 🎯\n\n**Tech (₹6-30 LPA):**\n• AI/ML Engineer — Sabse zyada demand\n• Web Developer — Har company ko chahiye\n• Data Analyst — Growing fast\n\n**Non-Tech (₹4-15 LPA):**\n• Digital Marketing — Creative + Good salary\n• Product Management — Leadership role\n• UX Design — Design lovers ke liye\n\n**Government:**\n• UPSC — IAS/IPS\n• Banking — PO, Clerk\n• SSC — CGL, CHSL\n\nKonsa field interesting lagta hai? 🤔`,
    ]);
    case 'skill': {
      const msg = message.toLowerCase();
      if (msg.match(/java/)) return `Java seekhna hai? Best choice! ☕\n\n**Java Learning Roadmap:**\n\n**Step 1: Basics (2 weeks)**\n• Variables, Data Types, Operators\n• if-else, Loops (for, while)\n• Arrays, Strings\n\n**Step 2: OOP (2 weeks)**\n• Classes, Objects\n• Inheritance, Polymorphism\n• Abstraction, Encapsulation\n\n**Step 3: Advanced (1 month)**\n• Collections (ArrayList, HashMap)\n• Exception Handling\n• File I/O\n• JDBC (Database connectivity)\n\n**Free Resources:**\n📚 Apna College (YouTube) — Best Hindi Java course\n📚 W3Schools — Quick reference\n📚 LeetCode — Practice problems\n\n**Project Ideas:**\n1. Calculator App\n2. Student Management System\n3. Bank Account Simulation\n\nRoz 1-2 ghanta practice kar — 3 months mein Java master! 💪`;
      if (msg.match(/python/)) return `Python seekhna hai? Sabse easy aur powerful! 🐍\n\n**Python Learning Roadmap:**\n\n**Step 1: Basics (1 week)**\n• Variables, Strings, Lists\n• if-else, Loops\n• Functions\n\n**Step 2: Intermediate (2 weeks)**\n• Dictionary, Sets\n• File Handling\n• Error Handling\n• OOP (Classes, Objects)\n\n**Step 3: Projects (1 month)**\n• Web Scraping (BeautifulSoup)\n• Automation scripts\n• Data Analysis (Pandas)\n\n**Free Resources:**\n📚 Apna College (YouTube)\n📚 Kaggle Learn\n📚 Automate the Boring Stuff (book)\n\nPython = Data Science + AI + Web Dev + Automation! 🚀`;
      if (msg.match(/javascript|js/)) return `JavaScript seekhna hai? Web ka king! 🌐\n\n**JavaScript Roadmap:**\n\n**Step 1: Basics (2 weeks)**\n• Variables (let, const)\n• Functions, Arrays, Objects\n• DOM Manipulation\n\n**Step 2: Modern JS (2 weeks)**\n• ES6+ (Arrow functions, Destructuring)\n• Promises, Async/Await\n• Fetch API\n\n**Step 3: Framework (1 month)**\n• React.js — Frontend\n• Node.js — Backend\n• Express.js — Server\n\n**Free Resources:**\n📚 JavaScript.info — Best tutorial\n📚 FreeCodeCamp — Interactive\n📚 Traversy Media (YouTube)\n\nJavaScript = Frontend + Backend + Mobile Apps! 🚀`;
      return `Skills seekho — salary badhegi! 🧠\n\n**Top Skills 2025-26:**\n\n💻 **Tech (High Salary):**\n1. Python — AI/Data Science\n2. JavaScript/React — Web Dev\n3. SQL — Har data job\n4. Cloud (AWS) — ₹10-30 LPA\n\n🤝 **Soft Skills:**\n1. English Communication\n2. Problem Solving\n3. Presentation\n\n📝 **Action Plan:**\n1. Ek skill choose karo\n2. YouTube/NPTEL se seekho\n3. 1 ghanta daily practice\n4. Project banao\n\nKya specific skill seekhni hai? Java, Python, ya kuch aur? 🚀`;
    }
    case 'frustrated': return pick([
      `Arre, sorry! 😅 Kya galat bata raha tha?\n\nBata clearly — main ab sahi jawab deta hoon!\n\n🎯 Career, 📚 Padhai, 💼 Resume, 🧠 Skills, 📝 Code — kya chahiye?\n\nBas ek word mein bata — main fix karunga! 💪`,
      `Maafi chahta hoon! 🙏\n\nLagta hai main galat samajh gaya.\n\nTu bata clearly — kya poochna hai?\n• "Java ka code de"\n• "Resume kaise banaun"\n• "12th ke baad kya karun"\n\nBas ye likh de — main sahi answer dunga! 😊`,
    ]);
    default: return pick([
      `Interesting question! 🤔\n\nMain MeraRaasta AI hoon — career guidance ke liye banaaya gaya hoon.\n\n**Main kya kar sakta hoon:**\n🎯 Career planning — konsa stream, konsa college\n📚 Study tips — JEE, NEET, Board exams\n💼 Resume & Interview — job lagane mein madad\n🧠 Skills — kya seekhein, kaise seekhein\n🗺️ Roadmap — step-by-step career plan\n💰 Salary info — kitna kama sakte ho\n📝 Code — Java, Python, JavaScript\n\nBas mujhse pucho! Main help karunga! 😊`,
      `Hmm, interesting! 🤔\n\nMain zyada tar career guidance mein expert hoon, but kuch bhi pooch sakte ho!\n\n**Popular questions:**\n• "12th ke baad kya karun?"\n• "JEE/NEET ki taiyari kaise karun?"\n• "Resume kaise banaun?"\n• "Interview ki taiyari kaise karun?"\n• "Best skills kaun si hain?"\n\nBas pucho — main answer dunga! 💪`,
    ]);
  }
}

function getHindiResponse(topic, name, interests, level, message) {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  switch (topic) {
    case 'greeting': return pick([
      (n) => `Hey${n ? ' ' + n : ''}! 👋 Kaise ho?\n\nMain hoon MeraRaasta AI — tera career bestie! 😎\n\nMujhse pooch sakte ho:\n🎯 Career ke baare mein\n📚 Padhai ke tips\n💼 Resume aur Interview\n🧠 Skills kaise badhayein\n\nYa bas aise hi baat karo, main hoon na! 😄`,
    ])(name);
    case 'name': return pick([
      (n) => `Mera naam hai **MeraRaasta AI**! 🤖\n\nMain ek AI career counselor hoon — tera dost, guide, aur mentor sab ek saath!\n\n${n ? `Aur tu ${n} hai na? Mujhe pata hai! ` : ''}Bata, kya poochna hai? 😊`,
    ])(name);
    case 'myname': {
      const n = message.replace(/.*(?:mera naam|main)\s*/i, '').trim();
      return n
        ? `Hey ${n}! 🎉 Nice to meet you!\n\nMain MeraRaasta AI hoon — tera personal career coach!\n\n${name ? `Mujhe pata hai tu ${name} hai! ` : ''}Bata ${n}, abhi kya padh raha hai? Best career path suggest karunga! 🚀`
        : `Naam sun ke achha laga! 😊\n\nMain MeraRaasta AI hoon.\n\nTu bata — kya naam hai tera, aur kya padh raha hai? 🤔`;
    }
    case 'code': {
      const lang_match = message.match(/java|python|javascript|js|c\+\+|c language/i);
      const lang_name = lang_match ? lang_match[0].toLowerCase() : 'java';
      if (lang_name === 'python') return codeResponses.python;
      if (lang_name === 'javascript' || lang_name === 'js') return codeResponses.javascript;
      if (lang_name === 'c' || lang_name === 'c language' || lang_name === 'c++') return codeResponses.c;
      return codeResponses.java;
    }
    case 'code_generic': return pick([
      `Haan bilkul! 🚀\n\nMujhe bata:\n1. Kaun si language? (Java, Python, JavaScript, C)\n2. Kya karna hai? (Hello World, Calculator, etc.)\n\nMain turant code likh ke dunga! 💻`,
      `Sure! Kaun si language mein code chahiye? 🤔\n\n☕ Java | 🐍 Python | 🌐 JavaScript | 💾 C/C++\n\nBas bata! 💪`,
    ]);
    case 'career': return pick([
      `Bahut achha sawaal! 🎯\n\n${level ? `Tere ${level} level ke hisaab se ` : ''}2025-26 mein India mein sabse zyada demand:\n\n🔥 **High Salary (₹8-30 LPA):**\n1. AI/ML Engineer\n2. Full Stack Developer\n3. Data Scientist\n4. Cloud Architect\n5. Cyber Security Expert\n\n💼 **Stable Careers:**\n1. Doctor (MBBS)\n2. IAS/IPS (UPSC)\n3. Bank PO\n4. Chartered Accountant\n\n${interests.length ? `Tere interests (${interests.join(', ')}) ke hisaab se — ye field best rahega!` : 'Kaun sa field interesting lagta hai?'}`,
    ]);
    case 'skill': {
      const msg = message.toLowerCase();
      if (msg.match(/java/)) return `Java seekhna hai? Best choice! ☕\n\n**Java Learning Roadmap:**\n\n**Step 1: Basics (2 hafte)**\n• Variables, Data Types\n• if-else, Loops\n• Arrays, Strings\n\n**Step 2: OOP (2 hafte)**\n• Classes, Objects\n• Inheritance, Polymorphism\n\n**Step 3: Advanced (1 month)**\n• Collections\n• Exception Handling\n• JDBC\n\n**Free Resources:**\n📚 Apna College (YouTube) — Best Hindi Java course\n📚 W3Schools — Quick reference\n\nRoz 1-2 ghanta practice kar — 3 months mein Java master! 💪`;
      if (msg.match(/python/)) return `Python seekhna hai? Sabse easy! 🐍\n\n**Python Roadmap:**\n\n**Step 1: Basics (1 hafta)**\n• Variables, Lists, Dicts\n• if-else, Loops, Functions\n\n**Step 2: Intermediate (2 hafte)**\n• File Handling\n• OOP\n• Error Handling\n\n**Step 3: Projects (1 month)**\n• Web Scraping\n• Automation\n• Data Analysis (Pandas)\n\n📚 Apna College (YouTube) se seekho!\n\nPython = Data Science + AI + Web Dev! 🚀`;
      if (msg.match(/javascript|js/)) return `JavaScript seekhna hai? Web ka king! 🌐\n\n**JS Roadmap:**\n\n**Step 1: Basics (2 hafte)**\n• Variables, Functions\n• DOM Manipulation\n\n**Step 2: Modern JS (2 hafte)**\n• ES6+, Async/Await\n• Fetch API\n\n**Step 3: Framework (1 month)**\n• React.js — Frontend\n• Node.js — Backend\n\n📚 JavaScript.info, FreeCodeCamp se seekho!\n\nJS = Frontend + Backend + Mobile! 🚀`;
      return `Skills seekho — salary badhegi! 🧠\n\n**Top Skills 2025-26:**\n💻 Python — AI/Data Science\n🌐 JavaScript/React — Web Dev\n📊 SQL — Har data job\n☁️ Cloud (AWS) — ₹10-30 LPA\n\n**Plan:**\n1. Ek skill choose karo\n2. YouTube se seekho\n3. Daily 1 ghanta practice\n4. Project banao\n\nKya specific skill seekhni hai? 🚀`;
    }
    case 'frustrated': return pick([
      `Arre, sorry! 😅 Kya galat bata raha tha?\n\nBata clearly — main ab sahi jawab deta hoon!\n\n🎯 Career, 📚 Padhai, 💼 Resume, 🧠 Skills, 📝 Code — kya chahiye? 💪`,
      `Maafi chahta hoon! 🙏\n\nTu bata clearly — kya poochna hai?\n• "Java ka code de"\n• "Resume kaise banaun"\n• "12th ke baad kya karun"\n\nBas ye likh de — sahi answer dunga! 😊`,
    ]);
    case 'thanks': return pick([
      `You're welcome! 😊 Meri job hai teri help karna! 💪\n\nAur kuch poochna ho toh bata! 🚀`,
      `Arre koi baat nahi! 🤗 Tu succeed kare — yahi mera goal hai!\n\nAur help chahiye toh bata! 😄`,
    ]);
    default: return pick([
      `Hmm, interesting! 🤔\n\nMain career guidance mein expert hoon, but kuch bhi pooch sakte ho!\n\n**Popular questions:**\n• "12th ke baad kya karun?"\n• "JEE/NEET ki taiyari kaise karun?"\n• "Resume kaise banaun?"\n• "Best skills kaun si hain?"\n\nBas pucho! 💪`,
      `Bata clearly — career, padhai, ya kuch aur?\n\nJitna clear poochoge, utna achha answer milega! 😊`,
    ]);
  }
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
      console.log('Profile fetch skipped:', e.message);
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