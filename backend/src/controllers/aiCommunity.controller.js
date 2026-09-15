import StudentProfile from '../models/StudentProfile.js';
import Career from '../models/Career.js';

const hindiResponses = {
  greeting: 'नमस्ते! 🙏 मैं आपका AI करियर कोच हूँ। मैं करियर, कौशल, शिक्षा और आपके भविष्य के बारे में आपकी मदद कर सकता हूँ। आप क्या जानना चाहेंगे?',
  career: 'करियर के बारे में बात करते हैं! 🎯\n\nभारत में इन क्षेत्रों में बहुत अच्छे अवसर हैं:\n\n1. **तकनीक (Technology)** - Software Developer, Data Scientist, AI Engineer\n2. **डेटा विज्ञान (Data Science)** - Data Analyst, ML Engineer\n3. **डिज़ाइन (Design)** - UI/UX Designer, Graphic Designer\n4. **व्यापार (Business)** - Product Manager, Marketing\n5. **स्वास्थ्य (Healthcare)** - Doctor, Nurse, Pharmacist\n\nआपकी रुचि किस क्षेत्र में है?',
  skill: 'कौशल विकास के लिए ये सुझाव: 📚\n\n1. **तकनीकी कौशल** - Python, JavaScript, Excel, SQL\n2. **संचार कौशल** - English speaking, Presentation\n3. **नेतृत्व कौशल** - Team management, Decision making\n4. **समस्या समाधान** - Critical thinking, Problem solving\n\nहर दिन 30 मिनट practice करें, 3 महीने में फर्क दिखेगा! 💪',
  resume: 'Resume बनाने के टिप्स: 📄\n\n1. **संक्षिप्त रखें** - 1-2 पेज का ही रखें\n2. **Keywords डालें** - Job description के अनुसार\n3. **Achievements लिखें** - Numbers के साथ (जैसे "increased sales by 20%")\n4. **Skills section** - Technical + Soft skills दोनों\n5. **Proofread** - Spelling और grammar चेक करें\n\nLinkedIn पर भी professional profile बनाएं!',
  interview: 'Interview की तैयारी: 🎤\n\n1. **Company Research** - Company के बारे में जानें\n2. **Common Questions** - "Tell me about yourself", "Why this role?"\n3. **STAR Method** - Situation, Task, Action, Result\n4. **Practice** - Mirror पर या दोस्तों के साथ practice करें\n5. **Dress Code** - Professional कपड़े पहनें\n\nयाद रखें - Confidence सबसे ज़रूरी है! 😊',
  study: 'पढ़ाई के लिए सुझाव: 📖\n\n1. **Time Table** - Daily schedule बनाएं\n2. **Pomodoro Technique** - 25 min पढ़ो, 5 min आराम\n3. **Notes बनाएं** - Handwritten notes ज़्यादा याद रहते हैं\n4. **Previous Papers** - Practice करें\n5. **Group Study** - दोस्तों के साथ पढ़ें\n\nNPTEL, Coursera, Khan Academy पर free courses हैं!',
  default: 'बहुत अच्छा सवाल! 🤔\n\nमैं इन विषयों पर मदद कर सकता हूँ:\n\n🎯 **करियर मार्गदर्शन** - सही करियर चुनें\n📚 **शिक्षा** - कोर्स, कॉलेज, छात्रवृत्ति\n💼 **नौकरी की तैयारी** - Resume, Interview\n🧠 **कौशल** - Technical और Soft skills\n🗺️ **रोडमैप** - Step-by-step करियर प्लान\n\nकृपया अपना सवाल और स्पष्ट रूप से पूछें!',
};

const englishResponses = {
  greeting: 'Hello! 🙏 I\'m your AI Career Coach. I can help you with careers, skills, education, and your future. What would you like to know?',
  career: 'Let\'s talk about careers! 🎯\n\nHere are the top career paths in India:\n\n1. **Technology** - Software Developer, Data Scientist, AI Engineer\n2. **Data Science** - Data Analyst, ML Engineer\n3. **Design** - UI/UX Designer, Graphic Designer\n4. **Business** - Product Manager, Marketing\n5. **Healthcare** - Doctor, Nurse, Pharmacist\n\nWhich field interests you the most?',
  skill: 'Here are top skill development tips: 📚\n\n1. **Technical Skills** - Python, JavaScript, Excel, SQL\n2. **Communication** - English speaking, Presentation\n3. **Leadership** - Team management, Decision making\n4. **Problem Solving** - Critical thinking\n\nPractice 30 minutes daily - you\'ll see results in 3 months! 💪',
  resume: 'Resume building tips: 📄\n\n1. **Keep it concise** - 1-2 pages only\n2. **Add Keywords** - Match job description\n3. **Achievements** - Use numbers ("increased sales by 20%")\n4. **Skills Section** - Technical + Soft skills\n5. **Proofread** - Check spelling & grammar\n\nAlso create a professional LinkedIn profile!',
  interview: 'Interview preparation tips: 🎤\n\n1. **Company Research** - Learn about the company\n2. **Common Questions** - "Tell me about yourself", "Why this role?"\n3. **STAR Method** - Situation, Task, Action, Result\n4. **Practice** - Mirror or with friends\n5. **Dress Code** - Wear professional attire\n\nRemember - Confidence is key! 😊',
  study: 'Study tips: 📖\n\n1. **Time Table** - Create daily schedule\n2. **Pomodoro Technique** - 25 min study, 5 min break\n3. **Make Notes** - Handwritten notes are better\n4. **Previous Papers** - Practice regularly\n5. **Group Study** - Study with friends\n\nCheck out NPTEL, Coursera, Khan Academy for free courses!',
  default: 'Great question! 🤔\n\nI can help with:\n\n🎯 **Career Guidance** - Find the right career\n📚 **Education** - Courses, colleges, scholarships\n💼 **Job Prep** - Resume, Interview tips\n🧠 **Skills** - Technical & Soft skills\n🗺️ **Roadmap** - Step-by-step career plan\n\nPlease ask your question more specifically!',
};

function detectLanguage(text) {
  const hindiChars = text.match(/[\u0900-\u097F]/g);
  return (hindiChars && hindiChars.length > text.length * 0.2) ? 'hi' : 'en';
}

function getResponse(message, lang) {
  const lower = message.toLowerCase();
  const responses = lang === 'hi' ? hindiResponses : englishResponses;

  if (lower.match(/hi|hello|hey|namaste|नमस्ते|नमस्त|hey|sup|क्या हाल/)) return responses.greeting;
  if (lower.match(/career|करियर|job|नौकरी|profession|क्षेत्र|field|क्या करूँ|what should i become/)) return responses.career;
  if (lower.match(/skill|कौशल|learn|सीख|course|कोर्स|coding|programming|पढ़ाई/)) return responses.skill;
  if (lower.match(/resume|cv|बायोडाटा|portfolio/)) return responses.resume;
  if (lower.match(/interview|इंटरव्यू|placement|नौकरी मिले|job interview/)) return responses.interview;
  if (lower.match(/study|पढ़|exam|परीक्षा|test|quiz|पढ़ाई कैसे करूँ/)) return responses.study;
  return responses.default;
}

export const chat = async (req, res, next) => {
  try {
    const { message, type } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const profile = await StudentProfile.findOne({ user: req.user._id });
    const interests = profile?.interests?.join(', ') || '';
    const level = profile?.educationLevel || '';

    const userLang = detectLanguage(message);
    let response = getResponse(message, userLang);

    if (interests) {
      response += userLang === 'hi'
        ? `\n\nआपकी रुचियां (${interests}) के अनुसार, मैं और विशिष्ट सुझाव भी दे सकता हूँ।`
        : `\n\nBased on your interests (${interests}), I can provide more specific suggestions too.`;
    }

    res.status(200).json({ success: true, data: { response, language: userLang } });
  } catch (error) { next(error); }
};
