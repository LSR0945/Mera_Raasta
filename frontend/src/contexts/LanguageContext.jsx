import { createContext, useContext, useState, useCallback } from 'react';

const LanguageContext = createContext(null);

const translations = {
  en: {
    // Nav
    dashboard: 'Dashboard', careers: 'Careers', recommendations: 'Recommendations', education: 'Education',
    roadmap: 'Roadmap', careerReadiness: 'Career Readiness', resumeInterview: 'Resume & Interview',
    aiCoach: 'AI Career Coach', profile: 'Profile', logout: 'Logout', search: 'Search careers...',
    myChildren: 'My Children', progressReports: 'Progress Reports', myStudents: 'My Students',
    reviews: 'Reviews', settings: 'Settings', language: 'Language',

    // Dashboard
    welcomeBack: 'Welcome back', exploreCareers: 'Explore Careers', viewRoadmap: 'View Roadmap',
    takeAssessment: 'Take Assessment', totalStudents: 'Total Students', activeLearners: 'Active Learners',
    avgProgress: 'Avg Progress', needsHelp: 'Needs Help', assigned: 'Assigned', inProgress: 'In progress',
    overall: 'Overall', below: 'Below 25%', excellent: 'Excellent (>75%)', growing: 'Growing (25-75%)',
    needsHelpLabel: 'Needs Help (<25%)', noStudentsYet: 'No students yet',
    studentsAppearHere: 'Students will appear here once they are assigned to you.', viewStudents: 'View Students',
    myStudentsTitle: 'My Students', guideAndMonitor: 'Guide and monitor their progress',
    viewAll: 'View All', quickActions: 'Quick Actions', mentorTip: 'Mentor Tip',
    scheduleCheckins: 'Schedule weekly check-ins with your students. Consistent guidance helps them stay on track.',
    messages: 'Messages', analytics: 'Analytics', createContent: 'Create Content', setGoals: 'Set Goals',
    reviewAssignments: 'Review Assignments', gradeAndFeedback: 'Grade & feedback',
    chatWithStudents: 'Chat with students', deepInsights: 'Deep insights', lessonsAndMaterials: 'Lessons & materials',
    studentTargets: 'Student targets',

    // Stats
    myChildrenLabel: 'My Children', activeSessions: 'Active Sessions', completed: 'Completed',
    reviewsGiven: 'Reviews Given', pending: 'Pending',

    // Career
    careersList: 'Career List', findYourPath: 'Find Your Perfect Career Path',
    compareCareers: 'Compare Careers', topPicks: 'Top Picks for You',
    viewDetails: 'View Details', salary: 'Salary', demand: 'Demand', difficulty: 'Difficulty',
    high: 'High', medium: 'Medium', low: 'Low', entryLevel: 'Entry Level', midLevel: 'Mid Level', senior: 'Senior',

    // Education
    educationHub: 'Education Hub', coursesAndResources: 'Courses & Resources',
    onlineCourses: 'Online Courses', colleges: 'Colleges', scholarships: 'Scholarships',
    governmentSchemes: 'Government Schemes', viewCourse: 'View Course', enrolled: 'Enrolled',

    // Profile
    myProfile: 'My Profile', personalInfo: 'Personal Info', education: 'Education',
    interests: 'Interests', skills: 'Skills', careerGoals: 'Career Goals',
    saveChanges: 'Save Changes', editProfile: 'Edit Profile',

    // Roadmap
    myRoadmap: 'My Roadmap', yourLearningPath: 'Your Learning Path',
    milestone: 'Milestone', complete: 'Complete', inProgress: 'In Progress', upcoming: 'Upcoming',
    daysLeft: 'days left', noRoadmap: 'No Roadmap Yet', getRecommendation: 'Get AI Recommendation',

    // Career Readiness
    careerReadiness: 'Career Readiness', interviews: 'Interviews', quizzes: 'Quizzes',
    practiceQuestions: 'Practice Questions', startQuiz: 'Start Quiz', viewTips: 'View Tips',

    // Resume & Interview
    resumeBuilder: 'Resume Builder', interviewPrep: 'Interview Preparation',
    buildResume: 'Build Your Resume', practiceInterview: 'Practice Interview',
    tips: 'Tips', questions: 'Questions', score: 'Score',

    // AI Coach
    askAnything: 'Ask about careers, skills, education...',
    thinking: 'Thinking...',
    quickQuestions: 'Quick Questions',
    q1: 'What should I learn next?',
    q2: 'Which career suits my profile?',
    q3: 'How can I improve my resume?',
    q4: 'What skills are in demand?',
    q5: 'How to prepare for interviews?',
    aiResponseDefault: 'I can help with career guidance, skills, education, and more!',
    serviceUnavailable: 'Service unavailable. Please try again later.',
    chatHistory: 'Chat History',
    newChat: 'New Chat',
    typeMessage: 'Type your message...',
    send: 'Send',

    // Parent
    trackProgress: 'Track your child\'s progress', childrenOverview: 'Children Overview',
    childProgress: 'Child Progress', viewDetail: 'View Detail',

    // Common
    loading: 'Loading...', error: 'Error', retry: 'Retry', save: 'Save', cancel: 'Cancel',
    delete: 'Delete', edit: 'Edit', back: 'Back', next: 'Next', submit: 'Submit',
    yes: 'Yes', no: 'No', confirm: 'Confirm', close: 'Close',
    success: 'Success', failed: 'Failed', noData: 'No data available',

    // Onboarding
    welcomeToMeraRaasta: 'Welcome to Mera Raasta',
    completeProfile: 'Complete your profile to get personalized recommendations',
    step: 'Step', of: 'of', skip: 'Skip', continueBtn: 'Continue', finish: 'Finish',
  },

  hi: {
    // Nav
    dashboard: 'डैशबोर्ड', careers: 'करियर', recommendations: 'सुझाव', education: 'शिक्षा',
    roadmap: 'रोडमैप', careerReadiness: 'करियर तैयारी', resumeInterview: 'Resume और Interview',
    aiCoach: 'AI करियर कोच', profile: 'प्रोफ़ाइल', logout: 'लॉगआउट', search: 'करियर खोजें...',
    myChildren: 'मेरे बच्चे', progressReports: 'प्रगति रिपोर्ट', myStudents: 'मेरे छात्र',
    reviews: 'समीक्षा', settings: 'सेटिंग्स', language: 'भाषा',

    // Dashboard
    welcomeBack: 'वापसी पर स्वागत है', exploreCareers: 'करियर एक्सप्लोर करें', viewRoadmap: 'रोडमैप देखें',
    takeAssessment: 'असेसमेंट दें', totalStudents: 'कुल छात्र', activeLearners: 'सक्रिय शिक्षार्थी',
    avgProgress: 'औसत प्रगति', needsHelp: 'मदद चाहिए', assigned: 'नियुक्त', inProgress: 'प्रगति में',
    overall: 'कुल', below: '25% से कम', excellent: 'उत्कृष्ट (>75%)', growing: 'बढ़ रहा (25-75%)',
    needsHelpLabel: 'मदद चाहिए (<25%)', noStudentsYet: 'अभी कोई छात्र नहीं',
    studentsAppearHere: 'छात्र यहाँ दिखाई देंगे जब उन्हें आपको सौंपा जाएगा।', viewStudents: 'छात्र देखें',
    myStudentsTitle: 'मेरे छात्र', guideAndMonitor: 'उनकी प्रगति का मार्गदर्शन करें',
    viewAll: 'सभी देखें', quickActions: 'त्वरित कार्य', mentorTip: 'मेंटर सुझाव',
    scheduleCheckins: 'अपने छात्रों के साथ साप्ताहिक जांच निर्धारित करें।',
    messages: 'संदेश', analytics: 'विश्लेषण', createContent: 'सामग्री बनाएं', setGoals: 'लक्ष्य निर्धारित करें',
    reviewAssignments: 'असाइनमेंट की समीक्षा', gradeAndFeedback: 'ग्रेड और फीडबैक',
    chatWithStudents: 'छात्रों से चैट करें', deepInsights: 'गहन अंतर्दृष्टि', lessonsAndMaterials: 'पाठ और सामग्री',
    studentTargets: 'छात्र लक्ष्य',

    // Stats
    myChildrenLabel: 'मेरे बच्चे', activeSessions: 'सक्रिय सत्र', completed: 'पूर्ण',
    reviewsGiven: 'दी गई समीक्षाएं', pending: 'लंबित',

    // Career
    careersList: 'करियर सूची', findYourPath: 'अपना सही करियर पथ खोजें',
    compareCareers: 'करियर की तुलना करें', topPicks: 'आपके लिए शीर्ष चयन',
    viewDetails: 'विवरण देखें', salary: 'वेतन', demand: 'मांग', difficulty: 'कठिनाई',
    high: 'उच्च', medium: 'मध्यम', low: 'कम', entryLevel: 'प्रवेश स्तर', midLevel: 'मध्य स्तर', senior: 'वरिष्ठ',

    // Education
    educationHub: 'शिक्षा केंद्र', coursesAndResources: 'पाठ्यक्रम और संसाधन',
    onlineCourses: 'ऑनलाइन पाठ्यक्रम', colleges: 'कॉलेज', scholarships: 'छात्रवृत्ति',
    governmentSchemes: 'सरकारी योजनाएं', viewCourse: 'पाठ्यक्रम देखें', enrolled: 'दाखिल',

    // Profile
    myProfile: 'मेरी प्रोफ़ाइल', personalInfo: 'व्यक्तिगत जानकारी',
    interests: 'रुचियां', skills: 'कौशल', careerGoals: 'करियर लक्ष्य',
    saveChanges: 'परिवर्तन सहेजें', editProfile: 'प्रोफ़ाइल संपादित करें',

    // Roadmap
    myRoadmap: 'मेरा रोडमैप', yourLearningPath: 'आपका सीखने का पथ',
    milestone: 'माइलस्टोन', complete: 'पूर्ण', upcoming: 'आने वाला',
    daysLeft: 'दिन शेष', noRoadmap: 'अभी कोई रोडमैप नहीं', getRecommendation: 'AI सुझाव प्राप्त करें',

    // Career Readiness
    careerReadiness: 'करियर तैयारी', interviews: 'Interview', quizzes: 'Quiz',
    practiceQuestions: 'अभ्यास प्रश्न', startQuiz: 'Quiz शुरू करें', viewTips: 'सुझाव देखें',

    // Resume & Interview
    resumeBuilder: 'Resume बिल्डर', interviewPrep: 'Interview की तैयारी',
    buildResume: 'अपना Resume बनाएं', practiceInterview: 'Interview का अभ्यास करें',
    tips: 'सुझाव', questions: 'प्रश्न', score: 'स्कोर',

    // AI Coach
    askAnything: 'करियर, कौशल, शिक्षा के बारे में पूछें...',
    thinking: 'सोच रहा हूँ...',
    quickQuestions: 'त्वरित प्रश्न',
    q1: 'मुझे अगला क्या सीखना चाहिए?',
    q2: 'कौन सा करियर मेरी प्रोफ़ाइल के लिए सही है?',
    q3: 'मैं अपना Resume कैसे सुधार सकता हूँ?',
    q4: 'कौन से कौशल की मांग है?',
    q5: 'Interview की तैयारी कैसे करें?',
    aiResponseDefault: 'मैं करियर मार्गदर्शन, कौशल, शिक्षा और बहुत कुछ में मदद कर सकता हूँ!',
    serviceUnavailable: 'सेवा उपलब्ध नहीं है। कृपया बाद में पुनः प्रयास करें।',
    chatHistory: 'चैट इतिहास',
    newChat: 'नई चैट',
    typeMessage: 'अपना संदेश टाइप करें...',
    send: 'भेजें',

    // Parent
    trackProgress: 'अपने बच्चे की प्रगति ट्रैक करें', childrenOverview: 'बच्चों का अवलोकन',
    childProgress: 'बच्चे की प्रगति', viewDetail: 'विवरण देखें',

    // Common
    loading: 'लोड हो रहा है...', error: 'त्रुटि', retry: 'पुनः प्रयास करें', save: 'सहेजें', cancel: 'रद्द करें',
    delete: 'हटाएं', edit: 'संपादित करें', back: 'वापस', next: 'अगला', submit: 'जमा करें',
    yes: 'हाँ', no: 'नहीं', confirm: 'पुष्टि करें', close: 'बंद करें',
    success: 'सफल', failed: 'असफल', noData: 'कोई डेटा उपलब्ध नहीं',

    // Onboarding
    welcomeToMeraRaasta: 'मेरा रास्ता में आपका स्वागत है',
    completeProfile: 'व्यक्तिगत सुझाव प्राप्त करने के लिए अपनी प्रोफ़ाइल पूरी करें',
    step: 'चरण', of: 'का', skip: 'छोड़ें', continueBtn: 'जारी रखें', finish: 'समाप्त',
  },
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('meraRaastaLang') || 'en');

  const toggleLanguage = useCallback(() => {
    setLang(prev => {
      const next = prev === 'en' ? 'hi' : 'en';
      localStorage.setItem('meraRaastaLang', next);
      return next;
    });
  }, []);

  const setLanguage = useCallback((l) => {
    setLang(l);
    localStorage.setItem('meraRaastaLang', l);
  }, []);

  const t = useCallback((key) => {
    return translations[lang]?.[key] || translations.en[key] || key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, language: lang, toggleLanguage, setLanguage, t, isHindi: lang === 'hi', isEnglish: lang === 'en' }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
