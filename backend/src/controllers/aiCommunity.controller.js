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

  // Name / Identity
  if (l.match(/\b(tera naam|tumhara naam|your name|naam kya|who are you|kaun ho|kya ho tum|tu kaun|name batao|apna naam)\b/)) return 'name';
  if (l.match(/\b(my name is|mera naam|main .* hoon|I am |I'm )\b/)) return 'myname';

  // Greeting
  if (l.match(/^(hi|hello|hey|namaste|नमस्ते|namaskar|sup|kaise ho|kaisa hai|kya haal|good morning|good evening|good night|yo|helloji|heyji)/)) return 'greeting';

  // Code requests
  if (l.match(/\b(code|program|likh|print|hello world|coding)\b/) && l.match(/\b(java|python|javascript|js|c\+\+|c language|php|ruby|swift|kotlin)\b/)) return 'code';
  if (l.match(/\b(hello world|hello.*world|first code|pehla code|basic code|start.*code)\b/)) return 'code_generic';
  if (l.match(/\b(code|program|likh kar de|bana ke de|write.*code|coding.*help|code.*help)\b/)) return 'code_generic';

  // Career
  if (l.match(/\b(career|करियर|job|नौकरी|profession|क्षेत्र|field|become|बनना|after 12th|12th ke baad|after 10th|10th ke baad|what should i|kya karna|kya karun|best career|future|مستقبل)\b/)) return 'career';

  // Skills
  if (l.match(/\b(skill|कौशल|learn|सीख|course|कोर्स|coding|programming|python|javascript|tech|तकनीक|certification|seekhna|kaise seekhe)\b/)) return 'skill';

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

  // How are you
  if (l.match(/\b(kaise ho|kaisa hai|kya haal|how are you|how.*you|what.*up|kya chal raha)\b/)) return 'howareyou';

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
    case 'skill': return pick([
      `Top skills to learn in 2025-26: 🧠\n\n**💻 Tech Skills (High Salary):**\n1. Python — AI/Data Science ke liye #1\n2. JavaScript/React — Web Dev ke liye\n3. SQL — Har data job mein chahiye\n4. Cloud (AWS/Azure) — ₹10-30 LPA\n\n**🤝 Soft Skills (Interview cracking):**\n1. English Communication — Global opportunities\n2. Problem Solving — Har interview mein\n3. Presentation Skills — Management roles\n\n**📝 Action Plan:**\n1. Ek skill choose karo\n2. YouTube/NPTEL se free mein seekho\n3. 1 ghanta daily practice karo\n4. 1 project banao\n5. LinkedIn pe share karo\n\nKaunsa skill seekhna hai? 🚀`,
      `Dekho, skills = salary 💰\n\n**Beginner-friendly Skills:**\n1. **Excel** — 1 week mein seekho, har job mein chahiye\n2. **Canva** — Designing seekho free mein\n3. **Python** — Easy to learn, high paying\n\n**Intermediate Skills:**\n1. **React.js** — Web Development\n2. **Digital Marketing** — Creative + money\n3. **Data Analysis** — Excel + SQL + Python\n\n**Pro Tip:** Skill seekho → Project banao → Portfolio banao → Job lagao! 💪\n\nKya interest hai tujhe?`,
    ]);
    case 'resume': return pick([
      `Resume tips jo **actually** kaam karti hain: 📄\n\n**Formula:**\n1. **Header** — Name | Phone | Email | LinkedIn\n2. **Objective** — 2 lines: kya la sakta hoon\n3. **Education** — Degree, College, Year, CGPA\n4. **Skills** — Technical + Tools\n5. **Projects** — 2-3 with NUMBERS\n6. **Achievements** — Awards, Certifications\n\n**Magic Words:**\n✅ "Increased efficiency by 30%"\n✅ "Led a team of 5"\n✅ "Built a website using React"\n❌ "Hard working" (sab likhte hain)\n❌ "References available" (hata do)\n\n**Format:** 1 page for freshers | Clean layout | No photo unless asked\n\nBata tera background — main review karke tips deta hoon! 📝`,
      `Resume banane ka shortcut: 📄\n\n**Step 1:** LinkedIn pe profile banao\n**Step 2:** Wahi content resume mein daalo\n**Step 3:** Numbers use karo ("managed 10 people", "scored 95%")\n**Step 4:** 1 page rakho (freshers ke liye)\n**Step 5:** PDF mein save karo (Word mat bhejo)\n\n**Red Flags (Ye MAT karo):**\n❌ Photo (unless asked)\n❌ "Objective: To learn" (boring)\n❌ Spelling mistakes\n❌ Fancy fonts\n\nChal, main tera resume review karta hoon — bata kya likha hai tere resume mein! ✍️`,
    ]);
    case 'interview': return pick([
      `Interview cracking guide! 🎤\n\n**1 Week Before:**\n✅ Company ke baare mein research karo\n✅ "Tell me about yourself" prepare karo (2 min story)\n✅ Resume ke har point ka example ready rakho\n\n**Day Before:**\n✅ 2 set kapde ready rakho\n✅ Resume ki 3 copies print karo\n✅ Route plan karo (15 min pehle pahuncho)\n\n**During Interview:**\n✅ Smile karo, handshake karo\n✅ Eye contact rakho\n✅ STAR method use karo (Situation-Task-Action-Result)\n\n**Common Questions:**\n• "Why this company?" → Research dikhao\n• "Weakness?" → Honest raho, improvement dikhao\n• "Salary expectation?" → Market rate batao\n\n**Pro Tip:** Confident raho — nervous mat dikhna! 💪`,
      `Interview = Confidence + Preparation 🎯\n\n**Secret Formula:**\n1. **Research** — Company ka mission, products, competitors\n2. **Story** — "Tell me about yourself" = Your journey in 2 min\n3. **Examples** — Har skill ka ek example ready rakho\n4. **Questions** — Last mein 2-3 questions pucho (shows interest)\n\n**Body Language:**\n✅ Sit straight\n✅ Smile naturally\n✅ Nod when they speak\n❌ Don't fidget\n❌ Don't cross arms\n\n**After Interview:**\n✅ Thank you email bhejo (same day)\n✅ LinkedIn pe connect karo\n\nKitne interviews de liye ab tak? 🤔`,
    ]);
    case 'study': return pick([
      `Study smarter, not harder! 📖\n\n**The Pomodoro Technique:**\n1. 25 min padho (phone silent!)\n2. 5 min break\n3. Repeat 4 times\n4. 20 min long break\n\n**Memory Hacks:**\n🧠 Spaced Repetition — Revise after 1 day, 3 days, 7 days\n📝 Active Recall — Kitab band karke likho jo yaad hai\n🗺️ Mind Maps — Topics ko connect karo\n👨‍🏫 Teaching — Kisi ko padhao = best learning\n\n**Free Resources:**\n📚 NPTEL — IIT courses (FREE!)\n📚 Khan Academy — All subjects\n📚 Unacademy — Competitive exams\n📚 YouTube — Unlimited learning\n\nKya padh raha hai? Board exam ya competitive? 📚`,
      `Padhai ka smart plan: 📖\n\n**Daily Routine:**\n🌅 Subah 6-8 baje: Difficult subjects (brain fresh hota hai)\n🌞 Dopahar: Practice problems\n🌙 Raat: Light revision\n\n**Weekly Plan:**\n📅 Monday-Friday: New topics\n📅 Saturday: Revision + Mock test\n📅 Sunday: Rest + Light study\n\n**Exam Strategy:**\n1. Previous year papers — MUST DO!\n2. Mock tests weekly\n3. Weak areas pe zyada time do\n4. Exam hall mein — panic mat karo\n\nKis exam ki taiyari hai? JEE, NEET, Board, ya kuch aur? 🎯`,
    ]);
    case 'college': return pick([
      `College selection guide! 🎓\n\n**Top Engineering:**\n1. IITs — JEE Advanced se admission\n2. NITs — JEE Main se admission\n3. BITS Pilani — BITSAT\n4. VIT — VITEEE\n5. DTU/NSUT — JAC Delhi\n\n**Top Medical:**\n1. AIIMS — NEET\n2. JIPMER — NEET\n3. State Medical Colleges — NEET\n\n**Top Commerce:**\n1. SRCC (Delhi)\n2. St. Xavier's (Mumbai)\n3. Christ University (Bangalore)\n\n**Pro Tip:** College ranking dekho, but campus culture aur placements bhi dekho!\n\nTere level ke hisaab se kaun sa best rahega? 🤔`,
      `Konsa college choose karein? 🎓\n\n**Decision Factors:**\n1. **Ranking** — NIRF ranking check karo\n2. **Placements** — Average package dekho\n3. **Location** — Ghar se ddoor ya paas?\n4. **Fees** — Budget ke hisaab se\n5. **Campus Life** — Clubs, events, facilities\n\n**Engineering (Top 10):**\nIIT Bombay > IIT Delhi > IIT Madras > IIT Kanpur > NIT Trichy > BITS Pilani > IIT Roorkee > NIT Warangal > IIT Guwahati > IIT Hyderabad\n\nKaun sa exam de raha hai? JEE, NEET, ya CUET? 📝`,
    ]);
    case 'govtjob': return pick([
      `Sarkari Naukri guide! 🏛️\n\n**Top Govt Exams:**\n1. **UPSC** — IAS/IPS/IFS (Salary: ₹56,000+ starting)\n2. **SSC CGL** — Group B posts (₹44,000+ starting)\n3. **IBPS PO** — Bank Officer (₹36,000+ starting)\n4. **RRB NTPC** — Railway jobs\n5. **SSC CHSL** — 12th level posts\n\n**Preparation Tips:**\n📚 Static GK — Lucent GK padho\n📰 Current Affairs — Daily newspaper\n📝 Quant — Rakesh Yadav ya RS Aggarwal\n🧠 Reasoning — M.K. Pandey\n\n**Timeline:**\n• 12th ke baad: CHSL, NTPC\n• Graduation ke baad: CGL, PO, UPSC\n\nKonsa exam target kar raha hai? 🎯`,
      `Govt job = Security + Respect! 🏛️\n\n**Quick Guide:**\n\n**After 12th:**\n• SSC CHSL — Clerk/DEO\n• RRB Group D — Railway\n• Indian Army/Navy/Airforce\n\n**After Graduation:**\n• UPSC Civil Services — IAS/IPS\n• SSC CGL — Income Tax, Excise, CBI\n• IBPS PO — Bank Officer\n• SBI PO — Bank Officer\n\n**Salary Range:**\n💰 Bank PO: ₹36,000-60,000\n💰 SSC CGL: ₹44,000-80,000\n💰 IAS: ₹56,000-2,50,000\n\nPreparation kaise kar raha hai? Koi specific exam? 📚`,
    ]);
    case 'salary': return pick([
      `Salary guide for Indian students! 💰\n\n**Fresher Salaries (2025-26):**\n\n**Tech:**\n💻 Software Developer: ₹4-12 LPA\n🤖 AI/ML Engineer: ₹8-25 LPA\n📊 Data Scientist: ₹6-18 LPA\n☁️ Cloud Engineer: ₹6-20 LPA\n\n**Non-Tech:**\n📈 Marketing: ₹3-8 LPA\n💼 MBA: ₹8-20 LPA\n🏥 Doctor: ₹5-15 LPA (starting)\n\n**Govt Jobs:**\n🏛️ Bank PO: ₹36,000/month\n🏛️ SSC CGL: ₹44,000/month\n🏛️ IAS: ₹56,000/month\n\n**Pro Tip:** Skills badhao = Salary badhegi! 🚀\nKaunsa field mein jaana hai?`,
      `Paisa kamao — but smartly! 💰\n\n**Highest Paying (India):**\n1. 💻 AI/ML Engineer — ₹15-50 LPA\n2. ☁️ Cloud Architect — ₹20-40 LPA\n3. 📊 Data Scientist — ₹10-30 LPA\n4. 🔒 Cyber Security — ₹10-25 LPA\n5. 📱 Product Manager — ₹15-35 LPA\n\n**How to reach there:**\nStep 1: Skill seekho (6-12 months)\nStep 2: Projects banao\nStep 3: Portfolio banao\nStep 4: Apply karo\nStep 5: Negotiate karo!\n\n**Remember:** Starting salary mat dekho — 5 years baad kitna hoga wo dekho! 📈`,
    ]);
    case 'motivation': return pick([
      `Hey, sun! 🫂\n\nLife mein kabhi kabhi lagta hai ki kuch nahi ho raha — ye bilkul normal hai.\n\n**Yaad rakh:**\n🌟 Har successful insaan ne struggle kiya hai\n🌟 Failure = Learning, not the end\n🌟 Tera time aayega — bas consistent raho\n🌟 1% daily improvement = 37x better in 1 year\n\n**Aaj se 3 cheezein karo:**\n1. Ek chhota goal set karo (aaj ka)\n2. 1 ghanta kuch productive karo\n3. Kal ka plan banao\n\nTu kar sakta hai! 💪 Main hoon na teri help ke liye.\n\nBata kya ho raha hai? Kya problem hai? 🤔`,
      `Ruk! 🛑\n\nAgar tu demotivated hai, toh ye padh:\n\n**Facts:**\n• Steve Jobs ne college chhoda → Apple banaya\n• Shah Rukh Khan ke paas kuch nahi tha → King of Bollywood\n• APJ Abdul Kalam garib the → President banе\n\n**Tu kya hai?**\n• Young hai ✅\n• Internet hai ✅\n• AI tools hai ✅\n• MeraRaasta AI hai ✅\n\n**Aaj ek kaam kar:**\n1. Phone rakho\n2. 30 min padho ya kuch seekho\n3. Kal same time repeat karo\n\nChhota start karo — bada banega! 🚀\n\nBata kya struggle hai?`,
    ]);
    case 'thanks': return pick([
      `You're welcome! 😊\n\nYe meri job hai — teri help karna! 💪\n\nAur kuch poochna ho toh bata. Main hamesha yahan hoon! 🚀`,
      `Arre koi baat nahi! 🤗\n\nTu succeed kare — yahi mera goal hai!\n\nAur kuch help chahiye toh bata — career, study, resume, kuch bhi! 😄`,
      `Glad I could help! 🎉\n\nYaad rakh — main hamesha available hoon.\n\nKabhi bhi pooch — koi question ho, koi confusion ho! 💪`,
    ]);
    case 'age': return `Haha, main toh AI hoon — meri koi age nahi! 😄\n\nMain hamesha young aur fresh hoon — teri help ke liye hamesha ready! 🤖✨\n\nTu bata — kitne saal ka hai? Kya padh raha hai? 🤔`;
    case 'joke': return pick([
      `Okay, here's one! 😄\n\nStudent: "Sir, I have a question."\nTeacher: "Ask."\nStudent: "Can I go to washroom?"\nTeacher: "No."\nStudent: "Then I have TWO questions!" 😂\n\nHaha! Chal ab career ke baare mein kuch pooch — woh zyada important hai! 🎯`,
      `Here's a coder joke! 😂\n\nWhy do programmers prefer dark mode?\n\nBecause light attracts bugs! 🐛😄\n\nOkay okay, back to serious — kya poochna hai career ke baare mein? 🚀`,
      `Sun ye wala! 😂\n\nWhy did the student bring a ladder to school?\n\nBecause he wanted to reach "high" marks! 📚😄\n\nAb bata — padhai ka kya scene hai? 🤔`,
    ]);
    case 'datetime': return `Main AI hoon — mere liye time aur date ka koi matlab nahi! 😄\n\nMain hamesha online hoon, 24/7, 365 days! 🤖\n\nTu bata — kya poochna hai? Career, study, ya kuch bhi? 💪`;
    case 'health': return `Health = Wealth! 💪\n\n**Student Health Tips:**\n🏃 Exercise — 30 min daily walk\n🥗 Diet — Fruits, vegetables, dry fruits\n😴 Sleep — 7-8 hours zaroori\n💧 Water — 3-4 litre daily\n🧘 Meditation — 10 min daily (stress kam karta hai)\n\n**Study + Health:**\n• Har 1 ghanta baad uth ke ghoomo\n• Eye exercise — 20-20-20 rule (every 20 min, look 20 feet away for 20 sec)\n• Stand-up desk try karo\n\nPadhai ke saath health mat bhoolo! 🏃‍♂️`;
    case 'love': return `Haha, love! ❤️\n\nDekho, career aur love dono important hain — but **priority** set karo:\n\n**Rule:** Pehle career banao, pyaar apne aap aayega! 🎯\n\n**Reality check:**\n• Jab stable ho jaoge, sab easy hoga\n• 10th/12th mein focus padhai pe karo\n• College mein dekho — time milega\n\n**Famous quote:** "Love yourself first, everything else falls into line." 💕\n\nAb chalo, career ke baare mein kuch productive pooch! 🚀`;
    case 'scholarship': return pick([
      `Scholarships = Free Education! 🎓\n\n**Top Scholarships (India):**\n1. **INSPIRE** — ₹80,000/year (Top 1% in board)\n2. **NMMS** — ₹12,000/year (Class 9-12)\n3. **AICTE Scholarship** — ₹50,000/year (Engineering)\n4. **Post Matric SC/ST** — Full fees\n5. **中央 Sector Scholarship** — ₹10,000-20,000/year\n\n**How to Apply:**\n1. scholarship.gov.in pe jaao\n2. Apna category check karo\n3. Documents ready karo (Aadhaar, marksheets, bank passbook)\n4. Online apply karo\n\n**Pro Tip:** State scholarships bhi check karo — kam log apply karte hain!\n\nKaun si class mein hai? 🤔`,
      `Free mein padho! 🎓\n\n**Scholarship Finder:**\n1. **scholarship.gov.in** — Government scholarships\n2. **Buddy4Study** — Private scholarships\n3. **Vidyasaarathi** — Corporate scholarships\n\n**Popular Scholarships:**\n• 10th/12th Board toppers: ₹5,000-50,000\n• Engineering students: AICTE, Prime Minister Scholarship\n• Medical students: AIIMS, State scholarships\n• Girls: Beti Bachao, AICTE special schemes\n\n**Documents Needed:**\n✅ Aadhaar Card\n✅ 10th/12th Marksheet\n✅ Income Certificate\n✅ Bank Passbook\n\nKya tu scholarship ke liye eligible hai? Bata apni class/category! 📋`,
    ]);
    default: return pick([
      `Interesting question! 🤔\n\nMain MeraRaasta AI hoon — career guidance ke liye banaaya gaya hoon.\n\n**Main kya kar sakta hoon:**\n🎯 Career planning — konsa stream, konsa college\n📚 Study tips — JEE, NEET, Board exams\n💼 Resume & Interview — job lagane mein madad\n🧠 Skills — kya seekhein, kaise seekhein\n🗺️ Roadmap — step-by-step career plan\n💰 Salary info — kitna kama sakte ho\n📝 Code — Java, Python, JavaScript\n\nBas mujhse pucho! Main help karunga! 😊`,
      `Hmm, interesting! 🤔\n\nMain zyada tar career guidance mein expert hoon, but kuch bhi pooch sakte ho!\n\n**Popular questions:**\n• "12th ke baad kya karun?"\n• "JEE/NEET ki taiyari kaise karun?"\n• "Resume kaise banaun?"\n• "Interview ki taiyari kaise karun?"\n• "Best skills kaun si hain?"\n\nBas pucho — main answer dunga! 💪`,
      `Hey! 🙋\n\nMain samajh gaya — tu kuch poochna chahta hai.\n\nBata clearly — career ke baare mein hai, padhai ke baare mein, ya kuch aur?\n\nJitna clear poochoge, utna achha answer milega! 😊`,
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
    case 'skill': return pick([
      `2025-26 mein ye skills seekho: 🧠\n\n**💻 Tech (High Salary):**\n1. Python — AI/Data Science ke liye #1\n2. JavaScript/React — Web Dev\n3. SQL — Har data job\n4. Cloud (AWS) — ₹10-30 LPA\n\n**🤝 Soft Skills:**\n1. English Communication\n2. Problem Solving\n3. Presentation\n\n**📝 Plan:**\n1. Ek skill choose karo\n2. YouTube/NPTEL se seekho\n3. 1 ghanta daily practice\n4. Project banao\n5. LinkedIn pe dikhao\n\nKya seekhna hai? 🚀`,
    ]);
    case 'resume': return pick([
      `Resume tips jo kaam karti hain: 📄\n\n**Banane ka tarika:**\n1. **Header** — Naam | Phone | Email | LinkedIn\n2. **Objective** — 2 lines\n3. **Education** — Degree, College, CGPA\n4. **Skills** — Technical + Tools\n5. **Projects** — Numbers ke saath!\n\n**Magic Words:**\n✅ "30% efficiency badhayi"\n✅ "5 logo ki team lead ki"\n❌ "Mehnat karne wala" (sab likhte hain)\n\n**Format:** Freshers = 1 page\n\nBata tera background — review karke tips deta hoon! ✍️`,
    ]);
    case 'interview': return pick([
      `Interview cracking guide! 🎤\n\n**1 Hafta Pehle:**\n✅ Company ke baare mein research\n✅ "Tell me about yourself" ready karo\n✅ Resume ke har point ka example\n\n**Interview Mein:**\n✅ Smile karo, eye contact rakho\n✅ STAR method use karo\n✅ Confident raho!\n\n**Common Questions:**\n• "Why this company?" → Research dikhao\n• "Weakness?" → Honest raho\n• "Salary?" → Market rate batao\n\n**Pro Tip:** 15 min pehle pahuncho! 💪`,
    ]);
    case 'study': return pick([
      `Padhai ka smart plan: 📖\n\n**Pomodoro Technique:**\n1. 25 min padho (phone silent!)\n2. 5 min break\n3. 4 baad repeat\n\n**Yaad rakhne ke tarike:**\n🧠 Spaced Repetition — 1, 3, 7 din baad revise\n📝 Active Recall — Kitab band karke likho\n👨‍🏫 Teaching — Kisi ko padhao\n\n**Free Resources:**\n📚 NPTEL — IIT courses (FREE!)\n📚 Khan Academy\n📚 YouTube\n\nKya padh raha hai? Board ya competitive? 📚`,
    ]);
    case 'college': return pick([
      `College guide! 🎓\n\n**Top Engineering:**\n1. IITs — JEE Advanced\n2. NITs — JEE Main\n3. BITS Pilani — BITSAT\n\n**Top Medical:**\n1. AIIMS — NEET\n2. State Colleges — NEET\n\n**Pro Tip:** Ranking + Placements + Campus Life sab dekho!\n\nKonsa exam de raha hai? 🤔`,
    ]);
    case 'govtjob': return pick([
      `Sarkari Naukri guide! 🏛️\n\n**Top Exams:**\n1. UPSC — IAS/IPS (₹56,000+ starting)\n2. SSC CGL — Group B (₹44,000+)\n3. IBPS PO — Bank Officer (₹36,000+)\n4. RRB — Railway\n\n**After 12th:** CHSL, NTPC, Army\n**After Graduation:** CGL, PO, UPSC\n\nKonsa exam target hai? 🎯`,
    ]);
    case 'salary': return pick([
      `Salary guide! 💰\n\n**Fresher Salaries:**\n💻 Developer: ₹4-12 LPA\n🤖 AI Engineer: ₹8-25 LPA\n📊 Data Scientist: ₹6-18 LPA\n🏛️ Bank PO: ₹36,000/month\n🏛️ IAS: ₹56,000/month\n\nSkills badhao = Salary badhegi! 🚀`,
    ]);
    case 'motivation': return pick([
      `Sun! 🫂\n\nYe normal hai — har successful insaan ne struggle kiya hai.\n\n**Aaj se 3 cheezein:**\n1. Chhota goal set karo\n2. 1 ghanta productive karo\n3. Kal ka plan banao\n\nTu kar sakta hai! 💪 Bata kya problem hai?`,
      `Ruk! 🛑\n\nYe padh:\n• Steve Jobs — College chhoda → Apple banaya\n• SRK — Garib the → King of Bollywood\n• APJ Abdul Kalam — Garib the → President\n\nTu young hai, internet hai, tools hai — SAB hai!\n\nChhota start kar — bada banega! 🚀`,
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