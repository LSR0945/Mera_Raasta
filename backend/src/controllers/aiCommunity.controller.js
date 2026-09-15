import { GoogleGenerativeAI } from '@google/generative-ai';
import StudentProfile from '../models/StudentProfile.js';

const GEMINI_KEY = process.env.GEMINI_API_KEY;
const genAI = GEMINI_KEY && GEMINI_KEY.length > 10
  ? new GoogleGenerativeAI(GEMINI_KEY)
  : null;

if (genAI) {
  console.log('✅ Gemini AI initialized');
  console.log(`   Key prefix: ${GEMINI_KEY.substring(0, 8)}...`);
  console.log(`   Key length: ${GEMINI_KEY.length}`);
} else {
  console.log('⚠️  Gemini AI disabled');
  console.log(`   Key present: ${!!GEMINI_KEY}`);
  console.log(`   Key length: ${GEMINI_KEY?.length || 0}`);
}

const conversationHistory = new Map();

const SYSTEM_PROMPT = `You are "MeraRaasta AI" — an intelligent, friendly AI assistant made for Indian students.

You are like Google Gemini — you can answer ANY question on ANY topic:

🎓 Career & Education:
- Career guidance, college recommendations, streams after 10th/12th
- Study tips, exam preparation (JEE, NEET, UPSC, Board exams)
- Resume building, interview preparation
- Scholarships, government schemes

💻 Technology & Coding:
- Write code in any language (Java, Python, JavaScript, C, C++, etc.)
- Explain programming concepts
- Help with web development, data science, AI/ML
- Debug code, explain errors

📚 General Knowledge:
- Science, History, Geography, Politics
- Current events, general awareness
- Math problems, formulas
- Any academic subject

🗣️ Language:
- If user writes in Hindi (Devanagari), respond in Hindi
- If user writes in English, respond in English
- If user writes in Hinglish, respond in Hinglish
- You can translate between languages

🎮 Fun & Casual:
- Jokes, riddles, fun facts
- Motivational quotes
- General conversation
- Personal advice (study-life balance, stress management)

Rules:
- Be friendly, helpful, and use simple language
- Give accurate, specific answers — not vague
- Use emojis naturally
- If you don't know something, say so honestly
- For code: always provide working code with explanation
- For career questions: give India-specific advice with salary data
- Be conversational — like talking to a smart friend`;

function detectLanguage(text) {
  if (!text || !text.trim()) return 'en';
  const hindiChars = text.match(/[\u0900-\u097F]/g);
  if (hindiChars && hindiChars.length >= 2) return 'hi';
  return 'en';
}

async function getGeminiResponse(message, history, profile) {
  if (!genAI) {
    console.log('Gemini not initialized');
    return null;
  }

  try {
    // Try multiple model names
    const modelNames = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
    let model = null;
    let lastError = null;

    for (const modelName of modelNames) {
      try {
        model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_PROMPT,
        });
        // Test with a simple call
        const testResult = await model.generateContent('hi');
        const testText = testResult.response.text();
        if (testText) {
          console.log(`✅ Using model: ${modelName}`);
          break;
        }
      } catch (e) {
        lastError = e;
        console.log(`Model ${modelName} failed: ${e.message?.substring(0, 100)}`);
        model = null;
      }
    }

    if (!model) {
      console.error('All Gemini models failed:', lastError?.message?.substring(0, 200));
      return null;
    }

    let contextInfo = '';
    if (profile) {
      const parts = [];
      if (profile.user?.name) parts.push(`Name: ${profile.user.name}`);
      if (profile.educationLevel) parts.push(`Education: ${profile.educationLevel}`);
      if (profile.interests?.length) {
        const interests = Array.isArray(profile.interests) ? profile.interests.join(', ') : '';
        if (interests) parts.push(`Interests: ${interests}`);
      }
      if (parts.length) contextInfo = `\n\nUser info: ${parts.join(' | ')}`;
    }

    const chatHistory = (history || []).slice(-10).map(msg => ({
      role: msg.role === 'ai' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: `Hello! I need your help.${contextInfo}` }] },
        { role: 'model', parts: [{ text: `Namaste${profile?.user?.name ? ' ' + profile.user.name : ''}! 🙏 I am MeraRaasta AI — your personal AI assistant. I can help you with anything — career guidance, coding, studies, general knowledge, or just casual conversation. Ask me anything!` }] },
        ...chatHistory
      ],
      generationConfig: {
        temperature: 0.85,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 2048,
      },
    });

    const result = await chat.sendMessage(message);
    const response = result.response;
    const text = response.text();
    if (text && text.trim().length > 0) return text;
    return null;
  } catch (error) {
    console.error('Gemini FULL error:', JSON.stringify(error, null, 2)?.substring(0, 500));
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════
   SMART FALLBACK — When Gemini API is not available
   ═══════════════════════════════════════════════════════════════ */

function detectTopic(msg) {
  const l = msg.toLowerCase().trim();

  // Code requests — FIRST priority
  if (l.match(/\b(code|program|likh|print|coding|developer|debug|error|compile|run)\b/) && l.match(/\b(java|python|javascript|js|c\+\+|c language|php|ruby|swift|kotlin|html|css|sql|react|node|angular|vue|dart|flutter|rust|go|golang|swift)\b/)) return 'code';
  if (l.match(/\b(hello world|first code|pehla code|basic code|start.*code|sample code|example code|demo code)\b/)) return 'code_generic';
  if (l.match(/\b(code|program|likh kar de|bana ke de|write.*code|coding.*help|code.*help|code.*banao|program.*banao)\b/)) return 'code_generic';

  // Learning requests — "java seekni hai", "python seekhna hai"
  if (l.match(/\b(java|python|javascript|js|c\+\+|c language|coding|programming|web development|data science|ai|machine learning|react|node|angular)\b.*\b(seekh|seekni|seekna|seekhna|seekhe|seekhunga|sikhna|sikh|learn|kaise|kahan se|where|how)\b/)) return 'skill';
  if (l.match(/\b(seekh|seekni|seekna|seekhna|seekhe|seekhunga|sikhna|sikh|learn)\b.*\b(java|python|javascript|js|c\+\+|c language|coding|programming|web development|data science|ai|machine learning)\b/)) return 'skill';
  if (l.match(/\b(kya seekhu|kya seekhe|kaise seekhe|what to learn|konsa course|which course|course batao|course suggest)\b/)) return 'skill';

  // Name / Identity
  if (l.match(/\b(tera naam|tumhara naam|your name|naam kya|who are you|kaun ho|kya ho tum|tu kaun|name batao|apna naam)\b/)) return 'name';
  if (l.match(/\b(my name is|mera naam)\b/)) return 'myname';

  // Greeting — only SHORT messages
  if (l.match(/^(hi|hello|hey|namaste|नमस्ते|namaskar|sup|yo|helloji|heyji)\b/) && l.length < 30) return 'greeting';
  if (l.match(/^(good morning|good evening|good night|good afternoon)\b/)) return 'greeting';

  // How are you
  if (l.match(/\b(kaise ho|kaisa hai|kya haal|how are you|how.*you|what.*up|kya chal raha)\b/)) return 'howareyou';

  // Career
  if (l.match(/\b(career|करियर|job|नौकरी|profession|क्षेत्र|field|become|बनना|after 12th|12th ke baad|after 10th|10th ke baad|what should i|kya karna|kya karun|best career|future)\b/)) return 'career';

  // Skills
  if (l.match(/\b(skill|कौशल|learn|सीख|course|कोर्स|tech|तकनीक|certification)\b/)) return 'skill';

  // Resume
  if (l.match(/\b(resume|cv|बायोडाटा|portfolio|biodata)\b/)) return 'resume';

  // Interview
  if (l.match(/\b(interview|इंटरव्यू|placement|job interview)\b/)) return 'interview';

  // Study / Exam
  if (l.match(/\b(study|पढ़|exam|परीक्षा|padhai|padhaai|पढ़ाई|jee|neet|upsc|board|cbse|icse|padhna|kaise padhe|maths|math|science|physics|chemistry|biology|history|geography|english|hindi)\b/)) return 'study';

  // College
  if (l.match(/\b(college|कॉलेज|university|iit|nit|aiims|bits|admission)\b/)) return 'college';

  // Government jobs
  if (l.match(/\b(government job|govt job|sarkari naukri|ssc|upsc|banking|ibps|rrb|railway)\b/)) return 'govtjob';

  // Salary
  if (l.match(/\b(salary|पैसा|income|कमाई|paisa|paise|kitna kamata|earn|lpa|package)\b/)) return 'salary';

  // Motivation
  if (l.match(/\b(motivation|confused|demotivated|thak|haar|give up|nahi ho raha|loser|stress|tension|pareshan)\b/)) return 'motivation';

  // Thanks
  if (l.match(/\b(thanks|thank you|shukriya|धन्यवाद|bahut achha|great|awesome|amazing|perfect|best|wah|zabardast)\b/)) return 'thanks';

  // Age
  if (l.match(/\b(age|umr|kitne saal|how old|birthday)\b/)) return 'age';

  // Joke
  if (l.match(/\b(joke|mazak|hasaao|funny|comedy|humor|mazaak)\b/)) return 'joke';

  // Time
  if (l.match(/\b(time|samay|kitne baje|date|din|aaj|kal|aaj ka)\b/)) return 'datetime';

  // Health
  if (l.match(/\b(diet|health|fitness|exercise|workout|yoga|food|khana)\b/)) return 'health';

  // Love
  if (l.match(/\b(love|relationship|gf|bf|crush|pyaar|ishq|romantic)\b/)) return 'love';

  // Scholarship
  if (l.match(/\b(scholarship|छात्रवृत्ति|fee|fees|loan|education loan)\b/)) return 'scholarship';

  // Math
  if (l.match(/\b(math|maths|calculate|calculate.*karo|formula|equation|solve|jod|guna|bhag|plus|minus|multiply|divide|square|cube|root|triangle|circle|area|perimeter)\b/)) return 'math';

  // Science
  if (l.match(/\b(science|physics|chemistry|biology|gravity|force|energy|atom|molecule|cell|dna|planet|solar|universe)\b/)) return 'science';

  // Frustrated
  if (l.match(/\b(ulta pulta|galat|wrong|kya bata raha|nahi samajh|nonsense|bakwas|faltu|bekar)\b/)) return 'frustrated';

  return 'default';
}

function getSmartFallback(message, profile, lang) {
  const name = profile?.user?.name || '';
  const interests = Array.isArray(profile?.interests) ? profile.interests : [];
  const level = profile?.educationLevel || '';
  const topic = detectTopic(message);

  if (lang === 'hi') return getHindiResponse(topic, name, interests, level, message);
  return getEnglishResponse(topic, name, interests, level, message);
}

function getEnglishResponse(topic, name, interests, level, message) {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  switch (topic) {
    case 'code': {
      const msg = message.toLowerCase();
      if (msg.match(/java/)) return `Here's Java Hello World! ☕\n\n\`\`\`java\npublic class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n\`\`\`\n\n**How it works:**\n1. \`public class HelloWorld\` — creates a class\n2. \`public static void main(String[] args)\` — entry point\n3. \`System.out.println()\` — prints to screen\n\n**To run:**\n1. Save as \`HelloWorld.java\`\n2. Compile: \`javac HelloWorld.java\`\n3. Run: \`java HelloWorld\`\n\nNeed more code? Just ask! 🚀`;
      if (msg.match(/python/)) return `Python Hello World! 🐍\n\n\`\`\`python\nprint("Hello, World!")\n\`\`\`\n\nThat's it — one line! Python is the easiest language.\n\n**To run:**\n1. Save as \`hello.py\`\n2. Run: \`python hello.py\`\n\nNeed more? Ask me for any Python code! 💪`;
      if (msg.match(/javascript|js/)) return `JavaScript Hello World! 🌐\n\n\`\`\`javascript\nconsole.log("Hello, World!");\n\`\`\`\n\n**In Browser:**\n1. Right click → Inspect → Console\n2. Paste this code\n\n**With Node.js:**\n1. Save as \`hello.js\`\n2. Run: \`node hello.js\`\n\nNeed more? Just ask! 🚀`;
      if (msg.match(/c\+\+|cpp/)) return `C++ Hello World! 💾\n\n\`\`\`cpp\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}\n\`\`\`\n\n**To run:**\n1. Save as \`hello.cpp\`\n2. Compile: \`g++ hello.cpp -o hello\`\n3. Run: \`./hello\``;
      if (msg.match(/html/)) return `HTML Hello World! 🌐\n\n\`\`\`html\n<!DOCTYPE html>\n<html>\n<head>\n    <title>My Page</title>\n</head>\n<body>\n    <h1>Hello, World!</h1>\n</body>\n</html>\n\`\`\`\n\nSave as \`index.html\` and open in browser! 🚀`;
      if (msg.match(/sql/)) return `SQL Hello World! 🗄️\n\n\`\`\`sql\nSELECT 'Hello, World!';\n\`\`\`\n\nOr create a table:\n\`\`\`sql\nCREATE TABLE students (\n    id INT PRIMARY KEY,\n    name VARCHAR(100)\n);\nINSERT INTO students VALUES (1, 'Hello World');\nSELECT * FROM students;\n\`\`\``;
      return `Sure! Which language? ☕🐍🌐\n\n• **Java** — Enterprise apps\n• **Python** — AI, Data Science\n• **JavaScript** — Web Development\n• **C/C++** — Systems programming\n• **HTML/CSS** — Web pages\n• **SQL** — Databases\n\nJust tell me the language and what you want to build! 💻`;
    }
    case 'code_generic': return pick([
      `Sure! Which language? 🤔\n\n☕ Java | 🐍 Python | 🌐 JavaScript | 💾 C++ | 🌐 HTML | 🗄️ SQL\n\nTell me:\n1. Which language?\n2. What to build?\n\nI'll write the code! 💻`,
      `Let's code! 🚀\n\nTell me:\n1. **Language** — Java, Python, JS, C++, etc.\n2. **What** — Hello World, Calculator, Game, etc.\n\nI'll write it for you! 💪`,
    ]);
    case 'skill': {
      const msg = message.toLowerCase();
      if (msg.match(/java/)) return `Java Learning Roadmap! ☕\n\n**Week 1-2: Basics**\n• Variables, Data Types\n• if-else, Loops\n• Arrays, Strings\n\n**Week 3-4: OOP**\n• Classes, Objects\n• Inheritance, Polymorphism\n\n**Month 2: Advanced**\n• Collections (ArrayList, HashMap)\n• Exception Handling\n• File I/O\n\n**Resources:**\n📚 Apna College (YouTube)\n📚 W3Schools\n📚 LeetCode (practice)\n\nRoz 1-2 ghanta = 3 months mein master! 💪`;
      if (msg.match(/python/)) return `Python Learning Roadmap! 🐍\n\n**Week 1: Basics**\n• Variables, Lists, Dicts\n• if-else, Loops, Functions\n\n**Week 2-3: Intermediate**\n• File Handling, OOP\n• Error Handling\n\n**Month 2: Projects**\n• Web Scraping\n• Automation\n• Data Analysis (Pandas)\n\n**Resources:**\n📚 Apna College (YouTube)\n📚 Kaggle Learn\n📚 Automate the Boring Stuff\n\nPython = Data Science + AI + Web Dev! 🚀`;
      if (msg.match(/javascript|js/)) return `JavaScript Learning Roadmap! 🌐\n\n**Week 1-2: Basics**\n• Variables, Functions\n• DOM Manipulation\n\n**Week 3-4: Modern JS**\n• ES6+, Async/Await\n• Fetch API\n\n**Month 2: Framework**\n• React.js (Frontend)\n• Node.js (Backend)\n\n**Resources:**\n📚 JavaScript.info\n📚 FreeCodeCamp\n📚 Traversy Media (YouTube)\n\nJS = Frontend + Backend + Mobile! 🚀`;
      return `Skills that pay! 🧠\n\n**💻 Tech:**\n1. Python — AI/Data Science\n2. JavaScript/React — Web Dev\n3. SQL — Databases\n4. Cloud (AWS) — ₹10-30 LPA\n\n**🤝 Soft:**\n1. English Communication\n2. Problem Solving\n3. Leadership\n\nWhich skill interests you? 🚀`;
    }
    case 'math': {
      const msg = message.toLowerCase();
      if (msg.match(/(\d+)\s*(plus|\+)\s*(\d+)/)) {
        const nums = msg.match(/(\d+)\s*(plus|\+)\s*(\d+)/);
        return `${nums[1]} + ${nums[2]} = **${parseInt(nums[1]) + parseInt(nums[3])}** 🧮`;
      }
      if (msg.match(/(\d+)\s*(minus|-)\s*(\d+)/)) {
        const nums = msg.match(/(\d+)\s*(minus|-)\s*(\d+)/);
        return `${nums[1]} - ${nums[3]} = **${parseInt(nums[1]) - parseInt(nums[3])}** 🧮`;
      }
      if (msg.match(/(\d+)\s*(x|times|\*)\s*(\d+)/)) {
        const nums = msg.match(/(\d+)\s*(x|times|\*)\s*(\d+)/);
        return `${nums[1]} × ${nums[3]} = **${parseInt(nums[1]) * parseInt(nums[3])}** 🧮`;
      }
      if (msg.match(/(\d+)\s*(\/|divided?)\s*(\d+)/)) {
        const nums = msg.match(/(\d+)\s*(\/|divided?)\s*(\d+)/);
        return `${nums[1]} ÷ ${nums[3]} = **${(parseInt(nums[1]) / parseInt(nums[3])).toFixed(2)}** 🧮`;
      }
      return `Math help! 🧮\n\nI can solve:\n• Addition: "5 + 3"\n• Subtraction: "10 - 4"\n• Multiplication: "6 x 7"\n• Division: "20 / 4"\n\nOr ask me any math concept — algebra, geometry, calculus, trigonometry!\n\nWhat do you want to solve? 📐`;
    }
    case 'science': {
      const msg = message.toLowerCase();
      if (msg.match(/gravity|gravitational/)) return `**Gravity** 🍎\n\nGravity is the force that attracts objects toward each other.\n\n**Key Facts:**\n• Earth's gravity = 9.8 m/s²\n• Discovered by Isaac Newton (1687)\n• Formula: F = G(m₁m₂)/r²\n• Moon's gravity = 1.62 m/s² (6x less than Earth)\n\n**Why we don't fly off:**\nGravity keeps us grounded. Without it, we'd float into space!\n\nWant to know more about physics? 🚀`;
      if (msg.match(/atom|atomic/)) return `**Atoms** ⚛️\n\nEverything is made of atoms!\n\n**Structure:**\n• **Nucleus** — Protons (+) + Neutrons (0)\n• **Electrons** (-) — Orbit around nucleus\n\n**Size:**\n• Atom = 0.1 nanometer\n• If atom = stadium, nucleus = marble in center\n\n**Fun Facts:**\n• 1 drop of water = 1.67 × 10²¹ atoms\n• You are 99.9999% empty space!\n\nWant to learn more about chemistry? 🧪`;
      return `Science is amazing! 🔬\n\n**I can help with:**\n• **Physics** — Gravity, Force, Energy, Motion\n• **Chemistry** — Atoms, Elements, Reactions\n• **Biology** — Cells, DNA, Human Body\n• **Space** — Planets, Stars, Universe\n\nAsk me anything! Like:\n• "What is gravity?"\n• "How do atoms work?"\n• "Explain photosynthesis"\n\nWhat interests you? 🌟`;
    }
    case 'greeting': return pick([
      (n) => `Hey${n ? ' ' + n : ''}! 👋 Kaise ho?\n\nMain hoon MeraRaasta AI — tera personal assistant!\n\nMujhse kuchh bhi pooch sakte ho:\n🎯 Career & Education\n💻 Coding & Technology\n📚 General Knowledge\n🧮 Math & Science\n🗣️ Language Translation\n😄 Fun & Jokes\n\nBas puchho! 😊`,
    ])(name);
    case 'name': return `I'm **MeraRaasta AI**! 🤖\n\nI'm like Google Gemini — I can answer ANY question on ANY topic!\n\nTry asking me:\n• "Write Java code for calculator"\n• "What is gravity?"\n• "5 + 3 = ?"\n• "How to prepare for JEE?"\n• "Tell me a joke"\n\nI respond in Hindi, English, or Hinglish! 😊`;
    case 'myname': {
      const n = message.replace(/.*(?:my name is|mera naam)\s*/i, '').trim();
      return n ? `Hey ${n}! 🎉 Nice to meet you!\n\nI'm MeraRaasta AI — ask me anything! 💪` : `Tell me your name! 😊`;
    }
    case 'howareyou': return pick([
      `I'm great! 😄 Thanks for asking!\n\nI'm always ready to help you.\n\nTu bata — kya chal raha hai? Kuchh poochna hai? 🤔`,
      `Awesome! 🎉 Main bilkul fit hoon!\n\nTu bata — kya haal hai? 🚀`,
    ]);
    case 'career': return pick([
      `Career options in India (2025-26): 🎯\n\n**🔥 Tech (₹8-30 LPA):**\n1. AI/ML Engineer\n2. Full Stack Developer\n3. Data Scientist\n4. Cloud Architect\n\n**💼 Stable:**\n1. Doctor (MBBS)\n2. IAS/IPS (UPSC)\n3. Bank PO\n4. CA\n\n${interests.length ? `Your interests: ${interests.join(', ')} — explore these!` : 'Which field interests you?'}`,
    ]);
    case 'resume': return `Resume Formula! 📄\n\n1. **Header** — Name | Phone | Email | LinkedIn\n2. **Objective** — 2 lines\n3. **Education** — Degree, College, CGPA\n4. **Skills** — Technical + Tools\n5. **Projects** — With numbers!\n\n✅ "Increased efficiency by 30%"\n❌ "Hard working" (everyone writes this)\n\nFreshers = 1 page. Want me to review yours? ✍️`;
    case 'interview': return `Interview Guide! 🎤\n\n**Before:**\n✅ Research company\n✅ "Tell me about yourself" (2 min story)\n✅ STAR method examples\n\n**During:**\n✅ Smile, eye contact\n✅ Be honest\n✅ Ask questions back\n\n**After:**\n✅ Thank you email\n\nConfidence is key! 💪`;
    case 'study': return `Study Smart! 📖\n\n**Pomodoro:**\n1. 25 min study → 5 min break\n2. Repeat 4 times → 20 min break\n\n**Memory Tips:**\n🧠 Spaced Repetition\n📝 Active Recall\n👨‍🏫 Teach someone\n\n**Free Resources:**\n📚 NPTEL (IIT courses)\n📚 Khan Academy\n📚 YouTube\n\nWhat are you studying? 📚`;
    case 'college': return `Top Colleges in India! 🎓\n\n**Engineering:**\nIITs > NITs > BITS > VIT\n\n**Medical:**\nAIIMS > JIPMER > State Colleges\n\n**Commerce:**\nSRCC > St. Xavier's > Christ\n\nWhich exam are you targeting? 🤔`;
    case 'govtjob': return `Govt Jobs Guide! 🏛️\n\n**Top Exams:**\n1. UPSC — IAS/IPS (₹56K+ starting)\n2. SSC CGL — Group B (₹44K+)\n3. IBPS PO — Bank Officer (₹36K+)\n4. RRB — Railway\n\nWhich exam? 🎯`;
    case 'salary': return `Salary Guide! 💰\n\n**Tech:**\n💻 Developer: ₹4-12 LPA\n🤖 AI Engineer: ₹8-25 LPA\n📊 Data Scientist: ₹6-18 LPA\n\n**Govt:**\n🏛️ Bank PO: ₹36K/month\n🏛️ IAS: ₹56K/month\n\nSkills = Salary! 🚀`;
    case 'motivation': return pick([
      `Hey! 🫂\n\nYe normal hai. Har successful insaan ne struggle kiya hai.\n\n**Aaj se:**\n1. Chhota goal set karo\n2. 1 ghanta productive karo\n3. Kal repeat karo\n\nTu kar sakta hai! 💪 Kya problem hai?`,
      `Ruk! 🛑\n\n• Steve Jobs — College chhoda → Apple\n• SRK — Garib the → King of Bollywood\n• APJ Kalam — Garib the → President\n\nTu young hai, tools hai, internet hai — SAB hai!\n\nChhota start kar! 🚀`,
    ]);
    case 'thanks': return `You're welcome! 😊\n\nAur kuchh poochna ho toh bata! 🚀`;
    case 'age': return `I'm an AI — no age! 😄\n\nAlways young, always ready to help! 🤖✨`;
    case 'joke': return pick([
      `😂 Why do programmers prefer dark mode?\n\nBecause light attracts bugs! 🐛😄`,
      `😂 Student: "Sir, can I ask a question?"\nTeacher: "Yes."\nStudent: "Can I go to washroom?"\nTeacher: "No."\nStudent: "Then I have TWO questions!"`,
      `😂 Why did the student eat his homework?\n\nBecause the teacher said it was a piece of cake! 🍰😄`,
    ]);
    case 'datetime': return `I'm an AI — time doesn't apply to me! 😄\n\nI'm online 24/7. What do you need help with? 💪`;
    case 'health': return `Health Tips! 💪\n\n🏃 30 min daily walk\n🥗 Eat fruits & vegetables\n😴 Sleep 7-8 hours\n💧 Drink 3-4 litres water\n🧘 10 min meditation\n\nHealth = Wealth! 🏃‍♂️`;
    case 'love': return `Love! ❤️\n\n**Rule:** Career first, love follows! 🎯\n\nWhen you're stable, everything falls into place.\n\nFocus on your goals right now! 💪`;
    case 'scholarship': return `Scholarships! 🎓\n\n**Top Ones:**\n1. INSPIRE — ₹80K/year\n2. NMMS — ₹12K/year\n3. AICTE — ₹50K/year\n\nApply at: scholarship.gov.in\n\nEligible ho? Bata class/category! 📋`;
    case 'frustrated': return `Sorry! 😅\n\nBata clearly — main sahi answer deta hoon!\n\nMain kuchh bhi kar sakta hoon:\n💻 Code likh sakta hoon\n📚 Padha sakta hoon\n🎯 Career guide kar sakta hoon\n🧮 Math solve kar sakta hoon\n😄 Jokes suna sakta hoon\n\nBas ek line mein likh! 💪`;
    default: return pick([
      `Interesting! 🤔\n\nMain kuchh bhi kar sakta hoon:\n\n💻 **Code** — "Write Java code for calculator"\n📚 **Study** — "Explain photosynthesis"\n🧮 **Math** — "Solve 5 + 3"\n🎯 **Career** — "What after 12th PCM?"\n🗣️ **Language** — "Translate to Hindi"\n😄 **Fun** — "Tell me a joke"\n\nAsk me anything! 😊`,
      `Hey! 🙋\n\nI can help with ANYTHING!\n\nJust ask clearly:\n• "Write Python code for game"\n• "What is DNA?"\n• "How to crack JEE?"\n• "Tell me about black holes"\n\nI'm like Google Gemini — ask anything! 🚀`,
    ]);
  }
}

function getHindiResponse(topic, name, interests, level, message) {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  switch (topic) {
    case 'code': {
      const msg = message.toLowerCase();
      if (msg.match(/java/)) return `Java Hello World! ☕\n\n\`\`\`java\npublic class HelloWorld {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n\`\`\`\n\n**Kaise kaam karta hai:**\n1. Class banao\n2. Main method mein \`println\` se print karo\n\n**Chalane ke liye:**\n1. Save \`HelloWorld.java\`\n2. \`javac HelloWorld.java\` (compile)\n3. \`java HelloWorld\` (run)\n\nAur code chahiye? Bas pucho! 🚀`;
      if (msg.match(/python/)) return `Python Hello World! 🐍\n\n\`\`\`python\nprint("Hello, World!")\n\`\`\`\n\nBas ek line! Python sabse easy hai.\n\n**Chalane ke liye:**\n1. Save \`hello.py\`\n2. \`python hello.py\`\n\nAur code chahiye? Pucho! 💪`;
      if (msg.match(/javascript|js/)) return `JavaScript Hello World! 🌐\n\n\`\`\`javascript\nconsole.log("Hello, World!");\n\`\`\`\n\nBrowser console ya Node.js mein chalao!\n\nAur code chahiye? 🚀`;
      return `Sure! Kaun si language? ☕🐍🌐\n\nBas batao — main code likh ke dunga! 💻`;
    }
    case 'code_generic': return `Kaun si language mein code chahiye? 🤔\n\n☕ Java | 🐍 Python | 🌐 JavaScript | 💾 C++ | 🌐 HTML\n\nBas batao kya banana hai! 💻`;
    case 'skill': {
      const msg = message.toLowerCase();
      if (msg.match(/java/)) return `Java Roadmap! ☕\n\n**Week 1-2:** Variables, Loops, Arrays\n**Week 3-4:** OOP (Classes, Objects)\n**Month 2:** Collections, Exception Handling\n\n📚 Apna College (YouTube) se seekho!\n\nRoz 1-2 ghanta = 3 months mein master! 💪`;
      if (msg.match(/python/)) return `Python Roadmap! 🐍\n\n**Week 1:** Variables, Lists, Dicts\n**Week 2-3:** OOP, File Handling\n**Month 2:** Projects (Scraping, Automation)\n\n📚 Apna College se seekho!\n\nPython = Data Science + AI! 🚀`;
      if (msg.match(/javascript|js/)) return `JavaScript Roadmap! 🌐\n\n**Week 1-2:** Basics, DOM\n**Week 3-4:** ES6+, Async\n**Month 2:** React.js / Node.js\n\n📚 JavaScript.info se seekho!\n\nJS = Web + Mobile! 🚀`;
      return `Skills seekho! 🧠\n\n💻 Python — AI/Data Science\n🌐 JavaScript — Web Dev\n📊 SQL — Databases\n☁️ Cloud — ₹10-30 LPA\n\nKya seekhna hai? 🚀`;
    }
    case 'math': {
      const msg = message.toLowerCase();
      if (msg.match(/(\d+)\s*(plus|\+)\s*(\d+)/)) {
        const nums = msg.match(/(\d+)\s*(plus|\+)\s*(\d+)/);
        return `${nums[1]} + ${nums[3]} = **${parseInt(nums[1]) + parseInt(nums[3])}** 🧮`;
      }
      if (msg.match(/(\d+)\s*(minus|-)\s*(\d+)/)) {
        const nums = msg.match(/(\d+)\s*(minus|-)\s*(\d+)/);
        return `${nums[1]} - ${nums[3]} = **${parseInt(nums[1]) - parseInt(nums[3])}** 🧮`;
      }
      if (msg.match(/(\d+)\s*(x|times|\*)\s*(\d+)/)) {
        const nums = msg.match(/(\d+)\s*(x|times|\*)\s*(\d+)/);
        return `${nums[1]} × ${nums[3]} = **${parseInt(nums[1]) * parseInt(nums[3])}** 🧮`;
      }
      return `Math help! 🧮\n\nMain solve kar sakta hoon:\n• "5 + 3"\n• "10 - 4"\n• "6 x 7"\n\nYa koi bhi math concept pucho! 📐`;
    }
    case 'science': return `Science! 🔬\n\n**Physics** — Gravity, Force, Energy\n**Chemistry** — Atoms, Elements\n**Biology** — Cells, DNA\n\nKuchh specific pucho! 🌟`;
    case 'greeting': return pick([
      (n) => `Hey${n ? ' ' + n : ''}! 👋 Kaise ho?\n\nMain MeraRaasta AI hoon — kuchh bhi pucho!\n\n🎯 Career | 💻 Code | 📚 Padhai | 🧮 Math | 😄 Fun\n\nPucho kya jaanna hai! 😊`,
    ])(name);
    case 'name': return `Mera naam **MeraRaasta AI** hai! 🤖\n\nMain kuchh bhi kar sakta hoon — code, math, science, career, jokes — kuchh bhi pucho! 😊`;
    case 'frustrated': return `Sorry! 😅\n\nBatao kya chahiye — main kar ke dunga!\n\n💻 Code | 📚 Padhai | 🧮 Math | 🎯 Career | 😄 Fun\n\nBas ek line mein pucho! 💪`;
    default: return pick([
      `Main kuchh bhi kar sakta hoon! 🤔\n\n💻 **Code** — "Java ka code de"\n📚 **Study** — "Photosynthesis samjhao"\n🧮 **Math** — "5 + 3 kitna hoga"\n🎯 **Career** — "12th ke baad kya karun"\n😄 **Fun** — "Joke sunao"\n\nBas pucho! 😊`,
      `Hey! 🙋\n\nKuchh bhi pucho — main jawab dunga!\n\nMain Google Gemini jaisa hoon — har sawal ka jawab! 🚀`,
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
    } catch (e) { /* skip */ }

    if (!conversationHistory.has(userId)) {
      conversationHistory.set(userId, []);
    }
    const history = conversationHistory.get(userId);

    const userLang = detectLanguage(message);

    let response = null;
    let isAI = false;

    if (genAI) {
      response = await getGeminiResponse(message, history, profile);
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
      data: { response, language: userLang, isAI, timestamp: new Date().toISOString() }
    });
  } catch (error) {
    console.error('AI Chat error:', error.message);
    try {
      const fallback = getSmartFallback(message || 'hello', null, 'en');
      res.status(200).json({
        success: true,
        data: { response: fallback, language: 'en', isAI: false, timestamp: new Date().toISOString() }
      });
    } catch { next(error); }
  }
};

export const clearHistory = async (req, res, next) => {
  try {
    conversationHistory.delete(req.user._id.toString());
    res.status(200).json({ success: true, message: 'Chat history cleared' });
  } catch (error) { next(error); }
};